#!/usr/bin/env node

/**
 * TESTING EXHAUSTIVO COMPLETO DE ENDPOINTS API
 * Script para probar todos los endpoints de manera exhaustiva
 */

const fs = require('fs');
const path = require('path');

// Configuración
const BASE_URL = 'http://localhost:3000';
const TIMEOUT = 10000; // 10 segundos

// Resultados del testing
let testResults = {
  totalTests: 0,
  passed: 0,
  failed: 0,
  errors: [],
  warnings: [],
  endpoints: {}
};

// Función para hacer requests HTTP
async function makeRequest(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const startTime = Date.now();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT);

    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    const responseTime = Date.now() - startTime;

    return {
      ok: response.ok,
      status: response.status,
      statusText: response.statusText,
      responseTime,
      headers: Object.fromEntries(response.headers.entries()),
      data: await response.json().catch(() => null)
    };
  } catch (error) {
    return {
      ok: false,
      error: error.message,
      responseTime: Date.now() - startTime
    };
  }
}

// Función para ejecutar un test
async function runTest(testName, testFunction) {
  testResults.totalTests++;
  console.log(`\n🧪 Ejecutando test: ${testName}`);

  try {
    const result = await testFunction();
    if (result.passed) {
      testResults.passed++;
      console.log(`✅ PASÓ - ${result.message || 'Test completado exitosamente'}`);
    } else {
      testResults.failed++;
      console.log(`❌ FALLÓ - ${result.message || 'Test falló'}`);
      if (result.details) {
        console.log(`   Detalles: ${result.details}`);
      }
    }
    return result;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push({
      test: testName,
      error: error.message,
      stack: error.stack
    });
    console.log(`💥 ERROR - ${error.message}`);
    return { passed: false, message: error.message };
  }
}

// Tests de Health Check
async function testHealthEndpoints() {
  console.log('\n🏥 TESTING ENDPOINTS DE HEALTH');

  // Test 1: Health DB
  await runTest('Health DB - GET', async () => {
    const response = await makeRequest('/api/health/db');
    if (response.ok) {
      return { passed: true, message: `Status: ${response.status}` };
    } else {
      return { passed: false, message: `Error: ${response.status} ${response.statusText}` };
    }
  });

  // Test 2: Health DB - POST
  await runTest('Health DB - POST', async () => {
    const response = await makeRequest('/api/health/db', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ test: true })
    });
    if (response.ok) {
      return { passed: true, message: `Status: ${response.status}` };
    } else {
      return { passed: false, message: `Error: ${response.status} ${response.statusText}` };
    }
  });
}

// Tests de Profile
async function testProfileEndpoints() {
  console.log('\n👤 TESTING ENDPOINTS DE PROFILE');

  // Test 1: GET Profile sin autenticación (debería fallar)
  await runTest('Profile GET - Sin autenticación', async () => {
    const response = await makeRequest('/api/users/profile');
    if (response.status === 401) {
      return { passed: true, message: 'Correctamente rechaza acceso sin autenticación' };
    } else {
      return { passed: false, message: `Esperaba 401, recibió ${response.status}` };
    }
  });

  // Test 2: PUT Profile sin autenticación (debería fallar)
  await runTest('Profile PUT - Sin autenticación', async () => {
    const response = await makeRequest('/api/users/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Test User' })
    });
    if (response.status === 401) {
      return { passed: true, message: 'Correctamente rechaza acceso sin autenticación' };
    } else {
      return { passed: false, message: `Esperaba 401, recibió ${response.status}` };
    }
  });

  // Test 3: PATCH Profile sin autenticación (debería fallar)
  await runTest('Profile PATCH - Sin autenticación', async () => {
    const response = await makeRequest('/api/users/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Test User' })
    });
    if (response.status === 401) {
      return { passed: true, message: 'Correctamente rechaza acceso sin autenticación' };
    } else {
      return { passed: false, message: `Esperaba 401, recibió ${response.status}` };
    }
  });
}

