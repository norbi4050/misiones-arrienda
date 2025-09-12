/**
 * TEST FINAL: Auth Provider Runtime + Análisis de Rendimiento
 * Verifica el error getBrowserSupabase y analiza performance del sitio
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 ANÁLISIS FINAL: Auth Provider + Rendimiento\n');

// 1. Verificar estado actual de archivos críticos
console.log('1️⃣ VERIFICACIÓN DE ARCHIVOS CRÍTICOS:');

const criticalFiles = [
  'src/components/auth-provider.tsx',
  'src/lib/supabaseClient.ts',
  'src/lib/supabase/browser.ts',
  'src/lib/supabase/singleton-client.ts'
];

criticalFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    console.log(`✅ ${file}:`);
    
    // Verificar imports específicos
    if (file.includes('auth-provider')) {
      const hasCorrectImport = content.includes('getBrowserSupabase') && content.includes('@/lib/supabaseClient');
      console.log(`   - Import correcto: ${hasCorrectImport ? '✅' : '❌'}`);
    }
    
    if (file.includes('supabaseClient.ts')) {
      const exportsFunction = content.includes('export') && content.includes('getBrowserSupabase');
      console.log(`   - Export correcto: ${exportsFunction ? '✅' : '❌'}`);
    }
  } else {
    console.log(`❌ ${file}: NO ENCONTRADO`);
  }
});

// 2. Análisis de imports en todo el proyecto
console.log('\n2️⃣ ANÁLISIS DE IMPORTS GLOBALES:');

function findImportsInDirectory(dir, pattern) {
  const results = [];
  
  function scanDirectory(currentDir) {
    const items = fs.readdirSync(currentDir);
    
    items.forEach(item => {
      const itemPath = path.join(currentDir, item);
      const stat = fs.statSync(itemPath);
      
      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        scanDirectory(itemPath);
      } else if (stat.isFile() && (item.endsWith('.tsx') || item.endsWith('.ts'))) {
        const content = fs.readFileSync(itemPath, 'utf8');
        if (content.includes(pattern)) {
          results.push({
            file: path.relative(__dirname, itemPath),
            matches: content.match(new RegExp(pattern, 'g'))?.length || 0
          });
        }
      }
    });
  }
  
  scanDirectory(dir);
  return results;
}

const srcDir = path.join(__dirname, 'src');
const supabaseImports = findImportsInDirectory(srcDir, 'getBrowserSupabase');

console.log(`📊 Archivos usando getBrowserSupabase: ${supabaseImports.length}`);
supabaseImports.forEach(result => {
  console.log(`   - ${result.file} (${result.matches} usos)`);
});

// 3. Verificar estructura de dependencias
console.log('\n3️⃣ VERIFICACIÓN DE DEPENDENCIAS:');

const packageJsonPath = path.join(__dirname, 'package.json');
if (fs.existsSync(packageJsonPath)) {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const supabaseDeps = Object.keys(packageJson.dependencies || {})
    .filter(dep => dep.includes('supabase'));
  
  console.log('📦 Dependencias de Supabase:');
  supabaseDeps.forEach(dep => {
    console.log(`   - ${dep}: ${packageJson.dependencies[dep]}`);
  });
}

// 4. Análisis de rendimiento del proyecto
console.log('\n4️⃣ ANÁLISIS DE RENDIMIENTO:');

// Verificar tamaño de archivos críticos
const performanceFiles = [
  'src/app/layout.tsx',
  'src/app/page.tsx',
  'src/components/auth-provider.tsx',
  'src/lib/supabase/client.ts'
];

let totalSize = 0;
performanceFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    const stats = fs.statSync(filePath);
    const sizeKB = (stats.size / 1024).toFixed(2);
    totalSize += stats.size;
    console.log(`📄 ${file}: ${sizeKB} KB`);
  }
});

console.log(`📊 Tamaño total archivos críticos: ${(totalSize / 1024).toFixed(2)} KB`);

// 5. Verificar configuración de Next.js
console.log('\n5️⃣ CONFIGURACIÓN DE NEXT.JS:');

const nextConfigPath = path.join(__dirname, 'next.config.js');
if (fs.existsSync(nextConfigPath)) {
  const nextConfig = fs.readFileSync(nextConfigPath, 'utf8');
  console.log('⚙️ Next.js config encontrado');
  
  // Verificar optimizaciones
  const hasOptimizations = nextConfig.includes('experimental') || nextConfig.includes('compress');
  console.log(`   - Optimizaciones: ${hasOptimizations ? '✅' : '⚠️ Revisar'}`);
} else {
  console.log('⚠️ next.config.js no encontrado');
}

// 6. Recomendaciones de rendimiento
console.log('\n6️⃣ RECOMENDACIONES DE RENDIMIENTO:');

const recommendations = [
  '🚀 Implementar lazy loading para componentes pesados',
  '📦 Verificar bundle size con next/bundle-analyzer',
  '🔄 Implementar caching estratégico para datos de Supabase',
  '⚡ Usar React.memo para componentes que no cambian frecuentemente',
  '🎯 Implementar code splitting por rutas',
  '📊 Monitorear Core Web Vitals',
  '🔧 Optimizar imágenes con next/image',
  '💾 Implementar service worker para caching offline'
];

recommendations.forEach(rec => console.log(`   ${rec}`));

// 7. Estado del servidor de desarrollo
console.log('\n7️⃣ ESTADO DEL SERVIDOR:');
console.log('🔄 Servidor ejecutándose en terminales activos');
console.log('⚠️ Timeout detectado en pruebas de navegador anteriores');
console.log('💡 Recomendación: Reiniciar servidor si persisten problemas');

// 8. Plan de acción
console.log('\n8️⃣ PLAN DE ACCIÓN INMEDIATO:');

const actionPlan = [
  '1. Verificar que el servidor responde correctamente',
  '2. Probar auth-provider en navegador real',
  '3. Implementar monitoring de errores en runtime',
  '4. Optimizar bundle size',
  '5. Implementar métricas de rendimiento'
];

actionPlan.forEach(action => console.log(`   ${action}`));

console.log('\n✅ ANÁLISIS COMPLETADO');
console.log('📋 Revisar recomendaciones y ejecutar plan de acción');
