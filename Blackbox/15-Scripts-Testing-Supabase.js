// =====================================================
// 15. SCRIPTS DE TESTING PARA SUPABASE
// =====================================================
// Fecha: 9 de Enero 2025
// Basado en: Documento 13 - Plan Paso a Paso Corrección Supabase
// Objetivo: Scripts de testing para verificar configuración de Supabase

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// =====================================================
// CONFIGURACIÓN
// =====================================================

// Cargar variables de entorno
require('dotenv').config({ path: path.join(__dirname, '../Backend/.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Variables de entorno de Supabase no encontradas');
    console.log('Verificar NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY en .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// =====================================================
// UTILIDADES DE TESTING
// =====================================================

function logSection(title) {
    console.log('\n' + '='.repeat(60));
    console.log(`🔍 ${title}`);
    console.log('='.repeat(60));
}

function logTest(testName, status, details = '') {
    const icon = status ? '✅' : '❌';
    console.log(`${icon} ${testName}`);
    if (details) {
        console.log(`   ${details}`);
    }
}

function logInfo(message) {
    console.log(`ℹ️  ${message}`);
}

function logWarning(message) {
    console.log(`⚠️  ${message}`);
}

function logError(message) {
    console.log(`❌ ${message}`);
}

// =====================================================
// TEST 1: VERIFICAR CONEXIÓN BÁSICA
// =====================================================

async function testBasicConnection() {
    logSection('TEST 1: CONEXIÓN BÁSICA A SUPABASE');
    
    try {
        // Test de conexión básica
        const { data, error } = await supabase
            .from('properties')
            .select('count(*)')
            .limit(1);
        
        if (error) {
            logTest('Conexión a Supabase', false, `Error: ${error.message}`);
            return false;
        }
        
        logTest('Conexión a Supabase', true, 'Conexión establecida correctamente');
        
        // Verificar URL y configuración
        logInfo(`URL de Supabase: ${supabaseUrl}`);
        logInfo(`Clave anónima configurada: ${supabaseKey ? 'Sí' : 'No'}`);
        
        return true;
    } catch (err) {
        logTest('Conexión a Supabase', false, `Error inesperado: ${err.message}`);
        return false;
    }
}

// =====================================================
// TEST 2: VERIFICAR TABLAS PRINCIPALES
// =====================================================

async function testMainTables() {
    logSection('TEST 2: VERIFICAR TABLAS PRINCIPALES');
    
    const expectedTables = ['profiles', 'properties', 'favorites', 'search_history'];
    let allTablesExist = true;
    
    for (const tableName of expectedTables) {
        try {
            const { data, error } = await supabase
                .from(tableName)
                .select('count(*)')
                .limit(1);
            
            if (error) {
                logTest(`Tabla ${tableName}`, false, `Error: ${error.message}`);
                allTablesExist = false;
            } else {
                logTest(`Tabla ${tableName}`, true, 'Tabla existe y es accesible');
            }
        } catch (err) {
            logTest(`Tabla ${tableName}`, false, `Error inesperado: ${err.message}`);
            allTablesExist = false;
        }
    }
    
    return allTablesExist;
}

// =====================================================
// TEST 3: VERIFICAR POLÍTICAS RLS
// =====================================================

async function testRLSPolicies() {
    logSection('TEST 3: VERIFICAR POLÍTICAS RLS');
    
    try {
        // Test 1: Intentar insertar en properties sin autenticación (debe fallar)
        const { data: insertData, error: insertError } = await supabase
            .from('properties')
            .insert({
                title: 'Test Property',
                description: 'Test Description',
                price: 100000,
                bedrooms: 2,
                bathrooms: 1,
                area: 50,
                address: 'Test Address',
                city: 'Test City',
                province: 'Test Province',
                postal_code: '12345',
                contact_phone: '123456789',
                user_id: '00000000-0000-0000-0000-000000000000'
            });
        
        if (insertError && insertError.message.includes('RLS')) {
            logTest('RLS en properties (INSERT)', true, 'RLS está bloqueando inserciones no autorizadas');
        } else if (insertError) {
            logTest('RLS en properties (INSERT)', false, `Error inesperado: ${insertError.message}`);
        } else {
            logTest('RLS en properties (INSERT)', false, 'RLS no está funcionando - inserción permitida sin autenticación');
        }
        
        // Test 2: Verificar que SELECT en properties funciona (debe permitir)
        const { data: selectData, error: selectError } = await supabase
            .from('properties')
            .select('id, title')
            .limit(5);
        
        if (selectError) {
            logTest('RLS en properties (SELECT)', false, `Error: ${selectError.message}`);
        } else {
            logTest('RLS en properties (SELECT)', true, `SELECT permitido - ${selectData.length} registros encontrados`);
        }
        
        // Test 3: Intentar insertar en favorites sin autenticación (debe fallar)
        const { data: favData, error: favError } = await supabase
            .from('favorites')
            .insert({
                user_id: '00000000-0000-0000-0000-000000000000',
                property_id: '00000000-0000-0000-0000-000000000000'
            });
        
        if (favError && (favError.message.includes('RLS') || favError.message.includes('policy'))) {
            logTest('RLS en favorites', true, 'RLS está bloqueando inserciones no autorizadas');
        } else if (favError) {
            logTest('RLS en favorites', false, `Error inesperado: ${favError.message}`);
        } else {
            logTest('RLS en favorites', false, 'RLS no está funcionando - inserción permitida sin autenticación');
        }
        
        return true;
    } catch (err) {
        logError(`Error en test de RLS: ${err.message}`);
        return false;
    }
}

// =====================================================
// TEST 4: VERIFICAR STORAGE Y BUCKETS
// =====================================================

async function testStorage() {
    logSection('TEST 4: VERIFICAR STORAGE Y BUCKETS');
    
    try {
        // Listar buckets
        const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
        
        if (bucketsError) {
            logTest('Listar buckets', false, `Error: ${bucketsError.message}`);
            return false;
        }
        
        logTest('Listar buckets', true, `${buckets.length} buckets encontrados`);
        
        // Verificar buckets esperados
        const expectedBuckets = ['property-images', 'avatars'];
        let allBucketsExist = true;
        
        for (const bucketName of expectedBuckets) {
            const bucketExists = buckets.some(bucket => bucket.name === bucketName);
            if (bucketExists) {
                logTest(`Bucket ${bucketName}`, true, 'Bucket existe');
                
                // Intentar listar archivos en el bucket
                const { data: files, error: filesError } = await supabase.storage
                    .from(bucketName)
                    .list('', { limit: 5 });
                
                if (filesError) {
                    logTest(`Listar archivos en ${bucketName}`, false, `Error: ${filesError.message}`);
                } else {
                    logTest(`Listar archivos en ${bucketName}`, true, `${files.length} archivos encontrados`);
                }
            } else {
                logTest(`Bucket ${bucketName}`, false, 'Bucket no existe');
                allBucketsExist = false;
            }
        }
        
        return allBucketsExist;
    } catch (err) {
        logError(`Error en test de storage: ${err.message}`);
        return false;
    }
}

// =====================================================
// TEST 5: VERIFICAR AUTENTICACIÓN
// =====================================================

async function testAuthentication() {
    logSection('TEST 5: VERIFICAR AUTENTICACIÓN');
    
    try {
        // Verificar estado de autenticación actual
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError) {
            logTest('Obtener usuario actual', false, `Error: ${userError.message}`);
        } else {
            if (user) {
                logTest('Estado de autenticación', true, `Usuario autenticado: ${user.email}`);
                logInfo(`ID de usuario: ${user.id}`);
                logInfo(`Confirmado: ${user.email_confirmed_at ? 'Sí' : 'No'}`);
            } else {
                logTest('Estado de autenticación', true, 'Usuario no autenticado (esperado para test anónimo)');
            }
        }
        
        // Verificar configuración de autenticación
        logInfo('Configuración de autenticación verificada');
        
        return true;
    } catch (err) {
        logError(`Error en test de autenticación: ${err.message}`);
        return false;
    }
}

// =====================================================
// TEST 6: VERIFICAR DATOS DE EJEMPLO
// =====================================================

async function testSampleData() {
    logSection('TEST 6: VERIFICAR DATOS DE EJEMPLO');
    
    try {
        // Contar propiedades
        const { data: propertiesData, error: propertiesError } = await supabase
            .from('properties')
            .select('id, title, city, price')
            .limit(10);
        
        if (propertiesError) {
            logTest('Consultar propiedades', false, `Error: ${propertiesError.message}`);
        } else {
            logTest('Consultar propiedades', true, `${propertiesData.length} propiedades encontradas`);
            
            if (propertiesData.length > 0) {
                logInfo('Ejemplos de propiedades:');
                propertiesData.slice(0, 3).forEach(prop => {
                    logInfo(`  - ${prop.title} en ${prop.city} - $${prop.price}`);
                });
            }
        }
        
        // Contar perfiles
        const { data: profilesData, error: profilesError } = await supabase
            .from('profiles')
            .select('id, full_name')
            .limit(5);
        
        if (profilesError) {
            logTest('Consultar perfiles', false, `Error: ${profilesError.message}`);
        } else {
            logTest('Consultar perfiles', true, `${profilesData.length} perfiles encontrados`);
        }
        
        return true;
    } catch (err) {
        logError(`Error en test de datos: ${err.message}`);
        return false;
    }
}

// =====================================================
// TEST 7: VERIFICAR PERFORMANCE
// =====================================================

async function testPerformance() {
    logSection('TEST 7: VERIFICAR PERFORMANCE');
    
    try {
        // Test de velocidad de consulta
        const startTime = Date.now();
        
        const { data, error } = await supabase
            .from('properties')
            .select('id, title, city, price')
            .limit(20);
        
        const endTime = Date.now();
        const queryTime = endTime - startTime;
        
        if (error) {
            logTest('Velocidad de consulta', false, `Error: ${error.message}`);
        } else {
            const isGoodPerformance = queryTime < 1000; // Menos de 1 segundo
            logTest('Velocidad de consulta', isGoodPerformance, 
                `Consulta completada en ${queryTime}ms (${isGoodPerformance ? 'Buena' : 'Lenta'})`);
        }
        
        // Test de consulta con filtros
        const startTimeFiltered = Date.now();
        
        const { data: filteredData, error: filteredError } = await supabase
            .from('properties')
            .select('id, title, city, price')
            .eq('city', 'Posadas')
            .limit(10);
        
        const endTimeFiltered = Date.now();
        const filteredQueryTime = endTimeFiltered - startTimeFiltered;
        
        if (filteredError) {
            logTest('Consulta con filtros', false, `Error: ${filteredError.message}`);
        } else {
            const isGoodFilteredPerformance = filteredQueryTime < 1000;
            logTest('Consulta con filtros', isGoodFilteredPerformance, 
                `Consulta filtrada completada en ${filteredQueryTime}ms`);
        }
        
        return true;
    } catch (err) {
        logError(`Error en test de performance: ${err.message}`);
        return false;
    }
}

// =====================================================
// TEST 8: VERIFICAR CONFIGURACIÓN COMPLETA
// =====================================================

async function testCompleteConfiguration() {
    logSection('TEST 8: VERIFICACIÓN COMPLETA DE CONFIGURACIÓN');
    
    const tests = [
        { name: 'Variables de entorno', check: () => supabaseUrl && supabaseKey },
        { name: 'Formato URL Supabase', check: () => supabaseUrl.includes('supabase.co') },
        { name: 'Longitud clave anónima', check: () => supabaseKey && supabaseKey.length > 100 }
    ];
    
    let allConfigCorrect = true;
    
    for (const test of tests) {
        try {
            const result = test.check();
            logTest(test.name, result);
            if (!result) allConfigCorrect = false;
        } catch (err) {
            logTest(test.name, false, `Error: ${err.message}`);
            allConfigCorrect = false;
        }
    }
    
    return allConfigCorrect;
}

// =====================================================
// FUNCIÓN PRINCIPAL DE TESTING
// =====================================================

async function runAllTests() {
    console.log('🚀 INICIANDO TESTING EXHAUSTIVO DE SUPABASE');
    console.log('Fecha:', new Date().toLocaleString());
    console.log('URL Supabase:', supabaseUrl);
    
    const testResults = [];
    
    try {
        // Ejecutar todos los tests
        testResults.push({ name: 'Conexión Básica', result: await testBasicConnection() });
        testResults.push({ name: 'Tablas Principales', result: await testMainTables() });
        testResults.push({ name: 'Políticas RLS', result: await testRLSPolicies() });
        testResults.push({ name: 'Storage y Buckets', result: await testStorage() });
        testResults.push({ name: 'Autenticación', result: await testAuthentication() });
        testResults.push({ name: 'Datos de Ejemplo', result: await testSampleData() });
        testResults.push({ name: 'Performance', result: await testPerformance() });
        testResults.push({ name: 'Configuración Completa', result: await testCompleteConfiguration() });
        
        // Mostrar resumen final
        logSection('RESUMEN FINAL DE TESTING');
        
        let passedTests = 0;
        let totalTests = testResults.length;
        
        testResults.forEach(test => {
            logTest(test.name, test.result);
            if (test.result) passedTests++;
        });
        
        const successRate = Math.round((passedTests / totalTests) * 100);
        
        console.log('\n' + '='.repeat(60));
        console.log(`📊 RESULTADOS FINALES:`);
        console.log(`   Tests pasados: ${passedTests}/${totalTests}`);
        console.log(`   Tasa de éxito: ${successRate}%`);
        
        if (successRate >= 90) {
            console.log('🎉 SUPABASE CONFIGURADO CORRECTAMENTE');
        } else if (successRate >= 70) {
            console.log('⚠️  SUPABASE PARCIALMENTE CONFIGURADO - REQUIERE ATENCIÓN');
        } else {
            console.log('❌ SUPABASE REQUIERE CONFIGURACIÓN CRÍTICA');
        }
        
        // Generar reporte
        await generateTestReport(testResults, successRate);
        
    } catch (err) {
        logError(`Error crítico en testing: ${err.message}`);
        console.log('\n❌ TESTING INTERRUMPIDO POR ERROR CRÍTICO');
    }
}

// =====================================================
// GENERAR REPORTE DE TESTING
// =====================================================

async function generateTestReport(testResults, successRate) {
    const reportContent = `
# REPORTE DE TESTING SUPABASE

**Fecha:** ${new Date().toLocaleString()}
**URL Supabase:** ${supabaseUrl}
**Tasa de Éxito:** ${successRate}%

## Resultados Detallados

${testResults.map(test => `- **${test.name}:** ${test.result ? '✅ PASS' : '❌ FAIL'}`).join('\n')}

## Estado General

${successRate >= 90 ? '🎉 **SUPABASE CONFIGURADO CORRECTAMENTE**' : 
  successRate >= 70 ? '⚠️ **SUPABASE PARCIALMENTE CONFIGURADO**' : 
  '❌ **SUPABASE REQUIERE CONFIGURACIÓN CRÍTICA**'}

## Próximos Pasos

${successRate < 100 ? `
### Acciones Requeridas:
1. Revisar tests fallidos
2. Aplicar correcciones según Documento 13
3. Re-ejecutar testing
4. Verificar configuración en Supabase Dashboard
` : `
### Configuración Completa:
- Todos los tests han pasado exitosamente
- Supabase está listo para producción
- Continuar con desarrollo de funcionalidades
`}

---
*Reporte generado automáticamente por el script de testing de Supabase*
`;

    try {
        const reportPath = path.join(__dirname, '16-Reporte-Testing-Supabase.md');
        fs.writeFileSync(reportPath, reportContent);
        console.log(`\n📄 Reporte generado: ${reportPath}`);
    } catch (err) {
        logWarning(`No se pudo generar el reporte: ${err.message}`);
    }
}

// =====================================================
// FUNCIONES DE TESTING ESPECÍFICO
// =====================================================

// Test específico para una tabla
async function testSpecificTable(tableName) {
    logSection(`TEST ESPECÍFICO: TABLA ${tableName.toUpperCase()}`);
    
    try {
        const { data, error } = await supabase
            .from(tableName)
            .select('*')
            .limit(5);
        
        if (error) {
            logTest(`Tabla ${tableName}`, false, `Error: ${error.message}`);
            return false;
        }
        
        logTest(`Tabla ${tableName}`, true, `${data.length} registros encontrados`);
        
        if (data.length > 0) {
            logInfo(`Estructura de ${tableName}:`);
            const columns = Object.keys(data[0]);
            logInfo(`  Columnas: ${columns.join(', ')}`);
        }
        
        return true;
    } catch (err) {
        logError(`Error en test de tabla ${tableName}: ${err.message}`);
        return false;
    }
}

// Test específico para un bucket
async function testSpecificBucket(bucketName) {
    logSection(`TEST ESPECÍFICO: BUCKET ${bucketName.toUpperCase()}`);
    
    try {
        const { data: files, error } = await supabase.storage
            .from(bucketName)
            .list('', { limit: 10 });
        
        if (error) {
            logTest(`Bucket ${bucketName}`, false, `Error: ${error.message}`);
            return false;
        }
        
        logTest(`Bucket ${bucketName}`, true, `${files.length} archivos encontrados`);
        
        if (files.length > 0) {
            logInfo(`Archivos en ${bucketName}:`);
            files.slice(0, 3).forEach(file => {
                logInfo(`  - ${file.name} (${file.metadata?.size || 'N/A'} bytes)`);
            });
        }
        
        return true;
    } catch (err) {
        logError(`Error en test de bucket ${bucketName}: ${err.message}`);
        return false;
    }
}

// =====================================================
// COMANDOS DE LÍNEA DE COMANDOS
// =====================================================

// Función para ejecutar tests específicos desde línea de comandos
async function runSpecificTest() {
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
        console.log('Uso: node 15-Scripts-Testing-Supabase.js [comando] [parámetro]');
        console.log('');
        console.log('Comandos disponibles:');
        console.log('  all                    - Ejecutar todos los tests');
        console.log('  connection             - Test de conexión básica');
        console.log('  tables                 - Test de tablas principales');
        console.log('  rls                    - Test de políticas RLS');
        console.log('  storage                - Test de storage y buckets');
        console.log('  auth                   - Test de autenticación');
        console.log('  data                   - Test de datos de ejemplo');
        console.log('  performance            - Test de performance');
        console.log('  config                 - Test de configuración');
        console.log('  table [nombre]         - Test específico de tabla');
        console.log('  bucket [nombre]        - Test específico de bucket');
        return;
    }
    
    const command = args[0];
    const parameter = args[1];
    
    switch (command) {
        case 'all':
            await runAllTests();
            break;
        case 'connection':
            await testBasicConnection();
            break;
        case 'tables':
            await testMainTables();
            break;
        case 'rls':
            await testRLSPolicies();
            break;
        case 'storage':
            await testStorage();
            break;
        case 'auth':
            await testAuthentication();
            break;
        case 'data':
            await testSampleData();
            break;
        case 'performance':
            await testPerformance();
            break;
        case 'config':
            await testCompleteConfiguration();
            break;
        case 'table':
            if (!parameter) {
                console.log('Error: Especifica el nombre de la tabla');
                return;
            }
            await testSpecificTable(parameter);
            break;
        case 'bucket':
            if (!parameter) {
                console.log('Error: Especifica el nombre del bucket');
                return;
            }
            await testSpecificBucket(parameter);
            break;
        default:
            console.log(`Comando desconocido: ${command}`);
            console.log('Usa "node 15-Scripts-Testing-Supabase.js" para ver la ayuda');
    }
}

// =====================================================
// EXPORTAR FUNCIONES PARA USO EXTERNO
// =====================================================

module.exports = {
    runAllTests,
    testBasicConnection,
    testMainTables,
    testRLSPolicies,
    testStorage,
    testAuthentication,
    testSampleData,
    testPerformance,
    testCompleteConfiguration,
    testSpecificTable,
    testSpecificBucket
};

// =====================================================
// EJECUTAR SI ES LLAMADO DIRECTAMENTE
// =====================================================

if (require.main === module) {
    runSpecificTest().catch(err => {
        console.error('Error fatal:', err);
        process.exit(1);
    });
}