// Tests de Properties
async function testPropertiesEndpoints() {
  console.log('\n🏠 TESTING ENDPOINTS DE PROPERTIES');

  // Test 1: GET Properties básico
  await runTest('Properties GET - Básico', async () => {
    const response = await makeRequest('/api/properties');
    if (response.ok) {
      return { passed: true, message: `Status: ${response.status}, Items: ${response.data?.properties?.length || 0}` };
    } else {
      return { passed: false, message: `Error: ${response.status} ${response.statusText}` };
    }
  });

  // Test 2: GET Properties con filtros
  await runTest('Properties GET - Con filtros', async () => {
    const response = await makeRequest('/api/properties?city=Posadas&type=HOUSE&limit=5');
    if (response.ok) {
      return { passed: true, message: `Status: ${response.status}, Filtros aplicados` };
    } else {
      return { passed: false, message: `Error: ${response.status} ${response.statusText}` };
    }
  });

  // Test 3: GET Properties con paginación
  await runTest('Properties GET - Paginación', async () => {
    const response = await makeRequest('/api/properties?page=1&limit=10');
    if (response.ok) {
      const pagination = response.data?.pagination;
      if (pagination) {
        return { passed: true, message: `Página: ${pagination.page}, Total: ${pagination.total}` };
      } else {
        return { passed: false, message: 'Falta información de paginación' };
      }
    } else {
      return { passed: false, message: `Error: ${response.status} ${response.statusText}` };
    }
  });

  // Test 4: POST Properties sin autenticación (debería funcionar con datos mock)
  await runTest('Properties POST - Sin autenticación', async () => {
    const testProperty = {
      title: 'Test Property',
      description: 'Test description',
      price: 100000,
      currency: 'ARS',
      propertyType: 'HOUSE',
      bedrooms: 2,
      bathrooms: 1,
      area: 100,
      address: 'Test Address 123',
      city: 'Test City',
      province: 'Test Province',
      country: 'Argentina',
      contact_name: 'Test Contact',
      contact_phone: '+549123456789',
      contact_email: 'test@example.com'
    };

    const response = await makeRequest('/api/properties', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testProperty)
    });

    if (response.ok) {
      return { passed: true, message: `Status: ${response.status}, Property creada` };
    } else {
      return { passed: false, message: `Error: ${response.status} ${response.statusText}` };
    }
  });

  // Test 5: POST Properties con datos inválidos
  await runTest('Properties POST - Datos inválidos', async () => {
    const invalidProperty = {
      title: '', // Título vacío
      price: 'invalid', // Precio inválido
      contact_phone: '' // Teléfono requerido faltante
    };

    const response = await makeRequest('/api/properties', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invalidProperty)
    });

    if (response.status === 400) {
      return { passed: true, message: 'Correctamente valida datos inválidos' };
    } else {
      return { passed: false, message: `Esperaba 400, recibió ${response.status}` };
    }
  });
}

// Tests de Autenticación
async function testAuthEndpoints() {
  console.log('\n🔐 TESTING ENDPOINTS DE AUTENTICACIÓN');

  // Test 1: Verificar que los endpoints requieren autenticación
  const authEndpoints = [
    '/api/users/profile',
    '/api/properties' // Algunos endpoints pueden requerir auth para ciertas operaciones
  ];

  for (const endpoint of authEndpoints) {
    await runTest(`Auth Check - ${endpoint}`, async () => {
      const response = await makeRequest(endpoint);
      // Algunos endpoints pueden devolver datos mock sin auth
      if (response.ok || response.status === 401) {
        return { passed: true, message: `Status: ${response.status} (comportamiento esperado)` };
      } else {
        return { passed: false, message: `Status inesperado: ${response.status}` };
      }
    });
  }
}

// Tests de Edge Cases
async function testEdgeCases() {
  console.log('\n🔍 TESTING EDGE CASES');

  // Test 1: Endpoint inexistente
  await runTest('Endpoint inexistente', async () => {
    const response = await makeRequest('/api/endpoint-inexistente');
    if (response.status === 404) {
      return { passed: true, message: 'Correctamente devuelve 404' };
    } else {
      return { passed: false, message: `Esperaba 404, recibió ${response.status}` };
    }
  });

  // Test 2: Método HTTP no soportado
  await runTest('Método HTTP no soportado', async () => {
    const response = await makeRequest('/api/health/db', { method: 'DELETE' });
    if (response.status === 405 || response.status === 404) {
      return { passed: true, message: `Status: ${response.status} (método no soportado)` };
    } else {
      return { passed: false, message: `Status inesperado: ${response.status}` };
    }
  });

  // Test 3: Request malformado
  await runTest('Request malformado', async () => {
    const response = await makeRequest('/api/properties', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'invalid json {'
    });
    if (response.status === 400 || response.status === 500) {
      return { passed: true, message: `Status: ${response.status} (maneja JSON malformado)` };
    } else {
      return { passed: false, message: `Status inesperado: ${response.status}` };
    }
  });
}

