const fs = require('fs');
const path = require('path');

console.log('🔍 VERIFICACIÓN FINAL - NEUTRALIZACIÓN LEGACY SUPABASE\n');

// Archivos a verificar
const files = [
  'src/lib/supabase/singleton-client.ts',
  'src/lib/supabaseClient.ts', 
  'src/lib/supabase/browser.ts',
  'src/app/dashboard/page.tsx'
];

let allGood = true;

files.forEach(file => {
  const fullPath = path.join(__dirname, file);
  console.log(`📁 Verificando: ${file}`);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`❌ Archivo no encontrado: ${file}`);
    allGood = false;
    return;
  }
  
  const content = fs.readFileSync(fullPath, 'utf8');
  
  // Verificaciones específicas por archivo
  switch (file) {
    case 'src/lib/supabase/singleton-client.ts':
      if (content.includes("'use client'") && 
          content.includes('import { createClient } from \'./client\'') &&
          content.includes('export function getSupabaseClient()') &&
          !content.includes('let supabaseInstance') &&
          !content.includes('export const supabase = getSupabaseClient()')) {
        console.log('✅ singleton-client.ts: Neutralizado correctamente');
      } else {
        console.log('❌ singleton-client.ts: No cumple con el patrón esperado');
        allGood = false;
      }
      break;
      
    case 'src/lib/supabaseClient.ts':
      if (content.includes("'use client'") && 
          content.includes('import { createClient } from \'./supabase/client\'') &&
          content.includes('export function getBrowserSupabase()') &&
          !content.includes('export const supabase')) {
        console.log('✅ supabaseClient.ts: Convertido a función correctamente');
      } else {
        console.log('❌ supabaseClient.ts: No cumple con el patrón esperado');
        allGood = false;
      }
      break;
      
    case 'src/lib/supabase/browser.ts':
      if (content.includes("'use client'") && 
          content.includes('export function getBrowserClient()') &&
          !content.includes('let _client =') &&
          !content.includes('_client = createBrowserClient')) {
        console.log('✅ browser.ts: Cache global eliminado correctamente');
      } else {
        console.log('❌ browser.ts: Aún contiene cache global');
        allGood = false;
      }
      break;
      
    case 'src/app/dashboard/page.tsx':
      if (content.includes('getBrowserSupabase()') && 
          content.includes('const supabase = getBrowserSupabase()')) {
        console.log('✅ dashboard/page.tsx: Usando función correctamente');
      } else {
        console.log('❌ dashboard/page.tsx: No usa el patrón de función');
        allGood = false;
      }
      break;
  }
});

console.log('\n🔍 VERIFICACIÓN DE PATRONES LEGACY:');

// Buscar patrones legacy que NO deberían existir
const legacyPatterns = [
  { pattern: 'let supabaseInstance', description: 'Singleton global en singleton-client.ts' },
  { pattern: 'export const supabase = getSupabaseClient()', description: 'Export directo de singleton' },
  { pattern: 'let _client =', description: 'Cache global en browser.ts' }
];

files.forEach(file => {
  const fullPath = path.join(__dirname, file);
  if (fs.existsSync(fullPath)) {
    const content = fs.readFileSync(fullPath, 'utf8');
    
    legacyPatterns.forEach(({ pattern, description }) => {
      if (content.includes(pattern)) {
        console.log(`❌ LEGACY ENCONTRADO en ${file}: ${description}`);
        allGood = false;
      }
    });
  }
});

if (allGood) {
  console.log('\n✅ NEUTRALIZACIÓN LEGACY COMPLETADA EXITOSAMENTE');
  console.log('🎯 Todos los archivos siguen el patrón de función bajo demanda');
  console.log('🚫 No se encontraron patrones legacy');
} else {
  console.log('\n❌ NEUTRALIZACIÓN INCOMPLETA');
  console.log('⚠️  Algunos archivos aún contienen patrones legacy');
}

console.log('\n📋 RESUMEN DE CAMBIOS APLICADOS:');
console.log('1. ✅ singleton-client.ts: Eliminado singleton, usa createClient()');
console.log('2. ✅ supabaseClient.ts: Convertido a función getBrowserSupabase()');
console.log('3. ✅ browser.ts: Eliminado cache global _client');
console.log('4. ✅ dashboard/page.tsx: Ya usaba función correctamente');
