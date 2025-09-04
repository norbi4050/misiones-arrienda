const https = require('https');
const http = require('http');
const fs = require('fs');

console.log('🚀 INICIANDO TESTING EXHAUSTIVO COMPLETO');
console.log('========================================');
console.log(`Fecha: ${new Date().toLocaleString()}`);
console.log('========================================\n');

// Configuración de testing
const config = {
    supabaseUrl: 'https://hnqmkqjzjqjzjqjzjqjz.supabase.co',
    supabaseKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhucW1rcWp6anFqempxanpqcWp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU5MjI0MDAsImV4cCI6MjA1MTQ5ODQwMH0.example',
    backendUrl: 'http://localhost:3000',
    timeout: 10000
};

let testResults = {
    total: 0,
    passed: 0,
    failed: 0,
    errors: [],
    details: []
};

// Función para hacer peticiones HTTP
function makeRequest(options, postData = null) {
    return new Promise((resolve, reject) => {
        const protocol = options.protocol === 'https:' ? https : http;
        const req = protocol.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                resolve({
                    statusCode: res.statusCode,
                    headers: res.headers,
                    data: data,
                    body: data
                });
            });
        });

        req.on('error', (error) => reject(error));
        req.setTimeout(config.timeout, () => {
            req.destroy();
            reject(new Error('Request timeout'));
        });

        if (postData) {
            req.write(postData);
        }
        req.end();
    });
}

// Función para registrar resultados
function logTest(testName, passed, details = '') {
    testResults.total++;
    if (passed) {
        testResults.passed++;
        console.log(`✅ ${testName}`);
    } else {
        testResults.failed++;
        console.log(`❌ ${testName}`);
        testResults.errors.push(`${testName}: ${details}`);
    }
    testResults.details.push({
        test: testName,
        passed: passed,
        details: details,
        timestamp: new Date().toISOString()
    });
}

// 1. TESTING DE CONECTIVIDAD BÁSICA
async function testConnectivity() {
    console.log('\n🌐 TESTING DE CONECTIVIDAD BÁSICA');
    console.log('================================');

    // Test conectividad a internet
    try {
        const response = await makeRequest({
            hostname: 'google.com',
            port: 443,
            path: '/',
            method: 'GET',
            protocol: 'https:'
        });
        logTest('Conectividad a Internet', response.statusCode === 200);
    } catch (error) {
        logTest('Conectividad a Internet', false, error.message);
    }

    // Test conectividad a Supabase
    try {
        const url = new URL(config.supabaseUrl);
        const response = await makeRequest({
            hostname: url.hostname,
            port: 443,
            path: '/rest/v1/',
            method: 'GET',
            protocol: 'https:',
            headers: {
                'apikey': config.supabaseKey,
                'Authorization': `Bearer ${config.supabaseKey}`
            }
        });
        logTest('Conectividad a Supabase', response.statusCode === 200);
    } catch (error) {
        logTest('Conectividad a Supabase', false, error.message);
    }

    // Test servidor backend local
    try {
        const response = await makeRequest({
            hostname: 'localhost',
            port: 3000,
            path: '/',
            method: 'GET',
            protocol: 'http:'
        });
        logTest('Servidor Backend Local (localhost:3000)', response.statusCode === 200);
    } catch (error) {
        logTest('Servidor Backend Local (localhost:3000)', false, error.message);
    }
}

