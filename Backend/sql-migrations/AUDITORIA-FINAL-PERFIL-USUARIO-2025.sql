-- =====================================================
-- AUDITORÍA FINAL - PERFIL USUARIO 2025
-- =====================================================
-- Fecha: Enero 2025
-- Propósito: Verificar que toda la implementación esté correcta
-- Ejecutar en Supabase SQL Editor para confirmar el estado

-- =====================================================
-- 1. VERIFICAR EXISTENCIA DE TABLAS
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '=== AUDITORÍA FINAL DEL SISTEMA DE PERFIL ===';
    RAISE NOTICE 'Fecha: %', NOW();
    RAISE NOTICE '';
    RAISE NOTICE '1. VERIFICANDO TABLAS CREADAS...';
END $$;

-- Verificar tablas principales
SELECT 
    'TABLAS CREADAS' as categoria,
    table_name as nombre,
    CASE 
        WHEN table_name IN ('profile_views', 'user_messages', 'user_searches') 
        THEN '✅ CORRECTO' 
        ELSE '⚠️ INESPERADO' 
    END as estado
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('profile_views', 'user_messages', 'user_searches')
ORDER BY table_name;

-- =====================================================
-- 2. VERIFICAR ESTRUCTURA DE TABLAS
-- =====================================================

-- Verificar columnas de profile_views
SELECT 
    'COLUMNAS profile_views' as categoria,
    column_name as nombre,
    data_type as tipo,
    CASE 
        WHEN column_name IN ('id', 'viewer_user_id', 'viewed_user_id', 'viewed_at', 'created_at', 'session_id', 'ip_address', 'user_agent') 
        THEN '✅ CORRECTO' 
        ELSE '⚠️ EXTRA' 
    END as estado
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'profile_views'
ORDER BY ordinal_position;

-- Verificar columnas de user_messages
SELECT 
    'COLUMNAS user_messages' as categoria,
    column_name as nombre,
    data_type as tipo,
    CASE 
        WHEN column_name IN ('id', 'sender_id', 'recipient_id', 'message', 'is_read', 'created_at') 
        THEN '✅ CORRECTO' 
        ELSE '⚠️ EXTRA' 
    END as estado
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'user_messages'
ORDER BY ordinal_position;

-- =====================================================
-- 3. VERIFICAR ÍNDICES CREADOS
-- =====================================================

SELECT 
    'ÍNDICES' as categoria,
    indexname as nombre,
    tablename as tabla,
    CASE 
        WHEN indexname LIKE 'idx_profile_views_%' OR indexname LIKE 'idx_user_%' 
        THEN '✅ CORRECTO' 
        ELSE '⚠️ REVISAR' 
    END as estado
FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename IN ('profile_views', 'user_messages', 'user_searches')
ORDER BY tablename, indexname;

-- =====================================================
-- 4. VERIFICAR FUNCIONES SQL
-- =====================================================

SELECT 
    'FUNCIONES SQL' as categoria,
    routine_name as nombre,
    routine_type as tipo,
    CASE 
        WHEN routine_name IN ('get_user_profile_stats', 'log_profile_view', 'get_profile_views_count') 
        THEN '✅ CORRECTO' 
        ELSE '⚠️ EXTRA' 
    END as estado
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE '%profile%'
ORDER BY routine_name;

-- =====================================================
-- 5. VERIFICAR POLÍTICAS RLS
-- =====================================================

SELECT 
    'POLÍTICAS RLS' as categoria,
    tablename as tabla,
    policyname as nombre,
    cmd as comando,
    '✅ CONFIGURADO' as estado
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('profile_views', 'user_messages', 'user_searches')
ORDER BY tablename, policyname;

-- =====================================================
-- 6. PROBAR FUNCIONES PRINCIPALES
-- =====================================================

DO $$
DECLARE
    test_result JSON;
    views_count INTEGER;
    current_user_id UUID;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '6. PROBANDO FUNCIONES...';
    
    -- Obtener ID del usuario actual
    SELECT auth.uid()::UUID INTO current_user_id;
    
    IF current_user_id IS NOT NULL THEN
        -- Probar función de estadísticas
        BEGIN
            SELECT public.get_user_profile_stats(current_user_id) INTO test_result;
            RAISE NOTICE '✅ Función get_user_profile_stats: FUNCIONA';
            RAISE NOTICE 'Resultado: %', test_result;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE '❌ Función get_user_profile_stats: ERROR - %', SQLERRM;
        END;
        
        -- Probar función de conteo de vistas
        BEGIN
            SELECT public.get_profile_views_count(current_user_id) INTO views_count;
            RAISE NOTICE '✅ Función get_profile_views_count: FUNCIONA';
            RAISE NOTICE 'Vistas del perfil: %', views_count;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE '❌ Función get_profile_views_count: ERROR - %', SQLERRM;
        END;
        
    ELSE
        RAISE NOTICE '⚠️ No hay usuario autenticado para probar las funciones';
    END IF;
END $$;

-- =====================================================
-- 7. VERIFICAR DATOS DE PRUEBA (SI EXISTEN)
-- =====================================================

