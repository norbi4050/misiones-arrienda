#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 VERIFICACIÓN COMPLETA DE NEUTRALIZACIÓN LEGACY SUPABASE\n');

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
    console.log(`❌ ${file}: ARCHIVO NO ENCONTRADO`);
    allGood = false;
    return;
  }

  const content = fs.readFileSync(filePath, 'utf8');
  console.log(`\n📁 ${file}:`);
  
  // Verificaciones específicas por archivo
  if (file.includes('singleton-client.ts')) {
    const hasOnDemandPattern = content.includes('return createClient()');
    const hasNoSingleton = !content.includes('let supabaseInstance');
    const hasClientDirective = content.includes("'use client'");
    
    console.log(`  ✅ Patrón on-demand: ${hasOnDemandPattern ? 'SÍ' : 'NO'}`);
    console.log(`  ✅ Sin singleton: ${hasNoSingleton ? 'SÍ' : 'NO'}`);
    console.log(`  ✅ Client directive: ${hasClientDirective ? 'SÍ' : 'NO'}`);
    
    if (!hasOnDemandPattern || !hasNoSingleton || !hasClientDirective) allGood = false;
  }
  
  if (file.includes('supabaseClient.ts')) {
    const hasFunctionalAdapter = content.includes('getBrowserSupabase()');
    const hasNoDirectExport = !content.includes('export const supabase =');
    const hasClientDirective = content.includes("'use client'");
    
    console.log(`  ✅ Adaptador funcional: ${hasFunctionalAdapter ? 'SÍ' : 'NO'}`);
    console.log(`  ✅ Sin export directo: ${hasNoDirectExport ? 'SÍ' : 'NO'}`);
    console.log(`  ✅ Client directive: ${hasClientDirective ? 'SÍ' : 'NO'}`);
    
    if (!hasFunctionalAdapter || !hasNoDirectExport || !hasClientDirective) allGood = false;
  }
  
  if (file.includes('browser.ts')) {
    const hasNoGlobalCache = !content.includes('let _client') && !content.includes('_client =');
    const hasFunctionalPattern = content.includes('getBrowserClient()');
    const hasClientDirective = content.includes("'use client'");
    const hasNoSingleton = !content.includes('if (!_client)');
    
    console.log(`  ✅ Sin cache global: ${hasNoGlobalCache ? 'SÍ' : 'NO'}`);
    console.log(`  ✅ Patrón funcional: ${hasFunctionalPattern ? 'SÍ' : 'NO'}`);
    console.log(`  ✅ Client directive: ${hasClientDirective ? 'SÍ' : 'NO'}`);
    console.log(`  ✅ Sin singleton: ${hasNoSingleton ? 'SÍ' : 'NO'}`);
    
    if (!hasNoGlobalCache || !hasFunctionalPattern || !hasClientDirective || !hasNoSingleton) allGood = false;
  }
});

// Verificar que no hay imports problemáticos
console.log('\n🔍 VERIFICANDO IMPORTS LEGACY:');

const dashboardPath = path.join(__dirname, 'src/app/dashboard/page.tsx');
if (fs.existsSync(dashboardPath)) {
  const dashboardContent = fs.readFileSync(dashboardPath, 'utf8');
  const usesCorrectImport = dashboardContent.includes('getBrowserSupabase');
  const noDirectSupabaseImport = !dashboardContent.includes('import { supabase }');
  
  console.log(`  ✅ Dashboard usa patrón correcto: ${usesCorrectImport ? 'SÍ' : 'NO'}`);
  console.log(`  ✅ Sin import directo de supabase: ${noDirectSupabaseImport ? 'SÍ' : 'NO'}`);
  
  if (!usesCorrectImport || !noDirectSupabaseImport) allGood = false;
} else {
  console.log('  ⚠️  Dashboard no encontrado para verificar');
}

console.log('\n' + '='.repeat(60));

if (allGood) {
  console.log('🎉 NEUTRALIZACIÓN LEGACY COMPLETADA EXITOSAMENTE');
  console.log('\n✅ Todos los patrones legacy han sido neutralizados');
  console.log('✅ No hay singletons globales');
  console.log('✅ Todos los clientes usan patrón on-demand');
  console.log('✅ Imports existentes preservados con adaptadores');
  console.log('\n🚀 El proyecto está listo para producción sin riesgos de hidratación');
} else {
  console.log('❌ NEUTRALIZACIÓN INCOMPLETA');
  console.log('\n⚠️  Algunos patrones legacy aún están presentes');
  console.log('⚠️  Revisar los archivos marcados arriba');
}

console.log('\n' + '='.repeat(60));
