-- FIX RLS POLICIES TYPE CASTING 2025
-- Solución para el error: operator does not exist: text = uuid
-- Este error ocurre cuando se comparan tipos incompatibles en las políticas RLS

-- =====================================================
-- PASO 1: ELIMINAR POLÍTICAS PROBLEMÁTICAS EXISTENTES
-- =====================================================

-- Eliminar políticas RLS existentes que pueden tener problemas de tipos
DROP POLICY IF EXISTS "Users can view own profile" ON "User";
DROP POLICY IF EXISTS "Users can update own profile" ON "User";
DROP POLICY IF EXISTS "Users can view own user_profiles" ON "user_profiles";
DROP POLICY IF EXISTS "Users can update own user_profiles" ON "user_profiles";
DROP POLICY IF EXISTS "Users can insert own user_profiles" ON "user_profiles";
DROP POLICY IF EXISTS "Public read access to user profiles" ON "user_profiles";
DROP POLICY IF EXISTS "Users can view avatars" ON "user_profiles";

-- =====================================================
-- PASO 2: VERIFICAR TIPOS DE COLUMNAS
-- =====================================================

-- Verificar el tipo de la columna id en la tabla User
DO $$
BEGIN
    -- Verificar si la columna id es de tipo uuid
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'User' 
        AND column_name = 'id' 
        AND data_type = 'uuid'
    ) THEN
        RAISE NOTICE 'ADVERTENCIA: La columna id en User no es de tipo uuid';
    END IF;
    
    -- Verificar si la columna user_id en user_profiles es de tipo uuid
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_profiles' 
        AND column_name = 'user_id' 
        AND data_type = 'uuid'
    ) THEN
        RAISE NOTICE 'ADVERTENCIA: La columna user_id en user_profiles no es de tipo uuid';
    END IF;
END $$;

-- =====================================================
-- PASO 3: CREAR POLÍTICAS RLS CORREGIDAS CON CASTING EXPLÍCITO
-- =====================================================

-- Política para tabla User - Lectura propia
CREATE POLICY "Users can view own profile" ON "User"
    FOR SELECT
    USING (auth.uid()::text = id::text);

-- Política para tabla User - Actualización propia
CREATE POLICY "Users can update own profile" ON "User"
    FOR UPDATE
    USING (auth.uid()::text = id::text);

-- Política para tabla user_profiles - Lectura propia
CREATE POLICY "Users can view own user_profiles" ON "user_profiles"
    FOR SELECT
    USING (auth.uid()::text = user_id::text);

-- Política para tabla user_profiles - Actualización propia
CREATE POLICY "Users can update own user_profiles" ON "user_profiles"
    FOR UPDATE
    USING (auth.uid()::text = user_id::text);

-- Política para tabla user_profiles - Inserción propia
CREATE POLICY "Users can insert own user_profiles" ON "user_profiles"
    FOR INSERT
    WITH CHECK (auth.uid()::text = user_id::text);

-- Política para acceso público de lectura a perfiles (para avatares)
CREATE POLICY "Public read access to user profiles" ON "user_profiles"
    FOR SELECT
    USING (true);

-- =====================================================
-- PASO 4: VERIFICAR QUE RLS ESTÉ HABILITADO
-- =====================================================

-- Habilitar RLS en las tablas si no está habilitado
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "user_profiles" ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- PASO 5: CREAR FUNCIÓN AUXILIAR PARA COMPARACIONES SEGURAS
-- =====================================================

-- Función para comparar UUIDs de forma segura
CREATE OR REPLACE FUNCTION safe_uuid_compare(uuid_val uuid, text_val text)
RETURNS boolean AS $$
BEGIN
    -- Intentar convertir text a uuid y comparar
    BEGIN
        RETURN uuid_val = text_val::uuid;
    EXCEPTION WHEN invalid_text_representation THEN
        -- Si la conversión falla, comparar como texto
        RETURN uuid_val::text = text_val;
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- PASO 6: POLÍTICAS ALTERNATIVAS USANDO LA FUNCIÓN AUXILIAR
-- =====================================================

-- Si las políticas anteriores siguen fallando, usar estas alternativas:

-- DROP POLICY IF EXISTS "Users can view own profile" ON "User";
-- CREATE POLICY "Users can view own profile" ON "User"
--     FOR SELECT
--     USING (safe_uuid_compare(id, auth.uid()::text));

-- DROP POLICY IF EXISTS "Users can update own profile" ON "User";
-- CREATE POLICY "Users can update own profile" ON "User"
--     FOR UPDATE
--     USING (safe_uuid_compare(id, auth.uid()::text));

-- =====================================================
-- PASO 7: VERIFICACIÓN FINAL
-- =====================================================

-- Verificar que las políticas se crearon correctamente
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
WHERE tablename IN ('User', 'user_profiles')
ORDER BY tablename, policyname;

-- Mensaje de confirmación
DO $$
BEGIN
    RAISE NOTICE '✅ Políticas RLS corregidas exitosamente';
    RAISE NOTICE '✅ Se aplicó casting explícito para evitar errores de tipo';
    RAISE NOTICE '✅ Se creó función auxiliar para comparaciones seguras';
    RAISE NOTICE '📋 Verificar que las políticas aparezcan en la consulta anterior';
END $$;
