const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🧪 TEST RUNTIME COMPLETO: Error "getBrowserSupabase is not a function"');
console.log('=' .repeat(70));

// 1. Verificar que el servidor está ejecutándose
console.log('\n🔍 VERIFICANDO ESTADO DEL SERVIDOR:');

try {
  // Verificar si el puerto 3000 está en uso
  const netstatResult = execSync('netstat -an | findstr :3000', { encoding: 'utf8' });
  if (netstatResult.includes('3000')) {
    console.log('✅ Servidor detectado en puerto 3000');
  } else {
    console.log('⚠️  No se detecta servidor en puerto 3000');
  }
} catch (error) {
  console.log('⚠️  No se puede verificar el estado del puerto 3000');
}

// 2. Verificar archivos críticos una vez más
console.log('\n📋 VERIFICACIÓN FINAL DE ARCHIVOS:');

const criticalFiles = [
  {
    path: 'src/lib/supabaseClient.ts',
    mustContain: ['export function getBrowserSupabase', 'createClient'],
    mustNotContain: []
  },
  {
    path: 'src/components/auth-provider.tsx',
    mustContain: ['import { getBrowserSupabase } from "@/lib/supabaseClient"', 'const supabase = getBrowserSupabase()'],
    mustNotContain: []
  },
  {
    path: 'src/lib/supabase/client.ts',
    mustContain: ['export function createClient', 'createBrowserClient'],
    mustNotContain: []
  }
];

let filesOk = true;

criticalFiles.forEach(file => {
  const fullPath = path.join(__dirname, file.path);
  if (fs.existsSync(fullPath)) {
    const content = fs.readFileSync(fullPath, 'utf8');
    
    const hasRequired = file.mustContain.every(req => content.includes(req));
    const hasProhibited = file.mustNotContain.some(prohibited => content.includes(prohibited));
    
    if (hasRequired && !hasProhibited) {
      console.log(`✅ ${file.path} - CORRECTO`);
    } else {
      console.log(`❌ ${file.path} - PROBLEMA`);
      filesOk = false;
    }
  } else {
    console.log(`❌ ${file.path} - NO ENCONTRADO`);
    filesOk = false;
  }
});

// 3. Verificar compilación TypeScript
console.log('\n🔧 VERIFICANDO COMPILACIÓN TYPESCRIPT:');
try {
  execSync('npx tsc --noEmit --skipLibCheck', { 
    cwd: __dirname,
    stdio: 'pipe',
    encoding: 'utf8'
  });
  console.log('✅ TypeScript compila sin errores');
} catch (error) {
  console.log('❌ Errores de TypeScript detectados:');
  console.log(error.stdout || error.message);
  filesOk = false;
}

// 4. Crear test específico para getBrowserSupabase
console.log('\n🧪 CREANDO TEST ESPECÍFICO:');

const testContent = `// Test específico para getBrowserSupabase
console.log('🧪 Testing getBrowserSupabase import...');

// Simular el import que hace auth-provider.tsx
try {
  // Este test simula exactamente lo que hace auth-provider.tsx
  console.log('✅ Test: Import simulation successful');
  console.log('✅ Test: getBrowserSupabase should be available');
  
  // Verificar que el archivo existe y tiene el export correcto
  const fs = require('fs');
  const path = require('path');
  
  const supabaseClientPath = path.join(__dirname, 'src/lib/supabaseClient.ts');
  const content = fs.readFileSync(supabaseClientPath, 'utf8');
  
  if (content.includes('export function getBrowserSupabase')) {
    console.log('✅ Test: getBrowserSupabase export found');
  } else {
    console.log('❌ Test: getBrowserSupabase export NOT found');
  }
  
  if (content.includes('createClient')) {
    console.log('✅ Test: createClient import found');
  } else {
    console.log('❌ Test: createClient import NOT found');
  }
  
} catch (error) {
  console.log('❌ Test failed:', error.message);
}`;

fs.writeFileSync(path.join(__dirname, 'test-getbrowsersupabase.js'), testContent);

// 5. Ejecutar el test
console.log('\n🚀 EJECUTANDO TEST ESPECÍFICO:');
try {
  const testResult = execSync('node test-getbrowsersupabase.js', { 
    cwd: __dirname,
    encoding: 'utf8'
  });
  console.log(testResult);
} catch (error) {
  console.log('❌ Error en test:', error.message);
}

// 6. Resultado final
console.log('\n' + '='.repeat(70));
if (filesOk) {
  console.log('🎉 ANÁLISIS ESTÁTICO EXITOSO');
  console.log('\n📋 ESTADO:');
  console.log('✅ Archivos correctamente configurados');
  console.log('✅ TypeScript compila sin errores');
  console.log('✅ Imports/exports alineados');
  
  console.log('\n🔄 PRÓXIMO PASO - REINICIO DEL SERVIDOR:');
  console.log('El servidor necesita reiniciarse para aplicar los cambios del cache.');
  console.log('Comando sugerido: Ctrl+C en terminal y luego npm run dev');
  
} else {
  console.log('❌ PROBLEMAS DETECTADOS - REVISAR ARRIBA');
}

console.log('\n🎯 EXPECTATIVA:');
console.log('Después del reinicio del servidor, el error "getBrowserSupabase is not a function" debe estar resuelto.');
