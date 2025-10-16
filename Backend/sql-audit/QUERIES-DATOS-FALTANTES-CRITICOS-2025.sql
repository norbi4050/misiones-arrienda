-- ============================================================================
-- QUERIES PARA OBTENER DATOS FALTANTES CRÍTICOS
-- Proyecto: Misiones Arrienda
-- Fecha: 15 de Enero 2025
-- Propósito: Completar el inventario de Supabase con datos específicos
-- ============================================================================

\echo '============================================================================'
\echo 'QUERIES PARA DATOS FALTANTES CRÍTICOS'
\echo '============================================================================'
\echo ''

-- ============================================================================
-- QUERY 1: Estructura completa de tablas community_*
-- ============================================================================

\echo '--- QUERY 1: Estructura de community_profiles ---'
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name = 'community_profiles'
ORDER BY ordinal_position;

\echo ''
\echo '--- QUERY 2: Estructura de community_conversations ---'
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name = 'community_conversations'
ORDER BY ordinal_position;

\echo ''
\echo '--- QUERY 3: Estructura de community_messages ---'
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name = 'community_messages'
ORDER BY ordinal_position;

-- ============================================================================
-- QUERY 4: Estructura de tablas de mensajería legacy
-- ============================================================================

\echo ''
\echo '--- QUERY 4: Estructura de conversations ---'
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name = 'conversations'
ORDER BY ordinal_position;

\echo ''
\echo '--- QUERY 5: Estructura de messages ---'
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name = 'messages'
ORDER BY ordinal_position;

\echo ''
\echo '--- QUERY 6: Estructura de message_attachments ---'
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name = 'message_attachments'
ORDER BY ordinal_position;

-- ============================================================================
-- QUERY 7: Datos reales de tablas críticas
-- ============================================================================

\echo ''
\echo '--- QUERY 7: Contenido de tabla User (Prisma) ---'
SELECT 
    id,
    name,
    email,
    phone,
    avatar,
    "userType",
    "companyName",
    is_online,
    last_seen,
    "createdAt"
FROM public."User"
ORDER BY "createdAt" DESC;

\echo ''
\echo '--- QUERY 8: Contenido de tabla users (Legacy) ---'
SELECT 
    id,
    name,
    email,
    phone,
    user_type,
    company_name,
    is_company,
    profile_image,
    logo_url,
    created_at
FROM public.users
ORDER BY created_at DESC;

\echo ''
\echo '--- QUERY 9: Contenido de community_profiles ---'
SELECT 
    id,
    user_id,
    display_name,
    role,
    city,
    budget_min,
    budget_max,
    is_suspended,
    created_at
FROM public.community_profiles
ORDER BY created_at DESC
LIMIT 10;

-- ============================================================================
-- QUERY 10: Verificar sincronización entre auth.users y tablas públicas
-- ============================================================================

\echo ''
\echo '--- QUERY 10: Usuarios en auth.users vs User vs users ---'
SELECT 
    au.id AS auth_id,
    au.email AS auth_email,
    u1.id AS user_prisma_id,
    u1.name AS user_prisma_name,
    u2.id AS users_legacy_id,
    u2.name AS users_legacy_name,
    CASE 
        WHEN u1.id IS NOT NULL AND u2.id IS NOT NULL THEN 'Ambas tablas'
        WHEN u1.id IS NOT NULL THEN 'Solo User (Prisma)'
        WHEN u2.id IS NOT NULL THEN 'Solo users (Legacy)'
        ELSE 'Ninguna tabla pública'
    END AS estado_sincronizacion
FROM auth.users au
LEFT JOIN public."User" u1 ON au.id::text = u1.id
LEFT JOIN public.users u2 ON au.id::text = u2.id
ORDER BY au.created_at DESC;

-- ============================================================================
-- QUERY 11: Verificar perfiles de comunidad
-- ============================================================================

