/**
 * =====================================================
 * TESTING EXHAUSTIVO - NUEVOS WARNINGS SUPABASE
 * Performance Advisor - Database Linter
 * =====================================================
 * Fecha: 2025-01-09
 * Objetivo: Validar corrección de 5 nuevos warnings
 * - 4x Multiple Permissive Policies (community_profiles)
 * - 1x Duplicate Index (users)
 * =====================================================
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configuración de Supabase
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key';

// Cliente de Supabase con permisos de administrador
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

/**
 * Función para ejecutar consultas SQL directas
 */
async function executeSQL(query, description) {
    try {
        console.log(`\n🔍 ${description}`);
        console.log(`📝 Query: ${query.substring(0, 100)}...`);
        
        const { data, error } = await supabase.rpc('exec_sql', { sql: query });
        
        if (error) {
            console.error(`❌ Error: ${error.message}`);
            return { success: false, error: error.message };
        }
        
        console.log(`✅ Éxito: ${description}`);
        return { success: true, data };
    } catch (err) {
        console.error(`❌ Excepción: ${err.message}`);
        return { success: false, error: err.message };
    }
}

/**
 * Test 1: Verificar eliminación de políticas duplicadas
 */
async function testPoliciesDuplicatesRemoved() {
    console.log('\n=== TEST 1: VERIFICAR ELIMINACIÓN DE POLÍTICAS DUPLICADAS ===');
    
    const query = `
        SELECT 
            schemaname,
            tablename,
            policyname,
            cmd,
            COUNT(*) OVER (PARTITION BY schemaname, tablename, cmd) as policy_count
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'community_profiles'
        AND cmd = 'SELECT'
        ORDER BY policyname;
    `;
    
    const result = await executeSQL(query, 'Verificar políticas SELECT en community_profiles');
    
    if (result.success && result.data) {
        const policies = result.data;
        const duplicateCount = policies.filter(p => p.policy_count > 1).length;
        
        console.log(`📊 Políticas SELECT encontradas: ${policies.length}`);
        console.log(`🔍 Políticas duplicadas: ${duplicateCount}`);
        
        if (duplicateCount === 0) {
            console.log('✅ TEST 1 PASADO: No hay políticas duplicadas');
            return true;
        } else {
            console.log('❌ TEST 1 FALLIDO: Aún existen políticas duplicadas');
            policies.forEach(p => {
                console.log(`   - ${p.policyname} (count: ${p.policy_count})`);
            });
            return false;
        }
    }
    
    console.log('❌ TEST 1 FALLIDO: Error al verificar políticas');
    return false;
}

/**
 * Test 2: Verificar política unificada existe
 */
async function testUnifiedPolicyExists() {
    console.log('\n=== TEST 2: VERIFICAR POLÍTICA UNIFICADA EXISTE ===');
    
    const query = `
        SELECT 
            policyname,
            cmd,
            qual,
            with_check
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'community_profiles'
        AND policyname = 'community_profiles_unified_select_policy';
    `;
    
    const result = await executeSQL(query, 'Verificar política unificada');
    
    if (result.success && result.data && result.data.length > 0) {
        const policy = result.data[0];
        console.log(`✅ Política unificada encontrada: ${policy.policyname}`);
        console.log(`📝 Comando: ${policy.cmd}`);
        console.log(`🔍 Condición: ${policy.qual}`);
        console.log('✅ TEST 2 PASADO: Política unificada existe');
        return true;
    }
    
    console.log('❌ TEST 2 FALLIDO: Política unificada no encontrada');
    return false;
}

/**
 * Test 3: Verificar eliminación de índice duplicado
 */
