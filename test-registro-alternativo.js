/**
 * 🧪 TESTING ALTERNATIVO - REGISTRO DE USUARIOS
 * Script de backup para testing del registro con manejo de errores mejorado
 */

const { exec } = require('child_process');
const fs = require('fs');

console.log('🚀 TESTING ALTERNATIVO - REGISTRO DE USUARIOS');
console.log('=' .repeat(80));

// Función para ejecutar comando con timeout más corto
function executeCommandQuick(command, timeout = 10000) {
  return new Promise((resolve) => {
    const process = exec(command, { timeout }, (error, stdout, stderr) => {
      if (error) {
        resolve({ 
          success: false, 
          error: error.message, 
          stderr, 
          stdout,
          timeout: error.code === 'ETIMEDOUT' || error.killed
        });
      } else {
        resolve({ success: true, stdout, stderr });
      }
    });
    
    // Timeout manual adicional
    setTimeout(() => {
      process.kill();
      resolve({ 
        success: false, 
        error: 'Timeout manual', 
        timeout: true 
      });
    }, timeout);
  });
}

// Función para verificar servidor
async function checkServer() {
  console.log('\n🔍 VERIFICANDO SERVIDOR...');
  
  // Intentar conectar al servidor
  const healthCheck = await executeCommandQuick('curl -s http://localhost:3000 -m 5', 5000);
  
  if (healthCheck.success) {
    console.log('✅ Servidor responde en localhost:3000');
    return true;
  } else if (healthCheck.timeout) {
    console.log('⏰ Timeout conectando al servidor');
    return false;
  } else {
    console.log('❌ Servidor no disponible');
    console.log(`📄 Error: ${healthCheck.error}`);
    return false;
  }
}

// Función para probar un registro específico
async function testSingleRegistration() {
  console.log('\n📝 PROBANDO REGISTRO SIMPLE...');
  
  const testUser = {
    name: 'Test User',
    email: 'test@example.com',
    phone: '+54 376 123456',
    password: 'password123',
    userType: 'inquilino'
  };
  
  const curlCommand = `curl -X POST http://localhost:3000/api/auth/register -H "Content-Type: application/json" -d '${JSON.stringify(testUser)}' -w "STATUS:%{http_code}" -s -m 10`;
  
  console.log('🔄 Enviando petición de registro...');
  
  const result = await executeCommandQuick(curlCommand, 10000);
  
  if (result.success) {
    const output = result.stdout;
    console.log('📊 Respuesta recibida:');
    console.log(output);
    
    if (output.includes('STATUS:201')) {
      console.log('✅ REGISTRO EXITOSO (Status 201)');
      return { success: true, status: 201 };
    } else if (output.includes('STATUS:409')) {
      console.log('⚠️  USUARIO YA EXISTE (Status 409)');
      return { success: false, status: 409, reason: 'Usuario duplicado' };
    } else if (output.includes('STATUS:400')) {
      console.log('❌ ERROR DE VALIDACIÓN (Status 400)');
      return { success: false, status: 400, reason: 'Error de validación' };
    } else if (output.includes('STATUS:500')) {
      console.log('🔥 ERROR DE SERVIDOR (Status 500)');
      return { success: false, status: 500, reason: 'Error de servidor' };
    } else {
      console.log('❓ RESPUESTA INESPERADA');
      return { success: false, status: 'unknown', reason: 'Respuesta inesperada' };
    }
  } else if (result.timeout) {
    console.log('⏰ TIMEOUT EN LA PETICIÓN');
    return { success: false, reason: 'Timeout' };
  } else {
    console.log('❌ ERROR EN LA PETICIÓN');
    console.log(`📄 Error: ${result.error}`);
    return { success: false, reason: result.error };
  }
}