\echo ''
\echo '--- QUERY 11: Usuarios con/sin perfil de comunidad ---'
SELECT 
    au.id,
    au.email,
    cp.id AS community_profile_id,
    cp.role,
    cp.city,
    CASE 
        WHEN cp.id IS NOT NULL THEN 'Tiene perfil'
        ELSE 'Sin perfil'
    END AS estado_perfil
FROM auth.users au
LEFT JOIN public.community_profiles cp ON au.id = cp.user_id
ORDER BY au.created_at DESC;

-- ============================================================================
-- QUERY 12: Conteo de registros por tabla crítica
-- ============================================================================

\echo ''
\echo '--- QUERY 12: Conteo de registros en tablas críticas ---'
SELECT 'auth.users' AS tabla, COUNT(*)::TEXT AS registros FROM auth.users
UNION ALL
SELECT 'User (Prisma)', COUNT(*)::TEXT FROM public."User"
UNION ALL
SELECT 'users (Legacy)', COUNT(*)::TEXT FROM public.users
UNION ALL
SELECT 'community_profiles', COUNT(*)::TEXT FROM public.community_profiles
UNION ALL
SELECT 'community_conversations', COUNT(*)::TEXT FROM public.community_conversations
UNION ALL
SELECT 'community_messages', COUNT(*)::TEXT FROM public.community_messages
UNION ALL
SELECT 'conversations', COUNT(*)::TEXT FROM public.conversations
UNION ALL
SELECT 'messages', COUNT(*)::TEXT FROM public.messages
UNION ALL
SELECT 'message_attachments', COUNT(*)::TEXT FROM public.message_attachments
UNION ALL
SELECT 'properties', COUNT(*)::TEXT FROM public.properties
UNION ALL
SELECT 'Property (Prisma)', COUNT(*)::TEXT FROM public."Property"
UNION ALL
SELECT 'favorites', COUNT(*)::TEXT FROM public.favorites
UNION ALL
SELECT 'Favorite (Prisma)', COUNT(*)::TEXT FROM public."Favorite";

-- ============================================================================
-- QUERY 13: Verificar tipos de ID en tablas críticas
-- ============================================================================

\echo ''
\echo '--- QUERY 13: Tipos de columna ID en tablas críticas ---'
SELECT 
    table_name,
    column_name,
    data_type,
    udt_name
FROM information_schema.columns
WHERE table_schema = 'public'
    AND column_name IN ('id', 'user_id', 'userId')
    AND table_name IN (
        'User', 'users', 'community_profiles', 'community_conversations',
        'community_messages', 'conversations', 'messages', 'message_attachments',
        'properties', 'Property'
    )
ORDER BY table_name, column_name;

-- ============================================================================
-- QUERY 14: Políticas RLS de storage.objects
-- ============================================================================

\echo ''
\echo '--- QUERY 14: Políticas de Storage ---'
SELECT 
    bucket_id,
    name AS policy_name,
    definition,
    check_expression
FROM storage.policies
ORDER BY bucket_id, name;

-- Si la tabla storage.policies no existe, intentar alternativa:
\echo ''
\echo '--- QUERY 14b: Políticas de Storage (alternativa) ---'
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd,
    qual
FROM pg_policies
WHERE schemaname = 'storage'
ORDER BY tablename, policyname;

-- ============================================================================
-- QUERY 15: Archivos en buckets de storage
-- ============================================================================

\echo ''
\echo '--- QUERY 15: Conteo de archivos por bucket ---'
SELECT 
    bucket_id,
    COUNT(*) AS total_files,
    SUM((metadata->>'size')::BIGINT) AS total_size_bytes,
    pg_size_pretty(SUM((metadata->>'size')::BIGINT)) AS total_size_readable
FROM storage.objects
GROUP BY bucket_id
ORDER BY total_files DESC;

-- ============================================================================
-- QUERY 16: Verificar enums existentes
-- ============================================================================

