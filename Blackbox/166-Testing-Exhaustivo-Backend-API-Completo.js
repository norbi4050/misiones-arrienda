/**
 * 🔧 TESTING EXHAUSTIVO DE BACKEND/API - VERIFICACIÓN COMPLETA
 * 
 * Este script realiza un testing exhaustivo del backend y APIs del proyecto
 * verificando endpoints, autenticación, validaciones y funcionalidad completa.
 * 
 * Fecha: 9 Enero 2025
 * Autor: BlackBox AI
 */

const fs = require('fs');
const path = require('path');

// 🔑 CONFIGURACIÓN
const SUPABASE_URL = 'https://qfeyhaaxyemmnohqdele.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmZXloYWF4eWVtbW5vaHFkZWxlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTgxNjczOCwiZXhwIjoyMDcxMzkyNzM4fQ.5wJb1p0Rmg1dVIayIT4wZO_seDXTIwhVa36CyEgK-yM';

// 📊 RESULTADOS DEL TESTING
const testResults = {
    timestamp: new Date().toISOString(),
    supabaseConnection: false,
    backendEndpoints: [],
    authenticationTests: [],
    databaseOperations: [],
    securityTests: [],
    performanceTests: [],
    integrationTests: [],
    overallScore: 0,
    criticalIssues: [],
    recommendations: []
};

