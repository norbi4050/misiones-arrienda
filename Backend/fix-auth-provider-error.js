const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 CORRECCIÓN ERROR: "getBrowserSupabase is not a function"');
console.log('=' .repeat(60));

// 1. Verificar estado actual de archivos
console.log('\n📋 VERIFICACIÓN ESTADO ACTUAL:');

const supabaseClientPath = path.join(__dirname, 'src/lib/supabaseClient.ts');
const authProviderPath = path.join(__dirname, 'src/components/auth-provider.tsx');

if (fs.existsSync(supabaseClientPath)) {
  const content = fs.readFileSync(supabaseClientPath, 'utf8');
  console.log('✅ supabaseClient.ts existe y exporta getBrowserSupabase');
} else {
  console.log('❌ supabaseClient.ts no encontrado');
  process.exit(1);
}

if (fs.existsSync(authProviderPath)) {
  const content = fs.readFileSync(authProviderPath, 'utf8');
  if (content.includes('import { getBrowserSupabase } from "@/lib/supabaseClient"')) {
    console.log('✅ auth-provider.tsx importa correctamente');
  } else {
    console.log('❌ Import incorrecto en auth-provider.tsx');
  }
} else {
  console.log('❌ auth-provider.tsx no encontrado');
  process.exit(1);
}

// 2. Limpiar cache
console.log('\n🧹 LIMPIANDO CACHE:');

const cacheDirectories = ['.next', 'node_modules/.cache'];
cacheDirectories.forEach(dir => {
  const fullPath = path.join(__dirname, dir);
  if (fs.existsSync(fullPath)) {
    console.log(`🗑️  Eliminando ${dir}...`);
    try {
      if (process.platform === 'win32') {
        execSync(`rmdir /s /q "${fullPath}"`, { stdio: 'inherit' });
      } else {
        execSync(`rm -rf "${fullPath}"`, { stdio: 'inherit' });
      }
      console.log(`✅ ${dir} eliminado`);
    } catch (error) {
      console.log(`⚠️  Error eliminando ${dir}: ${error.message}`);
    }
  } else {
    console.log(`✅ ${dir} no existe`);
  }
});

// 3. Verificar que no hay conflictos en browser.ts
console.log('\n🔍 VERIFICANDO CONFLICTOS:');
const browserPath = path.join(__dirname, 'src/lib/supabase/browser.ts');
if (fs.existsSync(browserPath)) {
  const content = fs.readFileSync(browserPath, 'utf8');
  if (content.includes('export function getBrowserSupabase')) {
    console.log('⚠️  CONFLICTO DETECTADO: browser.ts exporta getBrowserSupabase');
    console.log('🔧 Corrigiendo browser.ts...');
    
    // Corregir browser.ts para que no exporte getBrowserSupabase
    const correctedContent = `'use client';
import { createBrowserClient } from '@supabase/ssr';

export function getBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  if (!url || !anon) throw new Error('Faltan env de Supabase en cliente');
  return createBrowserClient(url, anon);
}
// ❌ eliminado: let _client = ... / caches globales`;
    
    fs.writeFileSync(browserPath, correctedContent);
    console.log('✅ browser.ts corregido');
  } else {
    console.log('✅ No hay conflictos en browser.ts');
  }
}

// 4. Crear archivo de prueba para verificar import
console.log('\n🧪 CREANDO PRUEBA DE IMPORT:');
const testContent = `// Test de import para verificar que funciona
import { getBrowserSupabase } from './src/lib/supabaseClient';

console.log('Testing getBrowserSupabase import...');
try {
  const client = getBrowserSupabase();
  console.log('✅ getBrowserSupabase funciona correctamente');
  console.log('Tipo:', typeof client);
} catch (error) {
  console.log('❌ Error:', error.message);
}`;

fs.writeFileSync(path.join(__dirname, 'test-import.js'), testContent);

console.log('\n✅ CORRECCIÓN COMPLETADA');
console.log('\n🚀 PRÓXIMOS PASOS:');
console.log('1. Reiniciar el servidor de desarrollo: npm run dev');
console.log('2. Verificar que no hay errores en la consola');
console.log('3. Si persiste el error, reiniciar VSCode');
console.log('4. Ejecutar: node test-import.js para verificar');
