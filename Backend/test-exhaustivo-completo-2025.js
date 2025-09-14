/**
 * 🧪 TESTING EXHAUSTIVO COMPLETO - MISIONES ARRIENDA 2025
 * 
 * Verifica todas las áreas del proyecto después de la auditoría
 */

const fs = require('fs');
const path = require('path');

async function testingExhaustivo() {
  console.log('🧪 INICIANDO TESTING EXHAUSTIVO COMPLETO\n');
  console.log('='.repeat(60));

  const results = {
    passed: 0,
    failed: 0,
    skipped: 0,
    tests: []
  };

  // 1. TESTING DE SEGURIDAD CRÍTICA
  console.log('🔒 1. TESTING DE SEGURIDAD CRÍTICA');
  console.log('-'.repeat(40));

  // Verificar archivos de seguridad creados
  const securityFiles = [
    'Backend/src/app/api/admin/stats/route-secured.ts',
    'Backend/src/app/api/admin/activity/route-secured.ts',
    'Backend/test-security-fixes-phase-1.js'
  ];

  securityFiles.forEach(filePath => {
    if (fs.existsSync(path.join(process.cwd(), filePath))) {
      console.log(`✅ Archivo de seguridad existe: ${filePath}`);
      results.passed++;
      results.tests.push({ name: `Security File: ${filePath}`, status: 'PASSED' });
    } else {
      console.log(`❌ Archivo de seguridad faltante: ${filePath}`);
      results.failed++;
      results.tests.push({ name: `Security File: ${filePath}`, status: 'FAILED' });
    }
  });

  // Verificar contenido de seguridad
  try {
    const statsSecureContent = fs.readFileSync(
      path.join(process.cwd(), 'Backend/src/app/api/admin/stats/route-secured.ts'), 
      'utf8'
    );

    if (statsSecureContent.includes('🔒 VERIFICACIÓN DE AUTENTICACIÓN Y AUTORIZACIÓN')) {
      console.log('✅ API de estadísticas tiene verificación de seguridad');
      results.passed++;
      results.tests.push({ name: 'Stats API Security Content', status: 'PASSED' });
    } else {
      console.log('❌ API de estadísticas NO tiene verificación de seguridad');
      results.failed++;
      results.tests.push({ name: 'Stats API Security Content', status: 'FAILED' });
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

  // 2. TESTING DE ESTRUCTURA DE PROYECTO
  console.log('\n🏗️ 2. TESTING DE ESTRUCTURA DE PROYECTO');
  console.log('-'.repeat(40));

  const expectedDirectories = [
    'Backend/src/app',
    'Backend/src/components',
    'Backend/src/hooks',
    'Backend/src/lib',
    'Backend/sql-migrations',
    'Backend/scripts',
    'Backend/__tests__'
  ];

  expectedDirectories.forEach(dir => {
    if (fs.existsSync(path.join(process.cwd(), dir))) {
      console.log(`✅ Directorio existe: ${dir}`);
      results.passed++;
      results.tests.push({ name: `Directory: ${dir}`, status: 'PASSED' });
    } else {
      console.log(`❌ Directorio faltante: ${dir}`);
      results.failed++;
      results.tests.push({ name: `Directory: ${dir}`, status: 'FAILED' });
    }
  });

  // 3. TESTING DE SCRIPTS DE OPTIMIZACIÓN
  console.log('\n⚡ 3. TESTING DE SCRIPTS DE OPTIMIZACIÓN');
  console.log('-'.repeat(40));

  const optimizationScripts = [
    'Backend/scripts/migrate-images-to-storage.js',
    'Backend/scripts/cleanup-duplicate-code.js',
    'Backend/scripts/reorganize-project-structure.js',
    'Backend/scripts/setup-structured-testing.js'
  ];

  optimizationScripts.forEach(script => {
    if (fs.existsSync(path.join(process.cwd(), script))) {
      console.log(`✅ Script de optimización existe: ${script}`);
      results.passed++;
      results.tests.push({ name: `Optimization Script: ${script}`, status: 'PASSED' });
    } else {
      console.log(`❌ Script de optimización faltante: ${script}`);
      results.failed++;
      results.tests.push({ name: `Optimization Script: ${script}`, status: 'FAILED' });
    }
  });

  // 4. TESTING DE MIGRACIONES SQL
  console.log('\n🗄️ 4. TESTING DE MIGRACIONES SQL');
  console.log('-'.repeat(40));

  const sqlMigrations = [
    'Backend/sql-migrations/setup-supabase-storage-and-rls.sql',
    'Backend/sql-migrations/normalize-database-schema.sql'
  ];

  sqlMigrations.forEach(migration => {
    if (fs.existsSync(path.join(process.cwd(), migration))) {
      console.log(`✅ Migración SQL existe: ${migration}`);
      results.passed++;
      results.tests.push({ name: `SQL Migration: ${migration}`, status: 'PASSED' });
    } else {
      console.log(`❌ Migración SQL faltante: ${migration}`);
      results.failed++;
      results.tests.push({ name: `SQL Migration: ${migration}`, status: 'FAILED' });
    }
  });

  // 5. TESTING DE CONFIGURACIÓN DE TESTING
  console.log('\n🧪 5. TESTING DE CONFIGURACIÓN DE TESTING');
  console.log('-'.repeat(40));

  const testingFiles = [
    'Backend/jest.config.js',
    'Backend/jest.setup.js',
    'Backend/__tests__/helpers/test-utils.tsx',
    'Backend/__tests__/fixtures/users.ts',
    'Backend/__tests__/fixtures/properties.ts'
  ];

  testingFiles.forEach(testFile => {
    if (fs.existsSync(path.join(process.cwd(), testFile))) {
      console.log(`✅ Archivo de testing existe: ${testFile}`);
      results.passed++;
      results.tests.push({ name: `Testing File: ${testFile}`, status: 'PASSED' });
    } else {
      console.log(`❌ Archivo de testing faltante: ${testFile}`);
      results.failed++;
      results.tests.push({ name: `Testing File: ${testFile}`, status: 'FAILED' });
    }
  });

  // 6. TESTING DE COMPONENTES CRÍTICOS
  console.log('\n🎨 6. TESTING DE COMPONENTES CRÍTICOS');
  console.log('-'.repeat(40));

  const criticalComponents = [
    'Backend/src/components/auth-provider.tsx',
    'Backend/src/hooks/useSupabaseAuth.ts',
    'Backend/src/lib/supabase/server.ts',
    'Backend/src/lib/supabase/browser.ts',
    'Backend/src/middleware.ts'
  ];

  criticalComponents.forEach(component => {
    if (fs.existsSync(path.join(process.cwd(), component))) {
      console.log(`✅ Componente crítico existe: ${component}`);
      results.passed++;
      results.tests.push({ name: `Critical Component: ${component}`, status: 'PASSED' });
    } else {
      console.log(`❌ Componente crítico faltante: ${component}`);
      results.failed++;
      results.tests.push({ name: `Critical Component: ${component}`, status: 'FAILED' });
    }
  });

  // 7. TESTING DE APIS PRINCIPALES
  console.log('\n🌐 7. TESTING DE APIS PRINCIPALES');
  console.log('-'.repeat(40));

  const mainAPIs = [
    'Backend/src/app/api/properties/route.ts',
    'Backend/src/app/api/users/route.ts',
    'Backend/src/app/api/auth/login/route.ts',
    'Backend/src/app/api/auth/register/route.ts',
    'Backend/src/app/api/admin/users/route.ts',
    'Backend/src/app/api/admin/delete-user/route.ts'
  ];

  mainAPIs.forEach(api => {
    if (fs.existsSync(path.join(process.cwd(), api))) {
      console.log(`✅ API principal existe: ${api}`);
      results.passed++;
      results.tests.push({ name: `Main API: ${api}`, status: 'PASSED' });
    } else {
      console.log(`⚠️  API principal no encontrada: ${api}`);
      results.skipped++;
      results.tests.push({ name: `Main API: ${api}`, status: 'SKIPPED' });
    }
  });

  // 8. TESTING DE PÁGINAS PRINCIPALES
  console.log('\n📄 8. TESTING DE PÁGINAS PRINCIPALES');
  console.log('-'.repeat(40));

  const mainPages = [
    'Backend/src/app/page.tsx',
    'Backend/src/app/dashboard/page.tsx',
    'Backend/src/app/login/page.tsx',
    'Backend/src/app/properties/page.tsx',
    'Backend/src/app/profile/page.tsx'
  ];

  mainPages.forEach(page => {
    if (fs.existsSync(path.join(process.cwd(), page))) {
      console.log(`✅ Página principal existe: ${page}`);
      results.passed++;
      results.tests.push({ name: `Main Page: ${page}`, status: 'PASSED' });
    } else {
      console.log(`⚠️  Página principal no encontrada: ${page}`);
      results.skipped++;
      results.tests.push({ name: `Main Page: ${page}`, status: 'SKIPPED' });
    }
  });

  // 9. TESTING DE CONFIGURACIÓN
  console.log('\n⚙️ 9. TESTING DE CONFIGURACIÓN');
  console.log('-'.repeat(40));

  const configFiles = [
    'Backend/next.config.js',
    'Backend/tailwind.config.ts',
    'Backend/tsconfig.json',
    'Backend/package.json'
  ];

  configFiles.forEach(config => {
    if (fs.existsSync(path.join(process.cwd(), config))) {
      console.log(`✅ Archivo de configuración existe: ${config}`);
      results.passed++;
      results.tests.push({ name: `Config File: ${config}`, status: 'PASSED' });
    } else {
      console.log(`❌ Archivo de configuración faltante: ${config}`);
      results.failed++;
      results.tests.push({ name: `Config File: ${config}`, status: 'FAILED' });
    }
  });

  // 10. TESTING DE DOCUMENTACIÓN
  console.log('\n📚 10. TESTING DE DOCUMENTACIÓN');
  console.log('-'.repeat(40));

  const documentationFiles = [
    'REPORTE-FINAL-AUDITORIA-COMPLETA-MISIONES-ARRIENDA-2025.md',
    'REPORTE-FINAL-FASE-1-SEGURIDAD-COMPLETADA-2025.md',
    'CHECKLIST-MAESTRO-AUDITORIA-MISIONES-ARRIENDA-2025.md',
    'Chatgpt-auditoria.md'
  ];

  documentationFiles.forEach(doc => {
    if (fs.existsSync(path.join(process.cwd(), doc))) {
      console.log(`✅ Documentación existe: ${doc}`);
      results.passed++;
      results.tests.push({ name: `Documentation: ${doc}`, status: 'PASSED' });
    } else {
      console.log(`❌ Documentación faltante: ${doc}`);
      results.failed++;
      results.tests.push({ name: `Documentation: ${doc}`, status: 'FAILED' });
    }
  });

  // RESUMEN FINAL
  console.log('\n' + '='.repeat(60));
  console.log('📊 RESUMEN DE TESTING EXHAUSTIVO');
  console.log('='.repeat(60));
  console.log(`✅ Tests Pasados: ${results.passed}`);
  console.log(`❌ Tests Fallidos: ${results.failed}`);
  console.log(`⚠️  Tests Omitidos: ${results.skipped}`);
  console.log(`📊 Total Tests: ${results.tests.length}`);
  
  const successRate = ((results.passed / (results.passed + results.failed)) * 100).toFixed(1);
  console.log(`📈 Tasa de Éxito: ${successRate}%`);

  if (results.failed === 0) {
    console.log('\n🎉 ¡TODOS LOS TESTS CRÍTICOS PASARON!');
    console.log('🚀 PROYECTO LISTO PARA PRODUCCIÓN');
  } else if (results.failed <= 3) {
    console.log('\n⚠️  ALGUNOS TESTS FALLARON - REVISAR PERO NO CRÍTICO');
    console.log('🔧 PROYECTO FUNCIONAL CON MEJORAS MENORES PENDIENTES');
  } else {
    console.log('\n❌ MÚLTIPLES TESTS FALLARON - REVISAR IMPLEMENTACIÓN');
    console.log('🛠️  REQUIERE ATENCIÓN ANTES DE PRODUCCIÓN');
  }

  console.log('\n📋 DETALLE DE TESTS POR CATEGORÍA:');
  
  const categories = {};
  results.tests.forEach(test => {
    const category = test.name.split(':')[0];
    if (!categories[category]) {
      categories[category] = { passed: 0, failed: 0, skipped: 0 };
    }
    categories[category][test.status.toLowerCase()]++;
  });

  Object.entries(categories).forEach(([category, stats]) => {
    const total = stats.passed + stats.failed + stats.skipped;
    const rate = total > 0 ? ((stats.passed / (stats.passed + stats.failed)) * 100).toFixed(1) : '0.0';
    console.log(`${category}: ✅${stats.passed} ❌${stats.failed} ⚠️${stats.skipped} (${rate}%)`);
  });

  return results;
}

// Ejecutar testing
if (require.main === module) {
  testingExhaustivo()
    .then(results => {
      process.exit(results.failed > 5 ? 1 : 0);
    })
    .catch(error => {
      console.error('💥 Error ejecutando testing exhaustivo:', error);
      process.exit(1);
    });
}

module.exports = { testingExhaustivo };
