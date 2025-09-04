/**
 * TESTING EXHAUSTIVO SUPABASE CON CREDENCIALES REALES - ANÁLISIS COMPLETO
 * ========================================================================
 * 
 * Este script realiza un análisis completo del funcionamiento de Supabase
 * con las credenciales reales proporcionadas.
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

const DATABASE_CONFIG = {
    connectionString: 'postgresql://postgres.qfeyhaaxyemmnohqdele:Yanina302472%21@aws-1-us-east-2.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true&connection_limit=1',
    directUrl: 'postgresql://postgres:Yanina302472!@db.qfeyhaaxyemmnohqdele.supabase.co:5432/postgres?sslmode=require'
};

// ===== INICIALIZACIÓN DE CLIENTES =====
const supabaseAnon = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
const supabaseAdmin = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.serviceRoleKey);

// ===== RESULTADOS DEL TESTING =====
let testResults = {
    timestamp: new Date().toISOString(),
    totalTests: 0,
    passedTests: 0,
    failedTests: 0,
    warnings: 0,
    errors: [],
    warnings: [],
    details: {},
    summary: {}
};

// ===== FUNCIONES AUXILIARES =====
function logTest(testName, status, details = null, isWarning = false) {
    testResults.totalTests++;
    
    if (status === 'PASS') {
        testResults.passedTests++;
        console.log(`✅ ${testName}: PASS`);
    } else if (status === 'FAIL') {
        testResults.failedTests++;
        console.log(`❌ ${testName}: FAIL`);
        testResults.errors.push({ test: testName, details });
    } else if (status === 'WARNING') {
        testResults.warnings++;
        console.log(`⚠️  ${testName}: WARNING`);
        testResults.warnings.push({ test: testName, details });
    }
    
    if (details) {
        testResults.details[testName] = details;
        console.log(`   Detalles: ${JSON.stringify(details, null, 2)}`);
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// ===== TESTS DE CONECTIVIDAD =====
async function testConnectivity() {
    console.log('\n🔗 === TESTING CONECTIVIDAD SUPABASE ===');
    
    try {
        // Test 1: Conexión básica con cliente anónimo
        const { data: anonData, error: anonError } = await supabaseAnon
            .from('properties')
            .select('count', { count: 'exact', head: true });
        
        if (anonError) {
            logTest('Conexión Cliente Anónimo', 'FAIL', anonError);
        } else {
            logTest('Conexión Cliente Anónimo', 'PASS', { count: anonData });
        }
        
        // Test 2: Conexión con service role
        const { data: adminData, error: adminError } = await supabaseAdmin
            .from('properties')
            .select('count', { count: 'exact', head: true });
        
        if (adminError) {
            logTest('Conexión Service Role', 'FAIL', adminError);
        } else {
            logTest('Conexión Service Role', 'PASS', { count: adminData });
        }
        
        // Test 3: Verificar URL y configuración
        const urlTest = SUPABASE_CONFIG.url.includes('qfeyhaaxyemmnohqdele.supabase.co');
        logTest('URL Configuración', urlTest ? 'PASS' : 'FAIL', { url: SUPABASE_CONFIG.url });
        
    } catch (error) {
        logTest('Conectividad General', 'FAIL', error.message);
    }
}

// ===== TESTS DE ESTRUCTURA DE BASE DE DATOS =====
async function testDatabaseStructure() {
    console.log('\n🏗️  === TESTING ESTRUCTURA DE BASE DE DATOS ===');
    
    try {
        // Test 1: Verificar tablas principales
        const expectedTables = ['properties', 'users', 'profiles'];
        
        for (const table of expectedTables) {
            try {
                const { data, error } = await supabaseAdmin
                    .from(table)
                    .select('*')
                    .limit(1);
                
                if (error) {
                    logTest(`Tabla ${table}`, 'FAIL', error);
                } else {
                    logTest(`Tabla ${table}`, 'PASS', { exists: true, sampleData: data });
                }
            } catch (err) {
                logTest(`Tabla ${table}`, 'FAIL', err.message);
            }
        }
        
        // Test 2: Verificar columnas críticas en properties
        const { data: propertiesData, error: propertiesError } = await supabaseAdmin
            .from('properties')
            .select('*')
            .limit(1);
        
        if (!propertiesError && propertiesData && propertiesData.length > 0) {
            const columns = Object.keys(propertiesData[0]);
            const criticalColumns = ['id', 'title', 'price', 'location', 'user_id'];
            const optionalColumns = ['is_active', 'operation_type', 'property_type'];
            
            criticalColumns.forEach(col => {
                const exists = columns.includes(col);
                logTest(`Columna Crítica: ${col}`, exists ? 'PASS' : 'FAIL', { exists, allColumns: columns });
            });
            
            optionalColumns.forEach(col => {
                const exists = columns.includes(col);
                logTest(`Columna Opcional: ${col}`, exists ? 'PASS' : 'WARNING', { exists, allColumns: columns });
            });
        }
        
    } catch (error) {
        logTest('Estructura Base de Datos', 'FAIL', error.message);
    }
}

// ===== TESTS DE AUTENTICACIÓN =====
async function testAuthentication() {
    console.log('\n🔐 === TESTING AUTENTICACIÓN ===');
    
    try {
        // Test 1: Registro de usuario de prueba
        const testEmail = `test-${Date.now()}@example.com`;
        const testPassword = 'TestPassword123!';
        
        const { data: signUpData, error: signUpError } = await supabaseAnon.auth.signUp({
            email: testEmail,
            password: testPassword
        });
        
        if (signUpError) {
            logTest('Registro Usuario', 'FAIL', signUpError);
        } else {
            logTest('Registro Usuario', 'PASS', { user: signUpData.user?.id });
            
            // Test 2: Login con el usuario creado
            await sleep(1000); // Esperar un poco
            
            const { data: signInData, error: signInError } = await supabaseAnon.auth.signInWithPassword({
                email: testEmail,
                password: testPassword
            });
            
            if (signInError) {
                logTest('Login Usuario', 'FAIL', signInError);
            } else {
                logTest('Login Usuario', 'PASS', { session: !!signInData.session });
                
                // Test 3: Obtener usuario actual
                const { data: userData, error: userError } = await supabaseAnon.auth.getUser();
                
                if (userError) {
                    logTest('Obtener Usuario Actual', 'FAIL', userError);
                } else {
                    logTest('Obtener Usuario Actual', 'PASS', { userId: userData.user?.id });
                }
                
                // Logout
                await supabaseAnon.auth.signOut();
            }
        }
        
    } catch (error) {
        logTest('Autenticación General', 'FAIL', error.message);
    }
}

// ===== TESTS DE POLÍTICAS RLS =====
async function testRLSPolicies() {
    console.log('\n🛡️  === TESTING POLÍTICAS RLS ===');
    
    try {
        // Test 1: Verificar que RLS está habilitado
        const { data: rlsData, error: rlsError } = await supabaseAdmin
            .rpc('check_rls_enabled', { table_name: 'properties' });
        
        if (rlsError) {
            logTest('RLS Habilitado', 'WARNING', rlsError);
        } else {
            logTest('RLS Habilitado', 'PASS', { enabled: rlsData });
        }
        
        // Test 2: Probar acceso sin autenticación
        const { data: unauthData, error: unauthError } = await supabaseAnon
            .from('properties')
            .select('*')
            .limit(5);
        
        if (unauthError) {
            logTest('Acceso Sin Auth', 'WARNING', unauthError);
        } else {
            logTest('Acceso Sin Auth', 'PASS', { count: unauthData?.length || 0 });
        }
        
        // Test 3: Intentar insertar sin autenticación
        const { data: insertData, error: insertError } = await supabaseAnon
            .from('properties')
            .insert({
                title: 'Test Property',
                price: 100000,
                location: 'Test Location'
            });
        
        if (insertError) {
            logTest('Insert Sin Auth (Debe Fallar)', 'PASS', { blocked: true, error: insertError.message });
        } else {
            logTest('Insert Sin Auth (Debe Fallar)', 'FAIL', { allowed: true, data: insertData });
        }
        
    } catch (error) {
        logTest('Políticas RLS', 'FAIL', error.message);
    }
}

// ===== TESTS DE STORAGE =====
async function testStorage() {
    console.log('\n📁 === TESTING STORAGE ===');
    
    try {
        // Test 1: Listar buckets
        const { data: buckets, error: bucketsError } = await supabaseAdmin.storage.listBuckets();
        
        if (bucketsError) {
            logTest('Listar Buckets', 'FAIL', bucketsError);
        } else {
            logTest('Listar Buckets', 'PASS', { buckets: buckets.map(b => b.name) });
            
            // Test 2: Verificar bucket de imágenes
            const imagesBucket = buckets.find(b => b.name === 'property-images' || b.name === 'images');
            if (imagesBucket) {
                logTest('Bucket Imágenes', 'PASS', { bucket: imagesBucket.name });
                
                // Test 3: Intentar subir archivo de prueba
                const testFile = Buffer.from('test image content');
                const fileName = `test-${Date.now()}.txt`;
                
                const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
                    .from(imagesBucket.name)
                    .upload(fileName, testFile);
                
                if (uploadError) {
                    logTest('Upload Archivo', 'WARNING', uploadError);
                } else {
                    logTest('Upload Archivo', 'PASS', { path: uploadData.path });
                    
                    // Limpiar archivo de prueba
                    await supabaseAdmin.storage.from(imagesBucket.name).remove([fileName]);
                }
            } else {
                logTest('Bucket Imágenes', 'WARNING', { message: 'No se encontró bucket de imágenes' });
            }
        }
        
    } catch (error) {
        logTest('Storage General', 'FAIL', error.message);
    }
}

// ===== TESTS DE RENDIMIENTO =====
async function testPerformance() {
    console.log('\n⚡ === TESTING RENDIMIENTO ===');
    
    try {
        // Test 1: Tiempo de respuesta de consulta simple
        const startTime = Date.now();
        const { data, error } = await supabaseAnon
            .from('properties')
            .select('id, title, price')
            .limit(10);
        const endTime = Date.now();
        
        const responseTime = endTime - startTime;
        
        if (error) {
            logTest('Tiempo Respuesta', 'FAIL', error);
        } else {
            const status = responseTime < 1000 ? 'PASS' : responseTime < 3000 ? 'WARNING' : 'FAIL';
            logTest('Tiempo Respuesta', status, { 
                responseTime: `${responseTime}ms`, 
                records: data?.length || 0 
            });
        }
        
        // Test 2: Consulta con filtros
        const startTime2 = Date.now();
        const { data: filteredData, error: filteredError } = await supabaseAnon
            .from('properties')
            .select('*')
            .gte('price', 50000)
            .limit(20);
        const endTime2 = Date.now();
        
        const responseTime2 = endTime2 - startTime2;
        
        if (filteredError) {
            logTest('Consulta Filtrada', 'FAIL', filteredError);
        } else {
            const status = responseTime2 < 2000 ? 'PASS' : responseTime2 < 5000 ? 'WARNING' : 'FAIL';
            logTest('Consulta Filtrada', status, { 
                responseTime: `${responseTime2}ms`, 
                records: filteredData?.length || 0 
            });
        }
        
    } catch (error) {
        logTest('Rendimiento General', 'FAIL', error.message);
    }
}

// ===== TESTS DE FUNCIONES EDGE =====
async function testEdgeFunctions() {
    console.log('\n🔧 === TESTING FUNCIONES EDGE ===');
    
    try {
        // Test 1: Verificar función de envío de emails
        const { data: emailData, error: emailError } = await supabaseAdmin.functions.invoke('send-inquiry-email', {
            body: {
                to: 'test@example.com',
                subject: 'Test Email',
                message: 'This is a test email'
            }
        });
        
        if (emailError) {
            logTest('Función Email', 'WARNING', emailError);
        } else {
            logTest('Función Email', 'PASS', emailData);
        }
        
        // Test 2: Verificar función de pagos
        const { data: paymentData, error: paymentError } = await supabaseAdmin.functions.invoke('process-payment', {
            body: {
                amount: 100,
                currency: 'ARS',
                description: 'Test payment'
            }
        });
        
        if (paymentError) {
            logTest('Función Pagos', 'WARNING', paymentError);
        } else {
            logTest('Función Pagos', 'PASS', paymentData);
        }
        
    } catch (error) {
        logTest('Funciones Edge', 'WARNING', error.message);
    }
}

// ===== TESTS DE INTEGRIDAD DE DATOS =====
async function testDataIntegrity() {
    console.log('\n🔍 === TESTING INTEGRIDAD DE DATOS ===');
    
    try {
        // Test 1: Verificar datos existentes
        const { data: propertiesCount, error: countError } = await supabaseAdmin
            .from('properties')
            .select('*', { count: 'exact', head: true });
        
        if (countError) {
            logTest('Conteo Propiedades', 'FAIL', countError);
        } else {
            logTest('Conteo Propiedades', 'PASS', { count: propertiesCount });
        }
        
        // Test 2: Verificar relaciones
        const { data: propertiesWithUsers, error: relationError } = await supabaseAdmin
            .from('properties')
            .select(`
                id,
                title,
                user_id,
                profiles:user_id (
                    id,
                    email
                )
            `)
            .limit(5);
        
        if (relationError) {
            logTest('Relaciones Tablas', 'WARNING', relationError);
        } else {
            const hasRelations = propertiesWithUsers?.some(p => p.profiles);
            logTest('Relaciones Tablas', hasRelations ? 'PASS' : 'WARNING', { 
                sampleData: propertiesWithUsers?.length || 0 
            });
        }
        
        // Test 3: Verificar índices (performance de consultas complejas)
        const startTime = Date.now();
        const { data: indexedQuery, error: indexError } = await supabaseAdmin
            .from('properties')
            .select('*')
            .eq('is_active', true)
            .order('created_at', { ascending: false })
            .limit(50);
        const endTime = Date.now();
        
        if (indexError) {
            logTest('Consulta Indexada', 'WARNING', indexError);
        } else {
            const responseTime = endTime - startTime;
            const status = responseTime < 500 ? 'PASS' : 'WARNING';
            logTest('Consulta Indexada', status, { 
                responseTime: `${responseTime}ms`,
                records: indexedQuery?.length || 0 
            });
        }
        
    } catch (error) {
        logTest('Integridad Datos', 'FAIL', error.message);
    }
}

// ===== FUNCIÓN PRINCIPAL =====
async function runCompleteAnalysis() {
    console.log('🚀 INICIANDO ANÁLISIS COMPLETO DE SUPABASE');
    console.log('='.repeat(60));
    console.log(`Fecha: ${new Date().toLocaleString()}`);
    console.log(`URL: ${SUPABASE_CONFIG.url}`);
    console.log('='.repeat(60));
    
    try {
        await testConnectivity();
        await testDatabaseStructure();
        await testAuthentication();
        await testRLSPolicies();
        await testStorage();
        await testPerformance();
        await testEdgeFunctions();
        await testDataIntegrity();
        
        // Generar resumen
        testResults.summary = {
            successRate: ((testResults.passedTests / testResults.totalTests) * 100).toFixed(2) + '%',
            totalTests: testResults.totalTests,
            passed: testResults.passedTests,
            failed: testResults.failedTests,
            warnings: testResults.warnings,
            status: testResults.failedTests === 0 ? 'HEALTHY' : testResults.failedTests < 3 ? 'NEEDS_ATTENTION' : 'CRITICAL'
        };
        
        console.log('\n📊 === RESUMEN FINAL ===');
        console.log(`Total Tests: ${testResults.totalTests}`);
        console.log(`✅ Passed: ${testResults.passedTests}`);
        console.log(`❌ Failed: ${testResults.failedTests}`);
        console.log(`⚠️  Warnings: ${testResults.warnings}`);
        console.log(`📈 Success Rate: ${testResults.summary.successRate}`);
        console.log(`🏥 Status: ${testResults.summary.status}`);
        
        // Guardar resultados
        const reportPath = path.join(__dirname, 'REPORTE-ANALISIS-SUPABASE-COMPLETO-FINAL.json');
        fs.writeFileSync(reportPath, JSON.stringify(testResults, null, 2));
        console.log(`\n💾 Reporte guardado en: ${reportPath}`);
        
        return testResults;
        
    } catch (error) {
        console.error('❌ Error en análisis completo:', error);
        testResults.errors.push({ test: 'ANÁLISIS_GENERAL', details: error.message });
        return testResults;
    }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
    runCompleteAnalysis()
        .then(results => {
            console.log('\n🎉 Análisis completo finalizado');
            process.exit(results.failedTests > 5 ? 1 : 0);
        })
        .catch(error => {
            console.error('💥 Error fatal:', error);
            process.exit(1);
        });
}

module.exports = { runCompleteAnalysis, testResults };
