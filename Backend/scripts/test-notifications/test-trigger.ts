/**
 * Script de Prueba: Disparar Notificaciones Manualmente
 *
 * Uso:
 *   npx tsx scripts/test-notifications/test-trigger.ts
 *
 * Este script envía notificaciones de prueba para cada tipo implementado
 */

import { sendNotification } from '../../src/lib/notification-service'

// IDs de prueba (cambiar por IDs reales de tu base de datos)
const TEST_USER_ID = 'test-user-id'
const TEST_PROPERTY_ID = 'test-property-id'
const TEST_CONVERSATION_ID = 'test-conversation-id'

async function testWelcome() {
  console.log('\n📧 Probando WELCOME...')
  await sendNotification({
    userId: TEST_USER_ID,
    type: 'WELCOME',
    title: '¡Bienvenido a Misiones Arrienda, Juan Test!',
    message: 'Gracias por registrarte. Estamos encantados de tenerte en nuestra plataforma. Comienza a publicar tus propiedades y gestiona tu cartera.',
    channels: ['email', 'in_app'],
    metadata: {
      userType: 'inmobiliaria',
      ctaUrl: '/mi-empresa',
      ctaText: 'Ir a mi empresa'
    }
  })
  console.log('✅ WELCOME enviado')
}

async function testEmailVerified() {
  console.log('\n📧 Probando EMAIL_VERIFIED...')
  await sendNotification({
    userId: TEST_USER_ID,
    type: 'EMAIL_VERIFIED',
    title: '✅ Tu email ha sido verificado',
    message: 'Tu cuenta con el email test@example.com ha sido verificada exitosamente.',
    channels: ['in_app'],
    metadata: {
      email: 'test@example.com',
      verifiedAt: new Date().toISOString()
    }
  })
  console.log('✅ EMAIL_VERIFIED enviado')
}

async function testPropertyStatusChanged() {
  console.log('\n📧 Probando PROPERTY_STATUS_CHANGED...')
  await sendNotification({
    userId: TEST_USER_ID,
    type: 'PROPERTY_STATUS_CHANGED',
    title: 'Estado de tu propiedad actualizado',
    message: 'Tu propiedad "Casa en Posadas Centro" ahora está publicada.',
    channels: ['in_app'],
    metadata: {
      propertyId: TEST_PROPERTY_ID,
      oldStatus: 'DRAFT',
      newStatus: 'PUBLISHED',
      propertyTitle: 'Casa en Posadas Centro',
      ctaUrl: `/mi-cuenta/publicaciones/${TEST_PROPERTY_ID}`,
      ctaText: 'Ver propiedad'
    },
    relatedId: TEST_PROPERTY_ID,
    relatedType: 'property'
  })
  console.log('✅ PROPERTY_STATUS_CHANGED enviado')
}

async function testLikeReceived() {
  console.log('\n📧 Probando LIKE_RECEIVED...')
  await sendNotification({
    userId: TEST_USER_ID,
    type: 'LIKE_RECEIVED',
    title: 'María García le dio me gusta a tu publicación',
    message: 'Tu publicación "Busco departamento en Posadas" recibió un me gusta.',
    channels: ['in_app'],
    metadata: {
      likerName: 'María García',
      likerAvatar: 'https://avatar.vercel.sh/maria',
      postTitle: 'Busco departamento en Posadas',
      postId: 'test-post-id',
      ctaUrl: '/comunidad/publicaciones/test-post-id',
      ctaText: 'Ver publicación'
    },
    relatedId: 'test-post-id',
    relatedType: 'community_post'
  })
  console.log('✅ LIKE_RECEIVED enviado')
}

async function testNewMessage() {
  console.log('\n📧 Probando NEW_MESSAGE...')
  await sendNotification({
    userId: TEST_USER_ID,
    type: 'NEW_MESSAGE',
    title: 'Nuevo mensaje de Pedro López',
    message: 'Hola, estoy interesado en tu propiedad. ¿Podemos coordinar una visita?',
    channels: ['email', 'in_app'],
    metadata: {
      senderName: 'Pedro López',
      senderAvatar: 'https://avatar.vercel.sh/pedro',
      conversationId: TEST_CONVERSATION_ID,
      messagePreview: 'Hola, estoy interesado en tu propiedad. ¿Podemos coordinar una visita?',
      propertyTitle: 'Casa en Posadas Centro',
      ctaUrl: `/messages/${TEST_CONVERSATION_ID}`,
      ctaText: 'Responder mensaje'
    },
    relatedId: TEST_CONVERSATION_ID,
    relatedType: 'conversation'
  })
  console.log('✅ NEW_MESSAGE enviado')
}

