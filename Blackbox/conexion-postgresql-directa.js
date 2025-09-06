const { Client } = require('pg');

console.log('🔍 CONEXIÓN DIRECTA A POSTGRESQL - ANÁLISIS EXHAUSTIVO');
console.log('=' .repeat(70));

// Credenciales de PostgreSQL
const connectionString = 'postgresql://postgres:Yanina302472!@db.qfeyhaaxyemmnohqdele.supabase.co:5432/postgres?sslmode=require';

async function analizarBaseDatos() {
    const client = new Client({
        connectionString: connectionString
    });

    try {
        console.log('🔗 Conectando a PostgreSQL...');
        await client.connect();
        console.log('✅ Conexión exitosa');
        console.log('');

        // 1. Listar todas las tablas
        console.log('📋 LISTANDO TODAS LAS TABLAS:');
        const tablesQuery = `
            SELECT table_schema, table_name, table_type
            FROM information_schema.tables 
            WHERE table_schema IN ('public', 'auth')
            ORDER BY table_schema, table_name;
        `;
        
        const tablesResult = await client.query(tablesQuery);
        console.log('Tablas encontradas:');
        tablesResult.rows.forEach(row => {
            console.log(`   ${row.table_schema}.${row.table_name} (${row.table_type})`);
        });
        console.log('');

        // 2. Verificar tabla users específicamente
        console.log('🔍 VERIFICANDO TABLA "users":');
        try {
            const usersQuery = 'SELECT * FROM users LIMIT 1;';
            const usersResult = await client.query(usersQuery);
            console.log('✅ Tabla "users" existe y es accesible');
            console.log('   Registros encontrados:', usersResult.rows.length);
            
            if (usersResult.rows.length > 0) {
                console.log('   Campos disponibles:', Object.keys(usersResult.rows[0]).join(', '));
            }
        } catch (error) {
            console.log('❌ Error accediendo tabla "users":', error.message);
            
            // Verificar si la tabla existe pero no es accesible
            const checkTableQuery = `
                SELECT column_name, data_type, is_nullable
                FROM information_schema.columns 
                WHERE table_name = 'users' AND table_schema = 'public'
                ORDER BY ordinal_position;
            `;
            
            try {
                const columnsResult = await client.query(checkTableQuery);
                if (columnsResult.rows.length > 0) {
                    console.log('✅ Tabla "users" existe, estructura:');
                    columnsResult.rows.forEach(col => {
                        console.log(`   - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
                    });
                } else {
                    console.log('❌ Tabla "users" NO EXISTE');
                }
            } catch (structureError) {
                console.log('❌ Error verificando estructura:', structureError.message);
            }
        }
        console.log('');

        // 3. Verificar auth.users
        console.log('🔍 VERIFICANDO AUTH.USERS:');
        try {
            const authUsersQuery = 'SELECT id, email, created_at FROM auth.users LIMIT 5;';
            const authResult = await client.query(authUsersQuery);
            console.log('✅ Tabla auth.users accesible');
            console.log('   Usuarios encontrados:', authResult.rows.length);
            authResult.rows.forEach(user => {
                console.log(`   - ${user.id}: ${user.email} (${user.created_at})`);
            });
        } catch (error) {
            console.log('❌ Error accediendo auth.users:', error.message);
        }
        console.log('');

        // 4. Verificar usuario específico del error
        console.log('🔍 VERIFICANDO USUARIO ESPECÍFICO:');
        const userId = '6403f9d2-e846-4c70-87e0-e051127d9500';
        try {
            const userQuery = 'SELECT * FROM auth.users WHERE id = $1;';
            const userResult = await client.query(userQuery, [userId]);
            
            if (userResult.rows.length > 0) {
                const user = userResult.rows[0];
                console.log('✅ Usuario encontrado en auth.users:');
                console.log('   ID:', user.id);
                console.log('   Email:', user.email);
                console.log('   Created:', user.created_at);
                console.log('   Metadata:', JSON.stringify(user.raw_user_meta_data, null, 2));
            } else {
                console.log('❌ Usuario NO encontrado en auth.users');
            }
        } catch (error) {
            console.log('❌ Error verificando usuario:', error.message);
        }
        console.log('');

        // 5. Crear tabla users si no existe
        console.log('🔧 CREANDO TABLA "users" SI NO EXISTE:');
        const createTableQuery = `
            CREATE TABLE IF NOT EXISTS public.users (
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
                rating NUMERIC DEFAULT 0,
                review_count INTEGER DEFAULT 0,
                created_at TIMESTAMPTZ DEFAULT now(),
                updated_at TIMESTAMPTZ DEFAULT now()
            );
        `;

        try {
            await client.query(createTableQuery);
            console.log('✅ Tabla "users" creada/verificada exitosamente');
        } catch (error) {
            console.log('❌ Error creando tabla:', error.message);
        }
        console.log('');

        // 6. Configurar políticas RLS
        console.log('🔒 CONFIGURANDO POLÍTICAS RLS:');
        try {
            // Habilitar RLS
            await client.query('ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;');
            console.log('✅ RLS habilitado');

            // Política para que usuarios puedan ver su propio perfil
            const selectPolicyQuery = `
                CREATE POLICY IF NOT EXISTS "Users can view own profile" ON public.users
                FOR SELECT USING (auth.uid() = id);
            `;
            await client.query(selectPolicyQuery);
            console.log('✅ Política SELECT creada');

            // Política para que usuarios puedan actualizar su propio perfil
            const updatePolicyQuery = `
                CREATE POLICY IF NOT EXISTS "Users can update own profile" ON public.users
                FOR UPDATE USING (auth.uid() = id);
            `;
            await client.query(updatePolicyQuery);
            console.log('✅ Política UPDATE creada');

            // Política para insertar usuarios
            const insertPolicyQuery = `
                CREATE POLICY IF NOT EXISTS "Users can insert own profile" ON public.users
                FOR INSERT WITH CHECK (auth.uid() = id);
            `;
            await client.query(insertPolicyQuery);
            console.log('✅ Política INSERT creada');

        } catch (error) {
            console.log('❌ Error configurando RLS:', error.message);
        }
        console.log('');

        // 7. Insertar usuario de prueba si no existe
        console.log('👤 INSERTANDO USUARIO DE PRUEBA:');
        try {
            const insertUserQuery = `
                INSERT INTO public.users (id, name, email, phone, user_type, created_at, updated_at)
                VALUES ($1, $2, $3, $4, $5, now(), now())
                ON CONFLICT (id) DO UPDATE SET
                    name = EXCLUDED.name,
                    email = EXCLUDED.email,
                    phone = EXCLUDED.phone,
                    user_type = EXCLUDED.user_type,
                    updated_at = now();
            `;
            
            await client.query(insertUserQuery, [
                userId,
                'Usuario Test',
                'test@example.com',
                '+54 376 123456',
                'inquilino'
            ]);
            console.log('✅ Usuario de prueba insertado/actualizado');
        } catch (error) {
            console.log('❌ Error insertando usuario:', error.message);
        }

        console.log('');
        console.log('✅ ANÁLISIS COMPLETADO');

    } catch (error) {
        console.error('❌ Error general:', error.message);
    } finally {
        await client.end();
        console.log('🔌 Conexión cerrada');
    }
}

analizarBaseDatos().catch(console.error);
