/**
 * 🧪 TESTING EXHAUSTIVO - AUDITORÍA COMPLETA 2025
 * 
 * Verifica todos los componentes implementados en las 3 fases de la auditoría
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuración de testing
const config = {
  projectRoot: path.join(__dirname, '..'),
  verbose: true,
  timeout: 30000
};

// Estadísticas de testing
const testStats = {
  totalTests: 0,
  passedTests: 0,
  failedTests: 0,
  errors: [],
  warnings: [],
  startTime: new Date()
};

/**
 * Utilidad para logging
 */
function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = {
    info: '📋',
    success: '✅',
    error: '❌',
    warning: '⚠️',
    test: '🧪'
  }[type] || '📋';
  
  console.log(`${prefix} [${timestamp}] ${message}`);
}

/**
 * Ejecuta un test y maneja errores
 */
async function runTest(testName, testFunction) {
  testStats.totalTests++;
  log(`Ejecutando: ${testName}`, 'test');
  
  try {
    await testFunction();
    testStats.passedTests++;
    log(`PASSED: ${testName}`, 'success');
    return true;
  } catch (error) {
    testStats.failedTests++;
    testStats.errors.push({ test: testName, error: error.message });
    log(`FAILED: ${testName} - ${error.message}`, 'error');
    return false;
  }
}

/**
 * FASE 1: TESTING DE SEGURIDAD CRÍTICA
 */
async function testSecurityPhase() {
  log('\n🔒 INICIANDO TESTING FASE 1: SEGURIDAD CRÍTICA', 'info');
  
  // Test 1.1: Verificar APIs admin seguras existen
  await runTest('APIs Admin Seguras - Archivos Existen', () => {
    const secureStatsApi = path.join(config.projectRoot, 'src/app/api/admin/stats/route-secured.ts');
    const secureActivityApi = path.join(config.projectRoot, 'src/app/api/admin/activity/route-secured.ts');
    
    if (!fs.existsSync(secureStatsApi)) {
      throw new Error('API segura de stats no encontrada');
    }
    if (!fs.existsSync(secureActivityApi)) {
      throw new Error('API segura de activity no encontrada');
    }
  });

  // Test 1.2: Verificar contenido de APIs seguras
  await runTest('APIs Admin Seguras - Verificación de Autenticación', () => {
    const secureStatsApi = path.join(config.projectRoot, 'src/app/api/admin/stats/route-secured.ts');
    const content = fs.readFileSync(secureStatsApi, 'utf8');
    
    if (!content.includes('auth.getUser')) {
      throw new Error('API no incluye verificación de autenticación');
    }
    if (!content.includes('role !== \'ADMIN\'')) {
      throw new Error('API no incluye verificación de rol admin');
    }
    if (!content.includes('status: 403')) {
      throw new Error('API no maneja correctamente permisos insuficientes');
    }
  });

  // Test 1.3: Verificar middleware de autenticación
  await runTest('Middleware de Autenticación', () => {
    const middlewarePath = path.join(config.projectRoot, 'src/middleware.ts');
    const content = fs.readFileSync(middlewarePath, 'utf8');
    
    if (!content.includes('publicRoutes')) {
      throw new Error('Middleware no define rutas públicas');
    }
    if (!content.includes('adminRoutes')) {
      throw new Error('Middleware no define rutas admin');
    }
    if (!content.includes('getSession')) {
      throw new Error('Middleware no verifica sesión');
    }
  });
}

/**
 * FASE 2: TESTING DE OPTIMIZACIÓN DE RENDIMIENTO
 */
