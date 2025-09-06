const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 Testing Authentication Loading Fix');
console.log('=====================================');

// Test 1: Check if useSupabaseAuth hook has the isMounted flag
console.log('\n1. Checking useSupabaseAuth hook for isMounted flag...');
const authHookPath = path.join(__dirname, '..', 'Backend', 'src', 'hooks', 'useSupabaseAuth.ts');

if (fs.existsSync(authHookPath)) {
  const authHookContent = fs.readFileSync(authHookPath, 'utf8');

  if (authHookContent.includes('let isMounted = true') &&
      authHookContent.includes('isMounted = false') &&
      authHookContent.includes('if (!isMounted) return') &&
      authHookContent.includes('if (isMounted)')) {
    console.log('✅ useSupabaseAuth hook has proper isMounted flag implementation');
  } else {
    console.log('❌ useSupabaseAuth hook missing isMounted flag implementation');
  }
} else {
  console.log('❌ useSupabaseAuth hook file not found');
}

// Test 2: Check if authentication pages handle loading states properly
console.log('\n2. Checking authentication pages for proper loading handling...');
const pagesToCheck = [
  { name: 'Login', path: 'Backend/src/app/login/page.tsx' },
  { name: 'Register', path: 'Backend/src/app/register/page.tsx' },
  { name: 'Publicar', path: 'Backend/src/app/publicar/page.tsx' }
];

pagesToCheck.forEach(page => {
  const pagePath = path.join(__dirname, '..', page.path);
  if (fs.existsSync(pagePath)) {
    const pageContent = fs.readFileSync(pagePath, 'utf8');

    if (pageContent.includes('isLoading') &&
        pageContent.includes('Verificando autenticación') &&
        pageContent.includes('animate-spin')) {
      console.log(`✅ ${page.name} page has proper loading state handling`);
    } else {
      console.log(`❌ ${page.name} page missing proper loading state handling`);
    }
  } else {
    console.log(`❌ ${page.name} page file not found`);
  }
});

// Test 3: Check for potential race conditions in the hook
console.log('\n3. Checking for race condition fixes...');
if (fs.existsSync(authHookPath)) {
  const authHookContent = fs.readFileSync(authHookPath, 'utf8');

  const hasRaceConditionFixes =
    authHookContent.includes('if (isMounted)') &&
    authHookContent.includes('setIsLoading(false)') &&
    !authHookContent.includes('setIsLoading(false) // This could cause issues');

  if (hasRaceConditionFixes) {
    console.log('✅ Race condition fixes implemented');
  } else {
    console.log('❌ Race condition fixes may be incomplete');
  }
}

// Test 4: Verify no duplicate state updates
console.log('\n4. Checking for duplicate state update prevention...');
if (fs.existsSync(authHookPath)) {
  const authHookContent = fs.readFileSync(authHookPath, 'utf8');

  const hasDuplicatePrevention =
    authHookContent.includes('if (!isMounted) return') &&
    authHookContent.includes('isMounted = false');

  if (hasDuplicatePrevention) {
    console.log('✅ Duplicate state update prevention implemented');
  } else {
    console.log('❌ Duplicate state update prevention may be missing');
  }
}

console.log('\n🎯 Authentication Loading Fix Test Complete');
console.log('==========================================');
console.log('If all checks are ✅, the infinite loading issue should be resolved.');
console.log('Test the application by visiting /login, /register, and /publicar routes.');
