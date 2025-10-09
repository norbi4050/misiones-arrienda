const { createBrowserSupabase } = require('./src/lib/supabase/browser.ts');

async function testConnection() {
  try {
    console.log('Testing Supabase browser client connection...');

    const supabase = createBrowserSupabase();

    // Try to get the current session (this should work without cookies)
    const { data, error } = await supabase.auth.getSession();

    if (error) {
      console.error('Error getting session:', error);
      return;
    }

    console.log('Connection successful!');
    console.log('Session data:', data);

  } catch (err) {
    console.error('Connection failed:', err);
  }
}

testConnection();
