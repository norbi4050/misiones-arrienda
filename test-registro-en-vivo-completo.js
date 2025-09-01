/**
 * 🧪 TESTING EN VIVO COMPLETO - REGISTRO DE USUARIOS
 * Prueba exhaustiva del sistema de registro con servidor corriendo
 */

const { exec } = require('child_process');
const fs = require('fs');

console.log('🚀 TESTING EN VIVO COMPLETO - REGISTRO DE USUARIOS');
console.log('=' .repeat(80));

// Datos de prueba
const testUsers = [
  {
    name: 'Juan Test Inquilino',
    email: 'juan.test@misionesarrienda.com',
    phone: '+54 376 123456',
    password: 'password123',
    userType: 'inquilino'
  },
  {
    name: 'Maria Propietaria',
    email: 'maria.duena@misionesarrienda.com',
    phone: '+54 376 654321',
    password: 'password456',
    userType: 'dueno_directo',
    propertyCount: 2
  },
  {
    name: 'Carlos Inmobiliario',
    email: 'carlos.inmobiliaria@misionesarrienda.com',
    phone: '+54 376 789012',
    password: 'password789',
    userType: 'inmobiliaria',
    companyName: 'Inmobiliaria Test SA',
    licenseNumber: 'IMB-12345'
  }
];

// Función para ejecutar comando y capturar resultado
function executeCommand(command) {
  return new Promise((resolve, reject) => {
    exec(command, { timeout: 30000 }, (error, stdout, stderr) => {
      if (error) {
        resolve({ success: false, error: error.message, stderr, stdout });
      } else {
        resolve({ success: true, stdout, stderr });
      }
    });
  });
}

// Función para probar registro de usuario
async function testUserRegistration(user, index) {
  console.log(`\n📝 PRUEBA ${index + 1}: Registrando ${user.name} (${user.userType})`);
  console.log('-'.repeat(60));
  
  const curlCommand = `curl -X POST http://localhost:3000/api/auth/register -H "Content-Type: application/json" -d "${JSON.stringify(user).replace(/"/g, '\\"')}" -w "\\nHTTP_STATUS:%{http_code}\\n" -s`;
  
  console.log(`🔄 Ejecutando: ${user.userType.toUpperCase()}`);
  
  const result = await executeCommand(curlCommand);
  
  if (result.success) {
    const output = result.stdout;
    const lines = output.split('\n');
    const statusLine = lines.find(line => line.startsWith('HTTP_STATUS:'));
    const httpStatus = statusLine ? statusLine.split(':')[1] : 'UNKNOWN';
    const responseBody = lines.filter(line => !line.startsWith('HTTP_STATUS:')).join('\n').trim();
    
    console.log(`📊 Status HTTP: ${httpStatus}`);
    
    if (httpStatus === '201') {
      console.log('✅ REGISTRO EXITOSO');
      try {
        const jsonResponse = JSON.parse(responseBody);
        console.log('📋 Respuesta:');
        console.log(`   - Usuario ID: ${jsonResponse.user?.id || 'N/A'}`);
        console.log(`   - Email: ${jsonResponse.user?.email || 'N/A'}`);
        console.log(`   - Tipo: ${jsonResponse.user?.userType || 'N/A'}`);
        console.log(`   - Email Verificado: ${jsonResponse.user?.emailVerified || 'N/A'}`);
        console.log(`   - Email Enviado: ${jsonResponse.emailSent || 'N/A'}`);
        return { success: true, status: httpStatus, data: jsonResponse };
      } catch (e) {
        console.log('⚠️  Respuesta no es JSON válido');
        console.log(`📄 Respuesta raw: ${responseBody}`);
        return { success: true, status: httpStatus, data: responseBody };
      }
    } else if (httpStatus === '409') {
      console.log('⚠️  USUARIO YA EXISTE');
      console.log(`📄 Respuesta: ${responseBody}`);
      return { success: false, status: httpStatus, error: 'Usuario ya existe', data: responseBody };
    } else if (httpStatus === '400') {
      console.log('❌ ERROR DE VALIDACIÓN');
      console.log(`📄 Respuesta: ${responseBody}`);
      return { success: false, status: httpStatus, error: 'Error de validación', data: responseBody };
    } else if (httpStatus === '500') {
      console.log('🔥 ERROR DE SERVIDOR');
      console.log(`📄 Respuesta: ${responseBody}`);
      return { success: false, status: httpStatus, error: 'Error de servidor', data: responseBody };
    } else {
      console.log(`❓ STATUS INESPERADO: ${httpStatus}`);
      console.log(`📄 Respuesta: ${responseBody}`);
      return { success: false, status: httpStatus, error: 'Status inesperado', data: responseBody };
    }
  } else {
    console.log('❌ ERROR EJECUTANDO CURL');
    console.log(`📄 Error: ${result.error}`);
    return { success: false, error: result.error };
  }
}

