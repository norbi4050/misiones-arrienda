-- ============================================================================
-- AUDITORÍA EN VIVO - SINCRONIZACIÓN DE USUARIOS
-- Fecha: 16 de Enero 2025
-- Propósito: Diagnosticar problema de sincronización auth.users → users → user_profiles
-- ============================================================================

\echo '============================================================================'
\echo 'AUDITORÍA EN VIVO - ESTADO DE SINCRONIZACIÓN DE USUARIOS'
\echo 'Fecha: 2025-01-16'
\echo '============================================================================'
\echo ''

-- ============================================================================
-- SECCIÓN 1: CONTEO DE REGISTROS POR TABLA
-- ============================================================================

\echo '--- 1. CONTEO DE REGISTROS POR TABLA ---'
\echo ''

SELECT
    'auth.users' AS tabla,
    COUNT(*) AS total_registros
FROM auth.users

UNION ALL

SELECT
    'public.profiles' AS tabla,
    COUNT(*) AS total_registros
FROM public.profiles

UNION ALL

SELECT
    'public.User (Prisma)' AS tabla,
    COUNT(*) AS total_registros
FROM public."User"

UNION ALL

SELECT
    'public.users (snake_case)' AS tabla,
    COUNT(*) AS total_registros
FROM public.users

UNION ALL

SELECT
    'public.user_profiles' AS tabla,
    COUNT(*) AS total_registros
FROM public.user_profiles

ORDER BY tabla;

\echo ''
\echo '============================================================================'

-- ============================================================================
-- SECCIÓN 2: VERIFICAR SI EXISTEN AMBAS TABLAS (User vs users)
-- ============================================================================

\echo ''
\echo '--- 2. VERIFICAR EXISTENCIA DE TABLAS ---'
\echo ''

SELECT
    table_name,
    table_type
FROM information_schema.tables
WHERE table_schema = 'public'
    AND table_name IN ('User', 'users', 'profiles', 'user_profiles')
ORDER BY table_name;

\echo ''
\echo '============================================================================'

-- ============================================================================
-- SECCIÓN 3: USUARIOS EN auth.users
-- ============================================================================

\echo ''
\echo '--- 3. USUARIOS EN auth.users (Supabase Auth) ---'
\echo ''

SELECT
    id,
    email,
    created_at,
    email_confirmed_at,
    last_sign_in_at,
    raw_user_meta_data->>'name' AS metadata_name,
    raw_user_meta_data->>'userType' AS metadata_userType,
    raw_user_meta_data->>'companyName' AS metadata_companyName
FROM auth.users
ORDER BY created_at DESC;

\echo ''
\echo '============================================================================'

-- ============================================================================
-- SECCIÓN 4: USUARIOS EN public.profiles (Bootstrap)
-- ============================================================================

\echo ''
\echo '--- 4. USUARIOS EN public.profiles (Bootstrap Supabase) ---'
\echo ''

SELECT
    id,
    full_name,
    avatar_url,
    created_at,
    updated_at
FROM public.profiles
ORDER BY created_at DESC;

\echo ''
\echo '============================================================================'

-- ============================================================================
-- SECCIÓN 5: USUARIOS EN public.User o public.users (Custom Table)
-- ============================================================================

\echo ''
\echo '--- 5. USUARIOS EN public.User (Prisma CamelCase) ---'
\echo ''

-- Intentar con "User" (CamelCase)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'User'
    ) THEN
        RAISE NOTICE 'Tabla public."User" existe';
        -- No podemos hacer SELECT aquí, lo hacemos fuera del bloque
    ELSE
        RAISE NOTICE 'Tabla public."User" NO existe';
    END IF;
END $$;

SELECT
    id,
    name,
    email,
    phone,
    "userType" AS user_type,
    "companyName" AS company_name,
    avatar,
    "createdAt" AS created_at
FROM public."User"
ORDER BY "createdAt" DESC;

\echo ''
\echo '--- 5b. USUARIOS EN public.users (snake_case) ---'
\echo ''

-- Intentar con "users" (snake_case)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'users'
    ) THEN
        RAISE NOTICE 'Tabla public.users existe';
    ELSE
        RAISE NOTICE 'Tabla public.users NO existe';
    END IF;
