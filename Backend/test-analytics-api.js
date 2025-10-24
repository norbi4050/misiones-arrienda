/**
 * Test script para verificar Analytics API
 * Diagnóstico de errores 500
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testAnalyticsAPI() {
  console.log('🧪 Testing Analytics API Components...\n');

  try {
    // 1. Verificar que analytics_events table existe
    console.log('1️⃣ Checking analytics_events table...');
    const { data: events, error: eventsError } = await supabase
      .from('analytics_events')
      .select('*')
      .limit(5);

    if (eventsError) {
      console.error('❌ Error querying analytics_events:', eventsError.message);
      console.log('   Hint: Verify table exists in Supabase\n');
    } else {
      console.log(`✅ analytics_events table exists (${events?.length || 0} sample rows)`);
      if (events && events.length > 0) {
        console.log('   Columns:', Object.keys(events[0]).join(', '));
      }
      console.log('');
    }

    // 2. Verificar get_user_plan_limits function
    console.log('2️⃣ Checking get_user_plan_limits function...');

    // Obtener un usuario de prueba
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email')
      .limit(1)
      .single();

    if (usersError) {
      console.error('❌ Error getting test user:', usersError.message);
      return;
    }

    console.log(`   Using test user: ${users.email}`);

    const { data: planLimits, error: planError } = await supabase
      .rpc('get_user_plan_limits', { user_uuid: users.id });

    if (planError) {
      console.error('❌ Error calling get_user_plan_limits:', planError.message);
      console.log('   Hint: Function may not exist or has wrong signature\n');

      // Verificar si la función existe
      const { data: functions, error: funcError } = await supabase
        .from('pg_proc')
        .select('proname')
        .eq('proname', 'get_user_plan_limits')
        .limit(1);

      if (funcError || !functions || functions.length === 0) {
        console.log('   ⚠️  Function get_user_plan_limits does not exist in database\n');
      }
    } else {
      console.log('✅ get_user_plan_limits function works');
      console.log('   Result:', JSON.stringify(planLimits, null, 2));
      console.log('');
    }

    // 3. Verificar que hay propiedades del usuario
    console.log('3️⃣ Checking user properties...');
    const { data: properties, error: propsError } = await supabase
      .from('properties')
      .select('id, title')
      .eq('user_id', users.id);

    if (propsError) {
      console.error('❌ Error querying properties:', propsError.message);
    } else {
      console.log(`✅ Found ${properties?.length || 0} properties for user`);
      if (properties && properties.length > 0) {
        console.log(`   First property: ${properties[0].title}`);
      }
      console.log('');
    }

    // 4. Test analitycs query con event_time
    if (properties && properties.length > 0) {
      console.log('4️⃣ Testing analytics query with event_time...');

      const propertyIds = properties.map(p => p.id);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);

      const { data: analyticsData, error: analyticsError } = await supabase
        .from('analytics_events')
        .select('event_name, event_time')
        .in('target_id', propertyIds)
        .gte('event_time', startDate.toISOString());

      if (analyticsError) {
        console.error('❌ Error querying analytics with event_time:', analyticsError.message);
        console.log('   Hint: Column may be named differently\n');

        // Try with created_at instead
        console.log('   Trying with created_at column...');
        const { data: analyticsData2, error: analyticsError2 } = await supabase
          .from('analytics_events')
          .select('event_name, created_at')
          .in('target_id', propertyIds)
          .gte('created_at', startDate.toISOString())
          .limit(5);

        if (analyticsError2) {
          console.error('   ❌ created_at also fails:', analyticsError2.message);
        } else {
          console.log('   ✅ created_at works! Need to update code to use created_at\n');
        }
      } else {
        console.log(`✅ Analytics query works (${analyticsData?.length || 0} events found)`);
        if (analyticsData && analyticsData.length > 0) {
          console.log('   Sample event:', analyticsData[0]);
        }
        console.log('');
      }
    }

    // 5. Insertar datos de prueba si no hay eventos
    console.log('5️⃣ Checking if sample data is needed...');
    if (properties && properties.length > 0) {
      const propertyIds = properties.map(p => p.id);
      const { data: existingEvents, error: checkError } = await supabase
        .from('analytics_events')
        .select('id')
        .in('target_id', propertyIds)
        .limit(1);

      if (!checkError && (!existingEvents || existingEvents.length === 0)) {
        console.log('⚠️  No analytics events found for user properties');
        console.log('   Would you like to insert sample data? (Y/n)');
        console.log('   Run: node insert-sample-analytics.js');
      } else {
        console.log('✅ Analytics events exist for user properties');
      }
    }

    console.log('\n✅ Test completed!');

  } catch (error) {
    console.error('\n❌ Unexpected error:', error);
  }
}

testAnalyticsAPI();
