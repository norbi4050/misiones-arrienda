#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 Verificando refactor completo de Supabase...\n');

// Archivos a verificar
const files = [
  'src/lib/supabase/singleton-client.ts',
  'src/lib/supabaseClient.ts', 
  'src/lib/supabase/browser.ts'
];

let allGood = true;

files.forEach(file => {
  const filePath = path.join(__dirname, file);
  
  if (!fs.existsSync(filePath)) {
    console.log(`❌ ${file} - No existe`);
    allGood = false;
    return;
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  
  console.log(`📁 ${file}:`);
  
  // Verificaciones específicas por archivo
  if (file.includes('singleton-client.ts')) {
    const hasCreateClientImport = content.includes("import { createClient } from './client'");
    const hasGetSupabaseClient = content.includes('export function getSupabaseClient()');
    const noSingleton = !content.includes('let supabaseInstance');
    const noDirectExport = !content.includes('export const supabase =');
    
    console.log(`  ✅ Import createClient: ${hasCreateClientImport}`);
    console.log(`  ✅ Función getSupabaseClient: ${hasGetSupabaseClient}`);
    console.log(`  ✅ Sin singleton: ${noSingleton}`);
    console.log(`  ✅ Sin export directo: ${noDirectExport}`);
    
    if (!hasCreateClientImport || !hasGetSupabaseClient || !noSingleton || !noDirectExport) {
      allGood = false;
    }
  }
  
  if (file.includes('supabaseClient.ts')) {
    const hasCreateClientImport = content.includes("import { createClient } from './supabase/client'");
    const hasGetBrowserSupabase = content.includes('export function getBrowserSupabase()');
    const noDirectExport = !content.includes('export const supabase');
    
    console.log(`  ✅ Import createClient: ${hasCreateClientImport}`);
    console.log(`  ✅ Función getBrowserSupabase: ${hasGetBrowserSupabase}`);
    console.log(`  ✅ Sin export directo: ${noDirectExport}`);
    
    if (!hasCreateClientImport || !hasGetBrowserSupabase || !noDirectExport) {
      allGood = false;
    }
  }
  
  if (file.includes('browser.ts')) {
    const hasGetBrowserClient = content.includes('export function getBrowserClient()');
    const noGlobalCache = !content.includes('let _client');
    const hasEnvValidation = content.includes('if (!url || !anon)');
    
    console.log(`  ✅ Función getBrowserClient: ${hasGetBrowserClient}`);
    console.log(`  ✅ Sin cache global: ${noGlobalCache}`);
    console.log(`  ✅ Validación env: ${hasEnvValidation}`);
    
    if (!hasGetBrowserClient || !noGlobalCache || !hasEnvValidation) {
      allGood = false;
    }
  }
  
  console.log('');
});

// Verificar que dashboard sigue funcionando
const dashboardPath = path.join(__dirname, 'src/app/dashboard/page.tsx');
if (fs.existsSync(dashboardPath)) {
  const dashboardContent = fs.readFileSync(dashboardPath, 'utf8');
  const hasCorrectImport = dashboardContent.includes('import { getBrowserSupabase } from "@/lib/supabaseClient"');
  const usesFunction = dashboardContent.includes('getBrowserSupabase()');
  
  console.log('📁 Dashboard compatibility:');
  console.log(`  ✅ Import correcto: ${hasCorrectImport}`);
  console.log(`  ✅ Usa función: ${usesFunction}`);
  
  if (!hasCorrectImport || !usesFunction) {
    allGood = false;
  }
} else {
  console.log('⚠️  Dashboard no encontrado');
}

console.log('\n' + '='.repeat(50));

if (allGood) {
  console.log('🎉 ¡REFACTOR COMPLETADO EXITOSAMENTE!');
  console.log('✅ Todos los singletons eliminados');
  console.log('✅ Funciones bajo demanda implementadas');
  console.log('✅ Compatibilidad preservada');
  console.log('✅ Validaciones de env agregadas');
} else {
  console.log('❌ Hay problemas en el refactor');
  process.exit(1);
}
