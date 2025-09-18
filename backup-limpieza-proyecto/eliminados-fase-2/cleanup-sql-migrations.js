/**
 * 🧹 LIMPIEZA ESPECÍFICA DE SQL-MIGRATIONS
 * 
 * Analiza y limpia archivos innecesarios en la carpeta sql-migrations
 */

const fs = require('fs');
const path = require('path');

const sqlMigrationsPath = path.join(__dirname, 'Backend', 'sql-migrations');
const backupDir = path.join(__dirname, '_backups', 'sql-migrations-cleanup-' + Date.now());

// Archivos SQL IMPORTANTES que NO se deben eliminar
const criticalSqlFiles = [
  'normalize-database-schema.sql',
  'setup-supabase-storage-and-rls.sql',
  'setup-avatars-bucket-storage.sql'
];

// Archivos SQL INNECESARIOS que se pueden eliminar
const unnecessarySqlFiles = [
  // Auditorías
  'AUDITORIA-ESTADO-ACTUAL-SUPABASE-2025.sql',
  'AUDITORIA-FINAL-PERFIL-USUARIO-2025.sql', 
  'AUDITORIA-SIMPLE-SUPABASE-2025.sql',
  
  // Reportes en SQL
  'REPORTE-FINAL-PERFIL-DATOS-REALES-COMPLETADO-2025.sql',
  
  // Verificaciones y diagnósticos
  'VERIFICAR-ESTRUCTURA-PROFILE-VIEWS-2025.sql',
  'verify-profile-tables-phase-4.sql',
  'DIAGNOSTICO-Y-CORRECCION-AUTH-2025.sql',
  
  // Datos de prueba
  'COMPLETAR-DATOS-FINAL-2025.sql',
  'PASO-1-crear-tablas-basicas.sql'
];

// Directorios completos a eliminar
const unnecessaryDirectories = [
  'core',    // Múltiples versiones del mismo archivo
  'data',    // Solo datos de prueba
  'fixes'    // Solo fixes temporales
];

let deletedCount = 0;
let totalSize = 0;

console.log('🧹 INICIANDO LIMPIEZA DE SQL-MIGRATIONS');
console.log('='.repeat(50));

// Crear backup
fs.mkdirSync(backupDir, { recursive: true });

function deleteFileWithBackup(filePath) {
  try {
    const fullPath = path.join(sqlMigrationsPath, filePath);
    
    if (fs.existsSync(fullPath)) {
      const stat = fs.statSync(fullPath);
      
      // Crear backup
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
    return false;
  }
}

function deleteDirectoryWithBackup(dirName) {
  try {
    const dirPath = path.join(sqlMigrationsPath, dirName);
    
    if (fs.existsSync(dirPath)) {
      // Crear backup del directorio
      const backupPath = path.join(backupDir, dirName);
      
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
      copyDirectory(dirPath, backupPath);
      removeDirectory(dirPath);
      
      console.log(`   ✅ Directorio eliminado: ${dirName}/`);
      return true;
    } else {
      console.log(`   ⚠️  Directorio no existe: ${dirName}/`);
      return false;
    }
  } catch (error) {
    console.error(`   ❌ Error eliminando directorio ${dirName}: ${error.message}`);
    return false;
  }
}

// Mostrar archivos críticos que se mantendrán
console.log('\n✅ ARCHIVOS SQL CRÍTICOS (SE MANTIENEN):');
criticalSqlFiles.forEach(file => {
  const filePath = path.join(sqlMigrationsPath, file);
  if (fs.existsSync(filePath)) {
    console.log(`   🔒 ${file}`);
  } else {
    console.log(`   ⚠️  ${file} (no encontrado)`);
  }
});

// Eliminar archivos innecesarios
console.log('\n🗑️  ELIMINANDO ARCHIVOS SQL INNECESARIOS:');
unnecessarySqlFiles.forEach(file => {
  deleteFileWithBackup(file);
});

// Eliminar directorios completos
console.log('\n📂 ELIMINANDO DIRECTORIOS COMPLETOS:');
unnecessaryDirectories.forEach(dir => {
  deleteDirectoryWithBackup(dir);
});

// Verificar archivos restantes
console.log('\n📋 ARCHIVOS RESTANTES EN SQL-MIGRATIONS:');
if (fs.existsSync(sqlMigrationsPath)) {
  const remainingFiles = fs.readdirSync(sqlMigrationsPath);
  remainingFiles.forEach(file => {
    const filePath = path.join(sqlMigrationsPath, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isFile()) {
      console.log(`   📄 ${file}`);
    } else if (stat.isDirectory()) {
      console.log(`   📁 ${file}/`);
    }
  });
  
  console.log(`\n📊 Total archivos restantes: ${remainingFiles.length}`);
} else {
  console.log('   ❌ Directorio sql-migrations no existe');
}

// Resumen final
console.log('\n' + '='.repeat(50));
console.log('🎉 LIMPIEZA DE SQL-MIGRATIONS COMPLETADA');
console.log('='.repeat(50));
console.log(`📊 Archivos eliminados: ${deletedCount}`);
console.log(`💾 Espacio liberado: ${(totalSize / 1024).toFixed(2)} KB`);
console.log(`🔒 Backup creado en: ${backupDir}`);

console.log('\n✅ ARCHIVOS SQL IMPORTANTES MANTENIDOS:');
criticalSqlFiles.forEach(file => {
  console.log(`   - ${file}`);
});

console.log('\n💡 PRÓXIMOS PASOS:');
console.log('   1. ✅ Verificar que los archivos importantes siguen disponibles');
console.log('   2. 🧪 Probar que las migraciones funcionan correctamente');
console.log('   3. 🚀 Continuar con Fase 4 del proyecto');

console.log('\n✨ ¡SQL-MIGRATIONS LIMPIO Y OPTIMIZADO!');
