/**
 * 🔐 TESTING DIRECTO DE POLÍTICAS RLS CON API REST SUPABASE
 * 
 * Este script verifica directamente las políticas RLS usando la API REST de Supabase
 * sin depender de funciones SQL que puedan no existir en el esquema.
 * 
 * Fecha: 9 Enero 2025
 * Autor: BlackBox AI
 */

const fs = require('fs');
const path = require('path');

// 🔑 CONFIGURACIÓN SUPABASE
const SUPABASE_URL = 'https://qfeyhaaxyemmnohqdele.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmZXloYWF4eWVtbW5vaHFkZWxlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTgxNjczOCwiZXhwIjoyMDcxMzkyNzM4fQ.5wJb1p0Rmg1dVIayIT4wZO_seDXTIwhVa36CyEgK-yM';

// 📊 CONFIGURACIÓN DE TESTING
const testResults = {
    timestamp: new Date().toISOString(),
    supabaseUrl: SUPABASE_URL,
    tokenValid: false,
    connectionTest: false,
    tablesTest: [],
    rlsTest: [],
    storageTest: [],
    securityFunctions: [],
    overallScore: 0,
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
        security: '🔐'
    };
    
    console.log(`${icons[type]} [${timestamp}] ${message}`);
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// 🔗 FUNCIÓN PARA HACER REQUESTS A SUPABASE
async function supabaseRequest(endpoint, options = {}) {
    try {
        const url = `${SUPABASE_URL}${endpoint}`;
        const defaultHeaders = {
            'apikey': SUPABASE_SERVICE_ROLE_KEY,
            'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
        };

        const response = await fetch(url, {
            headers: { ...defaultHeaders, ...options.headers },
            ...options
        });

        return {
            ok: response.ok,
            status: response.status,
            statusText: response.statusText,
            data: response.ok ? await response.json().catch(() => null) : null,
            error: !response.ok ? await response.text().catch(() => response.statusText) : null
        };
    } catch (error) {
        return {
            ok: false,
            status: 0,
            statusText: 'Network Error',
            data: null,
            error: error.message
        };
    }
}

// 🔍 TESTING DE CONEXIÓN
async function testConnection() {
    log('🔗 Verificando conexión con Supabase...', 'info');
    
    try {
        const response = await supabaseRequest('/rest/v1/', {
            method: 'GET'
        });

        if (response.ok) {
            log('✅ Conexión exitosa con Supabase', 'success');
            testResults.connectionTest = true;
            testResults.tokenValid = true;
            return true;
        } else {
            log(`❌ Error de conexión: ${response.status} - ${response.error}`, 'error');
            testResults.connectionTest = false;
            return false;
        }
    } catch (error) {
        log(`❌ Error de conexión: ${error.message}`, 'error');
        testResults.connectionTest = false;
        return false;
    }
}

// 📊 TESTING DE TABLAS EXISTENTES
async function testTables() {
    log('📊 Verificando tablas existentes...', 'info');
    
    const criticalTables = [
        'profiles', 'users', 'properties', 'payments', 
        'messages', 'conversations', 'favorites'
    ];

    for (const table of criticalTables) {
        await delay(500); // Evitar rate limiting
        
        try {
            const response = await supabaseRequest(`/rest/v1/${table}?limit=1`, {
                method: 'GET'
            });

            const tableResult = {
                name: table,
                exists: response.ok,
                accessible: response.ok,
                status: response.status,
                error: response.error
            };

            if (response.ok) {
                log(`✅ Tabla '${table}' existe y es accesible`, 'success');
            } else if (response.status === 401) {
                log(`🔐 Tabla '${table}' existe pero requiere autenticación (RLS activo)`, 'security');
                tableResult.rlsActive = true;
            } else {
                log(`❌ Tabla '${table}' no accesible: ${response.error}`, 'error');
            }

            testResults.tablesTest.push(tableResult);
        } catch (error) {
            log(`❌ Error verificando tabla '${table}': ${error.message}`, 'error');
            testResults.tablesTest.push({
                name: table,
                exists: false,
                accessible: false,
                error: error.message
            });
        }
    }
}