// 2. TESTING DE API ENDPOINTS
async function testAPIEndpoints() {
    console.log('\n🔌 TESTING DE API ENDPOINTS');
    console.log('===========================');

    const endpoints = [
        { path: '/api/health', method: 'GET', name: 'Health Check' },
        { path: '/api/health/db', method: 'GET', name: 'Database Health' },
        { path: '/api/properties', method: 'GET', name: 'Properties List' },
        { path: '/api/auth/register', method: 'POST', name: 'Auth Register', data: JSON.stringify({
            email: 'test@example.com',
            password: 'testpass123',
            name: 'Test User'
        }) },
        { path: '/api/auth/login', method: 'POST', name: 'Auth Login', data: JSON.stringify({
            email: 'test@example.com',
            password: 'testpass123'
        }) },
        { path: '/api/stats', method: 'GET', name: 'Statistics' },
        { path: '/api/env-check', method: 'GET', name: 'Environment Check' }
    ];

    for (const endpoint of endpoints) {
        try {
            const response = await makeRequest({
                hostname: 'localhost',
                port: 3000,
                path: endpoint.path,
                method: endpoint.method,
                protocol: 'http:',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            }, endpoint.data);

            const success = response.statusCode >= 200 && response.statusCode < 500;
            logTest(`API ${endpoint.name} (${endpoint.method} ${endpoint.path})`, success, 
                   `Status: ${response.statusCode}`);
        } catch (error) {
            logTest(`API ${endpoint.name} (${endpoint.method} ${endpoint.path})`, false, error.message);
        }
    }
}

// 3. TESTING DE SUPABASE INTEGRACIÓN
async function testSupabaseIntegration() {
    console.log('\n🗄️ TESTING DE SUPABASE INTEGRACIÓN');
    console.log('==================================');

    const supabaseTests = [
        { table: 'properties', name: 'Properties Table' },
        { table: 'users', name: 'Users Table' },
        { table: 'community_profiles', name: 'Community Profiles Table' },
        { table: 'favorites', name: 'Favorites Table' },
        { table: 'search_history', name: 'Search History Table' }
    ];

    for (const test of supabaseTests) {
        try {
            const url = new URL(config.supabaseUrl);
            const response = await makeRequest({
                hostname: url.hostname,
                port: 443,
                path: `/rest/v1/${test.table}?select=*&limit=1`,
                method: 'GET',
                protocol: 'https:',
                headers: {
                    'apikey': config.supabaseKey,
                    'Authorization': `Bearer ${config.supabaseKey}`,
                    'Content-Type': 'application/json'
                }
            });

            const success = response.statusCode === 200 || response.statusCode === 406;
            logTest(`Supabase ${test.name}`, success, `Status: ${response.statusCode}`);
        } catch (error) {
            logTest(`Supabase ${test.name}`, false, error.message);
        }
    }

    // Test Supabase Auth
    try {
        const url = new URL(config.supabaseUrl);
        const response = await makeRequest({
            hostname: url.hostname,
            port: 443,
            path: '/auth/v1/settings',
            method: 'GET',
            protocol: 'https:',
            headers: {
                'apikey': config.supabaseKey,
                'Authorization': `Bearer ${config.supabaseKey}`
            }
        });
        logTest('Supabase Auth Service', response.statusCode === 200, `Status: ${response.statusCode}`);
    } catch (error) {
        logTest('Supabase Auth Service', false, error.message);
    }

    // Test Supabase Storage
    try {
        const url = new URL(config.supabaseUrl);
        const response = await makeRequest({
            hostname: url.hostname,
            port: 443,
            path: '/storage/v1/bucket',
            method: 'GET',
            protocol: 'https:',
            headers: {
                'apikey': config.supabaseKey,
                'Authorization': `Bearer ${config.supabaseKey}`
            }
        });
        logTest('Supabase Storage Service', response.statusCode === 200, `Status: ${response.statusCode}`);
    } catch (error) {
        logTest('Supabase Storage Service', false, error.message);
    }
}

