// Script 3: Reactivar propiedades al mejorar plan
require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const USER_ID = 'a4ef1f3d-c3e8-46df-b186-5b5c837cc14b'

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Error: Faltan variables de entorno')
  console.error('Asegurate de tener NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en .env.local')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

async function testReactivation() {
  console.log('🔄 Probando reactivación de propiedades...\n')

  // 1. Ver estado actual
  const { count: activeBefore } = await supabase
    .from('properties')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', USER_ID)
    .eq('is_active', true)

  const { count: deactivatedBefore } = await supabase
    .from('properties')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', USER_ID)
    .eq('is_active', false)
    .not('deactivated_reason', 'is', null)

  console.log('📊 Estado ANTES de reactivar:')
  console.log(`   - Activas: ${activeBefore}`)
  console.log(`   - Desactivadas: ${deactivatedBefore}\n`)

  // 2. Re-asignar plan Professional
  console.log('1️⃣ Re-asignando plan Professional...')
  await supabase
    .from('users')
    .update({
      plan_tier: 'professional',
      plan_end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
    })
    .eq('id', USER_ID)
  console.log('✅ Plan Professional asignado\n')

  // 3. Ejecutar reactivación
  console.log('2️⃣ Ejecutando reactivate_properties_on_upgrade()...')
  const { data: reactivatedCount, error } = await supabase
    .rpc('reactivate_properties_on_upgrade', {
      user_uuid: USER_ID,
      new_max_properties: 20
    })

  if (error) {
    console.error('❌ Error:', error)
    return
  }

  console.log(`✅ Propiedades reactivadas: ${reactivatedCount}\n`)

  // 4. Ver estado DESPUÉS
  const { count: activeAfter } = await supabase
    .from('properties')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', USER_ID)
    .eq('is_active', true)

  const { count: deactivatedAfter } = await supabase
    .from('properties')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', USER_ID)
    .eq('is_active', false)
    .not('deactivated_reason', 'is', null)

  console.log('📊 Estado DESPUÉS de reactivar:')
  console.log(`   - Activas: ${activeAfter}`)
  console.log(`   - Desactivadas: ${deactivatedAfter}`)

  // 5. Verificar plan actual
  const { data: user } = await supabase
    .from('users')
    .select('plan_tier, plan_end_date')
    .eq('id', USER_ID)
    .single()

  console.log('\n📋 Plan actual:')
  console.log(`   - Tier: ${user.plan_tier}`)
  console.log(`   - Expira: ${new Date(user.plan_end_date).toLocaleDateString('es-AR')}`)

  console.log('\n✅ Test de reactivación completado!')
}

testReactivation()
