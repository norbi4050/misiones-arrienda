/**
 * Test script para diagnosticar error de perfil de inquilino
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testTenantProfile() {
  console.log('🔍 Testing tenant profile creation...\n');

  const tenantUserId = '6403f9d2-e846-4c70-87e0-e051127d9500';

  try {
    // 1. Verificar si el usuario existe
    console.log('1️⃣ Checking if user exists in users table...');
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, user_type')
      .eq('id', tenantUserId)
      .single();

    if (userError) {
      console.error('❌ Error getting user:', userError.message);
      return;
    }

    console.log('✅ User found:', user);
    console.log('');

    // 2. Verificar si ya tiene perfil
    console.log('2️⃣ Checking if profile exists...');
    const { data: existingProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('userId', tenantUserId)
      .maybeSingle();

    if (profileError) {
      console.error('❌ Error checking profile:', profileError.message);
    } else if (existingProfile) {
      console.log('✅ Profile already exists:', existingProfile);
      console.log('');
      return;
    } else {
      console.log('⚠️  No profile found, attempting to create...');
      console.log('');
    }

    // 3. Intentar crear perfil
    console.log('3️⃣ Attempting to create profile...');
    const payload = {
      userId: tenantUserId,
      role: 'BUSCO',
      city: null,
      budgetMin: null,
      budgetMax: null,
      bio: null,
      acceptsMessages: true,
      updatedAt: new Date().toISOString(),
    };

    console.log('Payload:', JSON.stringify(payload, null, 2));

    const { data: newProfile, error: insertError } = await supabase
      .from('user_profiles')
      .insert(payload)
      .select()
      .single();

    if (insertError) {
      console.error('❌ Insert error:', insertError);
      console.error('   Code:', insertError.code);
      console.error('   Details:', insertError.details);
      console.error('   Hint:', insertError.hint);
      console.error('   Message:', insertError.message);
      console.log('');

      // Verificar políticas RLS
      console.log('4️⃣ Checking RLS policies on user_profiles...');
      const { data: policies, error: policiesError } = await supabase
        .rpc('pg_policies')
        .eq('tablename', 'user_profiles');

      if (policiesError) {
        console.log('   Could not fetch RLS policies');
      } else {
        console.log('   RLS policies:', policies);
      }
    } else {
      console.log('✅ Profile created successfully:', newProfile);
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

testTenantProfile();