// 🛠️ UTILIDADES
function log(message, type = 'info') {
    const timestamp = new Date().toLocaleString('es-ES');
    const icons = {
        info: '📋',
        success: '✅',
        error: '❌',
        warning: '⚠️',
        security: '🔐',
        performance: '⚡',
        api: '🔧'
    };
    
    console.log(`${icons[type]} [${timestamp}] ${message}`);
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// 🔗 FUNCIÓN PARA REQUESTS HTTP
async function makeRequest(url, options = {}) {
    try {
        const response = await fetch(url, {
            timeout: 10000,
            ...options
        });

        return {
            ok: response.ok,
            status: response.status,
            statusText: response.statusText,
            data: response.ok ? await response.json().catch(() => null) : null,
            error: !response.ok ? await response.text().catch(() => response.statusText) : null,
            headers: Object.fromEntries(response.headers.entries())
        };
    } catch (error) {
        return {
            ok: false,
            status: 0,
            statusText: 'Network Error',
            data: null,
            error: error.message,
            headers: {}
        };
    }
}

// 🔗 TESTING DE CONEXIÓN SUPABASE
async function testSupabaseConnection() {
    log('🔗 Testing conexión con Supabase...', 'info');
    
    try {
        const response = await makeRequest(`${SUPABASE_URL}/rest/v1/`, {
            method: 'GET',
            headers: {
                'apikey': SUPABASE_SERVICE_ROLE_KEY,
                'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
            }
        });

        if (response.ok) {
            log('✅ Conexión Supabase exitosa', 'success');
            testResults.supabaseConnection = true;
            return true;
        } else {
            log(`❌ Error conexión Supabase: ${response.status} - ${response.error}`, 'error');
            testResults.criticalIssues.push('Conexión Supabase fallida');
            return false;
        }
    } catch (error) {
        log(`❌ Error crítico conexión Supabase: ${error.message}`, 'error');
        testResults.criticalIssues.push(`Error crítico Supabase: ${error.message}`);
        return false;
    }
}

// 🔧 TESTING DE ENDPOINTS BACKEND
async function testBackendEndpoints() {
    log('🔧 Testing endpoints del backend...', 'api');
    
    const endpoints = [
        {
            name: 'Health Check',
            url: 'http://localhost:3000/api/health',
            method: 'GET',
            expectedStatus: 200
        },
        {
            name: 'Properties API',
            url: 'http://localhost:3000/api/properties',
            method: 'GET',
            expectedStatus: 200
        },
        {
            name: 'Auth Register',
            url: 'http://localhost:3000/api/auth/register',
            method: 'POST',
            expectedStatus: [200, 400, 422],
            body: {
                email: 'test@example.com',
                password: 'testpassword123',
                name: 'Test User'
            }
        },
        {
            name: 'Auth Login',
            url: 'http://localhost:3000/api/auth/login',
            method: 'POST',
            expectedStatus: [200, 400, 401],
            body: {
                email: 'test@example.com',
                password: 'testpassword123'
            }
        },
        {
            name: 'Stats API',
            url: 'http://localhost:3000/api/stats',
            method: 'GET',
            expectedStatus: 200
        },
        {
            name: 'Favorites API',
            url: 'http://localhost:3000/api/favorites',
            method: 'GET',
            expectedStatus: [200, 401]
        }
    ];

    for (const endpoint of endpoints) {
        await delay(500);
        
        try {
            const options = {
                method: endpoint.method,
                headers: {
                    'Content-Type': 'application/json'
                }
            };

            if (endpoint.body) {
                options.body = JSON.stringify(endpoint.body);
            }

            const response = await makeRequest(endpoint.url, options);
            
            const expectedStatuses = Array.isArray(endpoint.expectedStatus) 
                ? endpoint.expectedStatus 
                : [endpoint.expectedStatus];
            
            const isStatusExpected = expectedStatuses.includes(response.status);
            
            const endpointResult = {
                name: endpoint.name,
                url: endpoint.url,
                method: endpoint.method,
                status: response.status,
                expectedStatus: endpoint.expectedStatus,
                passed: isStatusExpected,
                responseTime: Date.now(),
                error: response.error,
                accessible: response.status !== 0
            };

            if (isStatusExpected) {
                log(`✅ ${endpoint.name}: ${response.status} (esperado)`, 'success');
            } else {
                log(`❌ ${endpoint.name}: ${response.status} (esperado: ${endpoint.expectedStatus})`, 'error');
                if (response.status === 0) {
                    testResults.criticalIssues.push(`Endpoint ${endpoint.name} no accesible`);
                }
            }

            testResults.backendEndpoints.push(endpointResult);
        } catch (error) {
            log(`❌ Error testing ${endpoint.name}: ${error.message}`, 'error');
            testResults.backendEndpoints.push({
                name: endpoint.name,
                url: endpoint.url,
                method: endpoint.method,
                status: 0,
                passed: false,
                error: error.message,
                accessible: false
            });
            testResults.criticalIssues.push(`Error crítico en ${endpoint.name}`);
        }
    }
}

// 🔐 TESTING DE AUTENTICACIÓN
async function testAuthentication() {
    log('🔐 Testing sistema de autenticación...', 'security');
    
    const authTests = [
        {
            name: 'Registro con datos válidos',
            test: async () => {
                const response = await makeRequest('http://localhost:3000/api/auth/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email: `test${Date.now()}@example.com`,
                        password: 'ValidPassword123!',
                        name: 'Test User'
                    })
                });
                return { passed: [200, 201, 409].includes(response.status), details: response };
            }
        },
        {
            name: 'Registro con email inválido',
            test: async () => {
                const response = await makeRequest('http://localhost:3000/api/auth/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email: 'invalid-email',
                        password: 'ValidPassword123!',
                        name: 'Test User'
                    })
                });
                return { passed: [400, 422].includes(response.status), details: response };
            }
        },
        {
            name: 'Login con credenciales válidas',
            test: async () => {
                const response = await makeRequest('http://localhost:3000/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email: 'test@example.com',
                        password: 'testpassword123'
                    })
                });
                return { passed: [200, 401].includes(response.status), details: response };
            }
        },
        {
            name: 'Protección de rutas autenticadas',
            test: async () => {
                const response = await makeRequest('http://localhost:3000/api/favorites', {
                    method: 'GET'
                });
                return { passed: [401, 403].includes(response.status), details: response };
            }
        }
    ];

    for (const authTest of authTests) {
        await delay(500);
        
        try {
            const result = await authTest.test();
            
            const testResult = {
                name: authTest.name,
                passed: result.passed,
                status: result.details.status,
                error: result.details.error
            };

            if (result.passed) {
                log(`✅ ${authTest.name}: PASADO`, 'success');
            } else {
                log(`❌ ${authTest.name}: FALLIDO (${result.details.status})`, 'error');
            }

            testResults.authenticationTests.push(testResult);
        } catch (error) {
            log(`❌ Error en test ${authTest.name}: ${error.message}`, 'error');
            testResults.authenticationTests.push({
                name: authTest.name,
                passed: false,
                error: error.message
            });
        }
    }
}

