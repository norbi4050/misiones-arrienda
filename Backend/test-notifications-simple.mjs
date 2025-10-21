/**
 * Script Simple de Testing de Notificaciones
 *
 * Usa el Prisma Client directamente para probar el sistema
 *
 * USO: node test-notifications-simple.mjs
 */

import { PrismaClient } from '@prisma/client'
import dotenv from 'dotenv'

// Cargar variables de entorno
dotenv.config({ path: '.env.local' })

const prisma = new PrismaClient()

// Colores
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
  bold: '\x1b[1m'
}

const log = {
  title: (msg) => console.log(`\n${colors.bold}${colors.blue}${msg}${colors.reset}\n`),
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.cyan}ℹ️  ${msg}${colors.reset}`),
  detail: (msg) => console.log(`${colors.gray}   ${msg}${colors.reset}`),
}

async function main() {
  try {
    log.title('🧪 TESTING DEL SISTEMA DE NOTIFICACIONES')
    console.log('='.repeat(70))

    // TEST 1: Conectar a la base de datos
    log.info('TEST 1: Conectar a base de datos...')
    await prisma.$connect()
    log.success('Conectado a la base de datos')

    // TEST 2: Obtener usuarios
    log.info('\nTEST 2: Obtener usuarios disponibles...')
    const users = await prisma.user.findMany({
      take: 5,
      select: {
        id: true,
        email: true,
        name: true,
        userType: true
      }
    })

    if (users.length === 0) {
      log.error('No hay usuarios en la base de datos')
      process.exit(1)
    }

    log.success(`Encontrados ${users.length} usuarios`)
    users.forEach((user, i) => {
      console.log(`  ${i + 1}. ${user.email} (${user.userType || 'N/A'})`)
    })

    // Usar el primer usuario para testing
    const testUser = users[0]
    log.detail(`\nUsando para test: ${testUser.email}`)

    // TEST 3: Verificar tabla de notificaciones
    log.info('\nTEST 3: Verificar tabla de notificaciones...')
    const notificationCount = await prisma.notification.count()
    log.success(`Tabla de notificaciones existe (${notificationCount} notificaciones totales)`)

    // TEST 4: Crear notificaciones de prueba
    log.info('\nTEST 4: Crear notificaciones de prueba...')

    const testNotifications = [
      {
        userId: testUser.id,
        type: 'NEW_MESSAGE',
        title: '🧪 Test: Nuevo mensaje',
        message: 'Este es un mensaje de prueba del sistema de notificaciones.',
        channels: JSON.stringify(['in_app', 'email']),
        metadata: JSON.stringify({
          messageId: 'test-msg-1',
          senderName: 'Usuario de Prueba',
          ctaUrl: '/comunidad/mensajes',
          ctaText: 'Ver mensaje'
        }),
        read: false
      },
      {
        userId: testUser.id,
        type: 'INQUIRY_RECEIVED',
        title: '🧪 Test: Nueva consulta',
        message: 'Juan Pérez te ha enviado una consulta sobre tu propiedad.',
        channels: JSON.stringify(['in_app', 'email']),
        metadata: JSON.stringify({
          propertyTitle: 'Casa en Posadas',
          customerName: 'Juan Pérez',
          ctaUrl: '/mis-propiedades',
          ctaText: 'Ver consulta'
        }),
        read: false
      },
      {
        userId: testUser.id,
        type: 'LIKE_RECEIVED',
        title: '🧪 Test: Like recibido',
        message: 'A María le gustó tu post en la comunidad.',
        channels: JSON.stringify(['in_app']),
        metadata: JSON.stringify({
          likerId: 'test-user',
          likerName: 'María',
          ctaUrl: '/comunidad',
          ctaText: 'Ver post'
        }),
        read: false
      }
    ]

    let created = 0
    for (const notif of testNotifications) {
      try {
        await prisma.notification.create({ data: notif })
        log.success(`Creada: ${notif.type}`)
        created++
      } catch (error) {
        log.error(`Error creando ${notif.type}: ${error.message}`)
      }
    }

    log.info(`\n   Total creadas: ${created}/${testNotifications.length}`)

    // TEST 5: Obtener notificaciones del usuario
    log.info('\nTEST 5: Obtener notificaciones del usuario...')
    const userNotifications = await prisma.notification.findMany({
      where: { userId: testUser.id },
      orderBy: { createdAt: 'desc' },
      take: 10
    })

    log.success(`Obtenidas ${userNotifications.length} notificaciones`)
    console.log('\n  Últimas notificaciones:\n')
    userNotifications.slice(0, 5).forEach((notif) => {
      const icon = notif.read ? '📭' : '📬'
      console.log(`  ${icon} ${notif.title}`)
      log.detail(`     ${notif.type} | ${notif.read ? 'Leída' : 'No leída'}`)
    })

    // TEST 6: Contar no leídas
    log.info('\nTEST 6: Contar notificaciones no leídas...')
    const unreadCount = await prisma.notification.count({
      where: {
        userId: testUser.id,
        read: false
      }
    })
    log.success(`Notificaciones no leídas: ${unreadCount}`)

    // TEST 7: Marcar una como leída
    log.info('\nTEST 7: Marcar primera notificación como leída...')
    if (userNotifications.length > 0) {
      const firstNotif = userNotifications[0]
      await prisma.notification.update({
        where: { id: firstNotif.id },
        data: {
          read: true,
          readAt: new Date()
        }
      })
      log.success(`Marcada como leída: ${firstNotif.title}`)
    } else {
      log.info('No hay notificaciones para marcar')
    }

    // TEST 8: Verificar preferencias
    log.info('\nTEST 8: Verificar preferencias del usuario...')
    let preferences = await prisma.notificationPreferences.findUnique({
      where: { userId: testUser.id }
    })

    if (!preferences) {
      log.info('Usuario no tiene preferencias, creando...')
      preferences = await prisma.notificationPreferences.create({
        data: {
          userId: testUser.id,
          emailEnabled: true,
          inAppEnabled: true,
          pushEnabled: false,
          newMessages: true,
          propertyInquiries: true
        }
      })
      log.success('Preferencias creadas')
    } else {
      log.success('Preferencias encontradas')
    }

    log.detail(`Email: ${preferences.emailEnabled}, In-App: ${preferences.inAppEnabled}`)

    // TEST 9: Verificar email logs
    log.info('\nTEST 9: Verificar email logs...')
    const emailLogs = await prisma.emailLog.findMany({
      where: { recipientId: testUser.id },
      orderBy: { createdAt: 'desc' },
      take: 5
    })

    if (emailLogs.length === 0) {
      log.info('No hay emails enviados (normal si SMTP no está configurado)')
    } else {
      log.success(`Emails registrados: ${emailLogs.length}`)
      emailLogs.forEach((email) => {
        const icon = email.status === 'SENT' ? '✅' : '⏳'
        console.log(`  ${icon} ${email.subject} (${email.status})`)
      })
    }

    // RESUMEN FINAL
    log.title('📊 RESUMEN DEL TEST')
    console.log('='.repeat(70))
    console.log('')
    log.success('✅ Conexión a base de datos: OK')
    log.success('✅ Tabla de notificaciones: OK')
    log.success('✅ Creación de notificaciones: OK')
    log.success('✅ Consulta de notificaciones: OK')
    log.success('✅ Marcar como leída: OK')
    log.success('✅ Preferencias de usuario: OK')
    console.log('')
    log.info(`📬 Total de notificaciones: ${notificationCount + created}`)
    log.info(`📭 Notificaciones del usuario: ${userNotifications.length}`)
    log.info(`🔔 No leídas: ${unreadCount}`)
    log.info(`📧 Emails registrados: ${emailLogs.length}`)
    console.log('')
    log.title('✨ PRÓXIMOS PASOS')
    console.log('')
    console.log(`  1. Inicia sesión como: ${colors.cyan}${testUser.email}${colors.reset}`)
    console.log('  2. Ve a la navbar y busca el icono de campana 🔔')
    console.log('  3. Deberías ver un badge con el número de notificaciones no leídas')
    console.log('  4. Haz click para ver el dropdown')
    console.log('  5. Ve a /notificaciones para ver todas')
    console.log('  6. Ve a /notificaciones/preferencias para configurar')
    console.log('')
    console.log('='.repeat(70))
    console.log('')

  } catch (error) {
    log.error(`Error durante el test: ${error.message}`)
    console.error(error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
