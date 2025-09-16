#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🚨 DIAGNÓSTICO CRÍTICO: Error 500 en servidor');
console.log('================================================');

// Verificar estructura de directorios
function checkProjectStructure() {
  console.log('📁 Verificando estructura del proyecto...');
  
  const rootSrc = path.join(__dirname, '../src');
  const backendSrc = path.join(__dirname, 'src');
  
  console.log('');
  console.log('🔍 Estructura encontrada:');
  
  if (fs.existsSync(rootSrc)) {
    console.log('  ✅ /src/ (raíz) - EXISTE');
    const rootFiles = fs.readdirSync(rootSrc);
    console.log(`     Contiene: ${rootFiles.slice(0, 5).join(', ')}${rootFiles.length > 5 ? '...' : ''}`);
  } else {
    console.log('  ❌ /src/ (raíz) - NO EXISTE');
  }
  
  if (fs.existsSync(backendSrc)) {
    console.log('  ✅ /Backend/src/ - EXISTE');
    const backendFiles = fs.readdirSync(backendSrc);
    console.log(`     Contiene: ${backendFiles.slice(0, 5).join(', ')}${backendFiles.length > 5 ? '...' : ''}`);
  } else {
    console.log('  ❌ /Backend/src/ - NO EXISTE');
  }
  
  return { hasRootSrc: fs.existsSync(rootSrc), hasBackendSrc: fs.existsSync(backendSrc) };
}

// Verificar package.json
function checkPackageJson() {
  console.log('');
  console.log('📦 Verificando package.json...');
  
  const rootPackage = path.join(__dirname, '../package.json');
  const backendPackage = path.join(__dirname, 'package.json');
  
  if (fs.existsSync(rootPackage)) {
    console.log('  ✅ package.json (raíz) - EXISTE');
    try {
      const content = JSON.parse(fs.readFileSync(rootPackage, 'utf8'));
      console.log(`     Scripts: ${Object.keys(content.scripts || {}).join(', ')}`);
    } catch (e) {
      console.log('     ⚠️ Error leyendo package.json de raíz');
    }
  }
  
  if (fs.existsSync(backendPackage)) {
    console.log('  ✅ package.json (Backend) - EXISTE');
    try {
      const content = JSON.parse(fs.readFileSync(backendPackage, 'utf8'));
      console.log(`     Scripts: ${Object.keys(content.scripts || {}).join(', ')}`);
    } catch (e) {
      console.log('     ⚠️ Error leyendo package.json de Backend');
    }
  }
}

// Verificar next.config.js
function checkNextConfig() {
  console.log('');
  console.log('⚙️ Verificando next.config.js...');
  
  const rootNext = path.join(__dirname, '../next.config.js');
  const backendNext = path.join(__dirname, 'next.config.js');
  
  if (fs.existsSync(rootNext)) {
    console.log('  ✅ next.config.js (raíz) - EXISTE');
  }
  
  if (fs.existsSync(backendNext)) {
    console.log('  ✅ next.config.js (Backend) - EXISTE');
  }
}

// Función principal de diagnóstico
function main() {
  console.log('🔍 Iniciando diagnóstico del error 500...');
  
  const structure = checkProjectStructure();
  checkPackageJson();
  checkNextConfig();
  
  console.log('');
  console.log('📋 DIAGNÓSTICO COMPLETO:');
  console.log('========================');
  
  if (structure.hasRootSrc && structure.hasBackendSrc) {
    console.log('❌ PROBLEMA IDENTIFICADO: Estructura duplicada');
    console.log('');
    console.log('🔧 CAUSA DEL ERROR 500:');
    console.log('   El proyecto tiene archivos en dos ubicaciones:');
    console.log('   - /src/ (raíz del proyecto)');
    console.log('   - /Backend/src/ (subdirectorio Backend)');
    console.log('');
    console.log('   Next.js está intentando ejecutar desde la raíz pero');
    console.log('   los archivos actualizados están en /Backend/src/');
    console.log('');
    console.log('💡 SOLUCIONES RECOMENDADAS:');
    console.log('');
    console.log('   OPCIÓN A - Ejecutar desde Backend:');
    console.log('   1. cd Backend');
    console.log('   2. npm run dev');
    console.log('   3. Abrir http://localhost:3000');
    console.log('');
    console.log('   OPCIÓN B - Copiar archivos a raíz:');
    console.log('   1. Copiar Backend/src/* a src/');
    console.log('   2. npm run dev (desde raíz)');
    console.log('');
    console.log('   OPCIÓN C - Limpiar estructura:');
    console.log('   1. Decidir una ubicación única');
    console.log('   2. Eliminar la otra');
    console.log('   3. Actualizar configuraciones');
    
  } else if (structure.hasBackendSrc && !structure.hasRootSrc) {
    console.log('✅ SOLUCIÓN IDENTIFICADA: Ejecutar desde Backend');
    console.log('');
    console.log('🚀 PASOS PARA CORREGIR:');
    console.log('   1. cd Backend');
    console.log('   2. npm run dev');
    console.log('   3. El servidor debería funcionar correctamente');
    
  } else if (structure.hasRootSrc && !structure.hasBackendSrc) {
    console.log('⚠️ PROBLEMA: Archivos en raíz pero correcciones en Backend');
    console.log('');
    console.log('🔧 NECESARIO: Copiar correcciones a la raíz');
    
  } else {
    console.log('❌ PROBLEMA CRÍTICO: No se encontró estructura válida');
  }
  
  console.log('');
  console.log('🎯 RECOMENDACIÓN INMEDIATA:');
  console.log('   Ejecuta: cd Backend && npm run dev');
  console.log('   Esto debería resolver el error 500');
}

// Ejecutar diagnóstico
main();