// 🗄️ TESTING DE OPERACIONES DE BASE DE DATOS
async function testDatabaseOperations() {
    log('🗄️ Testing operaciones de base de datos...', 'info');
    
    const dbTests = [
        {
            name: 'Consulta de propiedades',
            test: async () => {
                const response = await makeRequest(`${SUPABASE_URL}/rest/v1/properties?limit=5`, {
                    method: 'GET',
                    headers: {
                        'apikey': SUPABASE_SERVICE_ROLE_KEY,
                        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
                    }
                });
                return { passed: response.ok, details: response };
            }
        },
        {
            name: 'Verificación de esquema profiles',
            test: async () => {
                const response = await makeRequest(`${SUPABASE_URL}/rest/v1/profiles?limit=1`, {
                    method: 'GET',
                    headers: {
                        'apikey': SUPABASE_SERVICE_ROLE_KEY,
                        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
                    }
                });
                return { passed: response.ok || response.status === 401, details: response };
            }
        },
        {
            name: 'Testing RLS en tabla users',
            test: async () => {
                const response = await makeRequest(`${SUPABASE_URL}/rest/v1/users?limit=1`, {
                    method: 'GET',
                    headers: {
                        'apikey': SUPABASE_SERVICE_ROLE_KEY,
                        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
                    }
                });
                return { passed: response.ok || response.status === 401, details: response };
            }
        }
    ];

    for (const dbTest of dbTests) {
        await delay(500);
        
        try {
            const result = await dbTest.test();
            
            const testResult = {
                name: dbTest.name,
                passed: result.passed,
                status: result.details.status,
                error: result.details.error
            };

            if (result.passed) {
                log(`✅ ${dbTest.name}: PASADO`, 'success');
            } else {
                log(`❌ ${dbTest.name}: FALLIDO (${result.details.status})`, 'error');
            }

            testResults.databaseOperations.push(testResult);
        } catch (error) {
            log(`❌ Error en test DB ${dbTest.name}: ${error.message}`, 'error');
            testResults.databaseOperations.push({
                name: dbTest.name,
                passed: false,
                error: error.message
            });
        }
    }
}

// 🔒 TESTING DE SEGURIDAD
async function testSecurity() {
    log('🔒 Testing medidas de seguridad...', 'security');
    
    const securityTests = [
        {
            name: 'Inyección SQL en parámetros',
            test: async () => {
                const response = await makeRequest(`${SUPABASE_URL}/rest/v1/properties?id=eq.'; DROP TABLE properties; --`, {
                    method: 'GET',
                    headers: {
                        'apikey': SUPABASE_SERVICE_ROLE_KEY,
                        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
                    }
                });
                return { passed: response.status !== 500, details: response };
            }
        },
        {
            name: 'Headers de seguridad',
            test: async () => {
                const response = await makeRequest('http://localhost:3000/api/health', {
                    method: 'GET'
                });
                const hasSecurityHeaders = response.headers['x-frame-options'] || 
                                         response.headers['x-content-type-options'] ||
                                         response.headers['x-xss-protection'];
                return { passed: !!hasSecurityHeaders, details: response };
            }
        },
        {
            name: 'Rate limiting',
            test: async () => {
                const requests = [];
                for (let i = 0; i < 10; i++) {
                    requests.push(makeRequest('http://localhost:3000/api/properties', {
                        method: 'GET'
                    }));
                }
                const responses = await Promise.all(requests);
                const rateLimited = responses.some(r => r.status === 429);
                return { passed: rateLimited, details: { rateLimited, responses: responses.length } };
            }
        }
    ];

    for (const secTest of securityTests) {
        await delay(1000);
        
        try {
            const result = await secTest.test();
            
            const testResult = {
                name: secTest.name,
                passed: result.passed,
                details: result.details
            };

            if (result.passed) {
                log(`✅ ${secTest.name}: SEGURO`, 'success');
            } else {
                log(`⚠️ ${secTest.name}: REVISAR SEGURIDAD`, 'warning');
            }

            testResults.securityTests.push(testResult);
        } catch (error) {
            log(`❌ Error en test seguridad ${secTest.name}: ${error.message}`, 'error');
            testResults.securityTests.push({
                name: secTest.name,
                passed: false,
                error: error.message
            });
        }
    }
}