\echo ''
\echo '--- QUERY 16: Enums definidos ---'
SELECT 
    t.typname AS enum_name,
    e.enumlabel AS enum_value,
    e.enumsortorder AS sort_order
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
JOIN pg_namespace n ON t.typnamespace = n.oid
WHERE n.nspname = 'public'
ORDER BY t.typname, e.enumsortorder;

-- ============================================================================
-- QUERY 17: Verificar views existentes
-- ============================================================================

\echo ''
\echo '--- QUERY 17: Views definidas ---'
SELECT 
    table_schema,
    table_name AS view_name,
    view_definition
FROM information_schema.views
WHERE table_schema = 'public'
ORDER BY table_name;

-- ============================================================================
-- QUERY 18: Datos de ejemplo de tablas críticas
-- ============================================================================

\echo ''
\echo '--- QUERY 18: Muestra de community_profiles (primeros 5) ---'
SELECT * FROM public.community_profiles
ORDER BY created_at DESC
LIMIT 5;

\echo ''
\echo '--- QUERY 19: Muestra de properties (primeros 5) ---'
SELECT 
    id,
    title,
    price,
    city,
    status,
    user_id,
    created_at
FROM public.properties
ORDER BY created_at DESC
LIMIT 5;

\echo ''
\echo '--- QUERY 20: Muestra de Property Prisma (primeros 5) ---'
SELECT 
    id,
    title,
    price,
    city,
    status,
    "userId",
    "createdAt"
FROM public."Property"
ORDER BY "createdAt" DESC
LIMIT 5;

-- ============================================================================
-- QUERY 21: Verificar datos huérfanos
-- ============================================================================

\echo ''
\echo '--- QUERY 21: Usuarios en User sin auth.users ---'
SELECT 
    u.id,
    u.email,
    u.name,
    'Usuario huérfano en User' AS problema
FROM public."User" u
WHERE NOT EXISTS (
    SELECT 1 FROM auth.users au WHERE au.id::text = u.id
);

\echo ''
\echo '--- QUERY 22: Usuarios en users sin auth.users ---'
SELECT 
    u.id,
    u.email,
    u.name,
    'Usuario huérfano en users' AS problema
FROM public.users u
WHERE NOT EXISTS (
    SELECT 1 FROM auth.users au WHERE au.id::text = u.id
);

\echo ''
\echo '--- QUERY 23: Perfiles de comunidad sin usuario ---'
SELECT 
    cp.id,
    cp.user_id,
    cp.display_name,
    'Perfil sin usuario en auth.users' AS problema
FROM public.community_profiles cp
WHERE NOT EXISTS (
    SELECT 1 FROM auth.users au WHERE au.id = cp.user_id
);

-- ============================================================================
-- QUERY 24: Verificar configuración de realtime
-- ============================================================================

\echo ''
\echo '--- QUERY 24: Tablas con realtime habilitado ---'
SELECT 
    schemaname,
    tablename,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_publication_tables pt
            WHERE pt.schemaname = pg_tables.schemaname
            AND pt.tablename = pg_tables.tablename
        ) THEN 'Habilitado'
        ELSE 'Deshabilitado'
    END AS realtime_status
FROM pg_tables
WHERE schemaname = 'public'
    AND tablename IN (
        'User', 'users', 'community_profiles', 'community_conversations',
        'community_messages', 'conversations', 'messages', 'properties'
    )
ORDER BY tablename;

-- ============================================================================
-- QUERY 25: Verificar índices de performance críticos
-- ============================================================================

\echo ''
\echo '--- QUERY 25: Índices en columnas de búsqueda frecuente ---'
SELECT 
    t.tablename,
    i.indexname,
    a.attname AS column_name,
    am.amname AS index_type
FROM pg_indexes i
JOIN pg_class c ON c.relname = i.indexname
JOIN pg_am am ON am.oid = c.relam
JOIN pg_attribute a ON a.attrelid = c.oid
JOIN pg_tables t ON t.tablename = i.tablename
WHERE i.schemaname = 'public'
    AND t.tablename IN ('users', 'properties', 'community_profiles')
    AND a.attname IN ('email', 'user_id', 'city', 'status', 'user_type')
