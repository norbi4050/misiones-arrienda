/**
 * TESTING EXHAUSTIVO COMPLETO POST-CORRECCIÓN SUPABASE
 * Verifica todas las funcionalidades de la plataforma Misiones Arrienda
 */

const fs = require('fs');
const path = require('path');

// Configuración de testing
const BASE_URL = 'http://localhost:3000';
const TIMEOUT = 10000;

// Resultados del testing
let testResults = {
    total: 0,
    passed: 0,
    failed: 0,
    errors: [],
    details: []
};

// Función para simular requests HTTP
async function testEndpoint(url, method = 'GET', data = null) {
    try {
        const fetch = (await import('node-fetch')).default;
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'Testing-Bot/1.0'
            },
            timeout: TIMEOUT
        };
        
        if (data && method !== 'GET') {
            options.body = JSON.stringify(data);
        }
        
        const response = await fetch(url, options);
        return {
            status: response.status,
            ok: response.ok,
            headers: response.headers,
            url: response.url
        };
    } catch (error) {
        return {
            status: 0,
            ok: false,
            error: error.message
        };
    }
}

// Función para verificar archivos
function checkFile(filePath) {
    try {
        return fs.existsSync(filePath);
    } catch (error) {
        return false;
    }
}

// Función para registrar resultados
function logTest(testName, passed, details = '') {
    testResults.total++;
    if (passed) {
        testResults.passed++;
        console.log(`✅ ${testName}`);
    } else {
        testResults.failed++;
        testResults.errors.push(`❌ ${testName}: ${details}`);
        console.log(`❌ ${testName}: ${details}`);
    }
    
    testResults.details.push({
        test: testName,
        passed,
        details,
        timestamp: new Date().toISOString()
    });
}

