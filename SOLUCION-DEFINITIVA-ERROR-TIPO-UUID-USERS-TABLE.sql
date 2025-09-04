-- =====================================================
-- SOLUCIÓN DEFINITIVA: ERROR TIPO UUID EN TABLA USERS
-- =====================================================
-- Problema: La tabla users tiene id como TEXT cuando debería ser UUID
-- Esto causa errores en JOINs con auth.users que usa UUID

-- PASO 1: Verificar el problema actual
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name = 'id';

-- PASO 2: Verificar si hay datos en la tabla
SELECT COUNT(*) as total_users FROM users;

-- PASO 3: Crear tabla temporal con estructura correcta
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

-- PASO 4: Migrar datos existentes (si los hay)
-- Solo si hay datos en la tabla original
DO $$
BEGIN
    IF (SELECT COUNT(*) FROM users) > 0 THEN
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
        
        RAISE NOTICE 'Datos migrados exitosamente a users_temp';
    ELSE
        RAISE NOTICE 'No hay datos para migrar';
    END IF;
END $$;

-- PASO 5: Eliminar tabla original y renombrar temporal
DROP TABLE IF EXISTS users CASCADE;
ALTER TABLE users_temp RENAME TO users;

-- PASO 6: Recrear índices importantes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_user_type ON users(user_type);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);
CREATE INDEX IF NOT EXISTS idx_users_full_name ON users(full_name);

-- PASO 7: Recrear constraints de check
ALTER TABLE users ADD CONSTRAINT users_user_type_check 
CHECK (user_type IN ('inquilino', 'propietario', 'inmobiliaria'));

-- PASO 8: Recrear trigger para updated_at
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

-- PASO 9: Recrear políticas RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Política para SELECT
DROP POLICY IF EXISTS "Enable select for users" ON users;
CREATE POLICY "Enable select for users" ON users
    FOR SELECT USING (
        (auth.uid())::text = id::text OR 
        auth.uid() IS NULL OR 
        auth.role() = 'service_role'::text
    );

-- Política para INSERT
DROP POLICY IF EXISTS "Enable insert for registration" ON users;
CREATE POLICY "Enable insert for registration" ON users
    FOR INSERT WITH CHECK (true);

-- Política para UPDATE
DROP POLICY IF EXISTS "Enable update for own profile" ON users;
CREATE POLICY "Enable update for own profile" ON users
    FOR UPDATE USING (
        (auth.uid())::text = id::text OR 
        auth.role() = 'service_role'::text
    );

-- Política para DELETE
DROP POLICY IF EXISTS "Enable delete for own profile" ON users;
CREATE POLICY "Enable delete for own profile" ON users
    FOR DELETE USING (
        (auth.uid())::text = id::text OR 
        auth.role() = 'service_role'::text
    );

-- Política adicional para service_role
DROP POLICY IF EXISTS "allow_service_role_insert" ON users;
CREATE POLICY "allow_service_role_insert" ON users
    FOR INSERT TO service_role WITH CHECK (true);

-- PASO 10: Verificar la corrección
SELECT 
    'users' as tabla,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name = 'id';

-- PASO 11: Verificar que las políticas funcionan
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
WHERE tablename = 'users'
ORDER BY policyname;

-- PASO 12: Mensaje de confirmación
DO $$
BEGIN
    RAISE NOTICE '✅ CORRECCIÓN COMPLETADA: Tabla users ahora usa UUID correctamente';
    RAISE NOTICE '✅ Políticas RLS recreadas exitosamente';
    RAISE NOTICE '✅ Índices y triggers restaurados';
    RAISE NOTICE '✅ El error "uuid = text" debería estar resuelto';
END $$;
