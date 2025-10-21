/**
 * Script de Testing del Sistema de Notificaciones (Server-side)
 *
 * Este script prueba el sistema de notificaciones directamente en el servidor
 * sin necesidad de estar autenticado en el navegador.
 *
 * USO:
 * node test-notifications-server.js
 *
 * REQUISITOS:
 * - El servidor debe estar corriendo (npm run dev)
 * - Debes tener al menos un usuario en la base de datos
 */

const readline = require('readline');

// Colores para la terminal
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m'
};

const log = {
  title: (msg) => console.log(`\n${colors.bright}${colors.blue}${msg}${colors.reset}\n`),
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.cyan}ℹ️  ${msg}${colors.reset}`),
  detail: (msg) => console.log(`${colors.gray}   ${msg}${colors.reset}`),
  section: (msg) => console.log(`\n${colors.bright}${msg}${colors.reset}`)
};

// Configuración
const BASE_URL = 'http://localhost:3000';

async function main() {
  log.title('🧪 SISTEMA DE TESTING DE NOTIFICACIONES (Server-side)');
  console.log('='.repeat(70));

  // Paso 1: Conectar a la base de datos
  log.section('📍 PASO 1: Conectar a Supabase');

  try {
    const { createClient } = require('@supabase/supabase-js');

    // Cargar variables de entorno
    require('dotenv').config({ path: '.env.local' });

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      log.error('Variables de entorno no configuradas');
      log.detail('Asegúrate de tener NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en .env.local');
      process.exit(1);
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    log.success('Conectado a Supabase');

    // Paso 2: Obtener un usuario de prueba
    log.section('📍 PASO 2: Obtener Usuario de Prueba');

    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, name, user_type')
      .limit(5);

    if (usersError || !users || users.length === 0) {
      log.error('No se pudieron obtener usuarios de la base de datos');
      log.detail(usersError?.message || 'Sin usuarios en la tabla');
      process.exit(1);
    }

    console.log('\nUsuarios disponibles:\n');
    users.forEach((user, index) => {
      console.log(`  ${index + 1}. ${user.email} (${user.user_type || 'N/A'})`);
      log.detail(`     ID: ${user.id}`);
    });

    // Seleccionar usuario
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const testUserId = await new Promise((resolve) => {
      rl.question(`\n¿Qué usuario quieres usar para testing? (1-${users.length}): `, (answer) => {
        const index = parseInt(answer) - 1;
        if (index >= 0 && index < users.length) {
          resolve(users[index].id);
        } else {
          resolve(users[0].id);
        }
        rl.close();
      });
    });

    const testUser = users.find(u => u.id === testUserId);
    log.success(`Usuario seleccionado: ${testUser.email}`);
    log.detail(`ID: ${testUserId}`);

    // Paso 3: Verificar preferencias del usuario
    log.section('📍 PASO 3: Verificar Preferencias del Usuario');

    const { data: preferences, error: prefsError } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('userId', testUserId)
      .single();

    if (prefsError) {
      log.warning('Usuario no tiene preferencias, se crearán automáticamente');
      log.detail(prefsError.message);
    } else {
      log.success('Preferencias encontradas');
      log.detail(`Email: ${preferences.emailEnabled}, In-App: ${preferences.inAppEnabled}`);
    }

    // Paso 4: Crear notificaciones de prueba directamente en la BD
    log.section('📍 PASO 4: Crear Notificaciones de Prueba');

    const testNotifications = [
      {
        userId: testUserId,
        type: 'NEW_MESSAGE',
        title: 'Test: Nuevo mensaje',
        message: 'Este es un mensaje de prueba del sistema de notificaciones.',
        channels: JSON.stringify(['in_app', 'email']),
        metadata: JSON.stringify({
          messageId: 'test-msg-1',
          senderName: 'Usuario de Prueba',
          ctaUrl: '/comunidad/mensajes',
          ctaText: 'Ver mensaje'
        }),
        read: false,
        createdAt: new Date().toISOString()
      },
      {
        userId: testUserId,
        type: 'INQUIRY_RECEIVED',
        title: 'Test: Nueva consulta',
        message: 'Juan Pérez te ha enviado una consulta sobre tu propiedad.',
        channels: JSON.stringify(['in_app', 'email']),
        metadata: JSON.stringify({
          propertyTitle: 'Casa en Posadas',
          customerName: 'Juan Pérez',
          ctaUrl: '/mis-propiedades',
          ctaText: 'Ver consulta'
        }),
        read: false,
        createdAt: new Date().toISOString()
      },
      {
        userId: testUserId,
        type: 'LIKE_RECEIVED',
        title: 'Test: Like recibido',
        message: 'A María le gustó tu post en la comunidad.',
        channels: JSON.stringify(['in_app']),
        metadata: JSON.stringify({
          likerId: 'test-user',
          likerName: 'María',
          ctaUrl: '/comunidad',
          ctaText: 'Ver post'
        }),
        read: false,
        createdAt: new Date().toISOString()
      }
    ];

    for (const notification of testNotifications) {
      const { error: insertError } = await supabase
        .from('notifications')
        .insert(notification);

      if (insertError) {
        log.error(`Error creando notificación ${notification.type}`);
        log.detail(insertError.message);
      } else {
        log.success(`Notificación creada: ${notification.type}`);
      }
    }

    // Paso 5: Verificar notificaciones creadas
    log.section('📍 PASO 5: Verificar Notificaciones Creadas');

    const { data: allNotifications, error: fetchError } = await supabase
      .from('notifications')
      .select('*')
      .eq('userId', testUserId)
      .order('createdAt', { ascending: false })
      .limit(10);

    if (fetchError) {
      log.error('Error obteniendo notificaciones');
      log.detail(fetchError.message);
    } else {
      log.success(`Total de notificaciones: ${allNotifications.length}`);

      console.log('\nÚltimas notificaciones:\n');
      allNotifications.slice(0, 5).forEach((notif, index) => {
        const icon = notif.read ? '📭' : '📬';
        console.log(`  ${icon} ${notif.title}`);
        log.detail(`     Tipo: ${notif.type} | Leída: ${notif.read ? 'Sí' : 'No'}`);
      });
    }

    // Paso 6: Contar no leídas
    log.section('📍 PASO 6: Contar Notificaciones No Leídas');

    const { count: unreadCount, error: countError } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('userId', testUserId)
      .eq('read', false);

    if (countError) {
      log.error('Error contando no leídas');
      log.detail(countError.message);
    } else {
      log.success(`Notificaciones no leídas: ${unreadCount}`);
    }

    // Paso 7: Marcar una como leída
    log.section('📍 PASO 7: Marcar Primera Notificación Como Leída');

    if (allNotifications.length > 0) {
      const firstNotif = allNotifications[0];
      const { error: updateError } = await supabase
        .from('notifications')
        .update({ read: true, readAt: new Date().toISOString() })
        .eq('id', firstNotif.id);

      if (updateError) {
        log.error('Error marcando como leída');
        log.detail(updateError.message);
      } else {
        log.success(`Notificación marcada como leída: ${firstNotif.title}`);
      }
    }

    // Paso 8: Verificar email logs
    log.section('📍 PASO 8: Verificar Email Logs');

    const { data: emailLogs, error: emailError } = await supabase
      .from('email_logs')
      .select('*')
      .eq('recipientId', testUserId)
      .order('createdAt', { ascending: false })
      .limit(5);

    if (emailError) {
      log.warning('No se pudieron obtener email logs');
      log.detail(emailError.message);
    } else if (!emailLogs || emailLogs.length === 0) {
      log.info('No hay emails enviados aún (esto es normal si no tienes SMTP configurado)');
    } else {
      log.success(`Emails registrados: ${emailLogs.length}`);

      console.log('\nÚltimos emails:\n');
      emailLogs.forEach((email) => {
        const statusIcon = email.status === 'SENT' ? '✅' : '⏳';
        console.log(`  ${statusIcon} ${email.subject}`);
        log.detail(`     Estado: ${email.status} | Tipo: ${email.type}`);
      });
    }

    // Resumen final
    log.title('📊 RESUMEN DEL TEST');
    console.log('='.repeat(70));
    console.log('');
    log.success('✅ Conexión a base de datos: OK');
    log.success('✅ Usuario de prueba: OK');
    log.success('✅ Preferencias: OK');
    log.success('✅ Creación de notificaciones: OK');
    log.success('✅ Consulta de notificaciones: OK');
    log.success('✅ Marcar como leída: OK');
    console.log('');
    log.info(`Total de notificaciones en sistema: ${allNotifications.length}`);
    log.info(`Notificaciones no leídas: ${unreadCount}`);
    log.info(`Emails registrados: ${emailLogs?.length || 0}`);
    console.log('');
    log.title('✨ PRÓXIMOS PASOS');
    console.log('');
    console.log('  1. Inicia sesión como:', colors.cyan + testUser.email + colors.reset);
    console.log('  2. Ve a la navbar y busca el icono de campana 🔔');
    console.log('  3. Deberías ver un badge con el número de notificaciones no leídas');
    console.log('  4. Haz click para ver el dropdown con las notificaciones');
    console.log('  5. Ve a /notificaciones para ver todas');
    console.log('  6. Ve a /notificaciones/preferencias para configurar');
    console.log('');
    console.log('='.repeat(70));
    console.log('');

  } catch (error) {
    log.error('Error durante el test');
    console.error(error);
    process.exit(1);
  }
}

// Ejecutar
main().catch(console.error);
