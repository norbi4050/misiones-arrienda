const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qfeyhaaxyemmnohqdele.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY no está definida en .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testAvatarUpdate() {
  const userId = 'a4ef1f3d-c3e8-46df-b186-5b5c837cc14b' // Cesar/Baldes
  const testAvatarUrl = 'https://ui-avatars.com/api/?name=Test&background=FF0000&color=fff'

  console.log('=== Testing Avatar Update ===\n')
  console.log(`User ID: ${userId}`)
  console.log(`Test Avatar URL: ${testAvatarUrl}\n`)

  try {
    // 1. Intentar actualizar user_profiles
    console.log('1. Intentando actualizar user_profiles...')
    const { data: profileData, error: profileError } = await supabase
      .from('user_profiles')
      .update({ avatar_url: testAvatarUrl, updated_at: new Date().toISOString() })
      .eq('userId', userId)
      .select()

    if (profileError) {
      console.log('❌ Error updating user_profiles:', profileError)
    } else if (profileData && profileData.length > 0) {
      console.log('✅ user_profiles updated:', profileData.length, 'rows')
    } else {
      console.log('⚠️  user_profiles: 0 rows updated (usuario no tiene user_profiles)')
    }

    // 2. Intentar actualizar users
    console.log('\n2. Intentando actualizar users...')
    const { data: userData, error: userError } = await supabase
      .from('users')
      .update({ avatar: testAvatarUrl, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select()

    if (userError) {
      console.log('❌ Error updating users:', userError)
    } else if (userData && userData.length > 0) {
      console.log('✅ users updated:', userData.length, 'rows')
      console.log('   Nuevo avatar:', userData[0].avatar)
    } else {
      console.log('⚠️  users: 0 rows updated')
    }

  } catch (error) {
    console.error('Error:', error)
  }
}

testAvatarUpdate()
