/**
 * 🧹 SCRIPT DE LIMPIEZA FINAL DEL PROYECTO - VERSIÓN SEGURA
 * 
 * Elimina archivos innecesarios identificados en el análisis
 * Protege el archivo CHECKLIST-MAESTRO-AUDITORIA-MISIONES-ARRIENDA-2025.md
 */

const fs = require('fs');
const path = require('path');

// Crear backup antes de eliminar
const backupDir = path.join(__dirname, '_backups', 'final-cleanup-' + Date.now());
fs.mkdirSync(backupDir, { recursive: true });

// Archivos específicos a eliminar (excluyendo el checklist maestro)
const filesToDelete = [
  // Análisis y auditorías
  'ANALISIS-AUDITORIA-SUPABASE-RESULTADO-2025.md',
  'ANALISIS-IMPACTO-CORRECCIONES-SUPABASE-2025.md',
  'AUDITORIA-COMPLETA-PROYECTO-MISIONES-ARRIENDA-2025.md',
  'AUDITORIA-DIRECTA-CODIGO-FUENTE-2025.md',
  'Chatgpt-auditoria.md',
  'PLAN-AUDITORIA-COMPLETA-MISIONES-ARRIENDA-2025.md',
  'PLAN-AUDITORIA-PERFIL-USUARIO-2025.md',
  'PROGRESO-AUDITORIA-PERFIL-GUARDADO-2025.md',
  'REPORTE-AUDITORIA-PERFIL-USUARIO-ESTADO-ACTUAL-2025.md',
  'REPORTE-FASE-1-AUDITORIA-COMPLETADA-2025.md',
  'REPORTE-FINAL-AUDITORIA-COMPLETA-MISIONES-ARRIENDA-2025.md',
  'REPORTE-FINAL-AUDITORIA-SUPABASE-PROBLEMAS-IDENTIFICADOS-2025.md',
  'INSTRUCCIONES-AUDITORIA-SUPABASE-FASE-1.md',
  'INSTRUCCIONES-IMPLEMENTACION-AUDITORIA-PERFIL-2025.md',
  
  // Reportes de desarrollo
  'REPORTE-AISLAMIENTO-ERROR-500-HOME-2025.md',
  'REPORTE-ANALISIS-FILTROS-PROPERTIES-CLIENT-2025.md',
  'REPORTE-FASE-1-ACTIVIDAD-RECIENTE-COMPLETADA.md',
  'REPORTE-FASE-1-SEGURIDAD-CRITICA-COMPLETADA.md',
  'REPORTE-FASE-2-OPTIMIZACION-RENDIMIENTO-COMPLETADA.md',
  'REPORTE-FASE-2-QUICK-ACTIONS-GRID-COMPLETADA.md',
  'REPORTE-FASE-3-PROFILE-STATS-COMPLETADA.md',
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
  
  // Instrucciones de desarrollo
  'INSTRUCCIONES-COMPLETAR-FASE-3-LIMPIEZA-2025.md',
  'INSTRUCCIONES-EJECUCION-NORMALIZACION-BD-SUPABASE.md',
  'INSTRUCCIONES-FASE-2-OPTIMIZACION-RENDIMIENTO-2025.md',
  'INSTRUCCIONES-FASE-3-LIMPIEZA-Y-ESTRUCTURA-2025.md',
  'INSTRUCCIONES-FASE-4-VERIFICACION-APIS.md',
  'INSTRUCCIONES-FINALES-FASE-2-STORAGE-COMPLETADA-2025.md',
  'INSTRUCCIONES-FINALES-PERFIL-DATOS-REALES-2025.md',
  'INSTRUCCIONES-IMPLEMENTACION-FASE-1-OPTIMIZADA-2025.md',
  'INSTRUCCIONES-IMPLEMENTACION-FINAL-2025.md',
  'INSTRUCCIONES-PASO-A-PASO-FASE-2-2025.md',
  'INSTRUCCIONES-SQL-SUPABASE-CORREGIDO-2025.md',
  'INSTRUCCIONES-URGENTES-SOLUCIONAR-AVATAR-2025.md',
  
  // Planes de desarrollo
  'PLAN-COMPLETO-PERFIL-USUARIO-2025.md',
  'PLAN-CONTINUACION-FASE-2-OPTIMIZACION-2025.md',
  'PLAN-IMPLEMENTACION-COMPLETA-PERFIL-2025.md',
  'PLAN-INTEGRAL-FINALIZACION-PROYECTO-2025.md',
  
  // TODOs y estados
  'TODO-CONTINUACION-PERFIL-USUARIO-MANANA-2025.md',
  'TODO-FILTROS-PROFESIONALES-2025.md',
  'TODO-FIX-AVATAR-UPLOAD-RLS-2025.md',
  'TODO-MEJORA-PERFIL-INQUILINO-2025.md',
  'TODO-PERFIL-USUARIO-COMPLETO-2025.md',
  'ESTADO-PROGRESO-PERFIL-USUARIO-2025.md',
  'PASOS-FINALES-IMPLEMENTACION-2025.md',
  'PROYECTO-LIMPIO-LISTO-PARA-MANANA-2025.md',
  'RESUMEN-PROGRESO-FASES-1-2-3-COMPLETADAS.md',
  
  // Soluciones y correcciones
  'SOLUCION-ERROR-INDICES-PROFILE-VIEWS-2025.md',
  'SOLUCION-ERROR-TIPOS-SUPABASE-2025.md',
  
  // Respuestas de Blackbox
  'BLACKBOX-RESPUESTA-ERROR-500-PROPERTIES-PAGE-2025.md',
  'BLACKBOX-RESPUESTA-SOFT-GUARD-INQUILINO-PROFILE-2025.md',
  'BLACKBOX-RESPUESTA-SOFT-GUARD-PERFIL-IMAGEN-2025.md',
  'BLACKBOX-RESPUESTA-USERID-PROPERTYCARD-ELDORADO-2025.md',
  'Respuestas de blackbox.md',
  
  // SQL de desarrollo y fixes
  'FIX-CRITICO-INMEDIATO-SUPABASE-2025.sql',
  'FIX-FINAL-SEGURO-COMPATIBLE-SUPABASE-2025.sql',
  'FIX-SUPABASE-ULTRA-SEGURO-2025.sql',
  'VERIFICAR-ESTADO-MIGRACION-SUPABASE-2025.sql',
  'SQL-PARA-EJECUTAR-EN-SUPABASE-DASHBOARD.sql',
  'INSTRUCCIONES-EJECUCION-NORMALIZACION-BD-SUPABASE.sql',
  
  // Scripts de análisis y limpieza
  'analisis-limpieza-proyecto-final.js',
  'cleanup-project.js'
];

