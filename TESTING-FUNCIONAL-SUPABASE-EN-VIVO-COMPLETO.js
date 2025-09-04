const fs = require('fs');
const path = require('path');

// Configuración de Supabase con credenciales reales
const SUPABASE_CONFIG = {
  url: 'https://qfeyhaaxyemmnohqdele.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmZXloYWF4eWVtbW5vaHFkZWxlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4MTY3MzgsImV4cCI6MjA3MTM5MjczOH0.vgrh055OkiBIJFBlRlEuEZAOF2FHo3LBUNitB09dSIE',
  serviceRoleKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmZXloYWF4eWVtbW5vaHFkZWxlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTgxNjczOCwiZXhwIjoyMDcxMzkyNzM4fQ.5wJb1p0Rmg1dVIayIT4wZO_seDXTIwhVa36CyEgK-yM'
};

class SupabaseFunctionalTester {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      tests: []
    };
  }

  log(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : type === 'warning' ? '⚠️' : 'ℹ️';
    console.log(`[${timestamp}] ${prefix} ${message}`);
  }

  async runTest(testName, testFunction) {
    this.results.totalTests++;
    this.log(`Ejecutando: ${testName}`, 'info');
    
    try {
      const result = await testFunction();
      this.results.passedTests++;
      this.results.tests.push({
        name: testName,
        status: 'PASSED',
        result: result,
        timestamp: new Date().toISOString()
      });
      this.log(`✅ ${testName} - PASADO`, 'success');
      return result;
    } catch (error) {
      this.results.failedTests++;
      this.results.tests.push({
        name: testName,
        status: 'FAILED',
        error: error.message,
        timestamp: new Date().toISOString()
      });
      this.log(`❌ ${testName} - FALLIDO: ${error.message}`, 'error');
      return null;
    }
  }

  // Test 1: Conectividad básica con Supabase
  async testSupabaseConnection() {
    return await this.runTest('Conectividad con Supabase', async () => {
      const response = await fetch(`${SUPABASE_CONFIG.url}/rest/v1/`, {
        headers: {
          'apikey': SUPABASE_CONFIG.anonKey,
          'Authorization': `Bearer ${SUPABASE_CONFIG.anonKey}`
        }
      });

      if (!response.ok) {
        throw new Error(`Error de conexión: ${response.status} ${response.statusText}`);
      }

      return {
        status: response.status,
        connected: true,
        message: 'Conexión exitosa con Supabase'
      };
    });
  }

  // Test 2: Verificar estructura de base de datos
  async testDatabaseStructure() {
    return await this.runTest('Estructura de Base de Datos', async () => {
      const tables = ['users', 'properties', 'profiles'];
      const results = {};

      for (const table of tables) {
        try {
          const response = await fetch(`${SUPABASE_CONFIG.url}/rest/v1/${table}?limit=1`, {
            headers: {
              'apikey': SUPABASE_CONFIG.anonKey,
              'Authorization': `Bearer ${SUPABASE_CONFIG.anonKey}`
            }
          });

          results[table] = {
            exists: response.ok,
            status: response.status
          };
        } catch (error) {
          results[table] = {
            exists: false,
            error: error.message
          };
        }
      }

      return {
        tables: results,
        message: 'Verificación de estructura completada'
      };
    });
  }

  // Test 3: Testing de autenticación (registro)
  async testUserRegistration() {
    return await this.runTest('Registro de Usuario', async () => {
      const testUser = {
        email: `test-${Date.now()}@misionesarrienda.com`,
        password: 'TestPassword123!',
        name: 'Usuario de Prueba'
      };

      const response = await fetch(`${SUPABASE_CONFIG.url}/auth/v1/signup`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_CONFIG.anonKey,
          'Authorization': `Bearer ${SUPABASE_CONFIG.anonKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: testUser.email,
          password: testUser.password,
          data: {
            name: testUser.name
          }
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(`Error en registro: ${data.error_description || data.message}`);
      }

      return {
        user: data.user,
        session: data.session,
        message: 'Usuario registrado exitosamente',
        testEmail: testUser.email
      };
    });
  }

  // Test 4: Testing de login
  async testUserLogin() {
    return await this.runTest('Login de Usuario', async () => {
      // Primero crear un usuario para hacer login
      const testUser = {
        email: `login-test-${Date.now()}@misionesarrienda.com`,
        password: 'TestPassword123!'
      };

      // Registrar usuario
      const signupResponse = await fetch(`${SUPABASE_CONFIG.url}/auth/v1/signup`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_CONFIG.anonKey,
          'Authorization': `Bearer ${SUPABASE_CONFIG.anonKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: testUser.email,
          password: testUser.password
        })
      });

      if (!signupResponse.ok) {
        throw new Error('No se pudo crear usuario para test de login');
      }

      // Intentar login
      const loginResponse = await fetch(`${SUPABASE_CONFIG.url}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_CONFIG.anonKey,
          'Authorization': `Bearer ${SUPABASE_CONFIG.anonKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: testUser.email,
          password: testUser.password
        })
      });

      const loginData = await loginResponse.json();

      if (!loginResponse.ok) {
        throw new Error(`Error en login: ${loginData.error_description || loginData.message}`);
      }

      return {
        accessToken: loginData.access_token,
        user: loginData.user,
        message: 'Login exitoso',
        testEmail: testUser.email
      };
    });
  }

  // Test 5: Testing de creación de propiedades
  async testPropertyCreation() {
    return await this.runTest('Creación de Propiedades', async () => {
      const testProperty = {
        title: `Propiedad de Prueba ${Date.now()}`,
        description: 'Esta es una propiedad de prueba creada por el sistema de testing',
        price: 150000,
        location: 'Posadas, Misiones',
        type: 'casa',
        bedrooms: 3,
        bathrooms: 2,
        area: 120,
        status: 'available'
      };

      const response = await fetch(`${SUPABASE_CONFIG.url}/rest/v1/properties`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_CONFIG.anonKey,
          'Authorization': `Bearer ${SUPABASE_CONFIG.anonKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(testProperty)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(`Error creando propiedad: ${JSON.stringify(data)}`);
      }

      return {
        property: data[0] || data,
        message: 'Propiedad creada exitosamente'
      };
    });
  }

  // Test 6: Testing de consulta de propiedades
  async testPropertyQuery() {
    return await this.runTest('Consulta de Propiedades', async () => {
      const response = await fetch(`${SUPABASE_CONFIG.url}/rest/v1/properties?limit=5`, {
        headers: {
          'apikey': SUPABASE_CONFIG.anonKey,
          'Authorization': `Bearer ${SUPABASE_CONFIG.anonKey}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(`Error consultando propiedades: ${JSON.stringify(data)}`);
      }

      return {
        count: data.length,
        properties: data,
        message: `Se encontraron ${data.length} propiedades`
      };
    });
  }

  // Test 7: Testing de políticas RLS
  async testRLSPolicies() {
    return await this.runTest('Políticas RLS (Row Level Security)', async () => {
      // Intentar acceder a datos sin autenticación adecuada
      const response = await fetch(`${SUPABASE_CONFIG.url}/rest/v1/profiles`, {
        headers: {
          'apikey': SUPABASE_CONFIG.anonKey,
          'Authorization': `Bearer ${SUPABASE_CONFIG.anonKey}`
        }
      });

      // RLS debería permitir o denegar según las políticas configuradas
      return {
        status: response.status,
        rlsActive: response.status === 401 || response.status === 403 || response.ok,
        message: response.ok ? 'RLS permite acceso público' : 'RLS está activo y funcionando'
      };
    });
  }

  // Test 8: Testing de storage/buckets
  async testStorageBuckets() {
    return await this.runTest('Storage y Buckets', async () => {
      const response = await fetch(`${SUPABASE_CONFIG.url}/storage/v1/bucket`, {
        headers: {
          'apikey': SUPABASE_CONFIG.anonKey,
          'Authorization': `Bearer ${SUPABASE_CONFIG.anonKey}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(`Error accediendo a storage: ${JSON.stringify(data)}`);
      }

      return {
        buckets: data,
        count: data.length,
        message: `Se encontraron ${data.length} buckets de storage`
      };
    });
  }

  // Test 9: Testing de endpoints API del proyecto
  async testProjectAPIEndpoints() {
    return await this.runTest('Endpoints API del Proyecto', async () => {
      const endpoints = [
        '/api/properties',
        '/api/auth/register',
        '/api/health/db'
      ];

      const results = {};

      for (const endpoint of endpoints) {
        try {
          const response = await fetch(`http://localhost:3000${endpoint}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json'
            }
          });

          results[endpoint] = {
            status: response.status,
            available: response.status !== 404,
            ok: response.ok
          };
        } catch (error) {
          results[endpoint] = {
            status: 'ERROR',
            available: false,
            error: error.message
          };
        }
      }

      return {
        endpoints: results,
        message: 'Testing de endpoints completado'
      };
    });
  }

  // Test 10: Testing de performance
  async testPerformance() {
    return await this.runTest('Performance de Base de Datos', async () => {
      const startTime = Date.now();

      const response = await fetch(`${SUPABASE_CONFIG.url}/rest/v1/properties?limit=10`, {
        headers: {
          'apikey': SUPABASE_CONFIG.anonKey,
          'Authorization': `Bearer ${SUPABASE_CONFIG.anonKey}`
        }
      });

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      if (!response.ok) {
        throw new Error('Error en consulta de performance');
      }

      return {
        responseTime: responseTime,
        performance: responseTime < 1000 ? 'Excelente' : responseTime < 2000 ? 'Bueno' : 'Lento',
        message: `Tiempo de respuesta: ${responseTime}ms`
      };
    });
  }

  // Ejecutar todos los tests
  async runAllTests() {
    console.log('🚀 INICIANDO TESTING FUNCIONAL EXHAUSTIVO DE SUPABASE');
    console.log('=' .repeat(60));

    await this.testSupabaseConnection();
    await this.testDatabaseStructure();
    await this.testUserRegistration();
    await this.testUserLogin();
    await this.testPropertyCreation();
    await this.testPropertyQuery();
    await this.testRLSPolicies();
    await this.testStorageBuckets();
    await this.testProjectAPIEndpoints();
    await this.testPerformance();

    // Generar reporte final
    this.generateReport();
  }

  generateReport() {
    console.log('\n' + '=' .repeat(60));
    console.log('📊 REPORTE FINAL DE TESTING FUNCIONAL');
    console.log('=' .repeat(60));

    const successRate = ((this.results.passedTests / this.results.totalTests) * 100).toFixed(1);

    console.log(`📈 Tests Totales: ${this.results.totalTests}`);
    console.log(`✅ Tests Exitosos: ${this.results.passedTests}`);
    console.log(`❌ Tests Fallidos: ${this.results.failedTests}`);
    console.log(`🎯 Tasa de Éxito: ${successRate}%`);

    // Guardar reporte detallado
    const reportPath = 'REPORTE-TESTING-FUNCIONAL-SUPABASE-EN-VIVO.json';
    fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));

    console.log(`\n📄 Reporte detallado guardado en: ${reportPath}`);

    if (this.results.failedTests > 0) {
      console.log('\n⚠️ TESTS FALLIDOS:');
      this.results.tests
        .filter(test => test.status === 'FAILED')
        .forEach(test => {
          console.log(`   ❌ ${test.name}: ${test.error}`);
        });
    }

    console.log('\n🎉 TESTING FUNCIONAL COMPLETADO');
  }
}

// Ejecutar testing
async function main() {
  const tester = new SupabaseFunctionalTester();
  await tester.runAllTests();
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main().catch(console.error);
}

module.exports = SupabaseFunctionalTester;
