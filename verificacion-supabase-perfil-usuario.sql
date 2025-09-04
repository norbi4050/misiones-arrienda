-- =====================================================
-- VERIFICACIÓN COMPLETA SUPABASE - PERFIL USUARIO
-- Diagnóstico de problemas críticos detectados
-- =====================================================

-- 1. PROBLEMA CRÍTICO: Incompatibilidad de tipos UUID vs TEXT
-- ERROR: operator does not exist: uuid = text
-- SOLUCIÓN: Corregir tipos de datos inconsistentes

-- Verificar tipos de datos en tablas relacionadas
SELECT 
    'users' as tabla,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN ('id', 'email', 'name', 'phone', 'bio')
ORDER BY ordinal_position;

SELECT 
    'profiles' as tabla,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name IN ('id', 'email', 'name', 'phone', 'full_name')
ORDER BY ordinal_position;

SELECT 
    'community_profiles' as tabla,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'community_profiles' 
AND column_name IN ('id', 'user_id', 'bio', 'location', 'phone')
ORDER BY ordinal_position;

-- =====================================================
-- 2. CORRECCIÓN DE TIPOS DE DATOS INCONSISTENTES
-- =====================================================

-- Corregir tabla users: cambiar id de TEXT a UUID
DO $$
BEGIN
    -- Verificar si la columna id en users es TEXT
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'id' 
        AND data_type = 'text'
    ) THEN
        -- Cambiar tipo de TEXT a UUID
        ALTER TABLE users ALTER COLUMN id TYPE uuid USING id::uuid;
        RAISE NOTICE 'Corregido: users.id cambiado de TEXT a UUID';
    END IF;
END $$;

-- =====================================================
-- 3. VERIFICAR Y CORREGIR FOREIGN KEYS
-- =====================================================

-- Verificar foreign keys existentes
SELECT 
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_name IN ('users', 'profiles', 'community_profiles');

-- Corregir foreign key en community_profiles si es necesario
DO $$
BEGIN
    -- Eliminar constraint existente si hay problemas de tipo
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'community_profiles' 
        AND constraint_name = 'community_profiles_user_id_fkey'
    ) THEN
        ALTER TABLE community_profiles DROP CONSTRAINT community_profiles_user_id_fkey;
        RAISE NOTICE 'Eliminado constraint problemático: community_profiles_user_id_fkey';
    END IF;
    
    -- Recrear foreign key con tipos correctos
    ALTER TABLE community_profiles 
    ADD CONSTRAINT community_profiles_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    
    RAISE NOTICE 'Recreado constraint: community_profiles_user_id_fkey';
END $$;

-- =====================================================
-- 4. VERIFICAR Y CORREGIR RLS POLICIES
-- =====================================================

-- Verificar policies existentes
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
WHERE tablename IN ('users', 'profiles', 'community_profiles')
ORDER BY tablename, cmd;

-- Corregir policy problemática en profiles
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;

-- Crear policy corregida para profiles
CREATE POLICY "Users can insert their own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Verificar que profiles tenga policy de UPDATE correcta
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- =====================================================
-- 5. VERIFICAR DATOS EXISTENTES Y LIMPIEZA
-- =====================================================

-- Contar registros en cada tabla
SELECT 'users' as tabla, COUNT(*) as total_registros FROM users
UNION ALL
SELECT 'profiles' as tabla, COUNT(*) as total_registros FROM profiles
UNION ALL
SELECT 'community_profiles' as tabla, COUNT(*) as total_registros FROM community_profiles;

-- Verificar registros huérfanos en profiles
SELECT 
    'profiles_huerfanos' as tipo,
    COUNT(*) as cantidad
FROM profiles p
LEFT JOIN auth.users au ON p.id = au.id
WHERE au.id IS NULL;

-- Verificar registros huérfanos en community_profiles
SELECT 
    'community_profiles_huerfanos' as tipo,
    COUNT(*) as cantidad
FROM community_profiles cp
LEFT JOIN auth.users au ON cp.user_id = au.id
WHERE au.id IS NULL;

-- =====================================================
-- 6. TESTING DE OPERACIONES BÁSICAS
-- =====================================================

-- Test 1: Verificar que se puede hacer SELECT en profiles
DO $$
BEGIN
    PERFORM * FROM profiles LIMIT 1;
    RAISE NOTICE 'TEST 1 PASSED: SELECT en profiles funciona';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'TEST 1 FAILED: Error en SELECT profiles: %', SQLERRM;