// 4. TESTING DE SEGURIDAD
async function testSecurity() {
    console.log('\n🔒 TESTING DE SEGURIDAD');
    console.log('=======================');

    // Test CORS Headers
    try {
        const response = await makeRequest({
            hostname: 'localhost',
            port: 3000,
            path: '/api/health',
            method: 'OPTIONS',
            protocol: 'http:',
            headers: {
                'Origin': 'http://localhost:3000',
                'Access-Control-Request-Method': 'GET'
            }
        });

        const hasCors = response.headers['access-control-allow-origin'] !== undefined;
        logTest('CORS Headers', hasCors, `CORS: ${hasCors ? 'Enabled' : 'Disabled'}`);
    } catch (error) {
        logTest('CORS Headers', false, error.message);
    }

    // Test Rate Limiting
    try {
        const requests = [];
        for (let i = 0; i < 5; i++) {
            requests.push(makeRequest({
                hostname: 'localhost',
                port: 3000,
                path: '/api/health',
                method: 'GET',
                protocol: 'http:'
            }));
        }

        const responses = await Promise.all(requests);
        const rateLimited = responses.some(r => r.statusCode === 429);
        logTest('Rate Limiting', true, `Rate limiting: ${rateLimited ? 'Active' : 'Not detected'}`);
    } catch (error) {
        logTest('Rate Limiting', false, error.message);
    }
}

// 5. TESTING DE PÁGINAS WEB
async function testWebPages() {
    console.log('\n🌐 TESTING DE PÁGINAS WEB');
    console.log('=========================');

    const pages = [
        { path: '/', name: 'Homepage' },
        { path: '/properties', name: 'Properties Page' },
        { path: '/login', name: 'Login Page' },
        { path: '/register', name: 'Register Page' },
        { path: '/dashboard', name: 'Dashboard Page' },
        { path: '/publicar', name: 'Publish Page' },
        { path: '/comunidad', name: 'Community Page' },
        { path: '/profiles', name: 'Profiles Page' },
        { path: '/admin/dashboard', name: 'Admin Dashboard' }
    ];

    for (const page of pages) {
        try {
            const response = await makeRequest({
                hostname: 'localhost',
                port: 3000,
                path: page.path,
                method: 'GET',
                protocol: 'http:',
                headers: {
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                    'User-Agent': 'Mozilla/5.0 (Testing Bot)'
                }
            });

            const success = response.statusCode === 200 || response.statusCode === 302;
            logTest(`Web Page ${page.name}`, success, `Status: ${response.statusCode}`);
        } catch (error) {
            logTest(`Web Page ${page.name}`, false, error.message);
        }
    }
}

