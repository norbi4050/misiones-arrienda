// Test script para verificar que la funcionalidad de destacar propiedades funcione
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

async function testFeaturedToggle() {
  console.log('🔍 Probando funcionalidad de destacar propiedades...\n');

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
  console.log(`   ID: ${user.id}`);
  console.log(`   Email: ${user.email}`);
  console.log(`   Plan: ${user.plan_tier}\n`);

  // 2. Verificar límites del plan
  const { data: limits } = await supabase
    .rpc('get_user_plan_limits', { user_uuid: user.id });

  if (!limits || limits.length === 0) {
    console.error('❌ Error: No se pudieron obtener límites del plan');
    return;
  }

  console.log('📋 Límites del plan:');
  console.log(`   Puede destacar: ${limits[0].allow_featured ? 'SÍ ✅' : 'NO ❌'}\n`);

  // 3. Buscar una propiedad publicada del usuario
  const { data: properties, error: propsError } = await supabase
    .from('properties')
    .select('id, title, status, featured')
    .eq('user_id', user.id)
    .in('status', ['PUBLISHED', 'AVAILABLE'])
    .limit(1);

  if (propsError || !properties || properties.length === 0) {
    console.error('❌ Error: No se encontraron propiedades publicadas para este usuario');
    return;
  }

  const property = properties[0];
  console.log('🏠 Propiedad de prueba:');
  console.log(`   ID: ${property.id}`);
  console.log(`   Título: ${property.title}`);
  console.log(`   Estado: ${property.status}`);
  console.log(`   Destacada: ${property.featured ? 'SÍ ⭐' : 'NO'}\n`);

  // 4. Probar destacar la propiedad (si no está destacada)
  if (!property.featured) {
    console.log('🌟 Intentando destacar la propiedad...');

    const { error: updateError } = await supabase
      .from('properties')
      .update({ featured: true })
      .eq('id', property.id);

    if (updateError) {
      console.error(`❌ Error al destacar: ${updateError.message}`);
      return;
    }

    console.log('✅ Propiedad destacada exitosamente!\n');

    // Verificar el cambio
    const { data: updated } = await supabase
      .from('properties')
      .select('id, featured')
      .eq('id', property.id)
      .single();

    console.log('🔄 Verificación:');
    console.log(`   Destacada: ${updated?.featured ? 'SÍ ⭐' : 'NO'}\n`);
  }

  // 5. Probar quitar el destacado
  console.log('🔻 Intentando quitar el destacado...');

  const { error: removeError } = await supabase
    .from('properties')
    .update({ featured: false })
    .eq('id', property.id);

  if (removeError) {
    console.error(`❌ Error al quitar destacado: ${removeError.message}`);
    return;
  }

  console.log('✅ Destacado removido exitosamente!\n');

  // Verificación final
  const { data: final } = await supabase
    .from('properties')
    .select('id, featured')
    .eq('id', property.id)
    .single();

  console.log('🔄 Verificación final:');
  console.log(`   Destacada: ${final?.featured ? 'SÍ ⭐' : 'NO'}\n`);

  // 6. Contar propiedades destacadas del usuario
  const { count: featuredCount } = await supabase
    .from('properties')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('featured', true);

  console.log('📊 Resumen:');
  console.log(`   Propiedades destacadas actualmente: ${featuredCount || 0}\n`);

  console.log('✅ Prueba completada exitosamente!');
}

testFeaturedToggle()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('❌ Error en la prueba:', err);
    process.exit(1);
  });