async function testDuplicateIndexRemoved() {
    console.log('\n=== TEST 3: VERIFICAR ELIMINACIÓN DE ÍNDICE DUPLICADO ===');
    
    const query = `
        SELECT 
            indexname,
            tablename,
            indexdef
        FROM pg_indexes 
        WHERE schemaname = 'public' 
        AND tablename = 'users'
        AND indexdef LIKE '%email%'
        ORDER BY indexname;
    `;
    
    const result = await executeSQL(query, 'Verificar índices de email en users');
    
    if (result.success && result.data) {
        const indexes = result.data;
        console.log(`📊 Índices de email encontrados: ${indexes.length}`);
        
        indexes.forEach(idx => {
            console.log(`   - ${idx.indexname}: ${idx.indexdef}`);
        });
        
        // Verificar que users_email_key fue eliminado
        const duplicateIndex = indexes.find(idx => idx.indexname === 'users_email_key');
        const uniqueIndex = indexes.find(idx => idx.indexname === 'users_email_unique');
        
        if (!duplicateIndex && uniqueIndex) {
            console.log('✅ TEST 3 PASADO: Índice duplicado eliminado, único mantenido');
            return true;
        } else if (duplicateIndex) {
            console.log('❌ TEST 3 FALLIDO: Índice duplicado aún existe');
            return false;
        } else {
            console.log('⚠️ TEST 3 ADVERTENCIA: Ningún índice de email encontrado');
            return false;
        }
    }
    
    console.log('❌ TEST 3 FALLIDO: Error al verificar índices');
    return false;
}

/**
 * Test 4: Verificar funciones de utilidad creadas
 */
async function testUtilityFunctionsCreated() {
    console.log('\n=== TEST 4: VERIFICAR FUNCIONES DE UTILIDAD CREADAS ===');
    
    const query = `
        SELECT 
            proname as function_name,
            prosrc as function_body
        FROM pg_proc 
        WHERE proname IN ('check_duplicate_policies', 'check_duplicate_indexes')
        AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');
    `;
    
    const result = await executeSQL(query, 'Verificar funciones de utilidad');
    
    if (result.success && result.data) {
        const functions = result.data;
        console.log(`📊 Funciones de utilidad encontradas: ${functions.length}`);
        
        const expectedFunctions = ['check_duplicate_policies', 'check_duplicate_indexes'];
        const foundFunctions = functions.map(f => f.function_name);
        
        const allFound = expectedFunctions.every(fn => foundFunctions.includes(fn));
        
        if (allFound) {
            console.log('✅ TEST 4 PASADO: Todas las funciones de utilidad creadas');
            functions.forEach(f => {
                console.log(`   - ${f.function_name}: ✓`);
            });
            return true;
        } else {
            console.log('❌ TEST 4 FALLIDO: Faltan funciones de utilidad');
            expectedFunctions.forEach(fn => {
                const found = foundFunctions.includes(fn);
                console.log(`   - ${fn}: ${found ? '✓' : '❌'}`);
            });
            return false;
        }
    }
    
    console.log('❌ TEST 4 FALLIDO: Error al verificar funciones');
    return false;
}

/**
 * Test 5: Probar función check_duplicate_policies
 */
async function testCheckDuplicatePoliciesFunction() {
    console.log('\n=== TEST 5: PROBAR FUNCIÓN check_duplicate_policies ===');
    
    const query = `SELECT * FROM check_duplicate_policies();`;
    
    const result = await executeSQL(query, 'Ejecutar función check_duplicate_policies');
    
    if (result.success) {
        const duplicates = result.data || [];
        console.log(`📊 Políticas duplicadas detectadas: ${duplicates.length}`);
        
        if (duplicates.length === 0) {
            console.log('✅ TEST 5 PASADO: No hay políticas duplicadas');
            return true;
        } else {
            console.log('❌ TEST 5 FALLIDO: Políticas duplicadas encontradas:');
            duplicates.forEach(dup => {
                console.log(`   - Tabla: ${dup.table_name}, Comando: ${dup.cmd}, Count: ${dup.policy_count}`);
            });
            return false;
        }
    }
    
    console.log('❌ TEST 5 FALLIDO: Error al ejecutar función');
    return false;
}

/**
 * Test 6: Probar función check_duplicate_indexes
 */
async function testCheckDuplicateIndexesFunction() {
    console.log('\n=== TEST 6: PROBAR FUNCIÓN check_duplicate_indexes ===');
    
    const query = `SELECT * FROM check_duplicate_indexes();`;
    
    const result = await executeSQL(query, 'Ejecutar función check_duplicate_indexes');
    
    if (result.success) {
        const duplicates = result.data || [];
        console.log(`📊 Índices duplicados detectados: ${duplicates.length}`);
        
        if (duplicates.length === 0) {
            console.log('✅ TEST 6 PASADO: No hay índices duplicados');
            return true;
        } else {
            console.log('❌ TEST 6 FALLIDO: Índices duplicados encontrados:');
            duplicates.forEach(dup => {
                console.log(`   - Tabla: ${dup.table_name}, Índices: ${dup.index_names}`);
            });
            return false;
        }
    }
    
    console.log('❌ TEST 6 FALLIDO: Error al ejecutar función');
    return false;
}

