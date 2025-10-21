/**
 * Script de Testing del Sistema de Notificaciones
 *
 * IMPORTANTE: Debes estar autenticado en la aplicación antes de ejecutar este script
 *
 * USO:
 * 1. Inicia sesión en http://localhost:3000
 * 2. Abre la consola del navegador (F12)
 * 3. Copia y pega este script completo
 * 4. Presiona Enter
 *
 * El script probará:
 * - Envío de notificaciones de prueba
 * - Obtención de notificaciones
 * - Contador de no leídas
 * - Marcar como leída
 * - Marcar todas como leídas
 * - Obtener y actualizar preferencias
 */

(async function testNotificationSystem() {
  console.log('🧪 INICIANDO TESTS DEL SISTEMA DE NOTIFICACIONES\n');
  console.log('=' .repeat(60));

  const results = {
    passed: 0,
    failed: 0,
    tests: []
  };

  // Helper para logging
  const logTest = (name, passed, details = '') => {
    const status = passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} - ${name}`);
    if (details) console.log(`   ${details}`);
    results.tests.push({ name, passed, details });
    if (passed) results.passed++;
    else results.failed++;
  };

  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  // ============================================================
  // TEST 1: Verificar endpoints están disponibles
  // ============================================================
  console.log('\n📍 TEST 1: Verificar Endpoints\n');

  try {
    const res = await fetch('/api/test/notification');
    const data = await res.json();
    logTest('Endpoint de prueba disponible', res.ok, `Status: ${res.status}`);
  } catch (error) {
    logTest('Endpoint de prueba disponible', false, error.message);
  }

  // ============================================================
  // TEST 2: Enviar notificaciones de cada tipo
  // ============================================================
  console.log('\n📍 TEST 2: Enviar Notificaciones de Prueba\n');

  const notificationTypes = [
    'NEW_MESSAGE',
    'INQUIRY_RECEIVED',
    'PLAN_EXPIRING',
    'LIKE_RECEIVED',
    'FAVORITE_PROPERTY_UPDATED'
  ];

  for (const type of notificationTypes) {
    try {
      const res = await fetch('/api/test/notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type })
      });
      const data = await res.json();
      logTest(`Enviar ${type}`, data.success, data.message);
      await sleep(500); // Esperar 500ms entre notificaciones
    } catch (error) {
      logTest(`Enviar ${type}`, false, error.message);
    }
  }

  // Esperar 2 segundos para que se procesen las notificaciones
  console.log('\n⏳ Esperando 2 segundos para procesar notificaciones...\n');
  await sleep(2000);

  // ============================================================
  // TEST 3: Obtener notificaciones
  // ============================================================
  console.log('\n📍 TEST 3: Obtener Notificaciones\n');

  let allNotifications = [];
  try {
    const res = await fetch('/api/notifications?limit=50');
    const data = await res.json();
    allNotifications = data.notifications || [];
    logTest('Obtener todas las notificaciones', res.ok && data.success,
      `Obtenidas: ${allNotifications.length} notificaciones`);
  } catch (error) {
    logTest('Obtener todas las notificaciones', false, error.message);
  }

  // ============================================================
  // TEST 4: Obtener solo no leídas
  // ============================================================
  console.log('\n📍 TEST 4: Filtrar No Leídas\n');

  let unreadNotifications = [];
  try {
    const res = await fetch('/api/notifications?unreadOnly=true&limit=50');
    const data = await res.json();
    unreadNotifications = data.notifications || [];
    logTest('Obtener notificaciones no leídas', res.ok && data.success,
      `No leídas: ${unreadNotifications.length} notificaciones`);
  } catch (error) {
    logTest('Obtener notificaciones no leídas', false, error.message);
  }

  // ============================================================
  // TEST 5: Contador de no leídas
  // ============================================================
  console.log('\n📍 TEST 5: Contador de No Leídas\n');

  try {
    const res = await fetch('/api/notifications/unread-count');
    const data = await res.json();
    const expectedCount = unreadNotifications.length;
    const actualCount = data.count;
    logTest('Contador de no leídas',
      res.ok && data.success,
      `Contador: ${actualCount} (esperado: ${expectedCount})`);
  } catch (error) {
    logTest('Contador de no leídas', false, error.message);
  }

  // ============================================================
  // TEST 6: Marcar una notificación como leída
  // ============================================================
  console.log('\n📍 TEST 6: Marcar Como Leída\n');

  if (unreadNotifications.length > 0) {
    const testNotification = unreadNotifications[0];
    try {
      const res = await fetch(`/api/notifications/${testNotification.id}/read`, {
        method: 'PUT'
      });
      const data = await res.json();
      logTest('Marcar notificación como leída', res.ok && data.success,
        `ID: ${testNotification.id.substring(0, 8)}...`);

      // Verificar que el contador disminuyó
      await sleep(500);
      const countRes = await fetch('/api/notifications/unread-count');
      const countData = await countRes.json();
      logTest('Contador actualizó correctamente',
        countData.count === unreadNotifications.length - 1,
        `Nuevo contador: ${countData.count}`);
    } catch (error) {
      logTest('Marcar notificación como leída', false, error.message);
    }
  } else {
    logTest('Marcar notificación como leída', false, 'No hay notificaciones no leídas para probar');
  }

  // ============================================================
  // TEST 7: Marcar todas como leídas
  // ============================================================
  console.log('\n📍 TEST 7: Marcar Todas Como Leídas\n');

  try {
    const res = await fetch('/api/notifications/mark-all-read', {
      method: 'PUT'
    });
    const data = await res.json();
    logTest('Marcar todas como leídas', res.ok && data.success);

    // Verificar que el contador es 0
    await sleep(500);
    const countRes = await fetch('/api/notifications/unread-count');
    const countData = await countRes.json();
    logTest('Todas marcadas (contador = 0)', countData.count === 0,
      `Contador final: ${countData.count}`);
  } catch (error) {
    logTest('Marcar todas como leídas', false, error.message);
  }

  // ============================================================
  // TEST 8: Obtener preferencias
  // ============================================================
  console.log('\n📍 TEST 8: Obtener Preferencias\n');

  let preferences = null;
  try {
    const res = await fetch('/api/notifications/preferences');
    const data = await res.json();
    preferences = data.preferences;
    logTest('Obtener preferencias de usuario', res.ok && data.success,
      `Email: ${preferences?.emailEnabled}, In-App: ${preferences?.inAppEnabled}`);
  } catch (error) {
    logTest('Obtener preferencias de usuario', false, error.message);
  }

  // ============================================================
  // TEST 9: Actualizar preferencias
  // ============================================================
  console.log('\n📍 TEST 9: Actualizar Preferencias\n');

  if (preferences) {
    try {
      // Cambiar una preferencia
      const originalValue = preferences.newMessages;
      const newValue = !originalValue;

      const res = await fetch('/api/notifications/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newMessages: newValue
        })
      });
      const data = await res.json();

      logTest('Actualizar preferencias', res.ok && data.success,
        `newMessages: ${originalValue} → ${newValue}`);

      // Revertir el cambio
      await fetch('/api/notifications/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newMessages: originalValue
        })
      });
      logTest('Revertir preferencias', true, `Restaurado a: ${originalValue}`);
    } catch (error) {
      logTest('Actualizar preferencias', false, error.message);
    }
  } else {
    logTest('Actualizar preferencias', false, 'No se pudieron obtener preferencias');
  }

  // ============================================================
  // TEST 10: Verificar estructura de datos
  // ============================================================
  console.log('\n📍 TEST 10: Validar Estructura de Datos\n');

  if (allNotifications.length > 0) {
    const sample = allNotifications[0];
    const requiredFields = ['id', 'userId', 'type', 'title', 'message', 'createdAt', 'read'];
    const hasAllFields = requiredFields.every(field => sample.hasOwnProperty(field));

    logTest('Estructura de notificación válida', hasAllFields,
      `Campos presentes: ${Object.keys(sample).length}`);

    // Verificar que metadata está parseado
    const hasMetadata = sample.metadata && typeof sample.metadata === 'object';
    logTest('Metadata parseado correctamente', hasMetadata,
      hasMetadata ? `Tiene ctaUrl: ${!!sample.metadata.ctaUrl}` : 'No tiene metadata');

    // Verificar que channels está parseado
    const hasChannels = Array.isArray(sample.channels);
    logTest('Channels parseado correctamente', hasChannels,
      hasChannels ? `Canales: ${sample.channels.join(', ')}` : 'No tiene channels');
  } else {
    logTest('Validar estructura de datos', false, 'No hay notificaciones para validar');
  }

  // ============================================================
  // RESUMEN FINAL
  // ============================================================
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 RESUMEN DE TESTS\n');
  console.log(`Total de tests ejecutados: ${results.tests.length}`);
  console.log(`✅ Exitosos: ${results.passed}`);
  console.log(`❌ Fallidos: ${results.failed}`);
  console.log(`📈 Tasa de éxito: ${((results.passed / results.tests.length) * 100).toFixed(1)}%`);

  if (results.failed > 0) {
    console.log('\n⚠️  TESTS FALLIDOS:\n');
    results.tests
      .filter(t => !t.passed)
      .forEach(t => console.log(`  • ${t.name}: ${t.details}`));
  }

  console.log('\n' + '='.repeat(60));

  if (results.failed === 0) {
    console.log('\n🎉 ¡TODOS LOS TESTS PASARON EXITOSAMENTE!\n');
    console.log('El sistema de notificaciones está funcionando correctamente.');
  } else {
    console.log('\n⚠️  ALGUNOS TESTS FALLARON\n');
    console.log('Revisa los detalles arriba para más información.');
  }

  console.log('\n✨ Para verificar en la UI:');
  console.log('   1. Mira el icono de campana en la navbar (debería tener badge)');
  console.log('   2. Haz click en la campana para ver el dropdown');
  console.log('   3. Ve a /notificaciones para ver la página completa');
  console.log('   4. Ve a /notificaciones/preferencias para configurar\n');

  // Retornar resultados para inspección
  return results;
})();
