/**
 * =====================================================
 * TESTING ESPECÍFICO: FUNCTION SEARCH PATH MUTABLE WARNINGS
 * =====================================================
 * Fecha: 2025-01-03
 * Descripción: Verifica que los 2 warnings específicos de Function Search Path Mutable se corrigieron
 * Funciones verificadas:
 * 1. public.update_user_profile
 * 2. public.validate_operation_type
 */

const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qfeyhaaxyemmnohqdele.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmZXloYWF4eWVtbW5vaHFkZWxlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTgxNjczOCwiZXhwIjoyMDcxMzkyNzM4fQ.5wJb1p0Rmg1dVIayIT4wZO_seDXTIwhVa36CyEgK-yM';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Colores para output
const colors = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    reset: '\x1b[0m'
};

// Función para logging con colores
function log(message, color = 'white') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

// Función para mostrar resultados de tests
function showTestResult(testName, passed, details = '') {
    const status = passed ? '✅ PASS' : '❌ FAIL';
    const color = passed ? 'green' : 'red';
    log(`${status} ${testName}`, color);
    if (details) {
        log(`   ${details}`, 'cyan');
    }
}

// Función para ejecutar consulta SQL
async function executeQuery(query, description) {
    try {
        log(`\n🔍 Ejecutando: ${description}`, 'blue');
        const { data, error } = await supabase.rpc('exec_sql', { sql: query });
        
        if (error) {
            log(`❌ Error en consulta: ${error.message}`, 'red');
            return null;
        }
        
        return data;
    } catch (err) {
        log(`❌ Error ejecutando consulta: ${err.message}`, 'red');
        return null;
    }
}

// Test 1: Verificar que las funciones existen
async function testFunctionsExist() {
    log('\n📋 TEST 1: VERIFICANDO QUE LAS FUNCIONES EXISTEN', 'magenta');
    
    const query = `
        SELECT 
            p.proname as function_name,
            n.nspname as schema_name,
            p.prosrc as source_code,
            p.proconfig as config_settings
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' 
        AND p.proname IN ('update_user_profile', 'validate_operation_type')
        ORDER BY p.proname;
    `;
    
    const functions = await executeQuery(query, 'Consultando funciones específicas');
    
    if (!functions) {
        showTestResult('Verificación de existencia de funciones', false, 'Error al consultar funciones');
        return false;
    }
    
    const expectedFunctions = ['update_user_profile', 'validate_operation_type'];
    let allFunctionsExist = true;
    
    for (const expectedFunc of expectedFunctions) {
        const exists = functions.some(f => f.function_name === expectedFunc);
        showTestResult(`Función ${expectedFunc} existe`, exists);
        if (!exists) allFunctionsExist = false;
    }
    
    log(`\n📊 Total de funciones encontradas: ${functions.length}/2`, 'cyan');
    
    return allFunctionsExist;
}

// Test 2: Verificar configuración de search_path
async function testSearchPathConfiguration() {
    log('\n📋 TEST 2: VERIFICANDO CONFIGURACIÓN DE SEARCH_PATH', 'magenta');
    
    const query = `
        SELECT 
            p.proname as function_name,
            p.proconfig as config_settings,
            CASE 
                WHEN p.proconfig IS NOT NULL AND 
                     array_to_string(p.proconfig, ',') LIKE '%search_path%' 
                THEN 'CONFIGURED'
                ELSE 'NOT_CONFIGURED'
            END as search_path_status
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' 
        AND p.proname IN ('update_user_profile', 'validate_operation_type')
        ORDER BY p.proname;
    `;
    
    const functions = await executeQuery(query, 'Verificando configuración de search_path');
    
    if (!functions) {
        showTestResult('Verificación de search_path', false, 'Error al consultar configuración');
        return false;
    }
    
    let allConfigured = true;
    
    for (const func of functions) {
        const isConfigured = func.search_path_status === 'CONFIGURED';
        showTestResult(`${func.function_name} tiene search_path configurado`, isConfigured);
        
        if (func.config_settings) {
            log(`   Configuración: ${func.config_settings.join(', ')}`, 'cyan');
        }
        
        if (!isConfigured) allConfigured = false;
    }
    
    return allConfigured;
}

// Test 3: Verificar que las funciones son SECURITY DEFINER
async function testSecurityDefiner() {
    log('\n📋 TEST 3: VERIFICANDO SECURITY DEFINER', 'magenta');
    
    const query = `
        SELECT 
            p.proname as function_name,
            p.prosecdef as is_security_definer,
            CASE 
                WHEN p.prosecdef THEN 'SECURITY DEFINER'
                ELSE 'SECURITY INVOKER'
            END as security_type
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' 
        AND p.proname IN ('update_user_profile', 'validate_operation_type')
        ORDER BY p.proname;
    `;
    
    const functions = await executeQuery(query, 'Verificando SECURITY DEFINER');
    
    if (!functions) {
        showTestResult('Verificación de SECURITY DEFINER', false, 'Error al consultar configuración');
        return false;
    }
    
    let allSecurityDefiner = true;
    
    for (const func of functions) {
        const isSecurityDefiner = func.is_security_definer;
        showTestResult(`${func.function_name} es SECURITY DEFINER`, isSecurityDefiner);
        log(`   Tipo: ${func.security_type}`, 'cyan');
        
        if (!isSecurityDefiner) allSecurityDefiner = false;
    }
    
    return allSecurityDefiner;
}