END $$;

-- Test 2: Verificar que se puede hacer SELECT en community_profiles
DO $$
BEGIN
    PERFORM * FROM community_profiles LIMIT 1;
    RAISE NOTICE 'TEST 2 PASSED: SELECT en community_profiles funciona';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'TEST 2 FAILED: Error en SELECT community_profiles: %', SQLERRM;
END $$;

-- Test 3: Verificar JOIN entre auth.users y profiles
DO $$
BEGIN
    PERFORM au.id, p.id 
    FROM auth.users au 
    LEFT JOIN profiles p ON au.id = p.id 
    LIMIT 1;
    RAISE NOTICE 'TEST 3 PASSED: JOIN auth.users-profiles funciona';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'TEST 3 FAILED: Error en JOIN: %', SQLERRM;
END $$;

-- =====================================================
-- 7. CREAR FUNCIÓN HELPER PARA MAPEO DE CAMPOS
-- =====================================================

-- Función para mapear campos camelCase a snake_case
CREATE OR REPLACE FUNCTION map_profile_fields(profile_data jsonb)
RETURNS jsonb AS $$
DECLARE
    mapped_data jsonb := '{}';
BEGIN
    -- Mapeo de campos comunes
    IF profile_data ? 'name' THEN
        mapped_data := mapped_data || jsonb_build_object('name', profile_data->>'name');
    END IF;
    
    IF profile_data ? 'phone' THEN
        mapped_data := mapped_data || jsonb_build_object('phone', profile_data->>'phone');
    END IF;
    
    IF profile_data ? 'location' THEN
        mapped_data := mapped_data || jsonb_build_object('location', profile_data->>'location');
    END IF;
    
    IF profile_data ? 'searchType' THEN
        mapped_data := mapped_data || jsonb_build_object('search_type', profile_data->>'searchType');
    END IF;
    
    IF profile_data ? 'budgetRange' THEN
        mapped_data := mapped_data || jsonb_build_object('budget_range', profile_data->>'budgetRange');
    END IF;
    
    IF profile_data ? 'bio' THEN
        mapped_data := mapped_data || jsonb_build_object('bio', profile_data->>'bio');
    END IF;
    
    IF profile_data ? 'profileImage' THEN
        mapped_data := mapped_data || jsonb_build_object('profile_image', profile_data->>'profileImage');
    END IF;
    
    IF profile_data ? 'preferredAreas' THEN
        mapped_data := mapped_data || jsonb_build_object('preferred_areas', profile_data->>'preferredAreas');
    END IF;
    
    IF profile_data ? 'familySize' THEN
        mapped_data := mapped_data || jsonb_build_object('family_size', profile_data->>'familySize');
    END IF;
    
    IF profile_data ? 'petFriendly' THEN
        mapped_data := mapped_data || jsonb_build_object('pet_friendly', profile_data->>'petFriendly');
    END IF;
    
    IF profile_data ? 'moveInDate' THEN
        mapped_data := mapped_data || jsonb_build_object('move_in_date', profile_data->>'moveInDate');
    END IF;
    
    IF profile_data ? 'employmentStatus' THEN
        mapped_data := mapped_data || jsonb_build_object('employment_status', profile_data->>'employmentStatus');
    END IF;
    
    IF profile_data ? 'monthlyIncome' THEN
        mapped_data := mapped_data || jsonb_build_object('monthly_income', profile_data->>'monthlyIncome');
    END IF;
    
    RETURN mapped_data;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 8. VERIFICACIÓN FINAL
-- =====================================================

-- Verificar que todas las correcciones se aplicaron
SELECT 'VERIFICACIÓN FINAL' as status;

-- Verificar tipos de datos corregidos
SELECT 
    table_name,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_name IN ('users', 'profiles', 'community_profiles')
AND column_name IN ('id', 'user_id')
ORDER BY table_name, column_name;

-- Verificar policies activas
SELECT 
    tablename,
    policyname,
    cmd
FROM pg_policies 
WHERE tablename IN ('users', 'profiles', 'community_profiles')
ORDER BY tablename, cmd;

-- Verificar foreign keys
SELECT 
    tc.table_name,
    tc.constraint_name,
    kcu.column_name,
    ccu.table_name AS references_table,
    ccu.column_name AS references_column
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu 
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_name IN ('profiles', 'community_profiles');

SELECT 'VERIFICACIÓN COMPLETADA' as status;