ORDER BY t.tablename, i.indexname;

-- ============================================================================
-- QUERY 26: Verificar secuencias y auto-increment
-- ============================================================================

\echo ''
\echo '--- QUERY 26: Secuencias definidas ---'
SELECT 
    sequence_schema,
    sequence_name,
    data_type,
    start_value,
    minimum_value,
    maximum_value,
    increment
FROM information_schema.sequences
WHERE sequence_schema = 'public'
ORDER BY sequence_name;

-- ============================================================================
-- QUERY 27: Verificar permisos de roles
-- ============================================================================

\echo ''
\echo '--- QUERY 27: Roles y permisos en tablas críticas ---'
SELECT 
    grantee,
    table_schema,
    table_name,
    privilege_type
FROM information_schema.table_privileges
WHERE table_schema = 'public'
    AND table_name IN ('User', 'users', 'community_profiles', 'properties')
    AND grantee IN ('postgres', 'authenticated', 'anon', 'service_role')
ORDER BY table_name, grantee, privilege_type;

-- ============================================================================
-- QUERY 28: Verificar tamaño de tablas
-- ============================================================================

\echo ''
\echo '--- QUERY 28: Tamaño de tablas críticas ---'
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS total_size,
    pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) AS table_size,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) AS indexes_size
FROM pg_tables
WHERE schemaname = 'public'
    AND tablename IN (
        'User', 'users', 'community_profiles', 'properties', 
        'Property', 'messages', 'community_messages'
    )
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- ============================================================================
-- QUERY 29: Verificar datos en tablas Prisma vs Legacy
-- ============================================================================

\echo ''
\echo '--- QUERY 29: Comparación de datos User vs users ---'
WITH user_comparison AS (
    SELECT 
        COALESCE(u1.id, u2.id) AS user_id,
        COALESCE(u1.email, u2.email) AS email,
        u1.id IS NOT NULL AS en_user_prisma,
        u2.id IS NOT NULL AS en_users_legacy,
        u1.name AS nombre_prisma,
        u2.name AS nombre_legacy,
        u1."userType" AS tipo_prisma,
        u2.user_type AS tipo_legacy
    FROM public."User" u1
    FULL OUTER JOIN public.users u2 ON u1.id = u2.id
)
SELECT 
    user_id,
    email,
    en_user_prisma,
    en_users_legacy,
    CASE 
        WHEN en_user_prisma AND en_users_legacy THEN 'Duplicado'
        WHEN en_user_prisma THEN 'Solo Prisma'
        WHEN en_users_legacy THEN 'Solo Legacy'
    END AS estado,
    nombre_prisma,
    nombre_legacy,
    tipo_prisma,
    tipo_legacy
FROM user_comparison
ORDER BY user_id;

-- ============================================================================
-- QUERY 30: Verificar integridad referencial
-- ============================================================================

\echo ''
\echo '--- QUERY 30: Propiedades sin usuario válido ---'
SELECT 
    p.id,
    p.title,
    p.user_id,
    'Propiedad sin usuario en users' AS problema
FROM public.properties p
WHERE NOT EXISTS (
    SELECT 1 FROM public.users u WHERE u.id = p.user_id
)
LIMIT 10;

\echo ''
\echo '--- QUERY 31: Conversaciones sin participantes válidos ---'
SELECT 
    c.id,
    c.participant_1,
    c.participant_2,
    CASE 
        WHEN NOT EXISTS (SELECT 1 FROM users WHERE id = c.participant_1) THEN 'participant_1 inválido'
        WHEN NOT EXISTS (SELECT 1 FROM users WHERE id = c.participant_2) THEN 'participant_2 inválido'
        ELSE 'Ambos inválidos'
    END AS problema
FROM public.conversations c
WHERE NOT EXISTS (SELECT 1 FROM users WHERE id = c.participant_1)
   OR NOT EXISTS (SELECT 1 FROM users WHERE id = c.participant_2)
