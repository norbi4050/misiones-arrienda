/**
 * 🧪 TESTING EXHAUSTIVO - REGISTRO CORREGIDO FINAL
 * ================================================
 * 
 * Prueba el endpoint de registro después de aplicar la corrección
 * de la Opción 1: usar columna 'name' en lugar de 'full_name'
 */

const API_BASE_URL = 'http://localhost:3000';

// Colores para output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testRegistroCorregido() {
  log('\n🧪 TESTING EXHAUSTIVO - REGISTRO CORREGIDO FINAL', 'cyan');
  log('=' .repeat(60), 'cyan');
  
  const testCases = [
    {
      name: 'Registro Inquilino',
      data: {
        name: 'Juan Pérez Test',
        email: `test.inquilino.${Date.now()}@example.com`,
        phone: '+54911234567',
        password: 'password123',
        userType: 'inquilino'
      }
    },
    {
      name: 'Registro Dueño Directo',
      data: {
        name: 'María González Test',
        email: `test.dueno.${Date.now()}@example.com`,
        phone: '+54911234568',
        password: 'password123',
        userType: 'dueno_directo',
        propertyCount: 2
      }
    },
    {
      name: 'Registro Inmobiliaria',
      data: {
        name: 'Carlos Rodríguez Test',
        email: `test.inmobiliaria.${Date.now()}@example.com`,
        phone: '+54911234569',
        password: 'password123',
        userType: 'inmobiliaria',
        companyName: 'Inmobiliaria Test SA',
        licenseNumber: 'LIC123456'
      }
    }
  ];

  let successCount = 0;
  let totalTests = testCases.length;

  for (const testCase of testCases) {
    log(`\n📋 Probando: ${testCase.name}`, 'blue');
    log('-'.repeat(40), 'blue');
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testCase.data)
      });

      const result = await response.json();
      
      if (response.ok) {
        log('✅ ÉXITO: Registro completado', 'green');
        log(`   Usuario ID: ${result.user?.id}`, 'green');
        log(`   Nombre: ${result.user?.name}`, 'green');
        log(`   Email: ${result.user?.email}`, 'green');
        log(`   Tipo: ${result.user?.userType}`, 'green');
        successCount++;
      } else {
        log('❌ ERROR: Registro falló', 'red');
        log(`   Status: ${response.status}`, 'red');
        log(`   Error: ${result.error}`, 'red');
        log(`   Detalles: ${result.details}`, 'red');
        
        // Verificar si es el error específico que estamos solucionando
        if (result.details && result.details.includes('null value in column "name"')) {
          log('🚨 ERROR CRÍTICO: El problema de la columna "name" persiste!', 'red');
        }
      }
    } catch (error) {
      log('❌ ERROR DE CONEXIÓN:', 'red');
      log(`   ${error.message}`, 'red');
    }
  }

  // Resumen final
  log('\n📊 RESUMEN FINAL', 'cyan');
  log('=' .repeat(30), 'cyan');
  log(`✅ Exitosos: ${successCount}/${totalTests}`, successCount === totalTests ? 'green' : 'yellow');
  log(`❌ Fallidos: ${totalTests - successCount}/${totalTests}`, successCount === totalTests ? 'green' : 'red');
  
  if (successCount === totalTests) {
    log('\n🎉 ¡CORRECCIÓN EXITOSA!', 'green');
    log('El error "Database error saving new user" ha sido solucionado.', 'green');
    log('La columna "name" ahora funciona correctamente.', 'green');
  } else {
    log('\n⚠️  CORRECCIÓN PARCIAL', 'yellow');
    log('Algunos registros aún fallan. Revisar logs arriba.', 'yellow');
  }
}

// Función para verificar si el servidor está corriendo
async function checkServerStatus() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/health/db`);
    return response.ok;
  } catch (error) {
    return false;
  }
}

// Ejecutar testing
async function main() {
  log('🔍 Verificando estado del servidor...', 'blue');
  
  const serverRunning = await checkServerStatus();
  
  if (!serverRunning) {
    log('❌ Servidor no está corriendo en http://localhost:3000', 'red');
    log('Por favor, inicia el servidor con: npm run dev', 'yellow');
    process.exit(1);
  }
  
  log('✅ Servidor está corriendo', 'green');
  
  await testRegistroCorregido();
}

main().catch(console.error);
