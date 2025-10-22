/**
 * Script: Generar Datos de Prueba
 *
 * Uso:
 *   npx tsx scripts/test-notifications/generate-test-data.ts
 *
 * Este script crea datos de prueba en la base de datos para verificar
 * que las notificaciones se disparen correctamente en escenarios reales
 */

import './load-env' // Cargar variables de entorno
import { createClient } from '@supabase/supabase-js'
import { init } from '@paralleldrive/cuid2'

const cuid = init({ length: 24 })

// Configuración de Supabase
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Error: SUPABASE_URL y SUPABASE_ANON_KEY deben estar configurados')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// IDs de prueba que vamos a crear
let testUserId: string
let testPropertyId: string

/**
 * Crear usuario de prueba
 */
async function createTestUser() {
  console.log('\n👤 Creando usuario de prueba...')

  const userData = {
    id: cuid(),
    email: `test-${Date.now()}@misionesarrienda.test`,
    name: 'Usuario de Prueba',
    user_type: 'inmobiliaria',
    current_plan: 'premium',
    plan_end_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // Expira en 5 días
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }

  const { data, error } = await supabase
    .from('users')
    .insert(userData)
    .select()
    .single()

  if (error) {
    console.error('❌ Error creando usuario:', error.message)
    throw error
  }

  testUserId = data.id
  console.log(`✅ Usuario creado: ${data.email} (${data.id})`)
  console.log(`   Plan: ${data.current_plan} - Expira: ${new Date(data.plan_end_date!).toLocaleDateString('es-AR')}`)

  return data
}

/**
 * Crear propiedad de prueba que expira pronto
 */
async function createExpiringProperty() {
  console.log('\n🏠 Creando propiedad de prueba...')

  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7) // Expira en 7 días

  const propertyData = {
    id: cuid(),
    user_id: testUserId,
    title: 'Casa de Prueba - Centro Posadas',
    description: 'Propiedad de prueba para verificar notificaciones de expiración',
    operation_type: 'VENTA',
    property_type: 'casa',
    price: 150000,
    city: 'Posadas',
    province: 'Misiones',
    address: 'Av. Test 123',
    bedrooms: 3,
    bathrooms: 2,
    square_meters: 120,
    status: 'PUBLISHED',
    is_active: true,
    expires_at: expiresAt.toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }

  const { data, error } = await supabase
    .from('properties')
    .insert(propertyData)
    .select()
    .single()

  if (error) {
    console.error('❌ Error creando propiedad:', error.message)
    throw error
  }

  testPropertyId = data.id
  console.log(`✅ Propiedad creada: ${data.title} (${data.id})`)
  console.log(`   Estado: ${data.status} - Expira: ${new Date(data.expires_at).toLocaleDateString('es-AR')}`)

  return data
}

/**
 * Crear usuario con plan expirado (para probar check-expired-plans)
 */
async function createExpiredPlanUser() {
  console.log('\n⏰ Creando usuario con plan expirado...')

  const userData = {
    id: cuid(),
    email: `expired-plan-${Date.now()}@misionesarrienda.test`,
    name: 'Usuario Plan Expirado',
    user_type: 'inmobiliaria',
    current_plan: 'premium',
    plan_end_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // Expiró ayer
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }

  const { data, error } = await supabase
    .from('users')
    .insert(userData)
    .select()
    .single()

  if (error) {
    console.error('❌ Error creando usuario con plan expirado:', error.message)
    throw error
  }

  console.log(`✅ Usuario con plan expirado: ${data.email} (${data.id})`)
  console.log(`   Plan: ${data.current_plan} - Expiró: ${new Date(data.plan_end_date!).toLocaleDateString('es-AR')}`)

  return data
}

/**
 * Crear propiedad ya expirada (para probar expire-cleanup)
 */
async function createExpiredProperty() {
  console.log('\n🏚️  Creando propiedad expirada...')

  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() - 1) // Expiró ayer

  const propertyData = {
    id: cuid(),
    user_id: testUserId,
    title: 'Departamento Prueba - Expirado',
    description: 'Propiedad de prueba para verificar limpieza de expirados',
    operation_type: 'ALQUILER',
    property_type: 'departamento',
    price: 80000,
    city: 'Posadas',
    province: 'Misiones',
    address: 'Calle Test 456',
    bedrooms: 2,
    bathrooms: 1,
    square_meters: 60,
    status: 'PUBLISHED',
    is_active: true, // Debería cambiar a false por el cron
    expires_at: expiresAt.toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }

  const { data, error } = await supabase
    .from('properties')
    .insert(propertyData)
    .select()
    .single()

  if (error) {
    console.error('❌ Error creando propiedad expirada:', error.message)
    throw error
  }

  console.log(`✅ Propiedad expirada: ${data.title} (${data.id})`)
  console.log(`   Estado: ${data.status} - Expiró: ${new Date(data.expires_at).toLocaleDateString('es-AR')}`)

  return data
}

