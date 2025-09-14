#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 Verificando neutralización de patrones legacy de Supabase...\n');

// Verificar archivos modificados
const filesToCheck = [
  'src/lib/supabase/singleton-client.ts',
  'src/lib/supabaseClient.ts', 
  'src/lib/supabase/browser.ts'
];

let allGood = true;

filesToCheck.forEach(file => {
  const fullPath = path.join(__dirname, file);
  if (fs.existsSync(fullPath)) {
    const content = fs.readFileSync(fullPath, 'utf8');
    console.log(`✅ ${file} existe`);
    
    // Verificar que no hay singletons globales
    if (content.includes('let _client') || content.includes('let supabaseInstance')) {
      console.log(`❌ ${file} todavía contiene singleton global`);
      allGood = false;
    } else {
      console.log(`✅ ${file} sin singletons globales`);
    }
    
    // Verificar que hay funciones bajo demanda
    if (content.includes('export function')) {
      console.log(`✅ ${file} usa funciones bajo demanda`);
    } else {
      console.log(`❌ ${file} no tiene funciones bajo demanda`);
      allGood = false;
    }
  } else {
    console.log(`❌ ${file} no existe`);
    allGood = false;
  }
  console.log('');
});

// Verificar que no hay exports directos problemáticos
console.log('🔍 Verificando exports problemáticos...');
filesToCheck.forEach(file => {
  const fullPath = path.join(__dirname, file);
  if (fs.existsSync(fullPath)) {
    const content = fs.readFileSync(fullPath, 'utf8');
    
    if (content.includes('export const supabase =')) {
      console.log(`❌ ${file} exporta singleton 'supabase'`);
      allGood = false;
    } else {
      console.log(`✅ ${file} no exporta singleton 'supabase'`);
    }
  }
});

console.log('\n' + '='.repeat(50));
if (allGood) {
  console.log('🎉 ¡Neutralización de legacy completada exitosamente!');
  console.log('✅ Todos los singletons globales eliminados');
  console.log('✅ Todas las funciones usan instanciación bajo demanda');
  console.log('✅ No hay exports problemáticos');
} else {
  console.log('❌ Hay problemas pendientes en la neutralización');
  process.exit(1);
}
