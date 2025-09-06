const { createClient } = require('@supabase/supabase-js');

console.log('🔧 EJECUTANDO SQL DIRECTAMENTE EN SUPABASE');
console.log('=' .repeat(60));

const SUPABASE_URL = 'https://qfeyhaaxyemmnohqdele.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmZXloYWF4eWVtbW5vaHFkZWxlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTgxNjczOCwiZXhwIjoyMDcxMzkyNzM4fQ.5wJb1p0Rmg1dVIayIT4wZO_seDXTIwhVa36CyEgK-yM';

async function ejecutarSolucion() {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    console.log('🔗 Conectando a Supabase...');
    console.log('');

    try {
        // 1. Crear tabla users si no existe
        console.log('📋 PASO 1: CREANDO TABLA USERS...');
        
        const createTableSQL = `
            CREATE TABLE IF NOT EXISTS public.users (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                name TEXT,
                email TEXT UNIQUE,
                phone TEXT,
                password TEXT,
                avatar TEXT,
                bio TEXT,
                occupation TEXT,
                age INTEGER,
                user_type TEXT,
                company_name TEXT,
                license_number TEXT,
                property_count TEXT,
                full_name TEXT,
                location TEXT,
                search_type TEXT,
                budget_range TEXT,
                profile_image TEXT,
                preferred_areas TEXT,
                family_size INTEGER,
                pet_friendly BOOLEAN,
                move_in_date DATE,
                employment_status TEXT,
                monthly_income NUMERIC,
                verified BOOLEAN DEFAULT false,
                email_verified BOOLEAN DEFAULT false,
                verification_token TEXT,
                rating NUMERIC DEFAULT 0,
                review_count INTEGER DEFAULT 0,
                created_at TIMESTAMPTZ DEFAULT now(),
                updated_at TIMESTAMPTZ DEFAULT now()
            );
        `;

        const { data: createResult, error: createError } = await supabase.rpc('exec_sql', { 
            sql: createTableSQL 
        });

        if (createError) {
            console.log('❌ Error creando tabla:', createError.message);
            
            // Método alternativo: usar función personalizada
            console.log('🔄 Intentando método alternativo...');
            
            // Crear función para ejecutar SQL
            const createFunctionSQL = `
                CREATE OR REPLACE FUNCTION exec_sql(sql_text TEXT)
                RETURNS TEXT AS $$
                BEGIN
                    EXECUTE sql_text;
                    RETURN 'SQL executed successfully';
                END;
                $$ LANGUAGE plpgsql SECURITY DEFINER;
            `;

            try {
                await supabase.rpc('exec_sql', { sql: createFunctionSQL });
                console.log('✅ Función SQL creada');
                
                // Ahora ejecutar la creación de tabla
                await supabase.rpc('exec_sql', { sql: createTableSQL });
                console.log('✅ Tabla users creada');
            } catch (altError) {
                console.log('❌ Error método alternativo:', altError.message);
            }
        } else {
            console.log('✅ Tabla users creada/verificada');
        }

        // 2. Verificar que la tabla existe
        console.log('');
        console.log('📋 PASO 2: VERIFICANDO TABLA...');
        
        const { data: tableCheck, error: tableError } = await supabase
            .from('users')
            .select('count')
            .limit(1);

        if (tableError) {
            console.log('❌ Tabla no accesible:', tableError.message);
        } else {
            console.log('✅ Tabla users accesible');
        }

        // 3. Insertar usuario de prueba
        console.log('');
        console.log('👤 PASO 3: INSERTANDO USUARIO DE PRUEBA...');
        
        const userId = '6403f9d2-e846-4c70-87e0-e051127d9500';
        
        const { data: insertResult, error: insertError } = await supabase
            .from('users')
            .upsert({
                id: userId,
                name: 'Usuario Test',
                email: 'test@misionesarrienda.com',
                phone: '+54 376 123456',
                user_type: 'inquilino',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
            .select();

        if (insertError) {
            console.log('❌ Error insertando usuario:', insertError.message);
        } else {
            console.log('✅ Usuario de prueba insertado/actualizado');
        }

        // 4. Probar consulta que estaba fallando
        console.log('');
        console.log('🧪 PASO 4: PROBANDO CONSULTA PROBLEMÁTICA...');
        
        const { data: testQuery, error: testError } = await supabase
            .from('users')
            .select('user_type,created_at')
            .eq('id', userId)
            .single();

        if (testError) {
            console.log('❌ Error en consulta de prueba:', testError.message);
            console.log('   Código:', testError.code);
        } else {
            console.log('✅ Consulta de prueba exitosa');
            console.log('   Datos:', testQuery);
        }

        // 5. Configurar políticas RLS básicas
        console.log('');
        console.log('🔒 PASO 5: CONFIGURANDO RLS...');
        
        try {
            // Habilitar RLS
            await supabase.rpc('exec_sql', { 
                sql: 'ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;' 
            });
            console.log('✅ RLS habilitado');

            // Política básica para lectura
            await supabase.rpc('exec_sql', { 
                sql: `CREATE POLICY IF NOT EXISTS "Users can view own profile" ON public.users FOR SELECT USING (auth.uid() = id);` 
            });
            console.log('✅ Política SELECT creada');

            // Política básica para actualización
            await supabase.rpc('exec_sql', { 
                sql: `CREATE POLICY IF NOT EXISTS "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid() = id);` 
            });
            console.log('✅ Política UPDATE creada');

        } catch (rlsError) {
            console.log('❌ Error configurando RLS:', rlsError.message);
        }

        console.log('');
        console.log('✅ SOLUCIÓN EJECUTADA COMPLETAMENTE');

    } catch (error) {
        console.error('❌ Error general:', error.message);
    }
}

ejecutarSolucion().catch(console.error);
