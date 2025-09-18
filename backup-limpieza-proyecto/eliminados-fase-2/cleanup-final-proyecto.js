/**
 * 🧹 SCRIPT DE LIMPIEZA FINAL DEL PROYECTO
 * 
 * Elimina archivos innecesarios identificados en el análisis
 * GENERADO AUTOMÁTICAMENTE - REVISAR ANTES DE EJECUTAR
 */

const fs = require('fs');
const path = require('path');

// Crear backup antes de eliminar
const backupDir = path.join(__dirname, '_backups', 'final-cleanup-' + Date.now());
fs.mkdirSync(backupDir, { recursive: true });

const filesToDelete = [
  'ANALISIS-AUDITORIA-SUPABASE-RESULTADO-2025.md',
  'ANALISIS-IMPACTO-CORRECCIONES-SUPABASE-2025.md',
  'analisis-limpieza-proyecto-final.js',
  'AUDITORIA-COMPLETA-PROYECTO-MISIONES-ARRIENDA-2025.md',
  'AUDITORIA-DIRECTA-CODIGO-FUENTE-2025.md',
  'Backend\analisis-error-403-supabase.js',
  'Backend\ANALISIS-RENDIMIENTO-SITIO-WEB-2025.js',
  'Backend\AUDITORIA-COMPLETA-SUPABASE-2025.sql',
  'Backend\check-database-schema.sql',
  'Backend\cleanup-report.json',
  'Backend\CORRECCION-ERROR-GETBROWSERSUPABASE-COMPLETADA.md',
  'Backend\CORRECCION-ERROR-RUNTIME-COMPLETADA.md',
  'Backend\create-demo-property-published.js',
  'Backend\create-demo-property.js',
  'Backend\create-demo-property.sql',
  'Backend\INVESTIGACION-SUPABASE-DIAGNOSTICO.sql',
  'Backend\run-create-demo-property.bat',
  'Backend\run-dev-server.bat',
  'Backend\run-get-property-from-supabase.bat',
  'Backend\run-get-property-id.bat',
  'Backend\run-test-api-config.bat',
  'Backend\run-test-api-properties-filters.bat',
  'Backend\run-test-api-properties-id.bat',
  'Backend\run-test-new-filters.bat',
  'Backend\run-test-property-detail-fix.bat',
  'Backend\run-verificar-env.bat',
  'Backend\scripts\db-check.mjs',
  'Backend\scripts\runIndexTests.ts',
  'Backend\scripts\setup-structured-testing.js',
  'Backend\simple-check-properties.js',
  'Backend\sql-migrations\AUDITORIA-ESTADO-ACTUAL-SUPABASE-2025.sql',
  'Backend\sql-migrations\AUDITORIA-FINAL-PERFIL-USUARIO-2025.sql',
  'Backend\sql-migrations\AUDITORIA-SIMPLE-SUPABASE-2025.sql',
  'Backend\sql-migrations\core\create-profile-tables-2025-AUDITORIA.sql',
  'Backend\sql-migrations\data\CREAR-DATOS-PRUEBA-DIRECTO-2025.sql',
  'Backend\sql-migrations\data\CREAR-DATOS-PRUEBA-PERFIL-2025.sql',
  'Backend\sql-migrations\DIAGNOSTICO-Y-CORRECCION-AUTH-2025.sql',
  'Backend\sql-migrations\fixes\FIX-FINAL-FAVORITOS-Y-PRUEBA-2025.sql',
  'Backend\sql-migrations\verify-profile-tables-phase-4.sql',
  'Backend\src\app\api\users\stats\route-auditoria.ts',
  'Backend\src\components\comunidad\__tests__\ProfileCard.test.tsx',
  'Backend\src\components\ui\checkbox.tsx',
  'Backend\src\components\ui\profile-stats-auditoria.tsx',
  'Backend\test-component-structure-report.json',
  'Backend\test-component-structure.js',
  'Backend\test-database-normalization.js',
  'Backend\test-detail-seo-fallback.mjs',
  'Backend\TODO.md',
  'Backend\_backups\cleanup-1757899821654\ANALISIS-COMPLETO-ERRORES-PERFIL-2025.md',
  'Backend\_backups\cleanup-1757899821654\audit-critico-especifico.js',
  'Backend\_backups\cleanup-1757899821654\audit-error-readlink-comunidad.js',
  'Backend\_backups\cleanup-1757899821654\audit-proyecto-completo.js',
  'Backend\_backups\cleanup-1757899821654\audit-supabase-imports-completo.js',
  'Backend\_backups\cleanup-1757899821654\check-properties-data.js',
  'Backend\_backups\cleanup-1757899821654\check-properties.js',
  'Backend\_backups\cleanup-1757899821654\check-property-exists.js',
  'Backend\_backups\cleanup-1757899821654\check-tables.js',
  'Backend\_backups\cleanup-1757899821654\diagnostico-avatar-upload-problema-2025.js',
  'Backend\_backups\cleanup-1757899821654\INSTRUCCIONES-APLICAR-RLS-POLICIES.md',
  'Backend\_backups\cleanup-1757899821654\INSTRUCCIONES-AUDITORIA-SUPABASE-2025.md',
  'Backend\_backups\cleanup-1757899821654\INSTRUCCIONES-FASE-2-OPTIMIZACION-RENDIMIENTO-2025.md',
  'Backend\_backups\cleanup-1757899821654\INSTRUCCIONES-FASE-3-LIMPIEZA-Y-ESTRUCTURA-2025.md',
  'Backend\_backups\cleanup-1757899821654\INSTRUCCIONES-MIGRACION-PERFIL-2025.md',
  'Backend\_backups\cleanup-1757899821654\INSTRUCCIONES-URGENTES-FIX-RLS-2025.md',
  'Backend\_backups\cleanup-1757899821654\PLAN-ARREGLO-MINIMO-SUPABASE.md',
  'Backend\_backups\cleanup-1757899821654\PLAN-CORRECCION-ERROR-RUNTIME.md',
  'Backend\_backups\cleanup-1757899821654\PLAN-REFACTOR-SUPABASE.md',
  'Backend\_backups\cleanup-1757899821654\scripts\testing\test-api-properties-filters.js',
  'Backend\_backups\cleanup-1757899821654\scripts\testing\test-api-properties-id.js',
  'Backend\_backups\cleanup-1757899821654\scripts\testing\test-api-simple.js',
  'Backend\_backups\cleanup-1757899821654\scripts\testing\test-api-with-config.js',
  'Backend\_backups\cleanup-1757899821654\scripts\testing\test-auditoria-perfil-completo-2025.js',
  'Backend\_backups\cleanup-1757899821654\scripts\testing\test-auth-hydration.js',
  'Backend\_backups\cleanup-1757899821654\scripts\testing\test-auth-provider-error-fix.js',
  'Backend\_backups\cleanup-1757899821654\scripts\testing\test-auth-provider-fix.js',
  'Backend\_backups\cleanup-1757899821654\scripts\testing\test-auth-ui-fix.js',
  'Backend\_backups\cleanup-1757899821654\scripts\testing\test-avatar-upload-complete-2025.js',
  'Backend\_backups\cleanup-1757899821654\scripts\testing\test-avatar-upload-fix-2025.js',
  'Backend\_backups\cleanup-1757899821654\scripts\testing\test-exhaustivo-permission-fix.js',
  'Backend\_backups\cleanup-1757899821654\scripts\testing\test-fetch-bucket-images.js',
  'Backend\_backups\cleanup-1757899821654\scripts\testing\test-getbrowsersupabase.js',
  'Backend\_backups\cleanup-1757899821654\scripts\testing\test-import.js',
  'Backend\_backups\cleanup-1757899821654\scripts\testing\test-neutralizacion-final-preciso.js',
  'Backend\_backups\cleanup-1757899821654\scripts\testing\test-neutralizacion-legacy-exhaustivo.js',
  'Backend\_backups\cleanup-1757899821654\scripts\testing\test-new-filters-comprehensive.js',
  'Backend\_backups\cleanup-1757899821654\scripts\testing\test-new-filters-implementation.js',
  'Backend\_backups\cleanup-1757899821654\scripts\testing\test-payment-preference.js',
  'Backend\_backups\cleanup-1757899821654\scripts\testing\test-perfil-datos-reales-2025.js',
  'Backend\_backups\cleanup-1757899821654\scripts\testing\test-permission-denied-fix.js',
  'Backend\_backups\cleanup-1757899821654\scripts\testing\test-phase-2-quick-actions-improvements.js',
  'Backend\_backups\cleanup-1757899821654\scripts\testing\test-phase-3-profile-stats-improvements.js',
  'Backend\_backups\cleanup-1757899821654\scripts\testing\test-phase-4-api-verification.js',
  'Backend\_backups\cleanup-1757899821654\scripts\testing\test-profile-activity-improvements.js',
  'Backend\_backups\cleanup-1757899821654\scripts\testing\test-profile-complete-2025.js',
  'Backend\_backups\cleanup-1757899821654\scripts\testing\test-profile-errors-fix.js',
  'Backend\_backups\cleanup-1757899821654\scripts\testing\test-profile-improvements-2025.js',
  'Backend\_backups\cleanup-1757899821654\scripts\testing\test-profile-inquilino-auth-fix.js',
  'Backend\_backups\cleanup-1757899821654\scripts\testing\test-properties-api-fix.js',
  'Backend\_backups\cleanup-1757899821654\scripts\testing\test-properties-fix-verification.js',
  'Backend\_backups\cleanup-1757899821654\scripts\testing\test-property-creation.js',
  'Backend\_backups\cleanup-1757899821654\scripts\testing\test-property-detail-fix-pack.js',
  'Backend\_backups\cleanup-1757899821654\scripts\testing\test-property-detail-fix.js',
  'Backend\_backups\cleanup-1757899821654\scripts\testing\test-property-filters.js',
  'Backend\_backups\cleanup-1757899821654\scripts\testing\test-property-images-fallback-comprehensive.js',
  'Backend\_backups\cleanup-1757899821654\scripts\testing\test-property-images-fallback-enhanced.js',
  'Backend\_backups\cleanup-1757899821654\scripts\testing\test-property-images-fallback.js',
  'Backend\_backups\cleanup-1757899821654\scripts\testing\test-resolve-images.js',
  'Backend\_backups\cleanup-1757899821654\scripts\testing\test-security-fixes-phase-1.js',
  'Backend\_backups\cleanup-1757899821654\scripts\testing\test-seo-implementation.js',
  'Backend\_backups\cleanup-1757899821654\scripts\testing\test-seo-property-detail.js',
  'Backend\_backups\cleanup-1757899821654\scripts\testing\test-server-status-and-performance.js',
  'Backend\_backups\cleanup-1757899821654\scripts\testing\test-session-prop.js',
  'Backend\_backups\cleanup-1757899821654\scripts\testing\test-smoke-e2e.js',
  'Backend\_backups\cleanup-1757899821654\scripts\testing\test-soft-guard-dashboard.js',
  'Backend\_backups\cleanup-1757899821654\scripts\testing\test-sql-supabase-corregido-2025.js',
  'Backend\_backups\cleanup-1757899821654\scripts\testing\verify-legacy-neutralization.js',
  'Backend\_backups\cleanup-1757899821654\scripts\testing\verify-refactor-success.js',
  'Backend\_backups\cleanup-1757899821654\scripts\testing\verify-runtime-error-fix.js',
  'Backend\_backups\cleanup-1757899821654\SOLUCION-ERROR-RUNTIME-AUTH-PROVIDER.md',
  'Backend\_backups\cleanup-1757899821654\SOLUCION-ERROR-RUNTIME-COMPLETADA.md',
  'Backend\_backups\cleanup-1757899821654\SOLUCION-PERMISSION-DENIED-USER-TABLE-COMPLETADA.md',
  'Backend\_backups\cleanup-1757899821654\SOLUCION-PROFILE-INQUILINO-AUTH-COMPLETADA.md',
  'Backend\_backups\cleanup-1757899821654\test-auditoria-fase-1-exhaustivo.js',
  'Backend\_backups\cleanup-1757899821654\test-exhaustivo-auditoria-completa-2025.js',
  'Backend\_backups\cleanup-1757899821654\test-exhaustivo-completo-2025.js',
  'Backend\_backups\cleanup-1757899821654\test-exhaustivo-fase-2-storage-completo.js',
  'Backend\_backups\cleanup-1757899821654\test-fase-2-storage-setup.js',
  'Backend\_backups\cleanup-1757899821654\TODO-FIX-PERMISSION-DENIED-USER-TABLE.md',
  'Backend\__tests__\components\comunidad\ChatInput.test.tsx',
  'Backend\__tests__\components\comunidad\ProfileCard.test.tsx',
  'Backend\__tests__\helpers\test-utils.tsx',
  'Backend\__tests__\hooks\useSupabaseAuth.test.ts',
  'Backend\__tests__\integration\api\properties.test.ts',
  'Backend\__tests__\unit\hooks\useSupabaseAuth.test.tsx',
  'Backend\__tests__\unit\utils\format.test.ts',
  'Blackbox\check-avatar-paths.js',
  'Blackbox\check-database-performance-2025.sql',
  'Blackbox\check-properties-table-data.sql',
  'Blackbox\insertar-datos-prueba-published.sql',
  'Blackbox\RESPUESTA-BLACKBOX-CORRECCION-ERROR-TYPESCRIPT-PROPERTY-DETAIL-2025.md',
  'Blackbox\RESPUESTA-BLACKBOX-FALLBACK-IMAGENES-PROPIEDADES-2025.md',
  'Blackbox\RESPUESTA-BLACKBOX-ORDERING.md',
  'Blackbox\RESPUESTA-BLACKBOX-PROFILE-IMAGE-UPLOAD-2025.md',
  'Blackbox\RESPUESTA-BLACKBOX-PROPERTIES-DATA.md',
  'Blackbox\RESPUESTA-BLACKBOX-PROPERTY-CARD-UPDATES-2025.md',
  'Blackbox\RESPUESTA-BLACKBOX-SUPABASE-STORAGE-PERMISSIONS-2025.md',
  'Blackbox\RESPUESTA-CONTACT-AGENT-2025.md',
  'Blackbox\RESPUESTA-FINAL-PROPERTIES-API-2025.md',
  'Blackbox\RESPUESTA-FINAL-PROPERTY-ROBUSTEZ-2025.md',
  'Blackbox\RESPUESTA-FINAL-SEED-PROPERTIES-2025.md',
  'Blackbox\RESPUESTA-FIX-500-REST-API-2025.md',
  'Blackbox\RESPUESTA-FIX-PROPERTY-CARD-IMAGE-ERROR-2025.md',
  'Blackbox\RESPUESTA-FRONTEND-PROPERTIES-2025.md',
  'Blackbox\RESPUESTA-PROPERTY-DETAIL-2025.md',
  'Blackbox\RESPUESTA-PROPIEDADES-VISIBLES.md',
  'Blackbox\run-thorough-e2e-test.bat',
  'Blackbox\test-api-patch-price-validation.js',
  'Blackbox\test-api-properties-published.js',
  'Blackbox\test-frontend-filters-2025.js',
  'Blackbox\test-permissions-comprehensive.js',
  'Blackbox\test-permissions-curl.js',
  'Blackbox\test-permissions-simple.js',
  'Blackbox\test-permissions-supabase-storage.js',
  'Blackbox\test-profile-image-integration.js',
  'Blackbox\test-profile-image-simple.js',
  'Blackbox\test-profile-image-upload.js',
  'Blackbox\test-properties-api.js',
  'Blackbox\test-thorough-e2e-filters-2025.js',
  'BLACKBOX-RESPUESTA-ERROR-500-PROPERTIES-PAGE-2025.md',
  'BLACKBOX-RESPUESTA-SOFT-GUARD-INQUILINO-PROFILE-2025.md',
  'BLACKBOX-RESPUESTA-SOFT-GUARD-PERFIL-IMAGEN-2025.md',
  'BLACKBOX-RESPUESTA-USERID-PROPERTYCARD-ELDORADO-2025.md',
  'Chatgpt-auditoria.md',
  // 'CHECKLIST-MAESTRO-AUDITORIA-MISIONES-ARRIENDA-2025.md', // PROTEGIDO - NO ELIMINAR
  'ESTADO-PROGRESO-PERFIL-USUARIO-2025.md',
  'INSTRUCCIONES-AUDITORIA-SUPABASE-FASE-1.md',
  'INSTRUCCIONES-COMPLETAR-FASE-3-LIMPIEZA-2025.md',
  'INSTRUCCIONES-EJECUCION-NORMALIZACION-BD-SUPABASE.md',
  'INSTRUCCIONES-FASE-2-OPTIMIZACION-RENDIMIENTO-2025.md',
  'INSTRUCCIONES-FASE-3-LIMPIEZA-Y-ESTRUCTURA-2025.md',
  'INSTRUCCIONES-FASE-4-VERIFICACION-APIS.md',
  'INSTRUCCIONES-FINALES-FASE-2-STORAGE-COMPLETADA-2025.md',
  'INSTRUCCIONES-FINALES-PERFIL-DATOS-REALES-2025.md',
  'INSTRUCCIONES-IMPLEMENTACION-AUDITORIA-PERFIL-2025.md',
  'INSTRUCCIONES-IMPLEMENTACION-FASE-1-OPTIMIZADA-2025.md',
  'INSTRUCCIONES-IMPLEMENTACION-FINAL-2025.md',
  'INSTRUCCIONES-PASO-A-PASO-FASE-2-2025.md',
  'INSTRUCCIONES-SQL-SUPABASE-CORREGIDO-2025.md',
  'INSTRUCCIONES-URGENTES-SOLUCIONAR-AVATAR-2025.md',
  'PASOS-FINALES-IMPLEMENTACION-2025.md',
  'PLAN-AUDITORIA-COMPLETA-MISIONES-ARRIENDA-2025.md',
  'PLAN-AUDITORIA-PERFIL-USUARIO-2025.md',
  'PLAN-COMPLETO-PERFIL-USUARIO-2025.md',
  'PLAN-CONTINUACION-FASE-2-OPTIMIZACION-2025.md',
  'PLAN-IMPLEMENTACION-COMPLETA-PERFIL-2025.md',
  'PLAN-INTEGRAL-FINALIZACION-PROYECTO-2025.md',
  'PROGRESO-AUDITORIA-PERFIL-GUARDADO-2025.md',
  'PROYECTO-LIMPIO-LISTO-PARA-MANANA-2025.md',
  'REPORTE-AISLAMIENTO-ERROR-500-HOME-2025.md',
  'REPORTE-ANALISIS-FILTROS-PROPERTIES-CLIENT-2025.md',
  'REPORTE-AUDITORIA-PERFIL-USUARIO-ESTADO-ACTUAL-2025.md',
  'REPORTE-FASE-1-ACTIVIDAD-RECIENTE-COMPLETADA.md',
  'REPORTE-FASE-1-AUDITORIA-COMPLETADA-2025.md',
  'REPORTE-FASE-1-SEGURIDAD-CRITICA-COMPLETADA.md',
  'REPORTE-FASE-2-OPTIMIZACION-RENDIMIENTO-COMPLETADA.md',
  'REPORTE-FASE-2-QUICK-ACTIONS-GRID-COMPLETADA.md',
  'REPORTE-FASE-3-PROFILE-STATS-COMPLETADA.md',
  'REPORTE-FINAL-AUDITORIA-COMPLETA-MISIONES-ARRIENDA-2025.md',
  'REPORTE-FINAL-AUDITORIA-SUPABASE-PROBLEMAS-IDENTIFICADOS-2025.md',
  'REPORTE-FINAL-CORRECCION-DATOS-REALES-2025.md',
  'REPORTE-FINAL-FASE-1-SEGURIDAD-COMPLETADA-2025.md',
  'REPORTE-FINAL-FASE-2-STORAGE-OPTIMIZACION-COMPLETADA-2025.md',
  'REPORTE-FINAL-FASE-3-LIMPIEZA-ESTRUCTURA-COMPLETADA-2025.md',
  'REPORTE-FINAL-FIX-AVATAR-UPLOAD-RLS-2025.md',
  'REPORTE-FINAL-MEJORA-PERFIL-INQUILINO-2025.md',
  'REPORTE-FINAL-MIGRACION-IMAGENES-COMPLETADA-2025.md',
  'REPORTE-FINAL-PERFIL-DATOS-REALES-COMPLETADO-2025.md',
  'REPORTE-FINAL-PERFIL-USUARIO-COMPLETO-2025.md',
  'REPORTE-FINAL-PERFIL-USUARIO-DATOS-REALES-2025.md',
  'REPORTE-FINAL-PERFIL-USUARIO-FUNCIONAL-2025.md',
  'REPORTE-FINAL-PROYECTO-PERFIL-USUARIO-COMPLETADO.md',
  'REPORTE-IMPLEMENTACION-CARRUSEL-IMAGENES-DETALLE-PROPIEDADES-2025.md',
  'REPORTE-IMPLEMENTACION-CARRUSEL-IMAGENES-DETALLE.md',
  'REPORTE-INVESTIGACION-SUPABASE-CREATE-SERVER-2025.md',
  'REPORTE-MEJORAS-COPY-UX-DETALLE-PROPIEDADES.md',
  'REPORTE-TESTING-COMPLETO-AVATAR-UPLOAD-FIX-2025.md',
  'REPORTE-TESTING-EXHAUSTIVO-FASE-2-COMPLETADO-2025.md',
  'REPORTE-TESTING-FASE-2-OPTIMIZACION-2025.md',
  'REPORTE-VERIFICACION-USERID-PROPERTYCARD-2025.md',
  'RESUMEN-PROGRESO-FASES-1-2-3-COMPLETADAS.md',
  'SOLUCION-ERROR-INDICES-PROFILE-VIEWS-2025.md',
  'SOLUCION-ERROR-TIPOS-SUPABASE-2025.md',
  'TODO-CONTINUACION-PERFIL-USUARIO-MANANA-2025.md',
  'TODO-FILTROS-PROFESIONALES-2025.md',
  'TODO-FIX-AVATAR-UPLOAD-RLS-2025.md',
  'TODO-MEJORA-PERFIL-INQUILINO-2025.md',
  'TODO-PERFIL-USUARIO-COMPLETO-2025.md',
  'TODO.md'
];

