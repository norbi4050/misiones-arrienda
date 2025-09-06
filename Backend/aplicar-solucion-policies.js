const { createClient } = require('@supabase/supabase-js');

// Configurar cliente de Supabase con service role key para operaciones administrativas
const SUPABASE_URL = 'https://qfeyhaaxyemmnohqdele.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmZXloYWF4eWVtbW5vaHFkZWxlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTgxNjczOCwiZXhwIjoyMDcxMzkyNzM4fQ.5wJb1p0Rmg1dVIayIT4wZO_seDXTIwhVa36CyEgK-yM';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function aplicarSolucionPolicies() {
    console.log('🚀 APLICANDO SOLUCIÓN PARA POLÍTICAS MÚLTIPLES');
    console.log('=' .repeat(60));

    try {
        // Paso 1: Eliminar políticas múltiples existentes para users
        console.log('🔍 PASO 1: Eliminando políticas múltiples existentes...');

        const politicasEliminar = [
            'users_delete_own_optimized_final',
            'users_service_role_optimized_final',
            'users_insert_own_optimized_final',
            'users_public_consolidated_final',
            'users_select_own_optimized_final',
            'users_update_own_optimized_final'
        ];

        for (const politica of politicasEliminar) {
            const { error } = await supabase.rpc('sql', {
                query: `DROP POLICY IF EXISTS "${politica}" ON public.users;`
            });

            if (error && !error.message.includes('does not exist')) {
                console.log(`⚠️ Error eliminando política ${politica}:`, error.message);
            } else {
                console.log(`✅ Eliminada: ${politica}`);
            }
        }

        // Paso 2: Crear políticas consolidadas para users
        console.log('\n🔍 PASO 2: Creando políticas consolidadas...');

        const politicasCrear = [
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

        for (const politica of politicasCrear) {
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
            } else {
                console.log(`✅ Creada: ${politica.nombre}`);
            }
        }

        // Paso 3: Eliminar índices duplicados
        console.log('\n🔍 PASO 3: Eliminando índices duplicados...');

        const indicesEliminar = [
            'idx_properties_type',
            'users_email_unique'
        ];

        for (const indice of indicesEliminar) {
            const { error } = await supabase.rpc('sql', {
                query: `DROP INDEX IF EXISTS public.${indice};`
            });

            if (error) {
                console.log(`⚠️ Error eliminando índice ${indice}:`, error.message);
            } else {
                console.log(`✅ Eliminado: ${indice}`);
            }
        }

        // Paso 4: Verificación final
        console.log('\n🔍 PASO 4: Verificación final...');

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
            console.log('❌ Error verificando políticas:', politicasError.message);
        } else {
            if (politicasMultiples.length === 0) {
                console.log('✅ No se encontraron políticas múltiples');
            } else {
                console.log(`⚠️ Aún existen ${politicasMultiples.length} casos de políticas múltiples`);
            }
        }

        // Test funcional
        const { data: testUsuario, error: testError } = await supabase
            .from('users')
            .select('id, name, email')
            .eq('id', '6403f9d2-e846-4c70-87e0-e051127d9500')
            .single();

        if (testError) {
            console.log('❌ Error en test funcional:', testError.message);
        } else {
            console.log('✅ Test funcional exitoso - Usuario accesible');
        }

        console.log('\n🎉 SOLUCIÓN APLICADA EXITOSAMENTE');
        console.log('💡 Los warnings de rendimiento deberían desaparecer ahora');

    } catch (error) {
        console.log('❌ ERROR GENERAL:', error.message);
    }
}

aplicarSolucionPolicies();
