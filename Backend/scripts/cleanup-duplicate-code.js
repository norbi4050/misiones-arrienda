/**
 * 🧹 SCRIPT DE LIMPIEZA DE CÓDIGO DUPLICADO
 * 
 * Identifica y elimina archivos duplicados, código obsoleto y dependencias no utilizadas
 * FASE 2: OPTIMIZACIÓN DE RENDIMIENTO
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuración
const config = {
  projectRoot: path.join(__dirname, '..'),
  backupDir: path.join(__dirname, '..', '_backups', `cleanup-${Date.now()}`),
  dryRun: process.argv.includes('--dry-run'),
  verbose: process.argv.includes('--verbose')
};

// Estadísticas de limpieza
const stats = {
  filesAnalyzed: 0,
  duplicatesFound: 0,
  filesDeleted: 0,
  bytesFreed: 0,
  errors: [],
  startTime: new Date()
};

/**
 * Archivos y patrones a eliminar
 */
const cleanupPatterns = {
  // Archivos duplicados identificados en la auditoría
  duplicateFiles: [
    'src/hooks/useAuth.ts', // Duplicado de useSupabaseAuth.ts
    'src/hooks/useAuth-final.ts', // Versión obsoleta
    'src/components/auth-provider-old.tsx', // Versión obsoleta
    'src/lib/supabaseClient-old.ts', // Versión obsoleta
  ],

  // Archivos de prueba y desarrollo
  testFiles: [
    'test-*.js',
    'verify-*.js',
    'audit-*.js',
    'check-*.js',
    'diagnostico-*.js',
    'fix-*.js',
    '*-test.js',
    '*-spec.js'
  ],

  // Archivos de reportes y documentación temporal
  tempReports: [
    'REPORTE-*.md',
    'ANALISIS-*.md',
    'SOLUCION-*.md',
    'INSTRUCCIONES-*.md',
    'TODO-*.md',
    'PLAN-*.md',
    'ESTADO-*.md',
    'PROGRESO-*.md'
  ],

  // Archivos de migración SQL obsoletos
  obsoleteSql: [
    'sql-migrations/*-FIXED.sql',
    'sql-migrations/*-FINAL.sql',
    'sql-migrations/*-DEFINITIVO.sql',
    'sql-migrations/*-ULTRA-*.sql',
    'sql-migrations/*-ABSOLUTO-*.sql',
    'sql-migrations/*-PERFECTO-*.sql'
  ],

  // Archivos de configuración duplicados
  configDuplicates: [
    'next.config-old.js',
    'tailwind.config-backup.ts',
    'tsconfig-backup.json'
  ]
};

/**
 * Dependencias potencialmente no utilizadas
 */
const suspiciousDependencies = [
  '@prisma/client', // Si se migró completamente a Supabase
  'prisma', // Si se migró completamente a Supabase
  'bcryptjs', // Si se usa auth de Supabase
  'jsonwebtoken', // Si se usa auth de Supabase
  'cookie-parser', // Si se usan cookies de Next.js
  'cors', // Si se usa middleware de Next.js
];

/**
 * Crea backup de archivos antes de eliminar
 */
function createBackup(filePath) {
  if (config.dryRun) return;

  try {
    const relativePath = path.relative(config.projectRoot, filePath);
    const backupPath = path.join(config.backupDir, relativePath);
    const backupDir = path.dirname(backupPath);

    // Crear directorio de backup
    fs.mkdirSync(backupDir, { recursive: true });

    // Copiar archivo
    fs.copyFileSync(filePath, backupPath);

    if (config.verbose) {
      console.log(`   📦 Backup creado: ${relativePath}`);
    }
  } catch (error) {
    stats.errors.push(`Error creando backup de ${filePath}: ${error.message}`);
  }
}

/**
 * Obtiene el tamaño de un archivo
 */
function getFileSize(filePath) {
  try {
    return fs.statSync(filePath).size;
  } catch {
    return 0;
  }
}

/**
 * Busca archivos que coincidan con un patrón
 */
function findFiles(pattern, baseDir = config.projectRoot) {
  const files = [];
  
  try {
    const command = `find "${baseDir}" -name "${pattern}" -type f 2>/dev/null || true`;
    const output = execSync(command, { encoding: 'utf8' });
    
    if (output.trim()) {
      files.push(...output.trim().split('\n'));
    }
  } catch (error) {
    // En Windows, usar alternativa
    try {
      const walkDir = (dir) => {
        const items = fs.readdirSync(dir);
        
        items.forEach(item => {
          const fullPath = path.join(dir, item);
          const stat = fs.statSync(fullPath);
          
          if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
            walkDir(fullPath);
          } else if (stat.isFile()) {
            const minimatch = require('minimatch');
            if (minimatch(item, pattern)) {
              files.push(fullPath);
            }
          }
        });
      };
      
      walkDir(baseDir);
    } catch (walkError) {
      stats.errors.push(`Error buscando archivos ${pattern}: ${walkError.message}`);
    }
  }
  
  return files;
}

