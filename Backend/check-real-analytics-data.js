/**
 * Script para verificar datos reales de analytics
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkRealData() {
  console.log('📊 Verificando datos reales de Analytics...\n');

  try {
    // Obtener el usuario de prueba
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', 'norbi4050@gmail.com')
      .single();

    if (userError) {
      console.error('❌ Error obteniendo usuario:', userError.message);
      return;
    }

    console.log(`👤 Usuario: ${user.email} (${user.id})\n`);

    // Obtener propiedades
    const { data: properties, error: propsError } = await supabase
      .from('properties')
      .select('id, title')
      .eq('user_id', user.id);

    if (propsError) {
      console.error('❌ Error obteniendo propiedades:', propsError.message);
      return;
    }

    console.log(`🏠 Propiedades: ${properties.length}`);
    properties.forEach((p, i) => {
      console.log(`   ${i + 1}. ${p.title} (${p.id})`);
    });
    console.log('');

    const propertyIds = properties.map(p => p.id);

    // Obtener eventos de los últimos 30 días
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    const { data: events, error: eventsError } = await supabase
      .from('analytics_events')
      .select('event_name, event_time, target_id')
      .in('target_id', propertyIds)
      .gte('event_time', startDate.toISOString())
      .order('event_time', { ascending: false });

    if (eventsError) {
      console.error('❌ Error obteniendo eventos:', eventsError.message);
      return;
    }

    console.log(`📈 Eventos (últimos 30 días): ${events.length}`);

    // Contar por tipo de evento
    const eventCounts = {};
    const eventsByProperty = {};

    events.forEach(event => {
      // Contar por tipo
      eventCounts[event.event_name] = (eventCounts[event.event_name] || 0) + 1;

      // Contar por propiedad
      if (!eventsByProperty[event.target_id]) {
        eventsByProperty[event.target_id] = {
          views: 0,
          contacts: 0,
          favorites: 0
        };
      }

      if (event.event_name === 'view_property') {
        eventsByProperty[event.target_id].views++;
      } else if (event.event_name === 'contact_click' || event.event_name === 'contact_submit') {
        eventsByProperty[event.target_id].contacts++;
      } else if (event.event_name === 'property_favorite') {
        eventsByProperty[event.target_id].favorites++;
      }
    });

    console.log('\n📊 Resumen por tipo de evento:');
    Object.entries(eventCounts).forEach(([eventName, count]) => {
      console.log(`   ${eventName}: ${count}`);
    });

    console.log('\n🏆 Eventos por propiedad:');
    Object.entries(eventsByProperty).forEach(([propId, stats]) => {
      const property = properties.find(p => p.id === propId);
      const conversionRate = stats.views > 0 ? ((stats.contacts / stats.views) * 100).toFixed(2) : '0.00';
      console.log(`\n   ${property?.title || propId}`);
      console.log(`   - Visitas: ${stats.views}`);
      console.log(`   - Contactos: ${stats.contacts}`);
      console.log(`   - Favoritos: ${stats.favorites}`);
      console.log(`   - Conversión: ${conversionRate}%`);
    });

    // Verificar eventos por día
    const eventsByDay = {};
    events.forEach(event => {
      const day = event.event_time.split('T')[0];
      if (!eventsByDay[day]) {
        eventsByDay[day] = { views: 0, contacts: 0 };
      }

      if (event.event_name === 'view_property') {
        eventsByDay[day].views++;
      } else if (event.event_name === 'contact_click' || event.event_name === 'contact_submit') {
        eventsByDay[day].contacts++;
      }
    });

    console.log(`\n📅 Eventos por día (últimos 10 días):`);
    Object.entries(eventsByDay)
      .sort((a, b) => b[0].localeCompare(a[0]))
      .slice(0, 10)
      .forEach(([day, stats]) => {
        console.log(`   ${day}: ${stats.views} visitas, ${stats.contacts} contactos`);
      });

    console.log('\n✅ Verificación completa!');
    console.log('\nℹ️  Si estos datos NO aparecen en el dashboard, hay un problema en la API o el frontend.');

  } catch (error) {
    console.error('\n❌ Error inesperado:', error);
  }
}

checkRealData();
