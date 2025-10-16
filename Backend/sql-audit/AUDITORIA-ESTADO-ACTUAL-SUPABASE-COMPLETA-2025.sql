-- ============================================================================
-- AUDITORÍA COMPLETA DEL ESTADO ACTUAL DE SUPABASE
-- Proyecto: Misiones Arrienda
-- Fecha: 15 de Enero 2025
-- Propósito: Inventario exhaustivo de TODA la configuración actual
-- ============================================================================
--
-- Este script genera un reporte completo de:
-- 1. Todas las tablas y sus columnas
-- 2. Todos los índices
-- 3. Todas las foreign keys
-- 4. Todas las políticas RLS
-- 5. Todos los triggers
-- 6. Todas las funciones
-- 7. Todos los buckets de storage
-- 8. Todos los usuarios en auth.users
-- 9. Extensiones habilitadas
-- 10. Schemas disponibles
--
-- ============================================================================

\echo '============================================================================'
\echo 'AUDITORÍA COMPLETA DE SUPABASE - ESTADO ACTUAL'
\echo 'Fecha: 2025-01-15'
\echo '============================================================================'
\echo ''

-- ============================================================================
-- SECCIÓN 1: INFORMACIÓN GENERAL DE LA BASE DE DATOS
-- ============================================================================

\echo '============================================================================'
\echo 'SECCIÓN 1: INFORMACIÓN GENERAL'
\echo '============================================================================'
\echo ''

\echo '--- 1.1 Versión de PostgreSQL ---'
SELECT version();

\echo ''
\echo '--- 1.2 Schemas Disponibles ---'
SELECT 
    schema_name,
    schema_owner
FROM information_schema.schemata
WHERE schema_name NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
ORDER BY schema_name;

\echo ''
\echo '--- 1.3 Extensiones Habilitadas ---'
SELECT 
    extname AS extension_name,
    extversion AS version,
    nspname AS schema
FROM pg_extension e
JOIN pg_namespace n ON e.extnamespace = n.oid
ORDER BY extname;

-- ============================================================================
-- SECCIÓN 2: TABLAS Y COLUMNAS
-- ============================================================================

\echo ''
\echo '============================================================================'
\echo 'SECCIÓN 2: TABLAS Y COLUMNAS'
\echo '============================================================================'
\echo ''

\echo '--- 2.1 Lista de Todas las Tablas en schema public ---'
SELECT 
    schemaname,
    tablename,
    tableowner,
    hasindexes,
    hasrules,
    hastriggers
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

\echo ''
\echo '--- 2.2 Detalle de Columnas por Tabla ---'
SELECT 
    table_schema,
    table_name,
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default,
    ordinal_position
FROM information_schema.columns
WHERE table_schema = 'public'
ORDER BY table_name, ordinal_position;

\echo ''
\echo '--- 2.3 Conteo de Registros por Tabla ---'
DO $$
DECLARE
    r RECORD;
    row_count INTEGER;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '--- Conteo de Registros ---';
    FOR r IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public'
        ORDER BY tablename
    LOOP
        EXECUTE format('SELECT COUNT(*) FROM public.%I', r.tablename) INTO row_count;
        RAISE NOTICE 'Tabla: % | Registros: %', r.tablename, row_count;
    END LOOP;
END $$;

-- ============================================================================
-- SECCIÓN 3: ÍNDICES
-- ============================================================================

\echo ''
\echo '============================================================================'
\echo 'SECCIÓN 3: ÍNDICES'
\echo '============================================================================'
\echo ''

\echo '--- 3.1 Todos los Índices ---'
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- ============================================================================
-- SECCIÓN 4: CONSTRAINTS (PRIMARY KEYS, FOREIGN KEYS, UNIQUE, CHECK)
-- ============================================================================

\echo ''
\echo '============================================================================'
\echo 'SECCIÓN 4: CONSTRAINTS'
\echo '============================================================================'
\echo ''

\echo '--- 4.1 Primary Keys ---'
SELECT
    tc.table_schema,
    tc.table_name,
    tc.constraint_name,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
WHERE tc.constraint_type = 'PRIMARY KEY'
    AND tc.table_schema = 'public'
ORDER BY tc.table_name;

\echo ''
\echo '--- 4.2 Foreign Keys ---'
SELECT
    tc.table_schema,
    tc.table_name,
    tc.constraint_name,
    kcu.column_name,
    ccu.table_schema AS foreign_table_schema,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    rc.update_rule,
    rc.delete_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
JOIN information_schema.referential_constraints AS rc
    ON rc.constraint_name = tc.constraint_name
    AND rc.constraint_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
ORDER BY tc.table_name, tc.constraint_name;

\echo ''
\echo '--- 4.3 Unique Constraints ---'
SELECT
    tc.table_schema,
    tc.table_name,
    tc.constraint_name,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
WHERE tc.constraint_type = 'UNIQUE'
    AND tc.table_schema = 'public'
ORDER BY tc.table_name;

