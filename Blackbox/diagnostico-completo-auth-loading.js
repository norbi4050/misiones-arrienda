const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

console.log('🔍 DIAGNÓSTICO COMPLETO - CARGA INFINITA EN AUTENTICACIÓN\n');

// Verificar variables de entorno
console.log('📋 VERIFICANDO VARIABLES DE ENTORNO:');
const envPath = path.join(process.cwd(), 'Backend', '.env.local');
const envExamplePath = path.join(process.cwd(), 'Backend', '.env.example');

if (fs.existsSync(envPath)) {
  console.log('✅ Archivo .env.local encontrado');
  const envContent = fs.readFileSync(envPath, 'utf8');
  const hasSupabaseUrl = envContent.includes('NEXT_PUBLIC_SUPABASE_URL');
  const hasSupabaseKey = envContent.includes('NEXT_PUBLIC_SUPABASE_ANON_KEY');

  console.log(`   - NEXT_PUBLIC_SUPABASE_URL: ${hasSupabaseUrl ? '✅ Presente' : '❌ Faltante'}`);
  console.log(`   - NEXT_PUBLIC_SUPABASE_ANON_KEY: ${hasSupabaseKey ? '✅ Presente' : '❌ Faltante'}`);
} else {
  console.log('❌ Archivo .env.local NO encontrado');
  if (fs.existsSync(envExamplePath)) {
    console.log('ℹ️  Archivo .env.example encontrado - usar como referencia');
  }
}

// Verificar configuración de Supabase
console.log('\n🔧 VERIFICANDO CONFIGURACIÓN DE SUPABASE:');
try {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.log('❌ Variables de entorno de Supabase no configuradas');
    console.log('   Asegúrate de tener NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY');
    process.exit(1);
  }

  console.log('✅ Variables de entorno configuradas');
  console.log(`   URL: ${supabaseUrl.substring(0, 30)}...`);
  console.log(`   Key: ${supabaseKey.substring(0, 20)}...`);

  // Probar conexión
  console.log('\n🌐 PROBANDO CONEXIÓN CON SUPABASE:');
  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });

  // Verificar conexión básica
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    console.log('❌ Error de conexión:', error.message);
  } else {
    console.log('✅ Conexión básica exitosa');
  }

  // Verificar tabla users
  console.log('\n📊 VERIFICANDO TABLA USERS:');
  const { data: usersData, error: usersError } = await supabase
    .from('users')
    .select('count')
    .limit(1);

  if (usersError) {
    console.log('❌ Error al acceder tabla users:', usersError.message);
    console.log('   Posibles causas:');
    console.log('   - La tabla no existe');
    console.log('   - Políticas RLS bloqueando acceso');
    console.log('   - Permisos insuficientes');
  } else {
    console.log('✅ Tabla users accesible');
  }

  // Verificar políticas RLS
  console.log('\n🔒 VERIFICANDO POLÍTICAS RLS:');
  const { data: policiesData, error: policiesError } = await supabase
    .rpc('get_policies_info');

  if (policiesError) {
    console.log('⚠️  No se pudo verificar políticas RLS automáticamente');
    console.log('   Error:', policiesError.message);
  } else {
    console.log('✅ Políticas RLS verificadas');
    console.log('   Políticas encontradas:', policiesData?.length || 0);
  }

} catch (error) {
  console.log('❌ Error durante diagnóstico:', error.message);
}

// Verificar archivos de configuración
console.log('\n📁 VERIFICANDO ARCHIVOS DE CONFIGURACIÓN:');
const filesToCheck = [
  'Backend/src/hooks/useSupabaseAuth.ts',
  'Backend/src/lib/supabase/client.ts',
  'Backend/src/middleware.ts',
  'Backend/src/app/login/page.tsx',
  'Backend/src/app/register/page.tsx',
  'Backend/src/app/publicar/page.tsx'
];

filesToCheck.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file} - Encontrado`);
  } else {
    console.log(`❌ ${file} - NO encontrado`);
  }
});

// Recomendaciones
console.log('\n💡 RECOMENDACIONES PARA SOLUCIONAR CARGA INFINITA:');
console.log('1. Verificar que las variables de entorno estén correctamente configuradas');
console.log('2. Asegurarse de que la tabla users existe en Supabase');
console.log('3. Verificar que las políticas RLS permitan el acceso adecuado');
console.log('4. Comprobar que el middleware no esté causando bucles de redirección');
console.log('5. Revisar la consola del navegador en busca de errores de JavaScript');
console.log('6. Verificar que el hook useSupabaseAuth no tenga dependencias circulares');

console.log('\n🔍 Para más detalles, ejecuta:');
console.log('   npm run dev');
console.log('   Abre la consola del navegador y verifica errores');
console.log('   Revisa las pestañas Network para ver si hay peticiones fallidas');

console.log('\n✨ Diagnóstico completado.');
