#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 AUDITORÍA: Error EINVAL readlink en comunidad/layout.js\n');

// 1. Verificar estructura del directorio .next
console.log('📁 1. Verificando estructura .next...');
const nextDir = path.join(__dirname, '.next');

if (fs.existsSync(nextDir)) {
  console.log('✅ Directorio .next existe');
  
  // Verificar chunks específicos
  const chunksDir = path.join(nextDir, 'static', 'chunks', 'app', 'comunidad');
  if (fs.existsSync(chunksDir)) {
    console.log('⚠️  Directorio chunks/app/comunidad existe');
    
    try {
      const files = fs.readdirSync(chunksDir);
      console.log(`   Archivos encontrados: ${files.join(', ')}`);
      
      // Verificar si hay enlaces simbólicos problemáticos
      files.forEach(file => {
        const filePath = path.join(chunksDir, file);
        try {
          const stats = fs.lstatSync(filePath);
          if (stats.isSymbolicLink()) {
            console.log(`   ❌ ENLACE SIMBÓLICO DETECTADO: ${file}`);
            try {
              const target = fs.readlinkSync(filePath);
              console.log(`      Target: ${target}`);
            } catch (e) {
              console.log(`      ❌ Error leyendo enlace: ${e.message}`);
            }
          }
        } catch (e) {
          console.log(`   ❌ Error verificando ${file}: ${e.message}`);
        }
      });
    } catch (e) {
      console.log(`   ❌ Error leyendo directorio: ${e.message}`);
    }
  } else {
    console.log('✅ Directorio chunks/app/comunidad no existe (normal)');
  }
} else {
  console.log('✅ Directorio .next no existe (normal para inicio limpio)');
}

console.log('\n📄 2. Verificando archivo fuente comunidad/layout.tsx...');
const layoutPath = path.join(__dirname, 'src', 'app', 'comunidad', 'layout.tsx');

if (fs.existsSync(layoutPath)) {
  console.log('✅ Archivo layout.tsx existe');
  
  const content = fs.readFileSync(layoutPath, 'utf8');
  
  // Verificar problemas comunes
  const issues = [];
  
  if (content.includes('export default async function')) {
    issues.push('Layout es async (puede causar problemas)');
  }
  
  if (content.includes('use client')) {
    issues.push('Layout tiene "use client" (puede causar conflictos)');
  }
  
  if (!content.includes('export default function')) {
    issues.push('No tiene export default function');
  }
  
  if (content.includes('import') && !content.includes('React')) {
    // Verificar imports problemáticos
    const imports = content.match(/import.*from.*/g) || [];
    imports.forEach(imp => {
      if (imp.includes('./') || imp.includes('../')) {
        issues.push(`Import relativo: ${imp}`);
      }
    });
  }
  
  if (issues.length > 0) {
    console.log('⚠️  Problemas potenciales encontrados:');
    issues.forEach(issue => console.log(`   - ${issue}`));
  } else {
    console.log('✅ No se encontraron problemas obvios en el código');
  }
  
} else {
  console.log('❌ Archivo layout.tsx no encontrado');
}

console.log('\n🔧 3. Verificando configuración Next.js...');
const configPath = path.join(__dirname, 'next.config.js');

if (fs.existsSync(configPath)) {
  console.log('✅ next.config.js existe');
  
  const configContent = fs.readFileSync(configPath, 'utf8');
  
  if (configContent.includes('outputFileTracingRoot')) {
    console.log('✅ outputFileTracingRoot configurado');
  } else {
    console.log('⚠️  outputFileTracingRoot no configurado');
  }
  
  if (configContent.includes('experimental')) {
    console.log('✅ Configuración experimental presente');
  }
  
} else {
  console.log('❌ next.config.js no encontrado');
}

console.log('\n💡 4. Recomendaciones de solución:');
console.log('   1. Limpiar completamente .next y node_modules');
console.log('   2. Verificar que no hay caracteres especiales en rutas');
console.log('   3. Asegurar que layout.tsx no tiene problemas de sintaxis');
console.log('   4. Considerar deshabilitar file tracing si persiste');
console.log('   5. Verificar permisos de archivos en Windows');

console.log('\n🚀 5. Comandos de limpieza sugeridos:');
console.log('   - Remove-Item -Recurse -Force .next');
console.log('   - Remove-Item -Recurse -Force node_modules');
console.log('   - npm install');
console.log('   - npm run dev');