END $$;

SELECT
    id,
    name,
    email,
    phone,
    user_type,
    company_name,
    avatar,
    profile_image,
    logo_url,
    created_at
FROM public.users
ORDER BY created_at DESC;

\echo ''
\echo '============================================================================'

-- ============================================================================
-- SECCIÓN 6: USUARIOS EN user_profiles (Módulo Comunidad)
-- ============================================================================

\echo ''
\echo '--- 6. USUARIOS EN user_profiles (Módulo Comunidad) ---'
\echo ''

SELECT
    id,
    "userId" AS user_id,
    role,
    city,
    "createdAt" AS created_at,
    "updatedAt" AS updated_at
FROM public.user_profiles
ORDER BY "createdAt" DESC;

\echo ''
\echo '============================================================================'

-- ============================================================================
-- SECCIÓN 7: ANÁLISIS DE SINCRONIZACIÓN - USUARIOS HUÉRFANOS
-- ============================================================================

\echo ''
\echo '--- 7. USUARIOS EN auth.users PERO NO EN users (PROBLEMA) ---'
\echo ''

-- Usuarios que existen en auth.users pero NO en la tabla custom
SELECT
    au.id,
    au.email,
    au.created_at AS auth_created_at,
    au.raw_user_meta_data->>'name' AS metadata_name,
    au.raw_user_meta_data->>'userType' AS metadata_userType,
    'MISSING_IN_USERS_TABLE' AS status
FROM auth.users au
LEFT JOIN public."User" u ON au.id::text = u.id
WHERE u.id IS NULL
ORDER BY au.created_at DESC;

\echo ''
\echo '--- 7b. USUARIOS EN auth.users PERO NO EN users (snake_case check) ---'
\echo ''

SELECT
    au.id,
    au.email,
    au.created_at AS auth_created_at,
    au.raw_user_meta_data->>'name' AS metadata_name,
    'MISSING_IN_USERS_TABLE' AS status
FROM auth.users au
LEFT JOIN public.users u ON au.id::text = u.id
WHERE u.id IS NULL
ORDER BY au.created_at DESC;

\echo ''
\echo '============================================================================'

-- ============================================================================
-- SECCIÓN 8: VERIFICAR USER_ID ESPECÍFICO DEL ERROR
-- ============================================================================

\echo ''
\echo '--- 8. VERIFICAR USER_ID ESPECÍFICO: 6403f9d2-e846-4c70-87e0-e051127d9500 ---'
\echo ''

\echo '8a. En auth.users:'
SELECT
    id,
    email,
    created_at,
    raw_user_meta_data
FROM auth.users
WHERE id = '6403f9d2-e846-4c70-87e0-e051127d9500';

\echo ''
\echo '8b. En public.profiles:'
SELECT
    id,
    full_name,
    avatar_url,
    created_at
FROM public.profiles
WHERE id = '6403f9d2-e846-4c70-87e0-e051127d9500';

\echo ''
\echo '8c. En public."User" (CamelCase):'
SELECT
    id,
    name,
    email,
    "userType"
FROM public."User"
WHERE id = '6403f9d2-e846-4c70-87e0-e051127d9500';

\echo ''
\echo '8d. En public.users (snake_case):'
SELECT
    id,
    name,
    email,
    user_type
FROM public.users
WHERE id = '6403f9d2-e846-4c70-87e0-e051127d9500';

\echo ''
\echo '8e. En public.user_profiles:'
SELECT
    id,
    "userId",
    role,
    city
FROM public.user_profiles
WHERE "userId" = '6403f9d2-e846-4c70-87e0-e051127d9500';

\echo ''
\echo '============================================================================'

-- ============================================================================
-- SECCIÓN 9: VERIFICAR SCHEMA DE COLUMNAS DE CADA TABLA
-- ============================================================================

\echo ''
\echo '--- 9. SCHEMA DE COLUMNAS DE public.User ---'
\echo ''

SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name = 'User'
ORDER BY ordinal_position;

