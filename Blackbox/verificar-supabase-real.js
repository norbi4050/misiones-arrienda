const { createClient } = require('@supabase/supabase-js');

console.log('🔍 VERIFICACIÓN DIRECTA DE SUPABASE - ESTRUCTURA REAL');
console.log('=' .repeat(70));
console.log('Fecha:', new Date().toISOString());
console.log('');

// Credenciales de Supabase
const SUPABASE_URL = 'https://qfeyhaaxyemmnohqdele.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmZXloYWF4eWVtbW5vaHFkZWxlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTgxNjczOCwiZXhwIjoyMDcxMzkyNzM4fQ.5wJb1p0Rmg1dVIayIT4wZO_seDXTIwhVa36CyEgK-yM';

async function verificarSupabaseReal() {
    try {
        console.log('🔗 CONECTANDO A SUPABASE...');
        console.log('URL:', SUPABASE_URL);
        console.log('');

        // Crear cliente con service role key (máximos permisos)
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

        console.log('✅ Cliente Supabase creado exitosamente');
        console.log('');

        // PASO 1: Verificar conexión básica
        console.log('🔍 PASO 1: VERIFICANDO CONEXIÓN...');
        try {
            const { data: connectionTest, error: connectionError } = await supabase
                .from('information_schema.tables')
                .select('table_name')
                .limit(1);

            if (connectionError) {
                console.log('❌ Error de conexión:', connectionError.message);
                return;
            }
            console.log('✅ Conexión exitosa');
        } catch (error) {
            console.log('❌ Error de conexión:', error.message);
        }
        console.log('');

        // PASO 2: Listar todas las tablas
        console.log('🔍 PASO 2: LISTANDO TODAS LAS TABLAS...');
        try {
            const { data: tables, error: tablesError } = await supabase
                .rpc('get_all_tables');

            if (tablesError) {
                console.log('❌ Error obteniendo tablas:', tablesError.message);
                
                // Método alternativo
                console.log('🔄 Intentando método alternativo...');
                const { data: altTables, error: altError } = await supabase
                    .from('information_schema.tables')
                    .select('table_name, table_schema')
                    .eq('table_schema', 'public');

                if (altError) {
                    console.log('❌ Error método alternativo:', altError.message);
                } else {
                    console.log('📋 TABLAS ENCONTRADAS (método alternativo):');
                    altTables.forEach(table => {
                        console.log(`   - ${table.table_schema}.${table.table_name}`);
                    });
                }
            } else {
                console.log('📋 TABLAS ENCONTRADAS:');
                tables.forEach(table => {
                    console.log(`   - ${table}`);
                });
            }
        } catch (error) {
            console.log('❌ Error listando tablas:', error.message);
        }
        console.log('');

        // PASO 3: Verificar tabla users específicamente
        console.log('🔍 PASO 3: VERIFICANDO TABLA "users"...');
        try {
            const { data: usersData, error: usersError } = await supabase
                .from('users')
                .select('*')
                .limit(1);

            if (usersError) {
                console.log('❌ Error accediendo tabla "users":', usersError.message);
                console.log('   Código:', usersError.code);
                console.log('   Detalles:', usersError.details);
                console.log('   Hint:', usersError.hint);
            } else {
                console.log('✅ Tabla "users" existe y es accesible');
                console.log('   Registros encontrados:', usersData.length);
                if (usersData.length > 0) {
                    console.log('   Campos disponibles:', Object.keys(usersData[0]));
                }
            }
        } catch (error) {
            console.log('❌ Error verificando tabla users:', error.message);
        }
        console.log('');

        // PASO 4: Verificar otras posibles tablas de usuarios
        console.log('🔍 PASO 4: VERIFICANDO TABLAS ALTERNATIVAS...');
        const possibleTables = ['User', 'profiles', 'auth.users', 'public.users'];
        
        for (const tableName of possibleTables) {
            try {
                console.log(`   Verificando tabla: ${tableName}`);
                const { data, error } = await supabase
                    .from(tableName)
                    .select('*')
                    .limit(1);

                if (error) {
                    console.log(`   ❌ ${tableName}: ${error.message}`);
                } else {
                    console.log(`   ✅ ${tableName}: Existe y accesible`);
                    if (data.length > 0) {
                        console.log(`      Campos: ${Object.keys(data[0]).join(', ')}`);
                    }
                }
            } catch (error) {
                console.log(`   ❌ ${tableName}: ${error.message}`);
            }
        }
        console.log('');

        // PASO 5: Verificar usuario específico del error
        console.log('🔍 PASO 5: VERIFICANDO USUARIO ESPECÍFICO...');
        const userId = '6403f9d2-e846-4c70-87e0-e051127d9500';
        console.log('Usuario ID:', userId);

        try {
            // Intentar en auth.users
            const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(userId);
            
            if (authError) {
                console.log('❌ Error obteniendo usuario de auth:', authError.message);
            } else {
                console.log('✅ Usuario encontrado en auth.users:');
                console.log('   Email:', authUser.user.email);
                console.log('   Created:', authUser.user.created_at);
                console.log('   Metadata:', JSON.stringify(authUser.user.user_metadata, null, 2));
            }
        } catch (error) {
            console.log('❌ Error verificando usuario en auth:', error.message);
        }
        console.log('');

        // PASO 6: Verificar políticas RLS
        console.log('🔍 PASO 6: VERIFICANDO POLÍTICAS RLS...');
        try {
            const { data: policies, error: policiesError } = await supabase
                .from('pg_policies')
                .select('*')
                .eq('schemaname', 'public');

            if (policiesError) {
                console.log('❌ Error obteniendo políticas:', policiesError.message);
            } else {
                console.log('📋 POLÍTICAS RLS ENCONTRADAS:');
                policies.forEach(policy => {
                    console.log(`   - Tabla: ${policy.tablename}`);
                    console.log(`     Política: ${policy.policyname}`);
                    console.log(`     Comando: ${policy.cmd}`);
                    console.log('');
                });
            }
        } catch (error) {
            console.log('❌ Error verificando políticas:', error.message);
        }

        console.log('✅ VERIFICACIÓN COMPLETADA');

    } catch (error) {
        console.error('❌ Error general:', error.message);
    }
}

// Ejecutar verificación
verificarSupabaseReal();
