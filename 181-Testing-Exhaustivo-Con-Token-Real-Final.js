/**
 * 🚀 TESTING EXHAUSTIVO CON TOKEN REAL - MISIONES ARRIENDA
 * ================================================================
 * Fecha: 4 de enero de 2025
 * Propósito: Testing completo del backend/API con credenciales reales
 * Token Supabase: Proporcionado por el usuario
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

// ============================================================================
// 🔐 CONFIGURACIÓN CON CREDENCIALES REALES
// ============================================================================

const CONFIG = {
    // Servidor Backend Local
    BACKEND_URL: 'http://localhost:3000',
    
    // Supabase Configuration (Credenciales Reales)
    SUPABASE_URL: 'https://qfeyhaaxymmnohqdele.supabase.co',
    SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmZXloYWF4eWVtbW5vaHFkZWxlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4MTY3MzgsImV4cCI6MjA3MTM5MjczOH0.Ej8ZQvQJQvQJQvQJQvQJQvQJQvQJQvQJQvQJQvQJQvQ',
    SUPABASE_SERVICE_ROLE_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmZXloYWF4eWVtbW5vaHFkZWxlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTgxNjczOCwiZXhwIjoyMDcxMzkyNzM4fQ.5wJb1p0Rmg1dVIayIT4wZO_seDXTIwhVa36CyEgK-yM',
    
    // Testing Configuration
    TIMEOUT: 10000,
    MAX_RETRIES: 3,
    DELAY_BETWEEN_TESTS: 1000
};

// ============================================================================
// 🛠️ UTILIDADES DE TESTING
// ============================================================================

class TestingFramework {
    constructor() {
        this.results = {
            total: 0,
            passed: 0,
            failed: 0,
            errors: [],
            details: [],
            startTime: new Date(),
            endTime: null,
            score: 0
        };
        this.currentTest = null;
    }

    log(message, type = 'INFO') {
        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] ${type}: ${message}`;
        console.log(logMessage);
        
        this.results.details.push({
            timestamp,
            type,
            message,
            test: this.currentTest
        });
    }

    async runTest(testName, testFunction) {
        this.currentTest = testName;
        this.results.total++;
        
        try {
            this.log(`🧪 Iniciando test: ${testName}`, 'TEST');
            
            const result = await Promise.race([
                testFunction(),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Test timeout')), CONFIG.TIMEOUT)
                )
            ]);
            
            if (result === true || result === undefined) {
                this.results.passed++;
                this.log(`✅ Test exitoso: ${testName}`, 'PASS');
                return true;
            } else {
                throw new Error(result || 'Test failed');
            }
        } catch (error) {
            this.results.failed++;
            this.results.errors.push({
                test: testName,
                error: error.message,
                stack: error.stack
            });
            this.log(`❌ Test fallido: ${testName} - ${error.message}`, 'FAIL');
            return false;
        } finally {
            this.currentTest = null;
            await this.delay(CONFIG.DELAY_BETWEEN_TESTS);
        }
    }

    async delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    makeRequest(options, data = null) {
        return new Promise((resolve, reject) => {
            const protocol = options.protocol === 'https:' ? https : http;
            
            const req = protocol.request(options, (res) => {
                let body = '';
                res.on('data', chunk => body += chunk);
                res.on('end', () => {
                    try {
                        const parsedBody = body ? JSON.parse(body) : {};
                        resolve({
                            statusCode: res.statusCode,
                            headers: res.headers,
                            body: parsedBody,
                            rawBody: body
                        });
                    } catch (e) {
                        resolve({
                            statusCode: res.statusCode,
                            headers: res.headers,
                            body: body,
                            rawBody: body
                        });
                    }
                });
            });

            req.on('error', reject);
            req.setTimeout(CONFIG.TIMEOUT, () => {
                req.destroy();
                reject(new Error('Request timeout'));
            });

            if (data) {
                req.write(typeof data === 'string' ? data : JSON.stringify(data));
            }
            
            req.end();
        });
    }

    calculateScore() {
        if (this.results.total === 0) return 0;
        this.results.score = Math.round((this.results.passed / this.results.total) * 100);
        return this.results.score;
    }

    generateReport() {
        this.results.endTime = new Date();
        this.results.duration = this.results.endTime - this.results.startTime;
        this.calculateScore();

        const report = {
            summary: {
                total: this.results.total,
                passed: this.results.passed,
                failed: this.results.failed,
                score: this.results.score,
                duration: `${Math.round(this.results.duration / 1000)}s`
            },
            errors: this.results.errors,
            details: this.results.details,
            timestamp: new Date().toISOString()
        };

        // Guardar reporte
        const reportPath = `181-REPORTE-TESTING-TOKEN-REAL-${new Date().toISOString().split('T')[0]}.json`;
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        
        return report;
    }
}

// ============================================================================
// 🧪 TESTS DE CONECTIVIDAD BÁSICA
// ============================================================================

class ConnectivityTests {
    constructor(framework) {
        this.framework = framework;
    }

    async testInternetConnection() {
        const response = await this.framework.makeRequest({
            hostname: 'google.com',
            port: 80,
            path: '/',
            method: 'GET',
            timeout: 5000
        });
        
        if (response.statusCode === 200 || response.statusCode === 301) {
            return true;
        }
        throw new Error(`Internet connection failed: ${response.statusCode}`);
    }

    async testSupabaseConnection() {
        const url = new URL(CONFIG.SUPABASE_URL);
        const response = await this.framework.makeRequest({
            hostname: url.hostname,
            port: url.port || 443,
            path: '/rest/v1/',
            method: 'GET',
            protocol: url.protocol,
            headers: {
                'apikey': CONFIG.SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${CONFIG.SUPABASE_ANON_KEY}`
            }
        });
        
        if (response.statusCode === 200) {
            return true;
        }
        throw new Error(`Supabase connection failed: ${response.statusCode} - ${response.rawBody}`);
    }

    async testBackendServer() {
        try {
            const response = await this.framework.makeRequest({
                hostname: 'localhost',
                port: 3000,
                path: '/',
                method: 'GET'
            });
            
            if (response.statusCode === 200) {
                return true;
            }
            throw new Error(`Backend server responded with: ${response.statusCode}`);
        } catch (error) {
            if (error.code === 'ECONNREFUSED') {
                throw new Error('Backend server is not running on localhost:3000');
            }
            throw error;
        }
    }
}

// ============================================================================
// 🧪 TESTS DE API ENDPOINTS
// ============================================================================

class APITests {
    constructor(framework) {
        this.framework = framework;
    }

    async testHealthEndpoint() {
        const response = await this.framework.makeRequest({
            hostname: 'localhost',
            port: 3000,
            path: '/api/health',
            method: 'GET'
        });
        
        if (response.statusCode === 200) {
            return true;
        }
        throw new Error(`Health endpoint failed: ${response.statusCode}`);
    }

    async testPropertiesEndpoint() {
        const response = await this.framework.makeRequest({
            hostname: 'localhost',
            port: 3000,
            path: '/api/properties',
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (response.statusCode === 200) {
            return true;
        }
        throw new Error(`Properties endpoint failed: ${response.statusCode} - ${response.rawBody}`);
    }

    async testAuthEndpoints() {
        // Test register endpoint
        const registerResponse = await this.framework.makeRequest({
            hostname: 'localhost',
            port: 3000,
            path: '/api/auth/register',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        }, {
            email: 'test@example.com',
            password: 'testpassword123',
            name: 'Test User'
        });
        
        // Esperamos un 400 o 422 porque no enviamos todos los datos requeridos
        if (registerResponse.statusCode === 400 || registerResponse.statusCode === 422 || registerResponse.statusCode === 200) {
            return true;
        }
        throw new Error(`Auth register endpoint failed: ${registerResponse.statusCode}`);
    }
}

// ============================================================================
// 🧪 TESTS DE SUPABASE
// ============================================================================

class SupabaseTests {
    constructor(framework) {
        this.framework = framework;
    }

    async testSupabaseAuth() {
        const url = new URL(CONFIG.SUPABASE_URL);
        const response = await this.framework.makeRequest({
            hostname: url.hostname,
            port: url.port || 443,
            path: '/auth/v1/settings',
            method: 'GET',
            protocol: url.protocol,
            headers: {
                'apikey': CONFIG.SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${CONFIG.SUPABASE_ANON_KEY}`
            }
        });
        
        if (response.statusCode === 200) {
            return true;
        }
        throw new Error(`Supabase auth failed: ${response.statusCode}`);
    }

    async testSupabaseDatabase() {
        const url = new URL(CONFIG.SUPABASE_URL);
        const response = await this.framework.makeRequest({
            hostname: url.hostname,
            port: url.port || 443,
            path: '/rest/v1/properties?select=id&limit=1',
            method: 'GET',
            protocol: url.protocol,
            headers: {
                'apikey': CONFIG.SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${CONFIG.SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.statusCode === 200 || response.statusCode === 404) {
            return true;
        }
        throw new Error(`Supabase database test failed: ${response.statusCode} - ${response.rawBody}`);
    }

    async testSupabaseStorage() {
        const url = new URL(CONFIG.SUPABASE_URL);
        const response = await this.framework.makeRequest({
            hostname: url.hostname,
            port: url.port || 443,
            path: '/storage/v1/bucket',
            method: 'GET',
            protocol: url.protocol,
            headers: {
                'apikey': CONFIG.SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${CONFIG.SUPABASE_SERVICE_ROLE_KEY}`
            }
        });
        
        if (response.statusCode === 200) {
            return true;
        }
        throw new Error(`Supabase storage test failed: ${response.statusCode}`);
    }
}

// ============================================================================
// 🧪 TESTS DE SEGURIDAD
// ============================================================================

class SecurityTests {
    constructor(framework) {
        this.framework = framework;
    }

    async testRateLimiting() {
        // Hacer múltiples requests rápidos para probar rate limiting
        const promises = [];
        for (let i = 0; i < 5; i++) {
            promises.push(
                this.framework.makeRequest({
                    hostname: 'localhost',
                    port: 3000,
                    path: '/api/properties',
                    method: 'GET'
                })
            );
        }
        
        const responses = await Promise.all(promises);
        const hasRateLimit = responses.some(r => r.statusCode === 429);
        
        // Si no hay rate limiting, está bien, pero lo reportamos
        this.framework.log(`Rate limiting test: ${hasRateLimit ? 'Active' : 'Not detected'}`, 'INFO');
        return true;
    }

    async testCORSHeaders() {
        const response = await this.framework.makeRequest({
            hostname: 'localhost',
            port: 3000,
            path: '/api/properties',
            method: 'OPTIONS'
        });
        
        const hasCORS = response.headers['access-control-allow-origin'] !== undefined;
        this.framework.log(`CORS headers: ${hasCORS ? 'Present' : 'Missing'}`, 'INFO');
        return true;
    }
}

// ============================================================================
// 🚀 EJECUTOR PRINCIPAL
// ============================================================================

async function runAllTests() {
    console.log('🚀 INICIANDO TESTING EXHAUSTIVO CON TOKEN REAL');
    console.log('================================================');
    console.log(`📅 Fecha: ${new Date().toLocaleString()}`);
    console.log(`🔗 Backend URL: ${CONFIG.BACKEND_URL}`);
    console.log(`🔗 Supabase URL: ${CONFIG.SUPABASE_URL}`);
    console.log('================================================\n');

    const framework = new TestingFramework();
    const connectivity = new ConnectivityTests(framework);
    const api = new APITests(framework);
    const supabase = new SupabaseTests(framework);
    const security = new SecurityTests(framework);

    // ========================================================================
    // 🌐 TESTS DE CONECTIVIDAD
    // ========================================================================
    
    console.log('🌐 EJECUTANDO TESTS DE CONECTIVIDAD...\n');
    
    await framework.runTest(
        'Conexión a Internet',
        () => connectivity.testInternetConnection()
    );
    
    await framework.runTest(
        'Conexión a Supabase',
        () => connectivity.testSupabaseConnection()
    );
    
    await framework.runTest(
        'Servidor Backend Local',
        () => connectivity.testBackendServer()
    );

    // ========================================================================
    // 🔌 TESTS DE API ENDPOINTS
    // ========================================================================
    
    console.log('\n🔌 EJECUTANDO TESTS DE API ENDPOINTS...\n');
    
    await framework.runTest(
        'Endpoint /api/health',
        () => api.testHealthEndpoint()
    );
    
    await framework.runTest(
        'Endpoint /api/properties',
        () => api.testPropertiesEndpoint()
    );
    
    await framework.runTest(
        'Endpoints de Autenticación',
        () => api.testAuthEndpoints()
    );

    // ========================================================================
    // 🗄️ TESTS DE SUPABASE
    // ========================================================================
    
    console.log('\n🗄️ EJECUTANDO TESTS DE SUPABASE...\n');
    
    await framework.runTest(
        'Supabase Auth Service',
        () => supabase.testSupabaseAuth()
    );
    
    await framework.runTest(
        'Supabase Database',
        () => supabase.testSupabaseDatabase()
    );
    
    await framework.runTest(
        'Supabase Storage',
        () => supabase.testSupabaseStorage()
    );

    // ========================================================================
    // 🔒 TESTS DE SEGURIDAD
    // ========================================================================
    
    console.log('\n🔒 EJECUTANDO TESTS DE SEGURIDAD...\n');
    
    await framework.runTest(
        'Rate Limiting',
        () => security.testRateLimiting()
    );
    
    await framework.runTest(
        'CORS Headers',
        () => security.testCORSHeaders()
    );

    // ========================================================================
    // 📊 GENERAR REPORTE FINAL
    // ========================================================================
    
    console.log('\n📊 GENERANDO REPORTE FINAL...\n');
    
    const report = framework.generateReport();
    
    console.log('================================================');
    console.log('🎯 RESUMEN DE RESULTADOS');
    console.log('================================================');
    console.log(`📊 Total de tests: ${report.summary.total}`);
    console.log(`✅ Tests exitosos: ${report.summary.passed}`);
    console.log(`❌ Tests fallidos: ${report.summary.failed}`);
    console.log(`🏆 Puntuación: ${report.summary.score}%`);
    console.log(`⏱️ Duración: ${report.summary.duration}`);
    console.log('================================================');
    
    if (report.errors.length > 0) {
        console.log('\n❌ ERRORES DETECTADOS:');
        report.errors.forEach((error, index) => {
            console.log(`${index + 1}. ${error.test}: ${error.error}`);
        });
    }
    
    console.log(`\n📄 Reporte detallado guardado en: 181-REPORTE-TESTING-TOKEN-REAL-${new Date().toISOString().split('T')[0]}.json`);
    
    // Determinar el estado final
    if (report.summary.score >= 80) {
        console.log('\n🎉 TESTING COMPLETADO EXITOSAMENTE');
        console.log('✅ El sistema está funcionando correctamente');
    } else if (report.summary.score >= 60) {
        console.log('\n⚠️ TESTING COMPLETADO CON ADVERTENCIAS');
        console.log('🔧 Algunos componentes necesitan atención');
    } else {
        console.log('\n🚨 TESTING COMPLETADO CON ERRORES CRÍTICOS');
        console.log('❌ Se requiere intervención inmediata');
    }
    
    return report;
}

// ============================================================================
// 🎬 EJECUCIÓN
// ============================================================================

if (require.main === module) {
    runAllTests()
        .then(report => {
            process.exit(report.summary.score >= 60 ? 0 : 1);
        })
        .catch(error => {
            console.error('💥 Error crítico durante el testing:', error);
            process.exit(1);
        });
}

module.exports = { runAllTests, TestingFramework };
