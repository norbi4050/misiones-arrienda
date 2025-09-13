-- 🔍 VERIFICAR ESTADO DE MIGRACIÓN SUPABASE - 2025
-- Ejecuta estas consultas en el SQL Editor de Supabase para verificar el estado actual

-- ========================================
-- 1. VERIFICAR TABLAS PRINCIPALES EXISTENTES
-- ========================================

SELECT 
    'TABLAS PRINCIPALES' as categoria,
    table_name,
    CASE 
        WHEN table_name IN ('users', 'properties', 'property_images') THEN '✅ CORE'
        WHEN table_name IN ('profile_views', 'user_messages', 'user_searches', 'user_activity_log', 'user_favorites') THEN '🔄 PERFIL'
        ELSE '❓ OTRA'
    END as estado
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE'
    AND table_name NOT LIKE 'auth_%'
ORDER BY 
    CASE 
        WHEN table_name IN ('users', 'properties', 'property_images') THEN 1
        WHEN table_name IN ('profile_views', 'user_messages', 'user_searches', 'user_activity_log', 'user_favorites') THEN 2
        ELSE 3
    END,
    table_name;

-- ========================================
-- 2. VERIFICAR TABLAS DE PERFIL ESPECÍFICAS
-- ========================================

SELECT 
    'ESTADO TABLAS PERFIL' as verificacion,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profile_views') THEN '✅ profile_views'
        ELSE '❌ profile_views FALTA'
    END as profile_views,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_messages') THEN '✅ user_messages'
        ELSE '❌ user_messages FALTA'
    END as user_messages,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_searches') THEN '✅ user_searches'
        ELSE '❌ user_searches FALTA'
    END as user_searches,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_activity_log') THEN '✅ user_activity_log'
        ELSE '❌ user_activity_log FALTA'
    END as user_activity_log,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_favorites') THEN '✅ user_favorites'
        ELSE '❌ user_favorites FALTA'
    END as user_favorites;

-- ========================================
-- 3. VERIFICAR FUNCIÓN get_user_stats()
-- ========================================

SELECT 
    'FUNCIONES' as categoria,
    routine_name as nombre_funcion,
    routine_type as tipo,
    CASE 
        WHEN routine_name = 'get_user_stats' THEN '✅ CRÍTICA'
        ELSE '📋 OTRA'
    END as importancia
FROM information_schema.routines 
WHERE routine_schema = 'public' 
    AND routine_type = 'FUNCTION'
ORDER BY 
    CASE WHEN routine_name = 'get_user_stats' THEN 1 ELSE 2 END,
    routine_name;

-- ========================================
-- 4. CONTAR DATOS EN TABLAS DE PERFIL
-- ========================================

SELECT 
    'DATOS EXISTENTES' as categoria,
    'profile_views' as tabla,
    COALESCE((SELECT COUNT(*) FROM profile_views), 0) as total_registros,
    CASE 
        WHEN COALESCE((SELECT COUNT(*) FROM profile_views), 0) > 0 THEN '✅ CON DATOS'
        ELSE '⚠️ VACÍA'
    END as estado
UNION ALL
SELECT 
    'DATOS EXISTENTES',
    'user_messages',
    COALESCE((SELECT COUNT(*) FROM user_messages), 0),
    CASE 
        WHEN COALESCE((SELECT COUNT(*) FROM user_messages), 0) > 0 THEN '✅ CON DATOS'
        ELSE '⚠️ VACÍA'
    END
UNION ALL
SELECT 
    'DATOS EXISTENTES',
    'user_searches',
    COALESCE((SELECT COUNT(*) FROM user_searches), 0),
    CASE 
        WHEN COALESCE((SELECT COUNT(*) FROM user_searches), 0) > 0 THEN '✅ CON DATOS'
        ELSE '⚠️ VACÍA'
    END
UNION ALL
SELECT 
    'DATOS EXISTENTES',
    'user_activity_log',
    COALESCE((SELECT COUNT(*) FROM user_activity_log), 0),
    CASE 
        WHEN COALESCE((SELECT COUNT(*) FROM user_activity_log), 0) > 0 THEN '✅ CON DATOS'
        ELSE '⚠️ VACÍA'
    END
UNION ALL
SELECT 
    'DATOS EXISTENTES',
    'user_favorites',
    COALESCE((SELECT COUNT(*) FROM user_favorites), 0),
    CASE 
        WHEN COALESCE((SELECT COUNT(*) FROM user_favorites), 0) > 0 THEN '✅ CON DATOS'
        ELSE '⚠️ VACÍA'
    END;

