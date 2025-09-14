/**
 * 🧹 SCRIPT DE LIMPIEZA DE CÓDIGO DUPLICADO
 * 
 * Este script identifica y elimina archivos duplicados, obsoletos y código redundante
 * para mejorar la estructura del proyecto y reducir la deuda técnica.
 */

const fs = require('fs');
const path = require('path');

// Configuración de limpieza
const PROJECT_ROOT = path.join(__dirname, '..');
const DRY_RUN = process.argv.includes('--dry-run'); // Solo mostrar, no eliminar

// Patrones de archivos a eliminar
const OBSOLETE_PATTERNS = [
  // Archivos con sufijos de versiones
  /.*-(FINAL|COMPLETADO|OLD|BACKUP|TEMP|TEST)\..*$/i,
  /.*-(v\d+|version\d+)\..*$/i,
  /.*\.(old|bak|tmp|temp)$/i,
  
  // Archivos específicos duplicados
  /useAuth\.ts$/, // Mantener solo useSupabaseAuth.ts
  /supabaseClient\.ts$/, // Mantener solo supabase/browser.ts
  
  // Scripts de testing obsoletos
  /test-.*-(complete|final|old|backup)\.js$/i,
  /verify-.*-(complete|final|old|backup)\.js$/i,
  
  // Reportes duplicados
  /REPORTE-.*-(FINAL|COMPLETADO)-.*\.md$/i,
  /SOLUCION-.*-(FINAL|COMPLETADO)-.*\.md$/i,
];

// Directorios a limpiar
const DIRECTORIES_TO_CLEAN = [
  'Backend/src',
  'Backend/sql-migrations',
  'Backend',
  '.' // Raíz del proyecto
];

// Archivos específicos a eliminar (ruta completa)
const SPECIFIC_FILES_TO_DELETE = [
  // Hooks duplicados
  'Backend/src/hooks/useAuth.ts',
  'Backend/src/hooks/useAuth-final.ts',
  
  // Clientes Supabase duplicados
  'Backend/src/lib/supabaseClient.ts',
  
  // Archivos de migración SQL obsoletos
  'Backend/sql-migrations/create-profile-tables-2025-FIXED.sql',
  'Backend/sql-migrations/create-profile-tables-2025-FINAL.sql',
  'Backend/sql-migrations/FIX-INDICES-PROFILE-VIEWS-2025.sql',
  'Backend/sql-migrations/FIX-INDICES-PROFILE-VIEWS-FINAL-2025.sql',
  'Backend/sql-migrations/FIX-ULTRA-FINAL-SIN-ERRORES-2025.sql',
  'Backend/sql-migrations/FIX-ABSOLUTO-FINAL-PERFECTO-2025.sql',
  'Backend/sql-migrations/FIX-PERFECTO-FINAL-2025.sql',
  
  // Scripts de testing obsoletos
  'Backend/test-supabase-refactor-complete.js',
  'Backend/test-supabase-refactor-final.js',
  'Backend/verify-legacy-neutralization-complete.js',
  'Backend/verify-legacy-neutralization-final.js',
  'Backend/test-neutralizacion-legacy-exhaustivo.js',
  'Backend/test-neutralizacion-final-preciso.js',
  
  // Reportes duplicados
  'REPORTE-FINAL-TESTING-Y-RENDIMIENTO-2025.md',
  'REPORTE-TESTING-EXHAUSTIVO-FINAL-2025.md',
  'REPORTE-FINAL-AUTH-PROVIDER-Y-RENDIMIENTO-2025.md',
  'NEUTRALIZACION-LEGACY-SUPABASE-COMPLETADA.md',
  'NEUTRALIZACION-LEGACY-SUPABASE-COMPLETADA-FINAL.md',
  'LEGACY-NEUTRALIZATION-COMPLETED.md',
];

// Contadores para estadísticas
let stats = {
  scanned: 0,
  deleted: 0,
  errors: 0,
  totalSize: 0,
  startTime: Date.now()
};

/**
 * Obtiene el tamaño de un archivo
 */
function getFileSize(filePath) {
  try {
    const stats = fs.statSync(filePath);
    return stats.size;
  } catch (error) {
    return 0;
  }
}

/**
 * Formatea el tamaño en bytes a formato legible
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Verifica si un archivo coincide con los patrones obsoletos
 */
function isObsoleteFile(fileName) {
  return OBSOLETE_PATTERNS.some(pattern => pattern.test(fileName));
}

/**
 * Elimina un archivo
 */
function deleteFile(filePath) {
  try {
    const size = getFileSize(filePath);
    
    if (DRY_RUN) {
      console.log(`🗑️  [DRY RUN] Eliminaría: ${filePath} (${formatBytes(size)})`);
    } else {
      fs.unlinkSync(filePath);
      console.log(`✅ Eliminado: ${filePath} (${formatBytes(size)})`);
    }
    
    stats.deleted++;
    stats.totalSize += size;
    return true;
  } catch (error) {
    console.error(`❌ Error eliminando ${filePath}:`, error.message);
    stats.errors++;
    return false;
  }
}

