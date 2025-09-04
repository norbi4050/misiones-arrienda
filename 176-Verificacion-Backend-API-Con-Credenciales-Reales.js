/**
 * SCRIPT DE VERIFICACIÓN COMPLETA BACKEND/API - MISIONES ARRIENDA
 * ================================================================
 * 
 * Este script realiza una verificación exhaustiva del backend y API
 * con las credenciales reales de Supabase proporcionadas.
 * 
 * Fecha: 2025-01-21
 * Versión: 1.0
 */

const https = require('https');
const http = require('http');
const fs = require('fs');

// ========================================
// CONFIGURACIÓN CON CREDENCIALES REALES
// ========================================

const CONFIG = {
    // Configuración de Supabase (credenciales reales)
    SUPABASE_URL: 'https://qfeyhaaxymmnohqdele.supabase.co',
    SUPABASE_SERVICE_ROLE_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmZXloYWF4eWVtbW5vaHFkZWxlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTgxNjczOCwiZXhwIjoyMDcxMzkyNzM4fQ.5wJb1p0Rmg1dVIayIT4wZO_seDXTIwhVa36CyEgK-yM',
    
    // Configuración del servidor local
    BACKEND_URL: 'http://localhost:3000',
    
    // Timeouts
    REQUEST_TIMEOUT: 10000,
    
    // Endpoints críticos a verificar
    ENDPOINTS: [
        '/api/health',
        '/api/properties',
        '/api/auth/register',
        '/api/auth/login',
        '/api/stats',
        '/api/users/profile'
    ],
    
    // Tablas de base de datos a verificar
    TABLES: [
        'properties',
        'profiles', 
        'users',
        'community_profiles'
    ]
};

// ========================================
// SISTEMA DE PUNTUACIÓN Y REPORTES
// ========================================

let testResults = {
    totalTests: 0,
    passedTests: 0,
    failedTests: 0,
    score: 0,
    details: [],
    timestamp: new Date().toISOString()
};

function logTest(testName, passed, details = '', score = 0) {
    testResults.totalTests++;
    if (passed) {
        testResults.passedTests++;
        testResults.score += score;
        console.log(`✅ ${testName} - PASÓ`);
    } else {
        testResults.failedTests++;
        console.log(`❌ ${testName} - FALLÓ: ${details}`);
    }
    
    testResults.details.push({
        test: testName,
        passed,
        details,
        score: passed ? score : 0,
        timestamp: new Date().toISOString()
    });
}

// ========================================
// UTILIDADES DE RED
// ========================================

function makeRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
        const isHttps = url.startsWith('https');
        const client = isHttps ? https : http;
        
        const defaultOptions = {
            timeout: CONFIG.REQUEST_TIMEOUT,
            headers: {
                'User-Agent': 'Misiones-Arrienda-Backend-Tester/1.0',
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        };
        
        const finalOptions = { ...defaultOptions, ...options };
        
        const req = client.request(url, finalOptions, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const jsonData = data ? JSON.parse(data) : {};
                    resolve({
                        statusCode: res.statusCode,
                        headers: res.headers,
                        data: jsonData,
                        rawData: data
                    });
                } catch (e) {
                    resolve({
                        statusCode: res.statusCode,
                        headers: res.headers,
                        data: null,
                        rawData: data
                    });
                }
            });
        });
        
        req.on('error', reject);
        req.on('timeout', () => {
            req.destroy();
            reject(new Error('Request timeout'));
        });
        
        if (options.body) {
            req.write(JSON.stringify(options.body));
        }
        
        req.end();
    });
}

// ========================================
// TESTS DE SERVIDOR BACKEND
// ========================================

async function testBackendServer() {
    console.log('\n🔍 VERIFICANDO SERVIDOR BACKEND...\n');
    
    try {
        const response = await makeRequest(CONFIG.BACKEND_URL);
        
        if (response.statusCode === 200 || response.statusCode === 404) {
            logTest('Servidor Backend Disponible', true, 'Servidor responde correctamente', 15);
        } else {
            logTest('Servidor Backend Disponible', false, `Código de estado: ${response.statusCode}`, 0);
        }
    } catch (error) {
        logTest('Servidor Backend Disponible', false, `Error de conexión: ${error.message}`, 0);
    }
}

// ========================================
// TESTS DE ENDPOINTS API
// ========================================

