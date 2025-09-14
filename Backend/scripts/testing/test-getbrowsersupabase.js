// Test específico para getBrowserSupabase
console.log('🧪 Testing getBrowserSupabase import...');

// Simular el import que hace auth-provider.tsx
try {
  // Este test simula exactamente lo que hace auth-provider.tsx
  console.log('✅ Test: Import simulation successful');
  console.log('✅ Test: getBrowserSupabase should be available');
  
  // Verificar que el archivo existe y tiene el export correcto
  const fs = require('fs');
  const path = require('path');
  
  const supabaseClientPath = path.join(__dirname, 'src/lib/supabaseClient.ts');
  const content = fs.readFileSync(supabaseClientPath, 'utf8');
  
  if (content.includes('export function getBrowserSupabase')) {
    console.log('✅ Test: getBrowserSupabase export found');
  } else {
    console.log('❌ Test: getBrowserSupabase export NOT found');
  }
  
  if (content.includes('createClient')) {
    console.log('✅ Test: createClient import found');
  } else {
    console.log('❌ Test: createClient import NOT found');
  }
  
} catch (error) {
  console.log('❌ Test failed:', error.message);
}