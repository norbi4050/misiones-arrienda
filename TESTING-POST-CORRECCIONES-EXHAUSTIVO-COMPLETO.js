/**
 * TESTING POST-CORRECCIONES EXHAUSTIVO COMPLETO
 * =============================================
 * 
 * Testing exhaustivo después de aplicar las correcciones automáticas
 * para verificar el estado actual y probar las áreas restantes.
 * 
 * Fecha: 3 de Enero 2025
 * Proyecto: Misiones Arrienda
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// ===== CONFIGURACIÓN CON CREDENCIALES REALES =====
const SUPABASE_CONFIG = {
    url: 'https://qfeyhaaxyemmnohqdele.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmZXloYWF4eWVtbW5vaHFkZWxlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4MTY3MzgsImV4cCI6MjA3MTM5MjczOH0.vgrh055OkiBIJFBlRlEuEZAOF2FHo3LBUNitB09dSIE',
    serviceRoleKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmZXloYWF4eWVtbW5vaHFkZWxlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTgxNjczOCwiZXhwIjoyMDcxMzkyNzM4fQ.5wJb1p0Rmg1dVIayIT4wZO_seDXTIwhVa36CyEgK-yM'
};

// ===== INICIALIZACIÓN DE CLIENTES =====
const supabaseAnon = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
const supabaseAdmin = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.serviceRoleKey);

// ===== RESULTADOS DE TESTING =====
let testingResults = {
    timestamp: new Date().toISOString(),
    totalTests: 0,
    passedTests: 0,
    failedTests: 0,
    details: [],
    summary: {},
    postCorrectionStatus: {}
};

// ===== FUNCIONES AUXILIARES =====
function logTest(testName, status, details = null, performance = null) {
    testingResults.totalTests++;
    
    if (status === 'PASS') {
        testingResults.passedTests++;
        console.log(`✅ ${testName}: PASÓ`);
    } else {
        testingResults.failedTests++;
        console.log(`❌ ${testName}: FALLÓ`);
    }
    
    testingResults.details.push({
        test: testName,
        status,
        details,
        performance,
        timestamp: new Date().toISOString()
    });
    
    if (details) {
        console.log(`   Detalles: ${JSON.stringify(details, null, 2)}`);
    }
    
    if (performance) {
        console.log(`   Rendimiento: ${performance}ms`);
    }
}

// ===== TESTING 1: VERIFICAR ESTADO POST-CORRECCIÓN =====
async function testPostCorrectionStatus() {
    console.log('\n🔍 === VERIFICANDO ESTADO POST-CORRECCIÓN ===');
    
    try {
        const startTime = Date.now();
        
        // Test conectividad básica
        const { data: healthCheck, error: healthError } = await supabaseAnon
            .from('properties')
            .select('count', { count: 'exact', head: true });
        
        const endTime = Date.now();
        
        if (healthError) {
            logTest('Conectividad Post-Corrección', 'FAIL', healthError, endTime - startTime);
        } else {
            logTest('Conectividad Post-Corrección', 'PASS', { 
                propertiesCount: healthCheck 
            }, endTime - startTime);
        }
        
    } catch (error) {
        logTest('Conectividad Post-Corrección', 'FAIL', error.message);
    }
}

// ===== TESTING 2: VERIFICAR POLÍTICAS RLS DESPUÉS DE CORRECCIÓN =====
async function testRLSPoliciesPostCorrection() {
    console.log('\n🛡️  === TESTING POLÍTICAS RLS POST-CORRECCIÓN ===');
    
    try {
        const startTime = Date.now();
        
        // Test lectura pública de propiedades
        const { data: publicRead, error: publicError } = await supabaseAnon
            .from('properties')
            .select('id, title, price')
            .limit(5);
        
        const endTime = Date.now();
        
        if (publicError) {
            logTest('RLS Lectura Pública', 'FAIL', publicError, endTime - startTime);
        } else {
            logTest('RLS Lectura Pública', 'PASS', { 
                propertiesFound: publicRead?.length || 0 
            }, endTime - startTime);
        }
        
        // Test inserción sin autenticación (debe fallar)
        const { data: insertTest, error: insertError } = await supabaseAnon
            .from('properties')
            .insert({
                title: 'Test Property',
                price: 100000,
                property_type: 'casa'
            });
        
        if (insertError) {
            logTest('RLS Inserción Sin Auth', 'PASS', { 
                expectedError: 'Inserción bloqueada correctamente',
                error: insertError.message 
            });
        } else {
            logTest('RLS Inserción Sin Auth', 'FAIL', { 
                unexpectedSuccess: 'La inserción debería haber fallado' 
            });
        }
        
    } catch (error) {
        logTest('RLS Políticas Test', 'FAIL', error.message);
    }
}

// ===== TESTING 3: VERIFICAR AUTENTICACIÓN MEJORADA =====
async function testImprovedAuthentication() {
    console.log('\n🔐 === TESTING AUTENTICACIÓN MEJORADA ===');
    
    try {
        const testEmail = `test-improved-${Date.now()}@example.com`;
        
        // Test 1: Contraseña débil (debe fallar)
        const startTime1 = Date.now();
        const { data: weakPassData, error: weakPassError } = await supabaseAnon.auth.signUp({
            email: testEmail,
            password: '123'
        });
        const endTime1 = Date.now();
        
        if (weakPassError) {
            logTest('Auth Contraseña Débil', 'PASS', { 
                expectedError: 'Contraseña débil rechazada',
                error: weakPassError.message 
            }, endTime1 - startTime1);
        } else {
            logTest('Auth Contraseña Débil', 'FAIL', { 
                unexpectedSuccess: 'Contraseña débil aceptada' 
            }, endTime1 - startTime1);
        }
        
        // Test 2: Contraseña fuerte
        const startTime2 = Date.now();
        const strongPassword = 'SuperSecurePassword123!@#';
        const { data: strongPassData, error: strongPassError } = await supabaseAnon.auth.signUp({
            email: `strong-${testEmail}`,
            password: strongPassword
        });
        const endTime2 = Date.now();
        
        if (strongPassError) {
            logTest('Auth Contraseña Fuerte', 'FAIL', strongPassError, endTime2 - startTime2);
        } else {
            logTest('Auth Contraseña Fuerte', 'PASS', { 
                userId: strongPassData.user?.id,
                emailConfirmationSent: strongPassData.user?.email_confirmed_at === null
            }, endTime2 - startTime2);
            
            // Limpiar usuario de prueba
            if (strongPassData.user?.id) {
                await supabaseAdmin.auth.admin.deleteUser(strongPassData.user.id);
            }
        }
        
    } catch (error) {
        logTest('Auth Mejorada Test', 'FAIL', error.message);
    }
}

// ===== TESTING 4: VERIFICAR STORAGE Y BUCKETS =====
async function testStorageAndBuckets() {
    console.log('\n📁 === TESTING STORAGE Y BUCKETS ===');
    
    try {
        const startTime = Date.now();
        
        // Verificar buckets disponibles
        const { data: buckets, error: bucketsError } = await supabaseAdmin.storage.listBuckets();
        
        if (bucketsError) {
            logTest('Storage Buckets List', 'FAIL', bucketsError);
            return;
        }
        
        const bucketNames = buckets.map(b => b.name);
        logTest('Storage Buckets List', 'PASS', { 
            bucketsCount: buckets.length,
            buckets: bucketNames 
        }, Date.now() - startTime);
        
        // Test upload a bucket principal
        if (bucketNames.includes('property-images')) {
            const testFile = Buffer.from('test image content');
            const fileName = `test-${Date.now()}.txt`;
            
            const uploadStart = Date.now();
            const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
                .from('property-images')
                .upload(fileName, testFile, {
                    contentType: 'text/plain'
                });
            const uploadEnd = Date.now();
            
            if (uploadError) {
                logTest('Storage Upload Test', 'FAIL', uploadError, uploadEnd - uploadStart);
            } else {
                logTest('Storage Upload Test', 'PASS', { 
                    path: uploadData.path,
                    fullPath: uploadData.fullPath 
                }, uploadEnd - uploadStart);
                
                // Limpiar archivo de prueba
                await supabaseAdmin.storage.from('property-images').remove([fileName]);
            }
        }
        
    } catch (error) {
        logTest('Storage Test', 'FAIL', error.message);
    }
}

// ===== TESTING 5: VERIFICAR ENDPOINTS ESPECÍFICOS =====
async function testSpecificEndpoints() {
    console.log('\n🌐 === TESTING ENDPOINTS ESPECÍFICOS ===');
    
    const endpoints = [
        { name: 'Properties List', table: 'properties', select: 'id, title, price' },
        { name: 'Users Profiles', table: 'profiles', select: 'id, full_name' },
        { name: 'Community Profiles', table: 'community_profiles', select: 'id, display_name' }
    ];
    
    for (const endpoint of endpoints) {
        try {
            const startTime = Date.now();
            
            const { data, error } = await supabaseAnon
                .from(endpoint.table)
                .select(endpoint.select)
                .limit(3);
            
            const endTime = Date.now();
            
            if (error) {
                logTest(`Endpoint ${endpoint.name}`, 'FAIL', error, endTime - startTime);
            } else {
                logTest(`Endpoint ${endpoint.name}`, 'PASS', { 
                    recordsFound: data?.length || 0,
                    sampleData: data?.[0] || null
                }, endTime - startTime);
            }
            
        } catch (error) {
            logTest(`Endpoint ${endpoint.name}`, 'FAIL', error.message);
        }
    }
}

// ===== TESTING 6: VERIFICAR FLUJO COMPLETO REGISTRO → LOGIN =====
async function testCompleteAuthFlow() {
    console.log('\n🔄 === TESTING FLUJO COMPLETO AUTENTICACIÓN ===');
    
    try {
        const testEmail = `flow-test-${Date.now()}@example.com`;
        const testPassword = 'CompleteFlowTest123!@#';
        
        // Paso 1: Registro
        const registerStart = Date.now();
        const { data: signUpData, error: signUpError } = await supabaseAdmin.auth.admin.createUser({
            email: testEmail,
            password: testPassword,
            email_confirm: true
        });
        const registerEnd = Date.now();
        
        if (signUpError) {
            logTest('Flujo Completo - Registro', 'FAIL', signUpError, registerEnd - registerStart);
            return;
        }
        
        logTest('Flujo Completo - Registro', 'PASS', { 
            userId: signUpData.user?.id,
            email: testEmail 
        }, registerEnd - registerStart);
        
        // Paso 2: Login
        const loginStart = Date.now();
        const { data: signInData, error: signInError } = await supabaseAnon.auth.signInWithPassword({
            email: testEmail,
            password: testPassword
        });
        const loginEnd = Date.now();
        
        if (signInError) {
            logTest('Flujo Completo - Login', 'FAIL', signInError, loginEnd - loginStart);
        } else {
            logTest('Flujo Completo - Login', 'PASS', { 
                userId: signInData.user?.id,
                sessionValid: !!signInData.session?.access_token
            }, loginEnd - loginStart);
            
            // Paso 3: Operación autenticada (crear propiedad)
            const operationStart = Date.now();
            const { data: propertyData, error: propertyError } = await supabaseAnon
                .from('properties')
                .insert({
                    title: 'Test Property from Auth Flow',
                    price: 150000,
                    property_type: 'casa',
                    user_id: signInData.user.id
                })
                .select()
                .single();
            const operationEnd = Date.now();
            
            if (propertyError) {
                logTest('Flujo Completo - Operación Auth', 'FAIL', propertyError, operationEnd - operationStart);
            } else {
                logTest('Flujo Completo - Operación Auth', 'PASS', { 
                    propertyId: propertyData?.id,
                    title: propertyData?.title
                }, operationEnd - operationStart);
                
                // Limpiar propiedad de prueba
                await supabaseAdmin.from('properties').delete().eq('id', propertyData.id);
            }
            
            // Logout
            await supabaseAnon.auth.signOut();
        }
        
        // Limpiar usuario de prueba
        if (signUpData.user?.id) {
            await supabaseAdmin.auth.admin.deleteUser(signUpData.user.id);
        }
        
    } catch (error) {
        logTest('Flujo Completo Auth', 'FAIL', error.message);
    }
}

// ===== TESTING 7: VERIFICAR RENDIMIENTO GENERAL =====
async function testGeneralPerformance() {
    console.log('\n⚡ === TESTING RENDIMIENTO GENERAL ===');
    
    const performanceTests = [
        {
            name: 'Query Simple Properties',
            test: () => supabaseAnon.from('properties').select('id, title').limit(10)
        },
        {
            name: 'Query Complex Properties',
            test: () => supabaseAnon.from('properties').select('*, profiles(full_name)').limit(5)
        },
        {
            name: 'Count Total Properties',
            test: () => supabaseAnon.from('properties').select('count', { count: 'exact', head: true })
        }
    ];
    
    for (const perfTest of performanceTests) {
        try {
            const startTime = Date.now();
            const { data, error } = await perfTest.test();
            const endTime = Date.now();
            const duration = endTime - startTime;
            
            if (error) {
                logTest(`Performance ${perfTest.name}`, 'FAIL', error, duration);
            } else {
                const status = duration < 1000 ? 'PASS' : 'FAIL';
                logTest(`Performance ${perfTest.name}`, status, { 
                    recordsReturned: Array.isArray(data) ? data.length : 'count query',
                    performanceThreshold: duration < 1000 ? 'GOOD' : 'SLOW'
                }, duration);
            }
            
        } catch (error) {
            logTest(`Performance ${perfTest.name}`, 'FAIL', error.message);
        }
    }
}

// ===== TESTING 8: VERIFICAR PROBLEMAS CRÍTICOS IDENTIFICADOS =====
async function testCriticalIssuesResolution() {
    console.log('\n🚨 === TESTING RESOLUCIÓN PROBLEMAS CRÍTICOS ===');
    
    // Test 1: Verificar que exec_sql funciona (problema identificado)
    try {
        const { data, error } = await supabaseAdmin.rpc('exec_sql', { 
            sql: 'SELECT 1 as test_result' 
        });
        
        if (error) {
            logTest('Función exec_sql', 'FAIL', { 
                issue: 'Función exec_sql no disponible',
                error: error.message 
            });
        } else {
            logTest('Función exec_sql', 'PASS', { 
                result: data,
                status: 'Función disponible' 
            });
        }
    } catch (error) {
        logTest('Función exec_sql', 'FAIL', error.message);
    }
    
    // Test 2: Verificar acceso a information_schema
    try {
        const { data, error } = await supabaseAnon
            .from('information_schema.tables')
            .select('table_name')
            .eq('table_schema', 'public')
            .limit(5);
        
        if (error) {
            logTest('Information Schema Access', 'FAIL', { 
                issue: 'No se puede acceder a information_schema',
                error: error.message 
            });
        } else {
            logTest('Information Schema Access', 'PASS', { 
                tablesFound: data?.length || 0,
                sampleTables: data?.map(t => t.table_name) || []
            });
        }
    } catch (error) {
        logTest('Information Schema Access', 'FAIL', error.message);
    }
    
    // Test 3: Verificar Service Role funcionalidad
    try {
        const { data, error } = await supabaseAdmin
            .from('auth.users')
            .select('count', { count: 'exact', head: true });
        
        if (error) {
            logTest('Service Role Functionality', 'FAIL', { 
                issue: 'Service Role no tiene permisos adecuados',
                error: error.message 
            });
        } else {
            logTest('Service Role Functionality', 'PASS', { 
                userCount: data,
                status: 'Service Role funcional' 
            });
        }
    } catch (error) {
        logTest('Service Role Functionality', 'FAIL', error.message);
    }
}

// ===== FUNCIÓN PRINCIPAL =====
async function runPostCorrectionTesting() {
    console.log('🧪 INICIANDO TESTING POST-CORRECCIONES EXHAUSTIVO');
    console.log('='.repeat(60));
    console.log(`Fecha: ${new Date().toLocaleString()}`);
    console.log(`URL: ${SUPABASE_CONFIG.url}`);
    console.log('='.repeat(60));
    
    try {
        await testPostCorrectionStatus();
        await testRLSPoliciesPostCorrection();
        await testImprovedAuthentication();
        await testStorageAndBuckets();
        await testSpecificEndpoints();
        await testCompleteAuthFlow();
        await testGeneralPerformance();
        await testCriticalIssuesResolution();
        
        // Generar resumen
        testingResults.summary = {
            successRate: ((testingResults.passedTests / testingResults.totalTests) * 100).toFixed(2) + '%',
            totalTests: testingResults.totalTests,
            passed: testingResults.passedTests,
            failed: testingResults.failedTests,
            status: testingResults.failedTests === 0 ? 'ALL_TESTS_PASSED' : 
                    testingResults.failedTests < 5 ? 'MOSTLY_WORKING' : 'NEEDS_ATTENTION'
        };
        
        // Análisis post-corrección
        testingResults.postCorrectionStatus = {
            correctionImpact: testingResults.passedTests > testingResults.failedTests ? 'POSITIVE' : 'NEGATIVE',
            criticalIssuesResolved: testingResults.details.filter(d => 
                d.test.includes('exec_sql') || d.test.includes('Service Role')
            ).filter(d => d.status === 'PASS').length,
            remainingIssues: testingResults.details.filter(d => d.status === 'FAIL').map(d => d.test),
            performanceStatus: testingResults.details.filter(d => 
                d.test.includes('Performance') && d.performance < 1000
            ).length
        };
        
        console.log('\n📊 === RESUMEN TESTING POST-CORRECCIÓN ===');
        console.log(`Total Tests: ${testingResults.totalTests}`);
        console.log(`✅ Pasaron: ${testingResults.passedTests}`);
        console.log(`❌ Fallaron: ${testingResults.failedTests}`);
        console.log(`📈 Tasa de Éxito: ${testingResults.summary.successRate}`);
        console.log(`🏥 Estado General: ${testingResults.summary.status}`);
        console.log(`🔧 Impacto Correcciones: ${testingResults.postCorrectionStatus.correctionImpact}`);
        
        // Guardar resultados
        const reportPath = path.join(__dirname, 'REPORTE-TESTING-POST-CORRECCIONES-EXHAUSTIVO-FINAL.json');
        fs.writeFileSync(reportPath, JSON.stringify(testingResults, null, 2));
        console.log(`\n💾 Reporte guardado en: ${reportPath}`);
        
        // Generar recomendaciones
        console.log('\n🎯 === RECOMENDACIONES POST-CORRECCIÓN ===');
        if (testingResults.failedTests === 0) {
            console.log('✅ Todas las correcciones fueron exitosas');
            console.log('🚀 Supabase está completamente funcional');
        } else if (testingResults.failedTests < 5) {
            console.log('⚠️  La mayoría de correcciones fueron exitosas');
            console.log('🔧 Algunos problemas menores requieren atención manual');
        } else {
            console.log('❌ Varias correcciones necesitan intervención manual');
            console.log('📋 Revisa el reporte detallado para próximos pasos');
        }
        
        console.log('\n📋 Problemas Restantes:');
        testingResults.postCorrectionStatus.remainingIssues.forEach(issue => {
            console.log(`   - ${issue}`);
        });
        
        return testingResults;
        
    } catch (error) {
        console.error('❌ Error en testing post-corrección:', error);
        testingResults.details.push({
            test: 'PROCESO_GENERAL',
            status: 'FAIL',
            details: error.message,
            timestamp: new Date().toISOString()
        });
        return testingResults;
    }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
    runPostCorrectionTesting()
        .then(results => {
            console.log('\n🎉 Testing post-corrección completado');
            process.exit(results.failedTests > 5 ? 1 : 0);
        })
        .catch(error => {
            console.error('💥 Error fatal:', error);
            process.exit(1);
        });
}

module.exports = { runPostCorrectionTesting, testingResults };