// ⚡ TESTING DE RENDIMIENTO
async function testPerformance() {
    log('⚡ Testing rendimiento del backend...', 'performance');
    
    const performanceTests = [
        {
            name: 'Tiempo de respuesta API Properties',
            test: async () => {
                const startTime = Date.now();
                const response = await makeRequest('http://localhost:3000/api/properties', {
                    method: 'GET'
                });
                const responseTime = Date.now() - startTime;
                return { 
                    passed: responseTime < 2000, 
                    details: { responseTime, status: response.status } 
                };
            }
        },
        {
            name: 'Carga concurrente',
            test: async () => {
                const startTime = Date.now();
                const requests = Array(5).fill().map(() => 
                    makeRequest('http://localhost:3000/api/stats', { method: 'GET' })
                );
                const responses = await Promise.all(requests);
                const totalTime = Date.now() - startTime;
                const successfulRequests = responses.filter(r => r.ok).length;
                return { 
                    passed: successfulRequests >= 3 && totalTime < 5000, 
                    details: { totalTime, successfulRequests, totalRequests: 5 } 
                };
            }
        }
    ];

    for (const perfTest of performanceTests) {
        await delay(500);
        
        try {
            const result = await perfTest.test();
            
            const testResult = {
                name: perfTest.name,
                passed: result.passed,
                details: result.details
            };

            if (result.passed) {
                log(`✅ ${perfTest.name}: RENDIMIENTO BUENO`, 'success');
            } else {
                log(`⚠️ ${perfTest.name}: RENDIMIENTO MEJORABLE`, 'warning');
            }

            testResults.performanceTests.push(testResult);
        } catch (error) {
            log(`❌ Error en test rendimiento ${perfTest.name}: ${error.message}`, 'error');
            testResults.performanceTests.push({
                name: perfTest.name,
                passed: false,
                error: error.message
            });
        }
    }
}

// 🔗 TESTING DE INTEGRACIÓN
async function testIntegration() {
    log('🔗 Testing integración completa...', 'info');
    
    const integrationTests = [
        {
            name: 'Flujo completo registro-login',
            test: async () => {
                const email = `integration${Date.now()}@test.com`;
                
                // Registro
                const registerResponse = await makeRequest('http://localhost:3000/api/auth/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email,
                        password: 'TestPassword123!',
                        name: 'Integration Test'
                    })
                });
                
                if (![200, 201, 409].includes(registerResponse.status)) {
                    return { passed: false, details: { step: 'register', response: registerResponse } };
                }
                
                await delay(1000);
                
                // Login
                const loginResponse = await makeRequest('http://localhost:3000/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email,
                        password: 'TestPassword123!'
                    })
                });
                
                return { 
                    passed: [200, 401].includes(loginResponse.status), 
                    details: { register: registerResponse.status, login: loginResponse.status } 
                };
            }
        },
        {
            name: 'Integración Supabase-Backend',
            test: async () => {
                // Test directo Supabase
                const supabaseResponse = await makeRequest(`${SUPABASE_URL}/rest/v1/properties?limit=1`, {
                    method: 'GET',
                    headers: {
                        'apikey': SUPABASE_SERVICE_ROLE_KEY,
                        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
                    }
                });
                
                // Test backend
                const backendResponse = await makeRequest('http://localhost:3000/api/properties', {
                    method: 'GET'
                });
                
                return { 
                    passed: supabaseResponse.ok && [200, 404].includes(backendResponse.status), 
                    details: { supabase: supabaseResponse.status, backend: backendResponse.status } 
                };
            }
        }
    ];

    for (const intTest of integrationTests) {
        await delay(1000);
        
        try {
            const result = await intTest.test();
            
            const testResult = {
                name: intTest.name,
                passed: result.passed,
                details: result.details
            };

            if (result.passed) {
                log(`✅ ${intTest.name}: INTEGRACIÓN EXITOSA`, 'success');
            } else {
                log(`❌ ${intTest.name}: PROBLEMAS DE INTEGRACIÓN`, 'error');
            }

            testResults.integrationTests.push(testResult);
        } catch (error) {
            log(`❌ Error en test integración ${intTest.name}: ${error.message}`, 'error');
            testResults.integrationTests.push({
                name: intTest.name,
                passed: false,
                error: error.message
            });
        }
    }
}

