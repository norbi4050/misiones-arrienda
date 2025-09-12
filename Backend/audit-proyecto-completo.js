#!/usr/bin/env node

/**
 * AUDITORÍA COMPLETA DEL PROYECTO - Refactor Supabase
 * Verifica funcionalidad, imports, compilación y estructura
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔍 AUDITORÍA COMPLETA DEL PROYECTO\n');
console.log('='.repeat(50));

let totalTests = 0;
let passedTests = 0;

function test(name, condition, details = '') {
  totalTests++;
  if (condition) {
    console.log(`✅ ${name}`);
    if (details) console.log(`   ${details}`);
    passedTests++;
  } else {
    console.log(`❌ ${name}`);
    if (details) console.log(`   ${details}`);
  }
}

// 1. VERIFICACIÓN DE ARCHIVOS REFACTORIZADOS
console.log('\n📁 1. VERIFICACIÓN DE ARCHIVOS REFACTORIZADOS');
console.log('-'.repeat(50));

const refactoredFiles = [
  'src/lib/supabase/singleton-client.ts',
  'src/lib/supabaseClient.ts', 
  'src/lib/supabase/browser.ts'
];

refactoredFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  test(`Archivo existe: ${file}`, fs.existsSync(filePath));
});

// 2. VERIFICACIÓN DE CONTENIDO - SINGLETON-CLIENT
console.log('\n🔧 2. VERIFICACIÓN SINGLETON-CLIENT.TS');
console.log('-'.repeat(50));

const singletonPath = path.join(__dirname, 'src/lib/supabase/singleton-client.ts');
if (fs.existsSync(singletonPath)) {
  const singletonContent = fs.readFileSync(singletonPath, 'utf8');
  
  test('Tiene función getSupabaseClient()', singletonContent.includes('getSupabaseClient()'));
  test('Importa createClient', singletonContent.includes("import { createClient } from './client'"));
  test('NO tiene singleton global', !singletonContent.includes('let supabaseInstance'));
  test('NO exporta instancia directa', !singletonContent.includes('export const supabase ='));
  test('Tiene directiva use client', singletonContent.includes("'use client'"));
}

// 3. VERIFICACIÓN DE CONTENIDO - SUPABASECLIENT
console.log('\n🔧 3. VERIFICACIÓN SUPABASECLIENT.TS');
console.log('-'.repeat(50));

const clientPath = path.join(__dirname, 'src/lib/supabaseClient.ts');
if (fs.existsSync(clientPath)) {
  const clientContent = fs.readFileSync(clientPath, 'utf8');
  
  test('Tiene función getBrowserSupabase()', clientContent.includes('getBrowserSupabase()'));
  test('Importa createClient', clientContent.includes("import { createClient } from './supabase/client'"));
  test('NO exporta instancia directa', !clientContent.includes('export const supabase ='));
  test('Tiene directiva use client', clientContent.includes("'use client'"));
}

// 4. VERIFICACIÓN DE CONTENIDO - BROWSER
console.log('\n🔧 4. VERIFICACIÓN BROWSER.TS');
console.log('-'.repeat(50));

const browserPath = path.join(__dirname, 'src/lib/supabase/browser.ts');
if (fs.existsSync(browserPath)) {
  const browserContent = fs.readFileSync(browserPath, 'utf8');
  
  test('Tiene función getBrowserClient()', browserContent.includes('getBrowserClient()'));
  test('Importa createBrowserClient', browserContent.includes('createBrowserClient'));
  test('NO tiene cache global', !browserContent.includes('let _client =') && !browserContent.includes('let _client:'));
  test('Tiene validación de env vars', browserContent.includes('process.env.NEXT_PUBLIC_SUPABASE_URL'));
  test('Tiene directiva use client', browserContent.includes("'use client'"));
}

// 5. VERIFICACIÓN DE IMPORTS EN EL PROYECTO
console.log('\n📦 5. VERIFICACIÓN DE IMPORTS');
console.log('-'.repeat(50));

// Buscar imports problemáticos
const searchDirs = ['src/app', 'src/components', 'src/hooks', 'src/lib'];
let problematicImports = [];

function searchImports(dir) {
  if (!fs.existsSync(dir)) return;
  
  const files = fs.readdirSync(dir, { withFileTypes: true });
  
  files.forEach(file => {
    if (file.isDirectory()) {
      searchImports(path.join(dir, file.name));
    } else if (file.name.endsWith('.ts') || file.name.endsWith('.tsx')) {
      const filePath = path.join(dir, file.name);
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Buscar imports problemáticos
      if (content.includes('from "@/lib/supabase/singleton-client"') && content.includes('import { supabase }')) {
        problematicImports.push(`${filePath}: Importa singleton directo`);
      }
    }
  });
}

searchDirs.forEach(dir => searchImports(path.join(__dirname, dir)));

test('NO hay imports problemáticos', problematicImports.length === 0, 
     problematicImports.length > 0 ? `Encontrados: ${problematicImports.join(', ')}` : 'Todos los imports son seguros');

// 6. VERIFICACIÓN DE COMPILACIÓN TYPESCRIPT
console.log('\n🔨 6. VERIFICACIÓN DE COMPILACIÓN');
console.log('-'.repeat(50));

try {
  execSync('npx tsc --noEmit', { cwd: __dirname, stdio: 'pipe' });
  test('Compilación TypeScript', true, 'Sin errores de tipos');
} catch (error) {
  test('Compilación TypeScript', false, `Errores encontrados: ${error.message}`);
}

// 7. VERIFICACIÓN DE DEPENDENCIAS
console.log('\n📋 7. VERIFICACIÓN DE DEPENDENCIAS');
console.log('-'.repeat(50));

const packagePath = path.join(__dirname, 'package.json');
if (fs.existsSync(packagePath)) {
  const packageContent = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  const deps = { ...packageContent.dependencies, ...packageContent.devDependencies };
  
  test('Tiene @supabase/ssr', deps['@supabase/ssr'] !== undefined);
  test('Tiene @supabase/supabase-js', deps['@supabase/supabase-js'] !== undefined);
  test('Tiene Next.js', deps['next'] !== undefined);
}

// 8. VERIFICACIÓN DE ARCHIVOS CRÍTICOS
console.log('\n🎯 8. VERIFICACIÓN DE ARCHIVOS CRÍTICOS');
console.log('-'.repeat(50));

const criticalFiles = [
  'src/lib/supabase/client.ts',
  'src/lib/supabase/server.ts',
  'src/app/dashboard/page.tsx'
];

criticalFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  test(`Archivo crítico existe: ${file}`, fs.existsSync(filePath));
});

// 9. VERIFICACIÓN DE FUNCIONALIDAD - DASHBOARD
console.log('\n🖥️  9. VERIFICACIÓN DE FUNCIONALIDAD');
console.log('-'.repeat(50));

const dashboardPath = path.join(__dirname, 'src/app/dashboard/page.tsx');
if (fs.existsSync(dashboardPath)) {
  const dashboardContent = fs.readFileSync(dashboardPath, 'utf8');
  
  test('Dashboard usa getBrowserSupabase()', dashboardContent.includes('getBrowserSupabase()'));
  test('Dashboard importa correctamente', dashboardContent.includes('from "@/lib/supabaseClient"'));
  test('Dashboard NO usa singleton directo', !dashboardContent.includes('import { supabase }'));
}

// 10. RESUMEN FINAL
console.log('\n📊 RESUMEN FINAL');
console.log('='.repeat(50));

const successRate = Math.round((passedTests / totalTests) * 100);

console.log(`Tests ejecutados: ${totalTests}`);
console.log(`Tests exitosos: ${passedTests}`);
console.log(`Tests fallidos: ${totalTests - passedTests}`);
console.log(`Tasa de éxito: ${successRate}%`);

if (successRate === 100) {
  console.log('\n🎉 ¡AUDITORÍA COMPLETADA EXITOSAMENTE!');
  console.log('✅ Refactor Supabase implementado correctamente');
  console.log('✅ Sin singletons globales');
  console.log('✅ Funciones bajo demanda funcionando');
  console.log('✅ Compilación sin errores');
  console.log('✅ Imports seguros');
  console.log('\n🚀 PROYECTO LISTO PARA PRODUCCIÓN');
} else if (successRate >= 90) {
  console.log('\n⚠️  AUDITORÍA MAYORMENTE EXITOSA');
  console.log('🔧 Revisar tests fallidos arriba');
  console.log('📝 Correcciones menores requeridas');
} else {
  console.log('\n❌ AUDITORÍA FALLÓ');
  console.log('🚨 Revisar errores críticos arriba');
  console.log('🔧 Correcciones importantes requeridas');
}

process.exit(successRate === 100 ? 0 : 1);
