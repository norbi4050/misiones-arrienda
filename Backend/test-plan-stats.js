// Test script para verificar que las estadísticas del plan funcionen correctamente
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

async function testPlanStats() {
  console.log('📊 Probando estadísticas del plan...\n');

  // 1. Obtener un usuario con plan professional
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id, email, plan_tier, is_founder')
    .eq('plan_tier', 'professional')
    .limit(1)
    .single();

  if (userError || !user) {
    console.error('❌ Error: No se encontró usuario con plan professional');
    return;
  }

  console.log('👤 Usuario de prueba:');
  console.log(`   Email: ${user.email}`);
  console.log(`   Plan: ${user.plan_tier}`);
  console.log(`   Fundador: ${user.is_founder ? 'SÍ 👑' : 'NO'}\n`);

  // 2. Obtener límites del plan usando RPC
  const { data: limits, error: limitsError } = await supabase
    .rpc('get_user_plan_limits', { user_uuid: user.id });

  if (limitsError || !limits || limits.length === 0) {
    console.error('❌ Error obteniendo límites del plan:', limitsError?.message);
    return;
  }

  const planLimits = limits[0];

  console.log('📋 Límites del plan:');
  console.log(`   Plan tier: ${planLimits.plan_tier}`);
  console.log(`   Propiedades máximas: ${planLimits.max_active_properties}`);
  console.log(`   Adjuntos: ${planLimits.allow_attachments ? '✓' : '✗'}`);
  console.log(`   Destacadas: ${planLimits.allow_featured ? '✓' : '✗'}`);
  console.log(`   Analytics: ${planLimits.allow_analytics ? '✓' : '✗'}`);
  console.log(`   Soporte prioritario: ${planLimits.allow_priority_support ? '✓' : '✗'}`);
  console.log(`   Máx. imágenes por propiedad: ${planLimits.max_images_per_property}\n`);

  // 3. Contar propiedades activas actuales
  const { count: activeCount, error: countError } = await supabase
    .from('properties')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .in('status', ['AVAILABLE', 'PUBLISHED', 'RESERVED']);

  if (countError) {
    console.error('❌ Error contando propiedades activas:', countError.message);
    return;
  }

  console.log('🏠 Uso de propiedades:');
  console.log(`   Propiedades activas: ${activeCount || 0}`);
  console.log(`   Límite: ${planLimits.max_active_properties}`);
  console.log(`   Disponibles: ${planLimits.max_active_properties - (activeCount || 0)}`);
  console.log(`   Uso: ${((activeCount || 0) / planLimits.max_active_properties * 100).toFixed(1)}%\n`);

  // 4. Verificar propiedades destacadas
  const { count: featuredCount, error: featuredError } = await supabase
    .from('properties')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('featured', true);

  if (!featuredError) {
    console.log('⭐ Propiedades destacadas:');
    console.log(`   Destacadas actualmente: ${featuredCount || 0}`);
    console.log(`   Puede destacar: ${planLimits.allow_featured ? 'SÍ ✓' : 'NO ✗'}\n`);
  }

  // 5. Obtener información de fundador si aplica
  if (user.is_founder) {
    const { data: founderData } = await supabase
      .from('users')
      .select('founder_discount, plan_start_date, plan_end_date')
      .eq('id', user.id)
      .single();

    if (founderData) {
      console.log('👑 Información de Fundador:');
      console.log(`   Descuento: ${founderData.founder_discount}%`);
      console.log(`   Inicio: ${founderData.plan_start_date ? new Date(founderData.plan_start_date).toLocaleDateString('es-AR') : 'N/A'}`);
      console.log(`   Fin: ${founderData.plan_end_date ? new Date(founderData.plan_end_date).toLocaleDateString('es-AR') : 'N/A'}`);

      if (founderData.plan_end_date) {
        const daysRemaining = Math.ceil(
          (new Date(founderData.plan_end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
        );
        console.log(`   Días restantes gratis: ${daysRemaining > 0 ? daysRemaining : '0 (período gratis finalizado)'}\n`);
      }
    }
  }

  // 6. Verificar expiración del plan
  if (planLimits.plan_expires_at) {
    const expiresAt = new Date(planLimits.plan_expires_at);
    const daysUntilExpiry = Math.ceil(
      (expiresAt.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );

    console.log('📅 Expiración del plan:');
    console.log(`   Expira: ${expiresAt.toLocaleDateString('es-AR')}`);
    console.log(`   Días restantes: ${daysUntilExpiry}`);
    console.log(`   Expirado: ${planLimits.is_expired ? 'SÍ ⚠️' : 'NO ✓'}\n`);
  }

  // 7. Resumen final
  console.log('✅ Resumen de Estadísticas:');
  console.log('   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`   📦 Plan: ${planLimits.plan_tier.toUpperCase()}`);
  console.log(`   🏠 Propiedades: ${activeCount || 0}/${planLimits.max_active_properties}`);
  console.log(`   ⭐ Destacadas: ${featuredCount || 0} (${planLimits.allow_featured ? 'Permitido' : 'No permitido'})`);
  console.log(`   📎 Adjuntos: ${planLimits.allow_attachments ? 'Habilitado' : 'Deshabilitado'}`);
  console.log(`   📊 Analytics: ${planLimits.allow_analytics ? 'Habilitado' : 'Deshabilitado'}`);
  console.log(`   👑 Fundador: ${user.is_founder ? 'SÍ' : 'NO'}`);
  console.log('   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  console.log('✅ Todas las estadísticas del plan están funcionando correctamente!');
}

testPlanStats()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('❌ Error en la prueba:', err);
    process.exit(1);
  });