-- ========================================
-- 5. VERIFICAR USUARIOS EXISTENTES
-- ========================================

SELECT 
    'USUARIOS' as categoria,
    COUNT(*) as total_usuarios,
    COUNT(CASE WHEN profile_image IS NOT NULL THEN 1 END) as con_avatar,
    COUNT(CASE WHEN created_at > NOW() - INTERVAL '30 days' THEN 1 END) as ultimos_30_dias,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ HAY USUARIOS'
        ELSE '❌ SIN USUARIOS'
    END as estado
FROM users;

-- ========================================
-- 6. VERIFICAR PROPIEDADES EXISTENTES
-- ========================================

SELECT 
    'PROPIEDADES' as categoria,
    COUNT(*) as total_propiedades,
    COUNT(CASE WHEN is_published = true THEN 1 END) as publicadas,
    COUNT(CASE WHEN is_active = true THEN 1 END) as activas,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ HAY PROPIEDADES'
        ELSE '❌ SIN PROPIEDADES'
    END as estado
FROM properties;

-- ========================================
-- 7. VERIFICAR STORAGE BUCKETS
-- ========================================

SELECT 
    'STORAGE' as categoria,
    name as bucket_name,
    public as es_publico,
    CASE 
        WHEN name = 'avatars' THEN '✅ CRÍTICO'
        WHEN name = 'property-images' THEN '✅ IMPORTANTE'
        ELSE '📋 OTRO'
    END as importancia
FROM storage.buckets
ORDER BY 
    CASE 
        WHEN name = 'avatars' THEN 1
        WHEN name = 'property-images' THEN 2
        ELSE 3
    END;

-- ========================================
-- 8. VERIFICAR RLS POLICIES CRÍTICAS
-- ========================================

SELECT 
    'RLS POLICIES' as categoria,
    schemaname,
    tablename,
    policyname,
    CASE 
        WHEN tablename = 'users' AND policyname LIKE '%own%' THEN '✅ CRÍTICA'
        WHEN tablename IN ('profile_views', 'user_messages', 'user_searches', 'user_activity_log', 'user_favorites') THEN '🔄 PERFIL'
        ELSE '📋 OTRA'
    END as importancia
FROM pg_policies 
WHERE schemaname = 'public'
    AND tablename IN ('users', 'profile_views', 'user_messages', 'user_searches', 'user_activity_log', 'user_favorites')
ORDER BY 
    CASE 
        WHEN tablename = 'users' THEN 1
        WHEN tablename IN ('profile_views', 'user_messages', 'user_searches', 'user_activity_log', 'user_favorites') THEN 2
        ELSE 3
    END,
    tablename, policyname;

-- ========================================
-- 9. RESUMEN FINAL DEL ESTADO
-- ========================================

SELECT 
    '🎯 RESUMEN FINAL' as categoria,
    CASE 
        WHEN (
            EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profile_views') AND
            EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_messages') AND
            EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_searches') AND
            EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_activity_log') AND
            EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_favorites') AND
            EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'get_user_stats')
        ) THEN '✅ MIGRACIÓN COMPLETA - LISTO PARA USAR'
        ELSE '⚠️ MIGRACIÓN INCOMPLETA - EJECUTAR FIX-PERFECTO-FINAL-2025.sql'
    END as estado_migracion,
    CASE 
        WHEN (SELECT COUNT(*) FROM users) > 0 THEN '✅ HAY USUARIOS'
        ELSE '❌ SIN USUARIOS DE PRUEBA'
    END as estado_usuarios,
    CASE 
        WHEN (SELECT COUNT(*) FROM properties WHERE is_published = true) > 0 THEN '✅ HAY PROPIEDADES'
        ELSE '❌ SIN PROPIEDADES PUBLICADAS'
    END as estado_propiedades;

-- ========================================
-- 10. PRÓXIMOS PASOS RECOMENDADOS
-- ========================================

SELECT 
    '📋 PRÓXIMOS PASOS' as categoria,
    CASE 
        WHEN NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profile_views')
        THEN '1️⃣ EJECUTAR: Backend/sql-migrations/FIX-PERFECTO-FINAL-2025.sql'
        WHEN (SELECT COUNT(*) FROM profile_views) = 0
        THEN '2️⃣ CREAR DATOS DE PRUEBA: Ejecutar inserts de ejemplo'
        WHEN (SELECT COUNT(*) FROM users) = 0
        THEN '3️⃣ CREAR USUARIO DE PRUEBA: Registrarse en la app'
        ELSE '4️⃣ PROBAR FUNCIONALIDAD: Ir a /profile/inquilino y verificar datos reales'
    END as accion_recomendada;
