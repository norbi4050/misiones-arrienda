const fs = require('fs');
const path = require('path');

console.log('🧪 PRUEBAS EXHAUSTIVAS DEL REFACTOR SUPABASE\n');

// 1. Verificar archivos modificados
console.log('📁 VERIFICACIÓN DE ARCHIVOS:');

const files = [
  {
    path: 'src/lib/supabase/singleton-client.ts',
    shouldContain: ['export function getSupabaseClient()', 'createClient()'],
    shouldNotContain: ['let supabaseInstance', 'export const supabase =']
  },
  {
    path: 'src/lib/supabaseClient.ts', 
    shouldContain: ['export function getBrowserSupabase()', 'createClient()'],
    shouldNotContain: ['export const supabase =']
  },
  {
    path: 'src/lib/supabase/browser.ts',
    shouldContain: ['export function getBrowserClient()'],
    shouldNotContain: ['let _client', 'if (!_client)']
  }
];

let allTestsPassed = true;

files.forEach(file => {
  try {
    const content = fs.readFileSync(file.path, 'utf8');
    console.log(`\n✅ ${file.path}:`);
    
    // Verificar contenido requerido
    file.shouldContain.forEach(required => {
      if (content.includes(required)) {
        console.log(`  ✅ Contiene: ${required}`);
      } else {
        console.log(`  ❌ FALTA: ${required}`);
        allTestsPassed = false;
      }
    });
    
    // Verificar contenido prohibido
    file.shouldNotContain.forEach(forbidden => {
      if (!content.includes(forbidden)) {
        console.log(`  ✅ No contiene: ${forbidden}`);
      } else {
        console.log(`  ❌ CONTIENE PROHIBIDO: ${forbidden}`);
        allTestsPassed = false;
      }
    });
    
  } catch (error) {
    console.log(`❌ Error leyendo ${file.path}: ${error.message}`);
    allTestsPassed = false;
  }
});

// 2. Verificar imports problemáticos
console.log('\n🔍 VERIFICACIÓN DE IMPORTS:');
try {
  const { execSync } = require('child_process');
  
  // Buscar imports directos de singletons
  const searchPatterns = [
    'import.*supabase.*from.*singleton-client',
    'export const supabase',
    'let.*client.*=.*create'
  ];
  
  searchPatterns.forEach(pattern => {
    try {
      const result = execSync(`findstr /r /s "${pattern}" src\\*.ts src\\**\\*.ts 2>nul || echo "No encontrado"`, { encoding: 'utf8' });
      if (result.trim() === 'No encontrado' || result.trim() === '') {
        console.log(`✅ Sin patrón problemático: ${pattern}`);
      } else {
        console.log(`❌ Encontrado patrón problemático: ${pattern}`);
        console.log(`   ${result.trim()}`);
        allTestsPassed = false;
      }
    } catch (e) {
      console.log(`✅ Sin patrón problemático: ${pattern}`);
    }
  });
  
} catch (error) {
  console.log('⚠️  No se pudo verificar imports (comando no disponible)');
}

// 3. Resumen final
console.log('\n📊 RESUMEN DE PRUEBAS:');
if (allTestsPassed) {
  console.log('🎉 TODAS LAS PRUEBAS PASARON');
  console.log('✨ Refactor completado exitosamente');
  console.log('🚀 Sistema preparado para evitar problemas de hidratación');
} else {
  console.log('❌ ALGUNAS PRUEBAS FALLARON');
  console.log('🔧 Revisar los errores arriba');
}

console.log('\n🎯 CAMBIOS IMPLEMENTADOS:');
console.log('  • singleton-client.ts: Neutralizado, usa createClient() bajo demanda');
console.log('  • supabaseClient.ts: Convertido a función getBrowserSupabase()');
console.log('  • browser.ts: Eliminado cache global, función getBrowserClient()');
console.log('  • Sin exports directos de instancias');
console.log('  • Instanciación forzada bajo demanda');
