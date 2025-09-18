/**
 * FASE 3.3: LIMPIEZA Y OPTIMIZACIÓN DEL CÓDIGO
 * Script para eliminar código de debug, console.log y optimizar el proyecto
 * Misiones Arrienda - 2025
 */

const fs = require('fs');
const path = require('path');

// Colores para output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(80));
  log(title, 'bold');
  console.log('='.repeat(80));
}

function logSubSection(title) {
  console.log('\n' + '-'.repeat(60));
  log(title, 'cyan');
  console.log('-'.repeat(60));
}

// Patrones de código a limpiar
const cleanupPatterns = {
  // Console logs de debug
  consoleLogs: [
    /console\.log\([^)]*\);?\s*\n?/g,
    /console\.debug\([^)]*\);?\s*\n?/g,
    /console\.info\([^)]*\);?\s*\n?/g,
    /console\.warn\([^)]*\);?\s*\n?/g,
    // Mantener console.error para producción
  ],
  
  // Comentarios de debug
  debugComments: [
    /\/\/ TODO:.*\n/g,
    /\/\/ FIXME:.*\n/g,
    /\/\/ DEBUG:.*\n/g,
    /\/\/ TEMP:.*\n/g,
    /\/\*\s*DEBUG[\s\S]*?\*\//g,
    /\/\*\s*TODO[\s\S]*?\*\//g,
  ],
  
  // Código comentado
  commentedCode: [
    /\/\*[\s\S]*?console\.log[\s\S]*?\*\//g,
    /\/\/\s*console\.log.*\n/g,
    /\/\/\s*debugger.*\n/g,
  ],
  
  // Imports no utilizados (patrones comunes)
  unusedImports: [
    /import\s+{\s*}\s+from\s+['"][^'"]+['"];\s*\n/g,
    /import\s+\*\s+as\s+\w+\s+from\s+['"][^'"]+['"];\s*\/\/\s*unused\s*\n/g,
  ],
  
  // Líneas vacías excesivas
  excessiveEmptyLines: [
    /\n\s*\n\s*\n\s*\n/g, // 4+ líneas vacías -> 2 líneas
  ],
  
  // Debugger statements
  debuggerStatements: [
    /debugger;?\s*\n?/g,
  ]
};

// Archivos y directorios a procesar
const targetDirectories = [
  'Backend/src',
  'src' // Si existe en la raíz
];

// Extensiones de archivo a procesar
const targetExtensions = ['.js', '.jsx', '.ts', '.tsx', '.vue'];

// Archivos a excluir del procesamiento
const excludeFiles = [
  'node_modules',
  '.git',
  '.next',
  'dist',
  'build',
  '.env',
  'package-lock.json',
  'yarn.lock'
];

// Función para verificar si un archivo debe ser procesado
function shouldProcessFile(filePath) {
  // Verificar extensión
  const ext = path.extname(filePath);
  if (!targetExtensions.includes(ext)) {
    return false;
  }
  
  // Verificar exclusiones
  for (const exclude of excludeFiles) {
    if (filePath.includes(exclude)) {
      return false;
    }
  }
  
  return true;
}

// Función para obtener todos los archivos a procesar
function getFilesToProcess() {
  const files = [];
  
  for (const dir of targetDirectories) {
    const fullDirPath = path.join(__dirname, dir);
    if (fs.existsSync(fullDirPath)) {
      const dirFiles = getFilesRecursively(fullDirPath);
      files.push(...dirFiles);
    }
  }
  
  return files.filter(shouldProcessFile);
}

// Función recursiva para obtener archivos
function getFilesRecursively(dir) {
  const files = [];
  
  try {
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        files.push(...getFilesRecursively(fullPath));
      } else {
        files.push(fullPath);
      }
    }
  } catch (error) {
    // Ignorar errores de acceso a directorios
  }
  
  return files;
}

// Función para limpiar console.log
function cleanConsoleLogs(content, filePath) {
  let cleanedContent = content;
  let removedCount = 0;
  
  for (const pattern of cleanupPatterns.consoleLogs) {
    const matches = cleanedContent.match(pattern);
    if (matches) {
      removedCount += matches.length;
      cleanedContent = cleanedContent.replace(pattern, '');
    }
  }
  
  return { content: cleanedContent, removedCount };
}

// Función para limpiar comentarios de debug
function cleanDebugComments(content) {
  let cleanedContent = content;
  let removedCount = 0;
  
  for (const pattern of cleanupPatterns.debugComments) {
    const matches = cleanedContent.match(pattern);
    if (matches) {
      removedCount += matches.length;
      cleanedContent = cleanedContent.replace(pattern, '');
    }
  }
  
  return { content: cleanedContent, removedCount };
}

