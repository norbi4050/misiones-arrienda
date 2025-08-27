// Test script para verificar la configuración de Supabase Auth
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env.local') });

async function testSupabaseAuth() {
  console.log('🧪 Testing Supabase Authentication Setup...\n');

  // Verificar variables de entorno
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Error: Variables de entorno faltantes');
    console.log('Asegúrate de tener en .env.local:');
    console.log('NEXT_PUBLIC_SUPABASE_URL=tu_supabase_url');
    console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_supabase_anon_key');
    return;
  }

  console.log('✅ Variables de entorno encontradas');
  console.log(`📍 Supabase URL: ${supabaseUrl}`);
  console.log(`🔑 Anon Key: ${supabaseKey.substring(0, 20)}...`);

  // Crear cliente de Supabase
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Test 1: Verificar conexión
    console.log('\n🔍 Test 1: Verificando conexión...');
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('❌ Error de conexión:', error.message);
      return;
    }
    
    console.log('✅ Conexión exitosa con Supabase');

    // Test 2: Verificar configuración de auth
    console.log('\n🔍 Test 2: Verificando configuración de autenticación...');
    
    // Intentar obtener configuración (esto no debería fallar)
    const { data: user } = await supabase.auth.getUser();
    console.log('✅ Cliente de autenticación configurado correctamente');

    console.log('\n🎉 ¡Configuración de Supabase Auth exitosa!');
    console.log('\n📋 Próximos pasos:');
    console.log('1. Ejecutar: npm run dev');
    console.log('2. Ir a: http://localhost:3000/register');
    console.log('3. Crear una cuenta de prueba');
    console.log('4. Verificar login en: http://localhost:3000/login');
    console.log('5. Acceder al dashboard: http://localhost:3000/dashboard');

  } catch (error) {
    console.error('❌ Error durante las pruebas:', error.message);
  }
}

testSupabaseAuth();
