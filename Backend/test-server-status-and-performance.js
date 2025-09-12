/**
 * TEST SERVIDOR Y RENDIMIENTO
 * Verifica el estado del servidor y analiza rendimiento
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

console.log('🔍 ANÁLISIS DE SERVIDOR Y RENDIMIENTO\n');

// 1. Test de conectividad del servidor
console.log('1️⃣ VERIFICACIÓN DEL SERVIDOR:');

function testServer(port = 3000) {
  return new Promise((resolve) => {
    const req = http.get(`http://localhost:${port}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          bodySize: data.length,
          success: true
        });
      });
    });
    
    req.on('error', (err) => {
      resolve({
        error: err.message,
        success: false
      });
    });
    
    req.setTimeout(5000, () => {
      req.destroy();
      resolve({
        error: 'Timeout después de 5 segundos',
        success: false
      });
    });
  });
}

async function runServerTest() {
  console.log('🌐 Probando servidor en localhost:3000...');
  const result = await testServer();
  
  if (result.success) {
    console.log(`✅ Servidor respondiendo: ${result.status}`);
    console.log(`📊 Tamaño de respuesta: ${result.bodySize} bytes`);
    console.log(`⏱️ Content-Type: ${result.headers['content-type'] || 'No especificado'}`);
  } else {
    console.log(`❌ Error del servidor: ${result.error}`);
    console.log('💡 Posibles causas:');
    console.log('   - Servidor no iniciado');
    console.log('   - Puerto ocupado');
    console.log('   - Error en el código');
  }
  
  return result;
}

// 2. Análisis de archivos del proyecto
console.log('\n2️⃣ ANÁLISIS DE ARCHIVOS:');

function analyzeProjectFiles() {
  const srcPath = path.join(__dirname, 'src');
  let totalFiles = 0;
  let totalSize = 0;
  const fileTypes = {};
  
  function scanDir(dir) {
    try {
      const items = fs.readdirSync(dir);
      items.forEach(item => {
        const itemPath = path.join(dir, item);
        const stat = fs.statSync(itemPath);
        
        if (stat.isDirectory() && !item.startsWith('.')) {
          scanDir(itemPath);
        } else if (stat.isFile()) {
          totalFiles++;
          totalSize += stat.size;
          
          const ext = path.extname(item);
          fileTypes[ext] = (fileTypes[ext] || 0) + 1;
        }
      });
    } catch (err) {
      console.log(`⚠️ Error escaneando ${dir}: ${err.message}`);
    }
  }
  
  scanDir(srcPath);
  
  console.log(`📁 Total de archivos: ${totalFiles}`);
  console.log(`💾 Tamaño total: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
  console.log('📊 Tipos de archivo:');
  Object.entries(fileTypes).forEach(([ext, count]) => {
    console.log(`   ${ext || 'sin extensión'}: ${count}`);
  });
}

// 3. Verificar dependencias críticas
console.log('\n3️⃣ DEPENDENCIAS CRÍTICAS:');

function checkDependencies() {
  const packagePath = path.join(__dirname, 'package.json');
  if (!fs.existsSync(packagePath)) {
    console.log('❌ package.json no encontrado');
    return;
  }
  
  const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  const deps = { ...pkg.dependencies, ...pkg.devDependencies };
  
  const criticalDeps = [
    'next',
    'react',
    '@supabase/ssr',
    '@supabase/supabase-js'
  ];
  
  criticalDeps.forEach(dep => {
    if (deps[dep]) {
      console.log(`✅ ${dep}: ${deps[dep]}`);
    } else {
      console.log(`❌ ${dep}: NO ENCONTRADO`);
    }
  });
}

// 4. Verificar configuración de Next.js
console.log('\n4️⃣ CONFIGURACIÓN DE NEXT.JS:');

function checkNextConfig() {
  const configPath = path.join(__dirname, 'next.config.js');
  if (fs.existsSync(configPath)) {
    const config = fs.readFileSync(configPath, 'utf8');
    console.log('✅ next.config.js encontrado');
    
    // Verificar optimizaciones comunes
    const optimizations = [
      { key: 'experimental', desc: 'Características experimentales' },
      { key: 'compress', desc: 'Compresión gzip' },
      { key: 'poweredByHeader', desc: 'Header X-Powered-By' },
      { key: 'generateEtags', desc: 'Generación de ETags' }
    ];
    
    optimizations.forEach(opt => {
      const hasOpt = config.includes(opt.key);
      console.log(`   ${opt.desc}: ${hasOpt ? '✅' : '⚠️'}`);
    });
  } else {
    console.log('⚠️ next.config.js no encontrado - usando configuración por defecto');
  }
}

// 5. Recomendaciones de rendimiento
function showPerformanceRecommendations() {
  console.log('\n5️⃣ RECOMENDACIONES DE RENDIMIENTO:');
  
  const recommendations = [
    {
      category: '🚀 Optimización de Bundle',
      items: [
        'Implementar code splitting por rutas',
        'Usar dynamic imports para componentes pesados',
        'Analizar bundle con @next/bundle-analyzer'
      ]
    },
    {
      category: '📦 Gestión de Estado',
      items: [
        'Implementar React.memo para componentes estáticos',
        'Usar useMemo y useCallback estratégicamente',
        'Optimizar re-renders innecesarios'
      ]
    },
    {
      category: '🔄 Caching',
      items: [
        'Implementar caching de datos de Supabase',
        'Usar SWR o React Query para datos remotos',
        'Configurar headers de cache apropiados'
      ]
    },
    {
      category: '🎯 Optimización de Imágenes',
      items: [
        'Usar next/image para todas las imágenes',
        'Implementar lazy loading',
        'Optimizar formatos (WebP, AVIF)'
      ]
    }
  ];
  
  recommendations.forEach(rec => {
    console.log(`\n${rec.category}:`);
    rec.items.forEach(item => console.log(`   • ${item}`));
  });
}

// Ejecutar todos los análisis
async function runCompleteAnalysis() {
  const serverResult = await runServerTest();
  analyzeProjectFiles();
  checkDependencies();
  checkNextConfig();
  showPerformanceRecommendations();
  
  console.log('\n6️⃣ RESUMEN EJECUTIVO:');
  console.log(`🌐 Servidor: ${serverResult.success ? '✅ Funcionando' : '❌ Con problemas'}`);
  console.log('📁 Archivos: ✅ Analizados');
  console.log('📦 Dependencias: ✅ Verificadas');
  console.log('⚙️ Configuración: ✅ Revisada');
  
  if (!serverResult.success) {
    console.log('\n🔧 ACCIONES INMEDIATAS REQUERIDAS:');
    console.log('1. Verificar que npm run dev esté ejecutándose');
    console.log('2. Revisar logs del servidor en la terminal');
    console.log('3. Verificar variables de entorno');
    console.log('4. Limpiar cache: rm -rf .next && npm run dev');
  }
  
  console.log('\n✅ ANÁLISIS COMPLETADO');
}

// Ejecutar análisis
runCompleteAnalysis().catch(console.error);