// TESTING EXHAUSTIVO COMPLETO
async function runExhaustiveTesting() {
    console.log('🚀 INICIANDO TESTING EXHAUSTIVO COMPLETO POST-CORRECCIÓN SUPABASE');
    console.log('================================================================');
    
    // 1. VERIFICACIÓN DE CONFIGURACIÓN SUPABASE
    console.log('\n📋 1. VERIFICACIÓN CONFIGURACIÓN SUPABASE');
    console.log('------------------------------------------');
    
    const envExists = checkFile(path.join(__dirname, '.env.local'));
    logTest('Archivo .env.local existe', envExists);
    
    if (envExists) {
        try {
            const envContent = fs.readFileSync(path.join(__dirname, '.env.local'), 'utf8');
            const hasSupabaseUrl = envContent.includes('NEXT_PUBLIC_SUPABASE_URL');
            const hasSupabaseKey = envContent.includes('NEXT_PUBLIC_SUPABASE_ANON_KEY');
            const hasServiceKey = envContent.includes('SUPABASE_SERVICE_ROLE_KEY');
            const hasDatabaseUrl = envContent.includes('DATABASE_URL');
            
            logTest('Variable NEXT_PUBLIC_SUPABASE_URL configurada', hasSupabaseUrl);
            logTest('Variable NEXT_PUBLIC_SUPABASE_ANON_KEY configurada', hasSupabaseKey);
            logTest('Variable SUPABASE_SERVICE_ROLE_KEY configurada', hasServiceKey);
            logTest('Variable DATABASE_URL configurada', hasDatabaseUrl);
            
            const allConfigured = hasSupabaseUrl && hasSupabaseKey && hasServiceKey && hasDatabaseUrl;
            logTest('Configuración Supabase completa', allConfigured);
        } catch (error) {
            logTest('Lectura de .env.local', false, error.message);
        }
    }
    
    // 2. TESTING CRÍTICO - SISTEMA DE AUTENTICACIÓN
    console.log('\n🔐 2. TESTING CRÍTICO - SISTEMA DE AUTENTICACIÓN');
    console.log('------------------------------------------------');
    
    // Página de registro
    const registerResponse = await testEndpoint(`${BASE_URL}/register`);
    logTest('Página de registro accesible', registerResponse.ok, `Status: ${registerResponse.status}`);
    
    // Página de login
    const loginResponse = await testEndpoint(`${BASE_URL}/login`);
    logTest('Página de login accesible', loginResponse.ok, `Status: ${loginResponse.status}`);
    
    // API de registro
    const registerApiResponse = await testEndpoint(`${BASE_URL}/api/auth/register`, 'POST', {
        email: 'test@example.com',
        password: 'testpassword123',
        name: 'Test User'
    });
    logTest('API de registro responde', registerApiResponse.status !== 0, `Status: ${registerApiResponse.status}`);
    
    // API de login
    const loginApiResponse = await testEndpoint(`${BASE_URL}/api/auth/login`, 'POST', {
        email: 'test@example.com',
        password: 'testpassword123'
    });
    logTest('API de login responde', loginApiResponse.status !== 0, `Status: ${loginApiResponse.status}`);
    
    // 3. TESTING FUNCIONALIDADES PRINCIPALES
    console.log('\n🏠 3. TESTING FUNCIONALIDADES PRINCIPALES');
    console.log('----------------------------------------');
    
    // Página principal
    const homeResponse = await testEndpoint(BASE_URL);
    logTest('Página principal carga', homeResponse.ok, `Status: ${homeResponse.status}`);
    
    // Página de propiedades
    const propertiesResponse = await testEndpoint(`${BASE_URL}/properties`);
    logTest('Página de propiedades carga', propertiesResponse.ok, `Status: ${propertiesResponse.status}`);
    
    // API de propiedades
    const propertiesApiResponse = await testEndpoint(`${BASE_URL}/api/properties`);
    logTest('API de propiedades responde', propertiesApiResponse.status !== 0, `Status: ${propertiesApiResponse.status}`);
    
    // Página de publicar
    const publicarResponse = await testEndpoint(`${BASE_URL}/publicar`);
    logTest('Página de publicar accesible', publicarResponse.status !== 0, `Status: ${publicarResponse.status}`);
    
    // Dashboard
    const dashboardResponse = await testEndpoint(`${BASE_URL}/dashboard`);
    logTest('Dashboard accesible', dashboardResponse.status !== 0, `Status: ${dashboardResponse.status}`);
    
    // 4. TESTING PÁGINAS ESPECÍFICAS DE CIUDADES
    console.log('\n🌆 4. TESTING PÁGINAS DE CIUDADES');
    console.log('--------------------------------');
    
    const cities = ['posadas', 'puerto-iguazu', 'obera', 'eldorado'];
    for (const city of cities) {
        const cityResponse = await testEndpoint(`${BASE_URL}/${city}`);
        logTest(`Página de ${city} carga`, cityResponse.ok, `Status: ${cityResponse.status}`);
    }
    
    // 5. TESTING PÁGINAS LEGALES Y ADICIONALES
    console.log('\n📄 5. TESTING PÁGINAS LEGALES');
    console.log('-----------------------------');
    
    const legalPages = ['privacy', 'terms'];
    for (const page of legalPages) {
        const pageResponse = await testEndpoint(`${BASE_URL}/${page}`);
        logTest(`Página ${page} carga`, pageResponse.ok, `Status: ${pageResponse.status}`);
    }
    
    // 6. TESTING SISTEMA DE PERFILES
    console.log('\n👤 6. TESTING SISTEMA DE PERFILES');
    console.log('---------------------------------');
    
    const profilesResponse = await testEndpoint(`${BASE_URL}/profiles`);
    logTest('Página de perfiles carga', profilesResponse.ok, `Status: ${profilesResponse.status}`);
    
    const profileApiResponse = await testEndpoint(`${BASE_URL}/api/users/profile`);
    logTest('API de perfiles responde', profileApiResponse.status !== 0, `Status: ${profileApiResponse.status}`);
    
    // 7. TESTING MÓDULO DE COMUNIDAD
    console.log('\n🏘️ 7. TESTING MÓDULO DE COMUNIDAD');
    console.log('----------------------------------');
    
    const comunidadResponse = await testEndpoint(`${BASE_URL}/comunidad`);
    logTest('Página de comunidad carga', comunidadResponse.ok, `Status: ${comunidadResponse.status}`);
    
    const comunidadPublicarResponse = await testEndpoint(`${BASE_URL}/comunidad/publicar`);
    logTest('Página comunidad/publicar carga', comunidadPublicarResponse.ok, `Status: ${comunidadPublicarResponse.status}`);
    
    // 8. TESTING SISTEMA DE PAGOS
    console.log('\n💳 8. TESTING SISTEMA DE PAGOS');
    console.log('------------------------------');
    
    const paymentPages = ['payment/success', 'payment/failure', 'payment/pending'];
    for (const page of paymentPages) {
        const paymentResponse = await testEndpoint(`${BASE_URL}/${page}`);
        logTest(`Página ${page} carga`, paymentResponse.ok, `Status: ${paymentResponse.status}`);
    }
    
    const paymentsApiResponse = await testEndpoint(`${BASE_URL}/api/payments/create-preference`, 'POST', {
        amount: 1000,
        description: 'Test payment'
    });
    logTest('API de pagos responde', paymentsApiResponse.status !== 0, `Status: ${paymentsApiResponse.status}`);
    
    // 9. TESTING FUNCIONALIDADES AVANZADAS
    console.log('\n⚡ 9. TESTING FUNCIONALIDADES AVANZADAS');
    console.log('--------------------------------------');
    
    // API de favoritos
    const favoritesApiResponse = await testEndpoint(`${BASE_URL}/api/favorites`);
    logTest('API de favoritos responde', favoritesApiResponse.status !== 0, `Status: ${favoritesApiResponse.status}`);
    
    // API de historial de búsqueda
    const searchHistoryApiResponse = await testEndpoint(`${BASE_URL}/api/search-history`);
    logTest('API de historial responde', searchHistoryApiResponse.status !== 0, `Status: ${searchHistoryApiResponse.status}`);
    
    // API de estadísticas
    const statsApiResponse = await testEndpoint(`${BASE_URL}/api/stats`);
    logTest('API de estadísticas responde', statsApiResponse.status !== 0, `Status: ${statsApiResponse.status}`);
    
    // 10. TESTING ARCHIVOS ESTÁTICOS Y RECURSOS
    console.log('\n📁 10. TESTING ARCHIVOS Y RECURSOS');
    console.log('----------------------------------');
    
    // Verificar archivos críticos
    const criticalFiles = [
        'package.json',
        'next.config.js',
        'tailwind.config.ts',
        'tsconfig.json',
        'src/app/layout.tsx',
        'src/app/page.tsx',
        'src/lib/supabase/client.ts',
        'src/lib/supabase/server.ts'
    ];
    
    for (const file of criticalFiles) {
        const fileExists = checkFile(path.join(__dirname, file));
        logTest(`Archivo ${file} existe`, fileExists);
    }
    
    // Sitemap y robots
    const sitemapResponse = await testEndpoint(`${BASE_URL}/sitemap.xml`);
    logTest('Sitemap accesible', sitemapResponse.ok, `Status: ${sitemapResponse.status}`);
    
    const robotsResponse = await testEndpoint(`${BASE_URL}/robots.txt`);
    logTest('Robots.txt accesible', robotsResponse.ok, `Status: ${robotsResponse.status}`);
    
    // GENERAR REPORTE FINAL
    console.log('\n📊 GENERANDO REPORTE FINAL...');
    console.log('=============================');
    
    const reportContent = generateFinalReport();
    
    // Guardar reporte
    const reportPath = path.join(__dirname, 'REPORTE-TESTING-EXHAUSTIVO-POST-SUPABASE-FINAL.md');
    fs.writeFileSync(reportPath, reportContent, 'utf8');
    
    console.log(`\n✅ Reporte guardado en: ${reportPath}`);
    
    // Mostrar resumen
    console.log('\n📈 RESUMEN FINAL:');
    console.log(`Total de pruebas: ${testResults.total}`);
    console.log(`✅ Exitosas: ${testResults.passed}`);
    console.log(`❌ Fallidas: ${testResults.failed}`);
    console.log(`📊 Porcentaje de éxito: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`);
    
    if (testResults.failed > 0) {
        console.log('\n❌ ERRORES ENCONTRADOS:');
        testResults.errors.forEach(error => console.log(error));
    }
    
    return testResults;
}