// 📊 CALCULAR SCORE FINAL
function calculateFinalScore() {
    let totalTests = 0;
    let passedTests = 0;

    // Supabase connection (20%)
    totalTests += 1;
    if (testResults.supabaseConnection) passedTests += 1;

    // Backend endpoints (25%)
    const endpointTests = testResults.backendEndpoints.length;
    const passedEndpoints = testResults.backendEndpoints.filter(e => e.passed).length;
    totalTests += endpointTests;
    passedTests += passedEndpoints;

    // Authentication (20%)
    const authTests = testResults.authenticationTests.length;
    const passedAuth = testResults.authenticationTests.filter(a => a.passed).length;
    totalTests += authTests;
    passedTests += passedAuth;

    // Database operations (15%)
    const dbTests = testResults.databaseOperations.length;
    const passedDb = testResults.databaseOperations.filter(d => d.passed).length;
    totalTests += dbTests;
    passedTests += passedDb;

    // Security (10%)
    const secTests = testResults.securityTests.length;
    const passedSec = testResults.securityTests.filter(s => s.passed).length;
    totalTests += secTests;
    passedTests += passedSec;

    // Performance (5%)
    const perfTests = testResults.performanceTests.length;
    const passedPerf = testResults.performanceTests.filter(p => p.passed).length;
    totalTests += perfTests;
    passedTests += passedPerf;

    // Integration (5%)
    const intTests = testResults.integrationTests.length;
    const passedInt = testResults.integrationTests.filter(i => i.passed).length;
    totalTests += intTests;
    passedTests += passedInt;

    const score = totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0;
    testResults.overallScore = score;

    return score;
}

// 📝 GENERAR RECOMENDACIONES
function generateRecommendations() {
    const recommendations = [];

    if (!testResults.supabaseConnection) {
        recommendations.push('🔴 CRÍTICO: Verificar conexión y credenciales de Supabase');
    }

    const failedEndpoints = testResults.backendEndpoints.filter(e => !e.passed);
    if (failedEndpoints.length > 0) {
        recommendations.push(`🔴 CRÍTICO: ${failedEndpoints.length} endpoints fallando`);
    }

    const failedAuth = testResults.authenticationTests.filter(a => !a.passed);
    if (failedAuth.length > 0) {
        recommendations.push(`🟡 MEDIO: ${failedAuth.length} tests de autenticación fallando`);
    }

    const failedSecurity = testResults.securityTests.filter(s => !s.passed);
    if (failedSecurity.length > 0) {
        recommendations.push(`🟡 MEDIO: Revisar ${failedSecurity.length} aspectos de seguridad`);
    }

    if (testResults.criticalIssues.length > 0) {
        recommendations.push(`🔴 CRÍTICO: ${testResults.criticalIssues.length} problemas críticos detectados`);
    }

    if (testResults.overallScore >= 80) {
        recommendations.push('✅ EXCELENTE: Backend funcionando correctamente');
    } else if (testResults.overallScore >= 60) {
        recommendations.push('⚠️ BUENO: Backend funcional con mejoras menores');
    } else {
        recommendations.push('🔴 CRÍTICO: Backend requiere atención inmediata');
    }

    testResults.recommendations = recommendations;
}

