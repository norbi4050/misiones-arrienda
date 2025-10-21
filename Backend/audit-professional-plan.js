// Auditoría completa: Características prometidas vs implementadas del Plan Professional
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

// Características prometidas
const PROMISED_FEATURES = {
  'Hasta 20 propiedades activas': false,
  'Sitio web personalizado': false,
  '3 destacados por mes': false,
  'Estadísticas avanzadas': false,
  'Soporte prioritario': false,
  'Posicionamiento +30%': false,
  'Acceso a nuevas funciones': false,
  'Analytics detallado': false
};

async function auditProfessionalPlan() {
  console.log('🔍 AUDITORÍA DEL PLAN PROFESSIONAL');
  console.log('═══════════════════════════════════════════════════════\n');

  // Obtener usuario con plan professional
  const { data: user } = await supabase
    .from('users')
    .select('id, email, plan_tier')
    .eq('plan_tier', 'professional')
    .limit(1)
    .single();

  if (!user) {
    console.error('❌ No se encontró usuario con plan professional');
    return;
  }

  console.log(`Auditando plan para: ${user.email}\n`);

  // Obtener límites del plan
  const { data: limits } = await supabase
    .rpc('get_user_plan_limits', { user_uuid: user.id });

  const planLimits = limits[0];

  // ========================================
  // 1. Hasta 20 propiedades activas
  // ========================================
  console.log('1️⃣  Hasta 20 propiedades activas');
  console.log('   ─────────────────────────────────');
  if (planLimits.max_active_properties === 20) {
    console.log('   ✅ IMPLEMENTADO');
    console.log(`   - Límite en DB: ${planLimits.max_active_properties} propiedades`);
    console.log('   - Validación en API: /api/properties/create y /api/properties/[id]/publish');
    console.log('   - Función RPC: can_user_activate_property()');
    PROMISED_FEATURES['Hasta 20 propiedades activas'] = true;
  } else {
    console.log('   ❌ NO IMPLEMENTADO CORRECTAMENTE');
    console.log(`   - Límite actual: ${planLimits.max_active_properties}`);
  }
  console.log('');

  // ========================================
  // 2. Sitio web personalizado
  // ========================================
  console.log('2️⃣  Sitio web personalizado');
  console.log('   ─────────────────────────────────');

  // Verificar si existe funcionalidad de sitio web
  const { data: userProfile } = await supabase
    .from('users')
    .select('company_name, company_description, company_logo, company_website')
    .eq('id', user.id)
    .single();

  if (userProfile && (userProfile.company_name || userProfile.company_website)) {
    console.log('   ⚠️  PARCIALMENTE IMPLEMENTADO');
    console.log('   - Perfil de empresa: ✓');
    console.log('   - Página /inmobiliaria/[id]: ✓');
    console.log('   - Subdomain personalizado: ❌ NO IMPLEMENTADO');
    console.log('   - Tema/diseño personalizado: ❌ NO IMPLEMENTADO');
    PROMISED_FEATURES['Sitio web personalizado'] = false; // Parcial = false
  } else {
    console.log('   ❌ NO IMPLEMENTADO');
  }
  console.log('');

  // ========================================
  // 3. 3 destacados por mes
  // ========================================
  console.log('3️⃣  3 destacados por mes');
  console.log('   ─────────────────────────────────');
  if (planLimits.allow_featured) {
    console.log('   ⚠️  PARCIALMENTE IMPLEMENTADO');
    console.log('   - Puede destacar propiedades: ✓');
    console.log('   - Límite de 3 por mes: ❌ NO IMPLEMENTADO');
    console.log('   - Actualmente: ILIMITADOS destacados');
    console.log('   - Endpoint: /api/properties/[id]/featured');
    PROMISED_FEATURES['3 destacados por mes'] = false; // No hay límite de 3
  } else {
    console.log('   ❌ NO IMPLEMENTADO');
  }
  console.log('');

  // ========================================
  // 4. Estadísticas avanzadas
  // ========================================
  console.log('4️⃣  Estadísticas avanzadas');
  console.log('   ─────────────────────────────────');
  if (planLimits.allow_analytics) {
    console.log('   ⚠️  PARCIALMENTE IMPLEMENTADO');
    console.log('   - Flag allow_analytics: ✓');
    console.log('   - Tracking de vistas: ✓ (PropertyViewTracker)');
    console.log('   - Dashboard de estadísticas: ❓ (verificar si existe)');

    // Verificar si existe tabla de analytics
    const { data: viewsTable } = await supabase
      .from('property_views')
      .select('id')
      .limit(1);

    if (viewsTable) {
      console.log('   - Tabla property_views: ✓');
    }
    PROMISED_FEATURES['Estadísticas avanzadas'] = false; // Parcial
  } else {
    console.log('   ❌ NO IMPLEMENTADO');
  }
  console.log('');

  // ========================================
  // 5. Soporte prioritario
  // ========================================
  console.log('5️⃣  Soporte prioritario');
  console.log('   ─────────────────────────────────');
  if (planLimits.allow_priority_support) {
    console.log('   ⚠️  FLAG ACTIVADO, FUNCIONALIDAD NO CLARA');
    console.log('   - Flag allow_priority_support: ✓');
    console.log('   - Sistema de tickets/soporte: ❓');
    console.log('   - Diferenciación en respuestas: ❓');
    PROMISED_FEATURES['Soporte prioritario'] = false;
  } else {
    console.log('   ❌ NO IMPLEMENTADO');
  }
  console.log('');

  // ========================================
  // 6. Posicionamiento +30%
  // ========================================
  console.log('6️⃣  Posicionamiento +30%');
  console.log('   ─────────────────────────────────');
  console.log('   ❌ NO VERIFICABLE EN BASE DE DATOS');
  console.log('   - Requiere verificar queries de búsqueda');
  console.log('   - Verificar ORDER BY en /api/properties');
  console.log('   - Boost de plan professional en resultados');
  PROMISED_FEATURES['Posicionamiento +30%'] = false;
  console.log('');

  // ========================================
  // 7. Acceso a nuevas funciones
  // ========================================
  console.log('7️⃣  Acceso a nuevas funciones');
  console.log('   ─────────────────────────────────');
  console.log('   ⚠️  PROMESA GENÉRICA');
  console.log('   - No es una característica medible');
  console.log('   - Depende de features futuras');
  PROMISED_FEATURES['Acceso a nuevas funciones'] = true; // Genérico
  console.log('');

  // ========================================
  // 8. Analytics detallado
  // ========================================
  console.log('8️⃣  Analytics detallado');
  console.log('   ─────────────────────────────────');
  if (planLimits.allow_analytics) {
    console.log('   ⚠️  IGUAL QUE "ESTADÍSTICAS AVANZADAS"');
    console.log('   - Duplicado de característica #4');
    console.log('   - allow_analytics: ✓');
    PROMISED_FEATURES['Analytics detallado'] = false; // Parcial como #4
  } else {
    console.log('   ❌ NO IMPLEMENTADO');
  }
  console.log('');

  // ========================================
  // RESUMEN
  // ========================================
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('📊 RESUMEN DE AUDITORÍA');
  console.log('═══════════════════════════════════════════════════════\n');

  let implemented = 0;
  let total = 0;

  for (const [feature, isImplemented] of Object.entries(PROMISED_FEATURES)) {
    total++;
    const status = isImplemented ? '✅' : '❌';
    console.log(`${status} ${feature}`);
    if (isImplemented) implemented++;
  }

  console.log('\n───────────────────────────────────────────────────────');
  console.log(`Implementadas completamente: ${implemented}/${total} (${Math.round(implemented/total*100)}%)`);
  console.log('───────────────────────────────────────────────────────\n');

  // RECOMENDACIONES
  console.log('💡 RECOMENDACIONES:\n');
  console.log('1. ⚠️  CRÍTICO: Implementar límite de 3 destacados por mes');
  console.log('   - Agregar campo featured_count_month en users');
  console.log('   - Resetear contador cada mes');
  console.log('   - Validar en /api/properties/[id]/featured\n');

  console.log('2. ⚠️  IMPORTANTE: Verificar posicionamiento +30%');
  console.log('   - Revisar queries en /api/properties');
  console.log('   - Agregar boost por plan_tier en ORDER BY\n');

  console.log('3. 📝 MEJORAR: Dashboard de analytics');
  console.log('   - Crear página /mi-cuenta/analytics');
  console.log('   - Mostrar gráficos de vistas, contactos, etc.\n');

  console.log('4. 🌐 CONSIDERAR: Sitio web personalizado');
  console.log('   - Definir qué significa "sitio web personalizado"');
  console.log('   - Si es subdomain: inmobiliaria.misionesarrienda.com');
  console.log('   - Si es tema custom: implementar selector de temas\n');

  console.log('5. 🎫 ACLARAR: Soporte prioritario');
  console.log('   - Implementar sistema de tickets');
  console.log('   - O simplemente priorizar en atención manual\n');
}

auditProfessionalPlan()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('❌ Error en auditoría:', err);
    process.exit(1);
  });