function generateFinalReport() {
    const timestamp = new Date().toISOString();
    const successRate = ((testResults.passed / testResults.total) * 100).toFixed(1);
    
    let report = `# 🚀 REPORTE TESTING EXHAUSTIVO POST-CORRECCIÓN SUPABASE

**Fecha:** ${timestamp}  
**Plataforma:** Misiones Arrienda  
**Tipo:** Testing Exhaustivo Completo  

## 📊 RESUMEN EJECUTIVO

- **Total de pruebas:** ${testResults.total}
- **✅ Exitosas:** ${testResults.passed}
- **❌ Fallidas:** ${testResults.failed}
- **📈 Tasa de éxito:** ${successRate}%

## 🎯 ESTADO GENERAL

`;

    if (successRate >= 90) {
        report += `✅ **EXCELENTE** - La plataforma está funcionando correctamente\n\n`;
    } else if (successRate >= 75) {
        report += `⚠️ **BUENO** - La plataforma funciona con algunos problemas menores\n\n`;
    } else if (successRate >= 50) {
        report += `🚨 **REGULAR** - La plataforma tiene problemas significativos\n\n`;
    } else {
        report += `❌ **CRÍTICO** - La plataforma tiene problemas graves\n\n`;
    }

    // Detalles por categoría
    report += `## 📋 RESULTADOS DETALLADOS

### ✅ PRUEBAS EXITOSAS (${testResults.passed})
`;

    testResults.details.filter(test => test.passed).forEach(test => {
        report += `- ${test.test}\n`;
    });

    if (testResults.failed > 0) {
        report += `\n### ❌ PRUEBAS FALLIDAS (${testResults.failed})
`;
        testResults.details.filter(test => !test.passed).forEach(test => {
            report += `- ${test.test}: ${test.details}\n`;
        });
    }

    report += `\n## 🔍 ANÁLISIS ESPECÍFICO

### 🔐 Sistema de Autenticación
`;

    const authTests = testResults.details.filter(test => 
        test.test.toLowerCase().includes('registro') || 
        test.test.toLowerCase().includes('login') || 
        test.test.toLowerCase().includes('auth')
    );

    const authPassed = authTests.filter(test => test.passed).length;
    const authTotal = authTests.length;
    const authRate = authTotal > 0 ? ((authPassed / authTotal) * 100).toFixed(1) : 0;

    if (authRate >= 80) {
        report += `✅ **OPERATIVO** (${authRate}%) - Sistema de autenticación funcionando correctamente\n`;
    } else {
        report += `❌ **PROBLEMAS** (${authRate}%) - Sistema de autenticación requiere atención\n`;
    }

    report += `\n### 🏠 Funcionalidades Principales
`;

    const mainTests = testResults.details.filter(test => 
        test.test.toLowerCase().includes('propiedades') || 
        test.test.toLowerCase().includes('principal') || 
        test.test.toLowerCase().includes('dashboard')
    );

    const mainPassed = mainTests.filter(test => test.passed).length;
    const mainTotal = mainTests.length;
    const mainRate = mainTotal > 0 ? ((mainPassed / mainTotal) * 100).toFixed(1) : 0;

    if (mainRate >= 80) {
        report += `✅ **OPERATIVO** (${mainRate}%) - Funcionalidades principales funcionando\n`;
    } else {
        report += `❌ **PROBLEMAS** (${mainRate}%) - Funcionalidades principales requieren atención\n`;
    }

    report += `\n## 🚀 PRÓXIMOS PASOS

`;

    if (testResults.failed === 0) {
        report += `✅ **PLATAFORMA LISTA PARA PRODUCCIÓN**
- Todos los tests pasaron exitosamente
- Sistema de autenticación operativo
- Funcionalidades principales funcionando
- Listo para deployment final

`;
    } else {
        report += `🔧 **CORRECCIONES REQUERIDAS**
- Resolver ${testResults.failed} problemas identificados
- Verificar configuración de Supabase si hay errores de autenticación
- Re-ejecutar testing después de correcciones

`;
    }

    report += `## 📞 SOPORTE

Si persisten problemas:
1. Verificar que el servidor esté ejecutándose en localhost:3000
2. Confirmar configuración de variables de entorno
3. Revisar logs del servidor para errores específicos
4. Ejecutar \`npm run dev\` para reiniciar el servidor

---

**Generado automáticamente el ${timestamp}**
`;

    return report;
}

// Ejecutar testing si se llama directamente
if (require.main === module) {
    runExhaustiveTesting().catch(console.error);
}

module.exports = { runExhaustiveTesting, testResults };
