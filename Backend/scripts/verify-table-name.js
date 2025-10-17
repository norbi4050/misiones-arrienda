/**
 * Script para verificar nombre exacto de tabla y RLS
 * Fecha: 16 de Enero 2025
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qfeyhaaxyemmnohqdele.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmZXloYWF4eWVtbW5vaHFkZWxlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTgxNjczOCwiZXhwIjoyMDcxMzkyNzM4fQ.5wJb1p0Rmg1dVIayIT4wZO_seDXTIwhVa36CyEgK-yM';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmZXloYWF4eWVtbW5vaHFkZWxlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4MTY3MzgsImV4cCI6MjA3MTM5MjczOH0.vgrh055OkiBIJFBlRlEuEZAOF2FHo3LBUNitB09dSIE';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);

console.log('============================================================================');
console.log('VERIFICACIÓN: Nombre de tabla y RLS');
console.log('============================================================================\n');

async function verify() {
  const userId = '6403f9d2-e846-4c70-87e0-e051127d9500';

  // Test 1: public."User" con SERVICE ROLE
  console.log('--- Test 1: public."User" (CamelCase) con SERVICE ROLE ---\n');
  const { data: data1, error: error1 } = await supabaseAdmin
    .from('User')
    .select('id,name,email,avatar')
    .eq('id', userId)
    .maybeSingle();

  if (error1) {
    console.log(`❌ Error: ${error1.message}`);
    console.log(`   Code: ${error1.code}\n`);
  } else if (data1) {
    console.log('✅ Usuario encontrado:');
    console.log(`   ID: ${data1.id}`);
    console.log(`   Name: ${data1.name}`);
    console.log(`   Avatar: ${data1.avatar || 'NULL'}\n`);
  } else {
    console.log('⚠️ Query exitosa pero usuario no encontrado (NULL)\n');
  }

  // Test 2: public.users (snake_case) con SERVICE ROLE
  console.log('--- Test 2: public.users (snake_case) con SERVICE ROLE ---\n');
  const { data: data2, error: error2 } = await supabaseAdmin
    .from('users')
    .select('id,name,email,avatar,profile_image,logo_url')
    .eq('id', userId)
    .maybeSingle();

  if (error2) {
    console.log(`❌ Error: ${error2.message}`);
    console.log(`   Code: ${error2.code}\n`);
  } else if (data2) {
    console.log('✅ Usuario encontrado:');
    console.log(`   ID: ${data2.id}`);
    console.log(`   Name: ${data2.name}`);
    console.log(`   Avatar: ${data2.avatar || 'NULL'}`);
    console.log(`   Profile Image: ${data2.profile_image || 'NULL'}`);
    console.log(`   Logo URL: ${data2.logo_url || 'NULL'}\n`);
  } else {
    console.log('⚠️ Query exitosa pero usuario no encontrado (NULL)\n');
  }

  // Test 3: public.users con ANON KEY (como lo hace el endpoint)
  console.log('--- Test 3: public.users (snake_case) con ANON KEY (RLS activo) ---\n');
  const { data: data3, error: error3 } = await supabaseAnon
    .from('users')
    .select('id,name,email,avatar,profile_image,logo_url')
    .eq('id', userId)
    .maybeSingle();

  if (error3) {
    console.log(`❌ Error: ${error3.message}`);
    console.log(`   Code: ${error3.code}`);
    console.log(`   ⚠️ Esto indica que RLS está bloqueando la query\n`);
  } else if (data3) {
    console.log('✅ Usuario encontrado (RLS permite lectura):');
    console.log(`   ID: ${data3.id}`);
    console.log(`   Name: ${data3.name}\n`);
  } else {
    console.log('⚠️ Query exitosa pero usuario no encontrado (NULL)');
    console.log('   RLS puede estar bloqueando el resultado\n');
  }

  // Test 4: public."User" con ANON KEY
  console.log('--- Test 4: public."User" (CamelCase) con ANON KEY (RLS activo) ---\n');
  const { data: data4, error: error4 } = await supabaseAnon
    .from('User')
    .select('id,name,email,avatar')
    .eq('id', userId)
    .maybeSingle();

  if (error4) {
    console.log(`❌ Error: ${error4.message}`);
    console.log(`   Code: ${error4.code}\n`);
  } else if (data4) {
    console.log('✅ Usuario encontrado (RLS permite lectura):');
    console.log(`   ID: ${data4.id}`);
    console.log(`   Name: ${data4.name}\n`);
  } else {
    console.log('⚠️ Query exitosa pero usuario no encontrado (NULL)\n');
  }

  console.log('============================================================================');
  console.log('CONCLUSIÓN');
  console.log('============================================================================\n');

  if (!error1 && data1) {
    console.log('✓ Tabla public."User" (CamelCase) existe y tiene datos');
  }
  if (!error2 && data2) {
    console.log('✓ Tabla public.users (snake_case) existe y tiene datos');
  }
  if (error3 || !data3) {
    console.log('✗ RLS está bloqueando lectura en public.users con ANON KEY');
    console.log('  → ESTE ES EL PROBLEMA del endpoint /api/users/avatar');
  }
  if (!error4 && data4) {
    console.log('✓ RLS permite lectura en public."User" con ANON KEY');
  }
}

verify();
