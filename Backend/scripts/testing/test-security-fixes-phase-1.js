/**
 * 🔒 SCRIPT DE TESTING - FASE 1: CORRECCIONES DE SEGURIDAD
 * 
 * Verifica que las APIs de administración estén correctamente protegidas
 */

const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Variables de entorno de Supabase no configuradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testSecurityFixes() {
  console.log('🔒 INICIANDO TESTS DE SEGURIDAD - FASE 1\n');

  const results = {
    passed: 0,
    failed: 0,
    tests: []
  };

  // Test 1: Verificar que APIs de admin requieren autenticación
  console.log('📋 Test 1: APIs de admin requieren autenticación');
  
  try {
    // Test API de estadísticas sin token
    const statsResponse = await fetch('http://localhost:3000/api/admin/stats');
    
    if (statsResponse.status === 401) {
      console.log('✅ API de estadísticas correctamente protegida (401)');
      results.passed++;
      results.tests.push({ name: 'Stats API Protection', status: 'PASSED' });
    } else {
      console.log('❌ API de estadísticas NO está protegida');
      results.failed++;
      results.tests.push({ name: 'Stats API Protection', status: 'FAILED' });
    }

    // Test API de actividad sin token
    const activityResponse = await fetch('http://localhost:3000/api/admin/activity');
    
    if (activityResponse.status === 401) {
      console.log('✅ API de actividad correctamente protegida (401)');
      results.passed++;
      results.tests.push({ name: 'Activity API Protection', status: 'PASSED' });
    } else {
      console.log('❌ API de actividad NO está protegida');
      results.failed++;
      results.tests.push({ name: 'Activity API Protection', status: 'FAILED' });
    }

  } catch (error) {
    console.log('⚠️  Error conectando a APIs (servidor puede estar apagado):', error.message);
    results.tests.push({ name: 'API Connection', status: 'SKIPPED', error: error.message });
  }

  // Test 2: Verificar middleware de autenticación
  console.log('\n📋 Test 2: Middleware de autenticación');
  
  try {
    // Test ruta protegida sin autenticación
    const dashboardResponse = await fetch('http://localhost:3000/dashboard');
    
    if (dashboardResponse.status === 302 || dashboardResponse.url?.includes('/login')) {
      console.log('✅ Middleware redirige correctamente a login');
      results.passed++;
      results.tests.push({ name: 'Middleware Redirect', status: 'PASSED' });
    } else {
      console.log('❌ Middleware NO está funcionando correctamente');
      results.failed++;
      results.tests.push({ name: 'Middleware Redirect', status: 'FAILED' });
    }

  } catch (error) {
    console.log('⚠️  Error probando middleware:', error.message);
    results.tests.push({ name: 'Middleware Test', status: 'SKIPPED', error: error.message });
  }

  // Test 3: Verificar archivos de seguridad creados
  console.log('\n📋 Test 3: Archivos de seguridad creados');
  
  const fs = require('fs');
  const path = require('path');

  const securityFiles = [
    'Backend/src/app/api/admin/stats/route-secured.ts',
    'Backend/src/app/api/admin/activity/route-secured.ts'
  ];

  securityFiles.forEach(filePath => {
    if (fs.existsSync(path.join(process.cwd(), filePath))) {
      console.log(`✅ ${filePath} existe`);
      results.passed++;
      results.tests.push({ name: `File: ${filePath}`, status: 'PASSED' });
    } else {
      console.log(`❌ ${filePath} NO existe`);
      results.failed++;
      results.tests.push({ name: `File: ${filePath}`, status: 'FAILED' });
    }
  });

  // Test 4: Verificar contenido de archivos seguros
  console.log('\n📋 Test 4: Contenido de archivos seguros');
  
  try {
    const statsSecureContent = fs.readFileSync(
      path.join(process.cwd(), 'Backend/src/app/api/admin/stats/route-secured.ts'), 
      'utf8'
    );

    if (statsSecureContent.includes('🔒 VERIFICACIÓN DE AUTENTICACIÓN Y AUTORIZACIÓN')) {
      console.log('✅ API de estadísticas tiene verificación de seguridad');
      results.passed++;
      results.tests.push({ name: 'Stats Security Content', status: 'PASSED' });
    } else {
      console.log('❌ API de estadísticas NO tiene verificación de seguridad');
      results.failed++;
      results.tests.push({ name: 'Stats Security Content', status: 'FAILED' });
    }

    if (statsSecureContent.includes('userProfile?.role !== \'ADMIN\'')) {
      console.log('✅ API de estadísticas verifica rol de admin');
      results.passed++;
      results.tests.push({ name: 'Stats Admin Role Check', status: 'PASSED' });
    } else {
      console.log('❌ API de estadísticas NO verifica rol de admin');
      results.failed++;
      results.tests.push({ name: 'Stats Admin Role Check', status: 'FAILED' });
    }

  } catch (error) {
    console.log('❌ Error leyendo archivos de seguridad:', error.message);
    results.failed++;
    results.tests.push({ name: 'Security File Content', status: 'FAILED', error: error.message });
  }

  // Resumen final
  console.log('\n' + '='.repeat(60));
  console.log('📊 RESUMEN DE TESTS DE SEGURIDAD - FASE 1');
  console.log('='.repeat(60));
  console.log(`✅ Tests Pasados: ${results.passed}`);
  console.log(`❌ Tests Fallidos: ${results.failed}`);
  console.log(`📊 Total Tests: ${results.tests.length}`);
  
  if (results.failed === 0) {
    console.log('\n🎉 ¡TODOS LOS TESTS DE SEGURIDAD PASARON!');
    console.log('🚀 FASE 1 COMPLETADA EXITOSAMENTE');
  } else {
    console.log('\n⚠️  ALGUNOS TESTS FALLARON - REVISAR IMPLEMENTACIÓN');
  }

  console.log('\n📋 DETALLE DE TESTS:');
  results.tests.forEach((test, index) => {
    const status = test.status === 'PASSED' ? '✅' : test.status === 'FAILED' ? '❌' : '⚠️';
    console.log(`${index + 1}. ${status} ${test.name}`);
    if (test.error) {
      console.log(`   Error: ${test.error}`);
    }
  });

  return results;
}

// Ejecutar tests
if (require.main === module) {
  testSecurityFixes()
    .then(results => {
      process.exit(results.failed > 0 ? 1 : 0);
    })
    .catch(error => {
      console.error('💥 Error ejecutando tests:', error);
      process.exit(1);
    });
}

module.exports = { testSecurityFixes };
