#!/usr/bin/env node

/**
 * Test completo del refactor de Supabase
 * Verifica que todos los archivos estén correctamente configurados
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verificando refactor completo de Supabase...\n');

// Archivos a verificar
const filesToCheck = [
  {
    path: 'src/lib/supabase/singleton-client.ts',
    shouldContain: [
      "'use client'",
      "import { createClient } from './client'",
      "export function getSupabaseClient()",
      "return createClient()"
    ],
    shouldNotContain: [
      "let supabaseInstance",
      "export const supabase = getSupabaseClient()"
    ]
  },
  {
    path: 'src/lib/supabaseClient.ts',
    shouldContain: [
      "'use client'",
      "import { createClient } from './supabase/client'",
      "export function getBrowserSupabase()",
      "return createClient()"
    ],
    shouldNotContain: [
      "export const supabase"
    ]
  },
  {
    path: 'src/lib/supabase/browser.ts',
    shouldContain: [
      "'use client'",
      "export function getBrowserClient()",
      "createBrowserClient(url, anon)"
    ],
    shouldNotContain: [
      "let _client =",
      "if (!_client)"
    ]
  },
  {
    path: 'src/lib/supabase/server.ts',
    shouldContain: [
      "export async function createServerSupabase()",
      "const cookieStore = await cookies()"
    ],
    shouldNotContain: [
      "const cookieStore = cookies()"
    ]
  }
];

let allTestsPassed = true;

// Verificar cada archivo
filesToCheck.forEach(({ path: filePath, shouldContain, shouldNotContain }) => {
  const fullPath = path.join(__dirname, filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`❌ Archivo no encontrado: ${filePath}`);
    allTestsPassed = false;
    return;
  }

  const content = fs.readFileSync(fullPath, 'utf8');
  
  console.log(`📁 Verificando: ${filePath}`);
  
  // Verificar contenido que debe estar presente
  shouldContain.forEach(text => {
    if (content.includes(text)) {
      console.log(`  ✅ Contiene: "${text}"`);
    } else {
      console.log(`  ❌ Falta: "${text}"`);
      allTestsPassed = false;
    }
  });
  
  // Verificar contenido que NO debe estar presente
  shouldNotContain.forEach(text => {
    if (!content.includes(text)) {
      console.log(`  ✅ No contiene (correcto): "${text}"`);
    } else {
      console.log(`  ❌ Aún contiene (incorrecto): "${text}"`);
      allTestsPassed = false;
    }
  });
  
  console.log('');
});

// Verificar archivos que usan createServerSupabase
const serverFiles = [
  'src/app/layout.tsx',
  'src/app/api/properties/route.ts',
  'src/app/api/properties/[id]/route.ts'
];

console.log('🔍 Verificando uso correcto de createServerSupabase...\n');

serverFiles.forEach(filePath => {
  const fullPath = path.join(__dirname, filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  Archivo no encontrado: ${filePath}`);
    return;
  }

  const content = fs.readFileSync(fullPath, 'utf8');
  
  console.log(`📁 Verificando: ${filePath}`);
  
  if (content.includes('createServerSupabase()') && !content.includes('await createServerSupabase()')) {
    console.log(`  ❌ Usa createServerSupabase() sin await`);
    allTestsPassed = false;
  } else if (content.includes('await createServerSupabase()')) {
    console.log(`  ✅ Usa await createServerSupabase() correctamente`);
  } else {
    console.log(`  ℹ️  No usa createServerSupabase`);
  }
  
  console.log('');
});

// Resultado final
console.log('=' .repeat(50));
if (allTestsPassed) {
  console.log('🎉 ¡Refactor completado exitosamente!');
  console.log('✅ Todos los archivos están correctamente configurados');
  console.log('✅ Patrones legacy eliminados');
  console.log('✅ Funciones async correctamente implementadas');
} else {
  console.log('❌ Refactor incompleto - revisar errores arriba');
  process.exit(1);
}