// Función para limpiar código comentado
function cleanCommentedCode(content) {
  let cleanedContent = content;
  let removedCount = 0;
  
  for (const pattern of cleanupPatterns.commentedCode) {
    const matches = cleanedContent.match(pattern);
    if (matches) {
      removedCount += matches.length;
      cleanedContent = cleanedContent.replace(pattern, '');
    }
  }
  
  return { content: cleanedContent, removedCount };
}

// Función para limpiar debugger statements
function cleanDebuggerStatements(content) {
  let cleanedContent = content;
  let removedCount = 0;
  
  for (const pattern of cleanupPatterns.debuggerStatements) {
    const matches = cleanedContent.match(pattern);
    if (matches) {
      removedCount += matches.length;
      cleanedContent = cleanedContent.replace(pattern, '');
    }
  }
  
  return { content: cleanedContent, removedCount };
}

// Función para normalizar líneas vacías
function normalizeEmptyLines(content) {
  let cleanedContent = content;
  
  // Reemplazar 3+ líneas vacías con 2 líneas vacías
  cleanedContent = cleanedContent.replace(/\n\s*\n\s*\n+/g, '\n\n');
  
  // Limpiar espacios al final de líneas
  cleanedContent = cleanedContent.replace(/[ \t]+$/gm, '');
  
  return cleanedContent;
}

// Función para analizar imports no utilizados (básico)
function analyzeUnusedImports(content, filePath) {
  const issues = [];
  const lines = content.split('\n');
  
  lines.forEach((line, index) => {
    // Detectar imports que podrían no estar siendo usados
    if (line.includes('import') && line.includes('//') && line.includes('unused')) {
      issues.push({
        line: index + 1,
        content: line.trim(),
        type: 'unused_import'
      });
    }
  });
  
  return issues;
}

// Función principal para limpiar un archivo
function cleanFile(filePath) {
  try {
    const originalContent = fs.readFileSync(filePath, 'utf8');
    let cleanedContent = originalContent;
    
    const stats = {
      consoleLogs: 0,
      debugComments: 0,
      commentedCode: 0,
      debuggerStatements: 0,
      unusedImports: 0
    };
    
    // 1. Limpiar console.log
    const consoleResult = cleanConsoleLogs(cleanedContent, filePath);
    cleanedContent = consoleResult.content;
    stats.consoleLogs = consoleResult.removedCount;
    
    // 2. Limpiar comentarios de debug
    const commentsResult = cleanDebugComments(cleanedContent);
    cleanedContent = commentsResult.content;
    stats.debugComments = commentsResult.removedCount;
    
    // 3. Limpiar código comentado
    const commentedCodeResult = cleanCommentedCode(cleanedContent);
    cleanedContent = commentedCodeResult.content;
    stats.commentedCode = commentedCodeResult.removedCount;
    
    // 4. Limpiar debugger statements
    const debuggerResult = cleanDebuggerStatements(cleanedContent);
    cleanedContent = debuggerResult.content;
    stats.debuggerStatements = debuggerResult.removedCount;
    
    // 5. Normalizar líneas vacías
    cleanedContent = normalizeEmptyLines(cleanedContent);
    
    // 6. Analizar imports no utilizados
    const unusedImports = analyzeUnusedImports(cleanedContent, filePath);
    stats.unusedImports = unusedImports.length;
    
    // Solo escribir si hay cambios
    if (cleanedContent !== originalContent) {
      fs.writeFileSync(filePath, cleanedContent, 'utf8');
      return { success: true, stats, changed: true };
    }
    
    return { success: true, stats, changed: false };
    
  } catch (error) {
    return { success: false, error: error.message, stats: null };
  }
}

