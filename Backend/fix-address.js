const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Leer variables de entorno
const envFile = fs.readFileSync('.env.local', 'utf8');
const envVars = {};
envFile.split('\n').forEach(line => {
  const [key, ...value] = line.split('=');
  if (key && value.length) {
    envVars[key.trim()] = value.join('=').trim();
  }
});

const supabase = createClient(
  envVars.NEXT_PUBLIC_SUPABASE_URL,
  envVars.SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
  console.log('🔧 Limpiando dirección basura...\n');

  const { data, error } = await supabase
    .from('users')
    .update({ address: null })
    .eq('id', 'a4ef1f3d-c3e8-46df-b186-5b5c837cc14b')
    .select();

  if (error) {
    console.error('❌ Error:', error);
  } else {
    console.log('✅ Dirección limpiada correctamente');
    console.log('   address ahora es: NULL');
  }
})();
