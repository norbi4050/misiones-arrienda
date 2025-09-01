// 41. TESTING EN VIVO CON CREDENCIALES REALES - FINAL
// Fecha: 9 de Enero 2025
// Objetivo: Verificar que el proyecto funciona correctamente con credenciales reales de Supabase

const https = require('https');
const fs = require('fs');

console.log('🚀 INICIANDO TESTING EN VIVO CON CREDENCIALES REALES');
console.log('=' .repeat(60));

// Configuración de testing
const BASE_URL = 'http://localhost:3000';
const TIMEOUT = 10000; // 10 segundos

// Función para hacer peticiones HTTP
function makeRequest(url, method = 'GET', data = null) {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const options = {
            hostname: urlObj.hostname,
            port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
            path: urlObj.pathname + urlObj.search,
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'Testing-Script/1.0'
            },
            timeout: TIMEOUT
        };

        if (data) {
            const postData = JSON.stringify(data);
            options.headers['Content-Length'] = Buffer.byteLength(postData);
        }

        const protocol = urlObj.protocol === 'https:' ? https : require('http');
        const req = protocol.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                resolve({
                    statusCode: res.statusCode,
                    headers: res.headers,
                    body: body,
                    url: url
                });
            });
        });

        req.on('error', (err) => reject(err));
        req.on('timeout', () => {
            req.destroy();
            reject(new Error(`Request timeout for ${url}`));
        });

        if (data) {
            req.write(JSON.stringify(data));
        }
        req.end();
    });
}

// Tests a ejecutar
const tests = [
    {
        name: 'Homepage Principal',
        url: `${BASE_URL}/`,
        expectedStatus: 200,
        description: 'Verificar que la página principal carga correctamente'
    },
    {
        name: 'API Health Check',
        url: `${BASE_URL}/api/health/db`,
        expectedStatus: 200,
        description: 'Verificar conexión con base de datos'
    },
    {
        name: 'API Properties',
        url: `${BASE_URL}/api/properties`,
        expectedStatus: 200,
        description: 'Verificar API de propiedades'
    },
    {
        name: 'Página de Login',
        url: `${BASE_URL}/login`,
        expectedStatus: 200,
        description: 'Verificar página de login'
    },
    {
        name: 'Página de Registro',
        url: `${BASE_URL}/register`,
        expectedStatus: 200,
        description: 'Verificar página de registro'
    },
    {
        name: 'Página de Propiedades',
        url: `${BASE_URL}/properties`,
        expectedStatus: 200,
        description: 'Verificar listado de propiedades'
    },
    {
        name: 'Página de Publicar',
        url: `${BASE_URL}/publicar`,
        expectedStatus: 200,
        description: 'Verificar formulario de publicación'
    },
    {
        name: 'API Stats',
        url: `${BASE_URL}/api/stats`,
        expectedStatus: 200,
        description: 'Verificar API de estadísticas'
    },
    {
        name: 'Página de Comunidad',
        url: `${BASE_URL}/comunidad`,
        expectedStatus: 200,
        description: 'Verificar módulo de comunidad'
    },
    {
        name: 'API Environment Check',
        url: `${BASE_URL}/api/env-check`,
        expectedStatus: 200,
        description: 'Verificar variables de entorno'
    }
];