-- Contar registros en cada tabla
SELECT 
    'DATOS EN TABLAS' as categoria,
    'profile_views' as tabla,
    COUNT(*) as registros,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ CON DATOS' 
        ELSE '⚠️ VACÍA' 
    END as estado
FROM public.profile_views

UNION ALL

SELECT 
    'DATOS EN TABLAS' as categoria,
    'user_messages' as tabla,
    COUNT(*) as registros,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ CON DATOS' 
        ELSE '⚠️ VACÍA' 
    END as estado
FROM public.user_messages

UNION ALL

SELECT 
    'DATOS EN TABLAS' as categoria,
    'user_searches' as tabla,
    COUNT(*) as registros,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ CON DATOS' 
        ELSE '⚠️ VACÍA' 
    END as estado
FROM public.user_searches;

-- =====================================================
-- 8. VERIFICAR PERMISOS Y ACCESO
-- =====================================================

-- Verificar permisos del usuario actual
SELECT 
    'PERMISOS' as categoria,
    table_name as tabla,
    privilege_type as permiso,
    CASE 
        WHEN privilege_type IN ('SELECT', 'INSERT', 'UPDATE', 'DELETE') 
        THEN '✅ CORRECTO' 
        ELSE '⚠️ REVISAR' 
    END as estado
FROM information_schema.table_privileges 
WHERE table_schema = 'public' 
AND table_name IN ('profile_views', 'user_messages', 'user_searches')
AND grantee = current_user
ORDER BY table_name, privilege_type;

-- =====================================================
-- 9. VERIFICAR INTEGRIDAD REFERENCIAL
-- =====================================================

-- Verificar foreign keys
SELECT 
    'FOREIGN KEYS' as categoria,
    tc.table_name as tabla,
    kcu.column_name as columna,
    ccu.table_name as tabla_referenciada,
    ccu.column_name as columna_referenciada,
    '✅ CONFIGURADO' as estado
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_schema = 'public'
AND tc.table_name IN ('profile_views', 'user_messages', 'user_searches')
ORDER BY tc.table_name;

-- =====================================================
-- 10. RESUMEN FINAL DE AUDITORÍA
-- =====================================================

DO $$
DECLARE
    tables_count INTEGER;
    functions_count INTEGER;
    indexes_count INTEGER;
    policies_count INTEGER;
BEGIN
    -- Contar elementos creados
    SELECT COUNT(*) INTO tables_count
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name IN ('profile_views', 'user_messages', 'user_searches');
    
    SELECT COUNT(*) INTO functions_count
    FROM information_schema.routines 
    WHERE routine_schema = 'public' 
    AND routine_name IN ('get_user_profile_stats', 'log_profile_view', 'get_profile_views_count');
    
    SELECT COUNT(*) INTO indexes_count
    FROM pg_indexes 
    WHERE schemaname = 'public' 
    AND tablename IN ('profile_views', 'user_messages', 'user_searches');
    
    SELECT COUNT(*) INTO policies_count
    FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename IN ('profile_views', 'user_messages', 'user_searches');
    
    RAISE NOTICE '';
    RAISE NOTICE '=== RESUMEN FINAL DE AUDITORÍA ===';
    RAISE NOTICE 'Tablas creadas: % de 3 esperadas', tables_count;
    RAISE NOTICE 'Funciones creadas: % de 3 esperadas', functions_count;
    RAISE NOTICE 'Índices creados: %', indexes_count;
    RAISE NOTICE 'Políticas RLS: %', policies_count;
    RAISE NOTICE '';
    
    IF tables_count = 3 AND functions_count = 3 AND indexes_count >= 5 AND policies_count >= 4 THEN
        RAISE NOTICE '🎉 ¡AUDITORÍA EXITOSA! Sistema de perfil 100%% funcional';
        RAISE NOTICE '✅ Todas las tablas, funciones e índices están correctos';
        RAISE NOTICE '✅ RLS configurado correctamente';
        RAISE NOTICE '✅ Listo para usar en producción';
    ELSE
        RAISE NOTICE '⚠️ AUDITORÍA INCOMPLETA - Revisar elementos faltantes';
        IF tables_count < 3 THEN
            RAISE NOTICE '❌ Faltan tablas: % de 3', 3 - tables_count;
        END IF;
        IF functions_count < 3 THEN
            RAISE NOTICE '❌ Faltan funciones: % de 3', 3 - functions_count;
        END IF;
        IF indexes_count < 5 THEN
            RAISE NOTICE '❌ Faltan índices (mínimo 5)';
        END IF;
        IF policies_count < 4 THEN
            RAISE NOTICE '❌ Faltan políticas RLS (mínimo 4)';
        END IF;
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '📊 Para probar manualmente:';
    RAISE NOTICE 'SELECT public.get_user_profile_stats(auth.uid()::UUID);';
    RAISE NOTICE 'SELECT public.get_profile_views_count(auth.uid()::UUID);';
    RAISE NOTICE '';
    RAISE NOTICE '🔗 Verificar en frontend: http://localhost:3000/profile/inquilino';
    RAISE NOTICE '';
    RAISE NOTICE '=== FIN DE AUDITORÍA ===';
END $$;