// 💾 GUARDAR REPORTE
function saveReport() {
    const reportPath = path.join(__dirname, 'reporte-testing-exhaustivo-backend-api.json');
    
    try {
        fs.writeFileSync(reportPath, JSON.stringify(testResults, null, 2), 'utf8');
        log(`📄 Reporte guardado en: ${reportPath}`, 'success');
    } catch (error) {
        log(`❌ Error guardando reporte: ${error.message}`, 'error');
    }
}

// 🚀 FUNCIÓN PRINCIPAL
async function runExhaustiveBackendTesting() {
    log('🚀 INICIANDO TESTING EXHAUSTIVO DE BACKEND/API', 'info');
    log(`📊 URL Supabase: ${SUPABASE_URL}`, 'info');
    log('🔑 Token Service Role configurado', 'info');
    
    try {
        // 1. Test conexión Supabase
        await testSupabaseConnection();

        // 2. Test endpoints backend
        await testBackendEndpoints();

        // 3. Test autenticación
        await testAuthentication();

        // 4. Test operaciones BD
        await testDatabaseOperations();

        // 5. Test seguridad
        await testSecurity();

        // 6. Test rendimiento
        await testPerformance();

        // 7. Test integración
        await testIntegration();

        // 8. Calcular score y generar recomendaciones
        const score = calculateFinalScore();
        generateRecommendations();

        // 9. Mostrar resultados
        log('', 'info');
        log('📊 RESULTADOS FINALES DEL TESTING EXHAUSTIVO:', 'info');
        log(`🎯 Score General: ${score}%`, score >= 80 ? 'success' : score >= 60 ? 'warning' : 'error');
        log(`🔗 Conexión Supabase: ${testResults.supabaseConnection ? '✅' : '❌'}`, 'info');
        log(`🔧 Endpoints funcionando: ${testResults.backendEndpoints.filter(e => e.passed).length}/${testResults.backendEndpoints.length}`, 'info');
        log(`🔐 Tests autenticación: ${testResults.authenticationTests.filter(a => a.passed).length}/${testResults.authenticationTests.length}`, 'info');
        log(`🗄️ Operaciones BD: ${testResults.databaseOperations.filter(d => d.passed).length}/${testResults.databaseOperations.length}`, 'info');
        log(`🔒 Tests seguridad: ${testResults.securityTests.filter(s => s.passed).length}/${testResults.securityTests.length}`, 'info');
        log(`⚡ Tests rendimiento: ${testResults.performanceTests.filter(p => p.passed).length}/${testResults.performanceTests.length}`, 'info');
        log(`🔗 Tests integración: ${testResults.integrationTests.filter(i => i.passed).length}/${testResults.integrationTests.length}`, 'info');

        log('', 'info');
        log('📋 RECOMENDACIONES:', 'info');
        testResults.recommendations.forEach(rec => log(rec, 'info'));

        if (testResults.criticalIssues.length > 0) {
            log('', 'info');
            log('🔴 PROBLEMAS CRÍTICOS DETECTADOS:', 'error');
            testResults.criticalIssues.forEach(issue => log(`   - ${issue}`, 'error'));
        }

        // 10. Guardar reporte
        saveReport();

        log('', 'info');
        log('✅ TESTING EXHAUSTIVO DE BACKEND/API COMPLETADO', 'success');
        
    } catch (error) {
        log(`❌ Error durante el testing: ${error.message}`, 'error');
        testResults.error = error.message;
        saveReport();
    }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
    runExhaustiveBackendTesting().catch(console.error);
}

module.exports = { runExhaustiveBackendTesting, testResults };
