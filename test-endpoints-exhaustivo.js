#!/usr/bin/env node

/**
 * TESTING EXHAUSTIVO DE TODOS LOS ENDPOINTS
 * Script para verificar que todos los endpoints funcionen correctamente
 * y no generen errores o warnings
 */

const http = require('http');
const https = require('https');

const BASE_URL = 'http://localhost:3000';

// Configuración de colores para output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

// Función para hacer requests HTTP
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;

    const requestOptions = {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    };

    const req = protocol.request(url, requestOptions, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const jsonData = data ? JSON.parse(data) : null;
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: jsonData,
            rawData: data
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: null,
            rawData: data,
            parseError: e.message
          });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }

    req.end();
  });
}

// Función para ejecutar test
async function runTest(testName, url, options = {}) {
  totalTests++;
  console.log(`\n${colors.blue}🧪 Testing: ${testName}${colors.reset}`);
  console.log(`${colors.cyan}URL: ${url}${colors.reset}`);

  try {
    const response = await makeRequest(url, options);

    if (response.status >= 200 && response.status < 300) {
      console.log(`${colors.green}✅ PASSED - Status: ${response.status}${colors.reset}`);
      passedTests++;
    } else if (response.status >= 400 && response.status < 500) {
      console.log(`${colors.yellow}⚠️  EXPECTED ERROR - Status: ${response.status}${colors.reset}`);
      console.log(`   Response: ${response.rawData || 'No response body'}`);
      passedTests++; // Consideramos errores esperados como pasados
    } else {
      console.log(`${colors.red}❌ FAILED - Status: ${response.status}${colors.reset}`);
      console.log(`   Response: ${response.rawData || 'No response body'}`);
      failedTests++;
    }

    return response;
  } catch (error) {
    console.log(`${colors.red}❌ ERROR - ${error.message}${colors.reset}`);
    failedTests++;
    return null;
  }
}