// Función principal
async function runAlternativeTest() {
  console.log('\n🎯 INICIANDO TESTING ALTERNATIVO...');
  
  // 1. Verificar servidor
  const serverAvailable = await checkServer();
  
  if (!serverAvailable) {
    console.log('\n🚨 SERVIDOR NO DISPONIBLE');
    console.log('📋 INSTRUCCIONES:');
    console.log('   1. Abrir terminal en Backend/');
    console.log('   2. Ejecutar: npm run dev');
    console.log('   3. Esperar mensaje "Ready on http://localhost:3000"');
    console.log('   4. Volver a ejecutar este test');
    
    // Generar reporte de servidor no disponible
    const report = {
      timestamp: new Date().toISOString(),
      serverStatus: 'unavailable',
      testCompleted: false,
      instructions: [
        'Iniciar servidor con npm run dev en Backend/',
        'Verificar que aparezca "Ready on http://localhost:3000"',
        'Ejecutar nuevamente el test'
      ]
    };
    
    try {
      fs.writeFileSync('REPORTE-SERVIDOR-NO-DISPONIBLE.json', JSON.stringify(report, null, 2));
      console.log('\n📄 Reporte guardado en: REPORTE-SERVIDOR-NO-DISPONIBLE.json');
    } catch (error) {
      console.log(`\n⚠️  No se pudo guardar el reporte: ${error.message}`);
    }
    
    return;
  }
  
  // 2. Probar registro
  const registrationResult = await testSingleRegistration();
  
  // 3. Generar reporte
  console.log('\n📊 GENERANDO REPORTE...');
  
  const report = {
    timestamp: new Date().toISOString(),
    serverStatus: 'available',
    testCompleted: true,
    registrationTest: registrationResult,
    conclusion: registrationResult.success ? 
      'El sistema de registro está funcionando correctamente' :
      `Problema detectado: ${registrationResult.reason}`,
    nextSteps: registrationResult.success ? [
      'El registro funciona correctamente',
      'Verificar en Supabase Dashboard si el usuario se creó',
      'Probar con diferentes tipos de usuario'
    ] : [
      'Revisar logs del servidor',
      'Verificar variables de entorno',
      'Comprobar conectividad con Supabase',
      'Revisar configuración de la base de datos'
    ]
  };
  
  try {
    fs.writeFileSync('REPORTE-TESTING-ALTERNATIVO.json', JSON.stringify(report, null, 2));
    console.log('📄 Reporte guardado en: REPORTE-TESTING-ALTERNATIVO.json');
  } catch (error) {
    console.log(`⚠️  No se pudo guardar el reporte: ${error.message}`);
  }
  
  // 4. Mostrar conclusiones
  console.log('\n🎉 CONCLUSIONES:');
  console.log('=' .repeat(80));
  
  if (registrationResult.success) {
    console.log('✅ ¡EL REGISTRO ESTÁ FUNCIONANDO!');
    console.log('🎯 El sistema puede registrar usuarios correctamente');
    console.log('📋 Verificar en Supabase:');
    console.log('   - Authentication > Users');
    console.log('   - Table Editor > users');
  } else {
    console.log('🔥 PROBLEMA DETECTADO EN EL REGISTRO');
    console.log(`❌ Razón: ${registrationResult.reason}`);
    
    if (registrationResult.status === 409) {
      console.log('💡 El usuario ya existe - esto indica que el registro funcionó antes');
      console.log('🔄 Usar un email diferente para probar nuevamente');
    } else if (registrationResult.status === 500) {
      console.log('🔍 Revisar:');
      console.log('   - Variables de entorno en Backend/.env.local');
      console.log('   - Conectividad con Supabase');
      console.log('   - Logs del servidor');
    } else if (registrationResult.status === 400) {
      console.log('🔍 Revisar:');
      console.log('   - Formato de los datos enviados');
      console.log('   - Validaciones en el código');
    }
  }
  
  console.log('\n🏁 TESTING ALTERNATIVO COMPLETADO');
  console.log('=' .repeat(80));
}

// Ejecutar testing
runAlternativeTest().catch(error => {
  console.error('💥 Error fatal en testing alternativo:', error);
});
