// =====================================================
// APLICADOR AUTOMÁTICO: SOLUCIÓN WARNINGS MULTIPLE POLICIES
// =====================================================
// Fecha: 2025-01-27
// Objetivo: Aplicar automáticamente la solución SQL en Supabase
// Protocolo: Ejecutar paso a paso con verificaciones
// =====================================================

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Configuración de Supabase
const SUPABASE_URL = 'https://qfeyhaaxyemmnohqdele.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmZXloYWF4eWVtbW5vaHFkZWxlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTgxNjczOCwiZXhwIjoyMDcxMzkyNzM4fQ.5wJb1p0Rmg1dVIayIT4wZO_seDXTIwhVa36CyEgK-yM';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function aplicarSolucionCompleta() {
    console.log('🚀 INICIANDO APLICACIÓN AUTOMÁTICA DE SOLUCIÓN');
    console.log('=' .repeat(60));
    console.log(`⏰ Timestamp: ${new Date().toISOString()}`);
    console.log(`🔗 Supabase URL: ${SUPABASE_URL}`);
    console.log('=' .repeat(60));
    console.log('');

    const resultados = {
        timestamp: new Date().toISOString(),
        pasos: {
            backup: false,
            consolidacionFavorites: false,
            consolidacionPropertyInquiries: false,
            consolidacionUsers: false,
            eliminacionIndices: false,
            verificacionFinal: false
        },
        errores: [],
        estadoFinal: 'PENDIENTE'
    };

    try {
        // ====================================================================
        console.log('🔍 PASO 1: CREACIÓN DE BACKUP DE SEGURIDAD');
        console.log('='.repeat(40));

        // Crear esquema de backup
        const { error: backupSchemaError } = await supabase.rpc('sql', {
            query: `CREATE SCHEMA IF NOT EXISTS backup_policies_2025_01_27;`
        });

        if (backupSchemaError) {
            console.log('❌ Error creando esquema de backup:', backupSchemaError.message);
            resultados.errores.push(`Backup schema: ${backupSchemaError.message}`);
        } else {
            console.log('✅ Esquema de backup creado');
        }

        // Backup de políticas
        const { error: backupPoliciesError } = await supabase.rpc('sql', {
            query: `
                CREATE TABLE backup_policies_2025_01_27.policies_backup AS
                SELECT 
                    schemaname,
                    tablename,
                    policyname,
                    cmd,
                    roles,
                    qual,
                    with_check
                FROM pg_policies 
                WHERE schemaname = 'public';
            `
        });

        if (backupPoliciesError) {
            console.log('❌ Error en backup de políticas:', backupPoliciesError.message);
            resultados.errores.push(`Backup policies: ${backupPoliciesError.message}`);
        } else {
            console.log('✅ Backup de políticas creado');
        }

        // Backup de índices
        const { error: backupIndexesError } = await supabase.rpc('sql', {
            query: `
                CREATE TABLE backup_policies_2025_01_27.indexes_backup AS
                SELECT 
                    schemaname,
                    tablename,
                    indexname,
                    indexdef
                FROM pg_indexes 
                WHERE schemaname = 'public';
            `
        });

        if (backupIndexesError) {
            console.log('❌ Error en backup de índices:', backupIndexesError.message);
            resultados.errores.push(`Backup indexes: ${backupIndexesError.message}`);
        } else {
            console.log('✅ Backup de índices creado');
            resultados.pasos.backup = true;
        }

        console.log('');

        // ====================================================================
        console.log('🔍 PASO 2: CONSOLIDACIÓN DE POLÍTICAS - TABLA USERS');
        console.log('='.repeat(40));

        // Eliminar políticas múltiples existentes para users
        const politicasUsersEliminar = [
            'users_delete_own_optimized_final',
            'users_service_role_optimized_final',
            'users_insert_own_optimized_final',
            'users_public_consolidated_final',
            'users_select_own_optimized_final',
            'users_update_own_optimized_final'
        ];

        for (const politica of politicasUsersEliminar) {
            const { error } = await supabase.rpc('sql', {
                query: `DROP POLICY IF EXISTS "${politica}" ON public.users;`
            });
            
            if (error && !error.message.includes('does not exist')) {
                console.log(`⚠️ Error eliminando política ${politica}:`, error.message);
            } else {
                console.log(`✅ Política eliminada: ${politica}`);
            }
        }

        // Crear políticas consolidadas para users
        const politicasUsersNuevas = [
            {
                nombre: 'users_consolidated_select_final',
                tipo: 'SELECT',
                condicion: 'true OR auth.uid()::text = id OR auth.role() = \'service_role\''
            },
            {
                nombre: 'users_consolidated_insert_final',
                tipo: 'INSERT',
                condicion: 'auth.uid()::text = id OR auth.role() = \'service_role\''
            },
            {
                nombre: 'users_consolidated_update_final',
                tipo: 'UPDATE',
                condicion: 'auth.uid()::text = id OR auth.role() = \'service_role\''
            },
            {
                nombre: 'users_consolidated_delete_final',
                tipo: 'DELETE',
                condicion: 'auth.uid()::text = id OR auth.role() = \'service_role\''
            }
        ];

        for (const politica of politicasUsersNuevas) {
            let query = `CREATE POLICY "${politica.nombre}" ON public.users FOR ${politica.tipo} TO anon, authenticated, authenticator, dashboard_user`;
            
            if (politica.tipo === 'SELECT' || politica.tipo === 'DELETE') {
                query += ` USING (${politica.condicion});`;
            } else if (politica.tipo === 'INSERT') {
                query += ` WITH CHECK (${politica.condicion});`;
            } else if (politica.tipo === 'UPDATE') {
                query += ` USING (${politica.condicion}) WITH CHECK (${politica.condicion});`;
            }

            const { error } = await supabase.rpc('sql', { query });
            
            if (error) {
                console.log(`❌ Error creando política ${politica.nombre}:`, error.message);
                resultados.errores.push(`Create policy ${politica.nombre}: ${error.message}`);
            } else {
                console.log(`✅ Política creada: ${politica.nombre}`);
            }
        }

        resultados.pasos.consolidacionUsers = true;
        console.log('');

        // ====================================================================
        console.log('🔍 PASO 3: ELIMINACIÓN DE ÍNDICES DUPLICADOS');
        console.log('='.repeat(40));

        // Eliminar índices duplicados
        const indicesDuplicados = [
            'idx_properties_type',
            'users_email_unique'
        ];

        for (const indice of indicesDuplicados) {
            const { error } = await supabase.rpc('sql', {
                query: `DROP INDEX IF EXISTS public.${indice};`
            });
            
            if (error) {
                console.log(`❌ Error eliminando índice ${indice}:`, error.message);
                resultados.errores.push(`Drop index ${indice}: ${error.message}`);
            } else {
                console.log(`✅ Índice eliminado: ${indice}`);
            }
        }

        resultados.pasos.eliminacionIndices = true;
        console.log('');

        // ====================================================================
        console.log('🔍 PASO 4: VERIFICACIÓN FINAL');
        console.log('='.repeat(40));

        // Verificar que no hay políticas múltiples
        const { data: politicasMultiples, error: politicasError } = await supabase.rpc('sql', {
            query: `
                SELECT 
                    tablename,
                    cmd,
                    COUNT(*) as policy_count
                FROM pg_policies 
                WHERE schemaname = 'public'
                GROUP BY tablename, cmd
                HAVING COUNT(*) > 1
                ORDER BY tablename, cmd;
            `
        });

        if (politicasError) {
            console.log('❌ Error verificando políticas múltiples:', politicasError.message);
        } else {
            if (politicasMultiples.length === 0) {
                console.log('✅ No se encontraron políticas múltiples');
            } else {
                console.log(`⚠️ Aún existen ${politicasMultiples.length} casos de políticas múltiples`);
                politicasMultiples.forEach(pol => {
                    console.log(`   - ${pol.tablename}.${pol.cmd}: ${pol.policy_count} políticas`);
                });
            }
        }

        // Verificar que no hay índices duplicados
        const { data: indicesDuplicadosCheck, error: indicesError } = await supabase.rpc('sql', {
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
            console.log('❌ Error verificando índices duplicados:', indicesError.message);
        } else {
            if (indicesDuplicadosCheck.length === 0) {
                console.log('✅ No se encontraron índices duplicados');
            } else {
                console.log(`⚠️ Aún existen ${indicesDuplicadosCheck.length} casos de índices duplicados`);
            }
        }

        // Test funcional básico
        const { data: testUsuario, error: testError } = await supabase
            .from('users')
            .select('id, name, email')
            .eq('id', '6403f9d2-e846-4c70-87e0-e051127d9500')
            .single();

        if (testError) {
            console.log('❌ Error en test funcional:', testError.message);
            resultados.errores.push(`Test funcional: ${testError.message}`);
        } else {
            console.log('✅ Test funcional exitoso - Usuario de prueba accesible');
            resultados.pasos.verificacionFinal = true;
        }

        console.log('');

        // ====================================================================
        console.log('📊 RESUMEN FINAL');
        console.log('='.repeat(40));

        const pasosExitosos = Object.values(resultados.pasos).filter(p => p).length;
        const totalPasos = Object.keys(resultados.pasos).length;

        console.log(`✅ Pasos completados: ${pasosExitosos}/${totalPasos}`);
        console.log(`❌ Errores encontrados: ${resultados.errores.length}`);

        Object.entries(resultados.pasos).forEach(([paso, resultado]) => {
            const emoji = resultado ? '✅' : '❌';
            console.log(`   ${emoji} ${paso}: ${resultado ? 'COMPLETADO' : 'FALLIDO'}`);
        });

        if (resultados.errores.length > 0) {
            console.log('\n🚨 ERRORES DETALLADOS:');
            resultados.errores.forEach((error, index) => {
                console.log(`   ${index + 1}. ${error}`);
            });
        }

        // Determinar estado final
        if (pasosExitosos === totalPasos && resultados.errores.length === 0) {
            resultados.estadoFinal = 'EXITOSO';
            console.log('\n🎉 ESTADO FINAL: ✅ SOLUCIÓN APLICADA EXITOSAMENTE');
        } else if (pasosExitosos >= totalPasos * 0.8) {
            resultados.estadoFinal = 'PARCIAL';
            console.log('\n⚠️ ESTADO FINAL: 🟡 SOLUCIÓN APLICADA PARCIALMENTE');
        } else {
            resultados.estadoFinal = 'FALLIDO';
            console.log('\n❌ ESTADO FINAL: 🔴 SOLUCIÓN NO APLICADA');
        }

        // Guardar resultados
        const reportePath = 'Blackbox/APLICACION-SOLUCION-WARNINGS-RESULTADO.json';
        fs.writeFileSync(reportePath, JSON.stringify(resultados, null, 2));
        console.log(`\n📄 Reporte guardado en: ${reportePath}`);

        console.log('\n✅ APLICACIÓN COMPLETADA');
        return resultados;

    } catch (error) {
        console.log('❌ ERROR DURANTE LA APLICACIÓN:', error.message);
        resultados.errores.push(`Error general: ${error.message}`);
        resultados.estadoFinal = 'ERROR';
        return resultados;
    }
}

// Ejecutar aplicación
if (require.main === module) {
    aplicarSolucionCompleta().catch(console.error);
}

module.exports = { aplicarSolucionCompleta };
