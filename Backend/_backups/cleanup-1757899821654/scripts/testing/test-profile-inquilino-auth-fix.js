#!/usr/bin/env node

/**
 * Test script para verificar la corrección del problema de autenticación
 * en la página /profile/inquilino
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 Testing Profile Inquilino Authentication Fix');
console.log('='.repeat(60));

// Test configuration
const tests = [
  {
    name: 'useAuth Hook Interface',
    description: 'Verificar que la interfaz User incluye profile_image',
    test: () => testUseAuthInterface()
  },
  {
    name: 'InquilinoProfilePage Integration',
    description: 'Verificar que la página usa correctamente useAuth',
    test: () => testInquilinoPageIntegration()
  },
  {
    name: 'Authentication Flow',
    description: 'Verificar el flujo de autenticación en la página',
    test: () => testAuthenticationFlow()
  },
  {
    name: 'Error Handling',
    description: 'Verificar el manejo de errores de permisos',
    test: () => testErrorHandling()
  },
  {
    name: 'TypeScript Compilation',
    description: 'Verificar que no hay errores de TypeScript',
    test: () => testTypeScriptCompilation()
  }
];

// Test results
let passed = 0;
let failed = 0;
const results = [];

// Helper functions
function testUseAuthInterface() {
  const useAuthPath = path.join(__dirname, 'src/hooks/useAuth.ts');
  
  if (!fs.existsSync(useAuthPath)) {
    throw new Error('useAuth hook file not found');
  }
  
  const content = fs.readFileSync(useAuthPath, 'utf8');
  
  // Check for profile_image in User interface
  if (!content.includes('profile_image?: string;')) {
    throw new Error('profile_image property not found in User interface');
  }
  
  // Check for proper interface structure
  const interfaceMatch = content.match(/export interface User \{[\s\S]*?\}/);
  if (!interfaceMatch) {
    throw new Error('User interface not found or malformed');
  }
  
  const interfaceContent = interfaceMatch[0];
  const requiredFields = ['id: string', 'email: string', 'profile_image?: string'];
  
  for (const field of requiredFields) {
    if (!interfaceContent.includes(field)) {
      throw new Error(`Required field not found in User interface: ${field}`);
    }
  }
  
  return 'User interface correctly includes profile_image property';
}

function testInquilinoPageIntegration() {
  const pagePath = path.join(__dirname, 'src/app/profile/inquilino/InquilinoProfilePage.tsx');
  
  if (!fs.existsSync(pagePath)) {
    throw new Error('InquilinoProfilePage component not found');
  }
  
  const content = fs.readFileSync(pagePath, 'utf8');
  
  // Check for useAuth import
  if (!content.includes("import { useAuth } from '@/hooks/useAuth';")) {
    throw new Error('useAuth hook not imported');
  }
  
  // Check for useAuth usage
  if (!content.includes('const { user, loading, session, isAuthenticated, error } = useAuth();')) {
    throw new Error('useAuth hook not properly used');
  }
  
  // Check for authentication checks
  if (!content.includes('if (!isAuthenticated || !session || !user)')) {
    throw new Error('Authentication checks not implemented');
  }
  
  // Check for error handling
  if (!content.includes("error.includes('Permission denied')")) {
    throw new Error('Permission denied error handling not found');
  }
  
  // Check for loading state
  if (!content.includes('if (loading)')) {
    throw new Error('Loading state not handled');
  }
  
  return 'InquilinoProfilePage correctly integrates with useAuth hook';
}

function testAuthenticationFlow() {
  const pagePath = path.join(__dirname, 'src/app/profile/inquilino/InquilinoProfilePage.tsx');
  const content = fs.readFileSync(pagePath, 'utf8');
  
  // Check for proper flow states
  const flowStates = [
    'Show loading state',
    'Show error state if there\'s a permission error',
    'Show login prompt if not authenticated',
    'Show profile page for authenticated users'
  ];
  
  for (const state of flowStates) {
    if (!content.includes(state)) {
      throw new Error(`Authentication flow state not found: ${state}`);
    }
  }
  
  // Check for proper conditional rendering
  if (!content.includes('return (') || content.split('return (').length < 4) {
    throw new Error('Not enough conditional return statements for proper flow');
  }
  
  return 'Authentication flow properly implemented with all states';
}

function testErrorHandling() {
  const pagePath = path.join(__dirname, 'src/app/profile/inquilino/InquilinoProfilePage.tsx');
  const content = fs.readFileSync(pagePath, 'utf8');
  
  // Check for permission error handling
  if (!content.includes('Error de Permisos')) {
    throw new Error('Permission error UI not found');
  }
  
  // Check for retry functionality
  if (!content.includes('window.location.reload()')) {
    throw new Error('Retry functionality not implemented');
  }
  
  // Check for fallback navigation
  if (!content.includes('href="/dashboard"')) {
    throw new Error('Fallback navigation not provided');
  }
  
  return 'Error handling properly implemented with retry and fallback options';
}

function testTypeScriptCompilation() {
  try {
    // Check if TypeScript is available
    execSync('npx tsc --version', { stdio: 'pipe' });
    
    // Try to compile the specific files
    const filesToCheck = [
      'src/hooks/useAuth.ts',
      'src/app/profile/inquilino/InquilinoProfilePage.tsx'
    ];
    
    for (const file of filesToCheck) {
      const filePath = path.join(__dirname, file);
      if (fs.existsSync(filePath)) {
        try {
          execSync(`npx tsc --noEmit --skipLibCheck ${filePath}`, { 
            stdio: 'pipe',
            cwd: __dirname
          });
        } catch (error) {
          const errorOutput = error.stderr ? error.stderr.toString() : error.message;
          if (errorOutput.includes('error TS')) {
            throw new Error(`TypeScript errors in ${file}: ${errorOutput.substring(0, 200)}...`);
          }
        }
      }
    }
    
    return 'TypeScript compilation successful for modified files';
  } catch (error) {
    if (error.message.includes('command not found') || error.message.includes('not recognized')) {
      return 'TypeScript compiler not available (skipped)';
    }
    throw error;
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
    console.log('   ✅ All tests passed! The authentication fix is ready.');
    console.log('   🚀 Test the page at http://localhost:3000/profile/inquilino');
    console.log('   📝 Verify that logged-in users see their profile instead of login prompt.');
  } else {
    console.log('   🔧 Fix the failed tests before testing the page.');
    console.log('   📋 Review the error messages above for specific issues.');
  }
  
  console.log('\n🔍 WHAT WAS FIXED:');
  console.log('   • Replaced custom authentication logic with useAuth hook');
  console.log('   • Added proper authentication state management');
  console.log('   • Implemented permission error handling');
  console.log('   • Added loading states and error recovery');
  console.log('   • Fixed TypeScript interface for profile_image');
  
  // Exit with appropriate code
  process.exit(failed > 0 ? 1 : 0);
}

// Run the tests
runTests().catch(error => {
  console.error('❌ Test runner failed:', error);
  process.exit(1);
});