// Función para crear backup de archivos importantes
function createBackup() {
  const backupDir = path.join(__dirname, `cleanup-backup-${Date.now()}`);
  
  try {
    fs.mkdirSync(backupDir, { recursive: true });
    
    // Backup de archivos críticos
    const criticalFiles = [
      'Backend/src/lib/supabase/browser.ts',
      'Backend/src/lib/supabase/server.ts',
      'Backend/src/contexts/UserContext.tsx',
      'Backend/src/hooks/useSupabaseAuth.ts',
      'Backend/src/app/api/users/favorites/route.ts'
    ];
    
    let backedUpFiles = 0;
    
    for (const file of criticalFiles) {
      const sourcePath = path.join(__dirname, file);
      if (fs.existsSync(sourcePath)) {
        const backupPath = path.join(backupDir, file);
        const backupFileDir = path.dirname(backupPath);
        
        fs.mkdirSync(backupFileDir, { recursive: true });
        fs.copyFileSync(sourcePath, backupPath);
        backedUpFiles++;
      }
    }
    
    log(`✅ Backup creado: ${backupDir}`, 'green');
    log(`📁 Archivos respaldados: ${backedUpFiles}`, 'blue');
    
    return backupDir;
    
  } catch (error) {
    log(`❌ Error creando backup: ${error.message}`, 'red');
    return null;
  }
}

// Función principal de limpieza
async function runCodeCleanup() {
  logSection('🧹 FASE 3.3: LIMPIEZA Y OPTIMIZACIÓN DEL CÓDIGO');
  log('Iniciando limpieza exhaustiva del código...', 'blue');
  
  const results = {
    timestamp: new Date().toISOString(),
    backupDir: null,
    processedFiles: 0,
    changedFiles: 0,
    totalStats: {
      consoleLogs: 0,
      debugComments: 0,
      commentedCode: 0,
      debuggerStatements: 0,
      unusedImports: 0
    },
    errors: []
  };
  
  try {
    // 1. Crear backup
    logSubSection('📁 CREANDO BACKUP DE SEGURIDAD');
    results.backupDir = createBackup();
    
    // 2. Obtener archivos a procesar
    logSubSection('🔍 IDENTIFICANDO ARCHIVOS A PROCESAR');
    const filesToProcess = getFilesToProcess();
    log(`📊 Archivos encontrados: ${filesToProcess.length}`, 'blue');
    
    // 3. Procesar archivos
    logSubSection('🧹 PROCESANDO ARCHIVOS');
    
    for (const filePath of filesToProcess) {
      const relativePath = path.relative(__dirname, filePath);
      log(`🔧 Procesando: ${relativePath}`, 'cyan');
      
      const result = cleanFile(filePath);
      results.processedFiles++;
      
      if (result.success) {
        if (result.changed) {
          results.changedFiles++;
          log(`  ✅ Limpiado exitosamente`, 'green');
          
          // Acumular estadísticas
          if (result.stats) {
            results.totalStats.consoleLogs += result.stats.consoleLogs;
            results.totalStats.debugComments += result.stats.debugComments;
            results.totalStats.commentedCode += result.stats.commentedCode;
            results.totalStats.debuggerStatements += result.stats.debuggerStatements;
            results.totalStats.unusedImports += result.stats.unusedImports;
            
            // Mostrar detalles si hay cambios significativos
            const totalChanges = Object.values(result.stats).reduce((a, b) => a + b, 0);
            if (totalChanges > 0) {
              log(`    📊 Console.log: ${result.stats.consoleLogs}`, 'yellow');
              log(`    📊 Comentarios debug: ${result.stats.debugComments}`, 'yellow');
              log(`    📊 Código comentado: ${result.stats.commentedCode}`, 'yellow');
              log(`    📊 Debugger statements: ${result.stats.debuggerStatements}`, 'yellow');
            }
          }
        } else {
          log(`  ✅ Sin cambios necesarios`, 'green');
        }
      } else {
        log(`  ❌ Error: ${result.error}`, 'red');
        results.errors.push({
          file: relativePath,
          error: result.error
        });
      }
    }
    
    // 4. Limpiar archivos temporales específicos
    logSubSection('🗑️ LIMPIANDO ARCHIVOS TEMPORALES');
    await cleanupTemporaryFiles();
    
    // 5. Mostrar resumen
    logSection('📊 RESUMEN DE LIMPIEZA');
    
    log(`📁 Archivos procesados: ${results.processedFiles}`, 'blue');
    log(`✏️ Archivos modificados: ${results.changedFiles}`, 'green');
    log(`❌ Errores encontrados: ${results.errors.length}`, results.errors.length > 0 ? 'red' : 'green');
    
    log('\n🧹 Elementos eliminados:', 'bold');
    log(`  📝 Console.log: ${results.totalStats.consoleLogs}`, 'yellow');
    log(`  💬 Comentarios debug: ${results.totalStats.debugComments}`, 'yellow');
    log(`  📄 Código comentado: ${results.totalStats.commentedCode}`, 'yellow');
    log(`  🐛 Debugger statements: ${results.totalStats.debuggerStatements}`, 'yellow');
    log(`  📦 Imports sospechosos: ${results.totalStats.unusedImports}`, 'yellow');
    
    // 6. Recomendaciones
    logSection('💡 RECOMENDACIONES POST-LIMPIEZA');
    
    if (results.changedFiles > 0) {
      log('✅ Limpieza completada exitosamente', 'green');
      log('🔧 Recomendaciones:', 'blue');
      log('  1. Ejecutar npm run build para verificar que no hay errores', 'blue');
      log('  2. Probar funcionalidades críticas manualmente', 'blue');
      log('  3. Ejecutar tests automatizados si existen', 'blue');
      log('  4. Revisar console.error que se mantuvieron (son importantes)', 'blue');
    } else {
      log('✅ El código ya estaba limpio', 'green');
    }
    
    if (results.errors.length > 0) {
      log('\n⚠️ Errores encontrados:', 'yellow');
      results.errors.forEach(error => {
        log(`  ❌ ${error.file}: ${error.error}`, 'red');
      });
    }
    
    // 7. Guardar reporte
    const reportContent = `# 🧹 REPORTE LIMPIEZA DE CÓDIGO - FASE 3.3

## 📊 RESUMEN EJECUTIVO
- **Fecha:** ${new Date().toLocaleString()}
- **Archivos procesados:** ${results.processedFiles}
- **Archivos modificados:** ${results.changedFiles}
- **Errores:** ${results.errors.length}

## 🧹 ELEMENTOS ELIMINADOS
- **Console.log:** ${results.totalStats.consoleLogs}
- **Comentarios debug:** ${results.totalStats.debugComments}
- **Código comentado:** ${results.totalStats.commentedCode}
- **Debugger statements:** ${results.totalStats.debuggerStatements}
- **Imports sospechosos:** ${results.totalStats.unusedImports}

## 📁 BACKUP
- **Directorio:** ${results.backupDir || 'No creado'}

## ❌ ERRORES
${results.errors.length > 0 ? 
  results.errors.map(e => `- **${e.file}:** ${e.error}`).join('\n') : 
  'No se encontraron errores'}

## ✅ ESTADO FINAL
${results.changedFiles > 0 ? 
  'Código limpiado exitosamente. Listo para testing y producción.' : 
  'El código ya estaba en buen estado.'}

---
*Reporte generado automáticamente - ${new Date().toISOString()}*
`;

    fs.writeFileSync(path.join(__dirname, 'REPORTE-LIMPIEZA-CODIGO-FASE-3-3.md'), reportContent);
    log('\n📝 Reporte guardado en: REPORTE-LIMPIEZA-CODIGO-FASE-3-3.md', 'blue');
    
    return results;
    
  } catch (error) {
    log(`❌ Error durante la limpieza: ${error.message}`, 'red');
    console.error(error);
    return null;
  }
}

