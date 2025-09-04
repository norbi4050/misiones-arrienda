const { createClient } = require('@supabase/supabase-js');

// ============================================================================
// 🔍 AUDITORÍA COMPLETA DE POLÍTICAS RLS EN SUPABASE
// ============================================================================
// 
// Este script hace una auditoría exhaustiva de todas las políticas RLS
// existentes en Supabase para identificar exactamente qué falta o está mal
//
// Fecha: 2025-01-04
// Estado: DIAGNÓSTICO COMPLETO
// ============================================================================

const SUPABASE_URL = 'https://qfeyhaaxyemmnohqdele.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmZXloYWF4eWVtbW5vaHFkZWxlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNTkzNzI2NCwiZXhwIjoyMDUxNTEzMjY0fQ.Ej8JcZzOaOlL8yGpyOaOlL8yGpyOaOlL8yGpyOaOlL8';

async function auditoriaPoliciesCompleta() {
    console.log('🔍 INICIANDO AUDITORÍA COMPLETA DE POLÍTICAS RLS');
    console.log('='.repeat(60));
    console.log(`⏰ Timestamp: ${new Date().toISOString()}`);
    console.log(`🔗 Supabase URL: ${SUPABASE_URL}`);
    console.log('='.repeat(60));
    console.log('');

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    try {
        // ====================================================================
        // 🔍 PASO 1: VERIFICAR CONEXIÓN
        // ====================================================================
        console.log('🔍 PASO 1: VERIFICACIÓN DE CONEXIÓN');
        console.log('='.repeat(40));
        
        const { data: connectionTest, error: connectionError } = await supabase
            .from('auth.users')
            .select('count')
            .limit(1);

        if (connectionError) {
            console.log('❌ Error de conexión:', connectionError.message);
            return;
        }
        console.log('✅ Conexión exitosa con Supabase');
        console.log('');

        // ====================================================================
        // 🔍 PASO 2: LISTAR TODAS LAS TABLAS
        // ====================================================================
        console.log('🔍 PASO 2: LISTADO DE TODAS LAS TABLAS');
        console.log('='.repeat(40));

        const { data: tablas, error: tablasError } = await supabase.rpc('sql', {
            query: `
                SELECT 
                    schemaname,
                    tablename,
                    rowsecurity as rls_enabled
                FROM pg_tables 
                WHERE schemaname IN ('public', 'auth')
                ORDER BY schemaname, tablename;
            `
        });

        if (tablasError) {
            console.log('❌ Error obteniendo tablas:', tablasError.message);
        } else {
            console.log('📋 TABLAS ENCONTRADAS:');
            tablas.forEach(tabla => {
                const rlsStatus = tabla.rls_enabled ? '🔒 RLS ON' : '🔓 RLS OFF';
                console.log(`   ${tabla.schemaname}.${tabla.tablename} - ${rlsStatus}`);
            });
        }
        console.log('');

        // ====================================================================
        // 🔍 PASO 3: LISTAR TODAS LAS POLÍTICAS EXISTENTES
        // ====================================================================
        console.log('🔍 PASO 3: AUDITORÍA DE POLÍTICAS EXISTENTES');
        console.log('='.repeat(40));

        const { data: policies, error: policiesError } = await supabase.rpc('sql', {
            query: `
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
                WHERE schemaname IN ('public', 'auth')
                ORDER BY schemaname, tablename, policyname;
            `
        });

        if (policiesError) {
            console.log('❌ Error obteniendo políticas:', policiesError.message);
        } else {
            console.log('🛡️ POLÍTICAS EXISTENTES:');
            if (policies.length === 0) {
                console.log('   ⚠️ NO SE ENCONTRARON POLÍTICAS RLS');
            } else {
                policies.forEach(policy => {
                    console.log(`   📋 ${policy.schemaname}.${policy.tablename}`);
                    console.log(`      └─ Política: ${policy.policyname}`);
                    console.log(`      └─ Comando: ${policy.cmd}`);
                    console.log(`      └─ Roles: ${policy.roles}`);
                    console.log(`      └─ Condición: ${policy.qual || 'N/A'}`);
                    console.log('');
                });
            }
        }

        // ====================================================================
        // 🔍 PASO 4: VERIFICAR TABLAS CRÍTICAS ESPECÍFICAS
        // ====================================================================
        console.log('🔍 PASO 4: VERIFICACIÓN DE TABLAS CRÍTICAS');
        console.log('='.repeat(40));

        const tablasCriticas = ['users', 'profiles', 'properties'];
        
        for (const tabla of tablasCriticas) {
            console.log(`🔍 Verificando tabla: ${tabla}`);
            
            // Verificar si la tabla existe
            const { data: existeTabla, error: existeError } = await supabase.rpc('sql', {
                query: `
                    SELECT EXISTS (
                        SELECT 1 FROM information_schema.tables 
                        WHERE table_schema = 'public' AND table_name = '${tabla}'
                    ) as existe;
                `
            });

            if (existeError) {
                console.log(`   ❌ Error verificando ${tabla}:`, existeError.message);
                continue;
            }

            if (!existeTabla[0].existe) {
                console.log(`   ❌ Tabla ${tabla} NO EXISTE`);
                continue;
            }

            console.log(`   ✅ Tabla ${tabla} existe`);

            // Verificar RLS
            const { data: rlsStatus, error: rlsError } = await supabase.rpc('sql', {
                query: `
                    SELECT rowsecurity as rls_enabled
                    FROM pg_tables 
                    WHERE schemaname = 'public' AND tablename = '${tabla}';
                `
            });

            if (rlsError) {
                console.log(`   ❌ Error verificando RLS para ${tabla}:`, rlsError.message);
            } else {
                const rls = rlsStatus[0]?.rls_enabled;
                console.log(`   ${rls ? '🔒' : '🔓'} RLS: ${rls ? 'HABILITADO' : 'DESHABILITADO'}`);
            }

            // Verificar políticas específicas para esta tabla
            const { data: tablaPolicies, error: tablaPoliciesError } = await supabase.rpc('sql', {
                query: `
                    SELECT policyname, cmd, roles
                    FROM pg_policies 
                    WHERE schemaname = 'public' AND tablename = '${tabla}'
                    ORDER BY policyname;
                `
            });

            if (tablaPoliciesError) {
                console.log(`   ❌ Error obteniendo políticas para ${tabla}:`, tablaPoliciesError.message);
            } else {
                if (tablaPolicies.length === 0) {
                    console.log(`   ⚠️ NO HAY POLÍTICAS para ${tabla}`);
                } else {
                    console.log(`   📋 Políticas encontradas (${tablaPolicies.length}):`);
                    tablaPolicies.forEach(policy => {
                        console.log(`      └─ ${policy.policyname} (${policy.cmd}) - Roles: ${policy.roles}`);
                    });
                }
            }

            // Probar acceso directo
            try {
                const { data: testData, error: testError } = await supabase
                    .from(tabla)
                    .select('*')
                    .limit(1);

                if (testError) {
                    console.log(`   ❌ Error de acceso: ${testError.message}`);
                } else {
                    console.log(`   ✅ Acceso de lectura: OK`);
                }
            } catch (error) {
                console.log(`   ❌ Error probando acceso: ${error.message}`);
            }

            console.log('');
        }

        // ====================================================================
        // 🔍 PASO 5: VERIFICAR FUNCIONES Y TRIGGERS
        // ====================================================================
        console.log('🔍 PASO 5: VERIFICACIÓN DE FUNCIONES Y TRIGGERS');
        console.log('='.repeat(40));

        const { data: functions, error: functionsError } = await supabase.rpc('sql', {
            query: `
                SELECT 
                    routine_name,
                    routine_type,
                    security_type
                FROM information_schema.routines 
                WHERE routine_schema = 'public'
                AND routine_name LIKE '%user%' OR routine_name LIKE '%profile%'
                ORDER BY routine_name;
            `
        });

        if (functionsError) {
            console.log('❌ Error obteniendo funciones:', functionsError.message);
        } else {
            console.log('⚙️ FUNCIONES RELACIONADAS:');
            if (functions.length === 0) {
                console.log('   ⚠️ NO SE ENCONTRARON FUNCIONES RELACIONADAS');
            } else {
                functions.forEach(func => {
                    console.log(`   📋 ${func.routine_name} (${func.routine_type}) - Security: ${func.security_type}`);
                });
            }
        }

        const { data: triggers, error: triggersError } = await supabase.rpc('sql', {
            query: `
                SELECT 
                    trigger_name,
                    event_object_table,
                    action_timing,
                    event_manipulation
                FROM information_schema.triggers 
                WHERE trigger_schema = 'public'
                ORDER BY event_object_table, trigger_name;
            `
        });

        if (triggersError) {
            console.log('❌ Error obteniendo triggers:', triggersError.message);
        } else {
            console.log('🔄 TRIGGERS ENCONTRADOS:');
            if (triggers.length === 0) {
                console.log('   ⚠️ NO SE ENCONTRARON TRIGGERS');
            } else {
                triggers.forEach(trigger => {
                    console.log(`   📋 ${trigger.trigger_name} en ${trigger.event_object_table}`);
                    console.log(`      └─ ${trigger.action_timing} ${trigger.event_manipulation}`);
                });
            }
        }

        // ====================================================================
        // 📊 PASO 6: RESUMEN Y RECOMENDACIONES
        // ====================================================================
        console.log('');
        console.log('📊 RESUMEN DE AUDITORÍA');
        console.log('='.repeat(40));

        const problemasEncontrados = [];
        const solucionesRecomendadas = [];

        // Analizar resultados
        if (policies.length === 0) {
            problemasEncontrados.push('❌ NO HAY POLÍTICAS RLS CONFIGURADAS');
            solucionesRecomendadas.push('🔧 Crear políticas RLS para todas las tablas críticas');
        }

        // Verificar tablas específicas
        for (const tabla of tablasCriticas) {
            const tablaPolicies = policies.filter(p => p.tablename === tabla);
            if (tablaPolicies.length === 0) {
                problemasEncontrados.push(`❌ Tabla ${tabla} sin políticas RLS`);
                solucionesRecomendadas.push(`🔧 Crear políticas para tabla ${tabla}`);
            }
        }

        console.log('🚨 PROBLEMAS ENCONTRADOS:');
        if (problemasEncontrados.length === 0) {
            console.log('   ✅ No se encontraron problemas críticos');
        } else {
            problemasEncontrados.forEach(problema => {
                console.log(`   ${problema}`);
            });
        }

        console.log('');
        console.log('💡 SOLUCIONES RECOMENDADAS:');
        if (solucionesRecomendadas.length === 0) {
            console.log('   ✅ No se requieren acciones adicionales');
        } else {
            solucionesRecomendadas.forEach(solucion => {
                console.log(`   ${solucion}`);
            });
        }

        console.log('');
        console.log('✅ AUDITORÍA COMPLETA FINALIZADA');

    } catch (error) {
        console.error('❌ Error durante la auditoría:', error.message);
    }
}

// Ejecutar auditoría
auditoriaPoliciesCompleta().catch(console.error);
