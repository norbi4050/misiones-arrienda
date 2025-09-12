-- =====================================================
-- AUDITORÍA COMPLETA SUPABASE - DIAGNÓSTICO PERMISSION DENIED
-- =====================================================
-- Ejecuta estas consultas en el SQL Editor de Supabase
-- Copia y pega los resultados para análisis completo

-- =====================================================
-- 1. INFORMACIÓN GENERAL DEL ESQUEMA
-- =====================================================

-- 1.1 Listar todas las tablas en el esquema público
SELECT 
    schemaname,
    tablename,
    tableowner,
    hasindexes,
    hasrules,
    hastriggers,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- 1.2 Verificar si RLS está habilitado en tablas críticas
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('User', 'users', 'profiles', 'Property', 'properties')
ORDER BY tablename;

-- =====================================================
-- 2. ESTRUCTURA DE LA TABLA USER
-- =====================================================

-- 2.1 Verificar si la tabla User existe y su estructura
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'User'
ORDER BY ordinal_position;

-- 2.2 Verificar constraints en tabla User
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    tc.is_deferrable,
    tc.initially_deferred
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_schema = 'public' 
AND tc.table_name = 'User'
ORDER BY tc.constraint_type, tc.constraint_name;

-- =====================================================
-- 3. POLÍTICAS RLS ACTUALES
-- =====================================================

-- 3.1 Listar todas las políticas RLS en tabla User
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
WHERE schemaname = 'public' 
AND tablename = 'User'
ORDER BY policyname;

-- 3.2 Verificar políticas en otras tablas relacionadas
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('profiles', 'users', 'Property', 'properties')
ORDER BY tablename, policyname;

-- =====================================================
-- 4. PERMISOS Y ROLES
-- =====================================================

-- 4.1 Verificar permisos en tabla User
SELECT 
    grantee,
    table_schema,
    table_name,
    privilege_type,
    is_grantable
FROM information_schema.table_privileges 
WHERE table_schema = 'public' 
AND table_name = 'User'
ORDER BY grantee, privilege_type;

-- 4.2 Verificar roles disponibles
SELECT 
    rolname,
    rolsuper,
    rolinherit,
    rolcreaterole,
    rolcreatedb,
    rolcanlogin,
    rolreplication
FROM pg_roles 
WHERE rolname IN ('anon', 'authenticated', 'service_role', 'supabase_admin')
ORDER BY rolname;

-- =====================================================
-- 5. CONTENIDO DE TABLAS (MUESTRAS)
-- =====================================================

-- 5.1 Contar registros en tabla User
SELECT COUNT(*) as total_users FROM public."User";

-- 5.2 Mostrar primeros 5 registros de User (sin datos sensibles)
SELECT 
    id,
    name,
    email,
    verified,
    "userType",
    "createdAt",
    "updatedAt"
FROM public."User" 
ORDER BY "createdAt" DESC 
LIMIT 5;

-- 5.3 Verificar usuarios en auth.users vs User table
SELECT 
    'auth.users' as source,
    COUNT(*) as count
FROM auth.users
UNION ALL
SELECT 
    'public.User' as source,
    COUNT(*) as count
FROM public."User";

-- 5.4 Encontrar usuarios en auth.users sin perfil en User table
SELECT 
    au.id,
    au.email,
    au.created_at,
    CASE WHEN u.id IS NULL THEN 'MISSING_PROFILE' ELSE 'HAS_PROFILE' END as profile_status
FROM auth.users au
LEFT JOIN public."User" u ON au.id::text = u.id
WHERE u.id IS NULL
LIMIT 10;

-- =====================================================
-- 6. DIAGNÓSTICO DE ERRORES ESPECÍFICOS
-- =====================================================

-- 6.1 Verificar si hay problemas con tipos de datos
SELECT 
    column_name,
    data_type,
    udt_name
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'User'
AND column_name = 'id';

-- 6.2 Verificar índices en tabla User
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename = 'User'
ORDER BY indexname;

-- =====================================================
-- 7. CONFIGURACIÓN DE SUPABASE AUTH
-- =====================================================

-- 7.1 Verificar configuración de auth
SELECT 
    id,
    email,
    email_confirmed_at,
    created_at,
    updated_at,
    last_sign_in_at
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 5;

-- 7.2 Verificar identities
SELECT 
    user_id,
    provider,
    created_at,
    updated_at
FROM auth.identities 
ORDER BY created_at DESC 
LIMIT 5;

-- =====================================================
-- 8. PRUEBAS DE PERMISOS
-- =====================================================

-- 8.1 Intentar SELECT como usuario anónimo (puede fallar)
-- SET ROLE anon;
-- SELECT COUNT(*) FROM public."User";
-- RESET ROLE;

-- 8.2 Verificar función auth.uid()
SELECT 
    auth.uid() as current_user_id,
    auth.role() as current_role;

-- =====================================================
-- 9. INFORMACIÓN ADICIONAL PARA DEBUGGING
-- =====================================================

-- 9.1 Verificar extensiones instaladas
SELECT 
    extname,
    extversion
FROM pg_extension 
WHERE extname IN ('uuid-ossp', 'pgcrypto', 'pgjwt');

-- 9.2 Verificar funciones relacionadas con auth
SELECT 
    proname,
    pronamespace::regnamespace,
    prokind
FROM pg_proc 
WHERE proname LIKE '%auth%' 
OR proname LIKE '%uid%'
ORDER BY proname;

-- =====================================================
-- 10. RESUMEN PARA COPY-PASTE
-- =====================================================

-- INSTRUCCIONES:
-- 1. Ejecuta cada sección por separado en Supabase SQL Editor
-- 2. Copia los resultados de cada consulta
-- 3. Pega los resultados en un documento o mensaje
-- 4. Incluye cualquier mensaje de error que aparezca

-- SECCIONES CRÍTICAS (ejecutar primero):
-- - Sección 1: Información general del esquema
-- - Sección 2: Estructura de tabla User  
-- - Sección 3: Políticas RLS actuales
-- - Sección 5: Contenido de tablas

-- Si alguna consulta falla con "permission denied", anota exactamente:
-- - Qué consulta falló
-- - El mensaje de error completo
-- - Tu rol actual en Supabase (admin, owner, etc.)

-- =====================================================
-- CONSULTAS RÁPIDAS PARA DIAGNÓSTICO INMEDIATO
-- =====================================================

-- CONSULTA RÁPIDA 1: ¿Existe la tabla User?
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'User'
) as user_table_exists;

-- CONSULTA RÁPIDA 2: ¿Está RLS habilitado?
SELECT 
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'User';

-- CONSULTA RÁPIDA 3: ¿Cuántas políticas RLS hay?
SELECT COUNT(*) as rls_policies_count
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'User';

-- CONSULTA RÁPIDA 4: ¿Hay usuarios sin perfil?
SELECT 
    (SELECT COUNT(*) FROM auth.users) as auth_users_count,
    (SELECT COUNT(*) FROM public."User") as profile_users_count,
    (SELECT COUNT(*) FROM auth.users au LEFT JOIN public."User" u ON au.id::text = u.id WHERE u.id IS NULL) as missing_profiles_count;

-- =====================================================
-- FIN DEL SCRIPT DE AUDITORÍA
-- =====================================================
