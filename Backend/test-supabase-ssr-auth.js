/**
 * TESTING EXHAUSTIVO - SUPABASE SSR AUTH
 * Pruebas completas del sistema de autenticación con @supabase/ssr
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 INICIANDO AUDITORÍA COMPLETA - SUPABASE SSR AUTH');
console.log('=' .repeat(60));

// Función para ejecutar comandos y capturar salida
function runCommand(command, description) {
  console.log(`\n📋 ${description}`);
  console.log(`💻 Ejecutando: ${command}`);
  try {
    const output = execSync(command, { 
      encoding: 'utf8', 
      cwd: __dirname,
      timeout: 30000 
    });
    console.log('✅ ÉXITO');
    if (output.trim()) {
      console.log(`📄 Salida:\n${output.trim()}`);
    }
    return { success: true, output: output.trim() };
  } catch (error) {
    console.log('❌ ERROR');
    console.log(`🚨 Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Función para verificar archivos
function checkFile(filePath, description) {
  console.log(`\n📁 Verificando: ${description}`);
  console.log(`📍 Ruta: ${filePath}`);
  
  if (fs.existsSync(filePath)) {
    const stats = fs.statSync(filePath);
    console.log(`✅ Archivo existe (${stats.size} bytes)`);
    
    // Leer contenido para análisis
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      console.log(`📊 Líneas: ${content.split('\n').length}`);
      
      // Verificaciones específicas según el tipo de archivo
      if (filePath.includes('middleware.ts')) {
        const hasSupabaseSSR = content.includes('@supabase/ssr');
        const hasCreateServerClient = content.includes('createServerClient');
        const hasAuthCheck = content.includes('getUser()');
        const hasProtectedRoutes = content.includes('protectedRoutes');
        
        console.log(`🔐 Supabase SSR: ${hasSupabaseSSR ? '✅' : '❌'}`);
        console.log(`🔐 Server Client: ${hasCreateServerClient ? '✅' : '❌'}`);
        console.log(`🔐 Auth Check: ${hasAuthCheck ? '✅' : '❌'}`);
        console.log(`🔐 Protected Routes: ${hasProtectedRoutes ? '✅' : '❌'}`);
        
        return {
          exists: true,
          hasSupabaseSSR,
          hasCreateServerClient,
          hasAuthCheck,
          hasProtectedRoutes
        };
      }
      
      if (filePath.includes('supabase/client.ts')) {
        const hasBrowserClient = content.includes('createBrowserClient');
        console.log(`🌐 Browser Client: ${hasBrowserClient ? '✅' : '❌'}`);
        return { exists: true, hasBrowserClient };
      }
      
      if (filePath.includes('supabase/server.ts')) {
        const hasServerClient = content.includes('createServerClient');
        const hasCookies = content.includes('cookies');
        console.log(`🖥️ Server Client: ${hasServerClient ? '✅' : '❌'}`);
        console.log(`🍪 Cookies: ${hasCookies ? '✅' : '❌'}`);
        return { exists: true, hasServerClient, hasCookies };
      }
      
      return { exists: true, content: content.substring(0, 200) + '...' };
    } catch (error) {
      console.log(`⚠️ Error leyendo archivo: ${error.message}`);
      return { exists: true, error: error.message };
    }
  } else {
    console.log('❌ Archivo no existe');
    return { exists: false };
  }
}

// Función para verificar variables de entorno
function checkEnvironmentVariables() {
  console.log('\n🌍 VERIFICANDO VARIABLES DE ENTORNO');
  console.log('-'.repeat(40));
  
  const envFile = path.join(__dirname, '.env.local');
  if (fs.existsSync(envFile)) {
    console.log('✅ Archivo .env.local encontrado');
    const envContent = fs.readFileSync(envFile, 'utf8');
    
    const hasSupabaseUrl = envContent.includes('NEXT_PUBLIC_SUPABASE_URL');
    const hasSupabaseKey = envContent.includes('NEXT_PUBLIC_SUPABASE_ANON_KEY');
    
    console.log(`🔗 SUPABASE_URL: ${hasSupabaseUrl ? '✅' : '❌'}`);
    console.log(`🔑 SUPABASE_ANON_KEY: ${hasSupabaseKey ? '✅' : '❌'}`);
    
    return { hasEnvFile: true, hasSupabaseUrl, hasSupabaseKey };
  } else {
    console.log('❌ Archivo .env.local no encontrado');
    return { hasEnvFile: false };
  }
}

// Función para verificar dependencias
function checkDependencies() {
  console.log('\n📦 VERIFICANDO DEPENDENCIAS');
  console.log('-'.repeat(40));
  
  const packageJsonPath = path.join(__dirname, 'package.json');
  if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
    
    const supabaseSSR = deps['@supabase/ssr'];
    const supabaseJS = deps['@supabase/supabase-js'];
    const nextJS = deps['next'];
    
    console.log(`📦 @supabase/ssr: ${supabaseSSR || '❌ No instalado'}`);
    console.log(`📦 @supabase/supabase-js: ${supabaseJS || '❌ No instalado'}`);
    console.log(`📦 next: ${nextJS || '❌ No instalado'}`);
    
    return {
      hasSupabaseSSR: !!supabaseSSR,
      hasSupabaseJS: !!supabaseJS,
      hasNext: !!nextJS,
      versions: { supabaseSSR, supabaseJS, nextJS }
    };
  }
  
  return { error: 'package.json no encontrado' };
}

// EJECUTAR AUDITORÍA COMPLETA
async function runCompleteAudit() {
  const results = {
    timestamp: new Date().toISOString(),
    tests: []
  };
  
  // 1. Verificar dependencias
  console.log('\n🔍 FASE 1: DEPENDENCIAS');
  const depsResult = checkDependencies();
  results.tests.push({ name: 'Dependencies Check', result: depsResult });
  
  // 2. Verificar variables de entorno
  console.log('\n🔍 FASE 2: VARIABLES DE ENTORNO');
  const envResult = checkEnvironmentVariables();
  results.tests.push({ name: 'Environment Variables', result: envResult });
  
  // 3. Verificar archivos SSR
  console.log('\n🔍 FASE 3: ARCHIVOS SSR');
  const middlewareResult = checkFile(
    path.join(__dirname, 'src/middleware.ts'),
    'Middleware SSR Auth'
  );
  results.tests.push({ name: 'Middleware SSR', result: middlewareResult });
  
  const clientResult = checkFile(
    path.join(__dirname, 'src/lib/supabase/client.ts'),
    'Supabase Browser Client'
  );
  results.tests.push({ name: 'Browser Client', result: clientResult });
  
  const serverResult = checkFile(
    path.join(__dirname, 'src/lib/supabase/server.ts'),
    'Supabase Server Client'
  );
  results.tests.push({ name: 'Server Client', result: serverResult });
  
  // 4. Verificar compilación TypeScript
  console.log('\n🔍 FASE 4: COMPILACIÓN TYPESCRIPT');
  const tscResult = runCommand('npx tsc --noEmit', 'Verificación TypeScript');
  results.tests.push({ name: 'TypeScript Compilation', result: tscResult });
  
  // 5. Verificar build de Next.js
  console.log('\n🔍 FASE 5: BUILD NEXT.JS');
  const buildResult = runCommand('npm run build', 'Build de producción');
  results.tests.push({ name: 'Next.js Build', result: buildResult });
  
  // 6. Generar reporte final
  console.log('\n📊 GENERANDO REPORTE FINAL');
  const reportPath = path.join(__dirname, 'REPORTE-AUDITORIA-SSR-AUTH.json');
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  console.log(`✅ Reporte guardado en: ${reportPath}`);
  
  // Resumen final
  console.log('\n' + '='.repeat(60));
  console.log('📋 RESUMEN DE AUDITORÍA SSR AUTH');
  console.log('='.repeat(60));
  
  const totalTests = results.tests.length;
  const passedTests = results.tests.filter(test => 
    test.result.success !== false && 
    test.result.exists !== false &&
    !test.result.error
  ).length;
  
  console.log(`✅ Tests pasados: ${passedTests}/${totalTests}`);
  console.log(`📊 Porcentaje de éxito: ${Math.round((passedTests/totalTests) * 100)}%`);
  
  // Verificaciones críticas
  const criticalChecks = [
    middlewareResult.hasSupabaseSSR && middlewareResult.hasAuthCheck,
    clientResult.hasBrowserClient,
    serverResult.hasServerClient && serverResult.hasCookies,
    depsResult.hasSupabaseSSR,
    envResult.hasSupabaseUrl && envResult.hasSupabaseKey
  ];
  
  const criticalPassed = criticalChecks.filter(Boolean).length;
  console.log(`🔐 Verificaciones críticas: ${criticalPassed}/${criticalChecks.length}`);
  
  if (criticalPassed === criticalChecks.length) {
    console.log('🎉 ¡AUDITORÍA SSR AUTH COMPLETADA CON ÉXITO!');
    console.log('✅ Todas las verificaciones críticas pasaron');
  } else {
    console.log('⚠️ AUDITORÍA COMPLETADA CON ADVERTENCIAS');
    console.log('❌ Algunas verificaciones críticas fallaron');
  }
  
  return results;
}

// Ejecutar auditoría
runCompleteAudit().catch(console.error);
