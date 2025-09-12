-- =====================================================
-- AUDITORÍA SIMPLE - SUPABASE 2025
-- =====================================================
-- Script corregido sin errores de tipos

-- 1. VERIFICAR TABLAS EXISTENTES
SELECT 
    'TABLA_EXISTENTE' as tipo,
    table_name as nombre,
    'EXISTS' as estado
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- 2. VERIFICAR ESTRUCTURA DE USER
SELECT 
    'USER_COLUMN' as tipo,
    column_name as nombre,
    data_type as estado
FROM information_schema.columns 
WHERE table_name = 'User' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. VERIFICAR ESTRUCTURA DE PROPERTIES
SELECT 
    'PROPERTIES_COLUMN' as tipo,
    column_name as nombre,
    data_type as estado
FROM information_schema.columns 
WHERE table_name = 'properties' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 4. VERIFICAR ESTRUCTURA DE FAVORITES
SELECT 
    'FAVORITES_COLUMN' as tipo,
    column_name as nombre,
    data_type as estado
FROM information_schema.columns 
WHERE table_name = 'favorites' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 5. VERIFICAR TABLAS DE PERFIL
SELECT 
    'PROFILE_TABLE' as tipo,
    'profile_views' as nombre,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'profile_views' AND table_schema = 'public'
    ) THEN 'EXISTS' ELSE 'MISSING' END as estado
UNION ALL
SELECT 
    'PROFILE_TABLE' as tipo,
    'user_messages' as nombre,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'user_messages' AND table_schema = 'public'
    ) THEN 'EXISTS' ELSE 'MISSING' END as estado
UNION ALL
SELECT 
    'PROFILE_TABLE' as tipo,
    'user_searches' as nombre,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'user_searches' AND table_schema = 'public'
    ) THEN 'EXISTS' ELSE 'MISSING' END as estado;

-- 6. VERIFICAR FUNCIONES
SELECT 
    'FUNCTION' as tipo,
    routine_name as nombre,
    'EXISTS' as estado
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_type = 'FUNCTION'
AND (routine_name LIKE '%user%' OR routine_name LIKE '%profile%' OR routine_name LIKE '%stats%')
ORDER BY routine_name;

-- 7. CONTAR REGISTROS EN TABLAS PRINCIPALES
SELECT 'USER_COUNT' as tipo, 'User' as nombre, COUNT(*)::text as estado FROM public."User";
SELECT 'PROPERTIES_COUNT' as tipo, 'properties' as nombre, COUNT(*)::text as estado FROM public.properties;
SELECT 'FAVORITES_COUNT' as tipo, 'favorites' as nombre, COUNT(*)::text as estado FROM public.favorites;

-- 8. VERIFICAR TIPOS DE ID
SELECT 
    'ID_TYPE' as tipo,
    'User.id' as nombre,
    data_type as estado
FROM information_schema.columns 
WHERE table_name = 'User' AND column_name = 'id' AND table_schema = 'public'
UNION ALL
SELECT 
    'ID_TYPE' as tipo,
    'properties.id' as nombre,
    data_type as estado
FROM information_schema.columns 
WHERE table_name = 'properties' AND column_name = 'id' AND table_schema = 'public';

-- 9. MUESTRA DE DATOS
SELECT 'USER_SAMPLE' as tipo, email as nombre, COALESCE(name, 'SIN_NOMBRE') as estado FROM public."User" LIMIT 2;
SELECT 'PROPERTY_SAMPLE' as tipo, COALESCE(title, 'SIN_TITULO') as nombre, COALESCE(price::text, '0') as estado FROM public.properties LIMIT 2;

-- 10. RESUMEN FINAL
SELECT 'RESUMEN' as tipo, 'AUDITORIA_COMPLETADA' as nombre, 'SUCCESS' as estado;