// Función principal de testing
async function runLiveTests() {
  console.log('\n🔍 1. VERIFICANDO CONECTIVIDAD DEL SERVIDOR...');
  
  // Verificar si el servidor está corriendo
  const healthCheck = await executeCommand('curl -s http://localhost:3000/api/health -w "HTTP_STATUS:%{http_code}"');
  
  if (!healthCheck.success || !healthCheck.stdout.includes('HTTP_STATUS:200')) {
    console.log('❌ SERVIDOR NO DISPONIBLE');
    console.log('🚨 INSTRUCCIONES:');
    console.log('   1. Abrir terminal en Backend/');
    console.log('   2. Ejecutar: npm run dev');
    console.log('   3. Esperar a que aparezca "Ready on http://localhost:3000"');
    console.log('   4. Volver a ejecutar este test');
    return;
  }
  
  console.log('✅ Servidor disponible en http://localhost:3000');
  
  console.log('\n🧪 2. EJECUTANDO PRUEBAS DE REGISTRO...');
  
  const results = [];
  
  for (let i = 0; i < testUsers.length; i++) {
    const result = await testUserRegistration(testUsers[i], i);
    results.push({
      user: testUsers[i],
      result: result
    });
    
    // Pausa entre pruebas
    if (i < testUsers.length - 1) {
      console.log('\n⏳ Esperando 2 segundos antes de la siguiente prueba...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  console.log('\n📊 3. RESUMEN DE RESULTADOS...');
  console.log('=' .repeat(80));
  
  let successCount = 0;
  let errorCount = 0;
  let duplicateCount = 0;
  
  results.forEach((test, index) => {
    const { user, result } = test;
    console.log(`\n${index + 1}. ${user.name} (${user.userType}):`);
    
    if (result.success && result.status === '201') {
      console.log('   ✅ REGISTRO EXITOSO');
      successCount++;
    } else if (result.status === '409') {
      console.log('   ⚠️  USUARIO YA EXISTE');
      duplicateCount++;
    } else {
      console.log(`   ❌ ERROR: ${result.error || 'Desconocido'}`);
      errorCount++;
    }
  });
  
  console.log('\n📈 ESTADÍSTICAS FINALES:');
  console.log(`   ✅ Registros exitosos: ${successCount}`);
  console.log(`   ⚠️  Usuarios duplicados: ${duplicateCount}`);
  console.log(`   ❌ Errores: ${errorCount}`);
  console.log(`   📊 Total pruebas: ${results.length}`);
  
  // Generar reporte detallado
  const report = {
    timestamp: new Date().toISOString(),
    serverStatus: 'available',
    totalTests: results.length,
    successfulRegistrations: successCount,
    duplicateUsers: duplicateCount,
    errors: errorCount,
    testResults: results.map(test => ({
      user: {
        name: test.user.name,
        email: test.user.email,
        userType: test.user.userType
      },
      result: {
        success: test.result.success,
        status: test.result.status,
        error: test.result.error
      }
    }))
  };
  
  try {
    fs.writeFileSync('REPORTE-TESTING-EN-VIVO-REGISTRO.json', JSON.stringify(report, null, 2));
    console.log('\n📄 Reporte detallado guardado en: REPORTE-TESTING-EN-VIVO-REGISTRO.json');
  } catch (error) {
    console.log(`\n⚠️  No se pudo guardar el reporte: ${error.message}`);
  }
  
  console.log('\n🎯 4. CONCLUSIONES Y PRÓXIMOS PASOS...');
  console.log('=' .repeat(80));
  
  if (successCount > 0) {
    console.log('🎉 ¡EL REGISTRO ESTÁ FUNCIONANDO!');
    console.log('✅ Se registraron usuarios exitosamente');
    console.log('📋 Verificar en Supabase Dashboard:');
    console.log('   - Authentication > Users');
    console.log('   - Table Editor > users');
  } else if (duplicateCount === results.length) {
    console.log('⚠️  TODOS LOS USUARIOS YA EXISTEN');
    console.log('💡 Esto indica que el registro funcionó anteriormente');
    console.log('🔄 Para probar nuevamente, usar emails diferentes');
  } else {
    console.log('🔥 PROBLEMAS DETECTADOS EN EL REGISTRO');
    console.log('🔍 Revisar:');
    console.log('   - Variables de entorno en Backend/.env.local');
    console.log('   - Conectividad con Supabase');
    console.log('   - Logs del servidor (terminal donde corre npm run dev)');
    console.log('   - Configuración de la tabla users en Supabase');
  }
  
  console.log('\n🏁 TESTING EN VIVO COMPLETADO');
  console.log('=' .repeat(80));
}

// Ejecutar testing
runLiveTests().catch(error => {
  console.error('💥 Error fatal en testing:', error);
});
