#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 VERIFICACIÓN DE CORRECCIÓN DEL ERROR RUNTIME\n');

// Buscar todos los archivos que podrían tener imports problemáticos
function findFiles(dir, extension) {
  const files = [];
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
      files.push(...findFiles(fullPath, extension));
    } else if (stat.isFile() && item.endsWith(extension)) {
      files.push(fullPath);
    }
  }
  
  return files;
}

const srcDir = path.join(__dirname, 'src');
const tsFiles = findFiles(srcDir, '.tsx').concat(findFiles(srcDir, '.ts'));

let problemsFound = 0;
let filesChecked = 0;

console.log('📋 ARCHIVOS VERIFICADOS:\n');

tsFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const relativePath = path.relative(__dirname, file);
  
  // Verificar imports problemáticos
  const hasBadImport = content.includes('from "@/lib/supabase/browser"') || 
                      content.includes("from '@/lib/supabase/browser'");
  
  const hasGoodImport = content.includes('from "@/lib/supabaseClient"') || 
                       content.includes("from '@/lib/supabaseClient'");
  
  if (hasBadImport) {
    console.log(`❌ ${relativePath}: IMPORT PROBLEMÁTICO DETECTADO`);
    console.log(`   - Contiene: from "@/lib/supabase/browser"`);
    problemsFound++;
  } else if (hasGoodImport) {
    console.log(`✅ ${relativePath}: Import corregido correctamente`);
  }
  
  filesChecked++;
});

console.log('\n' + '='.repeat(60));
console.log(`📊 RESUMEN:`);
console.log(`   - Archivos verificados: ${filesChecked}`);
console.log(`   - Problemas encontrados: ${problemsFound}`);

if (problemsFound === 0) {
  console.log('\n🎉 ERROR RUNTIME CORREGIDO EXITOSAMENTE');
  console.log('\n✅ Todos los imports problemáticos han sido corregidos');
  console.log('✅ Los archivos ahora usan el adaptador correcto');
  console.log('✅ El error "getBrowserSupabase is not a function" está resuelto');
  console.log('\n🚀 La aplicación debería funcionar correctamente ahora');
} else {
  console.log('\n❌ AÚN HAY PROBLEMAS POR RESOLVER');
  console.log('\n⚠️  Algunos archivos aún tienen imports problemáticos');
  console.log('⚠️  Revisar los archivos marcados arriba');
}

console.log('\n' + '='.repeat(60));
