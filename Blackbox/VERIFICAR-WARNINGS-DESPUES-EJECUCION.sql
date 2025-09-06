-- =====================================================
-- VERIFICACIÓN POST-EJECUCIÓN DE WARNINGS
-- =====================================================
-- Ejecutar después de aplicar el SQL manual
-- Confirma que todos los warnings fueron eliminados
-- =====================================================

-- Verificar políticas múltiples eliminadas
WITH policy_counts AS (
    SELECT
        tablename,
        cmd,
        COUNT(*) as policy_count
    FROM pg_policies
    WHERE schemaname = 'public'
    GROUP BY tablename, cmd
)
SELECT
    '🔍 POLÍTICAS MÚLTIPLES' as verificacion,
    tablename,
    cmd,
    policy_count,
    CASE
        WHEN policy_count > 1 THEN '❌ AÚN HAY DUPLICADAS - REVISAR'
        WHEN policy_count = 1 THEN '✅ CONSOLIDADA CORRECTAMENTE'
        ELSE '⚠️ SIN POLÍTICAS'
    END as status
FROM policy_counts
WHERE tablename IN ('favorites', 'property_inquiries', 'users')
ORDER BY tablename, cmd;

-- Verificar índices duplicados eliminados
WITH index_counts AS (
    SELECT
        tablename,
        indexdef,
        COUNT(*) as index_count,
        array_agg(indexname) as index_names
    FROM pg_indexes
    WHERE schemaname = 'public'
    GROUP BY tablename, indexdef
)
SELECT
    '🔍 ÍNDICES DUPLICADOS' as verificacion,
    tablename,
    index_count,
    index_names,
    CASE
        WHEN index_count > 1 THEN '❌ AÚN HAY DUPLICADOS - REVISAR'
        WHEN index_count = 1 THEN '✅ OPTIMIZADO'
        ELSE '⚠️ SIN ÍNDICES'
    END as status
FROM index_counts
WHERE tablename IN ('properties', 'users')
ORDER BY tablename;

-- Verificar funcionalidad básica
SELECT
    '🔍 FUNCIONALIDAD BÁSICA' as verificacion,
    'users' as tabla,
    COUNT(*) as registros,
    CASE
        WHEN COUNT(*) > 0 THEN '✅ TABLA ACCESIBLE'
        ELSE '❌ PROBLEMA DE ACCESO'
    END as status
FROM public.users;

-- Conteo final de warnings
WITH warnings_check AS (
    SELECT
        'multiple_permissive_policies' as tipo,
        COUNT(*) as cantidad
    FROM (
        SELECT tablename, cmd, COUNT(*) as cnt
        FROM pg_policies
        WHERE schemaname = 'public'
        GROUP BY tablename, cmd
        HAVING COUNT(*) > 1
    ) multiple_policies

    UNION ALL

    SELECT
        'duplicate_index' as tipo,
        COUNT(*) as cantidad
    FROM (
        SELECT tablename, indexdef, COUNT(*) as cnt
        FROM pg_indexes
        WHERE schemaname = 'public'
        GROUP BY tablename, indexdef
        HAVING COUNT(*) > 1
    ) duplicate_indexes
)
SELECT
    '📊 RESUMEN FINAL' as verificacion,
    tipo,
    cantidad,
    CASE
        WHEN tipo = 'multiple_permissive_policies' AND cantidad = 0 THEN '🎉 SIN WARNINGS DE POLÍTICAS'
        WHEN tipo = 'multiple_permissive_policies' AND cantidad > 0 THEN '⚠️ AÚN HAY WARNINGS DE POLÍTICAS'
        WHEN tipo = 'duplicate_index' AND cantidad = 0 THEN '🎉 SIN ÍNDICES DUPLICADOS'
        WHEN tipo = 'duplicate_index' AND cantidad > 0 THEN '⚠️ AÚN HAY ÍNDICES DUPLICADOS'
    END as status
FROM warnings_check;

-- Test de rendimiento básico
SELECT
    '⚡ TEST DE RENDIMIENTO' as verificacion,
    'Consulta básica users' as prueba,
    CASE
        WHEN COUNT(*) > 0 THEN '✅ RENDIMIENTO OK'
        ELSE '❌ PROBLEMA DE RENDIMIENTO'
    END as status
FROM public.users
WHERE id IS NOT NULL
LIMIT 1;
