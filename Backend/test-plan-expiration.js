require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const USER_ID = 'a4ef1f3d-c3e8-46df-b186-5b5c837cc14b'

async function testPlanExpiration() {
  console.log('🧪 TESTING: Sistema de Auto-Expiración de Planes\n')
  console.log('=' .repeat(60))

  // 1. Crear 10 propiedades de prueba
  console.log('\n📝 PASO 1: Crear 10 propiedades de prueba...')

  const properties = []
  for (let i = 1; i <= 10; i++) {
    const { data, error } = await supabase
      .from('properties')
      .insert({
        user_id: USER_ID,
        title: `Propiedad de Prueba ${i}`,
        description: `Esta es una propiedad de prueba creada automáticamente para testing del sistema de expiración de planes.`,
        price: 100000 + (i * 10000),
        property_type: 'departamento',
        operation_type: 'venta',
        is_active: true,
        location: 'Posadas, Misiones',
        bedrooms: 2,
        bathrooms: 1,
        area: 50
      })
      .select()
      .single()

    if (error) {
      console.error(`❌ Error creando propiedad ${i}:`, error.message)
    } else {
      properties.push(data)
      console.log(`✅ Propiedad ${i} creada: ${data.id}`)
    }
  }

  console.log(`\n✅ ${properties.length} propiedades creadas exitosamente`)

  // 2. Asignar plan Professional
  console.log('\n📝 PASO 2: Asignar plan Professional...')
  const { error: updateError } = await supabase
    .from('users')
    .update({
      plan_tier: 'professional',
      plan_end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() // +1 año
    })
    .eq('id', USER_ID)

  if (updateError) {
    console.error('❌ Error asignando plan:', updateError.message)
    return
  }
  console.log('✅ Plan Professional asignado (válido por 1 año)')

  // 3. Verificar propiedades activas
  const { count: activeCount } = await supabase
    .from('properties')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', USER_ID)
    .eq('is_active', true)

  console.log(`\n📊 Total propiedades activas: ${activeCount}`)

  // 4. Simular expiración
  console.log('\n📝 PASO 3: Simular expiración del plan...')
  const { error: expireError } = await supabase
    .from('users')
    .update({
      plan_end_date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() // -1 día
    })
    .eq('id', USER_ID)

  if (expireError) {
    console.error('❌ Error simulando expiración:', expireError.message)
    return
  }
  console.log('✅ Plan marcado como expirado (fecha: ayer)')

  // 5. Ejecutar función de expiración
  console.log('\n📝 PASO 4: Ejecutar función de expiración...')
  const { data: expireResult, error: expireFuncError } = await supabase
    .rpc('expire_user_plan', { user_uuid: USER_ID })
    .single()

  if (expireFuncError) {
    console.error('❌ Error ejecutando expiración:', expireFuncError.message)
    return
  }

  console.log('\n✅ Resultado de expiración:')
  console.log(`   - Plan anterior: ${expireResult.old_plan}`)
  console.log(`   - Plan nuevo: ${expireResult.new_plan}`)
  console.log(`   - Propiedades desactivadas: ${expireResult.properties_deactivated}`)
  console.log(`   - Mensaje: ${expireResult.message}`)

  // 6. Verificar propiedades después de expiración
  const { count: activeAfterCount } = await supabase
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

  console.log('\n📊 Estado después de expiración:')
  console.log(`   - Propiedades activas: ${activeAfterCount} (debe ser 5)`)
  console.log(`   - Propiedades desactivadas: ${deactivatedCount}`)

  // 7. Ver propiedades desactivadas
  const { data: deactivatedProps } = await supabase
    .from('properties')
    .select('id, title, deactivated_reason, deactivated_at')
    .eq('user_id', USER_ID)
    .eq('is_active', false)
    .not('deactivated_reason', 'is', null)
    .order('deactivated_at', { ascending: false })

  if (deactivatedProps && deactivatedProps.length > 0) {
    console.log('\n📋 Propiedades desactivadas:')
    deactivatedProps.forEach((prop, i) => {
      console.log(`   ${i + 1}. ${prop.title}`)
      console.log(`      Razón: ${prop.deactivated_reason}`)
      console.log(`      Fecha: ${new Date(prop.deactivated_at).toLocaleString('es-AR')}`)
    })
  }

  // 8. Asignar plan Professional nuevamente
  console.log('\n📝 PASO 5: Re-asignar plan Professional...')
  const { error: upgradeError } = await supabase
    .from('users')
    .update({
      plan_tier: 'professional',
      plan_end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
    })
    .eq('id', USER_ID)

  if (upgradeError) {
    console.error('❌ Error re-asignando plan:', upgradeError.message)
    return
  }
  console.log('✅ Plan Professional re-asignado')

  // 9. Ejecutar reactivación
  console.log('\n📝 PASO 6: Reactiva propiedades automáticamente...')
  const { data: reactivateCount, error: reactivateError } = await supabase
    .rpc('reactivate_properties_on_upgrade', {
      user_uuid: USER_ID,
      new_max_properties: 20
    })

  if (reactivateError) {
    console.error('❌ Error reactivando:', reactivateError.message)
    return
  }

  console.log(`✅ Propiedades reactivadas: ${reactivateCount}`)

  // 10. Verificar estado final
  const { count: finalActiveCount } = await supabase
    .from('properties')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', USER_ID)
    .eq('is_active', true)

  console.log('\n📊 Estado final:')
  console.log(`   - Propiedades activas: ${finalActiveCount}`)
  console.log(`   - Plan actual: professional`)

  // 11. Limpiar propiedades de prueba (opcional)
  console.log('\n🧹 ¿Limpiar propiedades de prueba?')
  console.log('   Ejecuta este SQL si quieres eliminarlas:')
  console.log(`   DELETE FROM properties WHERE user_id = '${USER_ID}' AND title LIKE 'Propiedad de Prueba%';`)

  console.log('\n' + '='.repeat(60))
  console.log('✅ TEST COMPLETADO\n')
}

testPlanExpiration().catch(console.error)