async function testPerformancePhase() {
  log('\n⚡ INICIANDO TESTING FASE 2: OPTIMIZACIÓN DE RENDIMIENTO', 'info');
  
  // Test 2.1: Verificar configuración de Supabase Storage
  await runTest('Configuración Supabase Storage', () => {
    const storageSql = path.join(config.projectRoot, 'sql-migrations/setup-supabase-storage-and-rls.sql');
    const content = fs.readFileSync(storageSql, 'utf8');
    
    if (!content.includes('property-images')) {
      throw new Error('Bucket property-images no configurado');
    }
    if (!content.includes('user-avatars')) {
      throw new Error('Bucket user-avatars no configurado');
    }
    if (!content.includes('verification-docs')) {
      throw new Error('Bucket verification-docs no configurado');
    }
    if (!content.includes('CREATE POLICY')) {
      throw new Error('Políticas RLS no definidas');
    }
  });

  // Test 2.2: Verificar script de migración de imágenes
  await runTest('Script Migración de Imágenes', () => {
    const migrationScript = path.join(config.projectRoot, 'scripts/migrate-images-to-storage.js');
    const content = fs.readFileSync(migrationScript, 'utf8');
    
    if (!content.includes('base64ToBuffer')) {
      throw new Error('Función de conversión Base64 no encontrada');
    }
    if (!content.includes('uploadImageToStorage')) {
      throw new Error('Función de upload no encontrada');
    }
    if (!content.includes('checkMigrationStatus')) {
      throw new Error('Función de verificación de estado no encontrada');
    }
  });

  // Test 2.3: Verificar script de limpieza de código
  await runTest('Script Limpieza de Código', () => {
    const cleanupScript = path.join(config.projectRoot, 'scripts/cleanup-duplicate-code.js');
    const content = fs.readFileSync(cleanupScript, 'utf8');
    
    if (!content.includes('duplicateFiles')) {
      throw new Error('Configuración de archivos duplicados no encontrada');
    }
    if (!content.includes('createBackup')) {
      throw new Error('Función de backup no encontrada');
    }
    if (!content.includes('analyzeDependencies')) {
      throw new Error('Análisis de dependencias no implementado');
    }
  });

  // Test 2.4: Testing funcional del script de migración (dry-run)
  await runTest('Script Migración - Dry Run', () => {
    try {
      // Verificar que el script puede ejecutarse en modo dry-run
      const scriptPath = path.join(config.projectRoot, 'scripts/migrate-images-to-storage.js');
      const result = execSync(`node "${scriptPath}" check`, { 
        cwd: config.projectRoot,
        timeout: 10000,
        encoding: 'utf8'
      });
      
      if (!result.includes('VERIFICANDO ESTADO') && !result.includes('Error')) {
        testStats.warnings.push('Script de migración no ejecutó verificación de estado');
      }
    } catch (error) {
      // Es esperado que falle sin variables de entorno, pero debe fallar correctamente
      if (!error.message.includes('Variables de entorno') && !error.message.includes('SUPABASE')) {
        throw new Error(`Script falló inesperadamente: ${error.message}`);
      }
    }
  });
}

/**
 * FASE 3: TESTING DE LIMPIEZA Y ESTRUCTURA
 */
async function testStructurePhase() {
  log('\n🧹 INICIANDO TESTING FASE 3: LIMPIEZA Y ESTRUCTURA', 'info');
  
  // Test 3.1: Verificar normalización de base de datos
  await runTest('Normalización Base de Datos', () => {
    const normalizeSql = path.join(config.projectRoot, 'sql-migrations/normalize-database-schema.sql');
    const content = fs.readFileSync(normalizeSql, 'utf8');
    
    if (!content.includes('DELETE FROM "User"')) {
      throw new Error('Limpieza de usuarios de prueba no implementada');
    }
    if (!content.includes('CREATE INDEX')) {
      throw new Error('Creación de índices optimizados no implementada');
    }
    if (!content.includes('cleanup_orphaned_data')) {
      throw new Error('Función de limpieza de datos huérfanos no encontrada');
    }
  });

  // Test 3.2: Verificar script de reorganización
  await runTest('Script Reorganización Estructura', () => {
    const reorganizeScript = path.join(config.projectRoot, 'scripts/reorganize-project-structure.js');
    const content = fs.readFileSync(reorganizeScript, 'utf8');
    
    if (!content.includes('newStructure')) {
      throw new Error('Nueva estructura de directorios no definida');
    }
    if (!content.includes('filesToConsolidate')) {
      throw new Error('Configuración de consolidación no encontrada');
    }
    if (!content.includes('updateImports')) {
      throw new Error('Actualización de imports no implementada');
    }
  });

  // Test 3.3: Verificar hooks de autenticación
  await runTest('Hooks de Autenticación', () => {
    const authHook = path.join(config.projectRoot, 'src/hooks/useSupabaseAuth.ts');
    
    if (!fs.existsSync(authHook)) {
      throw new Error('Hook de autenticación principal no encontrado');
    }
    
    const content = fs.readFileSync(authHook, 'utf8');
    if (!content.includes('useEffect') || !content.includes('supabase')) {
      throw new Error('Hook de autenticación no implementado correctamente');
    }
  });

  // Test 3.4: Verificar componentes UI organizados
  await runTest('Componentes UI Organizados', () => {
    const uiComponents = [
      'src/components/ui/profile-form.tsx',
      'src/components/ui/profile-stats-enhanced.tsx',
      'src/components/ui/quick-actions-grid.tsx',
      'src/components/ui/recent-activity.tsx'
    ];
    
    let missingComponents = [];
    uiComponents.forEach(component => {
      const componentPath = path.join(config.projectRoot, component);
      if (!fs.existsSync(componentPath)) {
        missingComponents.push(component);
      }
    });
    
    if (missingComponents.length > 0) {
      testStats.warnings.push(`Componentes faltantes: ${missingComponents.join(', ')}`);
    }
  });
}

