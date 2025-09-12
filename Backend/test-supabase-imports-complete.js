#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 Verificando imports de getBrowserSupabase...\n');

// Archivos que usan getBrowserSupabase
const filesToCheck = [
  {
    file: 'src/components/auth-provider.tsx',
    importFrom: '@/lib/supabase/browser',
    expectedFunction: 'getBrowserSupabase'
  },
  {
    file: 'src/components/user-menu.tsx', 
    importFrom: '@/lib/supabase/browser',
    expectedFunction: 'getBrowserSupabase'
  },
  {
    file: 'src/hooks/useSupabaseAuth.ts',
    importFrom: '@/lib/supabase/browser', 
    expectedFunction: 'getBrowserSupabase'
  },
  {
    file: 'src/app/dashboard/page.tsx',
    importFrom: '@/lib/supabaseClient',
    expectedFunction: 'getBrowserSupabase'
  }
];

// Archivos que deben exportar getBrowserSupabase
const exportFiles = [
  'src/lib/supabase/browser.ts',
  'src/lib/supabaseClient.ts'
];

let allGood = true;

console.log('📋 Verificando archivos que exportan getBrowserSupabase:');
exportFiles.forEach(file => {
  const fullPath = path.join(__dirname, file);
  if (fs.existsSync(fullPath)) {
    const content = fs.readFileSync(fullPath, 'utf8');
    if (content.includes('export function getBrowserSupabase')) {
      console.log(`✅ ${file} - exporta getBrowserSupabase`);
    } else {
      console.log(`❌ ${file} - NO exporta getBrowserSupabase`);
      allGood = false;
    }
  } else {
    console.log(`❌ ${file} - archivo no existe`);
    allGood = false;
  }
});

console.log('\n📋 Verificando archivos que importan getBrowserSupabase:');
filesToCheck.forEach(({ file, importFrom, expectedFunction }) => {
  const fullPath = path.join(__dirname, file);
  if (fs.existsSync(fullPath)) {
    const content = fs.readFileSync(fullPath, 'utf8');
    
    // Verificar import
    const importPattern = new RegExp(`import.*${expectedFunction}.*from.*["']${importFrom.replace('@/', '')}["']`);
    if (importPattern.test(content)) {
      console.log(`✅ ${file} - import correcto desde ${importFrom}`);
    } else {
      console.log(`❌ ${file} - import incorrecto o faltante`);
      allGood = false;
    }
    
    // Verificar uso
    if (content.includes(`${expectedFunction}()`)) {
      console.log(`✅ ${file} - usa ${expectedFunction}() correctamente`);
    } else {
      console.log(`❌ ${file} - NO usa ${expectedFunction}()`);
      allGood = false;
    }
  } else {
    console.log(`❌ ${file} - archivo no existe`);
    allGood = false;
  }
  console.log('');
});

console.log('='.repeat(60));
if (allGood) {
  console.log('🎉 ¡Todos los imports de getBrowserSupabase están correctos!');
} else {
  console.log('❌ Hay problemas con los imports de getBrowserSupabase');
  process.exit(1);
}
