// =====================================================
// TEST: VERIFICACIÓN WARNINGS MULTIPLE POLICIES SOLUCIONADOS
// =====================================================
// Fecha: 2025-01-27
// Objetivo: Verificar que los warnings fueron eliminados correctamente
// Protocolo: Testing exhaustivo sin romper funcionalidad existente
// =====================================================

const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const SUPABASE_URL = 'https://qfeyhaaxyemmnohqdele.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmZXloYWF4eWVtbW5vaHFkZWxlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTgxNjczOCwiZXhwIjoyMDcxMzkyNzM4fQ.5wJb1p0Rmg1dVIayIT4wZO_seDXTIwhVa36CyEgK-yM';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function testWarningsSolucionados() {
    console.log('🧪 INICIANDO TESTING: WARNINGS MULTIPLE POLICIES SOLUCIONADOS');
    console.log('=' .repeat(65));
    console.log(`⏰ Timestamp: ${new Date().toISOString()}`);
    console.log(`🔗 Supabase URL: ${SUPABASE_URL}`);
    console.log('=' .repeat(65));
    console.log('');

    const resultados = {
        timestamp: new Date().toISOString(),
        tests: {
            conexion: false,
            politicasConsolidadas: false,
            indicesDuplicados: false,
            funcionalidadPreservada: false,
            rendimientoMejorado: false
        },
        detalles: {},
        errores: [],
        estadoFinal: 'PENDIENTE'
    };

    try {
        // ====================================================================
        console.log('🔍 TEST 1: VERIFICACIÓN DE CONEXIÓN');
        console.log('='.repeat(40));

        const { data: conexionTest, error: conexionError } = await supabase
            .from('users')
            .select('id')
            .limit(1);

        if (conexionError) {
            console.log('❌ Error de conexión:', conexionError.message);
            resultados.errores.push(`Conexión: ${conexionError.message}`);
        } else {
            console.log('✅ Conexión exitosa con Supabase');
            resultados.tests.conexion = true;
        }
        console.log('');

        // ====================================================================
        console.log('🔍 TEST 2: VERIFICACIÓN DE POLÍTICAS CONSOLIDADAS');
        console.log('='.repeat(40));

        // Verificar políticas por tabla
        const tablasTest = ['users', 'favorites', 'property_inquiries'];
        let politicasOK = true;

        for (const tabla of tablasTest) {
            console.log(`📋 Verificando tabla: ${tabla}`);

            const { data: politicas, error: politicasError } = await supabase
                .rpc('sql', {
                    query: `
                        SELECT 
                            cmd,
                            COUNT(*) as policy_count,
                            array_agg(policyname) as policy_names
                        FROM pg_policies 
                        WHERE schemaname = 'public' AND tablename = '${tabla}'
                        GROUP BY cmd
                        ORDER BY cmd;
                    `
                });

            if (politicasError) {
                console.log(`   ❌ Error verificando políticas de ${tabla}:`, politicasError.message);
                resultados.errores.push(`Políticas ${tabla}: ${politicasError.message}`);
                politicasOK = false;
            } else {
                console.log(`   📊 Políticas encontradas: ${politicas.length} tipos`);
                
                let tablaTieneMultiples = false;
                politicas.forEach(pol => {
                    if (pol.policy_count > 1) {
                        console.log(`   ⚠️ MÚLTIPLES POLÍTICAS: ${pol.cmd} (${pol.policy_count})`);
                        console.log(`      Políticas: ${pol.policy_names.join(', ')}`);
                        tablaTieneMultiples = true;
                        politicasOK = false;
                    } else {
                        console.log(`   ✅ ${pol.cmd}: 1 política (${pol.policy_names[0]})`);
                    }
                });

                if (!tablaTieneMultiples) {
                    console.log(`   ✅ Tabla ${tabla}: Sin políticas múltiples`);
                }
            }
            console.log('');
        }

        resultados.tests.politicasConsolidadas = politicasOK;
        if (politicasOK) {
            console.log('✅ POLÍTICAS CONSOLIDADAS CORRECTAMENTE');
        } else {
            console.log('❌ AÚN EXISTEN POLÍTICAS MÚLTIPLES');
        }
        console.log('');

        // ====================================================================
        console.log('🔍 TEST 3: VERIFICACIÓN DE ÍNDICES DUPLICADOS');
        console.log('='.repeat(40));

        const { data: indices, error: indicesError } = await supabase
            .rpc('sql', {
                query: `
                    SELECT 
                        tablename,
                        indexdef,
                        COUNT(*) as index_count,
                        array_agg(indexname) as index_names
                    FROM pg_indexes 
                    WHERE schemaname = 'public'
                    GROUP BY tablename, indexdef
                    HAVING COUNT(*) > 1
                    ORDER BY tablename;
                `
            });

        if (indicesError) {
            console.log('❌ Error verificando índices:', indicesError.message);
            resultados.errores.push(`Índices: ${indicesError.message}`);
        } else {
            if (indices.length === 0) {
                console.log('✅ NO SE ENCONTRARON ÍNDICES DUPLICADOS');
                resultados.tests.indicesDuplicados = true;
            } else {
                console.log(`❌ ÍNDICES DUPLICADOS ENCONTRADOS: ${indices.length}`);
                indices.forEach(idx => {
                    console.log(`   📋 Tabla: ${idx.tablename}`);
                    console.log(`   📊 Cantidad: ${idx.index_count}`);
                    console.log(`   📝 Índices: ${idx.index_names.join(', ')}`);
                    console.log('');
                });
            }
        }
        console.log('');

        // ====================================================================
        console.log('🔍 TEST 4: VERIFICACIÓN DE FUNCIONALIDAD PRESERVADA');
        console.log('='.repeat(40));

        // Test básico de acceso a usuarios
        const { data: usuarioTest, error: usuarioError } = await supabase
            .from('users')
            .select('id, name, email, user_type')
            .eq('id', '6403f9d2-e846-4c70-87e0-e051127d9500')
            .single();

        if (usuarioError) {
            console.log('❌ Error accediendo a usuario de prueba:', usuarioError.message);
            resultados.errores.push(`Usuario prueba: ${usuarioError.message}`);
        } else {
            console.log('✅ Usuario de prueba accesible');
            console.log(`   📋 ID: ${usuarioTest.id}`);
            console.log(`   👤 Nombre: ${usuarioTest.name || 'N/A'}`);
            console.log(`   📧 Email: ${usuarioTest.email}`);
            console.log(`   🏷️ Tipo: ${usuarioTest.user_type || 'N/A'}`);
        }

        // Test de acceso a favorites (si existe la tabla)
        const { data: favoritesTest, error: favoritesError } = await supabase
            .from('favorites')
            .select('*')
            .limit(1);

        if (favoritesError && !favoritesError.message.includes('does not exist')) {
            console.log('❌ Error accediendo a favorites:', favoritesError.message);
            resultados.errores.push(`Favorites: ${favoritesError.message}`);
        } else if (!favoritesError) {
            console.log('✅ Tabla favorites accesible');
        } else {
            console.log('ℹ️ Tabla favorites no existe (normal si no se ha creado)');
        }

        // Test de acceso a property_inquiries (si existe la tabla)
        const { data: inquiriesTest, error: inquiriesError } = await supabase
            .from('property_inquiries')
            .select('*')
            .limit(1);

        if (inquiriesError && !inquiriesError.message.includes('does not exist')) {
            console.log('❌ Error accediendo a property_inquiries:', inquiriesError.message);
            resultados.errores.push(`Property inquiries: ${inquiriesError.message}`);
        } else if (!inquiriesError) {
            console.log('✅ Tabla property_inquiries accesible');
        } else {
            console.log('ℹ️ Tabla property_inquiries no existe (normal si no se ha creado)');
        }

        if (usuarioTest && resultados.errores.length === 0) {
            resultados.tests.funcionalidadPreservada = true;
            console.log('✅ FUNCIONALIDAD PRESERVADA CORRECTAMENTE');
        } else {
            console.log('❌ PROBLEMAS EN FUNCIONALIDAD');
        }
        console.log('');

        // ====================================================================
        console.log('🔍 TEST 5: VERIFICACIÓN DE MEJORA EN RENDIMIENTO');
        console.log('='.repeat(40));

        // Contar políticas totales
        const { data: totalPoliticas, error: totalPoliticasError } = await supabase
            .rpc('sql', {
                query: `
                    SELECT COUNT(*) as total_policies
                    FROM pg_policies 
                    WHERE schemaname = 'public';
                `
            });

        // Contar índices totales
        const { data: totalIndices, error: totalIndicesError } = await supabase
            .rpc('sql', {
                query: `
                    SELECT COUNT(*) as total_indexes
                    FROM pg_indexes 
                    WHERE schemaname = 'public';
                `
            });

        if (!totalPoliticasError && !totalIndicesError) {
            console.log(`📊 Total políticas activas: ${totalPoliticas[0].total_policies}`);
            console.log(`📊 Total índices activos: ${totalIndices[0].total_indexes}`);
            
            // Verificar que el número es razonable (no demasiadas políticas)
            if (totalPoliticas[0].total_policies <= 20) {
                console.log('✅ Número de políticas optimizado');
                resultados.tests.rendimientoMejorado = true;
            } else {
                console.log('⚠️ Número de políticas aún alto');
            }
        }
        console.log('');

        // ====================================================================
        console.log('📊 RESUMEN FINAL DE TESTING');
        console.log('='.repeat(40));

        const testsExitosos = Object.values(resultados.tests).filter(t => t).length;
        const totalTests = Object.keys(resultados.tests).length;

        console.log(`✅ Tests exitosos: ${testsExitosos}/${totalTests}`);
        console.log(`❌ Errores encontrados: ${resultados.errores.length}`);

        Object.entries(resultados.tests).forEach(([test, resultado]) => {
            const emoji = resultado ? '✅' : '❌';
            console.log(`   ${emoji} ${test}: ${resultado ? 'PASS' : 'FAIL'}`);
        });

        if (resultados.errores.length > 0) {
            console.log('\n🚨 ERRORES DETALLADOS:');
            resultados.errores.forEach((error, index) => {
                console.log(`   ${index + 1}. ${error}`);
            });
        }

        // Determinar estado final
        if (testsExitosos === totalTests && resultados.errores.length === 0) {
            resultados.estadoFinal = 'EXITOSO';
            console.log('\n🎉 ESTADO FINAL: ✅ TODOS LOS WARNINGS SOLUCIONADOS');
        } else if (testsExitosos >= totalTests * 0.8) {
            resultados.estadoFinal = 'PARCIAL';
            console.log('\n⚠️ ESTADO FINAL: 🟡 WARNINGS PARCIALMENTE SOLUCIONADOS');
        } else {
            resultados.estadoFinal = 'FALLIDO';
            console.log('\n❌ ESTADO FINAL: 🔴 WARNINGS NO SOLUCIONADOS');
        }

        // Guardar resultados
        const fs = require('fs');
        const reportePath = 'Blackbox/TEST-WARNINGS-MULTIPLE-POLICIES-RESULTADO.json';
        fs.writeFileSync(reportePath, JSON.stringify(resultados, null, 2));
        console.log(`\n📄 Reporte guardado en: ${reportePath}`);

        console.log('\n✅ TESTING COMPLETADO');
        return resultados;

    } catch (error) {
        console.log('❌ ERROR DURANTE EL TESTING:', error.message);
        resultados.errores.push(`Error general: ${error.message}`);
        resultados.estadoFinal = 'ERROR';
        return resultados;
    }
}

// Ejecutar testing
if (require.main === module) {
    testWarningsSolucionados().catch(console.error);
}

module.exports = { testWarningsSolucionados };