\echo ''
\echo '--- 4.4 Check Constraints ---'
SELECT
    tc.table_schema,
    tc.table_name,
    tc.constraint_name,
    cc.check_clause
FROM information_schema.table_constraints tc
JOIN information_schema.check_constraints cc
    ON tc.constraint_name = cc.constraint_name
    AND tc.constraint_schema = cc.constraint_schema
WHERE tc.constraint_type = 'CHECK'
    AND tc.table_schema = 'public'
ORDER BY tc.table_name;

-- ============================================================================
-- SECCIÓN 5: ROW LEVEL SECURITY (RLS)
-- ============================================================================

\echo ''
\echo '============================================================================'
\echo 'SECCIÓN 5: ROW LEVEL SECURITY (RLS)'
\echo '============================================================================'
\echo ''

\echo '--- 5.1 Estado de RLS por Tabla ---'
SELECT 
    schemaname,
    tablename,
    rowsecurity AS rls_enabled,
    CASE 
        WHEN rowsecurity THEN 'HABILITADO'
        ELSE 'DESHABILITADO'
    END AS estado_rls
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

\echo ''
\echo '--- 5.2 Políticas RLS Configuradas ---'
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd AS command,
    qual AS using_expression,
    with_check AS with_check_expression
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ============================================================================
-- SECCIÓN 6: TRIGGERS
-- ============================================================================

\echo ''
\echo '============================================================================'
\echo 'SECCIÓN 6: TRIGGERS'
\echo '============================================================================'
\echo ''

\echo '--- 6.1 Todos los Triggers ---'
SELECT 
    trigger_schema,
    trigger_name,
    event_manipulation,
    event_object_schema,
    event_object_table,
    action_statement,
    action_timing,
    action_orientation
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- ============================================================================
-- SECCIÓN 7: FUNCIONES Y PROCEDIMIENTOS
-- ============================================================================

\echo ''
\echo '============================================================================'
\echo 'SECCIÓN 7: FUNCIONES Y PROCEDIMIENTOS'
\echo '============================================================================'
\echo ''

\echo '--- 7.1 Funciones Definidas por el Usuario ---'
SELECT 
    n.nspname AS schema_name,
    p.proname AS function_name,
    pg_get_function_arguments(p.oid) AS arguments,
    pg_get_functiondef(p.oid) AS definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
ORDER BY p.proname;

-- ============================================================================
-- SECCIÓN 8: STORAGE BUCKETS
-- ============================================================================

\echo ''
\echo '============================================================================'
\echo 'SECCIÓN 8: STORAGE BUCKETS'
\echo '============================================================================'
\echo ''

\echo '--- 8.1 Buckets Configurados ---'
SELECT 
    id,
    name,
    public,
    file_size_limit,
    allowed_mime_types,
    created_at,
    updated_at
FROM storage.buckets
ORDER BY name;

\echo ''
\echo '--- 8.2 Políticas de Storage ---'
SELECT 
    bucket_id,
    name AS policy_name,
    definition
FROM storage.policies
ORDER BY bucket_id, name;

-- ============================================================================
-- SECCIÓN 9: USUARIOS Y AUTENTICACIÓN
-- ============================================================================

\echo ''
\echo '============================================================================'
\echo 'SECCIÓN 9: USUARIOS Y AUTENTICACIÓN'
\echo '============================================================================'
\echo ''

\echo '--- 9.1 Usuarios en auth.users ---'
SELECT 
    id,
    email,
    email_confirmed_at,
    created_at,
    updated_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    role
FROM auth.users
ORDER BY created_at DESC;

\echo ''
\echo '--- 9.2 Conteo de Usuarios por Estado ---'
SELECT 
    CASE 
        WHEN email_confirmed_at IS NOT NULL THEN 'Confirmado'
        ELSE 'Sin Confirmar'
    END AS estado_email,
    COUNT(*) AS total
FROM auth.users
GROUP BY estado_email;

-- ============================================================================
-- SECCIÓN 10: DATOS ESPECÍFICOS DE TABLAS CRÍTICAS
-- ============================================================================

\echo ''
\echo '============================================================================'
\echo 'SECCIÓN 10: DATOS DE TABLAS CRÍTICAS'
\echo '============================================================================'
\echo ''

\echo '--- 10.1 Contenido de user_profiles (si existe) ---'
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_profiles') THEN
        RAISE NOTICE 'Tabla user_profiles encontrada. Mostrando contenido:';
        RAISE NOTICE '';
        PERFORM * FROM public.user_profiles;
    ELSE
        RAISE NOTICE 'Tabla user_profiles NO existe';
    END IF;
END $$;

-- Mostrar datos de user_profiles si existe
SELECT * FROM public.user_profiles 
WHERE EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_profiles')
LIMIT 100;

\echo ''
\echo '--- 10.2 Tipos de Datos de Columnas Críticas ---'
SELECT 
    table_name,
    column_name,
    data_type,
    udt_name,
    character_maximum_length,
    numeric_precision,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name IN ('user_profiles', 'User', 'UserProfile', 'users')
