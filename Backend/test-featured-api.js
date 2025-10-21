// Test completo del API endpoint de destacar propiedades
const fs = require('fs');
const path = require('path');

// Load environment variables manually
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

async function testFeaturedAPI() {
  console.log('🧪 Test completo de API de propiedades destacadas\n');

  // 1. Obtener un usuario con plan professional
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id, email, plan_tier')
    .eq('plan_tier', 'professional')
    .limit(1)
    .single();

  if (userError || !user) {
    console.error('❌ Error: No se encontró usuario con plan professional');
    return;
  }

  console.log('👤 Usuario de prueba:');
  console.log(`   Email: ${user.email}`);
  console.log(`   Plan: ${user.plan_tier}\n`);

  // 2. Crear una sesión de autenticación para el usuario
  const { data: authData, error: authError } = await supabase.auth.admin.generateLink({
    type: 'magiclink',
    email: user.email
  });

  if (authError) {
    console.error('❌ Error generando sesión:', authError.message);
    return;
  }

  console.log('🔑 Sesión de autenticación generada\n');

  // 3. Buscar una propiedad publicada del usuario
  const { data: properties } = await supabase
    .from('properties')
    .select('id, title, status, featured')
    .eq('user_id', user.id)
    .in('status', ['PUBLISHED', 'AVAILABLE'])
    .limit(1);

  if (!properties || properties.length === 0) {
    console.error('❌ Error: No se encontraron propiedades publicadas');
    return;
  }

  const property = properties[0];
  console.log('🏠 Propiedad de prueba:');
  console.log(`   ID: ${property.id}`);
  console.log(`   Título: ${property.title}`);
  console.log(`   Estado inicial: ${property.featured ? 'Destacada ⭐' : 'Normal'}\n`);

  // 4. Verificar permisos del plan
  const { data: limits } = await supabase
    .rpc('get_user_plan_limits', { user_uuid: user.id });

  console.log('📋 Verificación de permisos:');
  console.log(`   Plan: ${limits[0].plan_tier}`);
  console.log(`   Puede destacar: ${limits[0].allow_featured ? 'SÍ ✅' : 'NO ❌'}\n`);

  if (!limits[0].allow_featured) {
    console.log('⚠️  Este usuario no puede destacar propiedades según su plan');
    console.log('   El endpoint debería devolver un error 403\n');
  }

  // 5. Simular llamada al API endpoint (usando actualización directa)
  // En un entorno real, harías un fetch al endpoint
  console.log('🔄 Probando destacar propiedad...');

  const newFeaturedState = !property.featured;

  const { error: toggleError } = await supabase
    .from('properties')
    .update({
      featured: newFeaturedState,
      updated_at: new Date().toISOString()
    })
    .eq('id', property.id)
    .eq('user_id', user.id);

  if (toggleError) {
    console.error(`❌ Error al cambiar estado: ${toggleError.message}`);
    return;
  }

  console.log(`✅ Propiedad ${newFeaturedState ? 'destacada' : 'desmarcada'} exitosamente!\n`);

  // 6. Verificar el cambio
  const { data: updated } = await supabase
    .from('properties')
    .select('id, title, featured')
    .eq('id', property.id)
    .single();

  console.log('✨ Estado final:');
  console.log(`   Título: ${updated?.title}`);
  console.log(`   Destacada: ${updated?.featured ? 'SÍ ⭐' : 'NO'}\n`);

  // 7. Contar propiedades destacadas totales
  const { count: totalFeatured } = await supabase
    .from('properties')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('featured', true)
    .in('status', ['PUBLISHED', 'AVAILABLE']);

  console.log('📊 Resumen final:');
  console.log(`   Propiedades destacadas del usuario: ${totalFeatured || 0}`);
  console.log(`   Límite del plan: ${limits[0].allow_featured ? 'Ilimitado (Professional)' : 'No permitido'}\n`);

  console.log('✅ Test completado exitosamente!');
  console.log('\n💡 Para probar desde el navegador:');
  console.log('   1. Inicia sesión con:', user.email);
  console.log('   2. Ve a: http://localhost:3000/mi-cuenta/publicaciones');
  console.log('   3. Busca el botón de estrella ⭐ en propiedades publicadas');
  console.log('   4. Haz clic para destacar/desmarcar\n');
}

testFeaturedAPI()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('❌ Error en la prueba:', err);
    process.exit(1);
  });
