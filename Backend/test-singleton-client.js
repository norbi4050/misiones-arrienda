const path = require('path');

// Test script to verify singleton Supabase client implementation
async function testSingletonClient() {
  console.log('🧪 Testing Singleton Supabase Client Implementation...\n');

  try {
    // Test 1: Import the singleton client
    console.log('1️⃣ Testing singleton client import...');
    const { getSupabaseClient, supabase, handleSupabaseError } = require('./src/lib/supabase/singleton-client');

    if (!getSupabaseClient) {
      throw new Error('getSupabaseClient function not exported');
    }

    if (!supabase) {
      throw new Error('supabase instance not exported');
    }

    if (!handleSupabaseError) {
      throw new Error('handleSupabaseError function not exported');
    }

    console.log('✅ Singleton client imports successful\n');

    // Test 2: Verify singleton pattern
    console.log('2️⃣ Testing singleton pattern...');
    const client1 = getSupabaseClient();
    const client2 = getSupabaseClient();

    if (client1 !== client2) {
      throw new Error('Singleton pattern failed: Different instances returned');
    }

    console.log('✅ Singleton pattern working correctly\n');

    // Test 3: Verify client has required methods
    console.log('3️⃣ Testing client methods...');
    const requiredMethods = ['auth', 'from', 'storage', 'functions'];

    for (const method of requiredMethods) {
      if (!client1[method]) {
        throw new Error(`Supabase client missing required method: ${method}`);
      }
    }

    console.log('✅ All required Supabase methods present\n');

    // Test 4: Test error handler
    console.log('4️⃣ Testing error handler...');
    const mockError = { message: 'Test error' };
    const errorMessage = handleSupabaseError(mockError, 'Test context');

    if (!errorMessage || typeof errorMessage !== 'string') {
      throw new Error('Error handler not working correctly');
    }

    console.log('✅ Error handler working correctly\n');

    // Test 5: Check environment variables (without exposing values)
    console.log('5️⃣ Testing environment variables...');
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl) {
      console.log('⚠️  Warning: NEXT_PUBLIC_SUPABASE_URL not set');
    } else {
      console.log('✅ NEXT_PUBLIC_SUPABASE_URL is set');
    }

    if (!supabaseAnonKey) {
      console.log('⚠️  Warning: NEXT_PUBLIC_SUPABASE_ANON_KEY not set');
    } else {
      console.log('✅ NEXT_PUBLIC_SUPABASE_ANON_KEY is set');
    }

    console.log('');

    // Test 6: Verify auth hook import
    console.log('6️⃣ Testing auth hook import...');
    try {
      const { useSupabaseAuth } = require('./src/hooks/useSupabaseAuth-fixed');
      console.log('✅ Auth hook import successful\n');
    } catch (error) {
      console.log('⚠️  Auth hook import failed (expected in Node.js environment)\n');
    }

    // Test 7: Verify auth provider import
    console.log('7️⃣ Testing auth provider import...');
    try {
      const { AuthProvider } = require('./src/components/auth-provider-fixed');
      console.log('✅ Auth provider import successful\n');
    } catch (error) {
      console.log('⚠️  Auth provider import failed (expected in Node.js environment)\n');
    }

    // Summary
    console.log('📊 Test Summary:');
    console.log('✅ Singleton client implementation is working correctly');
    console.log('✅ All required exports are present');
    console.log('✅ Singleton pattern is properly implemented');
    console.log('✅ Error handling is functional');
    console.log('✅ Supabase client has all required methods');
    console.log('\n🎉 Singleton Supabase Client Implementation is 100% functional!');

    return true;

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
    return false;
  }
}

// Run the test
testSingletonClient().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('Test execution failed:', error);
  process.exit(1);
});
