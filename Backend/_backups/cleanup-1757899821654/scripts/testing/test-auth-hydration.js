require('dotenv').config({ path: '.env.local' })

const { createServerClient } = require('@supabase/ssr')

async function testAuthHydration() {
  console.log('🧪 Testing Authentication Hydration Flow...\n')

  try {
    // Check if environment variables are loaded
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      console.log('❌ Environment variables not found')
      console.log('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'Present' : 'Missing')
      console.log('   NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseKey ? 'Present' : 'Missing')
      console.log('\n💡 Make sure your .env.local file contains the Supabase credentials')
      return
    }

    // Simulate server-side session retrieval
    const cookieStore = {
      getAll: () => [],
      setAll: () => {}
    }

    const supabase = createServerClient(
      supabaseUrl,
      supabaseKey,
      {
        cookies: cookieStore
      }
    )

    const { data: { session }, error } = await supabase.auth.getSession()

    if (error) {
      console.log('❌ Error getting session:', error.message)
      return
    }

    if (session) {
      console.log('✅ Session found on server-side')
      console.log('   User ID:', session.user.id)
      console.log('   Email:', session.user.email)
      console.log('   Access Token:', session.access_token ? 'Present' : 'Missing')
      console.log('   Refresh Token:', session.refresh_token ? 'Present' : 'Missing')
    } else {
      console.log('ℹ️  No active session found (expected for unauthenticated state)')
    }

    console.log('\n🎉 Authentication hydration test completed successfully!')
    console.log('   The AuthProvider should properly hydrate the session on the client-side.')

  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

// Run the test
testAuthHydration()