/**
 * Elimina archivos duplicados específicos
 */
function cleanupDuplicateFiles() {
  console.log('\n🔍 Limpiando archivos duplicados...');
  
  cleanupPatterns.duplicateFiles.forEach(filePath => {
    const fullPath = path.join(config.projectRoot, filePath);
    
    if (fs.existsSync(fullPath)) {
      const size = getFileSize(fullPath);
      
      console.log(`   🗑️  Eliminando: ${filePath} (${(size / 1024).toFixed(1)} KB)`);
      
      if (!config.dryRun) {
        createBackup(fullPath);
        fs.unlinkSync(fullPath);
        stats.filesDeleted++;
        stats.bytesFreed += size;
      }
      
      stats.duplicatesFound++;
    }
  });
}

/**
 * Limpia archivos de prueba y desarrollo
 */
function cleanupTestFiles() {
  console.log('\n🧪 Limpiando archivos de prueba y desarrollo...');
  
  cleanupPatterns.testFiles.forEach(pattern => {
    const files = findFiles(pattern);
    
    files.forEach(filePath => {
      // Excluir archivos en __tests__ y jest.config.js
      if (filePath.includes('__tests__') || filePath.includes('jest.')) {
        return;
      }
      
      const size = getFileSize(filePath);
      const relativePath = path.relative(config.projectRoot, filePath);
      
      console.log(`   🗑️  Eliminando: ${relativePath} (${(size / 1024).toFixed(1)} KB)`);
      
      if (!config.dryRun) {
        createBackup(filePath);
        fs.unlinkSync(filePath);
        stats.filesDeleted++;
        stats.bytesFreed += size;
      }
    });
  });
}

/**
 * Limpia reportes temporales
 */
function cleanupTempReports() {
  console.log('\n📄 Limpiando reportes y documentación temporal...');
  
  cleanupPatterns.tempReports.forEach(pattern => {
    const files = findFiles(pattern);
    
    files.forEach(filePath => {
      // Preservar README.md y documentación importante
      if (filePath.includes('README.md') || filePath.includes('CHANGELOG.md')) {
        return;
      }
      
      const size = getFileSize(filePath);
      const relativePath = path.relative(config.projectRoot, filePath);
      
      console.log(`   🗑️  Eliminando: ${relativePath} (${(size / 1024).toFixed(1)} KB)`);
      
      if (!config.dryRun) {
        createBackup(filePath);
        fs.unlinkSync(filePath);
        stats.filesDeleted++;
        stats.bytesFreed += size;
      }
    });
  });
}

/**
 * Limpia migraciones SQL obsoletas
 */
function cleanupObsoleteSql() {
  console.log('\n🗄️  Limpiando migraciones SQL obsoletas...');
  
  cleanupPatterns.obsoleteSql.forEach(pattern => {
    const files = findFiles(pattern, path.join(config.projectRoot, 'sql-migrations'));
    
    files.forEach(filePath => {
      const size = getFileSize(filePath);
      const relativePath = path.relative(config.projectRoot, filePath);
      
      console.log(`   🗑️  Eliminando: ${relativePath} (${(size / 1024).toFixed(1)} KB)`);
      
      if (!config.dryRun) {
        createBackup(filePath);
        fs.unlinkSync(filePath);
        stats.filesDeleted++;
        stats.bytesFreed += size;
      }
    });
  });
}

/**
 * Analiza dependencias no utilizadas
 */
function analyzeDependencies() {
  console.log('\n📦 Analizando dependencias...');
  
  try {
    const packageJsonPath = path.join(config.projectRoot, 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    const allDeps = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies
    };
    
    console.log(`   📊 Total dependencias: ${Object.keys(allDeps).length}`);
    
    // Buscar dependencias sospechosas
    const foundSuspicious = [];
    
    suspiciousDependencies.forEach(dep => {
      if (allDeps[dep]) {
        foundSuspicious.push(dep);
      }
    });
    
    if (foundSuspicious.length > 0) {
      console.log('\n   ⚠️  Dependencias potencialmente no utilizadas:');
      foundSuspicious.forEach(dep => {
        console.log(`      - ${dep}`);
      });
      console.log('\n   💡 Revisa manualmente si estas dependencias son necesarias');
    } else {
      console.log('   ✅ No se encontraron dependencias sospechosas');
    }
    
  } catch (error) {
    stats.errors.push(`Error analizando dependencias: ${error.message}`);
  }
}