/**
 * Escanea un directorio recursivamente
 */
function scanDirectory(dirPath, basePath = '') {
  try {
    const items = fs.readdirSync(dirPath);
    
    for (const item of items) {
      const fullPath = path.join(dirPath, item);
      const relativePath = path.join(basePath, item);
      
      // Ignorar node_modules, .git, etc.
      if (item.startsWith('.') || item === 'node_modules') {
        continue;
      }
      
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        scanDirectory(fullPath, relativePath);
      } else if (stat.isFile()) {
        stats.scanned++;
        
        // Verificar si el archivo debe ser eliminado
        if (isObsoleteFile(item)) {
          deleteFile(fullPath);
        }
      }
    }
  } catch (error) {
    console.error(`❌ Error escaneando directorio ${dirPath}:`, error.message);
    stats.errors++;
  }
}

/**
 * Elimina archivos específicos
 */
function deleteSpecificFiles() {
  console.log('\n📋 Eliminando archivos específicos...');
  
  for (const filePath of SPECIFIC_FILES_TO_DELETE) {
    const fullPath = path.join(PROJECT_ROOT, filePath);
    
    if (fs.existsSync(fullPath)) {
      deleteFile(fullPath);
    } else {
      console.log(`⏭️  Ya eliminado o no existe: ${filePath}`);
    }
  }
}

/**
 * Actualiza importaciones después de eliminar archivos
 */
