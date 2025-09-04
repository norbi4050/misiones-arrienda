const https = require('https');

// =====================================================
// 🧪 TESTING POST-SOLUCIÓN PROFILES TABLE
// =====================================================
// 
// Este script verifica que el error de registro esté solucionado
// después de aplicar la corrección a la tabla profiles
// =====================================================

console.log('🚀 INICIANDO TESTING POST-SOLUCIÓN PROFILES TABLE...\n');

// Configuración del test
const testConfig = {
  baseUrl: 'https://misiones-arrienda.vercel.app',
  timeout: 30000,
  testUser: {
    name: 'Usuario Test Profiles',
    email: `test-profiles-${Date.now()}@example.com`,
    phone: '+54911234567',
    password: 'TestPassword123!',
    userType: 'inquilino'
  }
};

// Función para hacer peticiones HTTP
function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: jsonData
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: data
          });
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.setTimeout(testConfig.timeout, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    if (postData) {
      req.write(postData);
    }
    
    req.end();
  });
}

// Test 1: Verificar que el endpoint de registro responde
async function testEndpointAvailability() {
  console.log('📡 Test 1: Verificando disponibilidad del endpoint...');
  
  try {
    const options = {
      hostname: 'misiones-arrienda.vercel.app',
      port: 443,
      path: '/api/auth/register',
      method: 'OPTIONS',
      headers: {
        'Content-Type': 'application/json',
      }
    };
    
    const response = await makeRequest(options);
    
    if (response.statusCode === 200 || response.statusCode === 405) {
      console.log('✅ Endpoint disponible');
      return true;
    } else {
      console.log(`❌ Endpoint no disponible (Status: ${response.statusCode})`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Error verificando endpoint: ${error.message}`);
    return false;
  }
}

// Test 2: Intentar registro de usuario
async function testUserRegistration() {
  console.log('\n👤 Test 2: Probando registro de usuario...');
  
  try {
    const postData = JSON.stringify(testConfig.testUser);
    
    const options = {
      hostname: 'misiones-arrienda.vercel.app',
      port: 443,
      path: '/api/auth/register',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    
    console.log(`📤 Enviando datos de registro para: ${testConfig.testUser.email}`);
    
    const response = await makeRequest(options, postData);
    
    console.log(`📥 Respuesta recibida (Status: ${response.statusCode})`);
    
    if (response.statusCode === 201) {
      console.log('✅ REGISTRO EXITOSO - El error de profiles table está SOLUCIONADO');
      console.log('📋 Datos del usuario creado:');
      if (response.data && response.data.user) {
        console.log(`   - ID: ${response.data.user.id}`);
        console.log(`   - Nombre: ${response.data.user.name}`);
        console.log(`   - Email: ${response.data.user.email}`);
        console.log(`   - Tipo: ${response.data.user.userType}`);
      }
      return { success: true, data: response.data };
    } else if (response.statusCode === 409) {
      console.log('⚠️  Usuario ya existe (esto es normal si ya se ejecutó el test)');
      return { success: true, message: 'Usuario ya existe' };
    } else if (response.statusCode === 500) {
      console.log('❌ ERROR 500 - Posible problema con la base de datos');
      console.log('📋 Detalles del error:');
      console.log(JSON.stringify(response.data, null, 2));
      
      // Verificar si es el error específico de profiles table
      if (response.data && response.data.error && 
          response.data.error.includes('column "email" of relation "profiles" does not exist')) {
        console.log('🚨 ERROR ESPECÍFICO: La tabla profiles aún no tiene la columna email');
        console.log('💡 SOLUCIÓN: Ejecutar el script SQL nuevamente');
        return { success: false, error: 'profiles_table_error' };
      } else {
        console.log('🔍 Error diferente al de profiles table');
        return { success: false, error: 'other_database_error', details: response.data };
      }
    } else {
      console.log(`❌ Error inesperado (Status: ${response.statusCode})`);
      console.log('📋 Respuesta:');
      console.log(JSON.stringify(response.data, null, 2));
      return { success: false, error: 'unexpected_error', details: response.data };
    }
  } catch (error) {
    console.log(`❌ Error en la petición: ${error.message}`);
    return { success: false, error: 'request_error', message: error.message };
  }
}

// Test 3: Verificar que no hay errores de profiles table
async function testProfilesTableError() {
  console.log('\n🔍 Test 3: Verificando errores específicos de profiles table...');
  
  // Intentar con un email diferente para evitar conflictos
  const testUser2 = {
    ...testConfig.testUser,
    email: `test-profiles-verification-${Date.now()}@example.com`
  };
  
  try {
    const postData = JSON.stringify(testUser2);
    
    const options = {
      hostname: 'misiones-arrienda.vercel.app',
      port: 443,
      path: '/api/auth/register',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    
    const response = await makeRequest(options, postData);
    
    if (response.statusCode === 201) {
      console.log('✅ CONFIRMADO: El error de profiles table está completamente solucionado');
      return { success: true, confirmed: true };
    } else if (response.statusCode === 500 && response.data && response.data.error) {
      const errorMessage = JSON.stringify(response.data.error).toLowerCase();
      
      if (errorMessage.includes('column "email" of relation "profiles" does not exist')) {
        console.log('❌ CONFIRMADO: El error de profiles table AÚN PERSISTE');
        console.log('💡 La solución SQL no se aplicó correctamente o hay un problema adicional');
        return { success: false, confirmed: false, error: 'profiles_table_still_missing' };
      } else {
        console.log('⚠️  Hay un error diferente, pero NO es el de profiles table');
        console.log('📋 Error encontrado:', response.data.error);
        return { success: false, confirmed: true, error: 'different_error' };
      }
    } else {
      console.log(`ℹ️  Respuesta no concluyente (Status: ${response.statusCode})`);
      return { success: false, confirmed: null, error: 'inconclusive' };
    }
  } catch (error) {
    console.log(`❌ Error en verificación: ${error.message}`);
    return { success: false, error: 'verification_error' };
  }
}

// Función principal
async function runTests() {
  console.log('🎯 OBJETIVO: Verificar que el error "column email of relation profiles does not exist" esté solucionado\n');
  
  const results = {
    endpointAvailable: false,
    registrationWorking: false,
    profilesTableFixed: false,
    errors: []
  };
  
  try {
    // Test 1: Endpoint disponible
    results.endpointAvailable = await testEndpointAvailability();
    
    if (!results.endpointAvailable) {
      console.log('\n❌ No se puede continuar - Endpoint no disponible');
      return results;
    }
    
    // Test 2: Registro de usuario
    const registrationResult = await testUserRegistration();
    results.registrationWorking = registrationResult.success;
    
    if (!registrationResult.success) {
      results.errors.push(registrationResult);
    }
    
    // Test 3: Verificación específica
    const verificationResult = await testProfilesTableError();
    results.profilesTableFixed = verificationResult.confirmed;
    
    if (!verificationResult.success) {
      results.errors.push(verificationResult);
    }
    
  } catch (error) {
    console.log(`❌ Error general en testing: ${error.message}`);
    results.errors.push({ error: 'general_error', message: error.message });
  }
  
  // Reporte final
  console.log('\n' + '='.repeat(60));
  console.log('📊 REPORTE FINAL DE TESTING');
  console.log('='.repeat(60));
  
  console.log(`🌐 Endpoint disponible: ${results.endpointAvailable ? '✅ SÍ' : '❌ NO'}`);
  console.log(`👤 Registro funcionando: ${results.registrationWorking ? '✅ SÍ' : '❌ NO'}`);
  console.log(`🔧 Profiles table corregida: ${results.profilesTableFixed ? '✅ SÍ' : '❌ NO'}`);
  
  if (results.profilesTableFixed && results.registrationWorking) {
    console.log('\n🎉 ¡ÉXITO TOTAL! El error de profiles table está completamente solucionado');
    console.log('✅ Los usuarios pueden registrarse sin problemas');
  } else if (results.errors.length > 0) {
    console.log('\n⚠️  Se encontraron algunos problemas:');
    results.errors.forEach((error, index) => {
      console.log(`   ${index + 1}. ${error.error}: ${error.message || 'Ver detalles arriba'}`);
    });
  }
  
  console.log('\n📝 PRÓXIMOS PASOS:');
  if (results.profilesTableFixed) {
    console.log('   ✅ La solución SQL funcionó correctamente');
    console.log('   ✅ El sistema de registro está operativo');
    console.log('   🎯 Puedes proceder con el desarrollo normal');
  } else {
    console.log('   🔄 Revisar la implementación del script SQL');
    console.log('   🔍 Verificar que todas las columnas estén creadas');
    console.log('   🛠️  Posiblemente ejecutar el script SQL nuevamente');
  }
  
  console.log('\n' + '='.repeat(60));
  
  return results;
}

// Ejecutar tests
runTests().catch(error => {
  console.error('💥 Error fatal en testing:', error);
  process.exit(1);
});