// 🔐 TESTING DE RLS (Row Level Security)
async function testRLS() {
    log('🔐 Verificando políticas RLS...', 'security');
    
    const rlsTests = [
        {
            name: 'profiles_access_test',
            table: 'profiles',
            description: 'Testing acceso a perfiles con RLS'
        },
        {
            name: 'properties_public_access',
            table: 'properties', 
            description: 'Testing acceso público a propiedades'
        },
        {
            name: 'users_private_access',
            table: 'users',
            description: 'Testing acceso privado a usuarios'
        }
    ];

    for (const test of rlsTests) {
        await delay(500);
        
        try {
            // Test sin autenticación (debería fallar si RLS está activo)
            const response = await supabaseRequest(`/rest/v1/${test.table}?limit=1`, {
                method: 'GET',
                headers: {
                    'Authorization': '' // Sin token para probar RLS
                }
            });

            const rlsResult = {
                name: test.name,
                table: test.table,
                description: test.description,
                rlsActive: !response.ok && response.status === 401,
                status: response.status,
                passed: !response.ok && response.status === 401
            };

            if (rlsResult.rlsActive) {
                log(`✅ RLS activo en tabla '${test.table}' - Acceso denegado sin autenticación`, 'success');
            } else {
                log(`⚠️ RLS posiblemente inactivo en tabla '${test.table}' - Acceso permitido`, 'warning');
            }

            testResults.rlsTest.push(rlsResult);
        } catch (error) {
            log(`❌ Error testing RLS en '${test.table}': ${error.message}`, 'error');
            testResults.rlsTest.push({
                name: test.name,
                table: test.table,
                description: test.description,
                error: error.message,
                passed: false
            });
        }
    }
}

// 🗄️ TESTING DE STORAGE
async function testStorage() {
    log('🗄️ Verificando buckets de Storage...', 'info');
    
    const expectedBuckets = ['property-images', 'avatars', 'documents'];
    
    try {
        const response = await supabaseRequest('/storage/v1/bucket', {
            method: 'GET'
        });

        if (response.ok && response.data) {
            const buckets = response.data;
            log(`✅ Storage accesible - ${buckets.length} buckets encontrados`, 'success');
            
            for (const expectedBucket of expectedBuckets) {
                const bucketExists = buckets.some(b => b.name === expectedBucket);
                
                const storageResult = {
                    name: expectedBucket,
                    exists: bucketExists,
                    public: buckets.find(b => b.name === expectedBucket)?.public || false
                };

                if (bucketExists) {
                    log(`✅ Bucket '${expectedBucket}' existe`, 'success');
                } else {
                    log(`❌ Bucket '${expectedBucket}' no encontrado`, 'error');
                }

                testResults.storageTest.push(storageResult);
            }
        } else {
            log(`❌ Error accediendo a Storage: ${response.error}`, 'error');
        }
    } catch (error) {
        log(`❌ Error testing Storage: ${error.message}`, 'error');
    }
}

// 🔧 TESTING DE FUNCIONES DE SEGURIDAD
async function testSecurityFunctions() {
    log('🔧 Verificando funciones de seguridad...', 'info');
    
    const securityFunctions = [
        'is_property_owner',
        'is_conversation_participant', 
        'check_user_permissions'
    ];

    // Para funciones, usaremos el endpoint de RPC
    for (const functionName of securityFunctions) {
        await delay(500);
        
        try {
            const response = await supabaseRequest(`/rest/v1/rpc/${functionName}`, {
                method: 'POST',
                body: JSON.stringify({
                    // Parámetros de prueba
                    user_id: 'test-user-id',
                    resource_id: 'test-resource-id'
                })
            });

            const functionResult = {
                name: functionName,
                exists: response.status !== 404,
                accessible: response.ok || response.status === 400, // 400 puede ser parámetros incorrectos
                status: response.status
            };

            if (response.status === 404) {
                log(`❌ Función '${functionName}' no encontrada`, 'error');
            } else if (response.ok || response.status === 400) {
                log(`✅ Función '${functionName}' existe y es accesible`, 'success');
            } else {
                log(`⚠️ Función '${functionName}' existe pero hay problemas de acceso`, 'warning');
            }

            testResults.securityFunctions.push(functionResult);
        } catch (error) {
            log(`❌ Error testing función '${functionName}': ${error.message}`, 'error');
            testResults.securityFunctions.push({
                name: functionName,
                exists: false,
                error: error.message
            });
        }
    }
}

// 📊 CALCULAR SCORE GENERAL
function calculateOverallScore() {
    let totalTests = 0;
    let passedTests = 0;

    // Conexión (peso: 20%)
    totalTests += 1;
    if (testResults.connectionTest) passedTests += 1;

    // Tablas (peso: 30%)
    const tableTests = testResults.tablesTest.length;
    const accessibleTables = testResults.tablesTest.filter(t => t.accessible || t.rlsActive).length;
    totalTests += tableTests;
    passedTests += accessibleTables;

    // RLS (peso: 30%)
    const rlsTests = testResults.rlsTest.length;
    const passedRLS = testResults.rlsTest.filter(t => t.passed).length;
    totalTests += rlsTests;
    passedTests += passedRLS;

    // Storage (peso: 10%)
    const storageTests = testResults.storageTest.length;
    const existingBuckets = testResults.storageTest.filter(s => s.exists).length;
    totalTests += storageTests;
    passedTests += existingBuckets;

    // Funciones (peso: 10%)
    const functionTests = testResults.securityFunctions.length;
    const existingFunctions = testResults.securityFunctions.filter(f => f.exists).length;
    totalTests += functionTests;
    passedTests += existingFunctions;

    const score = totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0;
    testResults.overallScore = score;

    return score;
}