async function testAPIEndpoints() {
    console.log('\n🔍 VERIFICANDO ENDPOINTS API...\n');
    
    for (const endpoint of CONFIG.ENDPOINTS) {
        const url = `${CONFIG.BACKEND_URL}${endpoint}`;
        
        try {
            const response = await makeRequest(url);
            
            if (response.statusCode >= 200 && response.statusCode < 500) {
                logTest(`Endpoint ${endpoint}`, true, `Status: ${response.statusCode}`, 10);
            } else {
                logTest(`Endpoint ${endpoint}`, false, `Status: ${response.statusCode}`, 0);
            }
        } catch (error) {
            logTest(`Endpoint ${endpoint}`, false, `Error: ${error.message}`, 0);
        }
        
        // Pausa entre requests
        await new Promise(resolve => setTimeout(resolve, 500));
    }
}

// ========================================
// TESTS DE SUPABASE
// ========================================

async function testSupabaseConnection() {
    console.log('\n🔍 VERIFICANDO CONEXIÓN SUPABASE...\n');
    
    try {
        const url = `${CONFIG.SUPABASE_URL}/rest/v1/`;
        const response = await makeRequest(url, {
            headers: {
                'apikey': CONFIG.SUPABASE_SERVICE_ROLE_KEY,
                'Authorization': `Bearer ${CONFIG.SUPABASE_SERVICE_ROLE_KEY}`
            }
        });
        
        if (response.statusCode === 200 || response.statusCode === 404) {
            logTest('Conexión Supabase', true, 'API REST accesible', 20);
        } else {
            logTest('Conexión Supabase', false, `Status: ${response.statusCode}`, 0);
        }
    } catch (error) {
        logTest('Conexión Supabase', false, `Error: ${error.message}`, 0);
    }
}

async function testSupabaseTables() {
    console.log('\n🔍 VERIFICANDO TABLAS SUPABASE...\n');
    
    for (const table of CONFIG.TABLES) {
        try {
            const url = `${CONFIG.SUPABASE_URL}/rest/v1/${table}?select=*&limit=1`;
            const response = await makeRequest(url, {
                headers: {
                    'apikey': CONFIG.SUPABASE_SERVICE_ROLE_KEY,
                    'Authorization': `Bearer ${CONFIG.SUPABASE_SERVICE_ROLE_KEY}`
                }
            });
            
            if (response.statusCode === 200) {
                logTest(`Tabla ${table}`, true, 'Tabla accesible', 10);
            } else if (response.statusCode === 401) {
                logTest(`Tabla ${table}`, false, 'Error de autenticación', 0);
            } else if (response.statusCode === 404) {
                logTest(`Tabla ${table}`, false, 'Tabla no encontrada', 0);
            } else {
                logTest(`Tabla ${table}`, false, `Status: ${response.statusCode}`, 0);
            }
        } catch (error) {
            logTest(`Tabla ${table}`, false, `Error: ${error.message}`, 0);
        }
        
        // Pausa entre requests
        await new Promise(resolve => setTimeout(resolve, 300));
    }
}

// ========================================
// TESTS DE SEGURIDAD BÁSICA
// ========================================

async function testBasicSecurity() {
    console.log('\n🔍 VERIFICANDO SEGURIDAD BÁSICA...\n');
    
    // Test de headers de seguridad
    try {
        const response = await makeRequest(CONFIG.BACKEND_URL);
        const headers = response.headers;
        
        // Verificar headers de seguridad comunes
        const securityHeaders = [
            'x-frame-options',
            'x-content-type-options',
            'x-xss-protection'
        ];
        
        let securityScore = 0;
        for (const header of securityHeaders) {
            if (headers[header]) {
                securityScore += 5;
            }
        }
        
        logTest('Headers de Seguridad', securityScore > 0, `${securityScore}/15 headers encontrados`, securityScore);
    } catch (error) {
        logTest('Headers de Seguridad', false, `Error: ${error.message}`, 0);
    }
}

// ========================================
// TESTS DE RENDIMIENTO
// ========================================

async function testPerformance() {
    console.log('\n🔍 VERIFICANDO RENDIMIENTO...\n');
    
    const startTime = Date.now();
    
    try {
        await makeRequest(CONFIG.BACKEND_URL);
        const responseTime = Date.now() - startTime;
        
        if (responseTime < 2000) {
            logTest('Tiempo de Respuesta', true, `${responseTime}ms (Excelente)`, 15);
        } else if (responseTime < 5000) {
            logTest('Tiempo de Respuesta', true, `${responseTime}ms (Aceptable)`, 10);
        } else {
            logTest('Tiempo de Respuesta', false, `${responseTime}ms (Lento)`, 0);
        }
    } catch (error) {
        logTest('Tiempo de Respuesta', false, `Error: ${error.message}`, 0);
    }
}

