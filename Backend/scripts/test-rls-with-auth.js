/**
 * Test RLS con usuario autenticado
 * Simula la petición del endpoint /api/users/avatar
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qfeyhaaxyemmnohqdele.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmZXloYWF4eWVtbW5vaHFkZWxlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4MTY3MzgsImV4cCI6MjA3MTM5MjczOH0.vgrh055OkiBIJFBlRlEuEZAOF2FHo3LBUNitB09dSIE';

async function test() {
  // Primer test: Login como Carlos
  console.log('============================================================================');
  console.log('TEST: RLS con usuario autenticado');
  console.log('============================================================================\n');

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  // Login como Carlos
  console.log('1. Haciendo login como Carlos (cgonzalezarchilla@gmail.com)...\n');

  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'cgonzalezarchilla@gmail.com',
    password: 'tu_password_aqui' // NOTA: Necesitas poner la password real
  });

  if (authError) {
    console.log(`❌ Error en login: ${authError.message}`);
    console.log('   (Esto es esperado si no tienes la password)\n');
    console.log('ALTERNATIVA: Probemos sin autenticación pero con policy pública...\n');
    testWithoutAuth();
    return;
  }

  console.log(`✅ Login exitoso como: ${authData.user.email}`);
  console.log(`   User ID: ${authData.user.id}\n`);

  // Test 2: Intentar leer su propio perfil
  console.log('2. Leyendo propio perfil desde tabla users...\n');

  const { data: ownProfile, error: ownError } = await supabase
    .from('users')
    .select('id,name,email,profile_image')
    .eq('id', authData.user.id)
    .maybeSingle();

  if (ownError) {
    console.log(`❌ Error: ${ownError.message}\n`);
  } else if (ownProfile) {
    console.log('✅ Propio perfil leído exitosamente:');
    console.log(`   Name: ${ownProfile.name}`);
    console.log(`   Profile Image: ${ownProfile.profile_image || 'NULL'}\n`);
  } else {
    console.log('⚠️ Propio perfil no encontrado (NULL)\n');
  }

  // Test 3: Intentar leer perfil de Cesar (otro usuario)
  console.log('3. Leyendo perfil de Cesar (otro usuario)...\n');

  const cesarId = 'a4ef1f3d-c3e8-46df-b186-5b5c837cc14b';
  const { data: otherProfile, error: otherError } = await supabase
    .from('users')
    .select('id,name,email,logo_url')
    .eq('id', cesarId)
    .maybeSingle();

  if (otherError) {
    console.log(`❌ Error: ${otherError.message}`);
    console.log('   RLS está bloqueando lectura de otros usuarios\n');
  } else if (otherProfile) {
    console.log('✅ Perfil de otro usuario leído exitosamente:');
    console.log(`   Name: ${otherProfile.name}`);
    console.log(`   Logo URL: ${otherProfile.logo_url || 'NULL'}`);
    console.log('\n✅✅ RLS POLICY FUNCIONA CORRECTAMENTE! ✅✅\n');
  } else {
    console.log('⚠️ Perfil de otro usuario no encontrado (NULL)');
    console.log('   RLS puede estar bloqueando\n');
  }

  await supabase.auth.signOut();
}

async function testWithoutAuth() {
  console.log('TEST ALTERNATIVO: Sin autenticación (solo ANON key)\n');

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  const { data, error } = await supabase
    .from('users')
    .select('id,name')
    .eq('id', '6403f9d2-e846-4c70-87e0-e051127d9500')
    .maybeSingle();

  if (error) {
    console.log(`❌ Error sin auth: ${error.message}`);
    console.log('   Esto es esperado si la policy requiere authenticated\n');
  } else if (data) {
    console.log('✅ Dato leído sin autenticación:', data);
  } else {
    console.log('⚠️ NULL retornado sin autenticación');
  }
}

test().catch(console.error);