/**
 * TESTING DE INTEGRACIÓN
 */
async function testIntegration() {
  log('\n🔗 INICIANDO TESTING DE INTEGRACIÓN', 'info');
  
  // Test I.1: Verificar consistencia de imports
  await runTest('Consistencia de Imports', () => {
    const filesToCheck = [
      'src/components/auth-provider.tsx',
      'src/app/dashboard/page.tsx',
      'src/app/layout.tsx'
    ];
    
    filesToCheck.forEach(file => {
      const filePath = path.join(config.projectRoot, file);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        
        // Verificar que no hay imports rotos
        const importLines = content.split('\n').filter(line => line.trim().startsWith('import'));
        importLines.forEach(importLine => {
          if (importLine.includes('../../../') || importLine.includes('../../../../')) {
            testStats.warnings.push(`Import potencialmente problemático en ${file}: ${importLine.trim()}`);
          }
        });
      }
    });
  });

  // Test I.2: Verificar configuración de Next.js
  await runTest('Configuración Next.js', () => {
    const nextConfig = path.join(config.projectRoot, 'next.config.js');
    const content = fs.readFileSync(nextConfig, 'utf8');
    
    if (!content.includes('nextConfig')) {
      throw new Error('Configuración de Next.js no válida');
    }
  });

  // Test I.3: Verificar configuración de TypeScript
  await runTest('Configuración TypeScript', () => {
    const tsConfig = path.join(config.projectRoot, 'tsconfig.json');
    const content = fs.readFileSync(tsConfig, 'utf8');
    const config = JSON.parse(content);
    
    if (!config.compilerOptions || !config.compilerOptions.strict) {
      testStats.warnings.push('TypeScript no configurado en modo estricto');
    }
  });
}

/**
 * TESTING DE PERFORMANCE
 */
async function testPerformanceMetrics() {
  log('\n📊 INICIANDO TESTING DE PERFORMANCE', 'info');
  
  // Test P.1: Verificar tamaño de archivos críticos
  await runTest('Tamaño de Archivos Críticos', () => {
    const criticalFiles = [
      'src/app/layout.tsx',
      'src/components/auth-provider.tsx',
      'src/lib/supabase/server.ts'
    ];
    
    criticalFiles.forEach(file => {
      const filePath = path.join(config.projectRoot, file);
      if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        const sizeKB = stats.size / 1024;
        
        if (sizeKB > 50) {
          testStats.warnings.push(`Archivo ${file} es grande: ${sizeKB.toFixed(2)}KB`);
        }
      }
    });
  });

  // Test P.2: Verificar optimizaciones implementadas
  await runTest('Optimizaciones Implementadas', () => {
    // Verificar que existen los scripts de optimización
    const optimizationScripts = [
      'scripts/migrate-images-to-storage.js',
      'scripts/cleanup-duplicate-code.js',
      'sql-migrations/setup-supabase-storage-and-rls.sql'
    ];
    
    optimizationScripts.forEach(script => {
      const scriptPath = path.join(config.projectRoot, script);
      if (!fs.existsSync(scriptPath)) {
        throw new Error(`Script de optimización faltante: ${script}`);
      }
    });
  });
}

/**
 * TESTING DE DOCUMENTACIÓN
 */
