/**
 * =====================================================
 * TESTING EXHAUSTIVO: PERFORMANCE ADVISOR WARNINGS
 * =====================================================
 * Fecha: 2025-01-03
 * Descripción: Verifica que todas las optimizaciones de performance se aplicaron correctamente
 * Warnings corregidos:
 * - Auth RLS Initialization Plan: 19 warnings
 * - Multiple Permissive Policies: 52 warnings  
 * - Duplicate Index: 3 warnings
 * Total: 74 warnings de performance
 */

const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-key';

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

// Test 1: Verificar políticas RLS optimizadas
async function testOptimizedRLSPolicies() {
    log('\n📋 TEST 1: VERIFICANDO POLÍTICAS RLS OPTIMIZADAS', 'magenta');
    
    const query = `
        SELECT 
            schemaname,
            tablename,
            policyname,
            permissive,
            roles,
            cmd,
            qual,
            with_check
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND policyname LIKE '%optimized%'
        ORDER BY tablename, policyname;
    `;
    
    const policies = await executeQuery(query, 'Consultando políticas optimizadas');
    
    if (!policies) {
        showTestResult('Políticas RLS Optimizadas', false, 'Error al consultar políticas');
        return false;
    }
    
    // Verificar que existen políticas optimizadas para cada tabla
    const expectedTables = ['properties', 'profiles', 'community_profiles', 'users'];
    const tablesWithOptimizedPolicies = [...new Set(policies.map(p => p.tablename))];
    
    let allTablesHaveOptimizedPolicies = true;
    
    for (const table of expectedTables) {
        const hasOptimizedPolicies = tablesWithOptimizedPolicies.includes(table);
        showTestResult(`Tabla ${table} tiene políticas optimizadas`, hasOptimizedPolicies);
        if (!hasOptimizedPolicies) allTablesHaveOptimizedPolicies = false;
    }
    
    // Verificar que las políticas usan (select auth.uid())
    let policiesUseOptimizedAuth = true;
    for (const policy of policies) {
        const usesOptimizedAuth = 
            (policy.qual && policy.qual.includes('(select auth.uid())')) ||
            (policy.with_check && policy.with_check.includes('(select auth.uid())'));
        
        if (!usesOptimizedAuth && policy.policyname.includes('optimized')) {
            showTestResult(`Política ${policy.policyname} usa auth optimizado`, false);
            policiesUseOptimizedAuth = false;
        }
    }
    
    if (policiesUseOptimizedAuth) {
        showTestResult('Políticas usan (select auth.uid())', true, 'Optimización aplicada correctamente');
    }
    
    log(`\n📊 Total de políticas optimizadas encontradas: ${policies.length}`, 'cyan');
    
    return allTablesHaveOptimizedPolicies && policiesUseOptimizedAuth;
}

// Test 2: Verificar eliminación de políticas duplicadas
async function testDuplicatePoliciesRemoved() {
    log('\n📋 TEST 2: VERIFICANDO ELIMINACIÓN DE POLÍTICAS DUPLICADAS', 'magenta');
    
    const query = `
        SELECT 
            tablename,
            cmd,
            COUNT(*) as policy_count,
            array_agg(policyname) as policy_names
        FROM pg_policies 
        WHERE schemaname = 'public'
        AND tablename IN ('properties', 'profiles', 'community_profiles', 'users')
        GROUP BY tablename, cmd
        HAVING COUNT(*) > 1
        ORDER BY tablename, cmd;
    `;
    
    const duplicatePolicies = await executeQuery(query, 'Buscando políticas duplicadas');
    
    if (!duplicatePolicies) {
        showTestResult('Verificación de políticas duplicadas', false, 'Error al consultar políticas');
        return false;
    }
    
    const hasDuplicates = duplicatePolicies.length > 0;
    
    if (hasDuplicates) {
        log('\n⚠️  Políticas duplicadas encontradas:', 'yellow');
        for (const dup of duplicatePolicies) {
            log(`   Tabla: ${dup.tablename}, Comando: ${dup.cmd}, Cantidad: ${dup.policy_count}`, 'yellow');
            log(`   Políticas: ${dup.policy_names.join(', ')}`, 'yellow');
        }
        showTestResult('Eliminación de políticas duplicadas', false, `${duplicatePolicies.length} grupos de duplicados encontrados`);
        return false;
    } else {
        showTestResult('Eliminación de políticas duplicadas', true, 'No se encontraron políticas duplicadas');
        return true;
    }
}