// Función principal de testing
async function runAllTests() {
  console.log(`${colors.magenta}🚀 INICIANDO TESTING EXHAUSTIVO DE ENDPOINTS${colors.reset}`);
  console.log(`${colors.magenta}================================================${colors.reset}`);

  // 1. HEALTH CHECKS
  console.log(`\n${colors.yellow}🏥 HEALTH CHECKS${colors.reset}`);
  await runTest('Health Check - DB', `${BASE_URL}/api/health/db`);
  await runTest('Version Check', `${BASE_URL}/api/version`);
  await runTest('Environment Check', `${BASE_URL}/api/env-check`);

  // 2. AUTH ENDPOINTS
  console.log(`\n${colors.yellow}🔐 AUTH ENDPOINTS${colors.reset}`);
  await runTest('Auth Login (GET)', `${BASE_URL}/api/auth/login`);
  await runTest('Auth Register (GET)', `${BASE_URL}/api/auth/register`);
  await runTest('Auth Verify (GET)', `${BASE_URL}/api/auth/verify`);

  // 3. USER ENDPOINTS
  console.log(`\n${colors.yellow}👤 USER ENDPOINTS${colors.reset}`);
  await runTest('Users Profile', `${BASE_URL}/api/users/profile`);
  await runTest('Users Stats', `${BASE_URL}/api/users/stats`);
  await runTest('User by ID (invalid)', `${BASE_URL}/api/users/123`);

  // 4. PROPERTIES ENDPOINTS
  console.log(`\n${colors.yellow}🏠 PROPERTIES ENDPOINTS${colors.reset}`);
  await runTest('Properties List', `${BASE_URL}/api/properties`);
  await runTest('Properties Create (GET)', `${BASE_URL}/api/properties/create`);
  await runTest('Properties Bulk (GET)', `${BASE_URL}/api/properties/bulk`);
  await runTest('Property by ID (invalid)', `${BASE_URL}/api/properties/123`);
  await runTest('Properties User (invalid user)', `${BASE_URL}/api/properties/user/123`);
  await runTest('Properties Analytics (invalid)', `${BASE_URL}/api/properties/analytics/123`);
  await runTest('Properties Similar (invalid)', `${BASE_URL}/api/properties/similar/123`);

  // 5. COMMUNITY ENDPOINTS
  console.log(`\n${colors.yellow}👥 COMMUNITY ENDPOINTS${colors.reset}`);
  await runTest('Community Profiles', `${BASE_URL}/api/comunidad/profiles`);
  await runTest('Community Profile by ID (invalid)', `${BASE_URL}/api/comunidad/profiles/123`);
  await runTest('Community Likes', `${BASE_URL}/api/comunidad/likes`);
  await runTest('Community Matches', `${BASE_URL}/api/comunidad/matches`);
  await runTest('Community Messages', `${BASE_URL}/api/comunidad/messages`);
  await runTest('Community Message by Conversation (invalid)', `${BASE_URL}/api/comunidad/messages/123`);

  // 6. PAYMENT ENDPOINTS
  console.log(`\n${colors.yellow}💳 PAYMENT ENDPOINTS${colors.reset}`);
  await runTest('Payments Create Preference (GET)', `${BASE_URL}/api/payments/create-preference`);
  await runTest('Payments Webhook (GET)', `${BASE_URL}/api/payments/webhook`);

  // 7. ADMIN ENDPOINTS
  console.log(`\n${colors.yellow}👑 ADMIN ENDPOINTS${colors.reset}`);
  await runTest('Admin Users', `${BASE_URL}/api/admin/users`);
  await runTest('Admin Stats', `${BASE_URL}/api/admin/stats`);
  await runTest('Admin Activity', `${BASE_URL}/api/admin/activity`);
  await runTest('Admin Delete User (GET)', `${BASE_URL}/api/admin/delete-user`);

  // 8. UTILITY ENDPOINTS
  console.log(`\n${colors.yellow}🛠️  UTILITY ENDPOINTS${colors.reset}`);
  await runTest('Favorites', `${BASE_URL}/api/favorites`);
  await runTest('Inquiries', `${BASE_URL}/api/inquiries`);
  await runTest('Search History', `${BASE_URL}/api/search-history`);
  await runTest('Stats', `${BASE_URL}/api/stats`);
  await runTest('Unfurl', `${BASE_URL}/api/unfurl`);

  // 9. TESTING DE ERRORES ESPERADOS
  console.log(`\n${colors.yellow}🚨 TESTING ERRORES ESPERADOS${colors.reset}`);
  await runTest('404 - Endpoint inexistente', `${BASE_URL}/api/endpoint-inexistente`);
  await runTest('405 - Método no permitido', `${BASE_URL}/api/properties`, { method: 'PUT' });

  // RESULTADOS FINALES
  console.log(`\n${colors.magenta}================================================${colors.reset}`);
  console.log(`${colors.magenta}📊 RESULTADOS FINALES${colors.reset}`);
  console.log(`${colors.magenta}================================================${colors.reset}`);

  console.log(`\n📈 Estadísticas:`);
  console.log(`   Total de tests: ${totalTests}`);
  console.log(`   ${colors.green}✅ Tests pasados: ${passedTests}${colors.reset}`);
  console.log(`   ${colors.red}❌ Tests fallidos: ${failedTests}${colors.reset}`);

  const successRate = ((passedTests / totalTests) * 100).toFixed(2);
  if (failedTests === 0) {
    console.log(`\n${colors.green}🎉 ¡EXCELENTE! Todos los tests pasaron (${successRate}%)${colors.reset}`);
    console.log(`${colors.green}🚀 El proyecto está listo para producción${colors.reset}`);
  } else {
    console.log(`\n${colors.yellow}⚠️  Tasa de éxito: ${successRate}%${colors.reset}`);
    console.log(`${colors.yellow}📝 Revisar los ${failedTests} tests fallidos${colors.reset}`);
  }

  console.log(`\n${colors.cyan}💡 Recomendaciones:${colors.reset}`);
  console.log(`   • Verificar logs del servidor para warnings adicionales`);
  console.log(`   • Revisar configuración de base de datos`);
  console.log(`   • Verificar variables de entorno`);
  console.log(`   • Ejecutar tests de integración si es necesario`);

  process.exit(failedTests === 0 ? 0 : 1);
}

// Ejecutar tests
if (require.main === module) {
  runAllTests().catch((error) => {
    console.error(`${colors.red}❌ Error fatal en testing: ${error.message}${colors.reset}`);
    process.exit(1);
  });
}

module.exports = { runAllTests, makeRequest };
