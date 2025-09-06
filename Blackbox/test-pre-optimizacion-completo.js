const { createClient } = require('@supabase/supabase-js');

console.log('🧪 TEST PRE-OPTIMIZACIÓN COMPLETO');
console.log('=' .repeat(70));

const SUPABASE_URL = 'https://qfeyhaaxyemmnohqdele.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmZXloYWF4eWVtbW5vaHFkZWxlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTgxNjczOCwiZXhwIjoyMDcxMzkyNzM4fQ.5wJb1p0Rmg1dVIayIT4wZO_seDXTIwhVa36CyEgK-yM';

async function testPreOptimizacion() {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    console.log('📅 Fecha:', new Date().toISOString());
    console.log('🎯 Objetivo: Verificar estado actual ANTES de optimización');
    console.log('');

    const resultados = {
        tests: [],
        errores: [],
        warnings: [],
        estadoGeneral: 'DESCONOCIDO'
    };

    let testsExitosos = 0;
    let totalTests = 0;

    try {
        // =====================================================
        // TEST 1: CONEXIÓN BÁSICA
        // =====================================================
        totalTests++;
        console.log('🔗 TEST 1: CONEXIÓN BÁSICA...');
        console.log('-'.repeat(40));

        try {
            const { data: connectionTest, error: connectionError } = await supabase
                .from('users')
                .select('count')
                .limit(1);

            if (connectionError) {
                console.log('   ❌ FALLO: Error de conexión');
                console.log(`      └─ ${connectionError.message}`);
                resultados.errores.push({
                    test: 'conexion',
                    error: connectionError.message
                });
            } else {
                console.log('   ✅ ÉXITO: Conexión establecida');
                testsExitosos++;
                resultados.tests.push({
                    test: 'conexion',
                    resultado: 'exitoso'
                });
            }
        } catch (error) {
            console.log('   ❌ FALLO: Excepción en conexión');
            console.log(`      └─ ${error.message}`);
            resultados.errores.push({
                test: 'conexion',
                error: error.message
            });
        }

        // =====================================================
        // TEST 2: USUARIO CRÍTICO (ERROR 406)
        // =====================================================
        totalTests++;
        console.log('');
        console.log('👤 TEST 2: USUARIO CRÍTICO (ERROR 406)...');
        console.log('-'.repeat(40));

        try {
            const { data: usuarioCritico, error: usuarioError } = await supabase
                .from('users')
                .select('id, user_type, created_at, name, email')
                .eq('id', '6403f9d2-e846-4c70-87e0-e051127d9500')
                .single();

            if (usuarioError) {
                console.log('   ❌ FALLO: Usuario crítico no accesible');
                console.log(`      └─ ${usuarioError.message}`);
                console.log('      🚨 CRÍTICO: Error 406 puede estar presente');
                resultados.errores.push({
                    test: 'usuario_critico',
                    error: usuarioError.message,
                    criticidad: 'ALTA'
                });
            } else if (usuarioCritico) {
                console.log('   ✅ ÉXITO: Usuario crítico accesible');
                console.log(`      └─ ID: ${usuarioCritico.id}`);
                console.log(`      └─ Tipo: ${usuarioCritico.user_type}`);
                console.log(`      └─ Email: ${usuarioCritico.email}`);
                testsExitosos++;
                resultados.tests.push({
                    test: 'usuario_critico',
                    resultado: 'exitoso',
                    datos: usuarioCritico
                });
            }
        } catch (error) {
            console.log('   ❌ FALLO: Excepción en usuario crítico');
            console.log(`      └─ ${error.message}`);
            resultados.errores.push({
                test: 'usuario_critico',
                error: error.message,
                criticidad: 'ALTA'
            });
        }

        // =====================================================
        // TEST 3: RLS HABILITADO
        // =====================================================
        totalTests++;
        console.log('');
        console.log('🔒 TEST 3: RLS HABILITADO...');
        console.log('-'.repeat(40));

        try {
            const { data: rlsStatus, error: rlsError } = await supabase
                .from('pg_tables')
                .select('schemaname, tablename, rowsecurity')
                .eq('schemaname', 'public')
                .eq('tablename', 'users')
                .single();

            if (rlsError) {
                console.log('   ❌ FALLO: No se puede verificar RLS');
                console.log(`      └─ ${rlsError.message}`);
                resultados.errores.push({
                    test: 'rls_status',
                    error: rlsError.message
                });
            } else if (rlsStatus && rlsStatus.rowsecurity) {
                console.log('   ✅ ÉXITO: RLS habilitado correctamente');
                testsExitosos++;
                resultados.tests.push({
                    test: 'rls_status',
                    resultado: 'exitoso',
                    rls_habilitado: true
                });
            } else {
                console.log('   ⚠️ ADVERTENCIA: RLS no habilitado');
                resultados.warnings.push({
                    test: 'rls_status',
                    mensaje: 'RLS no está habilitado en tabla users'
                });
            }
        } catch (error) {
            console.log('   ❌ FALLO: Excepción verificando RLS');
            console.log(`      └─ ${error.message}`);
            resultados.errores.push({
                test: 'rls_status',
                error: error.message
            });
        }

        // =====================================================
        // TEST 4: POLÍTICAS ACTUALES
        // =====================================================
        totalTests++;
        console.log('');
        console.log('🛡️ TEST 4: POLÍTICAS ACTUALES...');
        console.log('-'.repeat(40));

        try {
            const { data: politicas, error: politicasError } = await supabase
                .from('pg_policies')
                .select('policyname, cmd, roles')
                .eq('schemaname', 'public')
                .eq('tablename', 'users');

            if (politicasError) {
                console.log('   ❌ FALLO: No se pueden obtener políticas');
                console.log(`      └─ ${politicasError.message}`);
                resultados.errores.push({
                    test: 'politicas',
                    error: politicasError.message
                });
            } else if (politicas && politicas.length > 0) {
                console.log(`   ✅ ÉXITO: ${politicas.length} políticas encontradas`);
                politicas.forEach(p => {
                    console.log(`      └─ ${p.policyname} (${p.cmd})`);
                });
                testsExitosos++;
                resultados.tests.push({
                    test: 'politicas',
                    resultado: 'exitoso',
                    total_politicas: politicas.length,
                    politicas: politicas
                });
            } else {
                console.log('   ⚠️ ADVERTENCIA: No se encontraron políticas');
                resultados.warnings.push({
                    test: 'politicas',
                    mensaje: 'No hay políticas RLS configuradas'
                });
            }
        } catch (error) {
            console.log('   ❌ FALLO: Excepción obteniendo políticas');
            console.log(`      └─ ${error.message}`);
            resultados.errores.push({
                test: 'politicas',
                error: error.message
            });
        }

        // =====================================================
        // TEST 5: OPERACIONES CRUD BÁSICAS
        // =====================================================
        totalTests++;
        console.log('');
        console.log('📝 TEST 5: OPERACIONES CRUD BÁSICAS...');
        console.log('-'.repeat(40));

        try {
            // Test SELECT
            const { data: selectTest, error: selectError } = await supabase
                .from('users')
                .select('id, user_type')
                .limit(3);

            if (selectError) {
                console.log('   ❌ FALLO: SELECT no funciona');
                console.log(`      └─ ${selectError.message}`);
                resultados.errores.push({
                    test: 'crud_select',
                    error: selectError.message
                });
            } else {
                console.log(`   ✅ ÉXITO: SELECT funciona (${selectTest?.length || 0} registros)`);
                testsExitosos++;
                resultados.tests.push({
                    test: 'crud_select',
                    resultado: 'exitoso',
                    registros_obtenidos: selectTest?.length || 0
                });
            }
        } catch (error) {
            console.log('   ❌ FALLO: Excepción en operaciones CRUD');
            console.log(`      └─ ${error.message}`);
            resultados.errores.push({
                test: 'crud_select',
                error: error.message
            });
        }

        // =====================================================
        // TEST 6: ÍNDICES DE EMAIL
        // =====================================================
        totalTests++;
        console.log('');
        console.log('📊 TEST 6: ÍNDICES DE EMAIL...');
        console.log('-'.repeat(40));

        try {
            const { data: indices, error: indicesError } = await supabase
                .from('pg_indexes')
                .select('indexname, tablename')
                .eq('schemaname', 'public')
                .eq('tablename', 'users')
                .like('indexname', '%email%');

            if (indicesError) {
                console.log('   ❌ FALLO: No se pueden obtener índices');
                console.log(`      └─ ${indicesError.message}`);
                resultados.errores.push({
                    test: 'indices_email',
                    error: indicesError.message
                });
            } else if (indices) {
                console.log(`   ✅ ÉXITO: ${indices.length} índices de email encontrados`);
                indices.forEach(idx => {
                    console.log(`      └─ ${idx.indexname}`);
                });
                
                if (indices.length > 1) {
                    console.log('   ⚠️ ADVERTENCIA: Múltiples índices detectados (Duplicate Index warning)');
                    resultados.warnings.push({
                        test: 'indices_email',
                        mensaje: `${indices.length} índices de email (posible duplicación)`
                    });
                }
                
                testsExitosos++;
                resultados.tests.push({
                    test: 'indices_email',
                    resultado: 'exitoso',
                    total_indices: indices.length,
                    indices: indices
                });
            }
        } catch (error) {
            console.log('   ❌ FALLO: Excepción obteniendo índices');
            console.log(`      └─ ${error.message}`);
            resultados.errores.push({
                test: 'indices_email',
                error: error.message
            });
        }

        // =====================================================
        // RESUMEN DE RESULTADOS
        // =====================================================
        console.log('');
        console.log('📊 RESUMEN DE TESTS PRE-OPTIMIZACIÓN');
        console.log('='.repeat(70));

        const porcentajeExito = Math.round((testsExitosos / totalTests) * 100);
        
        console.log(`📈 ESTADÍSTICAS:`);
        console.log(`   Tests ejecutados: ${totalTests}`);
        console.log(`   Tests exitosos: ${testsExitosos}`);
        console.log(`   Tests fallidos: ${totalTests - testsExitosos}`);
        console.log(`   Porcentaje de éxito: ${porcentajeExito}%`);
        console.log(`   Errores críticos: ${resultados.errores.filter(e => e.criticidad === 'ALTA').length}`);
        console.log(`   Advertencias: ${resultados.warnings.length}`);

        // Determinar estado general
        if (porcentajeExito >= 90 && resultados.errores.filter(e => e.criticidad === 'ALTA').length === 0) {
            resultados.estadoGeneral = 'EXCELENTE';
            console.log('');
            console.log('✅ ESTADO GENERAL: EXCELENTE');
            console.log('🚀 RECOMENDACIÓN: PROCEDER con optimización');
            console.log('🛡️ RIESGO: MÍNIMO');
        } else if (porcentajeExito >= 70 && resultados.errores.filter(e => e.criticidad === 'ALTA').length === 0) {
            resultados.estadoGeneral = 'BUENO';
            console.log('');
            console.log('✅ ESTADO GENERAL: BUENO');
            console.log('⚠️ RECOMENDACIÓN: PROCEDER con precaución');
            console.log('🛡️ RIESGO: BAJO');
        } else if (resultados.errores.filter(e => e.criticidad === 'ALTA').length > 0) {
            resultados.estadoGeneral = 'CRÍTICO';
            console.log('');
            console.log('❌ ESTADO GENERAL: CRÍTICO');
            console.log('🚨 RECOMENDACIÓN: NO PROCEDER - Resolver errores críticos primero');
            console.log('🛡️ RIESGO: ALTO');
        } else {
            resultados.estadoGeneral = 'REGULAR';
            console.log('');
            console.log('⚠️ ESTADO GENERAL: REGULAR');
            console.log('🔍 RECOMENDACIÓN: INVESTIGAR errores antes de proceder');
            console.log('🛡️ RIESGO: MEDIO');
        }

        // Crear backup de estado actual
        const fs = require('fs');
        const backupEstado = {
            timestamp: new Date().toISOString(),
            tests_pre_optimizacion: resultados,
            porcentaje_exito: porcentajeExito,
            estado_general: resultados.estadoGeneral
        };

        fs.writeFileSync(
            'Blackbox/backup-estado-pre-optimizacion.json',
            JSON.stringify(backupEstado, null, 2)
        );

        console.log('');
        console.log('💾 BACKUP CREADO: backup-estado-pre-optimizacion.json');
        console.log('');
        console.log('🎯 PRÓXIMOS PASOS:');
        
        if (resultados.estadoGeneral === 'EXCELENTE' || resultados.estadoGeneral === 'BUENO') {
            console.log('1. ✅ Estado actual verificado y estable');
            console.log('2. 🚀 Proceder con optimización gradual');
            console.log('3. 🧪 Ejecutar tests post-optimización');
            console.log('4. 📊 Verificar warnings eliminados');
        } else {
            console.log('1. 🔍 Resolver errores identificados');
            console.log('2. 🧪 Re-ejecutar tests pre-optimización');
            console.log('3. ✅ Confirmar estado estable');
            console.log('4. 🚀 Proceder con optimización');
        }

        console.log('');
        console.log('✅ TEST PRE-OPTIMIZACIÓN COMPLETADO');

        return resultados;

    } catch (error) {
        console.error('❌ Error crítico en tests pre-optimización:', error.message);
        resultados.errores.push({
            test: 'general',
            error: error.message,
            criticidad: 'CRÍTICA'
        });
        resultados.estadoGeneral = 'ERROR';
        return resultados;
    }
}

// Ejecutar tests
if (require.main === module) {
    testPreOptimizacion().catch(console.error);
}

module.exports = { testPreOptimizacion };
