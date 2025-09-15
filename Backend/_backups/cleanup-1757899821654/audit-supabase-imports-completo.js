#!/usr/bin/env node

/**
 * Auditoría completa de imports de Supabase
 * Detecta inconsistencias y problemas de importación
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 AUDITORÍA COMPLETA DE IMPORTS SUPABASE\n');

// Función para buscar archivos recursivamente
function findFiles(dir, extension = '.tsx') {
  let results = [];
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
      results = results.concat(findFiles(filePath, extension));
    } else if (file.endsWith(extension) || file.endsWith('.ts')) {
      results.push(filePath);
    }
  }
  
  return results;
}

// Buscar todos los archivos TypeScript/React
const srcDir = path.join(__dirname, 'src');
const allFiles = findFiles(srcDir);

console.log(`📁 Analizando ${allFiles.length} archivos...\n`);

let problemsFound = [];

// Analizar cada archivo
allFiles.forEach(filePath => {
  const content = fs.readFileSync(filePath, 'utf8');
  const relativePath = path.relative(__dirname, filePath);
  
  // Buscar imports problemáticos
  const lines = content.split('\n');
  
  lines.forEach((line, index) => {
    const lineNum = index + 1;
    
    // Detectar imports de getBrowserSupabase desde browser.ts
    if (line.includes('getBrowserSupabase') && line.includes('@/lib/supabase/browser')) {
      problemsFound.push({
        file: relativePath,
        line: lineNum,
        issue: 'IMPORT_INCORRECTO',
        content: line.trim(),
        description: 'Importa getBrowserSupabase desde browser.ts, pero ese archivo exporta getBrowserClient'
      });
    }
    
    // Detectar uso de getBrowserSupabase sin import correcto
    if (line.includes('getBrowserSupabase()') && !content.includes('from "@/lib/supabaseClient"') && !content.includes('from \'@/lib/supabaseClient\'')) {
      if (!content.includes('import(\'@/lib/supabaseClient\')')) {
        problemsFound.push({
          file: relativePath,
          line: lineNum,
          issue: 'USO_SIN_IMPORT',
          content: line.trim(),
          description: 'Usa getBrowserSupabase() pero no importa desde supabaseClient.ts'
        });
      }
    }
    
    // Detectar imports de createClient sin await en server
    if (line.includes('createClient()') && !line.includes('await') && filePath.includes('api/')) {
      problemsFound.push({
        file: relativePath,
        line: lineNum,
        issue: 'SERVER_SIN_AWAIT',
        content: line.trim(),
        description: 'Usa createClient() en API route sin await'
      });
    }
  });
});

// Mostrar resultados
if (problemsFound.length === 0) {
  console.log('✅ ¡No se encontraron problemas de imports!');
} else {
  console.log(`❌ Se encontraron ${problemsFound.length} problemas:\n`);
  
  problemsFound.forEach((problem, index) => {
    console.log(`${index + 1}. 📁 ${problem.file}:${problem.line}`);
    console.log(`   🔴 ${problem.issue}: ${problem.description}`);
    console.log(`   📝 ${problem.content}`);
    console.log('');
  });
  
  // Agrupar por tipo de problema
  const byType = problemsFound.reduce((acc, problem) => {
    acc[problem.issue] = (acc[problem.issue] || 0) + 1;
    return acc;
  }, {});
  
  console.log('📊 RESUMEN POR TIPO:');
  Object.entries(byType).forEach(([type, count]) => {
    console.log(`   ${type}: ${count} archivos`);
  });
}

console.log('\n' + '='.repeat(60));
console.log('🔧 PLAN DE CORRECCIÓN:');
console.log('1. Cambiar imports de getBrowserSupabase desde browser.ts → supabaseClient.ts');
console.log('2. O cambiar browser.ts para exportar getBrowserSupabase en lugar de getBrowserClient');
console.log('3. Verificar que todos los server components usen await');
console.log('4. Ejecutar test de verificación final');
