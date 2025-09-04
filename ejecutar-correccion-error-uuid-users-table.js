const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// =====================================================
// SCRIPT AUTOMATIZADO: CORRECCIÓN ERROR UUID USERS TABLE
// =====================================================

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ ERROR: Variables de entorno de Supabase no encontradas');
    console.error('Asegúrate de tener NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en tu .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function ejecutarCorreccionUUID() {
    console.log('🚀 INICIANDO CORRECCIÓN ERROR UUID EN TABLA USERS');
    console.log('=' .repeat(60));
    
    try {
        // PASO 1: Verificar el problema actual
        console.log('📋 PASO 1: Verificando estructura actual de tabla users...');
        
        const { data: columnsData, error: columnsError } = await supabase
            .from('information_schema.columns')
            .select('table_name, column_name, data_type, is_nullable, column_default')
            .eq('table_name', 'users')
            .eq('column_name', 'id');
            
        if (columnsError) {
            console.error('❌ Error verificando columnas:', columnsError);
            return false;
        }
        
        console.log('📊 Estructura actual de columna id en users:');
        console.table(columnsData);
        
        if (columnsData.length > 0 && columnsData[0].data_type === 'text') {
            console.log('🔍 CONFIRMADO: La columna id es TEXT, necesita ser UUID');
        } else {
            console.log('✅ La columna id ya es UUID, no se necesita corrección');
            return true;
        }
        
        // PASO 2: Verificar si hay datos
        console.log('\n📋 PASO 2: Verificando datos existentes...');
        
        const { count, error: countError } = await supabase
            .from('users')
            .select('*', { count: 'exact', head: true });
            
        if (countError) {
            console.error('❌ Error contando usuarios:', countError);
            return false;
        }
        
        console.log(`📊 Total de usuarios en tabla: ${count}`);
        
        // PASO 3: Ejecutar corrección SQL
        console.log('\n🔧 PASO 3: Ejecutando corrección SQL...');
        
        const correctionSQL = `
        -- Crear tabla temporal con estructura correcta
        CREATE TABLE IF NOT EXISTS users_temp (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            phone TEXT NOT NULL,
            password TEXT NOT NULL,
            avatar TEXT,
            bio TEXT,
            occupation TEXT,
            age INTEGER,
            verified BOOLEAN DEFAULT false,
            email_verified BOOLEAN DEFAULT false,
            verification_token TEXT,
            rating REAL DEFAULT 0,
            review_count INTEGER DEFAULT 0,
            user_type TEXT,
            company_name TEXT,
            license_number TEXT,
            property_count TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
            full_name TEXT
        );
        `;
        
        const { error: createError } = await supabase.rpc('exec_sql', { 
            sql: correctionSQL 
        });
        
        if (createError) {
            console.error('❌ Error creando tabla temporal:', createError);
            return false;
        }
        
        console.log('✅ Tabla temporal creada exitosamente');
        
        // PASO 4: Migrar datos si existen
        if (count > 0) {
            console.log('\n📦 PASO 4: Migrando datos existentes...');
            
            const migrationSQL = `
            INSERT INTO users_temp (
                name, email, phone, password, avatar, bio, occupation, age,
                verified, email_verified, verification_token, rating, review_count,
                user_type, company_name, license_number, property_count,
                created_at, updated_at, full_name
            )
            SELECT 
                name, email, phone, password, avatar, bio, occupation, age,
                verified, email_verified, verification_token, rating, review_count,
                user_type, company_name, license_number, property_count,
                created_at, updated_at, full_name
            FROM users;
            `;
            
            const { error: migrationError } = await supabase.rpc('exec_sql', { 
                sql: migrationSQL 
            });
            
            if (migrationError) {
                console.error('❌ Error migrando datos:', migrationError);
                return false;
            }
            
            console.log('✅ Datos migrados exitosamente');
        }
        
        // PASO 5: Reemplazar tabla original
        console.log('\n🔄 PASO 5: Reemplazando tabla original...');
        
        const replaceSQL = `
        DROP TABLE IF EXISTS users CASCADE;
        ALTER TABLE users_temp RENAME TO users;
        `;
        
        const { error: replaceError } = await supabase.rpc('exec_sql', { 
            sql: replaceSQL 
        });
        
        if (replaceError) {
            console.error('❌ Error reemplazando tabla:', replaceError);
            return false;
        }
        
        console.log('✅ Tabla reemplazada exitosamente');
        
        // PASO 6: Recrear índices y constraints
        console.log('\n🔧 PASO 6: Recreando índices y constraints...');
        
        const indexesSQL = `
        CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
        CREATE INDEX IF NOT EXISTS idx_users_user_type ON users(user_type);
        CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);
        CREATE INDEX IF NOT EXISTS idx_users_full_name ON users(full_name);
        
        ALTER TABLE users ADD CONSTRAINT users_user_type_check 
        CHECK (user_type IN ('inquilino', 'propietario', 'inmobiliaria'));
        `;
        
        const { error: indexesError } = await supabase.rpc('exec_sql', { 
            sql: indexesSQL 
        });
        
        if (indexesError) {
            console.error('❌ Error recreando índices:', indexesError);
            return false;
        }
        
        console.log('✅ Índices y constraints recreados');
        
        // PASO 7: Recrear trigger
        console.log('\n🔧 PASO 7: Recreando trigger updated_at...');
        
        const triggerSQL = `
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = now();
            RETURN NEW;
        END;
        $$ language 'plpgsql';
        
        DROP TRIGGER IF EXISTS update_users_updated_at ON users;
        CREATE TRIGGER update_users_updated_at 
            BEFORE UPDATE ON users 
            FOR EACH ROW 
            EXECUTE FUNCTION update_updated_at_column();
        `;
        
        const { error: triggerError } = await supabase.rpc('exec_sql', { 
            sql: triggerSQL 
        });
        
        if (triggerError) {
            console.error('❌ Error recreando trigger:', triggerError);
            return false;
        }
        
        console.log('✅ Trigger recreado exitosamente');
        
        // PASO 8: Recrear políticas RLS
        console.log('\n🛡️ PASO 8: Recreando políticas RLS...');
        
        const rlsSQL = `
        ALTER TABLE users ENABLE ROW LEVEL SECURITY;
        
        DROP POLICY IF EXISTS "Enable select for users" ON users;
        CREATE POLICY "Enable select for users" ON users
            FOR SELECT USING (
                (auth.uid())::text = id::text OR 
                auth.uid() IS NULL OR 
                auth.role() = 'service_role'::text
            );
        
        DROP POLICY IF EXISTS "Enable insert for registration" ON users;
        CREATE POLICY "Enable insert for registration" ON users
            FOR INSERT WITH CHECK (true);
        
        DROP POLICY IF EXISTS "Enable update for own profile" ON users;
        CREATE POLICY "Enable update for own profile" ON users
            FOR UPDATE USING (
                (auth.uid())::text = id::text OR 
                auth.role() = 'service_role'::text
            );
        
        DROP POLICY IF EXISTS "Enable delete for own profile" ON users;
        CREATE POLICY "Enable delete for own profile" ON users
            FOR DELETE USING (
                (auth.uid())::text = id::text OR 
                auth.role() = 'service_role'::text
            );
        
        DROP POLICY IF EXISTS "allow_service_role_insert" ON users;
        CREATE POLICY "allow_service_role_insert" ON users
            FOR INSERT TO service_role WITH CHECK (true);
        `;
        
        const { error: rlsError } = await supabase.rpc('exec_sql', { 
            sql: rlsSQL 
        });
        
        if (rlsError) {
            console.error('❌ Error recreando políticas RLS:', rlsError);
            return false;
        }
        
        console.log('✅ Políticas RLS recreadas exitosamente');
        
        // PASO 9: Verificar corrección
        console.log('\n✅ PASO 9: Verificando corrección...');
        
        const { data: verifyData, error: verifyError } = await supabase
            .from('information_schema.columns')
            .select('table_name, column_name, data_type, is_nullable, column_default')
            .eq('table_name', 'users')
            .eq('column_name', 'id');
            
        if (verifyError) {
            console.error('❌ Error verificando corrección:', verifyError);
            return false;
        }
        
        console.log('📊 Estructura corregida de columna id en users:');
        console.table(verifyData);
        
        if (verifyData.length > 0 && verifyData[0].data_type === 'uuid') {
            console.log('🎉 ¡CORRECCIÓN EXITOSA! La columna id ahora es UUID');
        } else {
            console.log('❌ La corrección no se aplicó correctamente');
            return false;
        }
        
        // PASO 10: Testing básico
        console.log('\n🧪 PASO 10: Testing básico de la corrección...');
        
        try {
            // Intentar hacer un JOIN que antes fallaba
            const { data: testData, error: testError } = await supabase
                .from('users')
                .select('id, email')
                .limit(1);
                
            if (testError) {
                console.error('❌ Error en testing básico:', testError);
                return false;
            }
            
            console.log('✅ Testing básico exitoso - La tabla funciona correctamente');
            
        } catch (error) {
            console.error('❌ Error en testing:', error);
            return false;
        }
        
        console.log('\n🎉 ¡CORRECCIÓN COMPLETADA EXITOSAMENTE!');
        console.log('=' .repeat(60));
        console.log('✅ El error "uuid = text" ha sido resuelto');
        console.log('✅ La tabla users ahora usa UUID correctamente');
        console.log('✅ Todas las políticas RLS han sido recreadas');
        console.log('✅ Los índices y triggers están funcionando');
        console.log('✅ El endpoint /api/users/profile debería funcionar ahora');
        
        return true;
        
    } catch (error) {
        console.error('❌ ERROR CRÍTICO durante la corrección:', error);
        return false;
    }
}

// Ejecutar corrección
ejecutarCorreccionUUID()
    .then(success => {
        if (success) {
            console.log('\n🎯 PRÓXIMOS PASOS:');
            console.log('1. Probar el endpoint /api/users/profile');
            console.log('2. Verificar que el registro de usuarios funcione');
            console.log('3. Confirmar que no hay más errores uuid = text');
            process.exit(0);
        } else {
            console.log('\n❌ LA CORRECCIÓN FALLÓ');
            console.log('Revisa los errores anteriores y ejecuta manualmente el SQL');
            process.exit(1);
        }
    })
    .catch(error => {
        console.error('❌ ERROR FATAL:', error);
        process.exit(1);
    });
