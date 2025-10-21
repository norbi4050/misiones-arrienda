/**
 * Script de debugging para verificar datos del plan
 *
 * Uso: node test-plan-data.js EMAIL_USUARIO
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Faltan variables de entorno')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testPlanData(email) {
  console.log(`\n🔍 Verificando datos de plan para: ${email}\n`)

  // 1. Obtener usuario
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single()

  if (userError || !user) {
    console.error('❌ Usuario no encontrado:', userError?.message)
    return
  }

  console.log('✅ Usuario encontrado:')
  console.log('   ID:', user.id)
  console.log('   Email:', user.email)
  console.log('   Tipo:', user.user_type)
  console.log('   Es fundador:', user.is_founder)
  console.log('   Plan:', user.plan_tier)
  console.log('   Descuento:', user.founder_discount)
  console.log('   Inicio:', user.plan_start_date)
  console.log('   Fin:', user.plan_end_date)
  console.log('')

  // 2. Probar función get_user_plan_limits
  console.log('🔧 Probando get_user_plan_limits()...\n')

  const { data: planLimits, error: limitsError } = await supabase
    .rpc('get_user_plan_limits', { user_uuid: user.id })

  if (limitsError) {
    console.error('❌ Error en get_user_plan_limits:', limitsError)
    return
  }

  if (!planLimits || planLimits.length === 0) {
    console.error('❌ La función no retornó datos')
    return
  }

  console.log('✅ Límites del plan:')
  const limits = planLimits[0]
  console.log('   Plan tier:', limits.plan_tier)
  console.log('   Max propiedades:', limits.max_active_properties || 'Ilimitado')
  console.log('   Adjuntos:', limits.allow_attachments ? 'Sí' : 'No')
  console.log('   Destacados:', limits.allow_featured ? 'Sí' : 'No')
  console.log('   Analytics:', limits.allow_analytics ? 'Sí' : 'No')
  console.log('   Soporte prioritario:', limits.allow_priority_support ? 'Sí' : 'No')
  console.log('   Max imágenes:', limits.max_images_per_property)
  console.log('   Expira:', limits.plan_expires_at || 'Nunca')
  console.log('   Está expirado:', limits.is_expired ? 'Sí' : 'No')
  console.log('   Descripción:', limits.description)
  console.log('   Precio mensual:', `$${limits.price_monthly}`)
  console.log('')

  // 3. Contar propiedades activas
  console.log('📊 Contando propiedades activas...\n')

  const { count: activeCount } = await supabase
    .from('properties')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .in('status', ['AVAILABLE', 'PUBLISHED', 'RESERVED'])

  console.log('✅ Propiedades activas:', activeCount || 0)

  if (limits.max_active_properties) {
    console.log('   Límite:', limits.max_active_properties)
    console.log('   Uso:', `${activeCount || 0} / ${limits.max_active_properties}`)
    console.log('   Porcentaje:', `${Math.round(((activeCount || 0) / limits.max_active_properties) * 100)}%`)
  } else {
    console.log('   Límite: Ilimitado')
  }
  console.log('')

  // 4. Simular respuesta de API
  console.log('📡 Simulando respuesta de API /api/users/plan:\n')

  const apiResponse = {
    success: true,
    plan: {
      plan_tier: limits.plan_tier,
      max_active_properties: limits.max_active_properties,
      current_active_properties: activeCount || 0,
      allow_attachments: limits.allow_attachments,
      allow_featured: limits.allow_featured,
      allow_analytics: limits.allow_analytics,
      allow_priority_support: limits.allow_priority_support,
      max_images_per_property: limits.max_images_per_property,
      plan_expires_at: limits.plan_expires_at,
      is_expired: limits.is_expired,
      description: limits.description,
      price_monthly: limits.price_monthly,
      is_founder: user.is_founder,
      founder_discount: user.founder_discount,
      plan_start_date: user.plan_start_date,
      plan_end_date: user.plan_end_date
    }
  }

  console.log(JSON.stringify(apiResponse, null, 2))
  console.log('')

  // 5. Verificar si puede activar más propiedades
  console.log('🔐 Probando can_user_activate_property()...\n')

  const { data: canActivate, error: canActivateError } = await supabase
    .rpc('can_user_activate_property', { user_uuid: user.id })

  if (canActivateError) {
    console.error('❌ Error en can_user_activate_property:', canActivateError)
  } else if (canActivate && canActivate.length > 0) {
    const check = canActivate[0]
    console.log('✅ Resultado:')
    console.log('   Puede activar:', check.allowed ? 'SÍ' : 'NO')
    console.log('   Razón:', check.reason)
    console.log('   Conteo actual:', check.current_count)
    console.log('   Límite:', check.limit || 'Ilimitado')
  }
  console.log('')

  console.log('✅ Verificación completa\n')
}

// Main
const args = process.argv.slice(2)

if (args.length === 0) {
  console.log('\n📖 Uso: node test-plan-data.js EMAIL_USUARIO\n')
  console.log('Ejemplo: node test-plan-data.js norbi4050@gmail.com\n')
  process.exit(0)
}

testPlanData(args[0])
  .then(() => process.exit(0))
  .catch(error => {
    console.error('❌ Error:', error)
    process.exit(1)
  })