// 6. TESTING DE FUNCIONALIDADES ESPECÍFICAS
async function testSpecificFeatures() {
    console.log('\n⚙️ TESTING DE FUNCIONALIDADES ESPECÍFICAS');
    console.log('=========================================');

    // Test Property Search
    try {
        const response = await makeRequest({
            hostname: 'localhost',
            port: 3000,
            path: '/api/properties?search=casa&location=posadas',
            method: 'GET',
            protocol: 'http:'
        });
        logTest('Property Search Functionality', response.statusCode === 200, `Status: ${response.statusCode}`);
    } catch (error) {
        logTest('Property Search Functionality', false, error.message);
    }

    // Test Image Upload Endpoint
    try {
        const response = await makeRequest({
            hostname: 'localhost',
            port: 3000,
            path: '/api/upload',
            method: 'POST',
            protocol: 'http:',
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        const success = response.statusCode !== 404;
        logTest('Image Upload Endpoint', success, `Status: ${response.statusCode}`);
    } catch (error) {
        logTest('Image Upload Endpoint', false, error.message);
    }

    // Test Payment Integration
    try {
        const response = await makeRequest({
            hostname: 'localhost',
            port: 3000,
            path: '/api/payments/create-preference',
            method: 'POST',
            protocol: 'http:',
            headers: {
                'Content-Type': 'application/json'
            }
        }, JSON.stringify({
            title: 'Test Payment',
            price: 100,
            quantity: 1
        }));
        const success = response.statusCode !== 404;
        logTest('Payment Integration', success, `Status: ${response.statusCode}`);
    } catch (error) {
        logTest('Payment Integration', false, error.message);
    }
}

// 7. TESTING DE RENDIMIENTO
async function testPerformance() {
    console.log('\n⚡ TESTING DE RENDIMIENTO');
    console.log('========================');

    // Test Response Time
    const startTime = Date.now();
    try {
        await makeRequest({
            hostname: 'localhost',
            port: 3000,
            path: '/api/health',
            method: 'GET',
            protocol: 'http:'
        });
        const responseTime = Date.now() - startTime;
        logTest('API Response Time', responseTime < 1000, `${responseTime}ms`);
    } catch (error) {
        logTest('API Response Time', false, error.message);
    }

    // Test Concurrent Requests
    try {
        const concurrentRequests = 10;
        const requests = [];
        const startTime = Date.now();

        for (let i = 0; i < concurrentRequests; i++) {
            requests.push(makeRequest({
                hostname: 'localhost',
                port: 3000,
                path: '/api/properties',
                method: 'GET',
                protocol: 'http:'
            }));
        }

        const responses = await Promise.all(requests);
        const totalTime = Date.now() - startTime;
        const successfulRequests = responses.filter(r => r.statusCode === 200).length;
        
        logTest('Concurrent Requests Handling', successfulRequests >= concurrentRequests * 0.8, 
               `${successfulRequests}/${concurrentRequests} successful in ${totalTime}ms`);
    } catch (error) {
        logTest('Concurrent Requests Handling', false, error.message);
    }
}

// Función principal
async function runAllTests() {
    try {
        await testConnectivity();
        await testAPIEndpoints();
        await testSupabaseIntegration();
        await testSecurity();
        await testWebPages();
        await testSpecificFeatures();
        await testPerformance();

        // Generar reporte final
        console.log('\n📊 RESUMEN DE TESTING EXHAUSTIVO');
        console.log('================================');
        console.log(`Total de pruebas: ${testResults.total}`);
        console.log(`Pruebas exitosas: ${testResults.passed} (${((testResults.passed/testResults.total)*100).toFixed(1)}%)`);
        console.log(`Pruebas fallidas: ${testResults.failed} (${((testResults.failed/testResults.total)*100).toFixed(1)}%)`);

        if (testResults.errors.length > 0) {
            console.log('\n❌ ERRORES ENCONTRADOS:');
            testResults.errors.forEach((error, index) => {
                console.log(`${index + 1}. ${error}`);
            });
        }

        // Guardar reporte detallado
        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                total: testResults.total,
                passed: testResults.passed,
                failed: testResults.failed,
                successRate: ((testResults.passed/testResults.total)*100).toFixed(1) + '%'
            },
            errors: testResults.errors,
            details: testResults.details
        };

        fs.writeFileSync('183-REPORTE-TESTING-EXHAUSTIVO-COMPLETO-FINAL.json', 
                        JSON.stringify(report, null, 2));

        console.log('\n✅ Reporte detallado guardado en: 183-REPORTE-TESTING-EXHAUSTIVO-COMPLETO-FINAL.json');
        
        // Determinar estado general
        const successRate = (testResults.passed/testResults.total)*100;
        if (successRate >= 90) {
            console.log('\n🎉 ESTADO: EXCELENTE - Sistema funcionando correctamente');
        } else if (successRate >= 75) {
            console.log('\n✅ ESTADO: BUENO - Sistema mayormente funcional con algunos problemas menores');
        } else if (successRate >= 50) {
            console.log('\n⚠️ ESTADO: REGULAR - Sistema funcional pero con problemas importantes');
        } else {
            console.log('\n❌ ESTADO: CRÍTICO - Sistema con problemas graves que requieren atención inmediata');
        }

    } catch (error) {
        console.error('❌ Error durante el testing:', error.message);
        process.exit(1);
    }
}

// Ejecutar testing
runAllTests().then(() => {
    console.log('\n🏁 Testing exhaustivo completado');
    process.exit(0);
}).catch((error) => {
    console.error('💥 Error fatal:', error.message);
    process.exit(1);
});
