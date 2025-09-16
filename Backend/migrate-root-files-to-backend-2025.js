#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('📦 Migrando archivos necesarios de la raíz a Backend...');

// Función para copiar archivo si no existe en destino
function copyFileIfNeeded(srcPath, destPath, description) {
  try {
    if (fs.existsSync(srcPath)) {
      if (!fs.existsSync(destPath)) {
        // Crear directorio si no existe
        const destDir = path.dirname(destPath);
        if (!fs.existsSync(destDir)) {
          fs.mkdirSync(destDir, { recursive: true });
        }
        
        fs.copyFileSync(srcPath, destPath);
        console.log(`✅ Copiado: ${description}`);
        return true;
      } else {
        console.log(`⚠️ Ya existe: ${description}`);
        return false;
      }
    } else {
      console.log(`❌ No encontrado: ${srcPath}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Error copiando ${description}:`, error.message);
    return false;
  }
}

// Función para mover directorio completo
function moveDirectoryIfNeeded(srcPath, destPath, description) {
  try {
    if (fs.existsSync(srcPath)) {
      if (!fs.existsSync(destPath)) {
        // Crear directorio destino
        fs.mkdirSync(destPath, { recursive: true });
        
        // Copiar todos los archivos recursivamente
        function copyRecursive(src, dest) {
          const items = fs.readdirSync(src);
          
          items.forEach(item => {
            const srcItem = path.join(src, item);
            const destItem = path.join(dest, item);
            
            if (fs.statSync(srcItem).isDirectory()) {
              fs.mkdirSync(destItem, { recursive: true });
              copyRecursive(srcItem, destItem);
            } else {
              fs.copyFileSync(srcItem, destItem);
            }
          });
        }
        
        copyRecursive(srcPath, destPath);
        console.log(`✅ Migrado directorio: ${description}`);
        return true;
      } else {
        console.log(`⚠️ Ya existe directorio: ${description}`);
        return false;
      }
    } else {
      console.log(`❌ No encontrado directorio: ${srcPath}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Error migrando ${description}:`, error.message);
    return false;
  }
}

// Lista de archivos a migrar de la raíz a Backend
const filesToMigrate = [
  // Archivos de configuración críticos
  {
    src: path.join(__dirname, '../tailwind.config.ts'),
    dest: path.join(__dirname, 'tailwind.config.ts'),
    desc: 'tailwind.config.ts'
  },
  {
    src: path.join(__dirname, '../postcss.config.js'),
    dest: path.join(__dirname, 'postcss.config.js'),
    desc: 'postcss.config.js'
  },
  {
    src: path.join(__dirname, '../tsconfig.json'),
    dest: path.join(__dirname, 'tsconfig.json'),
    desc: 'tsconfig.json'
  },
  {
    src: path.join(__dirname, '../next.config.js'),
    dest: path.join(__dirname, 'next.config.js'),
    desc: 'next.config.js (backup)'
  }
];

// Directorios a migrar
const directoriesToMigrate = [
  {
    src: path.join(__dirname, '../src'),
    dest: path.join(__dirname, 'src-root-backup'),
    desc: 'src/ (como backup)'
  }
];

console.log('🚀 Iniciando migración...\n');

let filesMigrated = 0;
let directoriesMigrated = 0;

// Migrar archivos individuales
console.log('📄 Migrando archivos de configuración...');
filesToMigrate.forEach(file => {
  if (copyFileIfNeeded(file.src, file.dest, file.desc)) {
    filesMigrated++;
  }
});

console.log('\n📁 Migrando directorios...');
directoriesToMigrate.forEach(dir => {
  if (moveDirectoryIfNeeded(dir.src, dir.dest, dir.desc)) {
    directoriesMigrated++;
  }
});

// Verificar que Backend tiene todo lo necesario
console.log('\n🔍 Verificando estructura de Backend...');

const criticalFiles = [
  'package.json',
  'next.config.js', 
  'tailwind.config.ts',
  'postcss.config.js',
  'tsconfig.json',
  'src/app/layout.tsx',
  'src/app/page.tsx',
  'src/app/globals.css'
];

let missingFiles = [];

criticalFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    console.log(`  ✅ ${file}`);
  } else {
    console.log(`  ❌ ${file} - FALTANTE`);
    missingFiles.push(file);
  }
});

console.log('\n📊 RESUMEN DE MIGRACIÓN:');
console.log('========================');
console.log(`📄 Archivos migrados: ${filesMigrated}`);
console.log(`📁 Directorios migrados: ${directoriesMigrated}`);
console.log(`❌ Archivos faltantes: ${missingFiles.length}`);

if (missingFiles.length > 0) {
  console.log('\n⚠️ ARCHIVOS FALTANTES:');
  missingFiles.forEach(file => console.log(`   - ${file}`));
}

console.log('\n🎯 PRÓXIMOS PASOS:');
console.log('1. cd Backend');
console.log('2. npm install (si es necesario)');
console.log('3. npm run dev');
console.log('4. Abrir http://localhost:3000');

console.log('\n✅ Migración completada!');
