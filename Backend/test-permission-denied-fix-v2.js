#!/usr/bin/env node

/**
 * Test script para verificar la corrección del error "permission denied for table User"
 * Este script realiza pruebas exhaustivas del flujo de autenticación y creación de perfiles
 */

const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');

// Configuración de colores para output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  log(`\n${'='.repeat(60)}`, 'cyan');
  log(`${title}`, 'bright');
  log(`${'='.repeat(60)}`, 'cyan');
}

function logTest(testName, status, details = '') {
  const statusColor = status === 'PASS' ? 'green' : status === 'FAIL' ? 'red' : 'yellow';
  log(`[${status}] ${testName}`, statusColor);
  if (details) {
    log(`      ${details}`, 'reset');
  }
}

async function testPermissionDeniedFix() {
  logSection('PRUEBAS DE CORRECCIÓN - PERMISSION DENIED ERROR');
  
  let testResults = {
    total: 0,
    passed: 0,
    failed: 0,
    warnings: 0
  };

  // Test 1: Verificar variables de entorno
  logSection('1. VERIFICACIÓN DE CONFIGURACIÓN');
  testResults.total++;
  
  const requiredEnvVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY'
  ];
  
  let envVarsOk = true;
  for (const envVar of requiredEnvVars) {
    if (process.env[envVar]) {
      logTest(`Variable ${envVar}`, 'PASS', 'Configurada correctamente');
    } else {
      logTest(`Variable ${envVar}`, 'FAIL', 'No encontrada');
      envVarsOk = false;
    }
  }
  
  if (envVarsOk) {
    testResults.passed++;
    logTest('Configuración de variables de entorno', 'PASS');
  } else {
    testResults.failed++;
    logTest('Configuración de variables de entorno', 'FAIL', 'Faltan variables requeridas');
  }

  // Test 2: Verificar conectividad con Supabase
  logSection('2. CONECTIVIDAD CON SUPABASE');
  testResults.total++;
  
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
    
    const { data, error } = await supabase.from('User').select('count').limit(1);
    
    if (error) {
      if (error.message.includes('permission denied')) {
        logTest('Conectividad Supabase', 'WARN', 'Conectado pero con problemas de permisos RLS');
        testResults.warnings++;
      } else {
        logTest('Conectividad Supabase', 'FAIL', `Error: ${error.message}`);
        testResults.failed++;
      }
    } else {
      logTest('Conectividad Supabase', 'PASS', 'Conexión exitosa');
      testResults.passed++;
    }
  } catch (error) {
    logTest('Conectividad Supabase', 'FAIL', `Error de conexión: ${error.message}`);
    testResults.failed++;
  }

  // Test 3: Verificar cliente de servicio
  logSection('3. CLIENTE DE SERVICIO (SERVICE ROLE)');
  testResults.total++;
  
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const serviceSupabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          }
        }
      );
      
      const { data, error } = await serviceSupabase.from('User').select('count').limit(1);
      
      if (error) {
        logTest('Cliente de servicio', 'FAIL', `Error: ${error.message}`);
        testResults.failed++;
      } else {
        logTest('Cliente de servicio', 'PASS', 'Service role funciona correctamente');
        testResults.passed++;
      }
    } catch (error) {
      logTest('Cliente de servicio', 'FAIL', `Error: ${error.message}`);
      testResults.failed++;
    }
  } else {
    logTest('Cliente de servicio', 'WARN', 'SUPABASE_SERVICE_ROLE_KEY no configurada');
    testResults.warnings++;
  }

  // Test 4: Verificar API endpoint de perfil
  logSection('4. API ENDPOINT DE PERFIL');
  testResults.total++;
  
  try {
    const response = await fetch('http://localhost:3000/api/users/profile', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (response.status === 401) {
      logTest('API Endpoint', 'PASS', 'Responde correctamente (401 sin autenticación)');
      testResults.passed++;
    } else if (response.status === 500) {
      const errorData = await response.json().catch(() => ({}));
      if (errorData.error && errorData.error.includes('permission denied')) {
        logTest('API Endpoint', 'FAIL', 'Error de permisos detectado en API');
        testResults.failed++;
      } else {
        logTest('API Endpoint', 'WARN', `Error 500: ${errorData.error || 'Error desconocido'}`);
        testResults.warnings++;
      }
    } else {
      logTest('API Endpoint', 'PASS', `Respuesta: ${response.status}`);
      testResults.passed++;
    }
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      logTest('API Endpoint', 'WARN', 'Servidor no está ejecutándose en localhost:3000');
      testResults.warnings++;
    } else {
      logTest('API Endpoint', 'FAIL', `Error de conexión: ${error.message}`);
      testResults.failed++;
    }
  }

  // Test 5: Verificar estructura de tabla User
  logSection('5. ESTRUCTURA DE TABLA USER');
  testResults.total++;
  
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
    
    // Intentar obtener información de la tabla
    const { data, error } = await supabase
      .from('User')
      .select('id, name, email')
      .limit(1);
    
    if (error) {
      if (error.message.includes('relation "User" does not exist')) {
        logTest('Estructura tabla User', 'FAIL', 'Tabla User no existe');
        testResults.failed++;
      } else if (error.message.includes('permission denied')) {
        logTest('Estructura tabla User', 'WARN', 'Tabla existe pero hay problemas de permisos');
        testResults.warnings++;
      } else {
        logTest('Estructura tabla User', 'FAIL', `Error: ${error.message}`);
        testResults.failed++;
      }
    } else {
      logTest('Estructura tabla User', 'PASS', 'Tabla User accesible');
      testResults.passed++;
    }
  } catch (error) {
    logTest('Estructura tabla User', 'FAIL', `Error: ${error.message}`);
    testResults.failed++;
  }

  // Test 6: Verificar archivos de corrección
  logSection('6. ARCHIVOS DE CORRECCIÓN');
  testResults.total++;
  
  const fs = require('fs');
  const path = require('path');
  
  const requiredFiles = [
    'src/app/api/users/profile/route.ts',
    'src/hooks/useAuth.ts',
    'src/lib/profile-persistence.ts',
    'fix-user-table-rls-policies-v2.sql'
  ];
  
  let filesOk = true;
  for (const file of requiredFiles) {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
      logTest(`Archivo ${file}`, 'PASS', 'Existe');
    } else {
      logTest(`Archivo ${file}`, 'FAIL', 'No encontrado');
      filesOk = false;
    }
  }
  
  if (filesOk) {
    testResults.passed++;
    logTest('Archivos de corrección', 'PASS', 'Todos los archivos presentes');
  } else {
    testResults.failed++;
    logTest('Archivos de corrección', 'FAIL', 'Faltan archivos requeridos');
  }

  // Resumen final
  logSection('RESUMEN DE PRUEBAS');
  log(`Total de pruebas: ${testResults.total}`, 'bright');
  log(`Exitosas: ${testResults.passed}`, 'green');
  log(`Fallidas: ${testResults.failed}`, 'red');
  log(`Advertencias: ${testResults.warnings}`, 'yellow');
  
  const successRate = ((testResults.passed / testResults.total) * 100).toFixed(1);
  log(`Tasa de éxito: ${successRate}%`, successRate > 80 ? 'green' : successRate > 60 ? 'yellow' : 'red');

  // Recomendaciones
  logSection('RECOMENDACIONES');
  
  if (testResults.failed > 0) {
    log('❌ Se detectaron errores críticos:', 'red');
    log('   1. Verificar variables de entorno en .env.local', 'yellow');
    log('   2. Aplicar políticas RLS con: fix-user-table-rls-policies-v2.sql', 'yellow');
    log('   3. Reiniciar el servidor de desarrollo', 'yellow');
  } else if (testResults.warnings > 0) {
    log('⚠️  Se detectaron advertencias:', 'yellow');
    log('   1. Considerar aplicar políticas RLS para mejorar permisos', 'yellow');
    log('   2. Verificar configuración de service role', 'yellow');
  } else {
    log('✅ Todas las pruebas pasaron exitosamente!', 'green');
    log('   El error "permission denied for table User" debería estar resuelto.', 'green');
  }

  logSection('PRÓXIMOS PASOS');
  log('1. Si hay errores, aplicar las correcciones sugeridas', 'cyan');
  log('2. Ejecutar: npm run dev (para iniciar el servidor)', 'cyan');
  log('3. Probar el flujo de registro/login en la aplicación', 'cyan');
  log('4. Monitorear logs de consola para errores de permisos', 'cyan');
  
  return testResults;
}

// Ejecutar pruebas si el script se ejecuta directamente
if (require.main === module) {
  testPermissionDeniedFix()
    .then((results) => {
      process.exit(results.failed > 0 ? 1 : 0);
    })
    .catch((error) => {
      log(`Error ejecutando pruebas: ${error.message}`, 'red');
      process.exit(1);
    });
}

module.exports = { testPermissionDeniedFix };
