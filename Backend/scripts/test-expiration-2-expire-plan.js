// Script 2: Simular expiración y ejecutar función
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

async function testExpiration() {
  console.log('🧪 Probando expiración de plan...\n')

  // 1. Asignar plan Professional
  console.log('1️⃣ Asignando plan Professional...')
  await supabase
    .from('users')
    .update({
      plan_tier: 'professional',
      plan_end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
    })
    .eq('id', USER_ID)
  console.log('✅ Plan Professional asignado\n')

  // 2. Verificar propiedades activas ANTES
  const { count: beforeCount } = await supabase
    .from('properties')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', USER_ID)
    .eq('is_active', true)
  console.log(`📊 Propiedades activas ANTES: ${beforeCount}\n`)

  // 3. Simular expiración
  console.log('2️⃣ Simulando expiración (fecha = ayer)...')
  await supabase
    .from('users')
    .update({
      plan_end_date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    })
    .eq('id', USER_ID)
  console.log('✅ Plan marcado como expirado\n')

  // 4. Ejecutar función de expiración
  console.log('3️⃣ Ejecutando expire_user_plan()...')
  const { data, error } = await supabase
    .rpc('expire_user_plan', { user_uuid: USER_ID })
    .single()

  if (error) {
    console.error('❌ Error:', error)
    return
  }

  console.log('✅ Resultado:')
  console.log(`   - Plan anterior: ${data.old_plan}`)
  console.log(`   - Plan nuevo: ${data.new_plan}`)
  console.log(`   - Propiedades desactivadas: ${data.properties_deactivated}`)
  console.log(`   - Mensaje: ${data.message}\n`)

  // 5. Verificar estado DESPUÉS
  const { count: afterCount } = await supabase
    .from('properties')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', USER_ID)
    .eq('is_active', true)

  const { count: deactivatedCount } = await supabase
    .from('properties')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', USER_ID)
    .eq('is_active', false)
    .not('deactivated_reason', 'is', null)

  console.log('📊 Estado DESPUÉS:')
  console.log(`   - Propiedades activas: ${afterCount} (debe ser 5)`)
  console.log(`   - Propiedades desactivadas: ${deactivatedCount}`)

  // 6. Ver detalles de desactivadas
  if (deactivatedCount > 0) {
    const { data: deactivated } = await supabase
      .from('properties')
      .select('title, deactivated_reason, deactivated_at')
      .eq('user_id', USER_ID)
      .eq('is_active', false)
      .not('deactivated_reason', 'is', null)
      .order('deactivated_at', { ascending: false })

    console.log('\n📋 Propiedades desactivadas:')
    deactivated.forEach((p, i) => {
      console.log(`   ${i + 1}. ${p.title}`)
      console.log(`      Razón: ${p.deactivated_reason}`)
    })
  }

  console.log('\n✅ Test de expiración completado!')
}

testExpiration()