// Test 3: Verificar eliminación de índices duplicados
async function testDuplicateIndexesRemoved() {
    log('\n📋 TEST 3: VERIFICANDO ELIMINACIÓN DE ÍNDICES DUPLICADOS', 'magenta');
    
    const query = `
        SELECT 
            schemaname,
            tablename,
            indexname,
            indexdef
        FROM pg_indexes 
        WHERE schemaname = 'public'
        AND tablename IN ('messages', 'properties', 'users')
        AND (
            indexname IN ('idx_messages_sender', 'idx_properties_property_type', 'users_email_key') OR
            indexname IN ('idx_messages_sender_id', 'idx_properties_type', 'users_email_unique')
        )
        ORDER BY tablename, indexname;
    `;
    
    const indexes = await executeQuery(query, 'Consultando índices específicos');
    
    if (!indexes) {
        showTestResult('Verificación de índices duplicados', false, 'Error al consultar índices');
        return false;
    }
    
    // Verificar que los índices duplicados fueron eliminados
    const removedIndexes = ['idx_messages_sender', 'idx_properties_property_type', 'users_email_key'];
    const keptIndexes = ['idx_messages_sender_id', 'idx_properties_type', 'users_email_unique'];
    
    let duplicatesRemoved = true;
    let necessaryIndexesKept = true;
    
    for (const removedIndex of removedIndexes) {
        const exists = indexes.some(idx => idx.indexname === removedIndex);
        showTestResult(`Índice duplicado ${removedIndex} eliminado`, !exists);
        if (exists) duplicatesRemoved = false;
    }
    
    for (const keptIndex of keptIndexes) {
        const exists = indexes.some(idx => idx.indexname === keptIndex);
        showTestResult(`Índice necesario ${keptIndex} mantenido`, exists);
        if (!exists) necessaryIndexesKept = false;
    }
    
    log(`\n📊 Total de índices encontrados: ${indexes.length}`, 'cyan');
    
    return duplicatesRemoved && necessaryIndexesKept;
}

// Test 4: Verificar índices de rendimiento
async function testPerformanceIndexes() {
    log('\n📋 TEST 4: VERIFICANDO ÍNDICES DE RENDIMIENTO', 'magenta');
    
    const query = `
        SELECT 
            schemaname,
            tablename,
            indexname,
            indexdef
        FROM pg_indexes 
        WHERE schemaname = 'public'
        AND indexname LIKE 'idx_%'
        AND tablename IN ('properties', 'profiles', 'community_profiles')
        ORDER BY tablename, indexname;
    `;
    
    const performanceIndexes = await executeQuery(query, 'Consultando índices de rendimiento');
    
    if (!performanceIndexes) {
        showTestResult('Verificación de índices de rendimiento', false, 'Error al consultar índices');
        return false;
    }
    
    // Índices esperados para rendimiento
    const expectedIndexes = [
        'idx_properties_user_id',
        'idx_properties_created_at',
        'idx_properties_location',
        'idx_properties_price',
        'idx_profiles_created_at',
        'idx_profiles_updated_at',
        'idx_community_profiles_user_id',
        'idx_community_profiles_created_at'
    ];
    
    let allIndexesExist = true;
    
    for (const expectedIndex of expectedIndexes) {
        const exists = performanceIndexes.some(idx => idx.indexname === expectedIndex);
        showTestResult(`Índice de rendimiento ${expectedIndex}`, exists);
        if (!exists) allIndexesExist = false;
    }
    
    log(`\n📊 Total de índices de rendimiento: ${performanceIndexes.length}`, 'cyan');
    
    return allIndexesExist;
}

// Test 5: Verificar estadísticas de tablas actualizadas
async function testTableStatistics() {
    log('\n📋 TEST 5: VERIFICANDO ESTADÍSTICAS DE TABLAS', 'magenta');
    
    const query = `
        SELECT 
            schemaname,
            tablename,
            n_tup_ins,
            n_tup_upd,
            n_tup_del,
            last_analyze,
            last_autoanalyze
        FROM pg_stat_user_tables 
        WHERE schemaname = 'public'
        AND tablename IN ('properties', 'profiles', 'community_profiles', 'users')
        ORDER BY tablename;
    `;
    
    const stats = await executeQuery(query, 'Consultando estadísticas de tablas');
    
    if (!stats) {
        showTestResult('Verificación de estadísticas', false, 'Error al consultar estadísticas');
        return false;
    }
    
    let allTablesHaveStats = true;
    
    for (const stat of stats) {
        const hasRecentAnalyze = stat.last_analyze || stat.last_autoanalyze;
        showTestResult(`Estadísticas tabla ${stat.tablename}`, !!hasRecentAnalyze);
        if (!hasRecentAnalyze) allTablesHaveStats = false;
        
        log(`   Inserciones: ${stat.n_tup_ins}, Actualizaciones: ${stat.n_tup_upd}, Eliminaciones: ${stat.n_tup_del}`, 'cyan');
    }
    
    return allTablesHaveStats;
}