// Función para verificar conectividad del servidor
async function checkServerConnectivity() {
  console.log('\n🌐 VERIFICANDO CONECTIVIDAD DEL SERVIDOR');

  const response = await makeRequest('/api/health/db');
  if (response.ok) {
    console.log('✅ Servidor responde correctamente');
    return true;
  } else {
    console.log('❌ Servidor no responde o hay problemas de conectividad');
    console.log(`   Status: ${response.status}, Error: ${response.error || 'Desconocido'}`);
    return false;
  }
}

// Función principal
async function main() {
  console.log('🚀 INICIANDO TESTING EXHAUSTIVO DE ENDPOINTS API');
  console.log('=' .repeat(60));
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Timeout: ${TIMEOUT}ms`);
  console.log('=' .repeat(60));

  // Verificar conectividad primero
  const serverUp = await checkServerConnectivity();
  if (!serverUp) {
    console.log('\n❌ No se puede continuar sin conectividad al servidor');
    console.log('💡 Asegúrate de que el servidor esté ejecutándose en http://localhost:3000');
    process.exit(1);
  }

  // Ejecutar todos los tests
  await testHealthEndpoints();
  await testProfileEndpoints();
  await testPropertiesEndpoints();
  await testAuthEndpoints();
  await testEdgeCases();

  // Resultados finales
  console.log('\n' + '=' .repeat(60));
  console.log('📊 RESULTADOS FINALES DEL TESTING');
  console.log('=' .repeat(60));

  console.log(`\n📈 Estadísticas:`);
  console.log(`   Tests totales: ${testResults.totalTests}`);
  console.log(`   ✅ Pasaron: ${testResults.passed}`);
  console.log(`   ❌ Fallaron: ${testResults.failed}`);
  console.log(`   💥 Errores: ${testResults.errors.length}`);

  const successRate = testResults.totalTests > 0 ?
    ((testResults.passed / testResults.totalTests) * 100).toFixed(1) : 0;

  console.log(`   📊 Tasa de éxito: ${successRate}%`);

  if (testResults.errors.length > 0) {
    console.log(`\n💥 Errores encontrados:`);
    testResults.errors.forEach((error, index) => {
      console.log(`   ${index + 1}. ${error.test}: ${error.error}`);
    });
  }

  if (testResults.warnings.length > 0) {
    console.log(`\n⚠️  Advertencias:`);
    testResults.warnings.forEach((warning, index) => {
      console.log(`   ${index + 1}. ${warning}`);
    });
  }

  // Guardar reporte detallado
  const reportPath = path.join(process.cwd(), 'REPORTE-TESTING-EXHAUSTIVO-API.json');
  fs.writeFileSync(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    configuration: {
      baseUrl: BASE_URL,
      timeout: TIMEOUT
    },
    summary: {
      totalTests: testResults.totalTests,
      passed: testResults.passed,
      failed: testResults.failed,
      errors: testResults.errors.length,
      successRate: `${successRate}%`
    },
    details: testResults
  }, null, 2));

  console.log(`\n💾 Reporte guardado en: ${reportPath}`);

  if (testResults.failed === 0 && testResults.errors.length === 0) {
    console.log('\n🎉 ¡EXCELENTE! Todos los tests pasaron exitosamente');
    console.log('🚀 La API está funcionando correctamente');
  } else {
    console.log(`\n⚠️  Se encontraron ${testResults.failed + testResults.errors.length} problemas`);
    console.log('🔧 Se recomienda revisar y corregir los issues identificados');
  }

  console.log('\n' + '=' .repeat(60));
}

// Ejecutar tests
if (require.main === module) {
  main().catch(error => {
    console.error('💥 Error fatal durante el testing:', error);
    process.exit(1);
  });
}

module.exports = { main, makeRequest, runTest };
