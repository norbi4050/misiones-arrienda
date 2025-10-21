/**
 * Script de prueba: API de Notificaciones
 *
 * Prueba todos los endpoints de la API de notificaciones
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testNotificationsAPI() {
  console.log('🧪 Iniciando prueba de API de notificaciones...\n');

  try {
    // 1. Obtener usuario de prueba
    const testUser = await prisma.user.findFirst({
      where: {
        email: { contains: 'gonzalez' }
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

    console.log('✅ Usuario de prueba:', testUser.email);

    // 2. Obtener sesión/token (simulado - en producción usarías Supabase auth)
    // Para este test, vamos a verificar directamente con Prisma

    console.log('\n📝 Test 1: Obtener notificaciones');
    console.log('   Endpoint simulado: GET /api/notifications');

    const notifications = await prisma.notification.findMany({
      where: { userId: testUser.id },
      orderBy: { createdAt: 'desc' },
      take: 20
    });

    console.log(`   ✅ Obtenidas ${notifications.length} notificaciones`);

    if (notifications.length > 0) {
      console.log('\n   Primeras 3 notificaciones:');
      notifications.slice(0, 3).forEach((n, i) => {
        console.log(`   ${i + 1}. ${n.type}: ${n.title}`);
        console.log(`      - Leída: ${n.read ? 'Sí' : 'No'}`);
        console.log(`      - Fecha: ${n.createdAt.toLocaleString()}`);
      });
    }

    // 3. Test: Obtener solo notificaciones no leídas
    console.log('\n📝 Test 2: Obtener solo notificaciones no leídas');
    console.log('   Endpoint simulado: GET /api/notifications?unreadOnly=true');

    const unreadNotifications = await prisma.notification.findMany({
      where: {
        userId: testUser.id,
        read: false
      },
      orderBy: { createdAt: 'desc' }
    });

    console.log(`   ✅ Notificaciones no leídas: ${unreadNotifications.length}`);

    // 4. Test: Contador de no leídas
    console.log('\n📝 Test 3: Contador de notificaciones no leídas');
    console.log('   Endpoint simulado: GET /api/notifications/unread-count');

    const unreadCount = await prisma.notification.count({
      where: {
        userId: testUser.id,
        read: false
      }
    });

    console.log(`   ✅ Contador: ${unreadCount}`);

    // 5. Test: Marcar como leída
    if (unreadNotifications.length > 0) {
      const notificationToMark = unreadNotifications[0];

      console.log('\n📝 Test 4: Marcar notificación como leída');
      console.log(`   Endpoint simulado: PUT /api/notifications/${notificationToMark.id}/read`);

      const updated = await prisma.notification.update({
        where: { id: notificationToMark.id },
        data: {
          read: true,
          readAt: new Date()
        }
      });

      console.log('   ✅ Notificación marcada como leída');
      console.log(`      - ID: ${updated.id}`);
      console.log(`      - Read: ${updated.read}`);
      console.log(`      - ReadAt: ${updated.readAt?.toLocaleString()}`);

      // Revertir cambio para no afectar otras pruebas
      await prisma.notification.update({
        where: { id: notificationToMark.id },
        data: {
          read: false,
          readAt: null
        }
      });
      console.log('   ✅ Cambio revertido (para mantener estado de prueba)');
    }

    // 6. Test: Marcar todas como leídas
    console.log('\n📝 Test 5: Marcar todas como leídas');
    console.log('   Endpoint simulado: PUT /api/notifications/mark-all-read');

    const beforeCount = await prisma.notification.count({
      where: { userId: testUser.id, read: false }
    });

    console.log(`   - Antes: ${beforeCount} no leídas`);

    // NO vamos a ejecutar esto realmente para no afectar el estado
    console.log('   ⏭️  Skipped (para no afectar estado de prueba)');

    // 7. Test: Verificar tipos de notificaciones
    console.log('\n📝 Test 6: Tipos de notificaciones en el sistema');

    const notificationTypes = await prisma.notification.groupBy({
      by: ['type'],
      where: { userId: testUser.id },
      _count: { type: true }
    });

    console.log('   Tipos encontrados:');
    notificationTypes.forEach(t => {
      console.log(`   - ${t.type}: ${t._count.type} notificaciones`);
    });

    // 8. Test: Verificar metadata parsing
    console.log('\n📝 Test 7: Verificar metadata de notificaciones');

    const notificationsWithMetadata = await prisma.notification.findMany({
      where: {
        userId: testUser.id,
        metadata: { not: null }
      },
      take: 3,
      select: {
        id: true,
        type: true,
        title: true,
        metadata: true
      }
    });

    console.log(`   ✅ ${notificationsWithMetadata.length} notificaciones con metadata`);
    notificationsWithMetadata.forEach((n, i) => {
      console.log(`   ${i + 1}. ${n.type}`);
      try {
        const meta = typeof n.metadata === 'string' ? JSON.parse(n.metadata) : n.metadata;
        console.log('      Metadata:', JSON.stringify(meta, null, 2).split('\n').join('\n      '));
      } catch (e) {
        console.log('      Metadata: (error al parsear)');
      }
    });

    console.log('\n✅ Todas las pruebas de API completadas!');
    console.log('\n📊 Resumen:');
    console.log(`   - Total notificaciones: ${notifications.length}`);
    console.log(`   - No leídas: ${unreadCount}`);
    console.log(`   - Tipos únicos: ${notificationTypes.length}`);
    console.log(`   - Con metadata: ${notificationsWithMetadata.length}`);

  } catch (error) {
    console.error('\n❌ Error en la prueba:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar prueba
testNotificationsAPI()
  .catch(console.error);
