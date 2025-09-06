const { createClient } = require('@supabase/supabase-js');

console.log('✅ VERIFICACIÓN FINAL - WARNINGS SOLUCIONADOS');
console.log('=' .repeat(70));

const SUPABASE_URL = 'https://qfeyhaaxyemmnohqdele.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmZXloYWF4eWVtbW5vaHFkZWxlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTgxNjczOCwiZXhwIjoyMDcxMzkyNzM4fQ.5wJb1p0Rmg1dVIayIT4wZO_seDXTIwhVa36CyEgK-yM';

async function verificarSolucionesAplicadas() {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    console.log('🔗 Conectando a Supabase...');
    console.log('');

    const verificaciones = [];
    let puntuacionTotal = 0;
    const puntuacionMaxima = 100;

    try {
        // 1. VERIFICAR TABLAS CRÍTICAS
        console.log('📋 VERIFICACIÓN 1: TABLAS CRÍTICAS...');
        console.log('-'.repeat(50));

        const tablasEsperadas = ['users', 'properties', 'agents', 'favorites', 'conversations', 'messages'];
        let tablasEncontradas = 0;

        for (const tabla of tablasEsperadas) {
            try {
                const { data, error } = await supabase
                    .from(tabla)
                    .select('count')
                    .limit(1);

                if (error) {
                    console.log(`   ❌ Tabla ${tabla}: NO EXISTE - ${error.message}`);
                    verificaciones.push(`❌ Tabla ${tabla} faltante`);
                } else {
                    console.log(`   ✅ Tabla ${tabla}: EXISTE`);
                    tablasEncontradas++;
                }
            } catch (error) {
                console.log(`   ❌ Tabla ${tabla}: ERROR - ${error.message}`);
            }
        }

        const puntuacionTablas = (tablasEncontradas / tablasEsperadas.length) * 20;
        puntuacionTotal += puntuacionTablas;
        console.log(`   📊 Puntuación tablas: ${puntuacionTablas.toFixed(1)}/20`);

        console.log('');

        // 2. VERIFICAR POLÍTICAS RLS
        console.log('🔒 VERIFICACIÓN 2: POLÍTICAS RLS...');
        console.log('-'.repeat(50));

        const { data: politicas, error: politicasError } = await supabase
            .from('pg_policies')
            .select('schemaname, tablename, policyname')
            .eq('schemaname', 'public');

        if (politicasError) {
            console.log('   ❌ Error verificando políticas:', politicasError.message);
            verificaciones.push('❌ No se pueden verificar políticas RLS');
        } else {
            console.log(`   ✅ Políticas RLS encontradas: ${politicas.length}`);
            
            const tablasSinPoliticas = [];
            for (const tabla of tablasEsperadas) {
                const tienePoliticas = politicas.some(p => p.tablename === tabla);
                if (!tienePoliticas) {
                    tablasSinPoliticas.push(tabla);
                }
            }

            if (tablasSinPoliticas.length === 0) {
                console.log('   ✅ Todas las tablas tienen políticas RLS');
                puntuacionTotal += 20;
            } else {
                console.log(`   ⚠️ Tablas sin políticas: ${tablasSinPoliticas.join(', ')}`);
                const puntuacionRLS = ((tablasEsperadas.length - tablasSinPoliticas.length) / tablasEsperadas.length) * 20;
                puntuacionTotal += puntuacionRLS;
            }
        }

        console.log('');

        // 3. VERIFICAR FUNCIONES Y TRIGGERS
        console.log('⚙️ VERIFICACIÓN 3: FUNCIONES Y TRIGGERS...');
        console.log('-'.repeat(50));

        const { data: funciones, error: funcionesError } = await supabase
            .from('information_schema.routines')
            .select('routine_name')
            .eq('routine_schema', 'public');

        if (funcionesError) {
            console.log('   ❌ Error verificando funciones:', funcionesError.message);
        } else {
            const tieneHandleUpdatedAt = funciones.some(f => f.routine_name === 'handle_updated_at');
            if (tieneHandleUpdatedAt) {
                console.log('   ✅ Función handle_updated_at existe');
                puntuacionTotal += 10;
            } else {
                console.log('   ❌ Función handle_updated_at faltante');
                verificaciones.push('❌ Función handle_updated_at faltante');
            }
        }

        const { data: triggers, error: triggersError } = await supabase
            .from('information_schema.triggers')
            .select('trigger_name, event_object_table')
            .eq('trigger_schema', 'public');

        if (triggersError) {
            console.log('   ❌ Error verificando triggers:', triggersError.message);
        } else {
            const triggersUpdatedAt = triggers.filter(t => t.trigger_name === 'set_updated_at');
            console.log(`   ✅ Triggers updated_at encontrados: ${triggersUpdatedAt.length}`);
            
            if (triggersUpdatedAt.length >= 3) {
                puntuacionTotal += 10;
            } else {
                puntuacionTotal += (triggersUpdatedAt.length / 3) * 10;
            }
        }

        console.log('');

        // 4. VERIFICAR STORAGE BUCKETS
        console.log('📁 VERIFICACIÓN 4: STORAGE BUCKETS...');
        console.log('-'.repeat(50));

        const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();

        if (bucketsError) {
            console.log('   ❌ Error verificando buckets:', bucketsError.message);
            verificaciones.push('❌ No se puede acceder al storage');
        } else {
            const bucketsEsperados = ['avatars', 'property-images', 'documents'];
            const bucketsExistentes = buckets.map(b => b.name);
            
            let bucketsEncontrados = 0;
            for (const bucket of bucketsEsperados) {
                if (bucketsExistentes.includes(bucket)) {
                    console.log(`   ✅ Bucket ${bucket}: EXISTE`);
                    bucketsEncontrados++;
                } else {
                    console.log(`   ❌ Bucket ${bucket}: FALTANTE`);
                    verificaciones.push(`❌ Bucket ${bucket} faltante`);
                }
            }

            const puntuacionBuckets = (bucketsEncontrados / bucketsEsperados.length) * 15;
            puntuacionTotal += puntuacionBuckets;
            console.log(`   📊 Puntuación buckets: ${puntuacionBuckets.toFixed(1)}/15`);
        }

        console.log('');

        // 5. VERIFICAR ÍNDICES
        console.log('📊 VERIFICACIÓN 5: ÍNDICES...');
        console.log('-'.repeat(50));

        const { data: indices, error: indicesError } = await supabase
            .from('pg_indexes')
            .select('indexname, tablename')
            .eq('schemaname', 'public');

        if (indicesError) {
            console.log('   ❌ Error verificando índices:', indicesError.message);
        } else {
            const indicesEsperados = [
                'idx_properties_city',
                'idx_properties_price',
                'idx_properties_available',
                'idx_favorites_user'
            ];

            let indicesEncontrados = 0;
            for (const indice of indicesEsperados) {
                const existe = indices.some(i => i.indexname === indice);
                if (existe) {
                    console.log(`   ✅ Índice ${indice}: EXISTE`);
                    indicesEncontrados++;
                } else {
                    console.log(`   ❌ Índice ${indice}: FALTANTE`);
                }
            }

            const puntuacionIndices = (indicesEncontrados / indicesEsperados.length) * 10;
            puntuacionTotal += puntuacionIndices;
            console.log(`   📊 Puntuación índices: ${puntuacionIndices.toFixed(1)}/10`);
        }

        console.log('');

        // 6. VERIFICAR DATOS DE PRUEBA
        console.log('🧪 VERIFICACIÓN 6: DATOS DE PRUEBA...');
        console.log('-'.repeat(50));

        const userId = '6403f9d2-e846-4c70-87e0-e051127d9500';
        
        try {
            const { data: userData, error: userError } = await supabase
                .from('users')
                .select('id, name, email, user_type')
                .eq('id', userId)
                .single();

            if (userError) {
                console.log('   ❌ Usuario de prueba no encontrado:', userError.message);
                verificaciones.push('❌ Usuario de prueba faltante');
            } else {
                console.log('   ✅ Usuario de prueba existe:');
                console.log(`      - ID: ${userData.id}`);
                console.log(`      - Nombre: ${userData.name}`);
                console.log(`      - Email: ${userData.email}`);
                console.log(`      - Tipo: ${userData.user_type}`);
                puntuacionTotal += 15;
            }
        } catch (error) {
            console.log('   ❌ Error verificando usuario de prueba:', error.message);
        }

        console.log('');

        // 7. TEST DEL ERROR 406 ORIGINAL
        console.log('🧪 VERIFICACIÓN 7: TEST ERROR 406 ORIGINAL...');
        console.log('-'.repeat(50));

        try {
            const { data: testData, error: testError } = await supabase
                .from('users')
                .select('user_type,created_at')
                .eq('id', userId)
                .single();

            if (testError) {
                console.log('   ❌ Error 406 PERSISTE:', testError.message);
                verificaciones.push('❌ Error 406 no solucionado');
            } else {
                console.log('   ✅ Error 406 SOLUCIONADO - Consulta exitosa');
                console.log(`      - Datos obtenidos: ${JSON.stringify(testData)}`);
                puntuacionTotal += 10;
            }
        } catch (error) {
            console.log('   ❌ Error en test 406:', error.message);
        }

        console.log('');

        // RESUMEN FINAL
        console.log('📊 RESUMEN FINAL DE VERIFICACIÓN');
        console.log('='.repeat(70));
        
        const porcentajeCompletado = (puntuacionTotal / puntuacionMaxima) * 100;
        
        console.log(`📈 PUNTUACIÓN TOTAL: ${puntuacionTotal.toFixed(1)}/${puntuacionMaxima}`);
        console.log(`📊 PORCENTAJE COMPLETADO: ${porcentajeCompletado.toFixed(1)}%`);
        
        let estadoGeneral;
        if (porcentajeCompletado >= 90) {
            estadoGeneral = '🎉 EXCELENTE - Todos los warnings solucionados';
        } else if (porcentajeCompletado >= 75) {
            estadoGeneral = '✅ BUENO - Mayoría de warnings solucionados';
        } else if (porcentajeCompletado >= 50) {
            estadoGeneral = '⚠️ REGULAR - Algunos warnings pendientes';
        } else {
            estadoGeneral = '❌ CRÍTICO - Muchos warnings sin solucionar';
        }
        
        console.log(`🎯 ESTADO GENERAL: ${estadoGeneral}`);
        
        console.log('');
        console.log('🚨 PROBLEMAS PENDIENTES:');
        if (verificaciones.length === 0) {
            console.log('   ✅ No hay problemas pendientes');
        } else {
            verificaciones.forEach((problema, index) => {
                console.log(`   ${index + 1}. ${problema}`);
            });
        }

        // Guardar reporte final
        const reporteVerificacion = {
            timestamp: new Date().toISOString(),
            puntuacionTotal: puntuacionTotal,
            puntuacionMaxima: puntuacionMaxima,
            porcentajeCompletado: porcentajeCompletado,
            estadoGeneral: estadoGeneral,
            problemasPendientes: verificaciones,
            detalles: {
                tablas: tablasEncontradas,
                politicas: politicas?.length || 0,
                funciones: funciones?.length || 0,
                triggers: triggers?.length || 0,
                buckets: buckets?.length || 0,
                error406Solucionado: !verificaciones.some(v => v.includes('Error 406'))
            }
        };

        require('fs').writeFileSync(
            'REPORTE-VERIFICACION-FINAL-WARNINGS.json',
            JSON.stringify(reporteVerificacion, null, 2)
        );

        console.log('');
        console.log('📄 Reporte guardado en: REPORTE-VERIFICACION-FINAL-WARNINGS.json');
        console.log('✅ VERIFICACIÓN COMPLETADA');

        return reporteVerificacion;

    } catch (error) {
        console.error('❌ Error general en verificación:', error.message);
        return null;
    }
}

verificarSolucionesAplicadas().catch(console.error);
