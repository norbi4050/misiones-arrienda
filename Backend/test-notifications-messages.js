/**
 * Script de prueba: Notificaciones de Mensajes
 *
 * Prueba el sistema de notificaciones automáticas cuando se envían mensajes
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testMessageNotifications() {
  console.log('🧪 Iniciando prueba de notificaciones de mensajes...\n');

  try {
    // 1. Obtener usuarios de prueba
    const inquilino = await prisma.user.findFirst({
      where: { email: { contains: 'gonzalez' } },
      select: { id: true, email: true, name: true, userType: true }
    });

    const inmobiliaria = await prisma.user.findFirst({
      where: { userType: 'inmobiliaria' },
      select: { id: true, email: true, name: true, userType: true }
    });

    if (!inquilino || !inmobiliaria) {
      console.error('❌ No se encontraron usuarios de prueba');
      return;
    }

    console.log('✅ Usuarios de prueba encontrados:');
    console.log(`   - Inquilino: ${inquilino.email} (${inquilino.id})`);
    console.log(`   - Inmobiliaria: ${inmobiliaria.email} (${inmobiliaria.id})`);

    // 2. Buscar un thread existente entre estos usuarios
    console.log('\n📝 Buscando conversación existente...');

    // Obtener UserProfiles
    const inquilinoProfile = await prisma.userProfile.findFirst({
      where: { userId: inquilino.id }
    });

    const inmobiliariaProfile = await prisma.userProfile.findFirst({
      where: { userId: inmobiliaria.id }
    });

    if (!inquilinoProfile || !inmobiliariaProfile) {
      console.error('❌ No se encontraron perfiles de usuario');
      return;
    }

    console.log('   - Perfil inquilino:', inquilinoProfile.id);
    console.log('   - Perfil inmobiliaria:', inmobiliariaProfile.id);

    let thread = await prisma.conversationThread.findFirst({
      where: {
        OR: [
          { aId: inquilinoProfile.id, bId: inmobiliariaProfile.id },
          { aId: inmobiliariaProfile.id, bId: inquilinoProfile.id }
        ]
      },
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 5
        }
      }
    });

    if (thread) {
      console.log(`   ✅ Thread encontrado: ${thread.id}`);
      console.log(`      - Mensajes en el thread: ${thread.messages.length}`);
    } else {
      console.log('   ℹ️  No hay thread existente entre estos usuarios');
    }

    // 3. Verificar notificaciones de mensajes existentes
    console.log('\n📝 Verificando notificaciones de mensajes existentes...');

    const messageNotifications = await prisma.notification.findMany({
      where: {
        type: 'NEW_MESSAGE',
        userId: inmobiliaria.id // Notificaciones para la inmobiliaria
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    console.log(`   ✅ Encontradas ${messageNotifications.length} notificaciones de mensajes`);

    if (messageNotifications.length > 0) {
      console.log('\n   Últimas 5 notificaciones:');
      messageNotifications.slice(0, 5).forEach((n, i) => {
        const status = n.read ? '✓ Leída' : '○ No leída';
        console.log(`   ${i + 1}. [${status}] ${n.title}`);
        console.log(`      - Mensaje: ${n.message}`);
        console.log(`      - Fecha: ${n.createdAt.toLocaleString()}`);

        // Parse metadata
        try {
          const meta = typeof n.metadata === 'string' ? JSON.parse(n.metadata) : n.metadata;
          if (meta && meta.conversationId) {
            console.log(`      - Conversación: ${meta.conversationId}`);
          }
          if (meta && meta.senderName) {
            console.log(`      - De: ${meta.senderName}`);
          }
        } catch (e) {
          // Ignorar errores de parsing
        }
      });
    }

    // 4. Verificar integración en el endpoint de mensajes
    console.log('\n📝 Verificando integración en API de mensajes...');
    console.log('   Ubicación: src/app/api/messages/threads/[id]/messages/route.ts');

    // Verificar que hay un mensaje reciente
    if (thread && thread.messages.length > 0) {
      const latestMessage = thread.messages[0];
      console.log(`   ✅ Último mensaje: ${latestMessage.id}`);
      console.log(`      - De: ${latestMessage.senderId}`);
      console.log(`      - Contenido: ${latestMessage.content.substring(0, 50)}...`);
      console.log(`      - Fecha: ${latestMessage.createdAt.toLocaleString()}`);

      // Buscar notificación correspondiente
      const correspondingNotification = await prisma.notification.findFirst({
        where: {
          type: 'NEW_MESSAGE',
          relatedId: latestMessage.id,
          relatedType: 'message'
        }
      });

      if (correspondingNotification) {
        console.log(`   ✅ Notificación encontrada para este mensaje!`);
        console.log(`      - ID: ${correspondingNotification.id}`);
        console.log(`      - Usuario destinatario: ${correspondingNotification.userId}`);
        console.log(`      - Leída: ${correspondingNotification.read ? 'Sí' : 'No'}`);
      } else {
        console.log('   ⚠️  No se encontró notificación para el último mensaje');
        console.log('      (Puede ser que el mensaje sea antiguo, antes de la integración)');
      }
    }

    // 5. Test de lógica de envío (solo email en primer mensaje no leído)
    console.log('\n📝 Test de lógica de canales de notificación...');

    if (thread) {
      // Contar mensajes no leídos del inquilino en este thread
      const unreadFromInquilino = await prisma.message.count({
        where: {
          conversationId: thread.id,
          senderId: inquilinoProfile.id,
          isRead: false
        }
      });

      console.log(`   - Mensajes no leídos del inquilino: ${unreadFromInquilino}`);

      if (unreadFromInquilino === 0) {
        console.log('   ✅ Siguiente mensaje enviará: in_app + email');
      } else if (unreadFromInquilino === 1) {
        console.log('   ✅ Ya hay 1 mensaje no leído, siguiente enviará: solo in_app');
      } else {
        console.log(`   ✅ Ya hay ${unreadFromInquilino} mensajes no leídos, siguiente enviará: solo in_app`);
      }
    }

    // 6. Estadísticas generales
    console.log('\n📊 Estadísticas de notificaciones de mensajes:');

    const totalMessageNotifications = await prisma.notification.count({
      where: { type: 'NEW_MESSAGE' }
    });

    const unreadMessageNotifications = await prisma.notification.count({
      where: { type: 'NEW_MESSAGE', read: false }
    });

    const withEmailChannel = await prisma.notification.count({
      where: {
        type: 'NEW_MESSAGE',
        channels: { contains: 'email' }
      }
    });

    console.log(`   - Total notificaciones de mensajes: ${totalMessageNotifications}`);
    console.log(`   - No leídas: ${unreadMessageNotifications}`);
    console.log(`   - Con canal email: ${withEmailChannel}`);
    console.log(`   - Solo in-app: ${totalMessageNotifications - withEmailChannel}`);

    console.log('\n✅ Prueba completada!');
    console.log('\n💡 Para probar en vivo:');
    console.log('   1. Abrí dos navegadores (o incógnito)');
    console.log('   2. En uno inicia sesión como inquilino');
    console.log('   3. En otro como inmobiliaria');
    console.log('   4. Envía un mensaje desde el inquilino');
    console.log('   5. Verifica que la inmobiliaria reciba la notificación en la campana');
    console.log('   6. Verifica los logs de Vercel para confirmar envío de email (primer mensaje)');

  } catch (error) {
    console.error('\n❌ Error en la prueba:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar prueba
testMessageNotifications()
  .catch(console.error);