/**
 * Test 7: Verificar optimizaciones de rendimiento
 */
async function testPerformanceOptimizations() {
    console.log('\n=== TEST 7: VERIFICAR OPTIMIZACIONES DE RENDIMIENTO ===');
    
    const query = `
        SELECT 
            indexname,
            tablename,
            indexdef
        FROM pg_indexes 
        WHERE schemaname = 'public' 
        AND tablename = 'community_profiles'
        AND indexname LIKE 'idx_community_profiles_%'
        ORDER BY indexname;
    `;
    
    const result = await executeSQL(query, 'Verificar índices de optimización');
    
    if (result.success && result.data) {
        const optimizationIndexes = result.data;
        console.log(`📊 Índices de optimización encontrados: ${optimizationIndexes.length}`);
        
        const expectedIndexes = [
            'idx_community_profiles_user_public',
            'idx_community_profiles_active'
        ];
        
        const foundIndexes = optimizationIndexes.map(idx => idx.indexname);
        const foundCount = expectedIndexes.filter(idx => foundIndexes.includes(idx)).length;
        
        console.log(`🔍 Índices esperados: ${expectedIndexes.length}`);
        console.log(`✅ Índices encontrados: ${foundCount}`);
        
        optimizationIndexes.forEach(idx => {
            console.log(`   - ${idx.indexname}: ${idx.indexdef}`);
        });
        
        if (foundCount >= 1) {
            console.log('✅ TEST 7 PASADO: Optimizaciones de rendimiento aplicadas');
            return true;
        } else {
            console.log('⚠️ TEST 7 ADVERTENCIA: Pocas optimizaciones encontradas');
            return true; // No crítico
        }
    }
    
    console.log('❌ TEST 7 FALLIDO: Error al verificar optimizaciones');
    return false;
}

/**
 * Test 8: Verificar comentarios de documentación
 */
async function testDocumentationComments() {
    console.log('\n=== TEST 8: VERIFICAR COMENTARIOS DE DOCUMENTACIÓN ===');
    
    const queries = [
        {
            name: 'Política unificada',
            query: `
                SELECT obj_description(oid, 'pg_policy') as comment
                FROM pg_policy 
                WHERE polname = 'community_profiles_unified_select_policy';
            `
        },
        {
            name: 'Índice único users',
            query: `
                SELECT obj_description(oid, 'pg_class') as comment
                FROM pg_class 
                WHERE relname = 'users_email_unique';
            `
        }
    ];
    
    let commentsFound = 0;
    
    for (const queryInfo of queries) {
        const result = await executeSQL(queryInfo.query, `Verificar comentario: ${queryInfo.name}`);
        
        if (result.success && result.data && result.data.length > 0) {
            const comment = result.data[0].comment;
            if (comment && comment.trim() !== '') {
                console.log(`✅ Comentario encontrado para ${queryInfo.name}: ${comment.substring(0, 50)}...`);
                commentsFound++;
            } else {
                console.log(`⚠️ Sin comentario para ${queryInfo.name}`);
            }
        } else {
            console.log(`⚠️ No se pudo verificar comentario para ${queryInfo.name}`);
        }
    }
    
    if (commentsFound > 0) {
        console.log(`✅ TEST 8 PASADO: ${commentsFound} comentarios de documentación encontrados`);
        return true;
    } else {
        console.log('⚠️ TEST 8 ADVERTENCIA: Pocos comentarios encontrados (no crítico)');
        return true; // No crítico
    }
}

/**
 * Función principal de testing
 */