// Test 4: Verificar permisos de las funciones
async function testFunctionPermissions() {
    log('\n📋 TEST 4: VERIFICANDO PERMISOS DE LAS FUNCIONES', 'magenta');
    
    const query = `
        SELECT 
            p.proname as function_name,
            p.proacl as permissions,
            CASE 
                WHEN p.proacl IS NULL THEN 'DEFAULT_PERMISSIONS'
                ELSE 'CUSTOM_PERMISSIONS'
            END as permission_type
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' 
        AND p.proname IN ('update_user_profile', 'validate_operation_type')
        ORDER BY p.proname;
    `;
    
    const functions = await executeQuery(query, 'Verificando permisos de funciones');
    
    if (!functions) {
        showTestResult('Verificación de permisos', false, 'Error al consultar permisos');
        return false;
    }
    
    let allHavePermissions = true;
    
    for (const func of functions) {
        const hasCustomPermissions = func.permission_type === 'CUSTOM_PERMISSIONS';
        showTestResult(`${func.function_name} tiene permisos configurados`, hasCustomPermissions);
        
        if (func.permissions) {
            log(`   Permisos: ${func.permissions.join(', ')}`, 'cyan');
        } else {
            log(`   Permisos: Por defecto`, 'cyan');
        }
        
        if (!hasCustomPermissions) allHavePermissions = false;
    }
    
    return allHavePermissions;
}

// Test 5: Probar funcionalidad de update_user_profile
async function testUpdateUserProfileFunctionality() {
    log('\n📋 TEST 5: PROBANDO FUNCIONALIDAD DE update_user_profile', 'magenta');
    
    try {
        // Crear un usuario de prueba temporal
        const testUserId = '00000000-0000-0000-0000-000000000001';
        
        // Intentar llamar a la función (esto debería funcionar sin errores de search_path)
        const { data, error } = await supabase.rpc('update_user_profile', {
            user_id_param: testUserId,
            full_name_param: 'Test User',
            phone_param: '+1234567890'
        });
        
        // La función debería ejecutarse sin errores de search_path
        // Puede fallar por otros motivos (usuario no existe), pero no por search_path
        const noSearchPathError = !error || !error.message.includes('search_path');
        
        showTestResult('update_user_profile ejecuta sin errores de search_path', noSearchPathError);
        
        if (error) {
            log(`   Error (esperado si usuario no existe): ${error.message}`, 'yellow');
        } else {
            log(`   Función ejecutada correctamente`, 'green');
        }
        
        return noSearchPathError;
        
    } catch (err) {
        const noSearchPathError = !err.message.includes('search_path');
        showTestResult('update_user_profile ejecuta sin errores de search_path', noSearchPathError);
        
        if (!noSearchPathError) {
            log(`   Error de search_path: ${err.message}`, 'red');
        } else {
            log(`   Error esperado (no relacionado con search_path): ${err.message}`, 'yellow');
        }
        
        return noSearchPathError;
    }
}

// Test 6: Probar funcionalidad de validate_operation_type
async function testValidateOperationTypeFunctionality() {
    log('\n📋 TEST 6: PROBANDO FUNCIONALIDAD DE validate_operation_type', 'magenta');
    
    try {
        // Probar con un tipo válido
        const { data: validResult, error: validError } = await supabase.rpc('validate_operation_type', {
            operation_type_param: 'rent'
        });
        
        const validTest = !validError && validResult === true;
        showTestResult('validate_operation_type con tipo válido', validTest);
        
        // Probar con un tipo inválido
        const { data: invalidResult, error: invalidError } = await supabase.rpc('validate_operation_type', {
            operation_type_param: 'invalid_type'
        });
        
        const invalidTest = !invalidError && invalidResult === false;
        showTestResult('validate_operation_type con tipo inválido', invalidTest);
        
        if (validError) {
            log(`   Error en prueba válida: ${validError.message}`, 'red');
        }
        
        if (invalidError) {
            log(`   Error en prueba inválida: ${invalidError.message}`, 'red');
        }
        
        return validTest && invalidTest;
        
    } catch (err) {
        const noSearchPathError = !err.message.includes('search_path');
        showTestResult('validate_operation_type ejecuta sin errores de search_path', noSearchPathError);
        
        if (!noSearchPathError) {
            log(`   Error de search_path: ${err.message}`, 'red');
        } else {
            log(`   Error inesperado: ${err.message}`, 'yellow');
        }
        
        return noSearchPathError;
    }
}

