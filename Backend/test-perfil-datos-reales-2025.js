// =====================================================
// TEST PERFIL CON DATOS REALES - 2025
// =====================================================
// Script para verificar que el perfil funcione con datos reales

const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testProfileData() {
  console.log('🚀 INICIANDO TESTING DE PERFIL CON DATOS REALES');
  console.log('=====================================================');

  try {
    // 1. Verificar tablas y conteos
    console.log('📊 1. VERIFICANDO CONTEOS DE TABLAS...');
    
    const { data: profileViews, error: pvError } = await supabase
      .from('profile_views')
      .select('*', { count: 'exact', head: true });
    
    const { data: userMessages, error: umError } = await supabase
      .from('user_messages')
      .select('*', { count: 'exact', head: true });
    
    const { data: userSearches, error: usError } = await supabase
      .from('user_searches')
      .select('*', { count: 'exact', head: true });
    
    const { data: properties, error: propError } = await supabase
      .from('properties')
      .select('*', { count: 'exact', head: true });
    
    const { data: favorites, error: favError } = await supabase
      .from('favorites')
      .select('*', { count: 'exact', head: true });

    console.log(`   ✅ Profile Views: ${profileViews?.length || 0} registros`);
    console.log(`   ✅ User Messages: ${userMessages?.length || 0} registros`);
    console.log(`   ✅ User Searches: ${userSearches?.length || 0} registros`);
    console.log(`   ✅ Properties: ${properties?.length || 0} registros`);
    console.log(`   ✅ Favorites: ${favorites?.length || 0} registros`);

    // 2. Verificar usuarios disponibles
    console.log('\n👥 2. VERIFICANDO USUARIOS DISPONIBLES...');
    
    const { data: users, error: usersError } = await supabase
      .from('User')
      .select('id, email')
      .limit(5);

    if (usersError) {
      console.error('   ❌ Error obteniendo usuarios:', usersError);
    } else {
      console.log(`   ✅ Usuarios encontrados: ${users.length}`);
      users.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.email} (ID: ${user.id.substring(0, 8)}...)`);
      });
    }

    // 3. Probar función get_user_stats con usuario real
    console.log('\n🔧 3. PROBANDO FUNCIÓN get_user_stats...');
    
    if (users && users.length > 0) {
      const testUserId = users[0].id;
      console.log(`   Probando con usuario: ${users[0].email}`);
      
      const { data: statsData, error: statsError } = await supabase
        .rpc('get_user_stats', { target_user_id: testUserId });

      if (statsError) {
        console.error('   ❌ Error en función get_user_stats:', statsError);
        
        // Probar función alternativa
        const { data: altStatsData, error: altStatsError } = await supabase
          .rpc('get_user_profile_stats', { target_user_id: testUserId });
        
        if (altStatsError) {
          console.error('   ❌ Error en función get_user_profile_stats:', altStatsError);
        } else {
          console.log('   ✅ Función get_user_profile_stats funciona');
          console.log('   📊 Estadísticas:', JSON.stringify(altStatsData, null, 2));
        }
      } else {
        console.log('   ✅ Función get_user_stats funciona');
        console.log('   📊 Estadísticas:', JSON.stringify(statsData, null, 2));
      }
    }

    // 4. Verificar datos específicos por usuario
    console.log('\n📈 4. VERIFICANDO DATOS POR USUARIO...');
    
    if (users && users.length > 0) {
      for (let i = 0; i < Math.min(3, users.length); i++) {
        const user = users[i];
        console.log(`\n   Usuario: ${user.email}`);
        
        // Profile views para este usuario
        const { data: userProfileViews } = await supabase
          .from('profile_views')
          .select('*')
          .eq('viewed_user_id', user.id);
        
        // Mensajes para este usuario
        const { data: userMsgs } = await supabase
          .from('user_messages')
          .select('*')
          .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`);
        
        // Búsquedas para este usuario
        const { data: userSrch } = await supabase
          .from('user_searches')
          .select('*')
          .eq('user_id', user.id);
        
        // Favoritos para este usuario
        const { data: userFavs } = await supabase
          .from('favorites')
          .select('*')
          .eq('userId', user.id);

        console.log(`     - Profile Views: ${userProfileViews?.length || 0}`);
        console.log(`     - Messages: ${userMsgs?.length || 0}`);
        console.log(`     - Searches: ${userSrch?.length || 0}`);
        console.log(`     - Favorites: ${userFavs?.length || 0}`);
      }
    }

    // 5. Simular llamada a API local
    console.log('\n🌐 5. SIMULANDO LLAMADA A API LOCAL...');
    
    try {
      const response = await fetch('http://localhost:3000/api/users/stats');
      
      if (response.ok) {
        const apiData = await response.json();
        console.log('   ✅ API local responde correctamente');
        console.log('   📊 Datos de API:', JSON.stringify(apiData, null, 2));
      } else {
        console.log(`   ⚠️  API local no disponible (${response.status})`);
        console.log('   💡 Asegúrate de que el servidor esté corriendo: npm run dev');
      }
    } catch (fetchError) {
      console.log('   ⚠️  No se pudo conectar a API local');
      console.log('   💡 Asegúrate de que el servidor esté corriendo: npm run dev');
    }

    // 6. Resumen final
    console.log('\n🎯 6. RESUMEN FINAL');
    console.log('=====================================================');
    
    const totalProfileViews = profileViews?.length || 0;
    const totalMessages = userMessages?.length || 0;
    const totalSearches = userSearches?.length || 0;
    const totalProperties = properties?.length || 0;
    const totalFavorites = favorites?.length || 0;
    
    console.log(`✅ Total Profile Views: ${totalProfileViews}`);
    console.log(`✅ Total Messages: ${totalMessages}`);
    console.log(`✅ Total Searches: ${totalSearches}`);
    console.log(`✅ Total Properties: ${totalProperties}`);
    console.log(`✅ Total Favorites: ${totalFavorites}`);
    console.log(`✅ Total Users: ${users?.length || 0}`);
    
    // Verificar si hay suficientes datos
    const hasEnoughData = totalProfileViews >= 5 && 
                         totalMessages >= 5 && 
                         totalSearches >= 5 && 
                         totalProperties >= 3 && 
                         totalFavorites >= 3;
    
    if (hasEnoughData) {
      console.log('\n🎉 PERFECTO: Tienes suficientes datos para testing');
      console.log('✅ El perfil debería mostrar estadísticas reales');
      console.log('🚀 Puedes proceder con la Fase 2 (mejoras visuales)');
    } else {
      console.log('\n⚠️  ADVERTENCIA: Pocos datos para testing óptimo');
      console.log('💡 Considera ejecutar el script de datos de prueba nuevamente');
    }
    
    console.log('\n📋 PRÓXIMOS PASOS:');
    console.log('1. Iniciar servidor: cd Backend && npm run dev');
    console.log('2. Ir a: http://localhost:3000/profile/inquilino');
    console.log('3. Login: cgonzalezarchilla@gmail.com / Gera302472!');
    console.log('4. Verificar que las estadísticas sean reales (no Math.random)');
    
  } catch (error) {
    console.error('❌ ERROR GENERAL:', error);
  }
}

// Ejecutar el test
if (require.main === module) {
  testProfileData();
}

module.exports = { testProfileData };