// Función para limpiar archivos temporales específicos
async function cleanupTemporaryFiles() {
  const tempFiles = [
    // Archivos de testing temporales
    'test-temp.js',
    'debug-temp.js',
    'temp-script.js',
    
    // Logs temporales
    'debug.log',
    'temp.log',
    'error.log',
    
    // Archivos de backup antiguos
    'backup-*.js',
    '*.backup',
    '*.tmp'
  ];
  
  let removedFiles = 0;
  
  for (const pattern of tempFiles) {
    try {
      const files = getFilesToProcess().filter(file => {
        const fileName = path.basename(file);
        return fileName.includes(pattern.replace('*', ''));
      });
      
      for (const file of files) {
        try {
          fs.unlinkSync(file);
          removedFiles++;
          log(`  🗑️ Eliminado: ${path.relative(__dirname, file)}`, 'yellow');
        } catch (error) {
          // Ignorar errores de archivos que no se pueden eliminar
        }
      }
    } catch (error) {
      // Ignorar errores de patrones
    }
  }
  
  log(`📊 Archivos temporales eliminados: ${removedFiles}`, 'blue');
}

// Ejecutar limpieza
if (require.main === module) {
  runCodeCleanup().then(results => {
    if (results && results.errors.length === 0) {
      log('\n🎉 LIMPIEZA DE CÓDIGO COMPLETADA EXITOSAMENTE', 'green');
      process.exit(0);
    } else {
      log('\n⚠️ LIMPIEZA COMPLETADA CON OBSERVACIONES', 'yellow');
      process.exit(1);
    }
  }).catch(error => {
    log(`❌ Error fatal en limpieza: ${error.message}`, 'red');
    process.exit(1);
  });
}

module.exports = { runCodeCleanup };
