// Test de import para verificar que funciona
import { getBrowserSupabase } from './src/lib/supabaseClient';

console.log('Testing getBrowserSupabase import...');
try {
  const client = getBrowserSupabase();
  console.log('✅ getBrowserSupabase funciona correctamente');
  console.log('Tipo:', typeof client);
} catch (error) {
  console.log('❌ Error:', error.message);
}