/**
 * Crear historial de búsqueda (para probar NEW_PROPERTY_IN_AREA)
 */
async function createSearchHistory() {
  console.log('\n🔍 Creando historial de búsquedas...')

  const searches = [
    { city: 'Posadas', operation_type: 'ALQUILER', property_type: 'departamento' },
    { city: 'Posadas', operation_type: 'VENTA', property_type: 'casa' },
    { city: 'Oberá', operation_type: 'ALQUILER', property_type: 'casa' }
  ]

  let created = 0

  for (const search of searches) {
    const searchData = {
      id: cuid(),
      user_id: testUserId,
      city: search.city,
      operation_type: search.operation_type,
      property_type: search.property_type,
      created_at: new Date().toISOString()
    }

    const { error } = await supabase
      .from('search_history')
      .insert(searchData)

    if (error) {
      console.error(`⚠️  Error creando búsqueda en ${search.city}:`, error.message)
    } else {
      created++
      console.log(`   ✅ Búsqueda: ${search.property_type} en ${search.operation_type} - ${search.city}`)
    }
  }

  console.log(`✅ ${created}/${searches.length} búsquedas creadas`)
}

/**
 * Crear publicación de comunidad (para probar LIKE_RECEIVED)
 */
async function createCommunityPost() {
  console.log('\n📱 Creando publicación de comunidad...')

  const postData = {
    id: cuid(),
    user_id: testUserId,
    title: 'Busco departamento 2 ambientes en Posadas Centro',
    content: 'Hola! Estoy buscando un departamento de 2 ambientes en la zona céntrica de Posadas. Mi presupuesto es de hasta $100.000. Si conocen algo disponible, por favor comenten. Gracias!',
    type: 'seeking',
    city: 'Posadas',
    max_budget: 100000,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }

  const { data, error } = await supabase
    .from('community_posts')
    .insert(postData)
    .select()
    .single()

  if (error) {
    console.error('❌ Error creando publicación de comunidad:', error.message)
    throw error
  }

  console.log(`✅ Publicación creada: ${data.title} (${data.id})`)

  return data
}

/**
 * Limpiar datos de prueba
 */
async function cleanupTestData() {
  console.log('\n🧹 Limpiando datos de prueba anteriores...')

  // Limpiar usuarios de prueba
  const { error: usersError } = await supabase
    .from('users')
    .delete()
    .like('email', '%@misionesarrienda.test')

  if (usersError && usersError.code !== 'PGRST116') {
    console.warn('⚠️  Error limpiando usuarios:', usersError.message)
  } else {
    console.log('   ✅ Usuarios de prueba anteriores eliminados')
  }
}

/**
 * Función principal
 */
async function generateAllTestData() {
  console.log('\n🚀 GENERANDO DATOS DE PRUEBA PARA NOTIFICACIONES')
  console.log('='.repeat(60))

  try {
    // Limpiar datos anteriores
    await cleanupTestData()

    // Crear datos
    await createTestUser()
    await createExpiringProperty()
    await createExpiredPlanUser()
    await createExpiredProperty()
    await createSearchHistory()
    await createCommunityPost()

    // Resumen
    console.log('\n' + '='.repeat(60))
    console.log('✅ DATOS DE PRUEBA GENERADOS EXITOSAMENTE')
    console.log('='.repeat(60))
    console.log('\n📋 Resumen de datos creados:')
    console.log(`   👤 Usuario principal: ${testUserId}`)
    console.log(`   🏠 Propiedad que expira: ${testPropertyId}`)
    console.log(`   ⏰ Usuario con plan expirado: Creado`)
    console.log(`   🏚️  Propiedad expirada: Creada`)
    console.log(`   🔍 Historial de búsquedas: Creado`)
    console.log(`   📱 Publicación de comunidad: Creada`)

    console.log('\n🧪 Ahora puedes probar:')
    console.log('   1. Ejecutar cron jobs: npx tsx scripts/test-notifications/test-cron-jobs.ts')
    console.log('   2. Verificar notificaciones en Supabase tabla "notifications"')
    console.log('   3. Revisar emails enviados')
    console.log('   4. Crear nueva propiedad en Posadas para probar NEW_PROPERTY_IN_AREA')

    console.log('\n⚠️  IMPORTANTE: Estos son datos de prueba')
    console.log('   - Los emails usan dominio @misionesarrienda.test')
    console.log('   - Puedes eliminarlos manualmente desde Supabase')
    console.log('   - O ejecutar este script de nuevo (limpia automáticamente)\n')

    return {
      userId: testUserId,
      propertyId: testPropertyId
    }

  } catch (error) {
    console.error('\n❌ ERROR GENERANDO DATOS DE PRUEBA:', error)
    throw error
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  generateAllTestData()
    .then(() => {
      console.log('\n✨ Proceso completado\n')
      process.exit(0)
    })
    .catch((error) => {
      console.error('\n💥 Error fatal:', error)
      process.exit(1)
    })
}

export { generateAllTestData, cleanupTestData }