LIMIT 10;

-- ============================================================================
-- QUERY 32: Verificar configuración de auth
-- ============================================================================

\echo ''
\echo '--- QUERY 32: Configuración de auth.users ---'
SELECT 
    COUNT(*) AS total_usuarios,
    COUNT(CASE WHEN email_confirmed_at IS NOT NULL THEN 1 END) AS emails_confirmados,
    COUNT(CASE WHEN phone_confirmed_at IS NOT NULL THEN 1 END) AS telefonos_confirmados,
    COUNT(CASE WHEN last_sign_in_at IS NOT NULL THEN 1 END) AS usuarios_activos,
    COUNT(CASE WHEN is_super_admin THEN 1 END) AS super_admins,
    MIN(created_at) AS primer_usuario,
    MAX(created_at) AS ultimo_usuario,
    MAX(last_sign_in_at) AS ultimo_login
FROM auth.users;

-- ============================================================================
-- QUERY 33: Verificar datos de los 2 usuarios actuales
-- ============================================================================

\echo ''
\echo '--- QUERY 33: Datos completos de Cesar (Inmobiliaria) ---'
SELECT 
    'auth.users' AS fuente,
    au.id,
    au.email,
    au.raw_user_meta_data,
    au.created_at
FROM auth.users au
WHERE au.id = 'a4ef1f3d-c3e8-46df-b186-5b5c837cc14b'
UNION ALL
SELECT 
    'User (Prisma)',
    u.id,
    u.email,
    jsonb_build_object(
        'name', u.name,
        'userType', u."userType",
        'companyName', u."companyName"
    ),
    u."createdAt"
FROM public."User" u
WHERE u.id = 'a4ef1f3d-c3e8-46df-b186-5b5c837cc14b'
UNION ALL
SELECT 
    'users (Legacy)',
    u.id,
    u.email,
    jsonb_build_object(
        'name', u.name,
        'user_type', u.user_type,
        'company_name', u.company_name,
        'is_company', u.is_company
    ),
    u.created_at
FROM public.users u
WHERE u.id = 'a4ef1f3d-c3e8-46df-b186-5b5c837cc14b';

\echo ''
\echo '--- QUERY 34: Datos completos de Carlos (Inquilino) ---'
SELECT 
    'auth.users' AS fuente,
    au.id,
    au.email,
    au.raw_user_meta_data,
    au.created_at
FROM auth.users au
WHERE au.id = '6403f9d2-e846-4c70-87e0-e051127d9500'
UNION ALL
SELECT 
    'User (Prisma)',
    u.id,
    u.email,
    jsonb_build_object(
        'name', u.name,
        'userType', u."userType"
    ),
    u."createdAt"
FROM public."User" u
WHERE u.id = '6403f9d2-e846-4c70-87e0-e051127d9500'
UNION ALL
SELECT 
    'users (Legacy)',
    u.id,
    u.email,
    jsonb_build_object(
        'name', u.name,
        'user_type', u.user_type
    ),
    u.created_at
FROM public.users u
WHERE u.id = '6403f9d2-e846-4c70-87e0-e051127d9500';

-- ============================================================================
-- QUERY 35: Verificar estructura completa de Property vs properties
-- ============================================================================

\echo ''
\echo '--- QUERY 35: Columnas de Property (Prisma) ---'
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name = 'Property'
ORDER BY ordinal_position;

\echo ''
\echo '--- QUERY 36: Columnas de properties (Legacy) ---'
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name = 'properties'
ORDER BY ordinal_position;

-- ============================================================================
-- FIN DE QUERIES
-- ============================================================================

\echo ''
\echo '============================================================================'
\echo 'QUERIES COMPLETADAS'
\echo '============================================================================'
\echo ''
\echo 'Ejecuta estas queries en Supabase SQL Editor y pega los resultados'
\echo 'para completar el inventario completo.'
\echo ''