let deletedCount = 0;
let totalSize = 0;

console.log('🧹 INICIANDO LIMPIEZA FINAL DEL PROYECTO');
console.log('='.repeat(50));
console.log(`📊 Archivos a eliminar: ${filesToDelete.length}`);

filesToDelete.forEach(filePath => {
  try {
    const fullPath = path.join(__dirname, filePath);
    
    if (fs.existsSync(fullPath)) {
      const stat = fs.statSync(fullPath);
      
      // Crear backup del archivo
      const backupPath = path.join(backupDir, filePath);
      fs.mkdirSync(path.dirname(backupPath), { recursive: true });
      fs.copyFileSync(fullPath, backupPath);
      
      // Eliminar archivo
      fs.unlinkSync(fullPath);
      
      deletedCount++;
      totalSize += stat.size;
      console.log(`   ✅ Eliminado: ${filePath}`);
    } else {
      console.log(`   ⚠️  No existe: ${filePath}`);
    }
  } catch (error) {
    console.error(`   ❌ Error eliminando ${filePath}: ${error.message}`);
  }
});

console.log(`\n🎉 LIMPIEZA COMPLETADA:`);
console.log(`   📊 Archivos eliminados: ${deletedCount}`);
console.log(`   💾 Espacio liberado: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
console.log(`   🔒 Backup creado en: ${backupDir}`);

// Limpiar directorios vacíos
function removeEmptyDirectories(dir) {
  if (!fs.existsSync(dir)) return;
  
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      removeEmptyDirectories(filePath);
      
      try {
        if (fs.readdirSync(filePath).length === 0) {
          fs.rmdirSync(filePath);
          console.log(`   🗑️  Directorio vacío eliminado: ${path.relative(__dirname, filePath)}`);
        }
      } catch (error) {
        // Ignorar errores al eliminar directorios
      }
    }
  });
}

console.log(`\n🧹 Limpiando directorios vacíos...`);
removeEmptyDirectories(__dirname);

console.log(`\n✨ ¡PROYECTO LIMPIO Y OPTIMIZADO!`);