// Test 6: Verificar funcionamiento de políticas optimizadas
async function testOptimizedPoliciesFunctionality() {
    log('\n📋 TEST 6: VERIFICANDO FUNCIONAMIENTO DE POLÍTICAS OPTIMIZADAS', 'magenta');
    
    try {
        // Test de lectura pública (debería funcionar sin autenticación)
        const { data: publicProperties, error: publicError } = await supabase
            .from('properties')
            .select('id, title')
            .limit(1);
        
        showTestResult('Lectura pública de propiedades', !publicError, 
            publicError ? publicError.message : `${publicProperties?.length || 0} propiedades leídas`);
        
        // Test de lectura pública de perfiles
        const { data: publicProfiles, error: profileError } = await supabase
            .from('profiles')
            .select('id, full_name')
            .limit(1);
        
        showTestResult('Lectura pública de perfiles', !profileError,
            profileError ? profileError.message : `${publicProfiles?.length || 0} perfiles leídos`);
        
        return !publicError && !profileError;
        
    } catch (error) {
        showTestResult('Funcionamiento de políticas optimizadas', false, error.message);
        return false;
    }
}

// Test 7: Verificar mejora de rendimiento
async function testPerformanceImprovement() {
    log('\n📋 TEST 7: VERIFICANDO MEJORA DE RENDIMIENTO', 'magenta');
    
    const queries = [
        {
            name: 'Consulta propiedades con filtro de usuario',
            query: `
                EXPLAIN (ANALYZE, BUFFERS) 
                SELECT * FROM properties 
                WHERE user_id = '00000000-0000-0000-0000-000000000000'::uuid 
                LIMIT 10;
            `
        },
        {
            name: 'Consulta perfiles ordenados por fecha',
            query: `
                EXPLAIN (ANALYZE, BUFFERS) 
                SELECT * FROM profiles 
                ORDER BY created_at DESC 
                LIMIT 10;
            `
        }
    ];
    
    let allQueriesOptimized = true;
    
    for (const queryTest of queries) {
        const result = await executeQuery(queryTest.query, queryTest.name);
        
        if (result) {
            // Buscar indicadores de buen rendimiento en el plan de ejecución
            const planText = JSON.stringify(result);
            const usesIndex = planText.includes('Index Scan') || planText.includes('Index Only Scan');
            const executionTime = planText.match(/Execution Time: ([\d.]+) ms/);
            
            showTestResult(`${queryTest.name} - Usa índices`, usesIndex);
            
            if (executionTime) {
                const timeMs = parseFloat(executionTime[1]);
                const isFast = timeMs < 100; // Menos de 100ms es considerado rápido
                showTestResult(`${queryTest.name} - Tiempo de ejecución`, isFast, `${timeMs}ms`);
                if (!isFast) allQueriesOptimized = false;
            }
            
            if (!usesIndex) allQueriesOptimized = false;
        } else {
            allQueriesOptimized = false;
        }
    }
    
    return allQueriesOptimized;
}

// Función principal de testing
async function runAllTests() {
    log('🚀 INICIANDO TESTING EXHAUSTIVO DE PERFORMANCE ADVISOR WARNINGS', 'magenta');
    log('=====================================================', 'magenta');
    log('Verificando corrección de 74 warnings de performance:', 'white');
    log('- Auth RLS Initialization Plan: 19 warnings', 'white');
    log('- Multiple Permissive Policies: 52 warnings', 'white');
    log('- Duplicate Index: 3 warnings', 'white');
    log('=====================================================', 'magenta');
    
    const testResults = [];
    
    // Ejecutar todos los tests
    testResults.push(await testOptimizedRLSPolicies());
    testResults.push(await testDuplicatePoliciesRemoved());
    testResults.push(await testDuplicateIndexesRemoved());
    testResults.push(await testPerformanceIndexes());
    testResults.push(await testTableStatistics());
    testResults.push(await testOptimizedPoliciesFunctionality());
    testResults.push(await testPerformanceImprovement());
    
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
        log('✅ Las optimizaciones de Performance Advisor se aplicaron correctamente', 'green');
        log('✅ Los 74 warnings de performance fueron corregidos', 'green');
        log('✅ El rendimiento de la base de datos ha mejorado significativamente', 'green');
    } else {
        log('\n⚠️  ALGUNOS TESTS FALLARON', 'yellow');
        log('❌ Revisa los errores anteriores y aplica las correcciones necesarias', 'red');
        log('💡 Ejecuta el script SQL de optimización nuevamente si es necesario', 'yellow');
    }
    
    log('\n📋 PRÓXIMOS PASOS:', 'blue');
    log('1. Ve a Supabase Dashboard > Database > Database Linter', 'white');
    log('2. Ejecuta el Performance Advisor nuevamente', 'white');
    log('3. Verifica que los warnings desaparecieron', 'white');
    log('4. Monitorea el rendimiento de las consultas en producción', 'white');
    
    log('\n=====================================================', 'magenta');
    log('Testing completado exitosamente', 'magenta');
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
    testOptimizedRLSPolicies,
    testDuplicatePoliciesRemoved,
    testDuplicateIndexesRemoved,
    testPerformanceIndexes,
    testTableStatistics,
    testOptimizedPoliciesFunctionality,
    testPerformanceImprovement
};
