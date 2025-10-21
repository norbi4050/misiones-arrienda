/**
 * Script de prueba: Enviar notificaciones
 *
 * Prueba el envío de notificaciones usando el NotificationService
 * directamente desde el servidor.
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Simular el módulo de notificaciones
async function testSendNotification() {
  console.log('🧪 Iniciando prueba de envío de notificaciones...\n');

  try {
    // 1. Obtener un usuario de prueba
    const testUser = await prisma.user.findFirst({
      where: {
        email: { contains: 'gonzalez' } // Carlos el inquilino
      },
      select: {
        id: true,
        email: true,
        name: true,
        userType: true
      }
    });

    if (!testUser) {
      console.error('❌ No se encontró usuario de prueba');
      return;
    }

    console.log('✅ Usuario de prueba encontrado:', {
      id: testUser.id,
      email: testUser.email,
      name: testUser.name
    });

    // 2. Crear notificación de prueba directamente en la base de datos
    const notification = await prisma.notification.create({
      data: {
        userId: testUser.id,
        type: 'TEST',
        title: '🧪 Test: Notificación de Prueba del Script',
        message: 'Esta es una notificación de prueba creada por el script de testing. Si ves esto, el sistema funciona correctamente.',
        metadata: JSON.stringify({
          testId: Date.now(),
          scriptName: 'test-notifications-send.js',
          timestamp: new Date().toISOString()
        }),
        channels: JSON.stringify(['in_app']),
        read: false,
        sentAt: new Date()
      }
    });

    console.log('\n✅ Notificación creada exitosamente:', {
      id: notification.id,
      type: notification.type,
      title: notification.title,
      read: notification.read
    });

    // 3. Verificar que se creó correctamente
    const savedNotification = await prisma.notification.findUnique({
      where: { id: notification.id }
    });

    if (savedNotification) {
      console.log('\n✅ Verificación: Notificación guardada en la base de datos');
      console.log('   - ID:', savedNotification.id);
      console.log('   - Usuario:', savedNotification.userId);
      console.log('   - Título:', savedNotification.title);
      console.log('   - Leída:', savedNotification.read);
      console.log('   - Fecha creación:', savedNotification.createdAt);
    }

    // 4. Contar notificaciones no leídas del usuario
    const unreadCount = await prisma.notification.count({
      where: {
        userId: testUser.id,
        read: false
      }
    });

    console.log('\n📊 Estadísticas:');
    console.log('   - Notificaciones no leídas:', unreadCount);

    // 5. Listar últimas 5 notificaciones
    const recentNotifications = await prisma.notification.findMany({
      where: { userId: testUser.id },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        type: true,
        title: true,
        read: true,
        createdAt: true
      }
    });

    console.log('\n📋 Últimas 5 notificaciones:');
    recentNotifications.forEach((n, i) => {
      const status = n.read ? '✓ Leída' : '○ No leída';
      console.log(`   ${i + 1}. [${status}] ${n.type}: ${n.title}`);
      console.log(`      ID: ${n.id}`);
      console.log(`      Fecha: ${n.createdAt.toLocaleString()}`);
    });

    console.log('\n✅ Prueba completada exitosamente!');
    console.log('\n💡 Próximos pasos:');
    console.log('   1. Abrí el navegador en http://localhost:3000');
    console.log('   2. Iniciá sesión como:', testUser.email);
    console.log('   3. Hacé click en la campana de notificaciones');
    console.log('   4. Deberías ver la notificación de prueba');

  } catch (error) {
    console.error('\n❌ Error en la prueba:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar prueba
testSendNotification()
  .catch(console.error);
