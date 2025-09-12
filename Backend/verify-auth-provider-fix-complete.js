const fs = require('fs');
const path = require('path');

console.log('🔍 VERIFICACIÓN FINAL: Error "getBrowserSupabase is not a function"');
console.log('=' .repeat(70));

// Verificar estado de archivos críticos
const checks = [
  {
    name: 'supabaseClient.ts',
    path: 'src/lib/supabaseClient.ts',
    expectedContent: ['export function getBrowserSupabase', 'createClient'],
    description: 'Debe exportar getBrowserSupabase que llama a createClient'
  },
  {
    name: 'auth-provider.tsx',
    path: 'src/components/auth-provider.tsx',
    expectedContent: ['import { getBrowserSupabase } from "@/lib/supabaseClient"', 'const supabase = getBrowserSupabase()'],
    description: 'Debe importar y usar getBrowserSupabase correctamente'
  },
  {
    name: 'client.ts',
    path: 'src/lib/supabase/client.ts',
    expectedContent: ['export function createClient', 'createBrowserClient'],
    description: 'Debe exportar createClient que usa createBrowserClient'
  },
  {
    name: 'browser.ts',
    path: 'src/lib/supabase/browser.ts',
    expectedContent: ['getBrowserClient'],
    notExpectedContent: ['getBrowserSupabase'],
    description: 'NO debe exportar getBrowserSupabase (para evitar conflictos)'
  }
];

let allChecksPass = true;

checks.forEach(check => {
  console.log(`\n📁 Verificando ${check.name}:`);
  const fullPath = path.join(__dirname, check.path);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`❌ Archivo no encontrado: ${check.path}`);
    allChecksPass = false;
    return;
  }
  
  const content = fs.readFileSync(fullPath, 'utf8');
  
  // Verificar contenido esperado
  const hasExpectedContent = check.expectedContent.every(expected => 
    content.includes(expected)
  );
  
  // Verificar contenido no esperado
  const hasUnexpectedContent = check.notExpectedContent ? 
    check.notExpectedContent.some(unexpected => content.includes(unexpected)) : false;
  
  if (hasExpectedContent && !hasUnexpectedContent) {
    console.log(`✅ ${check.name} - CORRECTO`);
    console.log(`   ${check.description}`);
  } else {
    console.log(`❌ ${check.name} - PROBLEMA DETECTADO`);
    console.log(`   ${check.description}`);
    
    if (!hasExpectedContent) {
      console.log(`   Falta contenido esperado: ${check.expectedContent.join(', ')}`);
    }
    
    if (hasUnexpectedContent) {
      console.log(`   Contiene contenido no deseado: ${check.notExpectedContent.join(', ')}`);
    }
    
    allChecksPass = false;
  }
});

// Verificar que cache fue limpiado
console.log('\n🧹 Verificando limpieza de cache:');
const cacheDirectories = ['.next', 'node_modules/.cache'];
let cacheClean = true;

cacheDirectories.forEach(dir => {
  const fullPath = path.join(__dirname, dir);
  if (fs.existsSync(fullPath)) {
    console.log(`⚠️  ${dir} existe - cache no limpiado completamente`);
    cacheClean = false;
  } else {
    console.log(`✅ ${dir} no existe - cache limpio`);
  }
});

// Resultado final
console.log('\n' + '='.repeat(70));
if (allChecksPass && cacheClean) {
  console.log('🎉 VERIFICACIÓN EXITOSA - TODO CORRECTO');
  console.log('\n🚀 PRÓXIMOS PASOS:');
  console.log('1. El servidor de desarrollo debe reiniciarse automáticamente');
  console.log('2. Verificar en el navegador que no hay errores');
  console.log('3. Confirmar que auth-provider.tsx funciona correctamente');
  console.log('\n✅ El error "getBrowserSupabase is not a function" debe estar resuelto');
} else {
  console.log('⚠️  VERIFICACIÓN INCOMPLETA - REVISAR PROBLEMAS ARRIBA');
  console.log('\n🔧 ACCIONES REQUERIDAS:');
  if (!allChecksPass) {
    console.log('- Corregir archivos con problemas detectados');
  }
  if (!cacheClean) {
    console.log('- Limpiar cache manualmente: rm -rf .next node_modules/.cache');
  }
}

console.log('\n📋 RESUMEN TÉCNICO:');
console.log('- Patrón: On-demand client creation (sin singletons)');
console.log('- Import: getBrowserSupabase desde @/lib/supabaseClient');
console.log('- Cache: Limpiado para evitar versiones obsoletas');
console.log('- Conflictos: Eliminados en browser.ts');