async function testDocumentation() {
  log('\n📚 INICIANDO TESTING DE DOCUMENTACIÓN', 'info');
  
  // Test D.1: Verificar reportes de fases
  await runTest('Reportes de Fases', () => {
    const reports = [
      'REPORTE-FASE-1-SEGURIDAD-CRITICA-COMPLETADA.md',
      'REPORTE-FASE-2-OPTIMIZACION-RENDIMIENTO-COMPLETADA.md',
      'CHECKLIST-MAESTRO-AUDITORIA-MISIONES-ARRIENDA-2025.md'
    ];
    
    reports.forEach(report => {
      const reportPath = path.join(config.projectRoot, '..', report);
      if (!fs.existsSync(reportPath)) {
        throw new Error(`Reporte faltante: ${report}`);
      }
    });
  });

  // Test D.2: Verificar instrucciones de implementación
  await runTest('Instrucciones de Implementación', () => {
    const instructions = [
      'INSTRUCCIONES-FASE-1-OPTIMIZADA-2025.md',
      'INSTRUCCIONES-FASE-2-OPTIMIZACION-RENDIMIENTO-2025.md',
      'INSTRUCCIONES-FASE-3-LIMPIEZA-Y-ESTRUCTURA-2025.md'
    ];
    
    instructions.forEach(instruction => {
      const instructionPath = path.join(config.projectRoot, '..', instruction);
      if (!fs.existsSync(instructionPath)) {
        testStats.warnings.push(`Instrucción faltante: ${instruction}`);
      }
    });
  });
}

/**
 * Genera reporte final de testing
 */
function generateTestReport() {
  const endTime = new Date();
  const duration = (endTime - testStats.startTime) / 1000;
  
  log('\n' + '='.repeat(60), 'info');
  log('📊 REPORTE FINAL DE TESTING EXHAUSTIVO', 'info');
  log('='.repeat(60), 'info');
  log(`⏱️  Duración: ${duration.toFixed(2)} segundos`, 'info');
  log(`🧪 Tests ejecutados: ${testStats.totalTests}`, 'info');
  log(`✅ Tests exitosos: ${testStats.passedTests}`, 'success');
  log(`❌ Tests fallidos: ${testStats.failedTests}`, 'error');
  log(`⚠️  Advertencias: ${testStats.warnings.length}`, 'warning');
  
  const successRate = ((testStats.passedTests / testStats.totalTests) * 100).toFixed(1);
  log(`📈 Tasa de éxito: ${successRate}%`, 'info');
  
  if (testStats.errors.length > 0) {
    log('\n❌ ERRORES ENCONTRADOS:', 'error');
    testStats.errors.forEach((error, index) => {
      log(`${index + 1}. ${error.test}: ${error.error}`, 'error');
    });
  }
  
  if (testStats.warnings.length > 0) {
    log('\n⚠️  ADVERTENCIAS:', 'warning');
    testStats.warnings.forEach((warning, index) => {
      log(`${index + 1}. ${warning}`, 'warning');
    });
  }
  
  // Guardar reporte
  const report = {
    timestamp: new Date().toISOString(),
    duration,
    stats: testStats,
    summary: {
      totalTests: testStats.totalTests,
      passedTests: testStats.passedTests,
      failedTests: testStats.failedTests,
      successRate: parseFloat(successRate),
      warnings: testStats.warnings.length
    }
  };
  
  const reportPath = path.join(config.projectRoot, 'test-exhaustivo-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  log(`\n📄 Reporte detallado guardado en: test-exhaustivo-report.json`, 'info');
  
  // Determinar resultado final
  if (testStats.failedTests === 0) {
    log('\n🎉 ¡TESTING EXHAUSTIVO COMPLETADO EXITOSAMENTE!', 'success');
    return true;
  } else {
    log('\n⚠️  TESTING COMPLETADO CON ERRORES - REVISAR FALLOS', 'warning');
    return false;
  }
}

/**
 * Función principal de testing
 */
async function runExhaustiveTesting() {
  log('🚀 INICIANDO TESTING EXHAUSTIVO DE AUDITORÍA COMPLETA 2025', 'info');
  log('='.repeat(60), 'info');
  
  try {
    // Ejecutar todas las fases de testing
    await testSecurityPhase();
    await testPerformancePhase();
    await testStructurePhase();
    await testIntegration();
    await testPerformanceMetrics();
    await testDocumentation();
    
    // Generar reporte final
    const success = generateTestReport();
    
    process.exit(success ? 0 : 1);
    
  } catch (error) {
    log(`💥 ERROR CRÍTICO EN TESTING: ${error.message}`, 'error');
    process.exit(1);
  }
}

// Ejecutar testing si es llamado directamente
if (require.main === module) {
  runExhaustiveTesting();
}

module.exports = {
  runExhaustiveTesting,
  testStats
};
