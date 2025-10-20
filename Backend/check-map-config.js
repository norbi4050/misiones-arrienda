const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Leer variables de entorno manualmente
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
  console.log('🔍 Verificando configuración del mapa...\n');

  // Obtener usuarios inmobiliaria
  const { data: users, error } = await supabase
    .from('users')
    .select('id, company_name, latitude, longitude, show_map_public, address')
    .eq('user_type', 'inmobiliaria')
    .order('created_at', { ascending: false })
    .limit(5);

  if (error) {
    console.error('❌ Error:', error);
    return;
  }

  if (!users || users.length === 0) {
    console.log('⚠️  No se encontraron usuarios inmobiliaria');
    return;
  }

  console.log(`✅ Encontrados ${users.length} usuarios inmobiliaria:\n`);

  users.forEach((u, idx) => {
    console.log(`\n${idx + 1}. ${u.company_name || 'Sin nombre'}`);
    console.log(`   ID: ${u.id}`);
    console.log(`   📍 Dirección: ${u.address || '❌ NO configurada'}`);
    console.log(`   🌐 Latitude: ${u.latitude || '❌ NO configurada'}`);
    console.log(`   🌐 Longitude: ${u.longitude || '❌ NO configurada'}`);
    console.log(`   🗺️  show_map_public: ${u.show_map_public ? '✅ SÍ' : '❌ NO'}`);

    // Diagnóstico
    const hasCoords = u.latitude && u.longitude;
    const showMap = u.show_map_public;

    if (hasCoords && showMap) {
      console.log(`   ✅ MAPA DEBERÍA APARECER en /inmobiliaria/${u.id}`);
    } else if (!hasCoords) {
      console.log(`   ⚠️  FALTA: Configurar coordenadas en Mi Empresa`);
    } else if (!showMap) {
      console.log(`   ⚠️  FALTA: Activar "Mostrar mapa en perfil público"`);
    }

    console.log('   ---');
  });
})();
