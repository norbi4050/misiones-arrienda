-- =====================================================
-- 🔍 INVESTIGACIÓN SUPABASE - DIAGNÓSTICO COMPLETO
-- =====================================================
-- Ejecuta estos SQLs uno por uno para investigar el estado actual

-- =====================================================
-- 1. VERIFICAR EXISTENCIA Y ESTRUCTURA DE TABLA USER
-- =====================================================

-- 1.1 Verificar si la tabla User existe
SELECT 
    table_name,
    table_schema,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND (table_name = 'User' OR table_name = 'users')
ORDER BY table_name;

-- 1.2 Ver estructura completa de la tabla User
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

-- 1.3 Verificar índices en la tabla User
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'User' 
AND schemaname = 'public';

-- =====================================================
-- 2. VERIFICAR ESTADO DE ROW LEVEL SECURITY (RLS)
-- =====================================================

-- 2.1 Verificar si RLS está habilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity,
    forcerowsecurity
FROM pg_tables 
WHERE tablename = 'User' 
AND schemaname = 'public';

-- 2.2 Ver todas las políticas RLS existentes
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
WHERE tablename = 'User' 
AND schemaname = 'public'
ORDER BY policyname;

-- 2.3 Ver políticas RLS en formato legible
SELECT 
    policyname as "Nombre de Política",
    cmd as "Comando",
    CASE 
        WHEN permissive = 'PERMISSIVE' THEN 'Permisiva'
        ELSE 'Restrictiva'
    END as "Tipo",
    roles as "Roles",
    qual as "Condición WHERE",
    with_check as "Condición CHECK"
FROM pg_policies 
WHERE tablename = 'User' 
AND schemaname = 'public'
ORDER BY policyname;

-- =====================================================
-- 3. VERIFICAR PERMISOS DE TABLA
-- =====================================================

-- 3.1 Ver permisos otorgados en la tabla User
SELECT 
    grantee as "Usuario/Rol",
    privilege_type as "Permiso",
    is_grantable as "Puede Otorgar"
FROM information_schema.role_table_grants 
WHERE table_name = 'User' 
AND table_schema = 'public'
ORDER BY grantee, privilege_type;

-- 3.2 Ver permisos específicos para roles importantes
SELECT 
    r.rolname as "Rol",
    CASE 
        WHEN r.rolsuper THEN 'Superusuario'
        WHEN r.rolcreaterole THEN 'Puede crear roles'
        WHEN r.rolcreatedb THEN 'Puede crear BD'
        ELSE 'Usuario normal'
    END as "Tipo de Rol"
FROM pg_roles r
WHERE r.rolname IN ('authenticated', 'anon', 'service_role', 'postgres')
ORDER BY r.rolname;

-- =====================================================
-- 4. VERIFICAR DATOS EXISTENTES
-- =====================================================

-- 4.1 Contar registros en la tabla User
SELECT 
    COUNT(*) as "Total de Usuarios",
    COUNT(CASE WHEN created_at > NOW() - INTERVAL '24 hours' THEN 1 END) as "Creados últimas 24h",
    COUNT(CASE WHEN updated_at > NOW() - INTERVAL '24 hours' THEN 1 END) as "Actualizados últimas 24h"
FROM public."User";

-- 4.2 Ver algunos registros de ejemplo (sin datos sensibles)
SELECT 
    id,
    name,
    email,
    created_at,
    updated_at,
    CASE WHEN profile_image IS NOT NULL THEN 'Sí' ELSE 'No' END as "Tiene Avatar"
FROM public."User"
ORDER BY created_at DESC
LIMIT 5;

-- =====================================================
-- 5. VERIFICAR CONFIGURACIÓN DE AUTENTICACIÓN
-- =====================================================

-- 5.1 Ver usuarios de auth.users (tabla de autenticación de Supabase)
SELECT 
    id,
    email,
    email_confirmed_at,
    created_at,
    updated_at,
    CASE WHEN email_confirmed_at IS NOT NULL THEN 'Verificado' ELSE 'No verificado' END as "Estado Email"
FROM auth.users
ORDER BY created_at DESC
LIMIT 5;

-- 5.2 Comparar usuarios entre auth.users y public.User
SELECT 
    'En auth.users pero NO en User' as "Estado",
    COUNT(*) as "Cantidad"
FROM auth.users au
LEFT JOIN public."User" u ON au.id::text = u.id
WHERE u.id IS NULL

UNION ALL

SELECT 
    'En User pero NO en auth.users' as "Estado",
    COUNT(*) as "Cantidad"
FROM public."User" u
LEFT JOIN auth.users au ON u.id = au.id::text
WHERE au.id IS NULL

UNION ALL

SELECT 
    'En ambas tablas' as "Estado",
    COUNT(*) as "Cantidad"
FROM public."User" u
INNER JOIN auth.users au ON u.id = au.id::text;

-- =====================================================
-- 6. VERIFICAR FUNCIONES Y TRIGGERS
-- =====================================================

-- 6.1 Ver triggers en la tabla User
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'User'
AND event_object_schema = 'public';

-- 6.2 Ver funciones relacionadas con auth
SELECT 
    routine_name,
    routine_type,
    routine_definition
FROM information_schema.routines
WHERE routine_schema = 'auth'
AND routine_name LIKE '%user%'
ORDER BY routine_name;

-- =====================================================
-- 7. PROBAR ACCESO CON DIFERENTES CONTEXTOS
-- =====================================================

-- 7.1 Verificar función auth.uid() (debería devolver NULL en SQL Editor)
SELECT 
    auth.uid() as "Usuario Actual (auth.uid)",
    auth.role() as "Rol Actual (auth.role)",
    current_user as "Usuario de BD",
    session_user as "Usuario de Sesión";

-- 7.2 Verificar configuración de JWT
SELECT 
    current_setting('request.jwt.claims', true) as "JWT Claims",
    current_setting('request.jwt.claim.sub', true) as "JWT Subject";

-- =====================================================
-- 8. VERIFICAR LOGS DE ERRORES (SI ESTÁN DISPONIBLES)
-- =====================================================

-- 8.1 Intentar ver logs recientes (puede no estar disponible)
SELECT 
    log_time,
    message,
    detail
FROM pg_log
WHERE message ILIKE '%User%'
AND log_time > NOW() - INTERVAL '1 hour'
ORDER BY log_time DESC
LIMIT 10;

-- =====================================================
-- RESUMEN DE COMANDOS PARA COPIAR Y PEGAR
-- =====================================================

/*
INSTRUCCIONES DE USO:

1. Ve a Supabase Dashboard > SQL Editor
2. Copia y pega cada sección por separado
3. Ejecuta una por una y guarda los resultados
4. Los resultados más importantes son:
   - Sección 1: Estructura de tabla
   - Sección 2: Estado de RLS y políticas
   - Sección 3: Permisos
   - Sección 5: Comparación auth.users vs User

5. Con estos resultados podremos determinar exactamente qué necesita ser corregido.
*/