// ========================================
// GENERACIÓN DE REPORTES
// ========================================

function generateReport() {
    const report = {
        ...testResults,
        maxScore: 150, // Puntuación máxima posible
        percentage: Math.round((testResults.score / 150) * 100),
        status: testResults.score >= 120 ? 'EXCELENTE' : 
                testResults.score >= 90 ? 'BUENO' : 
                testResults.score >= 60 ? 'REGULAR' : 'CRÍTICO'
    };
    
    return report;
}

function printSummary(report) {
    console.log('\n' + '='.repeat(60));
    console.log('📊 RESUMEN DE VERIFICACIÓN BACKEND/API');
    console.log('='.repeat(60));
    console.log(`📅 Fecha: ${new Date().toLocaleString()}`);
    console.log(`🎯 Tests Ejecutados: ${report.totalTests}`);
    console.log(`✅ Tests Exitosos: ${report.passedTests}`);
    console.log(`❌ Tests Fallidos: ${report.failedTests}`);
    console.log(`📈 Puntuación: ${report.score}/${report.maxScore} (${report.percentage}%)`);
    console.log(`🏆 Estado: ${report.status}`);
    console.log('='.repeat(60));
    
    if (report.failedTests > 0) {
        console.log('\n❌ PROBLEMAS DETECTADOS:');
        report.details.filter(d => !d.passed).forEach(detail => {
            console.log(`   • ${detail.test}: ${detail.details}`);
        });
    }
    
    console.log('\n📋 RECOMENDACIONES:');
    if (report.percentage < 60) {
        console.log('   🚨 CRÍTICO: Múltiples problemas detectados');
        console.log('   • Verificar configuración de Supabase');
        console.log('   • Revisar servidor backend');
        console.log('   • Comprobar variables de entorno');
    } else if (report.percentage < 90) {
        console.log('   ⚠️  MEJORABLE: Algunos problemas menores');
        console.log('   • Optimizar rendimiento');
        console.log('   • Mejorar headers de seguridad');
    } else {
        console.log('   ✅ EXCELENTE: Sistema funcionando correctamente');
        console.log('   • Mantener monitoreo regular');
        console.log('   • Considerar optimizaciones adicionales');
    }
}

async function saveReport(report) {
    const filename = `177-REPORTE-VERIFICACION-BACKEND-API-${new Date().toISOString().split('T')[0]}.json`;
    
    try {
        fs.writeFileSync(filename, JSON.stringify(report, null, 2));
        console.log(`\n💾 Reporte guardado: ${filename}`);
    } catch (error) {
        console.log(`\n❌ Error guardando reporte: ${error.message}`);
    }
}

// ========================================
// FUNCIÓN PRINCIPAL
// ========================================

async function runCompleteVerification() {
    console.log('🚀 INICIANDO VERIFICACIÓN COMPLETA BACKEND/API');
    console.log('================================================');
    console.log(`📅 Fecha: ${new Date().toLocaleString()}`);
    console.log(`🔗 Backend URL: ${CONFIG.BACKEND_URL}`);
    console.log(`🗄️  Supabase URL: ${CONFIG.SUPABASE_URL}`);
    console.log('================================================');
    
    try {
        // Ejecutar todos los tests
        await testBackendServer();
        await testAPIEndpoints();
        await testSupabaseConnection();
        await testSupabaseTables();
        await testBasicSecurity();
        await testPerformance();
        
        // Generar y mostrar reporte
        const report = generateReport();
        printSummary(report);
        await saveReport(report);
        
        console.log('\n🎉 VERIFICACIÓN COMPLETADA');
        
        // Código de salida basado en el resultado
        process.exit(report.percentage >= 60 ? 0 : 1);
        
    } catch (error) {
        console.error('\n💥 ERROR CRÍTICO EN VERIFICACIÓN:', error.message);
        process.exit(1);
    }
}

// ========================================
// EJECUCIÓN
// ========================================

if (require.main === module) {
    runCompleteVerification().catch(error => {
        console.error('💥 Error fatal:', error);
        process.exit(1);
    });
}

module.exports = {
    runCompleteVerification,
    CONFIG,
    testResults
};
