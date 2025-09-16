#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 Diagnosticando error 500 en /api/properties...');

// Función para probar el endpoint
async function testPropertiesEndpoint() {
  try {
    console.log('📡 Probando endpoint /api/properties...');
    
    const response = await fetch('http://localhost:3000/api/properties');
    
    console.log('📊 Respuesta del servidor:');
    console.log('  Status:', response.status);
    console.log('  Status Text:', response.statusText);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Endpoint funcionando correctamente');
      console.log('  Propiedades encontradas:', data.items?.length || 0);
      return true;
    } else {
      console.log('❌ Error en endpoint');
      const errorText = await response.text();
      console.log('  Error response:', errorText);
      return false;
    }
  } catch (error) {
    console.log('❌ Error de conexión:', error.message);
    return false;
  }
}

// Función para verificar archivos relacionados
function checkRelatedFiles() {
  console.log('📁 Verificando archivos relacionados...');
  
  const filesToCheck = [
    'src/app/api/properties/route.ts',
    'src/app/api/properties/[id]/route.ts',
    'src/lib/supabaseClient.ts',
    'src/lib/supabase/browser.ts',
    'src/lib/supabase/server.ts'
  ];
  
  filesToCheck.forEach(file => {
    const fullPath = path.join(__dirname, file);
    if (fs.existsSync(fullPath)) {
      console.log(`  ✅ ${file} - Existe`);
    } else {
      console.log(`  ❌ ${file} - No encontrado`);
    }
  });
}

// Función para verificar configuración de Next.js
function checkNextConfig() {
  console.log('⚙️ Verificando configuración de Next.js...');
  
  const nextConfigPath = path.join(__dirname, 'next.config.js');
  if (fs.existsSync(nextConfigPath)) {
    const content = fs.readFileSync(nextConfigPath, 'utf8');
    console.log('  ✅ next.config.js encontrado');
    
    // Verificar configuraciones importantes
    if (content.includes('experimental')) {
      console.log('  ⚠️ Configuraciones experimentales detectadas');
    }
    if (content.includes('serverComponentsExternalPackages')) {
      console.log('  ✅ serverComponentsExternalPackages configurado');
    }
  } else {
    console.log('  ❌ next.config.js no encontrado');
  }
}

// Función principal
async function main() {
  console.log('🚀 Iniciando diagnóstico completo...\n');
  
  // 1. Verificar archivos
  checkRelatedFiles();
  console.log('');
  
  // 2. Verificar configuración
  checkNextConfig();
  console.log('');
  
  // 3. Probar endpoint (solo si el servidor está corriendo)
  console.log('🔗 Intentando conectar al servidor...');
  const endpointWorking = await testPropertiesEndpoint();
  
  console.log('\n📋 RESUMEN DEL DIAGNÓSTICO:');
  console.log('================================');
  
  if (endpointWorking) {
    console.log('✅ El endpoint /api/properties está funcionando correctamente');
    console.log('💡 El error 500 puede ser intermitente o estar relacionado con:');
    console.log('   - Problemas de conexión a la base de datos');
    console.log('   - Errores en el cliente (frontend)');
    console.log('   - Problemas de caché del navegador');
  } else {
    console.log('❌ El endpoint /api/properties tiene problemas');
    console.log('🔧 Posibles soluciones:');
    console.log('   1. Reiniciar el servidor de desarrollo');
    console.log('   2. Verificar la configuración de Supabase');
    console.log('   3. Revisar los logs del servidor');
    console.log('   4. Limpiar caché del navegador');
  }
  
  console.log('\n🚀 Comandos recomendados:');
  console.log('   npm run dev          # Reiniciar servidor');
  console.log('   Ctrl+Shift+R         # Limpiar caché del navegador');
  console.log('   F12 > Network        # Revisar requests en DevTools');
}

// Ejecutar diagnóstico
main().catch(error => {
  console.error('❌ Error durante el diagnóstico:', error.message);
});
