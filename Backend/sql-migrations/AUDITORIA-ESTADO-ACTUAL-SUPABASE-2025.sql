-- =====================================================
-- AUDITORÍA COMPLETA DEL ESTADO ACTUAL - SUPABASE 2025
-- =====================================================
-- Script para verificar qué tablas y funciones ya existen
-- antes de implementar las mejoras del perfil de usuario

-- 1. VERIFICAR TODAS LAS TABLAS EXISTENTES
SELECT 
    '=== TABLAS EXISTENTES ===' as info,
    '' as table_name,
    '' as row_count,
    '' as columns;

SELECT 
    'TABLA' as info,
    table_name,
    '' as row_count,
    '' as columns
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- 2. VERIFICAR TABLAS ESPECÍFICAS DEL PERFIL
SELECT 
    '=== TABLAS DEL PERFIL DE USUARIO ===' as info,
    '' as table_name,
    '' as exists,
    '' as row_count;

-- Verificar si existen las tablas críticas
SELECT 
    'profile_views' as table_name,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'profile_views'
    ) THEN 'SÍ EXISTE' ELSE 'NO EXISTE' END as exists,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'profile_views'
    ) THEN (SELECT COUNT(*)::text FROM profile_views) ELSE '0' END as row_count;

SELECT 
    'user_messages' as table_name,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'user_messages'
    ) THEN 'SÍ EXISTE' ELSE 'NO EXISTE' END as exists,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'user_messages'
    ) THEN (SELECT COUNT(*)::text FROM user_messages) ELSE '0' END as row_count;

SELECT 
    'user_searches' as table_name,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'user_searches'
    ) THEN 'SÍ EXISTE' ELSE 'NO EXISTE' END as exists,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'user_searches'
    ) THEN (SELECT COUNT(*)::text FROM user_searches) ELSE '0' END as row_count;

-- 3. VERIFICAR TABLAS PRINCIPALES
SELECT 
    '=== TABLAS PRINCIPALES ===' as info,
    '' as table_name,
    '' as exists,
    '' as row_count;

SELECT 
    'User' as table_name,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'User'
    ) THEN 'SÍ EXISTE' ELSE 'NO EXISTE' END as exists,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'User'
    ) THEN (SELECT COUNT(*)::text FROM "User") ELSE '0' END as row_count;

SELECT 
    'properties' as table_name,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'properties'
    ) THEN 'SÍ EXISTE' ELSE 'NO EXISTE' END as exists,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'properties'
    ) THEN (SELECT COUNT(*)::text FROM properties) ELSE '0' END as row_count;

SELECT 
    'favorites' as table_name,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'favorites'
    ) THEN 'SÍ EXISTE' ELSE 'NO EXISTE' END as exists,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'favorites'
    ) THEN (SELECT COUNT(*)::text FROM favorites) ELSE '0' END as row_count;

-- 4. VERIFICAR FUNCIONES SQL EXISTENTES
SELECT 
    '=== FUNCIONES SQL ===' as info,
    '' as function_name,
    '' as exists,
    '' as parameters;

SELECT 
    'get_user_stats' as function_name,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.routines 
        WHERE routine_schema = 'public' AND routine_name = 'get_user_stats'
    ) THEN 'SÍ EXISTE' ELSE 'NO EXISTE' END as exists,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.routines 
        WHERE routine_schema = 'public' AND routine_name = 'get_user_stats'
    ) THEN 'TEXT/UUID' ELSE 'N/A' END as parameters;

SELECT 
    'get_user_profile_stats' as function_name,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.routines 
        WHERE routine_schema = 'public' AND routine_name = 'get_user_profile_stats'
    ) THEN 'SÍ EXISTE' ELSE 'NO EXISTE' END as exists,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.routines 
        WHERE routine_schema = 'public' AND routine_name = 'get_user_profile_stats'
    ) THEN 'TEXT/UUID' ELSE 'N/A' END as parameters;

