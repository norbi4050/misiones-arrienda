const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Load .env.local manually
const envPath = path.join(__dirname, '.env.local')
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8')
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim()
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=')
      const value = valueParts.join('=')
      if (key && value) {
        process.env[key] = value
      }
    }
  })
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qfeyhaaxyemmnohqdele.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY no está definida')
  process.exit(1)
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

async function testDirectUpdate() {
  // Usuario Cesar (inmobiliaria migrada con UserProfile)
  const cesarUserId = 'a4ef1f3d-c3e8-46df-b186-5b5c837cc14b'
  // Usuario Carlos (inquilino con UserProfile)
  const carlosUserId = '6403f9d2-e846-4c70-87e0-e051127d9500'

  const testAvatarUrl = 'https://qfeyhaaxyemmnohqdele.supabase.co/storage/v1/object/public/avatars/test-direct-update.jpg'

  console.log('=== TESTING DIRECT DATABASE UPDATES WITH SERVICE ROLE ===\n')
  console.log(`Service Role Key presente: ${!!supabaseServiceKey}\n`)

  // Test 1: Update user_profiles for Cesar
  console.log('Test 1: Updating user_profiles.avatar_url for Cesar...')
  const { data: cesarProfileData, error: cesarProfileError } = await supabaseAdmin
    .from('user_profiles')
    .update({ avatar_url: testAvatarUrl })
    .eq('userId', cesarUserId)
    .select()

  if (cesarProfileError) {
    console.error('❌ Error:', cesarProfileError)
  } else {
    console.log(`✅ Success! Rows updated: ${cesarProfileData?.length || 0}`)
    console.log('   Data:', cesarProfileData)
  }

  // Test 2: Update users table for Cesar
  console.log('\nTest 2: Updating users.avatar for Cesar...')
  const { data: cesarUserData, error: cesarUserError } = await supabaseAdmin
    .from('users')
    .update({ avatar: testAvatarUrl, updated_at: new Date().toISOString() })
    .eq('id', cesarUserId)
    .select()

  if (cesarUserError) {
    console.error('❌ Error:', cesarUserError)
  } else {
    console.log(`✅ Success! Rows updated: ${cesarUserData?.length || 0}`)
    console.log('   Data:', cesarUserData)
  }

  // Test 3: Update user_profiles for Carlos
  console.log('\nTest 3: Updating user_profiles.avatar_url for Carlos...')
  const { data: carlosProfileData, error: carlosProfileError } = await supabaseAdmin
    .from('user_profiles')
    .update({ avatar_url: testAvatarUrl })
    .eq('userId', carlosUserId)
    .select()

  if (carlosProfileError) {
    console.error('❌ Error:', carlosProfileError)
  } else {
    console.log(`✅ Success! Rows updated: ${carlosProfileData?.length || 0}`)
    console.log('   Data:', carlosProfileData)
  }

  // Test 4: Update users table for Carlos
  console.log('\nTest 4: Updating users.avatar for Carlos...')
  const { data: carlosUserData, error: carlosUserError } = await supabaseAdmin
    .from('users')
    .update({ avatar: testAvatarUrl, updated_at: new Date().toISOString() })
    .eq('id', carlosUserId)
    .select()

  if (carlosUserError) {
    console.error('❌ Error:', carlosUserError)
  } else {
    console.log(`✅ Success! Rows updated: ${carlosUserData?.length || 0}`)
    console.log('   Data:', carlosUserData)
  }

  // Verify the updates
  console.log('\n=== VERIFICATION ===\n')

  console.log('Cesar (inmobiliaria):')
  const { data: cesarCheck } = await supabaseAdmin
    .from('users')
    .select('id, name, avatar')
    .eq('id', cesarUserId)
    .single()
  console.log('  users.avatar:', cesarCheck?.avatar || 'NULL')

  const { data: cesarProfileCheck } = await supabaseAdmin
    .from('user_profiles')
    .select('userId, avatar_url')
    .eq('userId', cesarUserId)
    .maybeSingle()
  console.log('  user_profiles.avatar_url:', cesarProfileCheck?.avatar_url || 'NULL')

  console.log('\nCarlos (inquilino):')
  const { data: carlosCheck } = await supabaseAdmin
    .from('users')
    .select('id, name, avatar')
    .eq('id', carlosUserId)
    .single()
  console.log('  users.avatar:', carlosCheck?.avatar || 'NULL')

  const { data: carlosProfileCheck } = await supabaseAdmin
    .from('user_profiles')
    .select('userId, avatar_url')
    .eq('userId', carlosUserId)
    .maybeSingle()
  console.log('  user_profiles.avatar_url:', carlosProfileCheck?.avatar_url || 'NULL')
}

testDirectUpdate()
  .then(() => console.log('\n✅ Test completed'))
  .catch(err => console.error('\n❌ Test failed:', err))