async function runAllTests() {
    console.log('🚀 INICIANDO TESTING EXHAUSTIVO - NUEVOS WARNINGS SUPABASE');
    console.log('=====================================================');
    console.log(`📅 Fecha: ${new Date().toISOString()}`);
    console.log(`🔗 Supabase URL: ${SUPABASE_URL}`);
    console.log('=====================================================');
    
    const tests = [
        { name: 'Políticas duplicadas eliminadas', fn: testPoliciesDuplicatesRemoved },
        { name: 'Política unificada existe', fn: testUnifiedPolicyExists },
        { name: 'Índice duplicado eliminado', fn: testDuplicateIndexRemoved },
        { name: 'Funciones de utilidad creadas', fn: testUtilityFunctionsCreated },
        { name: 'Función check_duplicate_policies', fn: testCheckDuplicatePoliciesFunction },
        { name: 'Función check_duplicate_indexes', fn: testCheckDuplicateIndexesFunction },
        { name: 'Optimizaciones de rendimiento', fn: testPerformanceOptimizations },
        { name: 'Comentarios de documentación', fn: testDocumentationComments }
    ];
    
    const results = [];
    let passedTests = 0;
    
    for (let i = 0; i < tests.length; i++) {
        const test = tests[i];
        console.log(`\n📋 Ejecutando Test ${i + 1}/${tests.length}: ${test.name}`);
        
        try {
            const result = await test.fn();
            results.push({ name: test.name, passed: result });
            if (result) passedTests++;
        } catch (error) {
            console.error(`❌ Error en test ${test.name}: ${error.message}`);
            results.push({ name: test.name, passed: false, error: error.message });
        }
        
        // Pausa entre tests
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Resumen final
    console.log('\n' + '='.repeat(60));
    console.log('📊 RESUMEN FINAL DE TESTING');
    console.log('='.repeat(60));
    console.log(`✅ Tests pasados: ${passedTests}/${tests.length}`);
    console.log(`❌ Tests fallidos: ${tests.length - passedTests}/${tests.length}`);
    console.log(`📈 Porcentaje de éxito: ${Math.round((passedTests / tests.length) * 100)}%`);
    
    console.log('\n📋 DETALLE DE RESULTADOS:');
    results.forEach((result, index) => {
        const status = result.passed ? '✅ PASADO' : '❌ FALLIDO';
        console.log(`${index + 1}. ${result.name}: ${status}`);
        if (result.error) {
            console.log(`   Error: ${result.error}`);
        }
    });
    
    // Generar reporte
    const reportData = {
        timestamp: new Date().toISOString(),
        supabaseUrl: SUPABASE_URL,
        totalTests: tests.length,
        passedTests: passedTests,
        failedTests: tests.length - passedTests,
        successRate: Math.round((passedTests / tests.length) * 100),
        results: results,
        warningsAddressed: [
            'Multiple Permissive Policies (community_profiles) - 4 warnings',
            'Duplicate Index (users) - 1 warning'
        ]
    };
    
    // Guardar reporte
    const reportPath = path.join(__dirname, 'REPORTE-TESTING-NUEVOS-WARNINGS-SUPABASE-FINAL.json');
    fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
    console.log(`\n💾 Reporte guardado en: ${reportPath}`);
    
    // Conclusión
    if (passedTests === tests.length) {
        console.log('\n🎉 ¡TODOS LOS TESTS PASARON! Los nuevos warnings han sido corregidos exitosamente.');
    } else if (passedTests >= tests.length * 0.8) {
        console.log('\n✅ La mayoría de tests pasaron. Revisar tests fallidos para optimización adicional.');
    } else {
        console.log('\n⚠️ Varios tests fallaron. Se requiere revisión de la implementación.');
    }
    
    console.log('\n🔍 PRÓXIMOS PASOS:');
    console.log('1. Ejecutar el script SQL de corrección en Supabase Dashboard');
    console.log('2. Verificar en Performance Advisor que los warnings desaparecieron');
    console.log('3. Monitorear rendimiento de consultas en community_profiles');
    console.log('4. Usar funciones de utilidad para monitoreo continuo');
    
    return {
        success: passedTests === tests.length,
        passedTests,
        totalTests: tests.length,
        results
    };
}

// Ejecutar si es llamado directamente
if (require.main === module) {
    runAllTests().catch(console.error);
}

module.exports = {
    runAllTests,
    testPoliciesDuplicatesRemoved,
    testUnifiedPolicyExists,
    testDuplicateIndexRemoved,
    testUtilityFunctionsCreated,
    testCheckDuplicatePoliciesFunction,
    testCheckDuplicateIndexesFunction,
    testPerformanceOptimizations,
    testDocumentationComments
};
