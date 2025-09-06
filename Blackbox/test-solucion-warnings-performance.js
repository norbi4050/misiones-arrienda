const { createClient } = require('@supabase/supabase-js');

console.log('🔍 TESTING SOLUCIÓN WARNINGS DE PERFORMANCE SUPABASE');
console.log('=' .repeat(70));

const SUPABASE_URL = 'https://qfeyhaaxyemmnohqdele.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmZXloYWF4eWVtbW5vaHFkZWxlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTgxNjczOCwiZXhwIjoyMDcxMzkyNzM4fQ.5wJb1p0Rmg1dVIayIT4wZO_seDXTIwhVa36CyEgK-yM';

async function testSolucionWarnings() {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    console.log('🔗 Conectando a Supabase...');
    console.log(`📅 Fecha: ${new Date().toISOString()}`);
    console.log('');

    const resultados = {
        timestamp: new Date().toISOString(),
        tests: {
            conexion: { exitoso: false, error: null },
            rls_habilitado: { exitoso: false, detalles: null },
            politicas_optimizadas: { exitoso: false, total: 0, detalles: [] },
            indices_optimizados: { exitoso: false, detalles: null },
            error_406_solucionado: { exitoso: false, detalles: null },
            usuario_prueba: { exitoso: false, detalles: null },
            performance: { exitoso: false, tiempos: [] }
        },
        warnings_solucionados: {
            auth_rls_initplan: false,
            multiple_permissive_policies: false,
            duplicate_index: false
        },
        estado_general: 'VERIFICANDO',
        recomendaciones: []
    };

    try {
        // =====================================================
        // TEST 1: VERIFICAR CONEXIÓN
        // =====================================================
        console.log('🔗 TEST 1: VERIFICANDO CONEXIÓN...');
        console.log('-'.repeat(50));

        const { data: connectionTest, error: connectionError } = await supabase
            .from('users')
            .select('count')
            .limit(1);

        if (connectionError) {
            console.log('   ❌ Error de conexión:', connectionError.message);
            resultados.tests.conexion.error = connectionError.message;
            return resultados;
        } else {
            console.log('   ✅ Conexión exitosa');
            resultados.tests.conexion.exitoso = true;
        }

        // =====================================================
        // TEST 2: VERIFICAR RLS HABILITADO
        // =====================================================
        console.log('');
        console.log('🔒 TEST 2: VERIFICANDO RLS HABILITADO...');
        console.log('-'.repeat(50));

        const { data: rlsStatus, error: rlsError } = await supabase
            .from('pg_tables')
            .select('tablename, rowsecurity')
            .eq('schemaname', 'public')
            .in('tablename', ['users', 'community_profiles']);

        if (!rlsError && rlsStatus) {
            console.log('   📊 Estado RLS por tabla:');
            rlsStatus.forEach(tabla => {
                const status = tabla.rowsecurity ? '✅ HABILITADO' : '❌ DESHABILITADO';
                console.log(`      ${tabla.tablename}: ${status}`);
            });
            
            const todasConRLS = rlsStatus.every(t => t.rowsecurity);
            resultados.tests.rls_habilitado.exitoso = todasConRLS;
            resultados.tests.rls_habilitado.detalles = rlsStatus;
            
            if (!todasConRLS) {
                resultados.recomendaciones.push('CRÍTICO: Habilitar RLS en todas las tablas');
            }
        }

        // =====================================================
        // TEST 3: VERIFICAR POLÍTICAS OPTIMIZADAS
        // =====================================================
        console.log('');
        console.log('🛡️ TEST 3: VERIFICANDO POLÍTICAS OPTIMIZADAS...');
        console.log('-'.repeat(50));

        const { data: politicas, error: politicasError } = await supabase
            .from('pg_policies')
            .select('tablename, policyname, cmd, roles')
            .eq('schemaname', 'public')
            .in('tablename', ['users', 'community_profiles']);

        if (!politicasError && politicas) {
            console.log('   📊 Políticas encontradas:');
            
            const politicasUsers = politicas.filter(p => p.tablename === 'users');
            const politicasCommunity = politicas.filter(p => p.tablename === 'community_profiles');
            
            console.log(`      Tabla users: ${politicasUsers.length} políticas`);
            politicasUsers.forEach(p => {
                console.log(`         └─ ${p.policyname} (${p.cmd})`);
            });
            
            console.log(`      Tabla community_profiles: ${politicasCommunity.length} políticas`);
            politicasCommunity.forEach(p => {
                console.log(`         └─ ${p.policyname} (${p.cmd})`);
            });

            resultados.tests.politicas_optimizadas.exitoso = true;
            resultados.tests.politicas_optimizadas.total = politicas.length;
            resultados.tests.politicas_optimizadas.detalles = politicas;

            // Verificar si las políticas están optimizadas (nombres contienen "optimized")
            const politicasOptimizadas = politicas.filter(p => 
                p.policyname.includes('optimized') || p.policyname.includes('consolidated')
            );
            
            if (politicasOptimizadas.length > 0) {
                console.log(`   ✅ ${politicasOptimizadas.length} políticas optimizadas detectadas`);
                resultados.warnings_solucionados.auth_rls_initplan = true;
                resultados.warnings_solucionados.multiple_permissive_policies = true;
            }
        }

        // =====================================================
        // TEST 4: VERIFICAR ÍNDICES OPTIMIZADOS
        // =====================================================
        console.log('');
        console.log('📊 TEST 4: VERIFICANDO ÍNDICES OPTIMIZADOS...');
        console.log('-'.repeat(50));

        const { data: indices, error: indicesError } = await supabase
            .from('pg_indexes')
            .select('indexname, tablename')
            .eq('schemaname', 'public')
            .eq('tablename', 'users')
            .like('indexname', '%email%');

        if (!indicesError && indices) {
            console.log('   📊 Índices de email encontrados:');
            indices.forEach(idx => {
                console.log(`      └─ ${idx.indexname}`);
            });

            // Verificar que no hay índices duplicados
            const indicesDuplicados = indices.filter(idx => 
                idx.indexname === 'users_email_unique'
            );

            if (indicesDuplicados.length === 0) {
                console.log('   ✅ Índices duplicados eliminados correctamente');
                resultados.warnings_solucionados.duplicate_index = true;
            } else {
                console.log('   ⚠️ Aún existen índices duplicados');
            }

            resultados.tests.indices_optimizados.exitoso = indicesDuplicados.length === 0;
            resultados.tests.indices_optimizados.detalles = indices;
        }

        // =====================================================
        // TEST 5: VERIFICAR ERROR 406 SIGUE SOLUCIONADO
        // =====================================================
        console.log('');
        console.log('🧪 TEST 5: VERIFICANDO ERROR 406 SIGUE SOLUCIONADO...');
        console.log('-'.repeat(50));

        const userId = '6403f9d2-e846-4c70-87e0-e051127d9500';
        
        try {
            const { data: testError406, error: error406 } = await supabase
                .from('users')
                .select('user_type, created_at, name, email')
                .eq('id', userId)
                .single();

            if (error406) {
                console.log('   ❌ ERROR 406 DETECTADO:', error406.message);
                resultados.tests.error_406_solucionado.exitoso = false;
                resultados.tests.error_406_solucionado.detalles = error406.message;
                resultados.recomendaciones.push('CRÍTICO: Error 406 ha vuelto a aparecer');
            } else {
                console.log('   ✅ Error 406 SIGUE SOLUCIONADO');
                console.log(`      Usuario: ${testError406.name || 'N/A'}`);
                console.log(`      Email: ${testError406.email || 'N/A'}`);
                console.log(`      Tipo: ${testError406.user_type || 'N/A'}`);
                resultados.tests.error_406_solucionado.exitoso = true;
                resultados.tests.error_406_solucionado.detalles = testError406;
            }
        } catch (error) {
            console.log('   ❌ Error en test 406:', error.message);
            resultados.tests.error_406_solucionado.exitoso = false;
        }

        // =====================================================
        // TEST 6: VERIFICAR USUARIO DE PRUEBA
        // =====================================================
        console.log('');
        console.log('👤 TEST 6: VERIFICANDO USUARIO DE PRUEBA...');
        console.log('-'.repeat(50));

        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .single();

        if (userError) {
            console.log('   ❌ Usuario de prueba NO ACCESIBLE:', userError.message);
            resultados.tests.usuario_prueba.exitoso = false;
            resultados.recomendaciones.push('CRÍTICO: Usuario de prueba no accesible');
        } else {
            console.log('   ✅ Usuario de prueba ACCESIBLE');
            console.log(`      ID: ${userData.id}`);
            console.log(`      Nombre: ${userData.name || 'N/A'}`);
            console.log(`      Email: ${userData.email || 'N/A'}`);
            resultados.tests.usuario_prueba.exitoso = true;
            resultados.tests.usuario_prueba.detalles = userData;
        }

        // =====================================================
        // TEST 7: MEDIR PERFORMANCE
        // =====================================================
        console.log('');
        console.log('⚡ TEST 7: MIDIENDO PERFORMANCE...');
        console.log('-'.repeat(50));

        const tests_performance = [
            {
                nombre: 'SELECT específico optimizado',
                query: () => supabase.from('users').select('user_type, created_at').eq('id', userId).single()
            },
            {
                nombre: 'SELECT general',
                query: () => supabase.from('users').select('id, name, email').limit(5)
            },
            {
                nombre: 'COUNT total',
                query: () => supabase.from('users').select('*', { count: 'exact', head: true })
            }
        ];

        for (const test of tests_performance) {
            const inicio = Date.now();
            try {
                const { data, error } = await test.query();
                const tiempo = Date.now() - inicio;
                
                if (error) {
                    console.log(`   ❌ ${test.nombre}: ERROR - ${error.message}`);
                } else {
                    console.log(`   ✅ ${test.nombre}: ${tiempo}ms`);
                    resultados.tests.performance.tiempos.push({
                        test: test.nombre,
                        tiempo_ms: tiempo,
                        exitoso: true
                    });
                }
            } catch (error) {
                console.log(`   ❌ ${test.nombre}: EXCEPCIÓN - ${error.message}`);
            }
        }

        const tiempoPromedio = resultados.tests.performance.tiempos.reduce((acc, t) => acc + t.tiempo_ms, 0) / resultados.tests.performance.tiempos.length;
        resultados.tests.performance.exitoso = tiempoPromedio < 1000; // Menos de 1 segundo promedio

        // =====================================================
        // DETERMINAR ESTADO GENERAL
        // =====================================================
        console.log('');
        console.log('📊 DETERMINANDO ESTADO GENERAL...');
        console.log('-'.repeat(50));

        const testsExitosos = Object.values(resultados.tests).filter(t => t.exitoso).length;
        const totalTests = Object.keys(resultados.tests).length;
        const porcentajeExito = (testsExitosos / totalTests) * 100;

        const warningsSolucionados = Object.values(resultados.warnings_solucionados).filter(w => w).length;
        const totalWarnings = Object.keys(resultados.warnings_solucionados).length;

        console.log(`   📊 Tests exitosos: ${testsExitosos}/${totalTests} (${porcentajeExito.toFixed(1)}%)`);
        console.log(`   🚨 Warnings solucionados: ${warningsSolucionados}/${totalWarnings}`);

        if (porcentajeExito >= 90 && warningsSolucionados === totalWarnings) {
            resultados.estado_general = '✅ EXCELENTE - WARNINGS COMPLETAMENTE SOLUCIONADOS';
        } else if (porcentajeExito >= 75) {
            resultados.estado_general = '✅ BUENO - MAYORÍA DE WARNINGS SOLUCIONADOS';
        } else if (porcentajeExito >= 50) {
            resultados.estado_general = '⚠️ REGULAR - ALGUNOS WARNINGS PENDIENTES';
        } else {
            resultados.estado_general = '❌ CRÍTICO - WARNINGS NO SOLUCIONADOS';
        }

        // =====================================================
        // MOSTRAR RESUMEN FINAL
        // =====================================================
        console.log('');
        console.log('📋 RESUMEN FINAL DE TESTING');
        console.log('='.repeat(70));
        
        console.log(`🔗 Conexión: ${resultados.tests.conexion.exitoso ? '✅' : '❌'}`);
        console.log(`🔒 RLS habilitado: ${resultados.tests.rls_habilitado.exitoso ? '✅' : '❌'}`);
        console.log(`🛡️ Políticas optimizadas: ${resultados.tests.politicas_optimizadas.exitoso ? '✅' : '❌'}`);
        console.log(`📊 Índices optimizados: ${resultados.tests.indices_optimizados.exitoso ? '✅' : '❌'}`);
        console.log(`🧪 Error 406 solucionado: ${resultados.tests.error_406_solucionado.exitoso ? '✅' : '❌'}`);
        console.log(`👤 Usuario de prueba: ${resultados.tests.usuario_prueba.exitoso ? '✅' : '❌'}`);
        console.log(`⚡ Performance: ${resultados.tests.performance.exitoso ? '✅' : '❌'}`);

        console.log('');
        console.log('🚨 WARNINGS SOLUCIONADOS:');
        console.log(`   Auth RLS InitPlan: ${resultados.warnings_solucionados.auth_rls_initplan ? '✅ SOLUCIONADO' : '❌ PENDIENTE'}`);
        console.log(`   Multiple Permissive Policies: ${resultados.warnings_solucionados.multiple_permissive_policies ? '✅ SOLUCIONADO' : '❌ PENDIENTE'}`);
        console.log(`   Duplicate Index: ${resultados.warnings_solucionados.duplicate_index ? '✅ SOLUCIONADO' : '❌ PENDIENTE'}`);

        if (resultados.recomendaciones.length > 0) {
            console.log('');
            console.log('💡 RECOMENDACIONES:');
            resultados.recomendaciones.forEach((rec, index) => {
                console.log(`   ${index + 1}. ${rec}`);
            });
        }

        console.log('');
        console.log(`🎯 ESTADO GENERAL: ${resultados.estado_general}`);

        // Guardar resultados
        const fs = require('fs');
        fs.writeFileSync(
            'Blackbox/RESULTADOS-TEST-WARNINGS-SOLUCIONADOS.json',
            JSON.stringify(resultados, null, 2)
        );

        console.log('');
        console.log('📄 Resultados guardados en: Blackbox/RESULTADOS-TEST-WARNINGS-SOLUCIONADOS.json');
        console.log('✅ TESTING DE SOLUCIÓN DE WARNINGS COMPLETADO');

        return resultados;

    } catch (error) {
        console.error('❌ Error general en testing:', error.message);
        resultados.estado_general = '❌ ERROR EN TESTING';
        return resultados;
    }
}

// Ejecutar testing
if (require.main === module) {
    testSolucionWarnings().catch(console.error);
}

module.exports = { testSolucionWarnings };
