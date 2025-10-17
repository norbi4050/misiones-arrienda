/**
 * Test middleware cookie reading
 * This simulates what the middleware sees when checking auth
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qfeyhaaxyemmnohqdele.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmZXloYWF4eWVtbW5vaHFkZWxlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4MTY3MzgsImV4cCI6MjA3MTM5MjczOH0.vgrh055OkiBIJFBlRlEuEZAOF2FHo3LBUNitB09dSIE';

async function testMiddlewareCookies() {
  console.log('============================================================================');
  console.log('TEST: Middleware Cookie Reading Simulation');
  console.log('============================================================================\n');

  console.log('Creating Supabase client (ANON key, like middleware)...\n');

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  // Test 1: Try to get session (should fail if no cookies)
  console.log('Test 1: supabase.auth.getSession() (like middleware does)...\n');

  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

  if (sessionError) {
    console.log(`❌ Error getting session: ${sessionError.message}\n`);
  } else if (sessionData.session) {
    console.log(`✅ Session found!`);
    console.log(`   User ID: ${sessionData.session.user.id}`);
    console.log(`   Email: ${sessionData.session.user.email}`);
    console.log(`   Expires: ${new Date(sessionData.session.expires_at * 1000).toISOString()}\n`);
  } else {
    console.log(`⚠️ No session found (NULL)\n`);
    console.log('   This is what middleware sees - no session = redirect to login\n');
  }

  // Test 2: Try to get user (like middleware line 95)
  console.log('Test 2: supabase.auth.getUser() (middleware line 95)...\n');

  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError) {
    console.log(`❌ Error getting user: ${userError.message}\n`);
  } else if (userData.user) {
    console.log(`✅ User found!`);
    console.log(`   User ID: ${userData.user.id}`);
    console.log(`   Email: ${userData.user.email}\n`);
  } else {
    console.log(`⚠️ No user found (NULL)\n`);
    console.log('   Middleware redirects to /login because user is NULL\n');
  }

  console.log('============================================================================');
  console.log('DIAGNOSIS:');
  console.log('============================================================================\n');
  console.log('Node.js server scripts CANNOT access browser cookies.');
  console.log('The middleware in Next.js runs on the server and should see cookies');
  console.log('from the incoming HTTP request.\n');
  console.log('The issue is that middleware expects Supabase SSR cookies to exist,');
  console.log('but if cookies are not properly set during login, middleware fails.\n');
  console.log('NEXT STEP: Check browser console and DevTools → Application → Cookies');
  console.log('to see what cookies are actually set after login.\n');
  console.log('Expected cookies:');
  console.log('  - sb-qfeyhaaxyemmnohqdele-auth-token (or similar)');
  console.log('  - sb-qfeyhaaxyemmnohqdele-auth-token-code-verifier (for PKCE flow)\n');
}

testMiddlewareCookies().catch(console.error);
