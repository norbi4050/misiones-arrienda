/**
 * Test para verificar que los fundadores pueden destacar propiedades
 *
 * Uso: node test-featured-permission.js EMAIL_USUARIO
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Cargar variables de entorno manualmente desde .env.local
const envPath = path.join(__dirname, '.env.local')
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8')
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=')
    if (key && valueParts.length > 0) {
      const value = valueParts.join('=').trim()
      process.env[key.trim()] = value
    }
  })
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Faltan variables de entorno')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testFeaturedPermission(email) {
  console.log(`\n🔍 Verificando permisos de destacar para: ${email}\n`)

  // 1. Obtener usuario
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id, email, is_founder, plan_tier')
    .eq('email', email)
    .single()

  if (userError || !user) {
    console.error('❌ Usuario no encontrado')
    return
  }

  console.log('✅ Usuario encontrado:')
  console.log('   ID:', user.id)
  console.log('   Es fundador:', user.is_founder)
  console.log('   Plan:', user.plan_tier)
  console.log('')

  // 2. Verificar límites del plan
  const { data: planLimits } = await supabase
    .rpc('get_user_plan_limits', { user_uuid: user.id })

  if (planLimits && planLimits.length > 0) {
    const limits = planLimits[0]
    console.log('📊 Límites del plan:')
    console.log('   Plan:', limits.plan_tier)
    console.log('   Max propiedades:', limits.max_active_properties || 'Ilimitado')
    console.log('   ✨ Puede destacar:', limits.allow_featured ? 'SÍ ✅' : 'NO ❌')
    console.log('   Adjuntos:', limits.allow_attachments ? 'SÍ' : 'NO')
    console.log('   Analytics:', limits.allow_analytics ? 'SÍ' : 'NO')
    console.log('')
  }

  // 3. Contar propiedades destacadas actuales
  const { count: featuredCount } = await supabase
    .from('properties')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('featured', true)

  console.log('⭐ Propiedades destacadas actuales:', featuredCount || 0)

  // 4. Obtener una propiedad del usuario para probar
  const { data: properties } = await supabase
    .from('properties')
    .select('id, title, featured')
    .eq('user_id', user.id)
    .limit(3)

  if (properties && properties.length > 0) {
    console.log('\n📋 Propiedades del usuario (primeras 3):')
    properties.forEach((prop, i) => {
      console.log(`   ${i + 1}. ${prop.title}`)
      console.log(`      ID: ${prop.id}`)
      console.log(`      Destacada: ${prop.featured ? 'SÍ ⭐' : 'NO'}`)
    })
    console.log('')
  } else {
    console.log('⚠️  No hay propiedades para testear')
    return
  }

  // 5. Resumen
  console.log('📝 RESUMEN:')
  if (user.is_founder && user.plan_tier === 'professional') {
    console.log('   ✅ El usuario ES fundador con plan Professional')
    console.log('   ✅ DEBERÍA poder destacar propiedades')
    console.log('   ✅ Límite: 3 destacados por mes')
  } else if (user.plan_tier === 'free') {
    console.log('   ❌ El usuario tiene plan FREE')
    console.log('   ❌ NO puede destacar propiedades')
    console.log('   💡 Necesita mejorar a plan Professional o superior')
  } else {
    console.log('   ℹ️  Plan:', user.plan_tier)
  }
  console.log('')

  // 6. Simular llamada a checkPlanLimit
  console.log('🔐 Simulando checkPlanLimit("mark_property_featured")...')
  console.log('')

  if (planLimits && planLimits[0].allow_featured) {
    console.log('   ✅ PERMITIDO - El usuario puede destacar propiedades')
    console.log('   📌 En la UI debería ver un botón para destacar')
  } else {
    console.log('   ❌ BLOQUEADO - El usuario NO puede destacar')
    console.log('   📌 En la UI debería ver un mensaje de upgrade')
  }
  console.log('')
}

// Main
const args = process.argv.slice(2)

if (args.length === 0) {
  console.log('\n📖 Uso: node test-featured-permission.js EMAIL_USUARIO\n')
  console.log('Ejemplo: node test-featured-permission.js norbi4050@gmail.com\n')
  process.exit(0)
}

testFeaturedPermission(args[0])
  .then(() => process.exit(0))
  .catch(error => {
    console.error('❌ Error:', error)
    process.exit(1)
  })
