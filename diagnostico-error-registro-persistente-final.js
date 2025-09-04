/**
 * 🔍 DIAGNÓSTICO ERROR REGISTRO PERSISTENTE - FINAL
 * =================================================
 * 
 * El usuario reporta que el error persiste después de la corrección.
 * Necesitamos hacer un diagnóstico más profundo para encontrar la causa real.
 */

const API_BASE_URL = 'http://localhost:3000';

// Colores para output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function diagnosticoErrorRegistroPersistente() {
  log('\n🔍 DIAGNÓSTICO ERROR REGISTRO PERSISTENTE - FINAL', 'cyan');
  log('=' .repeat(60), 'cyan');
  
  log('\n📋 INFORMACIÓN NECESARIA DE SUPABASE:', 'yellow');
  log('Por favor, proporciona la siguiente información desde tu dashboard de Supabase:', 'yellow');
  log('', 'reset');
  
  log('1️⃣ ESQUEMA DE LA TABLA USERS:', 'blue');
  log('   - Ve a: Table Editor > users', 'blue');
  log('   - Copia TODAS las columnas y sus tipos', 'blue');
  log('   - Especialmente: name, full_name, email, phone, user_type', 'blue');
  log('', 'reset');
  
  log('2️⃣ POLÍTICAS RLS (Row Level Security):', 'blue');
  log('   - Ve a: Authentication > Policies', 'blue');
  log('   - Busca políticas para la tabla "users"', 'blue');
  log('   - Copia las políticas de INSERT especialmente', 'blue');
  log('', 'reset');
  
  log('3️⃣ LOGS DE ERROR EN TIEMPO REAL:', 'blue');
  log('   - Ve a: Logs > Postgres Logs', 'blue');
  log('   - Intenta registrar un usuario AHORA', 'blue');
  log('   - Copia el error exacto que aparece en los logs', 'blue');
  log('', 'reset');
  
  log('4️⃣ CONFIGURACIÓN DE AUTENTICACIÓN:', 'blue');
  log('   - Ve a: Authentication > Settings', 'blue');
  log('   - Verifica si "Enable email confirmations" está activado', 'blue');
  log('   - Verifica la configuración de "User Management"', 'blue');
  log('', 'reset');

  // Intentar hacer una petición de prueba para capturar el error exacto
  log('🧪 INTENTANDO REGISTRO DE PRUEBA PARA CAPTURAR ERROR:', 'magenta');
  log('-'.repeat(50), 'magenta');
  
  const testData = {
    name: 'Usuario Test Diagnóstico',
    email: `test.diagnostico.${Date.now()}@example.com`,
    phone: '+54911234567',
    password: 'password123',
    userType: 'inquilino'
  };
  
  try {
    log(`📤 Enviando datos de prueba:`, 'blue');
    log(`   Email: ${testData.email}`, 'blue');
    log(`   Nombre: ${testData.name}`, 'blue');
    log(`   Tipo: ${testData.userType}`, 'blue');
    
    const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });

    const result = await response.json();
    
    if (!response.ok) {
      log('\n❌ ERROR CAPTURADO:', 'red');
      log(`   Status: ${response.status}`, 'red');
      log(`   Error: ${result.error}`, 'red');
      log(`   Detalles: ${result.details}`, 'red');
      
      // Analizar el tipo de error
      if (result.details) {
        if (result.details.includes('null value in column')) {
          log('\n🚨 PROBLEMA DETECTADO: Valor NULL en columna requerida', 'yellow');
          const match = result.details.match(/null value in column "([^"]+)"/);
          if (match) {
            log(`   Columna problemática: "${match[1]}"`, 'yellow');
          }
        }
        
        if (result.details.includes('violates not-null constraint')) {
          log('\n🚨 PROBLEMA DETECTADO: Violación de restricción NOT NULL', 'yellow');
        }
        
        if (result.details.includes('duplicate key value')) {
          log('\n🚨 PROBLEMA DETECTADO: Valor duplicado', 'yellow');
        }
        
        if (result.details.includes('permission denied')) {
          log('\n🚨 PROBLEMA DETECTADO: Permisos insuficientes (RLS)', 'yellow');
        }
      }
    } else {
      log('\n✅ REGISTRO EXITOSO (¿El error se solucionó?)', 'green');
      log(`   Usuario ID: ${result.user?.id}`, 'green');
    }
    
  } catch (error) {
    log('\n❌ ERROR DE CONEXIÓN:', 'red');
    log(`   ${error.message}`, 'red');
    log('\n🔧 POSIBLES CAUSAS:', 'yellow');
    log('   - El servidor no está corriendo', 'yellow');
    log('   - Problema de conectividad', 'yellow');
    log('   - Variables de entorno incorrectas', 'yellow');
  }
  
  log('\n📋 PRÓXIMOS PASOS:', 'cyan');
  log('1. Proporciona la información solicitada arriba', 'cyan');
  log('2. Especialmente los logs de error en tiempo real', 'cyan');
  log('3. Verificaremos si el problema es:', 'cyan');
  log('   - Esquema de base de datos', 'cyan');
  log('   - Políticas RLS', 'cyan');
  log('   - Configuración de autenticación', 'cyan');
  log('   - Variables de entorno', 'cyan');
  log('', 'reset');
}

// Función para verificar variables de entorno
function verificarVariablesEntorno() {
  log('\n🔧 VERIFICACIÓN DE VARIABLES DE ENTORNO:', 'blue');
  log('-'.repeat(40), 'blue');
  
  const variablesRequeridas = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY'
  ];
  
  variablesRequeridas.forEach(variable => {
    const valor = process.env[variable];
    if (valor) {
      log(`✅ ${variable}: ${valor.substring(0, 20)}...`, 'green');
    } else {
      log(`❌ ${variable}: NO DEFINIDA`, 'red');
    }
  });
}

// Ejecutar diagnóstico
async function main() {
  await diagnosticoErrorRegistroPersistente();
  verificarVariablesEntorno();
  
  log('\n💡 INFORMACIÓN ADICIONAL ÚTIL:', 'cyan');
  log('Si puedes, también proporciona:', 'cyan');
  log('- Screenshot del error en el navegador', 'cyan');
  log('- Network tab del navegador (F12 > Network)', 'cyan');
  log('- Console logs del navegador (F12 > Console)', 'cyan');
  log('', 'reset');
}

main().catch(console.error);
