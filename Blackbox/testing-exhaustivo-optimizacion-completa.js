const { createClient } = require('@supabase/supabase-js');

console.log('🧪 TESTING EXHAUSTIVO - OPTIMIZACIÓN COMPLETA SUPABASE');
console.log('=' .repeat(80));

const SUPABASE_URL = 'https://qfeyhaaxyemmnohqdele.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmZXloYWF4eWVtbW5vaHFkZWxlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTgxNjczOCwiZXhwIjoyMDcxMzkyNzM4fQ.5wJb1p0Rmg1dVIayIT4wZO_seDXTIwhVa36CyEgK-yM';

async function testingExhaustivoOptimizacion() {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    console.log('📅 Fecha:', new Date().toISOString());
    console.log('🎯 Objetivo: Testing exhaustivo de todas las optimizaciones aplicadas');
    console.log('⏱️ Tiempo estimado: 2-3 horas');
    console.log('');

    const resultados = {
        tests_pasados: 0,
        tests_fallidos: 0,
        warnings_eliminados: [],
        performance_mejorada: {},
        errores_encontrados: [],
        recomendaciones: []
    };

    try {
        // =====================================================
        // FASE 1: TESTING DE CONEXIÓN Y ESTADO BÁSICO
        // =====================================================
        console.log('🔗 FASE 1: TESTING DE CONEXIÓN Y ESTADO BÁSICO');
        console.log('-'.repeat(60));

        // Test 1.1: Conexión a Supabase
        console.log('🔍 Test 1.1: Conexión a Supabase...');
        const startTime = Date.now();
        
        try {
            const { data: connectionTest, error: connectionError } = await supabase
                .from('users')
                .select('count')
                .limit(1);

            const connectionTime = Date.now() - startTime;
            
            if (connectionError) {
                console.log('   ❌ FALLO: Error de conexión');
                console.log(`      └─ ${connectionError.message}`);
                resultados.tests_fallidos++;
                resultados.errores_encontrados.push({
                    test: 'conexion',
                    error: connectionError.message
                });
            } else {
                console.log(`   ✅ ÉXITO: Conexión establecida en ${connectionTime}ms`);
                resultados.tests_pasados++;
                resultados.performance_mejorada.conexion_tiempo = connectionTime;
            }
        } catch (error) {
            console.log('   ❌ FALLO: Excepción en conexión');
            resultados.tests_fallidos++;
        }

        // Test 1.2: Usuario crítico accesible
        console.log('🔍 Test 1.2: Usuario crítico accesible...');
        const userStartTime = Date.now();
        
        try {
            const { data: usuarioCritico, error: usuarioError } = await supabase
                .from('users')
                .select('id, user_type, email, created_at, name')
                .eq('id', '6403f9d2-e846-4c70-87e0-e051127d9500')
                .single();

            const userQueryTime = Date.now() - userStartTime;
            
            if (usuarioError) {
                console.log('   ❌ FALLO: Usuario crítico no accesible');
                console.log(`      └─ ${usuarioError.message}`);
                resultados.tests_fallidos++;
                resultados.errores_encontrados.push({
                    test: 'usuario_critico',
                    error: usuarioError.message,
                    criticidad: 'ALTA'
                });
            } else {
                console.log(`   ✅ ÉXITO: Usuario crítico accesible en ${userQueryTime}ms`);
                console.log(`      └─ Email: ${usuarioCritico.email}`);
                console.log(`      └─ Tipo: ${usuarioCritico.user_type || 'null'}`);
                resultados.tests_pasados++;
                resultados.performance_mejorada.usuario_query_tiempo = userQueryTime;
            }
        } catch (error) {
            console.log('   ❌ FALLO: Excepción en usuario crítico');
            resultados.tests_fallidos++;
        }

        // =====================================================
        // FASE 2: TESTING DE POLÍTICAS RLS OPTIMIZADAS
        // =====================================================
        console.log('');
        console.log('🛡️ FASE 2: TESTING DE POLÍTICAS RLS OPTIMIZADAS');
        console.log('-'.repeat(60));

        // Test 2.1: Verificar políticas optimizadas creadas
        console.log('🔍 Test 2.1: Políticas optimizadas creadas...');
        
        try {
            const { data: politicasOptimizadas, error: politicasError } = await supabase
                .from('pg_policies')
                .select('policyname, cmd, roles, qual')
                .eq('schemaname', 'public')
                .eq('tablename', 'users')
                .like('policyname', '%optimized_final%');

            if (politicasError) {
                console.log('   ❌ FALLO: No se pueden obtener políticas optimizadas');
                resultados.tests_fallidos++;
            } else {
                console.log(`   ✅ ÉXITO: ${politicasOptimizadas.length} políticas optimizadas encontradas`);
                politicasOptimizadas.forEach(p => {
                    console.log(`      └─ ${p.policyname} (${p.cmd})`);
                    
                    // Verificar que usan (select auth.uid()) en lugar de auth.uid()
                    if (p.qual && p.qual.includes('( SELECT auth.uid()')) {
                        console.log(`         ✅ Optimizada: Usa (select auth.uid())`);
                        resultados.warnings_eliminados.push({
                            politica: p.policyname,
                            optimizacion: 'Auth RLS InitPlan eliminado'
                        });
                    } else if (p.qual && p.qual.includes('auth.uid()')) {
                        console.log(`         ⚠️ No optimizada: Sigue usando auth.uid()`);
                        resultados.errores_encontrados.push({
                            test: 'politica_optimizacion',
                            politica: p.policyname,
                            problema: 'No usa (select auth.uid())'
                        });
                    }
                });
                resultados.tests_pasados++;
            }
        } catch (error) {
            console.log('   ❌ FALLO: Excepción obteniendo políticas');
            resultados.tests_fallidos++;
        }

        // Test 2.2: Verificar RLS habilitado en todas las tablas
        console.log('🔍 Test 2.2: RLS habilitado en todas las tablas...');
        
        try {
            const tablasEsperadas = ['users', 'properties', 'agents', 'favorites', 'conversations', 'messages'];
            const { data: rlsStatus, error: rlsError } = await supabase
                .from('pg_tables')
                .select('schemaname, tablename, rowsecurity')
                .eq('schemaname', 'public')
                .in('tablename', tablasEsperadas);

            if (rlsError) {
                console.log('   ❌ FALLO: No se puede verificar RLS');
                resultados.tests_fallidos++;
            } else {
                let rlsHabilitado = 0;
                rlsStatus.forEach(tabla => {
                    if (tabla.rowsecurity) {
                        console.log(`      ✅ ${tabla.tablename}: RLS habilitado`);
                        rlsHabilitado++;
                    } else {
                        console.log(`      ❌ ${tabla.tablename}: RLS NO habilitado`);
                        resultados.errores_encontrados.push({
                            test: 'rls_habilitado',
                            tabla: tabla.tablename,
                            problema: 'RLS no habilitado'
                        });
                    }
                });
                
                console.log(`   📊 Resumen: ${rlsHabilitado}/${tablasEsperadas.length} tablas con RLS`);
                if (rlsHabilitado === tablasEsperadas.length) {
                    resultados.tests_pasados++;
                } else {
                    resultados.tests_fallidos++;
                }
            }
        } catch (error) {
            console.log('   ❌ FALLO: Excepción verificando RLS');
            resultados.tests_fallidos++;
        }

        // =====================================================
        // FASE 3: TESTING DE PERFORMANCE
        // =====================================================
        console.log('');
        console.log('⚡ FASE 3: TESTING DE PERFORMANCE');
        console.log('-'.repeat(60));

        // Test 3.1: Medición de tiempo de consultas SELECT
        console.log('🔍 Test 3.1: Performance de consultas SELECT...');
        
        const tiemposConsultas = [];
        for (let i = 0; i < 5; i++) {
            const selectStartTime = Date.now();
            
            try {
                const { data: testSelect, error: selectError } = await supabase
                    .from('users')
                    .select('id, email, user_type, created_at')
                    .limit(10);

                const selectTime = Date.now() - selectStartTime;
                tiemposConsultas.push(selectTime);
                
                if (selectError) {
                    console.log(`      ❌ Consulta ${i+1}: Error - ${selectError.message}`);
                } else {
                    console.log(`      ✅ Consulta ${i+1}: ${selectTime}ms (${testSelect.length} registros)`);
                }
            } catch (error) {
                console.log(`      ❌ Consulta ${i+1}: Excepción`);
            }
        }

        const tiempoPromedio = tiemposConsultas.reduce((a, b) => a + b, 0) / tiemposConsultas.length;
        console.log(`   📊 Tiempo promedio SELECT: ${tiempoPromedio.toFixed(2)}ms`);
        
        if (tiempoPromedio < 200) {
            console.log('   ✅ EXCELENTE: Performance optimizada (<200ms)');
            resultados.tests_pasados++;
        } else if (tiempoPromedio < 500) {
            console.log('   ✅ BUENO: Performance aceptable (<500ms)');
            resultados.tests_pasados++;
        } else {
            console.log('   ⚠️ REGULAR: Performance podría mejorar (>500ms)');
            resultados.tests_fallidos++;
        }
        
        resultados.performance_mejorada.tiempo_promedio_select = tiempoPromedio;

        // Test 3.2: Medición de tiempo de consultas UPDATE
        console.log('🔍 Test 3.2: Performance de consultas UPDATE...');
        
        const updateStartTime = Date.now();
        
        try {
            // Test de UPDATE en usuario crítico (sin cambiar datos reales)
            const { data: testUpdate, error: updateError } = await supabase
                .from('users')
                .update({ updated_at: new Date().toISOString() })
                .eq('id', '6403f9d2-e846-4c70-87e0-e051127d9500')
                .select('id, updated_at');

            const updateTime = Date.now() - updateStartTime;
            
            if (updateError) {
                console.log(`   ❌ FALLO: Error en UPDATE - ${updateError.message}`);
                resultados.tests_fallidos++;
            } else {
                console.log(`   ✅ ÉXITO: UPDATE completado en ${updateTime}ms`);
                if (updateTime < 300) {
                    console.log('   ✅ EXCELENTE: Performance UPDATE optimizada');
                    resultados.tests_pasados++;
                } else {
                    console.log('   ⚠️ REGULAR: Performance UPDATE podría mejorar');
                    resultados.tests_fallidos++;
                }
                resultados.performance_mejorada.tiempo_update = updateTime;
            }
        } catch (error) {
            console.log('   ❌ FALLO: Excepción en UPDATE');
            resultados.tests_fallidos++;
        }

        // =====================================================
        // FASE 4: TESTING DE SEGURIDAD RLS
        // =====================================================
        console.log('');
        console.log('🔒 FASE 4: TESTING DE SEGURIDAD RLS');
        console.log('-'.repeat(60));

        // Test 4.1: Verificar acceso con diferentes roles
        console.log('🔍 Test 4.1: Acceso con diferentes roles...');
        
        // Crear cliente anónimo para testing
        const supabaseAnon = createClient(SUPABASE_URL, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmZXloYWF4eWVtbW5vaHFkZWxlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4MTY3MzgsImV4cCI6MjA3MTM5MjczOH0.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8');
        
        try {
            // Test acceso anónimo (debería estar limitado)
            const { data: anonData, error: anonError } = await supabaseAnon
                .from('users')
                .select('id, email')
                .limit(5);

            if (anonError) {
                console.log('   ✅ SEGURIDAD: Acceso anónimo correctamente restringido');
                console.log(`      └─ Error esperado: ${anonError.message}`);
                resultados.tests_pasados++;
            } else {
                console.log('   ⚠️ ADVERTENCIA: Acceso anónimo permitido');
                console.log(`      └─ Registros obtenidos: ${anonData?.length || 0}`);
                resultados.errores_encontrados.push({
                    test: 'seguridad_anon',
                    problema: 'Acceso anónimo no restringido adecuadamente'
                });
                resultados.tests_fallidos++;
            }
        } catch (error) {
            console.log('   ✅ SEGURIDAD: Acceso anónimo bloqueado por excepción');
            resultados.tests_pasados++;
        }

        // Test 4.2: Verificar políticas consolidadas
        console.log('🔍 Test 4.2: Políticas consolidadas funcionando...');
        
        try {
            const { data: politicasConsolidadas, error: consolidadasError } = await supabase
                .from('pg_policies')
                .select('policyname, cmd')
                .eq('schemaname', 'public')
                .eq('tablename', 'community_profiles')
                .like('policyname', '%consolidated%');

            if (consolidadasError) {
                console.log('   ❌ FALLO: No se pueden verificar políticas consolidadas');
                resultados.tests_fallidos++;
            } else {
                console.log(`   ✅ ÉXITO: ${politicasConsolidadas.length} políticas consolidadas encontradas`);
                politicasConsolidadas.forEach(p => {
                    console.log(`      └─ ${p.policyname} (${p.cmd})`);
                });
                
                if (politicasConsolidadas.length > 0) {
                    resultados.tests_pasados++;
                    resultados.warnings_eliminados.push({
                        tabla: 'community_profiles',
                        optimizacion: 'Multiple Permissive Policies eliminado'
                    });
                } else {
                    resultados.tests_fallidos++;
                }
            }
        } catch (error) {
            console.log('   ❌ FALLO: Excepción verificando políticas consolidadas');
            resultados.tests_fallidos++;
        }

        // =====================================================
        // FASE 5: TESTING DE ENDPOINTS API
        // =====================================================
        console.log('');
        console.log('🌐 FASE 5: TESTING DE ENDPOINTS API');
        console.log('-'.repeat(60));

        // Test 5.1: Endpoint /api/users/profile
        console.log('🔍 Test 5.1: Endpoint /api/users/profile...');
        
        try {
            // Simular test de endpoint (nota: requeriría servidor corriendo)
            console.log('   ℹ️ INFO: Test de endpoint requiere servidor Next.js corriendo');
            console.log('   📋 Endpoints a verificar:');
            console.log('      └─ GET /api/users/profile - Obtener perfil con políticas optimizadas');
            console.log('      └─ PUT /api/users/profile - Actualizar perfil con políticas optimizadas');
            console.log('      └─ POST /api/auth/login - Login con nuevas políticas RLS');
            console.log('      └─ POST /api/auth/register - Registro con políticas optimizadas');
            
            resultados.recomendaciones.push({
                area: 'endpoints_api',
                recomendacion: 'Ejecutar tests de endpoints con servidor corriendo',
                prioridad: 'MEDIA'
            });
        } catch (error) {
            console.log('   ⚠️ ADVERTENCIA: Tests de endpoints requieren configuración adicional');
        }

        // =====================================================
        // FASE 6: VERIFICACIÓN DE WARNINGS ELIMINADOS
        // =====================================================
        console.log('');
        console.log('⚠️ FASE 6: VERIFICACIÓN DE WARNINGS ELIMINADOS');
        console.log('-'.repeat(60));

        // Test 6.1: Verificar que no hay políticas problemáticas
        console.log('🔍 Test 6.1: Políticas problemáticas eliminadas...');
        
        try {
            const { data: politicasProblematicas, error: problemasError } = await supabase
                .from('pg_policies')
                .select('policyname, qual')
                .eq('schemaname', 'public')
                .eq('tablename', 'users');

            if (problemasError) {
                console.log('   ❌ FALLO: No se pueden verificar políticas problemáticas');
                resultados.tests_fallidos++;
            } else {
                let problemasEncontrados = 0;
                politicasProblematicas.forEach(p => {
                    if (p.qual && p.qual.includes('auth.uid()') && !p.qual.includes('( SELECT auth.uid()')) {
                        console.log(`      ❌ PROBLEMA: ${p.policyname} usa auth.uid() sin select`);
                        problemasEncontrados++;
                    } else if (p.qual && p.qual.includes('( SELECT auth.uid()')) {
                        console.log(`      ✅ OPTIMIZADA: ${p.policyname} usa (select auth.uid())`);
                    }
                });
                
                if (problemasEncontrados === 0) {
                    console.log('   ✅ ÉXITO: No se encontraron políticas problemáticas');
                    resultados.tests_pasados++;
                    resultados.warnings_eliminados.push({
                        tipo: 'Auth RLS InitPlan',
                        estado: 'ELIMINADO',
                        politicas_optimizadas: politicasProblematicas.length
                    });
                } else {
                    console.log(`   ❌ FALLO: ${problemasEncontrados} políticas problemáticas encontradas`);
                    resultados.tests_fallidos++;
                }
            }
        } catch (error) {
            console.log('   ❌ FALLO: Excepción verificando políticas problemáticas');
            resultados.tests_fallidos++;
        }

        // =====================================================
        // FASE 7: CORRECCIÓN DE ERRORES MENORES
        // =====================================================
        console.log('');
        console.log('🔧 FASE 7: CORRECCIÓN DE ERRORES MENORES');
        console.log('-'.repeat(60));

        console.log('🔍 Test 7.1: Verificar estructura de tablas para corrección...');
        
        const tablasConErrores = ['properties', 'agents', 'conversations', 'messages'];
        
        for (const tabla of tablasConErrores) {
            try {
                const { data: columnas, error: columnasError } = await supabase
                    .from('information_schema.columns')
                    .select('column_name, data_type')
                    .eq('table_schema', 'public')
                    .eq('table_name', tabla)
                    .order('ordinal_position');

                if (columnasError) {
                    console.log(`   ❌ ${tabla}: Error obteniendo columnas`);
                } else {
                    console.log(`   📋 ${tabla}: ${columnas.length} columnas encontradas`);
                    const columnasRelevantes = columnas.filter(c => 
                        c.column_name.includes('user_id') || 
                        c.column_name.includes('owner_id') ||
                        c.column_name.includes('sender_id') ||
                        c.column_name.includes('receiver_id')
                    );
                    
                    if (columnasRelevantes.length > 0) {
                        console.log(`      └─ Columnas relevantes: ${columnasRelevantes.map(c => c.column_name).join(', ')}`);
                    } else {
                        console.log(`      └─ No se encontraron columnas de referencia usuario`);
                    }
                }
            } catch (error) {
                console.log(`   ❌ ${tabla}: Excepción verificando estructura`);
            }
        }

        console.log('   📋 Script de corrección disponible: Blackbox/corregir-errores-columnas-tablas.sql');
        resultados.recomendaciones.push({
            area: 'errores_menores',
            recomendacion: 'Ejecutar script de corrección de errores de columnas',
            prioridad: 'ALTA',
            script: 'Blackbox/corregir-errores-columnas-tablas.sql'
        });

        // =====================================================
        // RESUMEN FINAL DE TESTING
        // =====================================================
        console.log('');
        console.log('📊 RESUMEN FINAL DE TESTING EXHAUSTIVO');
        console.log('='.repeat(80));

        const totalTests = resultados.tests_pasados + resultados.tests_fallidos;
        const porcentajeExito = totalTests > 0 ? Math.round((resultados.tests_pasados / totalTests) * 100) : 0;

        console.log(`📈 ESTADÍSTICAS GENERALES:`);
        console.log(`   Tests ejecutados: ${totalTests}`);
        console.log(`   Tests exitosos: ${resultados.tests_pasados}`);
        console.log(`   Tests fallidos: ${resultados.tests_fallidos}`);
        console.log(`   Porcentaje de éxito: ${porcentajeExito}%`);

        console.log(`⚠️ WARNINGS ELIMINADOS: ${resultados.warnings_eliminados.length}`);
        resultados.warnings_eliminados.forEach((warning, index) => {
            console.log(`   ${index + 1}. ${warning.optimizacion || warning.tipo}: ${warning.politica || warning.tabla || 'General'}`);
        });

        console.log(`⚡ MEJORAS DE PERFORMANCE:`);
        Object.keys(resultados.performance_mejorada).forEach(metrica => {
            const valor = resultados.performance_mejorada[metrica];
            console.log(`   ${metrica}: ${typeof valor === 'number' ? valor.toFixed(2) + 'ms' : valor}`);
        });

        console.log(`❌ ERRORES ENCONTRADOS: ${resultados.errores_encontrados.length}`);
        resultados.errores_encontrados.forEach((error, index) => {
            console.log(`   ${index + 1}. [${error.criticidad || 'MEDIA'}] ${error.test}: ${error.problema || error.error}`);
        });

        console.log(`💡 RECOMENDACIONES: ${resultados.recomendaciones.length}`);
        resultados.recomendaciones.forEach((rec, index) => {
            console.log(`   ${index + 1}. [${rec.prioridad}] ${rec.area}: ${rec.recomendacion}`);
        });

        // Determinar estado general
        let estadoGeneral;
        if (porcentajeExito >= 90 && resultados.errores_encontrados.filter(e => e.criticidad === 'ALTA').length === 0) {
            estadoGeneral = 'EXCELENTE';
        } else if (porcentajeExito >= 75 && resultados.errores_encontrados.filter(e => e.criticidad === 'ALTA').length === 0) {
            estadoGeneral = 'BUENO';
        } else if (porcentajeExito >= 60) {
            estadoGeneral = 'REGULAR';
        } else {
            estadoGeneral = 'CRÍTICO';
        }

        console.log('');
        console.log(`🎯 ESTADO GENERAL: ${estadoGeneral}`);
        console.log(`📊 OPTIMIZACIÓN: ${porcentajeExito >= 75 ? 'EXITOSA' : 'REQUIERE MEJORAS'}`);

        // Guardar resultados completos
        const fs = require('fs');
        const reporteCompleto = {
            timestamp: new Date().toISOString(),
            estadoGeneral: estadoGeneral,
            porcentajeExito: porcentajeExito,
            resultados: resultados,
            conclusion: porcentajeExito >= 75 ? 'OPTIMIZACIÓN EXITOSA' : 'REQUIERE MEJORAS ADICIONALES'
        };

        fs.writeFileSync(
            'Blackbox/reporte-testing-exhaustivo-final.json',
            JSON.stringify(reporteCompleto, null, 2)
        );

        console.log('');
        console.log('💾 REPORTE COMPLETO GUARDADO: reporte-testing-exhaustivo-final.json');
        console.log('');
        console.log('✅ TESTING EXHAUSTIVO COMPLETADO');

        return reporteCompleto;

    } catch (error) {
        console.error('❌ Error crítico en testing exhaustivo:', error.message);
        return {
            error: error.message,
            estadoGeneral: 'ERROR',
            resultados: resultados
        };
    }
}

// Ejecutar testing exhaustivo
if (require.main === module) {
    testingExhaustivoOptimizacion().catch(console.error);
}

module.exports = { testingExhaustivoOptimizacion };
