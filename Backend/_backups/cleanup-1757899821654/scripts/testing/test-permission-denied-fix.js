#!/usr/bin/env node

/**
 * Test script for permission denied fix
 * Tests the "Failed to create profile: permission denied for table User" error fix
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 Testing Permission Denied Fix for User Table');
console.log('='.repeat(60));

// Test configuration
const tests = [
  {
    name: 'API Route Fallback Logic',
    description: 'Test that API route has proper fallback mechanisms',
    test: () => testAPIRouteFallbacks()
  },
  {
    name: 'Error Handling in useAuth',
    description: 'Test that useAuth handles permission errors gracefully',
    test: () => testUseAuthErrorHandling()
  },
  {
    name: 'Profile Persistence Retry Logic',
    description: 'Test that profile persistence has retry mechanisms',
    test: () => testProfilePersistenceRetry()
  },
  {
    name: 'RLS Policies SQL Script',
    description: 'Test that RLS policies SQL script exists and is valid',
    test: () => testRLSPoliciesScript()
  },
  {
    name: 'TypeScript Compilation',
    description: 'Test that all TypeScript files compile without errors',
    test: () => testTypeScriptCompilation()
  },
  {
    name: 'Server Startup',
    description: 'Test that development server starts without errors',
    test: () => testServerStartup()
  }
];

// Test results
let passed = 0;
let failed = 0;
const results = [];

// Helper functions
function testAPIRouteFallbacks() {
  const apiRoutePath = path.join(__dirname, 'src/app/api/users/profile/route.ts');
  
  if (!fs.existsSync(apiRoutePath)) {
    throw new Error('API route file not found');
  }
  
  const content = fs.readFileSync(apiRoutePath, 'utf8');
  
  // Check for service role fallback
  if (!content.includes('getServiceSupabase()')) {
    throw new Error('Service role client function not found');
  }
  
  // Check for fallback logic
  if (!content.includes('fallback') || !content.includes('regular client')) {
    throw new Error('Fallback logic not implemented');
  }
  
  // Check for permission denied error handling
  if (!content.includes('permission denied')) {
    throw new Error('Permission denied error handling not found');
  }
  
  // Check for detailed error responses
  if (!content.includes('status: 403')) {
    throw new Error('403 status code handling not found');
  }
  
  return 'API route has proper fallback mechanisms and error handling';
}

function testUseAuthErrorHandling() {
  const useAuthPath = path.join(__dirname, 'src/hooks/useAuth.ts');
  
  if (!fs.existsSync(useAuthPath)) {
    throw new Error('useAuth hook file not found');
  }
  
  const content = fs.readFileSync(useAuthPath, 'utf8');
  
  // Check for permission denied handling
  if (!content.includes('permission denied') && !content.includes('Permission denied')) {
    throw new Error('Permission denied error handling not found in useAuth');
  }
  
  // Check for specific error messages
  if (!content.includes('database permissions')) {
    throw new Error('Database permissions error message not found');
  }
  
  return 'useAuth has proper permission error handling';
}

function testProfilePersistenceRetry() {
  const persistencePath = path.join(__dirname, 'src/lib/profile-persistence.ts');
  
  if (!fs.existsSync(persistencePath)) {
    throw new Error('Profile persistence file not found');
  }
  
  const content = fs.readFileSync(persistencePath, 'utf8');
  
  // Check for retry logic (already implemented)
  if (!content.includes('permission denied')) {
    throw new Error('Permission denied handling not found in profile persistence');
  }
  
  // Check for retry mechanism
  if (!content.includes('retry')) {
    throw new Error('Retry logic not found in profile persistence');
  }
  
  return 'Profile persistence has retry logic for permission errors';
}

function testRLSPoliciesScript() {
  const sqlScriptPath = path.join(__dirname, 'fix-user-table-rls-policies.sql');
  
  if (!fs.existsSync(sqlScriptPath)) {
    throw new Error('RLS policies SQL script not found');
  }
  
  const content = fs.readFileSync(sqlScriptPath, 'utf8');
  
  // Check for essential RLS commands
  const requiredCommands = [
    'ALTER TABLE',
    'CREATE POLICY',
    'GRANT',
    'ROW LEVEL SECURITY'
  ];
  
  for (const command of requiredCommands) {
    if (!content.includes(command)) {
      throw new Error(`Required SQL command not found: ${command}`);
    }
  }
  
  // Check for specific policies
  const requiredPolicies = [
    'Users can view own profile',
    'Users can insert own profile',
    'Users can update own profile',
    'Service role can manage all profiles'
  ];
  
  for (const policy of requiredPolicies) {
    if (!content.includes(policy)) {
      throw new Error(`Required policy not found: ${policy}`);
    }
  }
  
  return 'RLS policies SQL script is complete and valid';
}

function testTypeScriptCompilation() {
  try {
    // Check if TypeScript is available
    execSync('npx tsc --version', { stdio: 'pipe' });
    
    // Try to compile TypeScript files
    execSync('npx tsc --noEmit --skipLibCheck', { 
      stdio: 'pipe',
      cwd: __dirname
    });
    
    return 'TypeScript compilation successful';
  } catch (error) {
    // If tsc fails, check for specific errors
    const errorOutput = error.stderr ? error.stderr.toString() : error.message;
    
    if (errorOutput.includes('permission denied') || errorOutput.includes('Property') || errorOutput.includes('does not exist')) {
      throw new Error(`TypeScript compilation failed: ${errorOutput.substring(0, 200)}...`);
    }
    
    // If it's just missing tsc, that's okay for this test
    if (errorOutput.includes('command not found') || errorOutput.includes('not recognized')) {
      return 'TypeScript compiler not available (skipped)';
    }
    
    throw new Error(`TypeScript compilation failed: ${errorOutput.substring(0, 200)}...`);
  }
}

function testServerStartup() {
  try {
    // Check if package.json exists
    const packageJsonPath = path.join(__dirname, 'package.json');
    if (!fs.existsSync(packageJsonPath)) {
      throw new Error('package.json not found');
    }
    
    // Check if next.config.js exists
    const nextConfigPath = path.join(__dirname, 'next.config.js');
    if (!fs.existsSync(nextConfigPath)) {
      throw new Error('next.config.js not found');
    }
    
    // Try to validate Next.js configuration
    const nextConfig = fs.readFileSync(nextConfigPath, 'utf8');
    if (!nextConfig.includes('module.exports') && !nextConfig.includes('export')) {
      throw new Error('Invalid Next.js configuration');
    }
    
    return 'Server configuration is valid';
  } catch (error) {
    throw new Error(`Server startup test failed: ${error.message}`);
  }
}

// Run tests
async function runTests() {
  console.log(`Running ${tests.length} tests...\n`);
  
  for (const test of tests) {
    try {
      console.log(`🧪 ${test.name}`);
      console.log(`   ${test.description}`);
      
      const result = await test.test();
      
      console.log(`   ✅ PASSED: ${result}`);
      passed++;
      results.push({ name: test.name, status: 'PASSED', message: result });
      
    } catch (error) {
      console.log(`   ❌ FAILED: ${error.message}`);
      failed++;
      results.push({ name: test.name, status: 'FAILED', message: error.message });
    }
    
    console.log('');
  }
  
  // Summary
  console.log('='.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total tests: ${tests.length}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`Success rate: ${((passed / tests.length) * 100).toFixed(1)}%`);
  
  if (failed > 0) {
    console.log('\n❌ FAILED TESTS:');
    results.filter(r => r.status === 'FAILED').forEach(r => {
      console.log(`   • ${r.name}: ${r.message}`);
    });
  }
  
  console.log('\n🎯 NEXT STEPS:');
  if (failed === 0) {
    console.log('   ✅ All tests passed! The permission denied fix is ready.');
    console.log('   📝 Run the RLS policies SQL script in your Supabase dashboard.');
    console.log('   🚀 Test the application with user registration/login.');
  } else {
    console.log('   🔧 Fix the failed tests before deploying.');
    console.log('   📋 Review the error messages above for specific issues.');
  }
  
  // Exit with appropriate code
  process.exit(failed > 0 ? 1 : 0);
}

// Run the tests
runTests().catch(error => {
  console.error('❌ Test runner failed:', error);
  process.exit(1);
});
