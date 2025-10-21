/**
 * Script maestro: Ejecutar todas las pruebas de notificaciones
 *
 * Este script ejecuta todos los tests de notificaciones en secuencia
 */

const { spawn } = require('child_process');
const path = require('path');

const tests = [
  {
    name: 'Envío de Notificaciones',
    file: 'test-notifications-send.js',
    description: 'Prueba la creación de notificaciones en la base de datos'
  },
  {
    name: 'API de Notificaciones',
    file: 'test-notifications-api.js',
    description: 'Prueba todos los endpoints de la API'
  },
  {
    name: 'Notificaciones de Mensajes',
    file: 'test-notifications-messages.js',
    description: 'Prueba las notificaciones automáticas de mensajes'
  }
];

async function runTest(test) {
  return new Promise((resolve, reject) => {
    console.log('\n' + '='.repeat(80));
    console.log(`🧪 Ejecutando: ${test.name}`);
    console.log(`📝 Descripción: ${test.description}`);
    console.log('='.repeat(80) + '\n');

    const child = spawn('node', [path.join(__dirname, test.file)], {
      stdio: 'inherit',
      shell: true
    });

    child.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Test "${test.name}" falló con código ${code}`));
      } else {
        resolve();
      }
    });

    child.on('error', (error) => {
      reject(error);
    });
  });
}

async function runAllTests() {
  console.log('\n');
  console.log('╔' + '═'.repeat(78) + '╗');
  console.log('║' + ' '.repeat(78) + '║');
  console.log('║' + '  🧪 SUITE DE PRUEBAS: SISTEMA DE NOTIFICACIONES'.padEnd(78) + '║');
  console.log('║' + ' '.repeat(78) + '║');
  console.log('╚' + '═'.repeat(78) + '╝');
  console.log('');
  console.log(`📋 Total de pruebas a ejecutar: ${tests.length}`);
  console.log('');

  const startTime = Date.now();
  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      await runTest(test);
      passed++;
      console.log(`\n✅ "${test.name}" completado exitosamente\n`);
    } catch (error) {
      failed++;
      console.error(`\n❌ "${test.name}" falló:`, error.message, '\n');
    }
  }

  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);

  console.log('\n' + '═'.repeat(80));
  console.log('📊 RESUMEN DE PRUEBAS');
  console.log('═'.repeat(80));
  console.log(`✅ Pasadas: ${passed}/${tests.length}`);
  console.log(`❌ Fallidas: ${failed}/${tests.length}`);
  console.log(`⏱️  Duración total: ${duration}s`);
  console.log('═'.repeat(80) + '\n');

  if (failed === 0) {
    console.log('🎉 ¡Todas las pruebas pasaron exitosamente!\n');
    console.log('💡 Próximos pasos:');
    console.log('   1. Verificar notificaciones en el frontend (http://localhost:3000)');
    console.log('   2. Probar envío de mensajes entre usuarios');
    console.log('   3. Verificar que las notificaciones aparecen en la campana');
    console.log('   4. Confirmar que las notificaciones leídas desaparecen');
    console.log('   5. Revisar logs de SendGrid para emails enviados\n');
  } else {
    console.log('⚠️  Algunas pruebas fallaron. Revisa los errores arriba.\n');
    process.exit(1);
  }
}

// Ejecutar todas las pruebas
runAllTests().catch((error) => {
  console.error('❌ Error fatal ejecutando las pruebas:', error);
  process.exit(1);
});
