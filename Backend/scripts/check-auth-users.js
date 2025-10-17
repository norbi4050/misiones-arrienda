/**
 * Check if users exist in Supabase auth.users table
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qfeyhaaxyemmnohqdele.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmZXloYWF4eWVtbW5vaHFkZWxlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTgxNjczOCwiZXhwIjoyMDcxMzkyNzM4fQ.5wJb1p0Rmg1dVIayIT4wZO_seDXTIwhVa36CyEgK-yM';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkAuthUsers() {
  console.log('============================================================================');
  console.log('CHECKING: auth.users table');
  console.log('============================================================================\n');

  const carlosId = '6403f9d2-e846-4c70-87e0-e051127d9500';
  const cesarId = 'a4ef1f3d-c3e8-46df-b186-5b5c837cc14b';

  console.log('Test 1: Check Carlos in public.users\n');
  const { data: carlosPublic, error: carlosPublicError } = await supabase
    .from('users')
    .select('id,email,name')
    .eq('id', carlosId)
    .maybeSingle();

  if (carlosPublicError) {
    console.log(`❌ Error: ${carlosPublicError.message}\n`);
  } else if (carlosPublic) {
    console.log(`✅ Carlos exists in public.users:`);
    console.log(`   ID: ${carlosPublic.id}`);
    console.log(`   Email: ${carlosPublic.email}`);
    console.log(`   Name: ${carlosPublic.name}\n`);
  } else {
    console.log(`⚠️ Carlos NOT found in public.users\n`);
  }

  console.log('Test 2: Check Cesar in public.users\n');
  const { data: cesarPublic, error: cesarPublicError } = await supabase
    .from('users')
    .select('id,email,name,company_name')
    .eq('id', cesarId)
    .maybeSingle();

  if (cesarPublicError) {
    console.log(`❌ Error: ${cesarPublicError.message}\n`);
  } else if (cesarPublic) {
    console.log(`✅ Cesar exists in public.users:`);
    console.log(`   ID: ${cesarPublic.id}`);
    console.log(`   Email: ${cesarPublic.email}`);
    console.log(`   Name: ${cesarPublic.name}`);
    console.log(`   Company: ${cesarPublic.company_name}\n`);
  } else {
    console.log(`⚠️ Cesar NOT found in public.users\n`);
  }

  // Try to list ALL users in auth.users (admin endpoint)
  console.log('Test 3: List users via Admin API\n');
  const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();

  if (authError) {
    console.log(`❌ Error listing auth users: ${authError.message}\n`);
  } else if (authUsers && authUsers.users) {
    console.log(`✅ Found ${authUsers.users.length} users in auth.users:\n`);
    authUsers.users.forEach(user => {
      console.log(`   - ID: ${user.id}`);
      console.log(`     Email: ${user.email}`);
      console.log(`     Created: ${user.created_at}`);
      console.log(`     Last Sign In: ${user.last_sign_in_at || 'Never'}\n`);
    });
  }

  console.log('\n============================================================================');
  console.log('DIAGNOSIS:');
  console.log('============================================================================\n');
  console.log('The app uses TWO separate authentication systems:');
  console.log('1. Custom JWT (localStorage) - Used by frontend via useAuth hook');
  console.log('2. Supabase Auth (cookies) - Expected by middleware\n');
  console.log('ISSUE: Middleware checks for Supabase auth, but login endpoint uses custom JWT\n');
  console.log('SOLUTION: Need to align authentication systems or modify middleware\n');
}

checkAuthUsers().catch(console.error);
