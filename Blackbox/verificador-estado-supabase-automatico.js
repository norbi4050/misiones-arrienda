const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

console.log('🔍 VERIFICADOR AUTOMÁTICO DE ESTADO SUPABASE');
console.log('=' .repeat(70));

const SUPABASE_URL = 'https://qfeyhaaxyemmnohqdele.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmZXloYWF4eWVtbW5vaHFkZWxlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTgxNjczOCwiZXhwIjoyMDcxMzkyNzM4fQ.5wJb1p0Rmg1dVIayIT4wZO_seDXTIwhVa36CyEgK-yM';

async function verificarEstadoSupabaseCompleto() {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    console.log('🔗 Conectando a Supabase...');
    console.log(`📅 Fecha: ${new Date().toISOString()}`);
    console.log('');

    const estadoCompleto = {
        timestamp: new Date().toISOString(),
        conexion: {
            exitosa: false,
            url: SUPABASE_URL,
            error: null
        },
        tablas: {
            users: {
                existe: false,
                estructura: null,
                indices: [],
                constraints: [],
                registros: 0
            }
        },
        rls: {
            users: {
                habilitado: false,
                politicas: [],
                totalPoliticas: 0
            }
        },
        funciones: {
            personalizadas: [],
            total: 0
        },
        triggers: {
            activos: [],
            total: 0
        },
        storage: {
            buckets: [],
            total: 0
        },
        usuariosPrueba: {
            principal: {
                id: '6403f9d2-e846-4c70-87e0-e051127d9500',
                existe: false,
                datos: null
            }
        },
        tests: {
            error406: false,
            consultasBasicas: false,
            actualizaciones: false
        },
        estadoGeneral: 'VERIFICANDO',
        recomendaciones: [],
        alertas: []
    };

    try {
        // 1. VERIFICAR CONEXIÓN
        console.log('🔗 VERIFICANDO CONEXIÓN...');
        console.log('-'.repeat(50));

        const { data: connectionTest, error: connectionError } = await supabase
            .from('information_schema.tables')
            .select('table_name')
            .limit(1);

        if (connectionError) {
            console.log('   ❌ Error de conexión:', connectionError.message);
            estadoCompleto.conexion.error = connectionError.message;
            estadoCompleto.estadoGeneral = 'ERROR DE CONEXIÓN';
            return estadoCompleto;
        } else {
            console.log('   ✅ Conexión exitosa');
            estadoCompleto.conexion.exitosa = true;
        }

        // 2. VERIFICAR TABLA USERS
        console.log('');
        console.log('📋 VERIFICANDO TABLA USERS...');
        console.log('-'.repeat(50));

        // Verificar existencia
        const { data: tablaUsers, error: tablaError } = await supabase
            .from('users')
            .select('count')
            .limit(1);

        if (tablaError) {
            console.log('   ❌ Tabla users NO EXISTE:', tablaError.message);
            estadoCompleto.alertas.push('CRÍTICO: Tabla users no existe');
        } else {
            console.log('   ✅ Tabla users EXISTE');
            estadoCompleto.tablas.users.existe = true;

            // Obtener estructura
            const { data: columnas, error: columnasError } = await supabase
                .from('information_schema.columns')
                .select('column_name, data_type, is_nullable, column_default')
                .eq('table_schema', 'public')
                .eq('table_name', 'users');

            if (!columnasError && columnas) {
                estadoCompleto.tablas.users.estructura = columnas;
                console.log(`   📊 Columnas encontradas: ${columnas.length}`);
            }

            // Contar registros
            const { count, error: countError } = await supabase
                .from('users')
                .select('*', { count: 'exact', head: true });

            if (!countError) {
                estadoCompleto.tablas.users.registros = count;
                console.log(`   📊 Total registros: ${count}`);
            }
        }

        // 3. VERIFICAR RLS Y POLÍTICAS
        console.log('');
        console.log('🔒 VERIFICANDO RLS Y POLÍTICAS...');
        console.log('-'.repeat(50));

        // Verificar RLS habilitado
        const { data: rlsStatus, error: rlsError } = await supabase
            .from('pg_tables')
            .select('rowsecurity')
            .eq('schemaname', 'public')
            .eq('tablename', 'users')
            .single();

        if (!rlsError && rlsStatus) {
            estadoCompleto.rls.users.habilitado = rlsStatus.rowsecurity;
            console.log(`   ${rlsStatus.rowsecurity ? '✅' : '❌'} RLS: ${rlsStatus.rowsecurity ? 'HABILITADO' : 'DESHABILITADO'}`);
            
            if (!rlsStatus.rowsecurity) {
                estadoCompleto.alertas.push('ADVERTENCIA: RLS no habilitado en tabla users');
            }
        }

        // Verificar políticas
        const { data: politicas, error: politicasError } = await supabase
            .from('pg_policies')
            .select('policyname, cmd, roles, qual, with_check')
            .eq('schemaname', 'public')
            .eq('tablename', 'users');

        if (!politicasError && politicas) {
            estadoCompleto.rls.users.politicas = politicas;
            estadoCompleto.rls.users.totalPoliticas = politicas.length;
            console.log(`   📊 Políticas encontradas: ${politicas.length}`);
            
            const politicasEsperadas = [
                'Users can view own profile',
                'Users can update own profile',
                'Users can insert own profile',
                'Service role full access'
            ];

            const politicasFaltantes = politicasEsperadas.filter(
                esperada => !politicas.some(p => p.policyname === esperada)
            );

            if (politicasFaltantes.length > 0) {
                estadoCompleto.alertas.push(`Políticas faltantes: ${politicasFaltantes.join(', ')}`);
            }
        }

        // 4. VERIFICAR FUNCIONES PERSONALIZADAS
        console.log('');
        console.log('⚙️ VERIFICANDO FUNCIONES PERSONALIZADAS...');
        console.log('-'.repeat(50));

        const { data: funciones, error: funcionesError } = await supabase
            .from('information_schema.routines')
            .select('routine_name, routine_type')
            .eq('routine_schema', 'public');

        if (!funcionesError && funciones) {
            estadoCompleto.funciones.personalizadas = funciones;
            estadoCompleto.funciones.total = funciones.length;
            console.log(`   📊 Funciones encontradas: ${funciones.length}`);

            const tieneHandleUpdatedAt = funciones.some(f => f.routine_name === 'handle_updated_at');
            if (!tieneHandleUpdatedAt) {
                estadoCompleto.recomendaciones.push('Crear función handle_updated_at para timestamps automáticos');
            }
        }

        // 5. VERIFICAR TRIGGERS
        console.log('');
        console.log('🔄 VERIFICANDO TRIGGERS...');
        console.log('-'.repeat(50));

        const { data: triggers, error: triggersError } = await supabase
            .from('information_schema.triggers')
            .select('trigger_name, event_object_table, action_timing, event_manipulation')
            .eq('trigger_schema', 'public');

        if (!triggersError && triggers) {
            estadoCompleto.triggers.activos = triggers;
            estadoCompleto.triggers.total = triggers.length;
            console.log(`   📊 Triggers encontrados: ${triggers.length}`);
        }

        // 6. VERIFICAR STORAGE
        console.log('');
        console.log('📁 VERIFICANDO STORAGE...');
        console.log('-'.repeat(50));

        const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();

        if (!bucketsError && buckets) {
            estadoCompleto.storage.buckets = buckets;
            estadoCompleto.storage.total = buckets.length;
            console.log(`   📊 Buckets encontrados: ${buckets.length}`);

            const bucketsEsperados = ['avatars', 'property-images', 'documents'];
            const bucketsFaltantes = bucketsEsperados.filter(
                esperado => !buckets.some(b => b.name === esperado)
            );

            if (bucketsFaltantes.length > 0) {
                estadoCompleto.recomendaciones.push(`Crear buckets: ${bucketsFaltantes.join(', ')}`);
            }
        }

        // 7. VERIFICAR USUARIO DE PRUEBA
        console.log('');
        console.log('👤 VERIFICANDO USUARIO DE PRUEBA...');
        console.log('-'.repeat(50));

        const userId = estadoCompleto.usuariosPrueba.principal.id;
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .single();

        if (userError) {
            console.log('   ❌ Usuario de prueba NO EXISTE');
            estadoCompleto.alertas.push('Usuario de prueba faltante - Requerido para testing');
        } else {
            console.log('   ✅ Usuario de prueba EXISTE');
            estadoCompleto.usuariosPrueba.principal.existe = true;
            estadoCompleto.usuariosPrueba.principal.datos = userData;
        }

        // 8. EJECUTAR TESTS CRÍTICOS
        console.log('');
        console.log('🧪 EJECUTANDO TESTS CRÍTICOS...');
        console.log('-'.repeat(50));

        // Test Error 406 original
        try {
            const { data: test406, error: error406 } = await supabase
                .from('users')
                .select('user_type,created_at')
                .eq('id', userId)
                .single();

            if (error406) {
                console.log('   ❌ Test Error 406: FALLA');
                estadoCompleto.alertas.push('CRÍTICO: Error 406 persiste');
            } else {
                console.log('   ✅ Test Error 406: EXITOSO');
                estadoCompleto.tests.error406 = true;
            }
        } catch (error) {
            console.log('   ❌ Test Error 406: ERROR');
        }

        // Test consultas básicas
        try {
            const { data: testBasico, error: errorBasico } = await supabase
                .from('users')
                .select('id,name,email')
                .limit(1);

            if (errorBasico) {
                console.log('   ❌ Test Consultas Básicas: FALLA');
            } else {
                console.log('   ✅ Test Consultas Básicas: EXITOSO');
                estadoCompleto.tests.consultasBasicas = true;
            }
        } catch (error) {
            console.log('   ❌ Test Consultas Básicas: ERROR');
        }

        // 9. DETERMINAR ESTADO GENERAL
        console.log('');
        console.log('📊 DETERMINANDO ESTADO GENERAL...');
        console.log('-'.repeat(50));

        let puntuacion = 0;
        const puntuacionMaxima = 100;

        // Puntuación por componentes
        if (estadoCompleto.conexion.exitosa) puntuacion += 10;
        if (estadoCompleto.tablas.users.existe) puntuacion += 20;
        if (estadoCompleto.rls.users.habilitado) puntuacion += 15;
        if (estadoCompleto.rls.users.totalPoliticas >= 4) puntuacion += 20;
        if (estadoCompleto.usuariosPrueba.principal.existe) puntuacion += 10;
        if (estadoCompleto.tests.error406) puntuacion += 15;
        if (estadoCompleto.tests.consultasBasicas) puntuacion += 10;

        const porcentaje = (puntuacion / puntuacionMaxima) * 100;

        if (porcentaje >= 90) {
            estadoCompleto.estadoGeneral = '✅ EXCELENTE - COMPLETAMENTE FUNCIONAL';
        } else if (porcentaje >= 75) {
            estadoCompleto.estadoGeneral = '✅ BUENO - MAYORMENTE FUNCIONAL';
        } else if (porcentaje >= 50) {
            estadoCompleto.estadoGeneral = '⚠️ REGULAR - REQUIERE ATENCIÓN';
        } else {
            estadoCompleto.estadoGeneral = '❌ CRÍTICO - REQUIERE REPARACIÓN INMEDIATA';
        }

        console.log(`   📊 Puntuación: ${puntuacion}/${puntuacionMaxima} (${porcentaje.toFixed(1)}%)`);
        console.log(`   🎯 Estado: ${estadoCompleto.estadoGeneral}`);

        // 10. GENERAR RECOMENDACIONES
        if (estadoCompleto.alertas.length === 0 && estadoCompleto.recomendaciones.length === 0) {
            estadoCompleto.recomendaciones.push('✅ Sistema completamente optimizado - No se requieren acciones');
        }

        // MOSTRAR RESUMEN FINAL
        console.log('');
        console.log('📋 RESUMEN FINAL');
        console.log('='.repeat(70));
        
        console.log(`🔗 Conexión: ${estadoCompleto.conexion.exitosa ? '✅' : '❌'}`);
        console.log(`📋 Tabla users: ${estadoCompleto.tablas.users.existe ? '✅' : '❌'}`);
        console.log(`🔒 RLS habilitado: ${estadoCompleto.rls.users.habilitado ? '✅' : '❌'}`);
        console.log(`📊 Políticas: ${estadoCompleto.rls.users.totalPoliticas}`);
        console.log(`👤 Usuario prueba: ${estadoCompleto.usuariosPrueba.principal.existe ? '✅' : '❌'}`);
        console.log(`🧪 Error 406: ${estadoCompleto.tests.error406 ? '✅ SOLUCIONADO' : '❌ PERSISTE'}`);

        if (estadoCompleto.alertas.length > 0) {
            console.log('');
            console.log('🚨 ALERTAS CRÍTICAS:');
            estadoCompleto.alertas.forEach((alerta, index) => {
                console.log(`   ${index + 1}. ${alerta}`);
            });
        }

        if (estadoCompleto.recomendaciones.length > 0) {
            console.log('');
            console.log('💡 RECOMENDACIONES:');
            estadoCompleto.recomendaciones.forEach((rec, index) => {
                console.log(`   ${index + 1}. ${rec}`);
            });
        }

        // Guardar estado completo
        fs.writeFileSync(
            'ESTADO-ACTUAL-SUPABASE.json',
            JSON.stringify(estadoCompleto, null, 2)
        );

        console.log('');
        console.log('📄 Estado completo guardado en: ESTADO-ACTUAL-SUPABASE.json');
        console.log('✅ VERIFICACIÓN AUTOMÁTICA COMPLETADA');

        return estadoCompleto;

    } catch (error) {
        console.error('❌ Error general en verificación:', error.message);
        estadoCompleto.estadoGeneral = '❌ ERROR EN VERIFICACIÓN';
        estadoCompleto.conexion.error = error.message;
        return estadoCompleto;
    }
}

// Función para uso en otros scripts
function obtenerEstadoActual() {
    return verificarEstadoSupabaseCompleto();
}

// Ejecutar si se llama directamente
if (require.main === module) {
    verificarEstadoSupabaseCompleto().catch(console.error);
}

module.exports = { obtenerEstadoActual, verificarEstadoSupabaseCompleto };