\echo ''
\echo '--- 9b. SCHEMA DE COLUMNAS DE public.users ---'
\echo ''

SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name = 'users'
ORDER BY ordinal_position;

\echo ''
\echo '--- 9c. SCHEMA DE COLUMNAS DE public.profiles ---'
\echo ''

SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name = 'profiles'
ORDER BY ordinal_position;

\echo ''
\echo '--- 9d. SCHEMA DE COLUMNAS DE public.user_profiles ---'
\echo ''

SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name = 'user_profiles'
ORDER BY ordinal_position;

\echo ''
\echo '============================================================================'

-- ============================================================================
-- SECCIÓN 10: POLÍTICAS RLS ACTIVAS
-- ============================================================================

\echo ''
\echo '--- 10. POLÍTICAS RLS EN TABLAS DE USUARIOS ---'
\echo ''

SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual AS using_expression,
    with_check AS with_check_expression
FROM pg_policies
WHERE schemaname = 'public'
    AND tablename IN ('User', 'users', 'profiles', 'user_profiles')
ORDER BY tablename, policyname;

\echo ''
\echo '============================================================================'

-- ============================================================================
-- SECCIÓN 11: TRIGGERS ACTIVOS
-- ============================================================================

\echo ''
\echo '--- 11. TRIGGERS EN TABLAS DE USUARIOS ---'
\echo ''

SELECT
    trigger_schema,
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement,
    action_timing
FROM information_schema.triggers
WHERE trigger_schema = 'public'
    AND event_object_table IN ('User', 'users', 'profiles', 'user_profiles')
ORDER BY event_object_table, trigger_name;

\echo ''
\echo '--- 11b. TRIGGERS EN auth.users ---'
\echo ''

SELECT
    trigger_schema,
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement,
    action_timing
FROM information_schema.triggers
WHERE trigger_schema = 'auth'
    AND event_object_table = 'users'
ORDER BY trigger_name;

\echo ''
\echo '============================================================================'

-- ============================================================================
-- SECCIÓN 12: RESUMEN EJECUTIVO
-- ============================================================================

\echo ''
\echo '--- 12. RESUMEN EJECUTIVO ---'
\echo ''

WITH auth_count AS (
    SELECT COUNT(*) AS total FROM auth.users
),
profiles_count AS (
    SELECT COUNT(*) AS total FROM public.profiles
),
user_camel_count AS (
    SELECT COUNT(*) AS total FROM public."User"
),
user_snake_count AS (
    SELECT COUNT(*) AS total FROM public.users
),
user_profiles_count AS (
    SELECT COUNT(*) AS total FROM public.user_profiles
),
orphan_users AS (
    SELECT COUNT(*) AS total
    FROM auth.users au
    LEFT JOIN public."User" u ON au.id::text = u.id
    WHERE u.id IS NULL
)

SELECT
    'Total usuarios en auth.users' AS metrica,
    (SELECT total FROM auth_count) AS valor
UNION ALL
SELECT
    'Total usuarios en profiles',
    (SELECT total FROM profiles_count)
UNION ALL
SELECT
    'Total usuarios en User (CamelCase)',
    (SELECT total FROM user_camel_count)
UNION ALL
SELECT
    'Total usuarios en users (snake_case)',
    (SELECT total FROM user_snake_count)
UNION ALL
SELECT
    'Total perfiles en user_profiles',
    (SELECT total FROM user_profiles_count)
UNION ALL
SELECT
    'Usuarios HUÉRFANOS (auth sin users)',
    (SELECT total FROM orphan_users)
UNION ALL
SELECT
    'Sincronización auth→profiles',
    CASE
        WHEN (SELECT total FROM auth_count) = (SELECT total FROM profiles_count)
        THEN 'OK ✓'
        ELSE 'DESINCRONIZADO ✗'
    END
UNION ALL
SELECT
    'Sincronización auth→users',
    CASE
        WHEN (SELECT total FROM orphan_users) = 0
        THEN 'OK ✓'
        ELSE 'DESINCRONIZADO ✗'
    END;

\echo ''
\echo '============================================================================'
\echo 'AUDITORÍA COMPLETADA'
\echo '============================================================================'