/**
 * Limpia directorios vacíos
 */
function cleanupEmptyDirectories() {
  console.log('\n📁 Limpiando directorios vacíos...');
  
  const cleanEmptyDirs = (dir) => {
    try {
      const items = fs.readdirSync(dir);
      
      if (items.length === 0) {
        const relativePath = path.relative(config.projectRoot, dir);
        console.log(`   🗑️  Eliminando directorio vacío: ${relativePath}`);
        
        if (!config.dryRun) {
          fs.rmdirSync(dir);
        }
        return true;
      }
      
      let isEmpty = true;
      items.forEach(item => {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          if (!cleanEmptyDirs(fullPath)) {
            isEmpty = false;
          }
        } else {
          isEmpty = false;
        }
      });
      
      if (isEmpty && items.length === 0) {
        const relativePath = path.relative(config.projectRoot, dir);
        console.log(`   🗑️  Eliminando directorio vacío: ${relativePath}`);
        
        if (!config.dryRun) {
          fs.rmdirSync(dir);
        }
        return true;
      }
      
      return false;
    } catch (error) {
      return false;
    }
  };
  
  // Limpiar directorios específicos
  const dirsToCheck = [
    path.join(config.projectRoot, 'sql-migrations'),
    path.join(config.projectRoot, 'scripts'),
    path.join(config.projectRoot, 'src', 'components'),
    path.join(config.projectRoot, 'src', 'hooks'),
    path.join(config.projectRoot, 'src', 'lib')
  ];
  
  dirsToCheck.forEach(dir => {
    if (fs.existsSync(dir)) {
      cleanEmptyDirs(dir);
    }
  });
}

/**
 * Genera reporte de limpieza
 */
function generateReport() {
  const endTime = new Date();
  const duration = (endTime - stats.startTime) / 1000;
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 REPORTE DE LIMPIEZA COMPLETADO');
  console.log('='.repeat(60));
  console.log(`⏱️  Duración: ${duration.toFixed(2)} segundos`);
  console.log(`📁 Archivos analizados: ${stats.filesAnalyzed}`);
  console.log(`🔍 Duplicados encontrados: ${stats.duplicatesFound}`);
  console.log(`🗑️  Archivos eliminados: ${stats.filesDeleted}`);
  console.log(`💾 Espacio liberado: ${(stats.bytesFreed / 1024 / 1024).toFixed(2)} MB`);
  console.log(`❌ Errores: ${stats.errors.length}`);
  
  if (config.dryRun) {
    console.log('\n⚠️  MODO DRY-RUN: No se eliminaron archivos realmente');
  } else {
    console.log(`\n📦 Backup creado en: ${config.backupDir}`);
  }
  
  if (stats.errors.length > 0) {
    console.log('\n⚠️  ERRORES ENCONTRADOS:');
    stats.errors.forEach((error, index) => {
      console.log(`${index + 1}. ${error}`);
    });
  }
  
  // Guardar reporte
  const reportPath = path.join(config.projectRoot, 'cleanup-report.json');
  const report = {
    ...stats,
    endTime,
    duration,
    config,
    timestamp: new Date().toISOString()
  };
  
  if (!config.dryRun) {
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📄 Reporte detallado guardado en: cleanup-report.json`);
  }
}

/**
 * Función principal
 */
async function main() {
  console.log('🧹 INICIANDO LIMPIEZA DE CÓDIGO DUPLICADO');
  console.log('='.repeat(60));
  
  if (config.dryRun) {
    console.log('⚠️  MODO DRY-RUN: Solo se mostrarán los cambios, no se ejecutarán');
  }
  
  try {
    // Crear directorio de backup
    if (!config.dryRun) {
      fs.mkdirSync(config.backupDir, { recursive: true });
    }
    
    // Ejecutar limpiezas
    cleanupDuplicateFiles();
    cleanupTestFiles();
    cleanupTempReports();
    cleanupObsoleteSql();
    analyzeDependencies();
    cleanupEmptyDirectories();
    
    // Generar reporte
    generateReport();
    
    console.log('\n🎉 ¡LIMPIEZA COMPLETADA EXITOSAMENTE!');
    
  } catch (error) {
    console.error('\n❌ ERROR CRÍTICO EN LA LIMPIEZA:');
    console.error(error.message);
    process.exit(1);
  }
}

// Ejecutar
if (require.main === module) {
  main();
}

module.exports = {
  cleanupPatterns,
  stats,
  main
};
