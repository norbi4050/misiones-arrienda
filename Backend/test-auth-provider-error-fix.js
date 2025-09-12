const fs = require('fs');
const path = require('path');

console.log('🔍 ANÁLISIS ESPECÍFICO: Error "getBrowserSupabase is not a function"');
console.log('=' .repeat(60));

// 1. Verificar contenido de supabaseClient.ts
const supabaseClientPath = path.join(__dirname, 'src/lib/supabaseClient.ts');
console.log('\n📁 Contenido de supabaseClient.ts:');
if (fs.existsSync(supabaseClientPath)) {
  const content = fs.readFileSync(supabaseClientPath, 'utf8');
  console.log(content);
  
  // Verificar que exporta getBrowserSupabase
  if (content.includes('export function getBrowserSupabase')) {
    console.log('✅ Exporta getBrowserSupabase correctamente');
  } else {
    console.log('❌ NO exporta getBrowserSupabase');
  }
} else {
  console.log('❌ Archivo no encontrado');
}

// 2. Verificar contenido de auth-provider.tsx
const authProviderPath = path.join(__dirname, 'src/components/auth-provider.tsx');
console.log('\n📁 Import en auth-provider.tsx:');
if (fs.existsSync(authProviderPath)) {
  const content = fs.readFileSync(authProviderPath, 'utf8');
  const importLine = content.split('\n').find(line => line.includes('getBrowserSupabase'));
  console.log(importLine || 'Import no encontrado');
  
  if (importLine && importLine.includes('@/lib/supabaseClient')) {
    console.log('✅ Import correcto desde @/lib/supabaseClient');
  } else {
    console.log('❌ Import incorrecto o no encontrado');
  }
} else {
  console.log('❌ Archivo no encontrado');
}

// 3. Verificar que client.ts existe y exporta createClient
const clientPath = path.join(__dirname, 'src/lib/supabase/client.ts');
console.log('\n📁 Verificando client.ts:');
if (fs.existsSync(clientPath)) {
  const content = fs.readFileSync(clientPath, 'utf8');
  if (content.includes('export function createClient')) {
    console.log('✅ client.ts exporta createClient correctamente');
  } else {
    console.log('❌ client.ts NO exporta createClient');
  }
} else {
  console.log('❌ client.ts no encontrado');
}

// 4. Verificar posibles conflictos en browser.ts
const browserPath = path.join(__dirname, 'src/lib/supabase/browser.ts');
console.log('\n📁 Verificando browser.ts (posible conflicto):');
if (fs.existsSync(browserPath)) {
  const content = fs.readFileSync(browserPath, 'utf8');
  if (content.includes('getBrowserSupabase')) {
    console.log('⚠️  browser.ts también exporta getBrowserSupabase - POSIBLE CONFLICTO');
    console.log('Contenido:');
    console.log(content);
  } else {
    console.log('✅ browser.ts no exporta getBrowserSupabase');
  }
} else {
  console.log('✅ browser.ts no existe');
}

// 5. Verificar archivos de cache que podrían estar causando problemas
console.log('\n🗂️  Verificando archivos de cache:');
const cacheDirectories = [
  '.next',
  'node_modules/.cache',
  '.tsbuildinfo'
];

cacheDirectories.forEach(dir => {
  const fullPath = path.join(__dirname, dir);
  if (fs.existsSync(fullPath)) {
    console.log(`⚠️  ${dir} existe - podría contener cache obsoleto`);
  } else {
    console.log(`✅ ${dir} no existe`);
  }
});

console.log('\n🔧 RECOMENDACIONES:');
console.log('1. Limpiar cache: rm -rf .next && npm run dev');
console.log('2. Verificar que no hay imports circulares');
console.log('3. Reiniciar TypeScript server en VSCode');
console.log('4. Si persiste, verificar orden de imports en auth-provider.tsx');
