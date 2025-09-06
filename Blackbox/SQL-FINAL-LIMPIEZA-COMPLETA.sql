-- =====================================================
-- SQL FINAL - LIMPIEZA COMPLETA DE DUPLICADAS
-- =====================================================
-- Elimina específicamente la política duplicada identificada
-- =====================================================

-- Eliminar la política duplicada específica
DROP POLICY IF EXISTS "Users can create inquiries" ON public.property_inquiries;

-- Verificar que solo queda una política INSERT
SELECT
    'VERIFICACIÓN POST-LIMPIEZA' as tipo,
    tablename,
    cmd,
    COUNT(*) as total_policies,
    CASE
        WHEN COUNT(*) > 1 THEN '❌ AÚN HAY DUPLICADAS'
        WHEN COUNT(*) = 1 THEN '✅ LIMPIEZA COMPLETADA'
        ELSE '⚠️ SIN POLÍTICAS'
    END as status
FROM pg_policies
WHERE schemaname = 'public'
    AND tablename = 'property_inquiries'
    AND cmd = 'INSERT'
GROUP BY tablename, cmd;

-- Verificación completa de todas las políticas
SELECT
    'VERIFICACIÓN COMPLETA FINAL' as tipo,
    tablename,
    cmd,
    COUNT(*) as total_policies,
    CASE
        WHEN COUNT(*) > 1 THEN '❌ DUPLICADAS PENDIENTES'
        WHEN COUNT(*) = 1 THEN '✅ CONSOLIDADO'
        ELSE '⚠️ SIN POLÍTICAS'
    END as status
FROM pg_policies
WHERE schemaname = 'public'
    AND tablename IN ('favorites', 'property_inquiries', 'users')
GROUP BY tablename, cmd
ORDER BY tablename, cmd;

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
)
SELECT
    'RESULTADO FINAL' as verificacion,
    tipo,
    cantidad,
    CASE
        WHEN tipo = 'multiple_permissive_policies' AND cantidad = 0 THEN '🎉 ÉXITO TOTAL - TODOS LOS WARNINGS ELIMINADOS'
        WHEN tipo = 'multiple_permissive_policies' AND cantidad > 0 THEN '⚠️ AÚN HAY WARNINGS PENDIENTES'
    END as status
FROM warnings_check;

-- Resumen ejecutivo final
SELECT
    'RESUMEN EJECUTIVO FINAL' as resultado,
    (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public') as total_policies,
    (SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'public') as total_indexes,
    CASE
        WHEN (
            SELECT COUNT(*) FROM (
                SELECT tablename, cmd, COUNT(*) as cnt
                FROM pg_policies
                WHERE schemaname = 'public'
                GROUP BY tablename, cmd
                HAVING COUNT(*) > 1
            )
        ) = 0 THEN '✅ OPTIMIZACIÓN 100% COMPLETA'
        ELSE '⚠️ OPTIMIZACIÓN INCOMPLETA'
    END as estado_final;
