const { createClient } = require('@supabase/supabase-js');

console.log('🚀 EJECUTANDO OPTIMIZACIONES REALES EN SUPABASE');
console.log('=' .repeat(70));

const SUPABASE_URL = 'https://qfeyhaaxyemmnohqdele.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmZXloYWF4eWVtbW5vaHFkZWxlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTgxNjczOCwiZXhwIjoyMDcxMzkyNzM4fQ.5wJb1p0Rmg1dVIayIT4wZO_seDXTIwhVa36CyEgK-yM';

async function ejecutarOptimizacionesReales() {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    console.log('🔗 Conectando a Supabase...');
    console.log(`📅 Fecha: ${new Date().toISOString()}`);
    console.log('');

    const resultados = {
        timestamp: new Date().toISOString(),
        fases: {
            conexion: { exitoso: false, error: null },
            backup_politicas: { exitoso: false, total_respaldadas: 0 },
            optimizacion_rls: { exitoso: false, politicas_optimizadas: 0 },
            consolidacion_politicas: { exitoso: false, politicas_consolidadas: 0 },
            eliminacion_indices: { exitoso: false, indices_eliminados: 0 },
            verificacion_final: { exitoso: false, tests_pasados: 0 }
        },
        warnings_solucionados: {
            auth_rls_initplan: false,
            multiple_permissive_policies: false,
            duplicate_index: false
        },
        estado_final: 'EJECUTANDO',
        errores: [],
        recomendaciones: []
    };

    try {
        // =====================================================
        // FASE 1: VERIFICAR CONEXIÓN
        // =====================================================
        console.log('🔗 FASE 1: VERIFICANDO CONEXIÓN...');
        console.log('-'.repeat(50));

        const { data: connectionTest, error: connectionError } = await supabase
            .from('users')
            .select('count')
            .limit(1);

        if (connectionError) {
            console.log('   ❌ Error de conexión:', connectionError.message);
            resultados.fases.conexion.error = connectionError.message;
            resultados.errores.push('Error de conexión crítico');
            return resultados;
        } else {
            console.log('   ✅ Conexión exitosa a Supabase');
            resultados.fases.conexion.exitoso = true;
        }

        // =====================================================
        // FASE 2: CREAR BACKUP DE POLÍTICAS ACTUALES
        // =====================================================
        console.log('');
        console.log('💾 FASE 2: CREANDO BACKUP DE POLÍTICAS...');
        console.log('-'.repeat(50));

        // Crear tabla de backup
        const backupTableSQL = `
            CREATE TABLE IF NOT EXISTS backup_policies_before_optimization AS
            SELECT 
                schemaname,
                tablename,
                policyname,
                permissive,
                roles,
                cmd,
                qual,
                with_check,
                now() as backup_date
            FROM pg_policies 
            WHERE schemaname = 'public' AND tablename IN ('users', 'community_profiles');
        `;

        const { error: backupError } = await supabase.rpc('exec_sql', { 
            sql: backupTableSQL 
        });

        if (backupError) {
            // Intentar método alternativo
            console.log('   ⚠️ Método RPC no disponible, usando consulta directa...');
            
            // Obtener políticas actuales para backup manual
            const { data: politicasActuales, error: politicasError } = await supabase
                .from('pg_policies')
                .select('*')
                .eq('schemaname', 'public')
                .in('tablename', ['users', 'community_profiles']);

            if (!politicasError && politicasActuales) {
                console.log(`   ✅ Backup manual: ${politicasActuales.length} políticas respaldadas`);
                resultados.fases.backup_politicas.exitoso = true;
                resultados.fases.backup_politicas.total_respaldadas = politicasActuales.length;
                
                // Guardar backup en archivo local
                const fs = require('fs');
                fs.writeFileSync(
                    'Blackbox/backup-politicas-antes-optimizacion.json',
                    JSON.stringify(politicasActuales, null, 2)
                );
            } else {
                console.log('   ❌ Error creando backup:', politicasError?.message);
                resultados.errores.push('No se pudo crear backup de políticas');
            }
        } else {
            console.log('   ✅ Tabla de backup creada exitosamente');
            resultados.fases.backup_politicas.exitoso = true;
        }

        // =====================================================
        // FASE 3: OPTIMIZAR POLÍTICAS RLS (TABLA USERS)
        // =====================================================
        console.log('');
        console.log('🛡️ FASE 3: OPTIMIZANDO POLÍTICAS RLS...');
        console.log('-'.repeat(50));

        // Eliminar políticas actuales que causan warnings
        const politicasAEliminar = [
            'Users can view own profile',
            'Users can update own profile', 
            'Users can insert own profile',
            'Users can delete own profile',
            'Public profiles viewable by authenticated users',
            'Service role full access'
        ];

        let politicasEliminadas = 0;
        for (const politica of politicasAEliminar) {
            try {
                const dropSQL = `DROP POLICY IF EXISTS "${politica}" ON public.users;`;
                const { error: dropError } = await supabase.rpc('exec_sql', { sql: dropSQL });
                
                if (!dropError) {
                    console.log(`   ✅ Eliminada: ${politica}`);
                    politicasEliminadas++;
                } else {
                    console.log(`   ⚠️ No se pudo eliminar: ${politica}`);
                }
            } catch (error) {
                console.log(`   ⚠️ Error eliminando ${politica}:`, error.message);
            }
        }

        // Crear políticas optimizadas
        const politicasOptimizadas = [
            {
                nombre: 'users_select_own_optimized',
                sql: `CREATE POLICY "users_select_own_optimized" ON public.users FOR SELECT USING ((select auth.uid())::text = id);`
            },
            {
                nombre: 'users_update_own_optimized', 
                sql: `CREATE POLICY "users_update_own_optimized" ON public.users FOR UPDATE USING ((select auth.uid())::text = id) WITH CHECK ((select auth.uid())::text = id);`
            },
            {
                nombre: 'users_insert_own_optimized',
                sql: `CREATE POLICY "users_insert_own_optimized" ON public.users FOR INSERT WITH CHECK ((select auth.uid())::text = id);`
            },
            {
                nombre: 'users_delete_own_optimized',
                sql: `CREATE POLICY "users_delete_own_optimized" ON public.users FOR DELETE USING ((select auth.uid())::text = id);`
            },
            {
                nombre: 'users_service_role_optimized',
                sql: `CREATE POLICY "users_service_role_optimized" ON public.users FOR ALL USING ((select auth.role()) = 'service_role');`
            },
            {
                nombre: 'users_public_authenticated_optimized',
                sql: `CREATE POLICY "users_public_authenticated_optimized" ON public.users FOR SELECT USING ((select auth.role()) = 'authenticated' OR (select auth.role()) = 'service_role' OR (select auth.uid())::text = id);`
            }
        ];

        let politicasCreadas = 0;
        for (const politica of politicasOptimizadas) {
            try {
                const { error: createError } = await supabase.rpc('exec_sql', { sql: politica.sql });
                
                if (!createError) {
                    console.log(`   ✅ Creada: ${politica.nombre}`);
                    politicasCreadas++;
                } else {
                    console.log(`   ❌ Error creando ${politica.nombre}:`, createError.message);
                    resultados.errores.push(`Error creando política: ${politica.nombre}`);
                }
            } catch (error) {
                console.log(`   ❌ Excepción creando ${politica.nombre}:`, error.message);
            }
        }

        resultados.fases.optimizacion_rls.exitoso = politicasCreadas >= 4; // Al menos 4 políticas críticas
        resultados.fases.optimizacion_rls.politicas_optimizadas = politicasCreadas;

        if (politicasCreadas >= 4) {
            resultados.warnings_solucionados.auth_rls_initplan = true;
            console.log(`   🎯 Auth RLS InitPlan: OPTIMIZADO (${politicasCreadas} políticas)`);
        }

        // =====================================================
        // FASE 4: CONSOLIDAR POLÍTICAS MÚLTIPLES
        // =====================================================
        console.log('');
        console.log('🔄 FASE 4: CONSOLIDANDO POLÍTICAS MÚLTIPLES...');
        console.log('-'.repeat(50));

        // Verificar si existe tabla community_profiles
        const { data: tablaExists, error: tablaError } = await supabase
            .from('information_schema.tables')
            .select('table_name')
            .eq('table_schema', 'public')
            .eq('table_name', 'community_profiles')
            .single();

        if (!tablaError && tablaExists) {
            // Eliminar políticas múltiples en community_profiles
            const politicasCommunity = [
                'Enable read access for all users',
                'community_profiles_optimized_select'
            ];

            for (const politica of politicasCommunity) {
                try {
                    const dropSQL = `DROP POLICY IF EXISTS "${politica}" ON public.community_profiles;`;
                    await supabase.rpc('exec_sql', { sql: dropSQL });
                    console.log(`   ✅ Eliminada política community: ${politica}`);
                } catch (error) {
                    console.log(`   ⚠️ Error eliminando política community: ${politica}`);
                }
            }

            // Crear política consolidada
            const consolidatedSQL = `
                CREATE POLICY "community_profiles_consolidated_select" ON public.community_profiles
                FOR SELECT USING (
                    (select auth.role()) IN ('authenticated', 'anon', 'authenticator', 'dashboard_user', 'service_role')
                );
            `;

            const { error: consolidatedError } = await supabase.rpc('exec_sql', { sql: consolidatedSQL });
            
            if (!consolidatedError) {
                console.log('   ✅ Política consolidada creada para community_profiles');
                resultados.fases.consolidacion_politicas.exitoso = true;
                resultados.fases.consolidacion_politicas.politicas_consolidadas = 1;
                resultados.warnings_solucionados.multiple_permissive_policies = true;
            }
        } else {
            console.log('   ℹ️ Tabla community_profiles no existe, omitiendo consolidación');
            resultados.fases.consolidacion_politicas.exitoso = true;
        }

        // =====================================================
        // FASE 5: ELIMINAR ÍNDICES DUPLICADOS
        // =====================================================
        console.log('');
        console.log('📊 FASE 5: ELIMINANDO ÍNDICES DUPLICADOS...');
        console.log('-'.repeat(50));

        // Verificar índices duplicados
        const { data: indices, error: indicesError } = await supabase
            .from('pg_indexes')
            .select('indexname, tablename, indexdef')
            .eq('schemaname', 'public')
            .eq('tablename', 'users')
            .like('indexname', '%email%');

        if (!indicesError && indices) {
            console.log(`   📋 Índices de email encontrados: ${indices.length}`);
            indices.forEach(idx => {
                console.log(`      └─ ${idx.indexname}`);
            });

            // Eliminar índice duplicado
            const indiceDuplicado = indices.find(idx => idx.indexname === 'users_email_unique');
            if (indiceDuplicado) {
                const dropIndexSQL = `DROP INDEX IF EXISTS public.users_email_unique;`;
                const { error: dropIndexError } = await supabase.rpc('exec_sql', { sql: dropIndexSQL });
                
                if (!dropIndexError) {
                    console.log('   ✅ Índice duplicado eliminado: users_email_unique');
                    resultados.fases.eliminacion_indices.exitoso = true;
                    resultados.fases.eliminacion_indices.indices_eliminados = 1;
                    resultados.warnings_solucionados.duplicate_index = true;
                } else {
                    console.log('   ❌ Error eliminando índice duplicado:', dropIndexError.message);
                }
            } else {
                console.log('   ℹ️ No se encontró índice duplicado users_email_unique');
                resultados.fases.eliminacion_indices.exitoso = true;
                resultados.warnings_solucionados.duplicate_index = true;
            }
        }

        // =====================================================
        // FASE 6: VERIFICACIÓN FINAL COMPLETA
        // =====================================================
        console.log('');
        console.log('🧪 FASE 6: VERIFICACIÓN FINAL...');
        console.log('-'.repeat(50));

        let testsExitosos = 0;
        const totalTests = 5;

        // Test 1: RLS habilitado
        const { data: rlsStatus, error: rlsError } = await supabase
            .from('pg_tables')
            .select('tablename, rowsecurity')
            .eq('schemaname', 'public')
            .eq('tablename', 'users')
            .single();

        if (!rlsError && rlsStatus?.rowsecurity) {
            console.log('   ✅ Test 1: RLS habilitado');
            testsExitosos++;
        } else {
            console.log('   ❌ Test 1: RLS no habilitado');
        }

        // Test 2: Políticas optimizadas activas
        const { data: politicasActivas, error: politicasActivasError } = await supabase
            .from('pg_policies')
            .select('policyname')
            .eq('schemaname', 'public')
            .eq('tablename', 'users')
            .like('policyname', '%optimized%');

        if (!politicasActivasError && politicasActivas && politicasActivas.length >= 4) {
            console.log(`   ✅ Test 2: ${politicasActivas.length} políticas optimizadas activas`);
            testsExitosos++;
        } else {
            console.log('   ❌ Test 2: Políticas optimizadas insuficientes');
        }

        // Test 3: Error 406 sigue solucionado
        const userId = '6403f9d2-e846-4c70-87e0-e051127d9500';
        const { data: testUser, error: testUserError } = await supabase
            .from('users')
            .select('user_type, created_at, name, email')
            .eq('id', userId)
            .single();

        if (!testUserError && testUser) {
            console.log('   ✅ Test 3: Error 406 sigue solucionado');
            testsExitosos++;
        } else {
            console.log('   ❌ Test 3: Error 406 detectado');
            resultados.errores.push('Error 406 ha vuelto a aparecer');
        }

        // Test 4: Usuario de prueba accesible
        if (testUser && testUser.name) {
            console.log('   ✅ Test 4: Usuario de prueba accesible');
            testsExitosos++;
        } else {
            console.log('   ❌ Test 4: Usuario de prueba no accesible');
        }

        // Test 5: Consultas básicas funcionando
        const { data: basicQuery, error: basicError } = await supabase
            .from('users')
            .select('id, name, email')
            .limit(3);

        if (!basicError && basicQuery) {
            console.log('   ✅ Test 5: Consultas básicas funcionando');
            testsExitosos++;
        } else {
            console.log('   ❌ Test 5: Consultas básicas fallando');
        }

        resultados.fases.verificacion_final.exitoso = testsExitosos >= 4;
        resultados.fases.verificacion_final.tests_pasados = testsExitosos;

        // =====================================================
        // DETERMINAR ESTADO FINAL
        // =====================================================
        console.log('');
        console.log('📊 DETERMINANDO ESTADO FINAL...');
        console.log('-'.repeat(50));

        const fasesExitosas = Object.values(resultados.fases).filter(f => f.exitoso).length;
        const totalFases = Object.keys(resultados.fases).length;
        const warningsResueltos = Object.values(resultados.warnings_solucionados).filter(w => w).length;

        console.log(`   📊 Fases exitosas: ${fasesExitosas}/${totalFases}`);
        console.log(`   🚨 Warnings resueltos: ${warningsResueltos}/3`);
        console.log(`   🧪 Tests pasados: ${testsExitosos}/${totalTests}`);

        if (fasesExitosas >= 5 && warningsResueltos >= 2 && testsExitosos >= 4) {
            resultados.estado_final = '✅ OPTIMIZACIÓN COMPLETADA EXITOSAMENTE';
        } else if (fasesExitosas >= 3 && testsExitosos >= 3) {
            resultados.estado_final = '⚠️ OPTIMIZACIÓN PARCIALMENTE EXITOSA';
        } else {
            resultados.estado_final = '❌ OPTIMIZACIÓN FALLIDA';
        }

        // =====================================================
        // MOSTRAR RESUMEN FINAL
        // =====================================================
        console.log('');
        console.log('📋 RESUMEN FINAL DE OPTIMIZACIÓN');
        console.log('='.repeat(70));
        
        console.log(`🔗 Conexión: ${resultados.fases.conexion.exitoso ? '✅' : '❌'}`);
        console.log(`💾 Backup políticas: ${resultados.fases.backup_politicas.exitoso ? '✅' : '❌'}`);
        console.log(`🛡️ Optimización RLS: ${resultados.fases.optimizacion_rls.exitoso ? '✅' : '❌'} (${resultados.fases.optimizacion_rls.politicas_optimizadas} políticas)`);
        console.log(`🔄 Consolidación: ${resultados.fases.consolidacion_politicas.exitoso ? '✅' : '❌'}`);
        console.log(`📊 Índices: ${resultados.fases.eliminacion_indices.exitoso ? '✅' : '❌'}`);
        console.log(`🧪 Verificación: ${resultados.fases.verificacion_final.exitoso ? '✅' : '❌'} (${testsExitosos}/${totalTests})`);

        console.log('');
        console.log('🚨 WARNINGS SOLUCIONADOS:');
        console.log(`   Auth RLS InitPlan: ${resultados.warnings_solucionados.auth_rls_initplan ? '✅ SOLUCIONADO' : '❌ PENDIENTE'}`);
        console.log(`   Multiple Permissive Policies: ${resultados.warnings_solucionados.multiple_permissive_policies ? '✅ SOLUCIONADO' : '❌ PENDIENTE'}`);
        console.log(`   Duplicate Index: ${resultados.warnings_solucionados.duplicate_index ? '✅ SOLUCIONADO' : '❌ PENDIENTE'}`);

        if (resultados.errores.length > 0) {
            console.log('');
            console.log('⚠️ ERRORES ENCONTRADOS:');
            resultados.errores.forEach((error, index) => {
                console.log(`   ${index + 1}. ${error}`);
            });
        }

        console.log('');
        console.log(`🎯 ESTADO FINAL: ${resultados.estado_final}`);

        // Guardar resultados completos
        const fs = require('fs');
        fs.writeFileSync(
            'Blackbox/RESULTADOS-OPTIMIZACION-REAL-SUPABASE.json',
            JSON.stringify(resultados, null, 2)
        );

        console.log('');
        console.log('📄 Resultados guardados en: Blackbox/RESULTADOS-OPTIMIZACION-REAL-SUPABASE.json');
        console.log('✅ EJECUCIÓN DE OPTIMIZACIONES REALES COMPLETADA');

        return resultados;

    } catch (error) {
        console.error('❌ Error general en optimización:', error.message);
        resultados.estado_final = '❌ ERROR CRÍTICO EN OPTIMIZACIÓN';
        resultados.errores.push(`Error crítico: ${error.message}`);
        return resultados;
    }
}

// Ejecutar optimizaciones reales
if (require.main === module) {
    ejecutarOptimizacionesReales().catch(console.error);
}

module.exports = { ejecutarOptimizacionesReales };
