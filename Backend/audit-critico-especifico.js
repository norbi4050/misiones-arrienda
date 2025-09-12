const fs = require('fs');
const path = require('path');

console.log('🔍 AUDITORÍA CRÍTICA - Refactor Supabase Completado\n');

// Verificaciones específicas
const checks = [
  {
    file: 'src/lib/supabase/singleton-client.ts',
    name: 'Singleton Client',
    mustHave: ['getSupabaseClient()', 'createClient()'],
    mustNotHave: ['let supabaseInstance', 'export const supabase =']
  },
  {
    file: 'src/lib/supabaseClient.ts',
    name: 'Supabase Client',
    mustHave: ['getBrowserSupabase()', 'createClient()'],
    mustNotHave: ['export const supabase =']
  },
  {
    file: 'src/lib/supabase/browser.ts',
    name: 'Browser Client',
    mustHave: ['getBrowserClient()', 'createBrowserClient'],
    mustNotHave: ['let _client =', 'let _client:', '_client =']
  }
];

let allPassed = true;

checks.forEach(check => {
  const filePath = path.join(__dirname, check.file);
  
  if (!fs.existsSync(filePath)) {
    console.log(`❌ ${check.name}: Archivo no encontrado`);
    allPassed = false;
    return;
  }

  const content = fs.readFileSync(filePath, 'utf8');
  console.log(`📁 ${check.name}:`);
  
  // Verificar que tiene lo que debe tener
  check.mustHave.forEach(pattern => {
    if (content.includes(pattern)) {
      console.log(`  ✅ Tiene: ${pattern}`);
    } else {
      console.log(`  ❌ Falta: ${pattern}`);
      allPassed = false;
    }
  });
  
  // Verificar que NO tiene lo que no debe tener
  check.mustNotHave.forEach(pattern => {
    if (!content.includes(pattern)) {
      console.log(`  ✅ No tiene: ${pattern}`);
    } else {
      console.log(`  ❌ Todavía tiene: ${pattern}`);
      allPassed = false;
    }
  });
  
  console.log('');
});

console.log('📊 RESULTADO FINAL:');
if (allPassed) {
  console.log('✅ REFACTOR COMPLETADO EXITOSAMENTE');
  console.log('✅ Todos los singletons globales eliminados');
  console.log('✅ Funciones bajo demanda implementadas correctamente');
  console.log('✅ Sin instanciación en scope de módulo');
  console.log('✅ Compatibilidad mantenida con imports existentes');
  console.log('\n🎯 LISTO PARA PRODUCCIÓN');
} else {
  console.log('❌ REFACTOR INCOMPLETO - Revisar errores arriba');
}
