#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 Verificación final de patrones legacy de Supabase...\n');

// Archivos a verificar
const filesToCheck = [
  'src/lib/supabase/singleton-client.ts',
  'src/lib/supabaseClient.ts', 
  'src/lib/supabase/browser.ts'
];

// Patrones legacy a detectar
const legacyPatterns = [
  { pattern: /let\s+supabaseInstance\s*[:=]/, description: 'Singleton instance variable' },
  { pattern: /let\s+_client\s*[:=]/, description: 'Global client cache' },
  { pattern: /export\s+const\s+supabase\s*=/, description: 'Direct supabase export' },
  { pattern: /if\s*\(\s*supabaseInstance\s*\)/, description: 'Singleton check' },
  { pattern: /if\s*\(\s*!?\s*_client\s*\)/, description: 'Client cache check' }
];

let hasLegacyPatterns = false;

filesToCheck.forEach(filePath => {
  const fullPath = path.join(__dirname, filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  Archivo no encontrado: ${filePath}`);
    return;
  }

  const content = fs.readFileSync(fullPath, 'utf8');
  console.log(`📁 Verificando: ${filePath}`);
  
  let fileHasLegacy = false;
  
  legacyPatterns.forEach(({ pattern, description }) => {
    if (pattern.test(content)) {
      console.log(`  ❌ LEGACY DETECTADO: ${description}`);
      fileHasLegacy = true;
      hasLegacyPatterns = true;
    }
  });
  
  if (!fileHasLegacy) {
    console.log(`  ✅ Sin patrones legacy`);
  }
  
  console.log('');
});

// Verificar funciones requeridas
console.log('🔧 Verificando funciones requeridas...\n');

const requiredFunctions = [
  { file: 'src/lib/supabase/singleton-client.ts', functions: ['getSupabaseClient'] },
  { file: 'src/lib/supabaseClient.ts', functions: ['getBrowserSupabase'] },
  { file: 'src/lib/supabase/browser.ts', functions: ['getBrowserClient', 'getBrowserSupabase'] }
];

requiredFunctions.forEach(({ file, functions }) => {
  const fullPath = path.join(__dirname, file);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  Archivo no encontrado: ${file}`);
    return;
  }

  const content = fs.readFileSync(fullPath, 'utf8');
  console.log(`📁 Verificando funciones en: ${file}`);
  
  functions.forEach(funcName => {
    const funcPattern = new RegExp(`export\\s+function\\s+${funcName}\\s*\\(`);
    if (funcPattern.test(content)) {
      console.log(`  ✅ Función encontrada: ${funcName}`);
    } else {
      console.log(`  ❌ Función faltante: ${funcName}`);
      hasLegacyPatterns = true;
    }
  });
  
  console.log('');
});

// Resultado final
if (hasLegacyPatterns) {
  console.log('❌ REFACTOR INCOMPLETO: Se detectaron patrones legacy o funciones faltantes');
  process.exit(1);
} else {
  console.log('✅ REFACTOR COMPLETO: Todos los patrones legacy han sido neutralizados');
  console.log('🎉 El proyecto ahora usa instanciación bajo demanda sin singletons globales');
}
