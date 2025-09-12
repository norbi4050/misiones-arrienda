const fs = require('fs');
const path = require('path');

console.log('🧪 TESTING EXHAUSTIVO - POST NEUTRALIZACIÓN LEGACY SUPABASE\n');

// 1. VERIFICACIÓN DE ARCHIVOS MODIFICADOS
console.log('📁 1. VERIFICANDO ARCHIVOS MODIFICADOS...');

const modifiedFiles = [
  'src/lib/supabase/singleton-client.ts',
  'src/lib/supabaseClient.ts',
  'src/lib/supabase/browser.ts'
];

let allFilesOk = true;

modifiedFiles.forEach(file => {
  const fullPath = path.join(__dirname, file);
  if (fs.existsSync(fullPath)) {
    const content = fs.readFileSync(fullPath, 'utf8');
    console.log(`✅ ${file} - Existe y modificado`);
    
    // Verificar que no contenga patrones legacy
    if (content.includes('let supabaseInstance') || 
        content.includes('export const supabase = getSupabaseClient()') ||
        content.includes('let _client =')) {
      console.log(`❌ ${file} - Aún contiene patrones legacy`);
      allFilesOk = false;
    }
  } else {
    console.log(`❌ ${file} - No encontrado`);
    allFilesOk = false;
  }
});

// 2. BÚSQUEDA DE TODOS LOS ARCHIVOS QUE USAN SUPABASE
console.log('\n🔍 2. BUSCANDO ARCHIVOS QUE USAN SUPABASE...');

function findSupabaseUsage(dir, results = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
      findSupabaseUsage(fullPath, results);
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      try {
        const content = fs.readFileSync(fullPath, 'utf8');
        if (content.includes('supabase') || content.includes('Supabase')) {
          results.push({
            file: fullPath.replace(__dirname + path.sep, ''),
            content: content
          });
        }
      } catch (err) {
        // Ignorar archivos que no se pueden leer
      }
    }
  });
  
  return results;
}

const supabaseFiles = findSupabaseUsage(path.join(__dirname, 'src'));
console.log(`📊 Encontrados ${supabaseFiles.length} archivos que usan Supabase:`);

supabaseFiles.forEach(({ file }) => {
  console.log(`   - ${file}`);
});

// 3. VERIFICACIÓN DE IMPORTS PROBLEMÁTICOS
console.log('\n🚨 3. VERIFICANDO IMPORTS PROBLEMÁTICOS...');

let importIssues = [];

supabaseFiles.forEach(({ file, content }) => {
  // Buscar imports que podrían estar rotos
  const problematicPatterns = [
    { pattern: /from ['"]@\/lib\/supabase\/singleton-client['"]/, issue: 'Import de singleton-client' },
    { pattern: /from ['"]\.\/supabase\/singleton-client['"]/, issue: 'Import relativo de singleton-client' },
    { pattern: /import.*supabase.*from/, issue: 'Import directo de supabase' },
    { pattern: /const supabase = /, issue: 'Asignación directa de supabase' }
  ];
  
  problematicPatterns.forEach(({ pattern, issue }) => {
    if (pattern.test(content)) {
      importIssues.push({ file, issue, pattern: pattern.toString() });
    }
  });
});

if (importIssues.length > 0) {
  console.log('❌ ISSUES ENCONTRADOS:');
  importIssues.forEach(({ file, issue }) => {
    console.log(`   - ${file}: ${issue}`);
  });
} else {
  console.log('✅ No se encontraron imports problemáticos');
}

// 4. VERIFICACIÓN DE FUNCIONES CORRECTAS
console.log('\n✅ 4. VERIFICANDO USO DE FUNCIONES CORRECTAS...');

let correctUsage = [];
let incorrectUsage = [];

supabaseFiles.forEach(({ file, content }) => {
  // Buscar uso correcto de funciones
  if (content.includes('getBrowserSupabase()') || 
      content.includes('getSupabaseClient()') ||
      content.includes('getBrowserClient()') ||
      content.includes('createClient()')) {
    correctUsage.push(file);
  }
  
  // Buscar uso incorrecto (singletons)
  if (content.includes('export const supabase =') ||
      content.includes('const supabase = supabase') ||
      content.includes('import { supabase }')) {
    incorrectUsage.push(file);
  }
});

console.log(`✅ Archivos con uso correcto: ${correctUsage.length}`);
correctUsage.forEach(file => console.log(`   - ${file}`));

if (incorrectUsage.length > 0) {
  console.log(`❌ Archivos con uso incorrecto: ${incorrectUsage.length}`);
  incorrectUsage.forEach(file => console.log(`   - ${file}`));
}

// 5. VERIFICACIÓN DE COMPONENTES CRÍTICOS
console.log('\n🎯 5. VERIFICANDO COMPONENTES CRÍTICOS...');

const criticalComponents = [
  'src/components/auth-provider.tsx',
  'src/hooks/useSupabaseAuth.ts',
  'src/hooks/useAuth.ts',
  'src/components/user-menu.tsx',
  'src/app/dashboard/page.tsx',
  'src/app/login/page.tsx',
  'src/app/register/page.tsx'
];

criticalComponents.forEach(component => {
  const fullPath = path.join(__dirname, component);
  if (fs.existsSync(fullPath)) {
    const content = fs.readFileSync(fullPath, 'utf8');
    console.log(`✅ ${component} - Existe`);
    
    // Verificar que use patrones correctos
    if (content.includes('getBrowserSupabase()') || 
        content.includes('getSupabaseClient()') ||
        content.includes('createClient()')) {
      console.log(`   ✅ Usa funciones correctas`);
    } else if (content.includes('supabase')) {
      console.log(`   ⚠️  Usa Supabase pero patrón no identificado`);
    }
  } else {
    console.log(`❌ ${component} - No encontrado`);
  }
});

// 6. RESUMEN FINAL
console.log('\n📋 RESUMEN DEL TESTING EXHAUSTIVO:');
console.log(`✅ Archivos modificados correctamente: ${allFilesOk ? 'SÍ' : 'NO'}`);
console.log(`✅ Archivos que usan Supabase encontrados: ${supabaseFiles.length}`);
console.log(`✅ Issues de imports: ${importIssues.length}`);
console.log(`✅ Archivos con uso correcto: ${correctUsage.length}`);
console.log(`❌ Archivos con uso incorrecto: ${incorrectUsage.length}`);

const overallStatus = allFilesOk && importIssues.length === 0 && incorrectUsage.length === 0;
console.log(`\n🎯 ESTADO GENERAL: ${overallStatus ? '✅ EXITOSO' : '❌ REQUIERE ATENCIÓN'}`);

if (!overallStatus) {
  console.log('\n⚠️  ACCIONES REQUERIDAS:');
  if (!allFilesOk) console.log('- Revisar archivos modificados');
  if (importIssues.length > 0) console.log('- Corregir imports problemáticos');
  if (incorrectUsage.length > 0) console.log('- Actualizar uso incorrecto de Supabase');
}