function updateImports() {
  console.log('\n🔄 Actualizando importaciones...');
  
  const filesToUpdate = [
    'Backend/src/components/auth-provider.tsx',
    'Backend/src/components/user-menu.tsx',
    'Backend/src/app/layout.tsx',
    'Backend/src/app/dashboard/page.tsx'
  ];
  
  for (const filePath of filesToUpdate) {
    const fullPath = path.join(PROJECT_ROOT, filePath);
    
    if (!fs.existsSync(fullPath)) {
      continue;
    }
    
    try {
      let content = fs.readFileSync(fullPath, 'utf8');
      let updated = false;
      
      // Reemplazar importaciones de useAuth por useSupabaseAuth
      if (content.includes("from '../hooks/useAuth'") || content.includes('from "@/hooks/useAuth"')) {
        content = content.replace(
          /from ['"]\.\.\/hooks\/useAuth['"]|from ['"]@\/hooks\/useAuth['"]/g,
          'from "@/hooks/useSupabaseAuth"'
        );
        updated = true;
      }
      
      // Reemplazar importaciones de supabaseClient
      if (content.includes("from '../lib/supabaseClient'") || content.includes('from "@/lib/supabaseClient"')) {
        content = content.replace(
          /from ['"]\.\.\/lib\/supabaseClient['"]|from ['"]@\/lib\/supabaseClient['"]/g,
          'from "@/lib/supabase/browser"'
        );
        updated = true;
      }
      
      if (updated) {
        if (DRY_RUN) {
          console.log(`🔄 [DRY RUN] Actualizaría importaciones en: ${filePath}`);
        } else {
          fs.writeFileSync(fullPath, content, 'utf8');
          console.log(`✅ Importaciones actualizadas en: ${filePath}`);
        }
      }
      
    } catch (error) {
      console.error(`❌ Error actualizando ${filePath}:`, error.message);
      stats.errors++;
    }
  }
}

/**
 * Limpia directorios vacíos
 */
function cleanEmptyDirectories(dirPath) {
  try {
    const items = fs.readdirSync(dirPath);
    
    // Procesar subdirectorios primero
    for (const item of items) {
      const fullPath = path.join(dirPath, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        cleanEmptyDirectories(fullPath);
      }
    }
    
    // Verificar si el directorio está vacío ahora
    const remainingItems = fs.readdirSync(dirPath);
    if (remainingItems.length === 0) {
      if (DRY_RUN) {
        console.log(`📁 [DRY RUN] Eliminaría directorio vacío: ${dirPath}`);
      } else {
        fs.rmdirSync(dirPath);
        console.log(`✅ Directorio vacío eliminado: ${dirPath}`);
      }
    }
    
  } catch (error) {
    // Ignorar errores de directorios que no se pueden eliminar
  }
}

/**
 * Genera reporte de archivos duplicados potenciales
 */
function generateDuplicateReport() {
  console.log('\n📊 Generando reporte de duplicados potenciales...');
  
  const fileMap = new Map();
  
  function scanForDuplicates(dirPath) {
    try {
      const items = fs.readdirSync(dirPath);
      
      for (const item of items) {
        const fullPath = path.join(dirPath, item);
        
        if (item.startsWith('.') || item === 'node_modules') {
          continue;
        }
        
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          scanForDuplicates(fullPath);
        } else if (stat.isFile()) {
          const baseName = item.replace(/-(final|completado|old|backup|temp|v\d+)(\.[^.]+)?$/i, '$2');
          
          if (!fileMap.has(baseName)) {
            fileMap.set(baseName, []);
          }
          
          fileMap.get(baseName).push({
            path: fullPath,
            name: item,
            size: stat.size
          });
        }
      }
    } catch (error) {
      // Ignorar errores de acceso
    }
  }
  
  scanForDuplicates(PROJECT_ROOT);
  
  console.log('\n🔍 Posibles duplicados encontrados:');
  let duplicatesFound = false;
  
  for (const [baseName, files] of fileMap) {
    if (files.length > 1) {
      duplicatesFound = true;
      console.log(`\n📄 ${baseName}:`);
      files.forEach(file => {
        console.log(`   - ${file.path} (${formatBytes(file.size)})`);
      });
    }
  }
  
  if (!duplicatesFound) {
    console.log('✅ No se encontraron duplicados obvios');
  }
}

/**
 * Función principal de limpieza
 */
async function cleanupProject() {
  console.log('🧹 Iniciando limpieza de código duplicado...\n');
  
  if (DRY_RUN) {
    console.log('🔍 MODO DRY RUN - Solo se mostrarán los cambios, no se ejecutarán\n');
  }
  
  // 1. Eliminar archivos específicos
  deleteSpecificFiles();
  
  // 2. Escanear directorios por patrones obsoletos
  console.log('\n🔍 Escaneando directorios por archivos obsoletos...');
  for (const dir of DIRECTORIES_TO_CLEAN) {
    const fullPath = path.join(PROJECT_ROOT, dir);
    if (fs.existsSync(fullPath)) {
      console.log(`📁 Escaneando: ${dir}`);
      scanDirectory(fullPath, dir);
    }
  }
  
  // 3. Actualizar importaciones
  updateImports();
  
  // 4. Limpiar directorios vacíos
  if (!DRY_RUN) {
    console.log('\n📁 Limpiando directorios vacíos...');
    for (const dir of DIRECTORIES_TO_CLEAN) {
      const fullPath = path.join(PROJECT_ROOT, dir);
      if (fs.existsSync(fullPath)) {
        cleanEmptyDirectories(fullPath);
      }
    }
  }
  
  // 5. Generar reporte de duplicados
  generateDuplicateReport();
  
  // Estadísticas finales
  const duration = (Date.now() - stats.startTime) / 1000;
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 RESUMEN DE LIMPIEZA');
  console.log('='.repeat(60));
  console.log(`⏱️  Duración: ${duration.toFixed(2)} segundos`);
  console.log(`📁 Archivos escaneados: ${stats.scanned}`);
  console.log(`🗑️  Archivos eliminados: ${stats.deleted}`);
  console.log(`💾 Espacio liberado: ${formatBytes(stats.totalSize)}`);
  console.log(`❌ Errores: ${stats.errors}`);
  
  if (DRY_RUN) {
    console.log('\n💡 Para ejecutar los cambios realmente, ejecuta sin --dry-run');
  } else if (stats.deleted > 0) {
    console.log('\n🎉 ¡Limpieza completada exitosamente!');
    console.log('💡 Recuerda hacer commit de los cambios y probar que todo funciona correctamente');
  }
}

/**
 * Función de verificación post-limpieza
 */
function verifyCleanup() {
  console.log('\n🔍 Verificando limpieza...');
  
  let issuesFound = 0;
  
  // Verificar que los archivos críticos existen
  const criticalFiles = [
    'Backend/src/hooks/useSupabaseAuth.ts',
    'Backend/src/lib/supabase/browser.ts',
    'Backend/src/lib/supabase/server.ts'
  ];
  
  for (const filePath of criticalFiles) {
    const fullPath = path.join(PROJECT_ROOT, filePath);
    if (!fs.existsSync(fullPath)) {
      console.error(`❌ Archivo crítico faltante: ${filePath}`);
      issuesFound++;
    } else {
      console.log(`✅ Archivo crítico presente: ${filePath}`);
    }
  }
  
  // Verificar que los archivos duplicados fueron eliminados
  const shouldBeDeleted = [
    'Backend/src/hooks/useAuth.ts',
    'Backend/src/lib/supabaseClient.ts'
  ];
  
  for (const filePath of shouldBeDeleted) {
    const fullPath = path.join(PROJECT_ROOT, filePath);
    if (fs.existsSync(fullPath)) {
      console.error(`❌ Archivo duplicado aún presente: ${filePath}`);
      issuesFound++;
    } else {
      console.log(`✅ Archivo duplicado eliminado: ${filePath}`);
    }
  }
  
  if (issuesFound === 0) {
    console.log('\n✅ ¡Verificación completada sin problemas!');
  } else {
    console.log(`\n⚠️  Se encontraron ${issuesFound} problemas que requieren atención`);
  }
}

// Ejecutar limpieza
if (require.main === module) {
  (async () => {
    try {
      await cleanupProject();
      if (!DRY_RUN) {
        verifyCleanup();
      }
    } catch (error) {
      console.error('❌ Error fatal:', error.message);
      process.exit(1);
    }
  })();
}

module.exports = {
  cleanupProject,
  verifyCleanup
};
