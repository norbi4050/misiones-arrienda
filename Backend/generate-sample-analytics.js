// Script para generar datos de muestra en analytics_events
// Esto sirve para probar el dashboard con datos reales

const fs = require('fs');
const path = require('path');

// Load environment variables
const envPath = path.join(__dirname, '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      process.env[key.trim()] = valueParts.join('=').trim();
    }
  });
}

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Faltan variables de entorno');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function generateSampleAnalytics() {
  console.log('📊 Generando datos de muestra para Analytics...\n');

  // 1. Obtener usuario con plan professional
  const { data: user } = await supabase
    .from('users')
    .select('id, email')
    .eq('plan_tier', 'professional')
    .limit(1)
    .single();

  if (!user) {
    console.error('❌ No se encontró usuario con plan professional');
    return;
  }

  console.log(`👤 Usuario: ${user.email}`);
  console.log(`   ID: ${user.id}\n`);

  // 2. Obtener propiedades del usuario
  const { data: properties } = await supabase
    .from('properties')
    .select('id, title')
    .eq('user_id', user.id)
    .limit(5);

  if (!properties || properties.length === 0) {
    console.error('❌ Usuario no tiene propiedades');
    return;
  }

  console.log(`🏠 Propiedades encontradas: ${properties.length}\n`);

  // 3. Generar eventos de los últimos 30 días
  const events = [];
  const now = new Date();
  const eventTypes = [
    { name: 'view_property', weight: 100 },
    { name: 'contact_click', weight: 15 },
    { name: 'contact_submit', weight: 10 },
    { name: 'property_favorite', weight: 20 },
    { name: 'carousel_next', weight: 40 },
    { name: 'carousel_zoom', weight: 10 },
  ];

  console.log('⏳ Generando eventos...\n');

  for (let dayOffset = 0; dayOffset < 30; dayOffset++) {
    const date = new Date(now);
    date.setDate(date.getDate() - dayOffset);

    // Generar entre 5 y 30 eventos por día (menos eventos en días viejos)
    const eventsPerDay = Math.floor(Math.random() * 25) + 5;

    for (let i = 0; i < eventsPerDay; i++) {
      // Seleccionar evento aleatorio ponderado
      const totalWeight = eventTypes.reduce((sum, et) => sum + et.weight, 0);
      let random = Math.random() * totalWeight;
      let selectedEvent = eventTypes[0];

      for (const eventType of eventTypes) {
        if (random < eventType.weight) {
          selectedEvent = eventType;
          break;
        }
        random -= eventType.weight;
      }

      // Seleccionar propiedad aleatoria
      const property = properties[Math.floor(Math.random() * properties.length)];

      // Crear hora aleatoria del día (más eventos en horas pico)
      const hour = Math.random() < 0.6
        ? Math.floor(Math.random() * 6) + 14 // 14-20 (60% probabilidad)
        : Math.floor(Math.random() * 24); // cualquier hora (40% probabilidad)

      const minute = Math.floor(Math.random() * 60);
      const second = Math.floor(Math.random() * 60);

      date.setHours(hour, minute, second);

      // Crear evento (sin created_at, usa el default de la DB)
      events.push({
        user_id: user.id,
        session_id: `session-${dayOffset}-${i}`,
        event_name: selectedEvent.name,
        target_type: 'property',
        target_id: property.id,
        page: `/properties/${property.id}`,
        referrer: Math.random() > 0.5 ? 'https://google.com' : null,
        actor_role: 'anonymous',
        payload: JSON.stringify({
          propertyId: property.id,
          title: property.title
        }),
        ip: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
        ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      });
    }
  }

  console.log(`✅ Generados ${events.length} eventos\n`);
  console.log('💾 Insertando en base de datos...\n');

  // 4. Insertar eventos en lotes de 100
  const batchSize = 100;
  let inserted = 0;

  for (let i = 0; i < events.length; i += batchSize) {
    const batch = events.slice(i, i + batchSize);

    const { error } = await supabase
      .from('analytics_events')
      .insert(batch);

    if (error) {
      console.error(`❌ Error insertando lote ${Math.floor(i / batchSize) + 1}:`, error.message);
    } else {
      inserted += batch.length;
      const progress = Math.round((inserted / events.length) * 100);
      process.stdout.write(`\r   Progreso: ${inserted}/${events.length} eventos (${progress}%)`);
    }
  }

  console.log('\n\n✅ Datos de muestra generados exitosamente!');
  console.log('\n📈 Resumen:');
  console.log(`   Total eventos: ${inserted}`);
  console.log(`   Usuario: ${user.email}`);
  console.log(`   Propiedades: ${properties.length}`);
  console.log(`   Período: Últimos 30 días\n`);

  console.log('🌐 Ahora podés ver el dashboard en:');
  console.log(`   http://localhost:3000/mi-cuenta/analytics\n`);

  console.log('💡 Para limpiar los datos de prueba, ejecutá:');
  console.log(`   DELETE FROM analytics_events WHERE user_id = '${user.id}';\n`);
}

generateSampleAnalytics()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
  });
