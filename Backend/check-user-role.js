const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load env vars manually
const envPath = path.join(__dirname, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) {
    const key = match[1].trim();
    const value = match[2].trim();
    process.env[key] = value;
  }
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
  const userId = 'a4ef1f3d-c3e8-46df-b186-5b5c837cc14b';

  console.log('=== Checking user_profiles table ===\n');

  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('userId', userId)
    .maybeSingle();

  if (profileError) {
    console.error('Error fetching profile:', profileError);
  } else if (profile) {
    console.log('Profile found in user_profiles:');
    console.log('- userId:', profile.userId);
    console.log('- role:', profile.role);
    console.log('- email:', profile.email);
    console.log('- display_name:', profile.display_name);
    console.log('- is_company:', profile.is_company);
    console.log('- Full profile:', JSON.stringify(profile, null, 2));
  } else {
    console.log('❌ No profile found in user_profiles table');
  }

  console.log('\n=== Checking users table ===\n');

  const { data: user, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (userError) {
    console.error('Error fetching user:', userError);
  } else if (user) {
    console.log('User found in users table:');
    console.log('- id:', user.id);
    console.log('- user_type:', user.user_type);
    console.log('- email:', user.email);
    console.log('- name:', user.name);
    console.log('- company_name:', user.company_name);
    console.log('- Full user:', JSON.stringify(user, null, 2));
  } else {
    console.log('❌ No user found in users table');
  }

  console.log('\n=== Checking auth.users metadata ===\n');

  const { data: authData, error: authError } = await supabase.auth.admin.getUserById(userId);

  if (authError) {
    console.error('Error fetching auth user:', authError);
  } else if (authData.user) {
    console.log('Auth user metadata:');
    console.log('- id:', authData.user.id);
    console.log('- email:', authData.user.email);
    console.log('- user_metadata:', JSON.stringify(authData.user.user_metadata, null, 2));
    console.log('- app_metadata:', JSON.stringify(authData.user.app_metadata, null, 2));
  } else {
    console.log('❌ No auth user found');
  }
})();