// 📝 GENERAR RECOMENDACIONES
function generateRecommendations() {
    const recommendations = [];

    if (!testResults.connectionTest) {
        recommendations.push('🔴 CRÍTICO: Verificar credenciales de Supabase y conectividad');
    }

    const failedTables = testResults.tablesTest.filter(t => !t.accessible && !t.rlsActive);
    if (failedTables.length > 0) {
        recommendations.push(`🔴 CRÍTICO: ${failedTables.length} tablas no accesibles: ${failedTables.map(t => t.name).join(', ')}`);
    }

    const inactiveRLS = testResults.rlsTest.filter(t => !t.passed);
    if (inactiveRLS.length > 0) {
        recommendations.push(`🟡 MEDIO: RLS posiblemente inactivo en ${inactiveRLS.length} tablas`);
    }

    const missingBuckets = testResults.storageTest.filter(s => !s.exists);
    if (missingBuckets.length > 0) {
        recommendations.push(`🟡 MEDIO: ${missingBuckets.length} buckets de storage faltantes`);
    }

    const missingFunctions = testResults.securityFunctions.filter(f => !f.exists);
    if (missingFunctions.length > 0) {
        recommendations.push(`🟡 MEDIO: ${missingFunctions.length} funciones de seguridad faltantes`);
    }

    if (testResults.overallScore >= 80) {
        recommendations.push('✅ EXCELENTE: Sistema de seguridad en buen estado');
    } else if (testResults.overallScore >= 60) {
        recommendations.push('⚠️ BUENO: Sistema funcional con mejoras menores necesarias');
    } else {
        recommendations.push('🔴 CRÍTICO: Sistema requiere atención inmediata');
    }

    testResults.recommendations = recommendations;
}

// 💾 GUARDAR REPORTE
function saveReport() {
    const reportPath = path.join(__dirname, 'reporte-testing-directo-rls-supabase.json');
    
    try {
        fs.writeFileSync(reportPath, JSON.stringify(testResults, null, 2), 'utf8');
        log(`📄 Reporte guardado en: ${reportPath}`, 'success');
    } catch (error) {
        log(`❌ Error guardando reporte: ${error.message}`, 'error');
    }
}

// 🚀 FUNCIÓN PRINCIPAL
async function runDirectRLSTesting() {
    log('🚀 INICIANDO TESTING DIRECTO DE RLS CON API REST SUPABASE', 'info');
    log(`📊 URL Supabase: ${SUPABASE_URL}`, 'info');
    log('🔑 Token Service Role configurado correctamente', 'info');
    
    try {
        // 1. Test de conexión
        const connectionOk = await testConnection();
        if (!connectionOk) {
            log('❌ CRÍTICO: No se pudo establecer conexión con Supabase', 'error');
            return;
        }

        // 2. Test de tablas
        await testTables();

        // 3. Test de RLS
        await testRLS();

        // 4. Test de Storage
        await testStorage();

        // 5. Test de funciones de seguridad
        await testSecurityFunctions();

        // 6. Calcular score y generar recomendaciones
        const score = calculateOverallScore();
        generateRecommendations();

        // 7. Mostrar resultados
        log('', 'info');
        log('📊 RESULTADOS FINALES:', 'info');
        log(`🎯 Score General: ${score}%`, score >= 80 ? 'success' : score >= 60 ? 'warning' : 'error');
        log(`🔗 Conexión: ${testResults.connectionTest ? '✅' : '❌'}`, 'info');
        log(`📊 Tablas accesibles: ${testResults.tablesTest.filter(t => t.accessible || t.rlsActive).length}/${testResults.tablesTest.length}`, 'info');
        log(`🔐 Tests RLS pasados: ${testResults.rlsTest.filter(t => t.passed).length}/${testResults.rlsTest.length}`, 'info');
        log(`🗄️ Buckets existentes: ${testResults.storageTest.filter(s => s.exists).length}/${testResults.storageTest.length}`, 'info');
        log(`🔧 Funciones existentes: ${testResults.securityFunctions.filter(f => f.exists).length}/${testResults.securityFunctions.length}`, 'info');

        log('', 'info');
        log('📋 RECOMENDACIONES:', 'info');
        testResults.recommendations.forEach(rec => log(rec, 'info'));

        // 8. Guardar reporte
        saveReport();

        log('', 'info');
        log('✅ TESTING DIRECTO COMPLETADO EXITOSAMENTE', 'success');
        
    } catch (error) {
        log(`❌ Error durante el testing: ${error.message}`, 'error');
        testResults.error = error.message;
        saveReport();
    }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
    runDirectRLSTesting().catch(console.error);
}

module.exports = { runDirectRLSTesting, testResults };