async function testMessageReply() {
  console.log('\n📧 Probando MESSAGE_REPLY...')
  await sendNotification({
    userId: TEST_USER_ID,
    type: 'MESSAGE_REPLY',
    title: 'Pedro López respondió a tu mensaje',
    message: 'Perfecto, ¿te viene bien el sábado a las 10 AM?',
    channels: ['in_app'],
    metadata: {
      senderName: 'Pedro López',
      senderAvatar: 'https://avatar.vercel.sh/pedro',
      conversationId: TEST_CONVERSATION_ID,
      messagePreview: 'Perfecto, ¿te viene bien el sábado a las 10 AM?',
      ctaUrl: `/messages/${TEST_CONVERSATION_ID}`,
      ctaText: 'Ver conversación'
    },
    relatedId: TEST_CONVERSATION_ID,
    relatedType: 'conversation'
  })
  console.log('✅ MESSAGE_REPLY enviado')
}

async function testInquiryReceived() {
  console.log('\n📧 Probando INQUIRY_RECEIVED...')
  await sendNotification({
    userId: TEST_USER_ID,
    type: 'INQUIRY_RECEIVED',
    title: 'Nueva consulta sobre tu propiedad',
    message: 'Laura Martínez está interesada en "Casa en Posadas Centro".',
    channels: ['email', 'in_app'],
    metadata: {
      inquirerName: 'Laura Martínez',
      inquirerEmail: 'laura@example.com',
      inquirerPhone: '+54 3764 123456',
      propertyTitle: 'Casa en Posadas Centro',
      propertyId: TEST_PROPERTY_ID,
      inquiryMessage: '¿La propiedad cuenta con cochera? ¿Cuál es el costo de las expensas?',
      ctaUrl: `/mi-cuenta/consultas/${TEST_PROPERTY_ID}`,
      ctaText: 'Ver consulta'
    },
    relatedId: TEST_PROPERTY_ID,
    relatedType: 'inquiry'
  })
  console.log('✅ INQUIRY_RECEIVED enviado')
}

async function testPaymentCompleted() {
  console.log('\n📧 Probando PAYMENT_COMPLETED (destacar propiedad)...')
  await sendNotification({
    userId: TEST_USER_ID,
    type: 'PAYMENT_COMPLETED',
    title: '¡Pago confirmado!',
    message: 'Tu pago de $5000 ha sido procesado exitosamente. Tu propiedad está destacada por 30 días.',
    channels: ['email', 'in_app'],
    metadata: {
      paymentId: 'mp-12345678',
      amount: 5000,
      currency: 'ARS',
      paymentMethod: 'credit_card',
      propertyTitle: 'Casa en Posadas Centro',
      featureExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      ctaUrl: '/mi-cuenta/publicaciones',
      ctaText: 'Ver mis publicaciones'
    }
  })
  console.log('✅ PAYMENT_COMPLETED (propiedad) enviado')

  console.log('\n📧 Probando PAYMENT_COMPLETED (suscripción)...')
  await sendNotification({
    userId: TEST_USER_ID,
    type: 'PAYMENT_COMPLETED',
    title: '¡Suscripción activada!',
    message: 'Tu pago de $15000 ha sido procesado exitosamente. Tu suscripción al Plan Premium está activa.',
    channels: ['email', 'in_app'],
    metadata: {
      subscriptionId: 'sub-98765432',
      plan: 'premium',
      amount: 15000,
      currency: 'ARS',
      billingCycle: 'monthly',
      nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      ctaUrl: '/mi-empresa/planes',
      ctaText: 'Ver mi plan'
    }
  })
  console.log('✅ PAYMENT_COMPLETED (suscripción) enviado')
}

async function testPropertyExpiring() {
  console.log('\n📧 Probando PROPERTY_EXPIRING...')
  await sendNotification({
    userId: TEST_USER_ID,
    type: 'PROPERTY_EXPIRING',
    title: 'Tu propiedad "Casa en Posadas Centro" expira en 7 días',
    message: 'Tu publicación de VENTA en Posadas expirará el 29/10/2025. Renovála para mantenerla activa.',
    channels: ['email', 'in_app'],
    metadata: {
      propertyId: TEST_PROPERTY_ID,
      propertyTitle: 'Casa en Posadas Centro',
      expirationDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      daysRemaining: 7,
      city: 'Posadas',
      operationType: 'VENTA',
      ctaUrl: `/mi-cuenta/publicaciones/${TEST_PROPERTY_ID}`,
      ctaText: 'Renovar publicación'
    },
    relatedId: TEST_PROPERTY_ID,
    relatedType: 'property_expiration'
  })
  console.log('✅ PROPERTY_EXPIRING enviado')
}

async function testPlanExpiring() {
  console.log('\n📧 Probando PLAN_EXPIRING...')
  await sendNotification({
    userId: TEST_USER_ID,
    type: 'PLAN_EXPIRING',
    title: 'Tu plan Premium expira en 3 días',
    message: 'Tu plan Premium expirará el 25/10/2025. Renueva ahora para mantener tus beneficios.',
    channels: ['email', 'in_app'],
    metadata: {
      planType: 'premium',
      expirationDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      daysRemaining: 3,
      ctaUrl: '/planes',
      ctaText: 'Renovar Plan'
    },
    relatedId: TEST_USER_ID,
    relatedType: 'plan_expiration'
  })
  console.log('✅ PLAN_EXPIRING enviado')
}