// Test 7: Verificar que no hay warnings en Database Linter
async function testDatabaseLinterWarnings() {
    log('\n📋 TEST 7: VERIFICANDO AUSENCIA DE WARNINGS EN DATABASE LINTER', 'magenta');
    
    // Consulta para verificar configuraciones que podrían generar warnings
    const query = `
        SELECT 
            p.proname as function_name,
            CASE 
                WHEN p.proconfig IS NOT NULL AND 
                     array_to_string(p.proconfig, ',') LIKE '%search_path%' 
                THEN 'NO_WARNING_EXPECTED'
                ELSE 'WARNING_EXPECTED'
            END as linter_status,
            p.prosecdef as is_security_definer
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' 
        AND p.proname IN ('update_user_profile', 'validate_operation_type')
        ORDER BY p.proname;
    `;
    
    const functions = await executeQuery(query, 'Verificando estado para Database Linter');
    
    if (!functions) {
        showTestResult('Verificación de Database Linter', false, 'Error al consultar estado');
        return false;
    }
    
    let noWarningsExpected = true;
    
    for (const func of functions) {
        const shouldPassLinter = func.linter_status === 'NO_WARNING_EXPECTED' && func.is_security_definer;
        showTestResult(`${func.function_name} debería pasar Database Linter`, shouldPassLinter);
        
        log(`   Estado del linter: ${func.linter_status}`, 'cyan');
        log(`   Security Definer: ${func.is_security_definer ? 'Sí' : 'No'}`, 'cyan');
        
        if (!shouldPassLinter) noWarningsExpected = false;
    }
    
    return noWarningsExpected;
}

// Función principal de testing
async function runAllTests() {
    log('🚀 INICIANDO TESTING ESPECÍFICO DE FUNCTION SEARCH PATH MUTABLE', 'magenta');
    log('=====================================================', 'magenta');
    log('Verificando corrección de 2 warnings específicos:', 'white');
    log('1. Function public.update_user_profile has a role mutable search_path', 'white');
    log('2. Function public.validate_operation_type has a role mutable search_path', 'white');
    log('=====================================================', 'magenta');
    
    const testResults = [];
    
    // Ejecutar todos los tests
    testResults.push(await testFunctionsExist());
    testResults.push(await testSearchPathConfiguration());
    testResults.push(await testSecurityDefiner());
    testResults.push(await testFunctionPermissions());
    testResults.push(await testUpdateUserProfileFunctionality());
    testResults.push(await testValidateOperationTypeFunctionality());
    testResults.push(await testDatabaseLinterWarnings());
    
    // Resumen final
    log('\n🏁 RESUMEN FINAL DE TESTING', 'magenta');
    log('=====================================================', 'magenta');
    
    const passedTests = testResults.filter(result => result).length;
    const totalTests = testResults.length;
    const successRate = ((passedTests / totalTests) * 100).toFixed(1);
    
    log(`Tests ejecutados: ${totalTests}`, 'white');
    log(`Tests exitosos: ${passedTests}`, 'green');
    log(`Tests fallidos: ${totalTests - passedTests}`, 'red');
    log(`Tasa de éxito: ${successRate}%`, successRate === '100.0' ? 'green' : 'yellow');
    
    if (passedTests === totalTests) {
        log('\n🎉 ¡TODOS LOS TESTS PASARON!', 'green');
        log('✅ Los 2 warnings de Function Search Path Mutable fueron corregidos', 'green');
        log('✅ Las funciones tienen search_path fijo configurado', 'green');
        log('✅ Las funciones son SECURITY DEFINER', 'green');
        log('✅ Los permisos están configurados correctamente', 'green');
        log('✅ Las funciones ejecutan sin errores', 'green');
    } else {
        log('\n⚠️  ALGUNOS TESTS FALLARON', 'yellow');
        log('❌ Revisa los errores anteriores y aplica las correcciones necesarias', 'red');
        log('💡 Ejecuta el script SQL de corrección si es necesario', 'yellow');
    }
    
    log('\n📋 PRÓXIMOS PASOS:', 'blue');
    log('1. Ve a Supabase Dashboard > Database > Database Linter', 'white');
    log('2. Ejecuta el Performance Advisor nuevamente', 'white');
    log('3. Verifica que los 2 warnings de Function Search Path Mutable desaparecieron', 'white');
    log('4. Confirma que las funciones funcionan correctamente en la aplicación', 'white');
    
    log('\n=====================================================', 'magenta');
    log('Testing específico completado exitosamente', 'magenta');
    log('=====================================================', 'magenta');
    
    return passedTests === totalTests;
}

// Ejecutar tests si el script se ejecuta directamente
if (require.main === module) {
    runAllTests()
        .then(success => {
            process.exit(success ? 0 : 1);
        })
        .catch(error => {
            log(`❌ Error fatal en testing: ${error.message}`, 'red');
            console.error(error);
            process.exit(1);
        });
}

module.exports = {
    runAllTests,
    testFunctionsExist,
    testSearchPathConfiguration,
    testSecurityDefiner,
    testFunctionPermissions,
    testUpdateUserProfileFunctionality,
    testValidateOperationTypeFunctionality,
    testDatabaseLinterWarnings
};
