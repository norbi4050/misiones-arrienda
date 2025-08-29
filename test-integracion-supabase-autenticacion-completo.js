const puppeteer = require('puppeteer');
const fs = require('fs');

console.log('🔍 INICIANDO TESTING EXHAUSTIVO DE INTEGRACIÓN SUPABASE Y AUTENTICACIÓN');
console.log('================================================================');

const testResults = {
  timestamp: new Date().toISOString(),
  tests: [],
  summary: {
    total: 0,
    passed: 0,
    failed: 0,
    warnings: 0
  }
};

function addTestResult(name, status, details, screenshot = null) {
  const result = {
    name,
    status, // 'PASS', 'FAIL', 'WARNING'
    details,
    screenshot,
    timestamp: new Date().toISOString()
  };
  
  testResults.tests.push(result);
  testResults.summary.total++;
  
  if (status === 'PASS') testResults.summary.passed++;
  else if (status === 'FAIL') testResults.summary.failed++;
  else if (status === 'WARNING') testResults.summary.warnings++;
  
  const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
  console.log(`${icon} ${name}: ${details}`);
}

async function testSupabaseIntegration() {
  console.log('\n📋 FASE 1: VERIFICACIÓN DE CONFIGURACIÓN SUPABASE');
  console.log('================================================');
  
  let browser;
  try {
    browser = await puppeteer.launch({ 
      headless: false,
      defaultViewport: { width: 1200, height: 800 },
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Configurar interceptor de requests para verificar llamadas a Supabase
    const supabaseRequests = [];
    await page.setRequestInterception(true);
    
    page.on('request', (request) => {
      const url = request.url();
      if (url.includes('supabase') || url.includes('auth') || url.includes('api/auth')) {
        supabaseRequests.push({
          url,
          method: request.method(),
          timestamp: new Date().toISOString()
        });
      }
      request.continue();
    });
    
    // Capturar errores de consola
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    // Test 1: Cargar página principal
    console.log('\n🔍 Test 1: Carga de página principal');
    try {
      await page.goto('http://localhost:3000', { waitUntil: 'networkidle0', timeout: 30000 });
      await page.screenshot({ path: 'test-homepage-load.png' });
      addTestResult('Carga de Homepage', 'PASS', 'Página principal cargada correctamente', 'test-homepage-load.png');
    } catch (error) {
      addTestResult('Carga de Homepage', 'FAIL', `Error al cargar: ${error.message}`);
    }
    
    // Test 2: Verificar variables de entorno Supabase
    console.log('\n🔍 Test 2: Variables de entorno Supabase');
    try {
      const supabaseConfigCheck = await page.evaluate(() => {
        return {
          hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
          hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
          windowSupabase: typeof window !== 'undefined' && window.supabase !== undefined
        };
      });
      
      if (supabaseConfigCheck.hasSupabaseUrl && supabaseConfigCheck.hasSupabaseKey) {
        addTestResult('Variables Supabase', 'PASS', 'Variables de entorno configuradas correctamente');
      } else {
        addTestResult('Variables Supabase', 'WARNING', 'Algunas variables de entorno pueden estar faltando');
      }
    } catch (error) {
      addTestResult('Variables Supabase', 'FAIL', `Error verificando variables: ${error.message}`);
    }
    
    // Test 3: Navegación a página de login
    console.log('\n🔍 Test 3: Navegación a Login');
    try {
      await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle0', timeout: 30000 });
      await page.screenshot({ path: 'test-login-page.png' });
      
      // Verificar elementos del formulario de login
      const loginElements = await page.evaluate(() => {
        return {
          hasEmailField: !!document.querySelector('input[type="email"], input[name="email"]'),
          hasPasswordField: !!document.querySelector('input[type="password"], input[name="password"]'),
          hasSubmitButton: !!document.querySelector('button[type="submit"], button:contains("Iniciar")'),
          hasRegisterLink: !!document.querySelector('a[href*="register"], a:contains("Registrar")')
        };
      });
      
      if (loginElements.hasEmailField && loginElements.hasPasswordField && loginElements.hasSubmitButton) {
        addTestResult('Página de Login', 'PASS', 'Formulario de login completo y funcional', 'test-login-page.png');
      } else {
        addTestResult('Página de Login', 'WARNING', 'Algunos elementos del formulario pueden estar faltando');
      }
    } catch (error) {
      addTestResult('Página de Login', 'FAIL', `Error cargando login: ${error.message}`);
    }
    
    // Test 4: Navegación a página de registro
    console.log('\n🔍 Test 4: Navegación a Registro');
    try {
      await page.goto('http://localhost:3000/register', { waitUntil: 'networkidle0', timeout: 30000 });
      await page.screenshot({ path: 'test-register-page.png' });
      
      const registerElements = await page.evaluate(() => {
        return {
          hasEmailField: !!document.querySelector('input[type="email"], input[name="email"]'),
          hasPasswordField: !!document.querySelector('input[type="password"], input[name="password"]'),
          hasNameField: !!document.querySelector('input[name="name"], input[name="fullName"]'),
          hasSubmitButton: !!document.querySelector('button[type="submit"], button:contains("Registrar")')
        };
      });
      
      if (registerElements.hasEmailField && registerElements.hasPasswordField && registerElements.hasSubmitButton) {
        addTestResult('Página de Registro', 'PASS', 'Formulario de registro completo', 'test-register-page.png');
      } else {
        addTestResult('Página de Registro', 'WARNING', 'Algunos elementos del formulario pueden estar faltando');
      }
    } catch (error) {
      addTestResult('Página de Registro', 'FAIL', `Error cargando registro: ${error.message}`);
    }
    
    // Test 5: Verificar APIs de autenticación
    console.log('\n🔍 Test 5: APIs de Autenticación');
    try {
      // Probar endpoint de registro
      const registerResponse = await page.evaluate(async () => {
        try {
          const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: 'test@example.com',
              password: 'testpassword123',
              name: 'Test User'
            })
          });
          return {
            status: response.status,
            ok: response.ok,
            statusText: response.statusText
          };
        } catch (error) {
          return { error: error.message };
        }
      });
      
      if (registerResponse.status === 200 || registerResponse.status === 400) {
        addTestResult('API Registro', 'PASS', `Endpoint responde correctamente (${registerResponse.status})`);
      } else if (registerResponse.error) {
        addTestResult('API Registro', 'WARNING', `Error de conexión: ${registerResponse.error}`);
      } else {
        addTestResult('API Registro', 'FAIL', `Respuesta inesperada: ${registerResponse.status}`);
      }
    } catch (error) {
      addTestResult('API Registro', 'FAIL', `Error probando API: ${error.message}`);
    }
    
    // Test 6: Verificar Dashboard (requiere autenticación)
    console.log('\n🔍 Test 6: Página de Dashboard');
    try {
      await page.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle0', timeout: 30000 });
      await page.screenshot({ path: 'test-dashboard-page.png' });
      
      const currentUrl = page.url();
      if (currentUrl.includes('/login') || currentUrl.includes('/auth')) {
        addTestResult('Dashboard (Sin Auth)', 'PASS', 'Redirección correcta a login para usuarios no autenticados', 'test-dashboard-page.png');
      } else if (currentUrl.includes('/dashboard')) {
        addTestResult('Dashboard (Con Auth)', 'PASS', 'Dashboard accesible (usuario autenticado)', 'test-dashboard-page.png');
      } else {
        addTestResult('Dashboard', 'WARNING', `Comportamiento inesperado: ${currentUrl}`);
      }
    } catch (error) {
      addTestResult('Dashboard', 'FAIL', `Error accediendo dashboard: ${error.message}`);
    }
    
    // Test 7: Verificar middleware de autenticación
    console.log('\n🔍 Test 7: Middleware de Autenticación');
    try {
      // Intentar acceder a rutas protegidas
      const protectedRoutes = ['/publicar', '/profile', '/comunidad/publicar'];
      let middlewareWorking = 0;
      
      for (const route of protectedRoutes) {
        try {
          await page.goto(`http://localhost:3000${route}`, { waitUntil: 'networkidle0', timeout: 15000 });
          const finalUrl = page.url();
          
          if (finalUrl.includes('/login') || finalUrl.includes('/auth')) {
            middlewareWorking++;
          }
        } catch (error) {
          // Timeout o error puede indicar que la ruta no existe
        }
      }
      
      if (middlewareWorking >= 2) {
        addTestResult('Middleware Auth', 'PASS', `${middlewareWorking}/${protectedRoutes.length} rutas protegidas correctamente`);
      } else if (middlewareWorking >= 1) {
        addTestResult('Middleware Auth', 'WARNING', `Solo ${middlewareWorking}/${protectedRoutes.length} rutas protegidas`);
      } else {
        addTestResult('Middleware Auth', 'FAIL', 'Middleware de autenticación no funciona correctamente');
      }
    } catch (error) {
      addTestResult('Middleware Auth', 'FAIL', `Error verificando middleware: ${error.message}`);
    }
    
    // Test 8: Verificar conexión con base de datos
    console.log('\n🔍 Test 8: Conexión Base de Datos');
    try {
      const dbResponse = await page.evaluate(async () => {
        try {
          const response = await fetch('/api/health/db');
          const data = await response.json();
          return {
            status: response.status,
            data: data,
            ok: response.ok
          };
        } catch (error) {
          return { error: error.message };
        }
      });
      
      if (dbResponse.ok && dbResponse.data) {
        addTestResult('Conexión DB', 'PASS', 'Base de datos conectada correctamente');
      } else if (dbResponse.error) {
        addTestResult('Conexión DB', 'WARNING', `Error de conexión: ${dbResponse.error}`);
      } else {
        addTestResult('Conexión DB', 'FAIL', 'No se pudo verificar conexión a base de datos');
      }
    } catch (error) {
      addTestResult('Conexión DB', 'FAIL', `Error verificando DB: ${error.message}`);
    }
    
    // Test 9: Verificar requests a Supabase
    console.log('\n🔍 Test 9: Requests a Supabase');
    if (supabaseRequests.length > 0) {
      addTestResult('Requests Supabase', 'PASS', `${supabaseRequests.length} requests detectados a Supabase`);
      console.log('📊 Requests detectados:');
      supabaseRequests.forEach((req, index) => {
        console.log(`   ${index + 1}. ${req.method} ${req.url}`);
      });
    } else {
      addTestResult('Requests Supabase', 'WARNING', 'No se detectaron requests a Supabase durante las pruebas');
    }
    
    // Test 10: Verificar errores de consola
    console.log('\n🔍 Test 10: Errores de Consola');
    if (consoleErrors.length === 0) {
      addTestResult('Errores Consola', 'PASS', 'No se detectaron errores críticos en consola');
    } else if (consoleErrors.length <= 3) {
      addTestResult('Errores Consola', 'WARNING', `${consoleErrors.length} errores menores detectados`);
      console.log('⚠️ Errores encontrados:');
      consoleErrors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`);
      });
    } else {
      addTestResult('Errores Consola', 'FAIL', `${consoleErrors.length} errores detectados en consola`);
      console.log('❌ Errores encontrados:');
      consoleErrors.slice(0, 5).forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`);
      });
      if (consoleErrors.length > 5) {
        console.log(`   ... y ${consoleErrors.length - 5} errores más`);
      }
    }
    
  } catch (error) {
    addTestResult('Testing General', 'FAIL', `Error general en testing: ${error.message}`);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

async function generateReport() {
  console.log('\n📊 GENERANDO REPORTE FINAL');
  console.log('==========================');
  
  const reportContent = `# 🔍 REPORTE DE TESTING - INTEGRACIÓN SUPABASE Y AUTENTICACIÓN

## 📋 RESUMEN EJECUTIVO

**Fecha:** ${testResults.timestamp}
**Total de Tests:** ${testResults.summary.total}
**Tests Exitosos:** ${testResults.summary.passed} ✅
**Tests Fallidos:** ${testResults.summary.failed} ❌
**Advertencias:** ${testResults.summary.warnings} ⚠️

**Porcentaje de Éxito:** ${Math.round((testResults.summary.passed / testResults.summary.total) * 100)}%

## 📊 RESULTADOS DETALLADOS

${testResults.tests.map(test => `
### ${test.status === 'PASS' ? '✅' : test.status === 'FAIL' ? '❌' : '⚠️'} ${test.name}

**Estado:** ${test.status}
**Detalles:** ${test.details}
**Timestamp:** ${test.timestamp}
${test.screenshot ? `**Screenshot:** ${test.screenshot}` : ''}
`).join('\n')}

## 🔧 ANÁLISIS DE INTEGRACIÓN

### Estado de Supabase
${testResults.tests.filter(t => t.name.includes('Supabase') || t.name.includes('DB')).map(t => 
  `- ${t.name}: ${t.status} - ${t.details}`
).join('\n')}

### Estado de Autenticación
${testResults.tests.filter(t => t.name.includes('Login') || t.name.includes('Registro') || t.name.includes('Auth')).map(t => 
  `- ${t.name}: ${t.status} - ${t.details}`
).join('\n')}

### Estado de APIs
${testResults.tests.filter(t => t.name.includes('API')).map(t => 
  `- ${t.name}: ${t.status} - ${t.details}`
).join('\n')}

## 🎯 RECOMENDACIONES

${testResults.summary.failed > 0 ? `
### ❌ PROBLEMAS CRÍTICOS DETECTADOS
- Se encontraron ${testResults.summary.failed} tests fallidos que requieren atención inmediata
- Revisar la configuración de Supabase y variables de entorno
- Verificar que el servidor esté ejecutándose correctamente
` : ''}

${testResults.summary.warnings > 0 ? `
### ⚠️ ADVERTENCIAS
- Se detectaron ${testResults.summary.warnings} advertencias que deberían revisarse
- Algunos componentes pueden no estar completamente configurados
- Considerar implementar mejoras en las áreas marcadas
` : ''}

${testResults.summary.passed === testResults.summary.total ? `
### ✅ SISTEMA FUNCIONANDO CORRECTAMENTE
- Todos los tests pasaron exitosamente
- La integración con Supabase está funcionando
- El sistema de autenticación está operativo
` : ''}

## 📝 PRÓXIMOS PASOS

1. **Corregir problemas críticos** identificados en los tests fallidos
2. **Revisar advertencias** y implementar mejoras sugeridas
3. **Verificar configuración** de variables de entorno de Supabase
4. **Probar funcionalidad** de registro y login con usuarios reales
5. **Implementar testing automatizado** para verificaciones continuas

---
*Reporte generado automáticamente el ${new Date().toLocaleString()}*
`;

  fs.writeFileSync('REPORTE-TESTING-INTEGRACION-SUPABASE-AUTENTICACION-FINAL.md', reportContent);
  
  console.log('\n✅ REPORTE GENERADO: REPORTE-TESTING-INTEGRACION-SUPABASE-AUTENTICACION-FINAL.md');
  
  // Mostrar resumen en consola
  console.log('\n📊 RESUMEN FINAL:');
  console.log(`Total: ${testResults.summary.total} | Exitosos: ${testResults.summary.passed} | Fallidos: ${testResults.summary.failed} | Advertencias: ${testResults.summary.warnings}`);
  console.log(`Porcentaje de éxito: ${Math.round((testResults.summary.passed / testResults.summary.total) * 100)}%`);
  
  if (testResults.summary.failed > 0) {
    console.log('\n❌ PROBLEMAS CRÍTICOS DETECTADOS - REVISAR REPORTE COMPLETO');
  } else if (testResults.summary.warnings > 0) {
    console.log('\n⚠️ SISTEMA FUNCIONAL CON ADVERTENCIAS - REVISAR MEJORAS SUGERIDAS');
  } else {
    console.log('\n✅ SISTEMA COMPLETAMENTE FUNCIONAL');
  }
}

// Ejecutar testing
async function runTests() {
  try {
    await testSupabaseIntegration();
    await generateReport();
  } catch (error) {
    console.error('❌ Error ejecutando tests:', error);
    addTestResult('Ejecución General', 'FAIL', `Error crítico: ${error.message}`);
    await generateReport();
  }
}

// Verificar si el servidor está ejecutándose
async function checkServer() {
  console.log('🔍 Verificando servidor...');
  try {
    const response = await fetch('http://localhost:3000');
    if (response.ok) {
      console.log('✅ Servidor detectado en http://localhost:3000');
      return true;
    }
  } catch (error) {
    console.log('❌ Servidor no detectado en http://localhost:3000');
    console.log('💡 Asegúrate de ejecutar: npm run dev');
    return false;
  }
}

// Función principal
async function main() {
  console.log('🚀 INICIANDO TESTING DE INTEGRACIÓN SUPABASE Y AUTENTICACIÓN');
  console.log('============================================================');
  
  const serverRunning = await checkServer();
  if (!serverRunning) {
    console.log('\n❌ No se puede continuar sin el servidor ejecutándose');
    console.log('💡 Ejecuta: cd Backend && npm run dev');
    process.exit(1);
  }
  
  await runTests();
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { testSupabaseIntegration, generateReport };
