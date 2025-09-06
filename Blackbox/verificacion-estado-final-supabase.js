const { createClient } = require('@supabase/supabase-js');

console.log('🔍 VERIFICACIÓN ESTADO FINAL DE SUPABASE');
console.log('=' .repeat(70));

const SUPABASE_URL = 'https://qfeyhaaxyemmnohqdele.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmZXloYWF4eWVtbW5vaHFkZWxlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTgxNjczOCwiZXhwIjoyMDcxMzkyNzM4fQ.5wJb1p0Rmg1dVIayIT4wZO_seDXTIwhVa36CyEgK-yM';

async function verificarEstadoFinalSupabase() {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    console.log('🔗 Conectando a Supabase para verificación final...');
    console.log('');

    const estadoFinal = {
        ejecutadoAutomaticamente: false,
        requiereEjecucionManual: false,
        tablasExistentes: [],
        tablasFaltantes: [],
        politicasRLS: 0,
        bucketsStorage: 0,
        funcionesPersonalizadas: 0,
        triggersActivos: 0,
        error406Solucionado: false,
        usuarioPruebaExiste: false,
        accionesRequeridas: [],
        estadoGeneral: 'PENDIENTE'
    };

    try {
        // 1. VERIFICAR TABLAS CRÍTICAS
        console.log('📋 VERIFICANDO TABLAS CRÍTICAS...');
        console.log('-'.repeat(50));

        const tablasEsperadas = ['users', 'properties', 'agents', 'favorites', 'conversations', 'messages'];
        
        for (const tabla of tablasEsperadas) {
            try {
                const { data, error } = await supabase
                    .from(tabla)
                    .select('count')
                    .limit(1);

                if (error) {
                    console.log(`   ❌ Tabla ${tabla}: NO EXISTE`);
                    estadoFinal.tablasFaltantes.push(tabla);
                } else {
                    console.log(`   ✅ Tabla ${tabla}: EXISTE`);
                    estadoFinal.tablasExistentes.push(tabla);
                }
            } catch (error) {
                console.log(`   ❌ Tabla ${tabla}: ERROR - ${error.message}`);
                estadoFinal.tablasFaltantes.push(tabla);
            }
        }

        // 2. VERIFICAR POLÍTICAS RLS
        console.log('');
        console.log('🔒 VERIFICANDO POLÍTICAS RLS...');
        console.log('-'.repeat(50));

        try {
            const { data: politicas, error } = await supabase
                .from('pg_policies')
                .select('schemaname, tablename, policyname')
                .eq('schemaname', 'public');

            if (error) {
                console.log('   ❌ No se pueden verificar políticas RLS');
            } else {
                estadoFinal.politicasRLS = politicas.length;
                console.log(`   📊 Políticas RLS encontradas: ${politicas.length}`);
                
                if (politicas.length > 0) {
                    console.log('   ✅ RLS configurado correctamente');
                } else {
                    console.log('   ❌ No hay políticas RLS configuradas');
                }
            }
        } catch (error) {
            console.log('   ❌ Error verificando RLS:', error.message);
        }

        // 3. VERIFICAR STORAGE BUCKETS
        console.log('');
        console.log('📁 VERIFICANDO STORAGE BUCKETS...');
        console.log('-'.repeat(50));

        try {
            const { data: buckets, error } = await supabase.storage.listBuckets();

            if (error) {
                console.log('   ❌ No se puede acceder al storage');
            } else {
                estadoFinal.bucketsStorage = buckets.length;
                console.log(`   📊 Buckets encontrados: ${buckets.length}`);
                
                const bucketsEsperados = ['avatars', 'property-images', 'documents'];
                bucketsEsperados.forEach(bucket => {
                    const existe = buckets.some(b => b.name === bucket);
                    if (existe) {
                        console.log(`   ✅ Bucket ${bucket}: EXISTE`);
                    } else {
                        console.log(`   ❌ Bucket ${bucket}: FALTANTE`);
                    }
                });
            }
        } catch (error) {
            console.log('   ❌ Error verificando storage:', error.message);
        }

        // 4. VERIFICAR FUNCIONES PERSONALIZADAS
        console.log('');
        console.log('⚙️ VERIFICANDO FUNCIONES PERSONALIZADAS...');
        console.log('-'.repeat(50));

        try {
            const { data: funciones, error } = await supabase
                .from('information_schema.routines')
                .select('routine_name')
                .eq('routine_schema', 'public');

            if (error) {
                console.log('   ❌ No se pueden verificar funciones');
            } else {
                estadoFinal.funcionesPersonalizadas = funciones.length;
                console.log(`   📊 Funciones encontradas: ${funciones.length}`);
                
                const tieneHandleUpdatedAt = funciones.some(f => f.routine_name === 'handle_updated_at');
                if (tieneHandleUpdatedAt) {
                    console.log('   ✅ Función handle_updated_at: EXISTE');
                } else {
                    console.log('   ❌ Función handle_updated_at: FALTANTE');
                }
            }
        } catch (error) {
            console.log('   ❌ Error verificando funciones:', error.message);
        }

        // 5. VERIFICAR TRIGGERS
        console.log('');
        console.log('🔄 VERIFICANDO TRIGGERS...');
        console.log('-'.repeat(50));

        try {
            const { data: triggers, error } = await supabase
                .from('information_schema.triggers')
                .select('trigger_name, event_object_table')
                .eq('trigger_schema', 'public');

            if (error) {
                console.log('   ❌ No se pueden verificar triggers');
            } else {
                estadoFinal.triggersActivos = triggers.length;
                console.log(`   📊 Triggers encontrados: ${triggers.length}`);
                
                const triggersUpdatedAt = triggers.filter(t => t.trigger_name === 'set_updated_at');
                console.log(`   📋 Triggers updated_at: ${triggersUpdatedAt.length}`);
            }
        } catch (error) {
            console.log('   ❌ Error verificando triggers:', error.message);
        }

        // 6. TEST CRÍTICO: ERROR 406 ORIGINAL
        console.log('');
        console.log('🧪 TEST CRÍTICO: ERROR 406 ORIGINAL...');
        console.log('-'.repeat(50));

        const userId = '6403f9d2-e846-4c70-87e0-e051127d9500';
        
        try {
            const { data: testData, error: testError } = await supabase
                .from('users')
                .select('user_type,created_at')
                .eq('id', userId)
                .single();

            if (testError) {
                console.log('   ❌ ERROR 406 PERSISTE:', testError.message);
                console.log('   🚨 CRÍTICO: El error original NO está solucionado');
                estadoFinal.error406Solucionado = false;
            } else {
                console.log('   ✅ ERROR 406 SOLUCIONADO COMPLETAMENTE');
                console.log(`   📊 Datos obtenidos: ${JSON.stringify(testData)}`);
                estadoFinal.error406Solucionado = true;
            }
        } catch (error) {
            console.log('   ❌ Error en test crítico:', error.message);
            estadoFinal.error406Solucionado = false;
        }

        // 7. VERIFICAR USUARIO DE PRUEBA
        console.log('');
        console.log('👤 VERIFICANDO USUARIO DE PRUEBA...');
        console.log('-'.repeat(50));

        try {
            const { data: userData, error: userError } = await supabase
                .from('users')
                .select('id, name, email, user_type')
                .eq('id', userId)
                .single();

            if (userError) {
                console.log('   ❌ Usuario de prueba NO EXISTE');
                estadoFinal.usuarioPruebaExiste = false;
            } else {
                console.log('   ✅ Usuario de prueba EXISTE');
                console.log(`   📋 Datos: ${userData.name} (${userData.email})`);
                estadoFinal.usuarioPruebaExiste = true;
            }
        } catch (error) {
            console.log('   ❌ Error verificando usuario:', error.message);
            estadoFinal.usuarioPruebaExiste = false;
        }

        // DETERMINAR ESTADO GENERAL Y ACCIONES REQUERIDAS
        console.log('');
        console.log('📊 ANÁLISIS DEL ESTADO ACTUAL');
        console.log('='.repeat(70));

        // Verificar si se ejecutó automáticamente
        if (estadoFinal.tablasExistentes.length >= 4 && 
            estadoFinal.politicasRLS > 0 && 
            estadoFinal.error406Solucionado) {
            estadoFinal.ejecutadoAutomaticamente = true;
            estadoFinal.estadoGeneral = 'COMPLETADO AUTOMÁTICAMENTE';
            console.log('🎉 LOS SCRIPTS SE EJECUTARON AUTOMÁTICAMENTE EN SUPABASE');
        } else {
            estadoFinal.requiereEjecucionManual = true;
            estadoFinal.estadoGeneral = 'REQUIERE EJECUCIÓN MANUAL';
            console.log('⚠️ LOS SCRIPTS NO SE EJECUTARON - REQUIERE ACCIÓN MANUAL');
        }

        // Determinar acciones requeridas
        if (estadoFinal.tablasFaltantes.length > 0) {
            estadoFinal.accionesRequeridas.push(`Crear tablas faltantes: ${estadoFinal.tablasFaltantes.join(', ')}`);
        }
        
        if (estadoFinal.politicasRLS === 0) {
            estadoFinal.accionesRequeridas.push('Configurar políticas RLS');
        }
        
        if (estadoFinal.bucketsStorage < 3) {
            estadoFinal.accionesRequeridas.push('Crear buckets de storage');
        }
        
        if (!estadoFinal.error406Solucionado) {
            estadoFinal.accionesRequeridas.push('CRÍTICO: Solucionar error 406');
        }

        // MOSTRAR RESULTADOS FINALES
        console.log('');
        console.log('📋 ESTADO ACTUAL DE SUPABASE:');
        console.log(`   📊 Tablas existentes: ${estadoFinal.tablasExistentes.length}/6`);
        console.log(`   🔒 Políticas RLS: ${estadoFinal.politicasRLS}`);
        console.log(`   📁 Buckets storage: ${estadoFinal.bucketsStorage}`);
        console.log(`   ⚙️ Funciones: ${estadoFinal.funcionesPersonalizadas}`);
        console.log(`   🔄 Triggers: ${estadoFinal.triggersActivos}`);
        console.log(`   🧪 Error 406: ${estadoFinal.error406Solucionado ? '✅ SOLUCIONADO' : '❌ PERSISTE'}`);
        console.log(`   👤 Usuario prueba: ${estadoFinal.usuarioPruebaExiste ? '✅ EXISTE' : '❌ FALTANTE'}`);

        console.log('');
        console.log('🎯 ESTADO GENERAL:', estadoFinal.estadoGeneral);

        if (estadoFinal.accionesRequeridas.length > 0) {
            console.log('');
            console.log('📋 ACCIONES REQUERIDAS:');
            estadoFinal.accionesRequeridas.forEach((accion, index) => {
                console.log(`   ${index + 1}. ${accion}`);
            });
        } else {
            console.log('');
            console.log('✅ NO SE REQUIEREN ACCIONES ADICIONALES');
        }

        // Guardar reporte final
        require('fs').writeFileSync(
            'ESTADO-FINAL-SUPABASE.json',
            JSON.stringify(estadoFinal, null, 2)
        );

        console.log('');
        console.log('📄 Estado guardado en: ESTADO-FINAL-SUPABASE.json');
        console.log('✅ VERIFICACIÓN COMPLETADA');

        return estadoFinal;

    } catch (error) {
        console.error('❌ Error general en verificación:', error.message);
        estadoFinal.estadoGeneral = 'ERROR EN VERIFICACIÓN';
        return estadoFinal;
    }
}

verificarEstadoFinalSupabase().catch(console.error);