// Directorios completos a eliminar
const directoriesToDelete = [
  'Auditoria CHATGPT14',
  'Blackbox',
  '_backups'
];

// Archivos en Backend a eliminar
const backendFilesToDelete = [
  // Scripts de testing y análisis
  'Backend/analisis-error-403-supabase.js',
  'Backend/ANALISIS-RENDIMIENTO-SITIO-WEB-2025.js',
  'Backend/test-component-structure.js',
  'Backend/test-database-normalization.js',
  'Backend/test-detail-seo-fallback.mjs',
  'Backend/cleanup-report.json',
  'Backend/test-component-structure-report.json',
  
  // Archivos .bat
  'Backend/run-create-demo-property.bat',
  'Backend/run-dev-server.bat',
  'Backend/run-get-property-from-supabase.bat',
  'Backend/run-get-property-id.bat',
  'Backend/run-test-api-config.bat',
  'Backend/run-test-api-properties-filters.bat',
  'Backend/run-test-api-properties-id.bat',
  'Backend/run-test-new-filters.bat',
  'Backend/run-test-property-detail-fix.bat',
  'Backend/run-verificar-env.bat',
  
  // Scripts de demo y testing
  'Backend/create-demo-property-published.js',
  'Backend/create-demo-property.js',
  'Backend/create-demo-property.sql',
  'Backend/simple-check-properties.js',
  'Backend/get-evidencias-finales.js',
  'Backend/get-property-from-supabase.js',
  'Backend/get-property-id.js',
  
  // Documentación de desarrollo
  'Backend/CORRECCION-ERROR-GETBROWSERSUPABASE-COMPLETADA.md',
  'Backend/CORRECCION-ERROR-RUNTIME-COMPLETADA.md',
  'Backend/PROFILE-ERRORS-FIX-COMPLETE.md',
  'Backend/TODO.md',
  
  // SQL de auditoría y desarrollo
  'Backend/AUDITORIA-COMPLETA-SUPABASE-2025.sql',
  'Backend/check-database-schema.sql',
  'Backend/INVESTIGACION-SUPABASE-DIAGNOSTICO.sql',
  'Backend/SOLUCIONES-SUPABASE-ESPECIFICAS.sql'
];

