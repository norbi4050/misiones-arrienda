/**
 * Script Simplificado: Generar Datos de Prueba
 *
 * Uso:
 *   npx tsx scripts/test-notifications/generate-test-data-simple.ts
 *
 * Este script crea UNA notificación de prueba directamente
 * para verificar que el sistema funciona
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

async function main() {
  console.log('\n🚀 GENERANDO NOTIFICACIÓN DE PRUEBA')
  console.log('='.repeat(60))

  // 1. Buscar un usuario existente
  console.log('\n1️⃣ Buscando usuario existente en la base de datos...')
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('id, email, name')
    .limit(1)

  if (usersError) {
    console.error('❌ Error buscando usuarios:', usersError.message)
    process.exit(1)
  }

  if (!users || users.length === 0) {
    console.error('❌ No se encontraron usuarios en la base de datos')
    console.log('   Crea al menos un usuario primero desde la app')
    process.exit(1)
  }

  const testUser = users[0]
  console.log(`✅ Usuario encontrado: ${testUser.email} (${testUser.id})`)

  // 2. Crear una notificación de prueba
  console.log('\n2️⃣ Creando notificación de prueba...')

  const notificationData = {
    id: cuid(),
    user_id: testUser.id,
    type: 'WELCOME',
    title: '🎉 Prueba del Sistema de Notificaciones',
    message: 'Esta es una notificación de prueba generada automáticamente. Si la ves, ¡el sistema funciona correctamente!',
    channels: ['in_app'],
    metadata: {
      test: true,
      created_by: 'test-script',
      timestamp: new Date().toISOString()
    },
    read_at: null,
    created_at: new Date().toISOString()
  }

  const { data: notification, error: notificationError } = await supabase
    .from('notifications')
    .insert(notificationData)
    .select()
    .single()

  if (notificationError) {
    console.error('❌ Error creando notificación:', notificationError.message)
    process.exit(1)
  }

  console.log(`✅ Notificación creada: ${notification.id}`)

  // 3. Buscar una propiedad existente
  console.log('\n3️⃣ Buscando propiedad existente...')
  const { data: properties, error: propertiesError } = await supabase
    .from('properties')
    .select('id, title, city, user_id')
    .eq('status', 'PUBLISHED')
    .limit(1)

  if (propertiesError) {
    console.warn('⚠️  Error buscando propiedades:', propertiesError.message)
  } else if (!properties || properties.length === 0) {
    console.warn('⚠️  No se encontraron propiedades publicadas')
  } else {
    const property = properties[0]
    console.log(`✅ Propiedad encontrada: ${property.title} en ${property.city}`)

    // Crear notificación relacionada con propiedad
    const propertyNotification = {
      id: cuid(),
      user_id: property.user_id,
      type: 'PROPERTY_STATUS_CHANGED',
      title: 'Estado de tu propiedad',
      message: `Tu propiedad "${property.title}" está activa. Esta es una notificación de prueba.`,
      channels: ['in_app'],
      metadata: {
        test: true,
        propertyId: property.id,
        ctaUrl: `/mi-cuenta/publicaciones/${property.id}`,
        ctaText: 'Ver propiedad'
      },
      related_id: property.id,
      related_type: 'property',
      read_at: null,
      created_at: new Date().toISOString()
    }

    const { error: propNotifError } = await supabase
      .from('notifications')
      .insert(propertyNotification)

    if (propNotifError) {
      console.warn('⚠️  Error creando notificación de propiedad:', propNotifError.message)
    } else {
      console.log('✅ Notificación de propiedad creada')
    }
  }

  // Resumen
  console.log('\n' + '='.repeat(60))
  console.log('✅ NOTIFICACIONES DE PRUEBA CREADAS')
  console.log('='.repeat(60))
  console.log(`\n👤 Usuario: ${testUser.name} (${testUser.email})`)
  console.log(`📧 Notificaciones creadas: 1-2`)
  console.log('\n🔍 Verificar en Supabase:')
  console.log('   SELECT * FROM notifications WHERE user_id = \'' + testUser.id + '\' ORDER BY created_at DESC;')
  console.log('\n💡 Próximos pasos:')
  console.log('   1. Abre tu app y ve a la sección de notificaciones')
  console.log('   2. Deberías ver las notificaciones de prueba')
  console.log('   3. Si aparecen, el sistema funciona correctamente!')
  console.log('\n')
}

main()
  .then(() => {
    console.log('✨ Proceso completado\n')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n💥 Error fatal:', error)
    process.exit(1)
  })