async function testPlanExpired() {
  console.log('\n📧 Probando PLAN_EXPIRED...')
  await sendNotification({
    userId: TEST_USER_ID,
    type: 'PLAN_EXPIRED',
    title: 'Tu plan Premium ha expirado',
    message: 'Tu plan Premium expiró el 22/10/2025. Has sido cambiado al plan gratuito. Renovalo para recuperar tus beneficios.',
    channels: ['email', 'in_app'],
    metadata: {
      planType: 'premium',
      expirationDate: new Date().toISOString(),
      newPlan: 'free',
      ctaUrl: '/mi-empresa/planes',
      ctaText: 'Ver Planes'
    },
    relatedId: TEST_USER_ID,
    relatedType: 'plan_expired'
  })
  console.log('✅ PLAN_EXPIRED enviado')
}

async function testNewPropertyInArea() {
  console.log('\n📧 Probando NEW_PROPERTY_IN_AREA...')
  await sendNotification({
    userId: TEST_USER_ID,
    type: 'NEW_PROPERTY_IN_AREA',
    title: 'Nueva propiedad en Posadas',
    message: 'Se publicó un departamento en ALQUILER en Posadas que puede interesarte.',
    channels: ['in_app'],
    metadata: {
      propertyId: TEST_PROPERTY_ID,
      propertyTitle: 'Departamento 2 ambientes en Centro',
      city: 'Posadas',
      operationType: 'ALQUILER',
      price: 80000,
      propertyType: 'departamento',
      ctaUrl: `/propiedades/${TEST_PROPERTY_ID}`,
      ctaText: 'Ver propiedad'
    },
    relatedId: TEST_PROPERTY_ID,
    relatedType: 'property'
  })
  console.log('✅ NEW_PROPERTY_IN_AREA enviado')
}

async function testFavoritePropertyUpdated() {
  console.log('\n📧 Probando FAVORITE_PROPERTY_UPDATED...')
  await sendNotification({
    userId: TEST_USER_ID,
    type: 'FAVORITE_PROPERTY_UPDATED',
    title: 'Actualización en propiedad favorita',
    message: 'La propiedad "Casa en Posadas Centro" que guardaste ha sido actualizada.',
    channels: ['in_app'],
    metadata: {
      propertyId: TEST_PROPERTY_ID,
      propertyTitle: 'Casa en Posadas Centro',
      updateType: 'price_reduced',
      oldPrice: 150000,
      newPrice: 135000,
      ctaUrl: `/propiedades/${TEST_PROPERTY_ID}`,
      ctaText: 'Ver cambios'
    },
    relatedId: TEST_PROPERTY_ID,
    relatedType: 'property'
  })
  console.log('✅ FAVORITE_PROPERTY_UPDATED enviado')
}

async function testMatch() {
  console.log('\n📧 Probando MATCH...')
  await sendNotification({
    userId: TEST_USER_ID,
    type: 'MATCH',
    title: '¡Tienes un nuevo match!',
    message: 'Ambos se gustaron mutuamente. ¡Ahora pueden comenzar a conversar!',
    channels: ['in_app'],
    metadata: {
      matchedUserId: 'matched-user-id',
      matchedUserName: 'Carlos Rodríguez',
      matchedUserAvatar: 'https://avatar.vercel.sh/carlos',
      propertyId: TEST_PROPERTY_ID,
      propertyTitle: 'Casa en Posadas Centro',
      ctaUrl: `/messages/new?userId=matched-user-id`,
      ctaText: 'Enviar mensaje'
    },
    relatedId: 'match-id',
    relatedType: 'match'
  })
  console.log('✅ MATCH enviado')
}

// Función principal
async function runAllTests() {
  console.log('🚀 INICIANDO PRUEBAS DE NOTIFICACIONES')
  console.log('=========================================')
  console.log(`⚠️  USER_ID de prueba: ${TEST_USER_ID}`)
  console.log(`⚠️  Asegúrate de cambiar los IDs por valores reales de tu base de datos\n`)

  try {
    await testWelcome()
    await testEmailVerified()
    await testPropertyStatusChanged()
    await testLikeReceived()
    await testNewMessage()
    await testMessageReply()
    await testInquiryReceived()
    await testPaymentCompleted()
    await testPropertyExpiring()
    await testPlanExpiring()
    await testPlanExpired()
    await testNewPropertyInArea()
    await testFavoritePropertyUpdated()
    await testMatch()

    console.log('\n✅ TODAS LAS PRUEBAS COMPLETADAS')
    console.log('=========================================')
    console.log('Revisa:')
    console.log('1. Tu email para ver los correos enviados')
    console.log('2. La tabla notifications en Supabase')
    console.log('3. Los logs de la consola para errores')
  } catch (error) {
    console.error('\n❌ ERROR EN LAS PRUEBAS:', error)
    process.exit(1)
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  runAllTests()
}

export { runAllTests }
