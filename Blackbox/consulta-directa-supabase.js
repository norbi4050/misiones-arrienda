const { createClient } = require('@supabase/supabase-js');

console.log('🔍 CONSULTA DIRECTA A SUPABASE - VERIFICACIÓN DE ESTRUCTURA');
console.log('=' .repeat(70));

const SUPABASE_URL = 'https://qfeyhaaxyemmnohqdele.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmZXloYWF4eWVtbW5vaHFkZWxlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTgxNjczOCwiZXhwIjoyMDcxMzkyNzM4fQ.5wJb1p0Rmg1dVIayIT4wZO_seDXTIwhVa36CyEgK-yM';

async function consultarSupabase() {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    console.log('🔗 Conectando a Supabase...');
    console.log('');

    // 1. Verificar tablas existentes
    console.log('📋 VERIFICANDO TABLAS EXISTENTES:');
    try {
        const { data, error } = await supabase
            .from('information_schema.tables')
            .select('table_name, table_schema')
            .eq('table_schema', 'public')
            .order('table_name');

        if (error) {
            console.log('❌ Error:', error.message);
        } else {
            console.log('✅ Tablas encontradas:');
            data.forEach(table => {
                console.log(`   - ${table.table_name}`);
            });
        }
    } catch (error) {
        console.log('❌ Error consultando tablas:', error.message);
    }
    console.log('');

    // 2. Verificar tabla users específicamente
    console.log('🔍 VERIFICANDO TABLA "users":');
    try {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .limit(1);

        if (error) {
            console.log('❌ Error accediendo "users":', error.message);
            console.log('   Código:', error.code);
            console.log('   Detalles:', error.details);
        } else {
            console.log('✅ Tabla "users" accesible');
            console.log('   Registros:', data.length);
            if (data.length > 0) {
                console.log('   Campos:', Object.keys(data[0]).join(', '));
            }
        }
    } catch (error) {
        console.log('❌ Error:', error.message);
    }
    console.log('');

    // 3. Verificar auth.users
    console.log('🔍 VERIFICANDO AUTH.USERS:');
    try {
        const userId = '6403f9d2-e846-4c70-87e0-e051127d9500';
        const { data: authUser, error } = await supabase.auth.admin.getUserById(userId);
        
        if (error) {
            console.log('❌ Error:', error.message);
        } else {
            console.log('✅ Usuario encontrado en auth:');
            console.log('   ID:', authUser.user.id);
            console.log('   Email:', authUser.user.email);
            console.log('   Created:', authUser.user.created_at);
        }
    } catch (error) {
        console.log('❌ Error:', error.message);
    }
    console.log('');

    // 4. Intentar crear tabla users si no existe
    console.log('🔧 INTENTANDO CREAR TABLA "users":');
    try {
        const { data, error } = await supabase.rpc('create_users_table_if_not_exists');
        
        if (error) {
            console.log('❌ Error creando tabla:', error.message);
            
            // Método alternativo: SQL directo
            console.log('🔄 Intentando SQL directo...');
            const createTableSQL = `
                CREATE TABLE IF NOT EXISTS users (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    name TEXT,
                    email TEXT UNIQUE,
                    phone TEXT,
                    avatar TEXT,
                    bio TEXT,
                    occupation TEXT,
                    age INTEGER,
                    user_type TEXT,
                    company_name TEXT,
                    license_number TEXT,
                    property_count TEXT,
                    verified BOOLEAN DEFAULT false,
                    email_verified BOOLEAN DEFAULT false,
                    rating NUMERIC DEFAULT 0,
                    review_count INTEGER DEFAULT 0,
                    created_at TIMESTAMPTZ DEFAULT now(),
                    updated_at TIMESTAMPTZ DEFAULT now()
                );
            `;
            
            const { data: sqlData, error: sqlError } = await supabase.rpc('exec_sql', { sql: createTableSQL });
            
            if (sqlError) {
                console.log('❌ Error SQL directo:', sqlError.message);
            } else {
                console.log('✅ Tabla creada con SQL directo');
            }
        } else {
            console.log('✅ Tabla creada exitosamente');
        }
    } catch (error) {
        console.log('❌ Error:', error.message);
    }

    console.log('');
    console.log('✅ CONSULTA COMPLETADA');
}

consultarSupabase().catch(console.error);
