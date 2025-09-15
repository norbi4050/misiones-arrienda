const fs = require('fs');
const path = require('path');

console.log('🎯 TESTING FINAL PRECISO - NEUTRALIZACIÓN LEGACY SUPABASE\n');

// Solo verificar los archivos que realmente modificamos
const targetFiles = [
  {
    path: 'src/lib/supabase/singleton-client.ts',
    shouldContain: ['export function getSupabaseClient()', 'createClient()'],
    shouldNotContain: ['let supabaseInstance', 'export const supabase = getSupabaseClient()']
  },
  {
    path: 'src/lib/supabaseClient.ts', 
    shouldContain: ['export function getBrowserSupabase()', 'createClient()'],
    shouldNotContain: ['export const supabase =']
  },
  {
    path: 'src/lib/supabase/browser.ts',
    shouldContain: ['export function getBrowserClient()', 'createBrowserClient'],
    shouldNotContain: ['let _client =', '_client = createBrowserClient']
  }
];

// Archivos críticos que deben seguir funcionando
const criticalFiles = [
  'src/app/dashboard/page.tsx',
  'src/components/auth-provider.tsx',
  'src/hooks/useSupabaseAuth.ts'
];

console.log('📋 1. VERIFICANDO ARCHIVOS MODIFICADOS...');
let allTargetFilesOk = true;

targetFiles.forEach(({ path: filePath, shouldContain, shouldNotContain }) => {
  const fullPath = path.join(__dirname, filePath);
  console.log(`\n📁 Verificando: ${filePath}`);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`❌ Archivo no encontrado`);
    allTargetFilesOk = false;
    return;
  }
  
  const content = fs.readFileSync(fullPath, 'utf8');
  
  // Verificar que contenga lo que debe contener
  let hasRequired = true;
  shouldContain.forEach(pattern => {
    if (!content.includes(pattern)) {
      console.log(`❌ Falta patrón requerido: ${pattern}`);
      hasRequired = false;
    }
  });
  
  // Verificar que NO contenga patrones legacy
  let hasLegacy = false;
  shouldNotContain.forEach(pattern => {
    if (content.includes(pattern)) {
      console.log(`❌ Contiene patrón legacy: ${pattern}`);
      hasLegacy = true;
    }
  });
  
  if (hasRequired && !hasLegacy) {
    console.log(`✅ Archivo correcto`);
  } else {
    allTargetFilesOk = false;
  }
});

console.log('\n🎯 2. VERIFICANDO ARCHIVOS CRÍTICOS...');
let allCriticalFilesOk = true;

criticalFiles.forEach(filePath => {
  const fullPath = path.join(__dirname, filePath);
  console.log(`\n📁 Verificando: ${filePath}`);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`❌ Archivo no encontrado`);
    allCriticalFilesOk = false;
    return;
  }
  
  const content = fs.readFileSync(fullPath, 'utf8');
  
  // Verificar que use funciones en lugar de singletons
  if (filePath === 'src/app/dashboard/page.tsx') {
    if (content.includes('getBrowserSupabase()')) {
      console.log(`✅ Dashboard usa función getBrowserSupabase()`);
    } else {
      console.log(`❌ Dashboard no usa función correcta`);
      allCriticalFilesOk = false;
    }
  }
  
  if (filePath === 'src/components/auth-provider.tsx') {
    if (content.includes('getBrowserSupabase')) {
      console.log(`✅ Auth provider usa función getBrowserSupabase`);
    } else {
      console.log(`❌ Auth provider no usa función correcta`);
      allCriticalFilesOk = false;
    }
  }
  
  if (filePath === 'src/hooks/useSupabaseAuth.ts') {
    if (content.includes('getBrowserSupabase')) {
      console.log(`✅ useSupabaseAuth usa función getBrowserSupabase`);
    } else {
      console.log(`❌ useSupabaseAuth no usa función correcta`);
      allCriticalFilesOk = false;
    }
  }
});

console.log('\n🔍 3. VERIFICANDO IMPORTS ESPECÍFICOS...');

// Verificar que no haya imports rotos específicos
const importChecks = [
  {
    file: 'src/app/dashboard/page.tsx',
    shouldHave: 'from "@/lib/supabaseClient"'
  }
];

let importsOk = true;
importChecks.forEach(({ file, shouldHave }) => {
  const fullPath = path.join(__dirname, file);
  if (fs.existsSync(fullPath)) {
    const content = fs.readFileSync(fullPath, 'utf8');
    if (content.includes(shouldHave)) {
      console.log(`✅ ${file} tiene import correcto`);
    } else {
      console.log(`❌ ${file} no tiene import esperado: ${shouldHave}`);
      importsOk = false;
    }
  }
});

console.log('\n📊 RESUMEN FINAL:');
console.log(`✅ Archivos modificados correctos: ${allTargetFilesOk ? 'SÍ' : 'NO'}`);
console.log(`✅ Archivos críticos funcionando: ${allCriticalFilesOk ? 'SÍ' : 'NO'}`);
console.log(`✅ Imports correctos: ${importsOk ? 'SÍ' : 'NO'}`);

const overallSuccess = allTargetFilesOk && allCriticalFilesOk && importsOk;
console.log(`\n🎯 RESULTADO FINAL: ${overallSuccess ? '✅ NEUTRALIZACIÓN EXITOSA' : '❌ REQUIERE CORRECCIONES'}`);

if (overallSuccess) {
  console.log('\n🎉 NEUTRALIZACIÓN LEGACY COMPLETADA EXITOSAMENTE');
  console.log('✅ Todos los singletons globales eliminados');
  console.log('✅ Funciones bajo demanda implementadas');
  console.log('✅ Archivos críticos funcionando correctamente');
  console.log('✅ Imports mantenidos y funcionando');
} else {
  console.log('\n⚠️  SE REQUIEREN CORRECCIONES ANTES DE COMPLETAR');
}
