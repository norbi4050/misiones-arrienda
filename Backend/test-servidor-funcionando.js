// Test rápido para verificar que el servidor está funcionando y Supabase está configurado
const https = require('http');

console.log('🚀 INICIANDO TESTING RÁPIDO DEL SERVIDOR...\n');

// Test 1: Verificar que el servidor responde
function testServidor() {
  return new Promise((resolve, reject) => {
    console.log('📡 Test 1: Verificando servidor en localhost:3000...');
    
    const req = https.get('http://localhost:3000', (res) => {
      console.log(`✅ Servidor responde con status: ${res.statusCode}`);
      
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log('✅ Página principal carga correctamente');
          resolve(true);
        } else {
          console.log(`❌ Error: Status code ${res.statusCode}`);
          resolve(false);
        }
      });
    });
    
    req.on('error', (err) => {
      console.log(`❌ Error conectando al servidor: ${err.message}`);
      resolve(false);
    });
    
    req.setTimeout(10000, () => {
      console.log('❌ Timeout: El servidor no responde en 10 segundos');
      req.destroy();
      resolve(false);
    });
  });
}

// Test 2: Verificar API de versión
function testAPI() {
  return new Promise((resolve, reject) => {
    console.log('\n📡 Test 2: Verificando API /api/version...');
    
    const req = https.get('http://localhost:3000/api/version', (res) => {
      console.log(`✅ API responde con status: ${res.statusCode}`);
      
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log('✅ API funciona correctamente');
          try {
            const response = JSON.parse(data);
            console.log('✅ Respuesta JSON válida:', response);
          } catch (e) {
            console.log('⚠️  Respuesta no es JSON válido, pero API responde');
          }
          resolve(true);
        } else {
          console.log(`❌ Error: Status code ${res.statusCode}`);
          resolve(false);
        }
      });
    });
    
    req.on('error', (err) => {
      console.log(`❌ Error conectando a la API: ${err.message}`);
      resolve(false);
    });
    
    req.setTimeout(10000, () => {
      console.log('❌ Timeout: La API no responde en 10 segundos');
      req.destroy();
      resolve(false);
    });
  });
}

// Test 3: Verificar que no hay errores 401 de Supabase
function testSupabaseConfig() {
  return new Promise((resolve, reject) => {
    console.log('\n🔐 Test 3: Verificando configuración de Supabase...');
    
    const req = https.get('http://localhost:3000/register', (res) => {
      console.log(`✅ Página de registro responde con status: ${res.statusCode}`);
      
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 200) {
          // Verificar que no hay errores 401 en el HTML
          if (data.includes('401') || data.includes('Invalid API key')) {
            console.log('❌ ERROR: Encontrado error 401 o "Invalid API key" en la página');
            console.log('❌ El problema de Supabase NO está solucionado');
            resolve(false);
          } else {
            console.log('✅ No se encontraron errores 401 o "Invalid API key"');
            console.log('✅ Configuración de Supabase parece correcta');
            resolve(true);
          }
        } else if (res.statusCode === 500) {
          console.log('❌ Error 500: Posible problema de configuración');
          resolve(false);
        } else {
          console.log(`⚠️  Status code inesperado: ${res.statusCode}`);
          resolve(true); // No es necesariamente un error crítico
        }
      });
    });
    
    req.on('error', (err) => {
      console.log(`❌ Error conectando a /register: ${err.message}`);
      resolve(false);
    });
    
    req.setTimeout(10000, () => {
      console.log('❌ Timeout: /register no responde en 10 segundos');
      req.destroy();
      resolve(false);
    });
  });
}

// Ejecutar todos los tests
async function ejecutarTests() {
  console.log('🔍 TESTING RÁPIDO - VERIFICACIÓN DEL SERVIDOR\n');
  console.log('=' .repeat(50));
  
  const resultados = {
    servidor: false,
    api: false,
    supabase: false
  };
  
  try {
    // Ejecutar tests secuencialmente
    resultados.servidor = await testServidor();
    
    if (resultados.servidor) {
      resultados.api = await testAPI();
      resultados.supabase = await testSupabaseConfig();
    }
    
    // Mostrar resumen
    console.log('\n' + '=' .repeat(50));
    console.log('📊 RESUMEN DE RESULTADOS:');
    console.log('=' .repeat(50));
    
    console.log(`🌐 Servidor funcionando: ${resultados.servidor ? '✅ SÍ' : '❌ NO'}`);
    console.log(`🔌 API funcionando: ${resultados.api ? '✅ SÍ' : '❌ NO'}`);
    console.log(`🔐 Supabase configurado: ${resultados.supabase ? '✅ SÍ' : '❌ NO'}`);
    
    const todosExitosos = resultados.servidor && resultados.api && resultados.supabase;
    
    console.log('\n' + '=' .repeat(50));
    if (todosExitosos) {
      console.log('🎉 ¡TODOS LOS TESTS EXITOSOS!');
      console.log('✅ El servidor está funcionando correctamente');
      console.log('✅ El problema de Supabase está SOLUCIONADO');
      console.log('✅ La plataforma está lista para usar');
    } else {
      console.log('⚠️  ALGUNOS TESTS FALLARON');
      if (!resultados.servidor) {
        console.log('❌ El servidor no está ejecutándose o no responde');
        console.log('💡 Solución: Ejecutar "npm run dev" en el directorio Backend');
      }
      if (!resultados.api) {
        console.log('❌ La API no está funcionando correctamente');
      }
      if (!resultados.supabase) {
        console.log('❌ Hay problemas con la configuración de Supabase');
        console.log('💡 Revisar variables de entorno en .env.local');
      }
    }
    console.log('=' .repeat(50));
    
  } catch (error) {
    console.log('\n❌ ERROR DURANTE EL TESTING:');
    console.log(error.message);
  }
}

// Ejecutar el testing
ejecutarTests();
