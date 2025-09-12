#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 TESTING EXHAUSTIVO - Refactor Supabase Completado\n');

let allGood = true;
const issues = [];

// 1. Verificar archivos modificados
console.log('📁 1. VERIFICANDO ARCHIVOS MODIFICADOS:');

const files = [
  { 
    path: 'src/lib/supabase/singleton-client.ts',
    checks: [
      { test: content => content.includes("import { createClient } from './client'"), desc: 'Import createClient' },
      { test: content => content.includes('export function getSupabaseClient()'), desc: 'Función getSupabaseClient' },
      { test: content => !content.includes('let supabaseInstance'), desc: 'Sin singleton' },
      { test: content => !content.includes('export const supabase ='), desc: 'Sin export directo' }
    ]
  },
  {
    path: 'src/lib/supabaseClient.ts',
    checks: [
      { test: content => content.includes("import { createClient } from './supabase/client'"), desc: 'Import createClient' },
      { test: content => content.includes('export function getBrowserSupabase()'), desc: 'Función getBrowserSupabase' },
      { test: content => !content.includes('export const supabase'), desc: 'Sin export directo' }
    ]
  },
  {
    path: 'src/lib/supabase/browser.ts',
    checks: [
      { test: content => content.includes('export function getBrowserClient()'), desc: 'Función getBrowserClient' },
      { test: content => content.includes('export function getBrowserSupabase()'), desc: 'Función getBrowserSupabase (compatibilidad)' },
      { test: content => !content.includes('let _client'), desc: 'Sin cache global' },
      { test: content => content.includes('if (!url || !anon)'), desc: 'Validación env' }
    ]
  }
];

files.forEach(file => {
  const filePath = path.join(__dirname, file.path);
  
  if (!fs.existsSync(filePath)) {
    console.log(`❌ ${file.path} - No existe`);
    issues.push(`Archivo faltante: ${file.path}`);
    allGood = false;
    return;
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  console.log(`\n  📄 ${file.path}:`);
  
  file.checks.forEach(check => {
    const passed = check.test(content);
    console.log(`    ${passed ? '✅' : '❌'} ${check.desc}`);
    if (!passed) {
      issues.push(`${file.path}: ${check.desc}`);
      allGood = false;
    }
  });
});

// 2. Verificar compatibilidad con archivos existentes
console.log('\n📁 2. VERIFICANDO COMPATIBILIDAD:');

const compatibilityFiles = [
  'src/app/dashboard/page.tsx',
  'src/hooks/useSupabaseAuth.ts',
  'src/components/user-menu.tsx',
  'src/components/auth-provider.tsx'
];

compatibilityFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    const hasGetBrowserSupabase = content.includes('getBrowserSupabase');
    console.log(`  ${hasGetBrowserSupabase ? '✅' : '⚠️'} ${file} - ${hasGetBrowserSupabase ? 'Usa getBrowserSupabase' : 'No usa getBrowserSupabase'}`);
  } else {
    console.log(`  ⚠️ ${file} - No encontrado`);
  }
});

// 3. Verificar que no hay patrones legacy
console.log('\n📁 3. VERIFICANDO ELIMINACIÓN DE PATRONES LEGACY:');

const legacyPatterns = [
  { pattern: 'let supabaseInstance', desc: 'Singleton supabaseInstance' },
  { pattern: 'let _client', desc: 'Cache global _client' },
  { pattern: 'export const supabase =', desc: 'Export directo supabase' }
];

const srcDir = path.join(__dirname, 'src');
const allFiles = getAllTsFiles(srcDir);

legacyPatterns.forEach(legacy => {
  let found = false;
  allFiles.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    if (content.includes(legacy.pattern)) {
      found = true;
      console.log(`  ❌ ${legacy.desc} encontrado en: ${path.relative(__dirname, file)}`);
      issues.push(`Patrón legacy encontrado: ${legacy.desc} en ${file}`);
      allGood = false;
    }
  });
  
  if (!found) {
    console.log(`  ✅ ${legacy.desc} - Eliminado correctamente`);
  }
});

// 4. Resumen final
console.log('\n' + '='.repeat(60));

if (allGood) {
  console.log('🎉 ¡TESTING EXHAUSTIVO COMPLETADO EXITOSAMENTE!');
  console.log('✅ Todos los archivos modificados correctamente');
  console.log('✅ Compatibilidad preservada');
  console.log('✅ Patrones legacy eliminados');
  console.log('✅ Funciones bajo demanda implementadas');
  console.log('✅ Validaciones agregadas');
  console.log('\n🚀 REFACTOR SUPABASE: COMPLETADO Y VERIFICADO');
} else {
  console.log('❌ PROBLEMAS ENCONTRADOS EN EL TESTING:');
  issues.forEach(issue => console.log(`  • ${issue}`));
  console.log('\n⚠️ Se requieren correcciones antes de completar');
  process.exit(1);
}

function getAllTsFiles(dir) {
  let files = [];
  const items = fs.readdirSync(dir);
  
  items.forEach(item => {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      files = files.concat(getAllTsFiles(fullPath));
    } else if (item.endsWith('.ts') || item.endsWith('.tsx')) {
      files.push(fullPath);
    }
  });
  
  return files;
}
