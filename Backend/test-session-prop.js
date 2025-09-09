const { createServerClient } = require('@supabase/ssr');
const { cookies } = require('next/headers');

// Test to verify session prop is being passed correctly
async function testSessionProp() {
  console.log('Testing session prop functionality...');

  try {
    // Simulate the page.tsx logic
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      { cookies: { get: (k) => cookieStore.get(k)?.value } }
    );

    const { data: { session } } = await supabase.auth.getSession();

    console.log('Session fetched:', session ? 'YES' : 'NO');
    console.log('Session user ID:', session?.user?.id || 'No user ID');

    // Test the component prop passing
    const sessionProp = session ?? null;
    console.log('Session prop to pass:', sessionProp ? 'Session object' : 'null');

    return {
      sessionExists: !!session,
      userId: session?.user?.id,
      sessionProp: sessionProp
    };

  } catch (error) {
    console.error('Error testing session prop:', error);
    return { error: error.message };
  }
}

// Export for use in other tests
module.exports = { testSessionProp };

// Run if called directly
if (require.main === module) {
  testSessionProp().then(result => {
    console.log('Test result:', result);
  });
}
