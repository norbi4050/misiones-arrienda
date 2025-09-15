#!/usr/bin/env node

/**
 * 🔍 TEST EXHAUSTIVO - FASE 1 AUDITORIA COMPLETADA
 * 
 * Verifica que todas las correcciones de seguridad crítica estén implementadas
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 INICIANDO TEST EXHAUSTIVO - FASE 1 AUDITORIA');
console.log('================================================\n');

let testsPassed = 0;
let testsFailed = 0;
const errors = [];

function testPassed(description) {
  console.log(`✅ ${description}`);
  testsPassed++;
}

function testFailed(description, error) {
  console.log(`❌ ${description}`);
  console.log(`   Error: ${error}\n`);
  testsFailed++;
  errors.push({ test: description, error });
}

// Test 1: Verificar protección de rutas admin
console.log('📋 TEST 1: Verificación de Rutas Admin Protegidas');
console.log('------------------------------------------------');

try {
  const statsRoute = fs.readFileSync('src/app/api/admin/stats/route.ts', 'utf8');
  
  if (statsRoute.includes('createClient') && 
      statsRoute.includes('SUPABASE_SERVICE_ROLE_KEY') &&
      statsRoute.includes('role') &&
      statsRoute.includes('ADMIN')) {
    testPassed('Ruta admin/stats tiene verificación de rol ADMIN');
  } else {
    testFailed('Ruta admin/stats no tiene verificación completa', 'Faltan validaciones de seguridad');
  }
} catch (error) {
  testFailed('No se pudo leer admin/stats route', error.message);
}

try {
  const activityRoute = fs.readFileSync('src/app/api/admin/activity/route.ts', 'utf8');
  
  if (activityRoute.includes('createClient') && 
      activityRoute.includes('SUPABASE_SERVICE_ROLE_KEY') &&
      activityRoute.includes('role') &&
      activityRoute.includes('ADMIN')) {
    testPassed('Ruta admin/activity tiene verificación de rol ADMIN');
  } else {
    testFailed('Ruta admin/activity no tiene verificación completa', 'Faltan validaciones de seguridad');
  }
} catch (error) {
  testFailed('No se pudo leer admin/activity route', error.message);
}

// Test 2: Verificar credenciales MercadoPago seguras
console.log('\n📋 TEST 2: Verificación de Credenciales MercadoPago');
console.log('--------------------------------------------------');

try {
  const mercadopagoLib = fs.readFileSync('src/lib/mercadopago.ts', 'utf8');
  
  // Verificar que NO hay credenciales hardcodeadas
  const hasHardcodedCredentials = mercadopagoLib.includes('APP_USR-') && 
                                  !mercadopagoLib.includes('process.env');
  
  if (!hasHardcodedCredentials) {
    testPassed('No hay credenciales hardcodeadas en mercadopago.ts');
  } else {
    testFailed('Credenciales hardcodeadas encontradas', 'Credenciales expuestas en código');
  }
  
  // Verificar que usa variables de entorno
  if (mercadopagoLib.includes('process.env.MERCADOPAGO_ACCESS_TOKEN') ||
      mercadopagoLib.includes('process.env.MP_ACCESS_TOKEN')) {
    testPassed('MercadoPago usa variables de entorno');
  } else {
    testFailed('MercadoPago no usa variables de entorno', 'Falta configuración segura');
  }
} catch (error) {
  testFailed('No se pudo leer mercadopago.ts', error.message);
}

// Test 3: Verificar middleware actualizado
console.log('\n📋 TEST 3: Verificación de Middleware');
console.log('------------------------------------');

try {
  const middleware = fs.readFileSync('src/middleware.ts', 'utf8');
  
  if (middleware.includes('adminRoutes') && 
      middleware.includes('/admin') &&
      middleware.includes('/api/admin')) {
    testPassed('Middleware incluye rutas admin');
  } else {
    testFailed('Middleware no incluye rutas admin', 'Falta protección de rutas');
  }
  
  if (middleware.includes('profiles') && 
      middleware.includes('role') &&
      middleware.includes('ADMIN')) {
    testPassed('Middleware verifica rol ADMIN');
  } else {
    testFailed('Middleware no verifica rol ADMIN', 'Falta verificación de permisos');
  }
} catch (error) {
  testFailed('No se pudo leer middleware.ts', error.message);
}

// Test 4: Verificar webhook de pagos
console.log('\n📋 TEST 4: Verificación de Webhook de Pagos');
console.log('-------------------------------------------');

try {
  const webhook = fs.readFileSync('src/app/api/payments/webhook/route.ts', 'utf8');
  
  if (webhook.includes('prisma.payment.upsert') || 
      webhook.includes('prisma.payment.create')) {
    testPassed('Webhook persiste pagos en base de datos');
  } else {
    testFailed('Webhook no persiste pagos', 'Falta persistencia de transacciones');
  }
  
  if (webhook.includes('isPaid') && 
      webhook.includes('featured') &&
      webhook.includes('highlightedUntil')) {
    testPassed('Webhook actualiza propiedades correctamente');
  } else {
    testFailed('Webhook no actualiza propiedades', 'Falta actualización de estado');
  }
} catch (error) {
  testFailed('No se pudo leer webhook route', error.message);
}

// Test 5: Verificar limpieza de archivos duplicados
console.log('\n📋 TEST 5: Verificación de Limpieza de Archivos');
console.log('----------------------------------------------');

const duplicatePatterns = [
  'route-backup',
  'route-original',
  'route-fixed',
  '-backup',
  '.backup',
  'seed-fixed',
  'seed-backup'
];

let duplicatesFound = 0;

function checkDirectory(dir) {
  try {
    const files = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const file of files) {
      const fullPath = path.join(dir, file.name);
      
      if (file.isDirectory()) {
        checkDirectory(fullPath);
      } else {
        for (const pattern of duplicatePatterns) {
          if (file.name.includes(pattern)) {
            duplicatesFound++;
            console.log(`   📁 Duplicado encontrado: ${fullPath}`);
          }
        }
      }
    }
  } catch (error) {
    // Ignorar errores de acceso a directorios
  }
}

checkDirectory('src');
checkDirectory('prisma');

if (duplicatesFound === 0) {
  testPassed('No se encontraron archivos duplicados');
} else {
  testFailed(`Se encontraron ${duplicatesFound} archivos duplicados`, 'Limpieza incompleta');
}

// Resumen final
console.log('\n🎯 RESUMEN DE TESTS - FASE 1');
console.log('============================');
console.log(`✅ Tests Pasados: ${testsPassed}`);
console.log(`❌ Tests Fallidos: ${testsFailed}`);
console.log(`📊 Total Tests: ${testsPassed + testsFailed}`);

if (testsFailed === 0) {
  console.log('\n🎉 ¡FASE 1 COMPLETADA EXITOSAMENTE!');
  console.log('Todas las correcciones de seguridad crítica están implementadas.');
  console.log('✅ Sistema listo para FASE 2 - Limpieza y Estructura');
} else {
  console.log('\n⚠️  FASE 1 INCOMPLETA');
  console.log('Se encontraron problemas que requieren atención:');
  
  errors.forEach((error, index) => {
    console.log(`\n${index + 1}. ${error.test}`);
    console.log(`   ${error.error}`);
  });
  
  console.log('\n🔧 Corregir estos problemas antes de continuar con FASE 2');
}

console.log('\n📋 PRÓXIMOS PASOS:');
console.log('- FASE 2: Sincronizar esquema Prisma con BD');
console.log('- FASE 2: Unificar hooks de autenticación');
console.log('- FASE 2: Configurar Supabase Storage');
console.log('- FASE 3: Completar flujo de pagos premium');

process.exit(testsFailed > 0 ? 1 : 0);