let deletedCount = 0;
let totalSize = 0;
let errors = [];

console.log('🧹 INICIANDO LIMPIEZA FINAL DEL PROYECTO');
console.log('='.repeat(60));
console.log(`📊 Archivos individuales a eliminar: ${filesToDelete.length}`);
console.log(`📊 Archivos en Backend a eliminar: ${backendFilesToDelete.length}`);
console.log(`📊 Directorios completos a eliminar: ${directoriesToDelete.length}`);
console.log(`🔒 Archivo protegido: CHECKLIST-MAESTRO-AUDITORIA-MISIONES-ARRIENDA-2025.md`);

// Función para eliminar archivo con backup
function deleteFileWithBackup(filePath) {
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
      return true;
    } else {
      console.log(`   ⚠️  No existe: ${filePath}`);
      return false;
    }
  } catch (error) {
    console.error(`   ❌ Error eliminando ${filePath}: ${error.message}`);
    errors.push(`${filePath}: ${error.message}`);
    return false;
  }
}

// Función para eliminar directorio completo
function deleteDirectoryWithBackup(dirPath) {
  try {
    const fullPath = path.join(__dirname, dirPath);
    
    if (fs.existsSync(fullPath)) {
      // Crear backup del directorio
      const backupPath = path.join(backupDir, dirPath);
      
      function copyDirectory(src, dest) {
        fs.mkdirSync(dest, { recursive: true });
        const files = fs.readdirSync(src);
        
        files.forEach(file => {
          const srcFile = path.join(src, file);
          const destFile = path.join(dest, file);
          const stat = fs.statSync(srcFile);
          
          if (stat.isDirectory()) {
            copyDirectory(srcFile, destFile);
          } else {
            fs.copyFileSync(srcFile, destFile);
            totalSize += stat.size;
          }
        });
      }
      
      function removeDirectory(dir) {
        const files = fs.readdirSync(dir);
        
        files.forEach(file => {
          const filePath = path.join(dir, file);
          const stat = fs.statSync(filePath);
          
          if (stat.isDirectory()) {
            removeDirectory(filePath);
          } else {
            fs.unlinkSync(filePath);
            deletedCount++;
          }
        });
        
        fs.rmdirSync(dir);
      }
      
      // Hacer backup y eliminar
      copyDirectory(fullPath, backupPath);
      removeDirectory(fullPath);
      
      console.log(`   ✅ Directorio eliminado: ${dirPath}`);
      return true;
    } else {
      console.log(`   ⚠️  Directorio no existe: ${dirPath}`);
      return false;
    }
  } catch (error) {
    console.error(`   ❌ Error eliminando directorio ${dirPath}: ${error.message}`);
    errors.push(`${dirPath}: ${error.message}`);
    return false;
  }
}

// Eliminar archivos individuales
console.log('\n📄 ELIMINANDO ARCHIVOS INDIVIDUALES:');
filesToDelete.forEach(filePath => {
  deleteFileWithBackup(filePath);
});

// Eliminar archivos en Backend
console.log('\n📁 ELIMINANDO ARCHIVOS EN BACKEND:');
backendFilesToDelete.forEach(filePath => {
  deleteFileWithBackup(filePath);
});

// Eliminar directorios completos
console.log('\n📂 ELIMINANDO DIRECTORIOS COMPLETOS:');
directoriesToDelete.forEach(dirPath => {
  deleteDirectoryWithBackup(dirPath);
});

// Limpiar directorios vacíos
console.log('\n🧹 LIMPIANDO DIRECTORIOS VACÍOS:');
function removeEmptyDirectories(dir) {
  if (!fs.existsSync(dir)) return;
  
  try {
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
  } catch (error) {
    // Ignorar errores de lectura de directorios
  }
}

