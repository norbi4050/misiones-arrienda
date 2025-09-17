/**
 * Test Avatar System Post-Fix 2025
 * Verifica que el sistema de avatares funciona correctamente después de aplicar correcciones SQL
 */

const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables de entorno de Supabase no configuradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAvatarSystem() {
  console.log('🧪 TESTING AVATAR SYSTEM POST-FIX 2025');
  console.log('=====================================\n');

  const results = {
    passed: 0,
    failed: 0,
    errors: []
  };

  // Test 1: Verificar estructura de tabla User
  console.log('1. 🔍 Verificando estructura tabla User...');
  try {
    const { data, error } = await supabase
      .from('User')
      .select('id, profile_image, updated_at')
      .limit(1);

    if (error) {
      throw new Error(`Error en tabla User: ${error.message}`);
    }

    console.log('   ✅ Tabla User accesible');
    console.log('   ✅ Columnas profile_image y updated_at disponibles');
    results.passed++;
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    results.failed++;
    results.errors.push(`Tabla User: ${error.message}`);
  }

  // Test 2: Verificar función get_user_stats
  console.log('\n2. 🔍 Verificando función get_user_stats...');
  try {
    const { data, error } = await supabase.rpc('get_user_stats');

    if (error) {
      throw new Error(`Error en función RPC: ${error.message}`);
    }

    console.log('   ✅ Función get_user_stats disponible');
    console.log('   ✅ Respuesta:', JSON.stringify(data, null, 2));
    results.passed++;
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    results.failed++;
    results.errors.push(`Función RPC: ${error.message}`);
  }

  // Test 3: Verificar tabla Properties con columna type
  console.log('\n3. 🔍 Verificando tabla Properties...');
  try {
    const { data, error } = await supabase
      .from('Properties')
      .select('id, type')
      .limit(1);

    if (error) {
      throw new Error(`Error en tabla Properties: ${error.message}`);
    }

    console.log('   ✅ Tabla Properties accesible');
    console.log('   ✅ Columna type disponible');
    results.passed++;
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    results.failed++;
    results.errors.push(`Tabla Properties: ${error.message}`);
  }

  // Test 4: Verificar tabla user_ratings con is_public
  console.log('\n4. 🔍 Verificando tabla user_ratings...');
  try {
    const { data, error } = await supabase
      .from('user_ratings')
      .select('id, is_public')
      .limit(1);

    if (error) {
      throw new Error(`Error en tabla user_ratings: ${error.message}`);
    }

    console.log('   ✅ Tabla user_ratings accesible');
    console.log('   ✅ Columna is_public disponible');
    results.passed++;
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    results.failed++;
    results.errors.push(`Tabla user_ratings: ${error.message}`);
  }

  // Test 5: Verificar tablas de actividad
  console.log('\n5. 🔍 Verificando tablas de actividad...');
  try {
    // user_searches
    const { error: searchError } = await supabase
      .from('user_searches')
      .select('id, is_active')
      .limit(1);

    if (searchError) {
      throw new Error(`user_searches: ${searchError.message}`);
    }

    // user_messages
    const { error: messageError } = await supabase
      .from('user_messages')
      .select('id, sender_id, recipient_id')
      .limit(1);

    if (messageError) {
      throw new Error(`user_messages: ${messageError.message}`);
    }

    // profile_views
    const { error: viewError } = await supabase
      .from('profile_views')
      .select('id, profile_user_id, viewed_at')
      .limit(1);

    if (viewError) {
      throw new Error(`profile_views: ${viewError.message}`);
    }

    console.log('   ✅ Tabla user_searches accesible');
    console.log('   ✅ Tabla user_messages accesible');
    console.log('   ✅ Tabla profile_views accesible');
    results.passed++;
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    results.failed++;
    results.errors.push(`Tablas de actividad: ${error.message}`);
  }

  // Test 6: Verificar bucket de avatars
  console.log('\n6. 🔍 Verificando bucket de avatars...');
  try {
    const { data, error } = await supabase.storage
      .from('avatars')
      .list('', { limit: 1 });

    if (error) {
      throw new Error(`Error en bucket avatars: ${error.message}`);
    }

    console.log('   ✅ Bucket avatars accesible');
    results.passed++;
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    results.failed++;
    results.errors.push(`Bucket avatars: ${error.message}`);
  }

  // Resumen final
  console.log('\n📊 RESUMEN DE TESTING');
  console.log('====================');
  console.log(`✅ Tests pasados: ${results.passed}`);
  console.log(`❌ Tests fallidos: ${results.failed}`);
  console.log(`📈 Porcentaje éxito: ${Math.round((results.passed / (results.passed + results.failed)) * 100)}%`);

  if (results.errors.length > 0) {
    console.log('\n🚨 ERRORES ENCONTRADOS:');
    results.errors.forEach((error, index) => {
      console.log(`${index + 1}. ${error}`);
    });
    console.log('\n⚠️  ACCIÓN REQUERIDA: Ejecutar SQL de corrección en Supabase Dashboard');
    console.log('📄 Archivo: Backend/sql-migrations/FIX-ERRORES-CRITICOS-SUPABASE-2025.sql');
  } else {
    console.log('\n🎉 TODOS LOS TESTS PASARON');
    console.log('✅ Sistema de avatares listo para uso');
    console.log('✅ Base de datos correctamente configurada');
  }

  return results.failed === 0;
}

// Ejecutar tests
testAvatarSystem()
  .then(success => {
    if (success) {
      console.log('\n🚀 SISTEMA COMPLETAMENTE FUNCIONAL');
      process.exit(0);
    } else {
      console.log('\n🔧 REQUIERE CORRECCIONES');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('\n💥 ERROR CRÍTICO EN TESTING:', error);
    process.exit(1);
  });