// Función principal de testing
async function runTests() {
    const results = [];
    let passed = 0;
    let failed = 0;

    console.log(`📋 Ejecutando ${tests.length} tests...\n`);

    for (const test of tests) {
        try {
            console.log(`🔍 Testing: ${test.name}`);
            console.log(`   URL: ${test.url}`);
            
            const startTime = Date.now();
            const response = await makeRequest(test.url);
            const duration = Date.now() - startTime;

            const success = response.statusCode === test.expectedStatus;
            
            if (success) {
                console.log(`   ✅ PASSED (${response.statusCode}) - ${duration}ms`);
                passed++;
            } else {
                console.log(`   ❌ FAILED (${response.statusCode}, expected ${test.expectedStatus}) - ${duration}ms`);
                failed++;
            }

            results.push({
                name: test.name,
                url: test.url,
                description: test.description,
                statusCode: response.statusCode,
                expectedStatus: test.expectedStatus,
                success: success,
                duration: duration,
                responseSize: response.body.length
            });

        } catch (error) {
            console.log(`   ❌ ERROR: ${error.message}`);
            failed++;
            
            results.push({
                name: test.name,
                url: test.url,
                description: test.description,
                statusCode: 'ERROR',
                expectedStatus: test.expectedStatus,
                success: false,
                duration: 0,
                error: error.message
            });
        }
        
        console.log(''); // Línea en blanco
    }

    // Resumen final
    console.log('=' .repeat(60));
    console.log('📊 RESUMEN DE TESTING');
    console.log('=' .repeat(60));
    console.log(`✅ Tests Pasados: ${passed}`);
    console.log(`❌ Tests Fallidos: ${failed}`);
    console.log(`📈 Tasa de Éxito: ${((passed / tests.length) * 100).toFixed(1)}%`);
    console.log('');

    // Análisis detallado
    console.log('📋 ANÁLISIS DETALLADO:');
    console.log('-' .repeat(40));
    
    results.forEach(result => {
        console.log(`${result.success ? '✅' : '❌'} ${result.name}`);
        console.log(`   Status: ${result.statusCode} (esperado: ${result.expectedStatus})`);
        if (result.duration) {
            console.log(`   Tiempo: ${result.duration}ms`);
        }
        if (result.responseSize) {
            console.log(`   Tamaño: ${result.responseSize} bytes`);
        }
        if (result.error) {
            console.log(`   Error: ${result.error}`);
        }
        console.log('');
    });

    // Verificaciones específicas
    console.log('🔍 VERIFICACIONES ESPECÍFICAS:');
    console.log('-' .repeat(40));

    // Verificar que el servidor está funcionando
    const homepageTest = results.find(r => r.name === 'Homepage Principal');
    if (homepageTest && homepageTest.success) {
        console.log('✅ Servidor Next.js funcionando correctamente');
    } else {
        console.log('❌ Problema con el servidor Next.js');
    }

    // Verificar conexión a base de datos
    const dbTest = results.find(r => r.name === 'API Health Check');
    if (dbTest && dbTest.success) {
        console.log('✅ Conexión a base de datos exitosa');
    } else {
        console.log('❌ Problema con conexión a base de datos');
    }

    // Verificar APIs críticas
    const apiTests = results.filter(r => r.name.includes('API'));
    const apiSuccess = apiTests.filter(r => r.success).length;
    console.log(`✅ APIs funcionando: ${apiSuccess}/${apiTests.length}`);

    // Verificar páginas principales
    const pageTests = results.filter(r => r.name.includes('Página'));
    const pageSuccess = pageTests.filter(r => r.success).length;
    console.log(`✅ Páginas funcionando: ${pageSuccess}/${pageTests.length}`);

    // Generar reporte
    const report = {
        timestamp: new Date().toISOString(),
        summary: {
            total: tests.length,
            passed: passed,
            failed: failed,
            successRate: ((passed / tests.length) * 100).toFixed(1) + '%'
        },
        results: results,
        environment: {
            baseUrl: BASE_URL,
            timeout: TIMEOUT,
            nodeVersion: process.version
        }
    };

    // Guardar reporte
    const reportPath = 'Blackbox/42-Reporte-Testing-En-Vivo-Credenciales-Reales-Final.json';
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`📄 Reporte guardado en: ${reportPath}`);

    console.log('');
    console.log('🎯 CONCLUSIÓN:');
    if (passed === tests.length) {
        console.log('🎉 ¡TODOS LOS TESTS PASARON! El proyecto está funcionando correctamente con credenciales reales.');
    } else if (passed >= tests.length * 0.8) {
        console.log('⚠️  La mayoría de tests pasaron. Revisar los fallos menores.');
    } else {
        console.log('🚨 Varios tests fallaron. Se requiere investigación adicional.');
    }

    return report;
}

// Ejecutar tests
if (require.main === module) {
    runTests().catch(console.error);
}

module.exports = { runTests, makeRequest };