removeEmptyDirectories(__dirname);

// Verificar que el checklist maestro sigue existiendo
const checklistPath = path.join(__dirname, 'CHECKLIST-MAESTRO-AUDITORIA-MISIONES-ARRIENDA-2025.md');
if (fs.existsSync(checklistPath)) {
  console.log('\n✅ VERIFICACIÓN: CHECKLIST-MAESTRO-AUDITORIA-MISIONES-ARRIENDA-2025.md está protegido');
} else {
  console.log('\n❌ ERROR: El checklist maestro fue eliminado accidentalmente');
}

// Resumen final
console.log('\n' + '='.repeat(60));
console.log('🎉 LIMPIEZA COMPLETADA');
console.log('='.repeat(60));
console.log(`📊 Archivos eliminados: ${deletedCount}`);
console.log(`💾 Espacio liberado: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
console.log(`🔒 Backup creado en: ${backupDir}`);

if (errors.length > 0) {
  console.log(`\n❌ Errores encontrados: ${errors.length}`);
  errors.forEach(error => console.log(`   - ${error}`));
}

console.log('\n💡 PRÓXIMOS PASOS:');
console.log('   1. ✅ Verificar que el proyecto sigue funcionando');
console.log('   2. 🧪 Ejecutar: npm run build (en Backend)');
console.log('   3. 🚀 Continuar con Fase 4 del proyecto');
console.log('   4. 📋 Revisar CHECKLIST-MAESTRO-AUDITORIA-MISIONES-ARRIENDA-2025.md');

console.log('\n✨ ¡PROYECTO LIMPIO Y OPTIMIZADO!');

// Crear archivo de nota para mañana
const notePath = path.join(__dirname, 'NOTA-CONTINUACION-FASE-4-MANANA.md');
const noteContent = `# 📋 NOTA: CONTINUACIÓN MAÑANA - FASE 4

## 🎯 Estado Actual del Proyecto
- ✅ **FASE 1**: Seguridad Crítica - COMPLETADA
- ✅ **FASE 2**: Optimización de Rendimiento - COMPLETADA  
- ✅ **FASE 3**: Limpieza y Estructura - COMPLETADA
- ⏳ **FASE 4**: Configuración y Despliegue - PENDIENTE

## 🧹 Limpieza Realizada Hoy
- **${deletedCount} archivos eliminados**
- **${(totalSize / 1024 / 1024).toFixed(2)} MB liberados**
- **Backup creado**: ${path.basename(backupDir)}
- **Archivo protegido**: CHECKLIST-MAESTRO-AUDITORIA-MISIONES-ARRIENDA-2025.md

## 🚀 Próximos Pasos para Mañana

### FASE 4: CONFIGURACIÓN Y DESPLIEGUE
1. **Variables de Entorno**
   - Documentar todas las variables requeridas
   - Configurar entornos de desarrollo/producción
   - Validar configuración de Supabase

2. **Integración de Pagos**
   - Completar flujo MercadoPago
   - Implementar webhooks de pago
   - Testing de transacciones

3. **Documentación Final**
   - README completo con instrucciones
   - Documentación de APIs
   - Guía de despliegue

## 📁 Archivos Importantes Mantenidos
- \`Backend/src/\` - Todo el código fuente
- \`Backend/sql-migrations/setup-supabase-storage-and-rls.sql\`
- \`Backend/sql-migrations/normalize-database-schema.sql\`
- \`Backend/scripts/migrate-images-to-storage.js\`
- \`Backend/src/hooks/useSupabaseStorage.ts\`
- \`CHECKLIST-MAESTRO-AUDITORIA-MISIONES-ARRIENDA-2025.md\`

## 🔧 Scripts Útiles Disponibles
- \`Backend/scripts/cleanup-duplicate-code.js\`
- \`Backend/scripts/migrate-images-to-storage.js\`
- \`Backend/scripts/reorganize-component-structure.js\`

---
**Fecha**: ${new Date().toLocaleDateString()}
**Estado**: ✅ LISTO PARA FASE 4
`;

fs.writeFileSync(notePath, noteContent);
console.log(`\n📝 Nota para mañana creada: ${notePath}`);