-- 5. VERIFICAR TIPOS DE DATOS DE COLUMNAS CRÍTICAS
SELECT 
    '=== TIPOS DE DATOS CRÍTICOS ===' as info,
    '' as table_name,
    '' as column_name,
    '' as data_type;

-- Verificar tipo de User.id
SELECT 
    'User' as table_name,
    'id' as column_name,
    data_type
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'User' 
AND column_name = 'id';

-- Verificar tipo de properties.id
SELECT 
    'properties' as table_name,
    'id' as column_name,
    data_type
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'properties' 
AND column_name = 'id';

-- 6. VERIFICAR RLS POLICIES
SELECT 
    '=== RLS POLICIES ===' as info,
    '' as table_name,
    '' as policy_name,
    '' as policy_cmd;

SELECT 
    schemaname as schema_name,
    tablename as table_name,
    policyname as policy_name,
    cmd as policy_cmd
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename IN ('profile_views', 'user_messages', 'user_searches', 'favorites')
ORDER BY tablename, policyname;

-- 7. VERIFICAR USUARIOS DE PRUEBA
SELECT 
    '=== USUARIOS DE PRUEBA ===' as info,
    '' as user_id,
    '' as email,
    '' as created_at;

-- Mostrar algunos usuarios para testing
SELECT 
    id as user_id,
    email,
    created_at::date as created_at
FROM "User" 
ORDER BY created_at DESC 
LIMIT 5;

-- 8. VERIFICAR DATOS DE EJEMPLO EN TABLAS DEL PERFIL
SELECT 
    '=== DATOS DE EJEMPLO ===' as info,
    '' as table_name,
    '' as sample_data,
    '' as total_count;

-- Profile views (si existe)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profile_views') THEN
        PERFORM 1;
        -- Mostrar datos de ejemplo
        RAISE NOTICE 'Profile Views - Primeros 3 registros:';
        FOR rec IN SELECT * FROM profile_views LIMIT 3 LOOP
            RAISE NOTICE 'ID: %, User: %, Viewer: %, Date: %', rec.id, rec.viewed_user_id, rec.viewer_id, rec.created_at;
        END LOOP;
    ELSE
        RAISE NOTICE 'Tabla profile_views NO EXISTE';
    END IF;
END $$;

-- User messages (si existe)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_messages') THEN
        PERFORM 1;
        RAISE NOTICE 'User Messages - Primeros 3 registros:';
        FOR rec IN SELECT * FROM user_messages LIMIT 3 LOOP
            RAISE NOTICE 'ID: %, From: %, To: %, Subject: %', rec.id, rec.sender_id, rec.receiver_id, rec.subject;
        END LOOP;
    ELSE
        RAISE NOTICE 'Tabla user_messages NO EXISTE';
    END IF;
END $$;

-- User searches (si existe)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_searches') THEN
        PERFORM 1;
        RAISE NOTICE 'User Searches - Primeros 3 registros:';
        FOR rec IN SELECT * FROM user_searches LIMIT 3 LOOP
            RAISE NOTICE 'ID: %, User: %, Query: %, Date: %', rec.id, rec.user_id, rec.search_query, rec.created_at;
        END LOOP;
    ELSE
        RAISE NOTICE 'Tabla user_searches NO EXISTE';
    END IF;
END $$;

-- 9. RESUMEN FINAL
SELECT 
    '=== RESUMEN FINAL ===' as info,
    '' as component,
    '' as status,
    '' as action_needed;

SELECT 
    'Base de Datos' as component,
    'Auditoria Completada' as status,
    'Revisar resultados arriba' as action_needed;

-- Mostrar mensaje final
DO $$
BEGIN
    RAISE NOTICE '=====================================================';
    RAISE NOTICE 'AUDITORÍA COMPLETADA - REVISAR RESULTADOS ARRIBA';
    RAISE NOTICE '=====================================================';
    RAISE NOTICE 'Próximo paso: Analizar qué falta e implementar';
    RAISE NOTICE 'Credenciales de testing: cgonzalezarchilla@gmail.com';
    RAISE NOTICE '=====================================================';
END $$;