ORDER BY table_name, ordinal_position;

-- ============================================================================
-- SECCIÓN 11: ANÁLISIS DE RELACIONES
-- ============================================================================

\echo ''
\echo '============================================================================'
\echo 'SECCIÓN 11: ANÁLISIS DE RELACIONES'
\echo '============================================================================'
\echo ''

\echo '--- 11.1 Mapa de Relaciones entre Tablas ---'
WITH RECURSIVE fk_tree AS (
    SELECT
        tc.table_name AS from_table,
        kcu.column_name AS from_column,
        ccu.table_name AS to_table,
        ccu.column_name AS to_column,
        1 AS level
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage ccu
        ON ccu.constraint_name = tc.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = 'public'
)
SELECT 
    from_table,
    from_column,
    to_table,
    to_column
FROM fk_tree
ORDER BY from_table, to_table;

-- ============================================================================
-- SECCIÓN 12: VERIFICACIÓN DE INCONSISTENCIAS
-- ============================================================================

\echo ''
\echo '============================================================================'
\echo 'SECCIÓN 12: VERIFICACIÓN DE INCONSISTENCIAS'
\echo '============================================================================'
\echo ''

\echo '--- 12.1 Tablas sin Primary Key ---'
SELECT 
    t.table_schema,
    t.table_name
FROM information_schema.tables t
LEFT JOIN information_schema.table_constraints tc
    ON t.table_schema = tc.table_schema
    AND t.table_name = tc.table_name
    AND tc.constraint_type = 'PRIMARY KEY'
WHERE t.table_schema = 'public'
    AND t.table_type = 'BASE TABLE'
    AND tc.constraint_name IS NULL
ORDER BY t.table_name;

\echo ''
\echo '--- 12.2 Columnas con Nombres Similares pero Tipos Diferentes ---'
SELECT 
    c1.table_name AS table1,
    c1.column_name,
    c1.data_type AS type1,
    c2.table_name AS table2,
    c2.data_type AS type2
FROM information_schema.columns c1
JOIN information_schema.columns c2
    ON c1.column_name = c2.column_name
    AND c1.table_name < c2.table_name
    AND c1.data_type != c2.data_type
WHERE c1.table_schema = 'public'
    AND c2.table_schema = 'public'
ORDER BY c1.column_name, c1.table_name;

\echo ''
\echo '--- 12.3 Foreign Keys con Tipos Incompatibles ---'
SELECT
    tc.table_name AS from_table,
    kcu.column_name AS from_column,
    c1.data_type AS from_type,
    ccu.table_name AS to_table,
    ccu.column_name AS to_column,
    c2.data_type AS to_type
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu
    ON ccu.constraint_name = tc.constraint_name
JOIN information_schema.columns c1
    ON c1.table_name = kcu.table_name
    AND c1.column_name = kcu.column_name
    AND c1.table_schema = 'public'
JOIN information_schema.columns c2
    ON c2.table_name = ccu.table_name
    AND c2.column_name = ccu.column_name
    AND c2.table_schema = 'public'
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
    AND c1.data_type != c2.data_type
ORDER BY tc.table_name;

-- ============================================================================
-- SECCIÓN 13: RESUMEN EJECUTIVO
-- ============================================================================

\echo ''
\echo '============================================================================'
\echo 'SECCIÓN 13: RESUMEN EJECUTIVO'
\echo '============================================================================'
\echo ''

\echo '--- 13.1 Estadísticas Generales ---'
SELECT 
    'Total de Tablas' AS metrica,
    COUNT(*)::TEXT AS valor
FROM pg_tables
WHERE schemaname = 'public'
UNION ALL
SELECT 
    'Total de Índices',
    COUNT(*)::TEXT
FROM pg_indexes
WHERE schemaname = 'public'
UNION ALL
SELECT 
    'Total de Foreign Keys',
    COUNT(*)::TEXT
FROM information_schema.table_constraints
WHERE constraint_type = 'FOREIGN KEY'
    AND table_schema = 'public'
UNION ALL
SELECT 
    'Total de Triggers',
    COUNT(*)::TEXT
FROM information_schema.triggers
WHERE trigger_schema = 'public'
UNION ALL
SELECT 
    'Total de Funciones',
    COUNT(*)::TEXT
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
UNION ALL
SELECT 
    'Total de Usuarios',
    COUNT(*)::TEXT
FROM auth.users
UNION ALL
SELECT 
    'Total de Storage Buckets',
    COUNT(*)::TEXT
FROM storage.buckets;

\echo ''
\echo '============================================================================'
\echo 'FIN DE LA AUDITORÍA'
\echo '============================================================================'
\echo ''
\echo 'Próximos pasos recomendados:'
\echo '1. Revisar las inconsistencias encontradas en la Sección 12'
\echo '2. Comparar con el schema de Prisma esperado'
\echo '3. Crear un plan de migración basado en las diferencias'
\echo '4. Hacer backup antes de cualquier cambio'
\echo ''
