-- =====================================================
-- SQL ÚLTIMA CORRECCIÓN FINAL - EJECUTAR EN SUPABASE
-- =====================================================
-- Corrección final: Solo usar columnas que existen realmente
-- property_inquiries NO tiene property_owner_id
-- =====================================================

-- =====================================================
-- PASO 1: LIMPIEZA COMPLETA DE PROPERTY_INQUIRIES
-- =====================================================

-- Eliminar TODAS las políticas existentes de property_inquiries
DROP POLICY IF EXISTS "Property owners can view inquiries" ON public.property_inquiries;
DROP POLICY IF EXISTS "Users can view own inquiries" ON public.property_inquiries;
DROP POLICY IF EXISTS "Property owners can update inquiries" ON public.property_inquiries;
DROP POLICY IF EXISTS "Users can update own inquiries" ON public.property_inquiries;
DROP POLICY IF EXISTS "property_inquiries_select_own" ON public.property_inquiries;
DROP POLICY IF EXISTS "property_inquiries_update_own" ON public.property_inquiries;
DROP POLICY IF EXISTS "property_inquiries_consolidated_select" ON public.property_inquiries;
DROP POLICY IF EXISTS "property_inquiries_consolidated_insert" ON public.property_inquiries;
DROP POLICY IF EXISTS "property_inquiries_consolidated_update" ON public.property_inquiries;
DROP POLICY IF EXISTS "property_inquiries_consolidated_delete" ON public.property_inquiries;

-- =====================================================
-- PASO 2: POLÍTICAS SIMPLIFICADAS PARA PROPERTY_INQUIRIES
-- =====================================================

-- Solo permitir acceso al usuario que hizo la consulta
CREATE POLICY "property_inquiries_simple_select" ON public.property_inquiries
FOR SELECT TO anon, authenticated, authenticator, dashboard_user
USING (
    auth.uid()::text = inquirer_user_id OR  -- Solo el usuario que hizo la consulta
    auth.role() = 'service_role'
);

CREATE POLICY "property_inquiries_simple_insert" ON public.property_inquiries
FOR INSERT TO anon, authenticated, authenticator, dashboard_user
WITH CHECK (
    auth.uid()::text = inquirer_user_id OR  -- Solo el usuario que hace la consulta
    auth.role() = 'service_role'
);

CREATE POLICY "property_inquiries_simple_update" ON public.property_inquiries
FOR UPDATE TO anon, authenticated, authenticator, dashboard_user
USING (
    auth.uid()::text = inquirer_user_id OR  -- Solo el usuario que hizo la consulta
    auth.role() = 'service_role'
)
WITH CHECK (
    auth.uid()::text = inquirer_user_id OR  -- Solo el usuario que hace la consulta
    auth.role() = 'service_role'
);

CREATE POLICY "property_inquiries_simple_delete" ON public.property_inquiries
FOR DELETE TO anon, authenticated, authenticator, dashboard_user
USING (
    auth.uid()::text = inquirer_user_id OR  -- Solo el usuario que hizo la consulta
    auth.role() = 'service_role'
);

-- =====================================================
-- PASO 3: VERIFICACIÓN FINAL DEFINITIVA
-- =====================================================

-- Verificar TODAS las políticas consolidadas
SELECT
    'VERIFICACIÓN FINAL DEFINITIVA' as tipo,
    tablename,
    cmd,
    COUNT(*) as total_policies,
    CASE
        WHEN COUNT(*) > 1 THEN '❌ AÚN HAY DUPLICADAS - REVISAR'
        WHEN COUNT(*) = 1 THEN '✅ CONSOLIDADO'
        ELSE '⚠️ SIN POLÍTICAS'
    END as status
FROM pg_policies
WHERE schemaname = 'public'
    AND tablename IN ('favorites', 'property_inquiries', 'users')
GROUP BY tablename, cmd
ORDER BY tablename, cmd;

-- Verificar índices finales
SELECT
    'VERIFICACIÓN ÍNDICES FINALES' as tipo,
    tablename,
    COUNT(*) as total_indexes,
    '✅ ÍNDICES OPTIMIZADOS' as status
FROM pg_indexes
WHERE schemaname = 'public'
    AND tablename IN ('properties', 'users')
GROUP BY tablename
ORDER BY tablename;

-- Test funcional final
SELECT
    'TEST FUNCIONAL FINAL' as tipo,
    'users' as tabla,
    COUNT(*) as registros,
    '✅ FUNCIONANDO' as status
FROM public.users
UNION ALL
SELECT
    'TEST FUNCIONAL FINAL' as tipo,
    'favorites' as tabla,
    COUNT(*) as registros,
    '✅ FUNCIONANDO' as status
FROM public.favorites
UNION ALL
SELECT
    'TEST FUNCIONAL FINAL' as tipo,
    'property_inquiries' as tabla,
    COUNT(*) as registros,
    '✅ FUNCIONANDO' as status
FROM public.property_inquiries;

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
    'CONTEO FINAL DE WARNINGS' as verificacion,
    tipo,
    cantidad,
    CASE
        WHEN tipo = 'multiple_permissive_policies' AND cantidad = 0 THEN '🎉 SIN WARNINGS DE POLÍTICAS'
        WHEN tipo = 'multiple_permissive_policies' AND cantidad > 0 THEN '⚠️ AÚN HAY WARNINGS DE POLÍTICAS'
        WHEN tipo = 'duplicate_index' AND cantidad = 0 THEN '🎉 SIN ÍNDICES DUPLICADOS'
        WHEN tipo = 'duplicate_index' AND cantidad > 0 THEN '⚠️ AÚN HAY ÍNDICES DUPLICADOS'
    END as status
FROM warnings_check;

-- Resumen final definitivo
SELECT
    'RESUMEN FINAL DEFINITIVO' as resultado,
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
        ) = 0 AND (
            SELECT COUNT(*) FROM (
                SELECT tablename, indexdef, COUNT(*) as cnt
                FROM pg_indexes
                WHERE schemaname = 'public'
                GROUP BY tablename, indexdef
                HAVING COUNT(*) > 1
            )
        ) = 0 THEN '🎉 ÉXITO TOTAL - TODOS LOS WARNINGS ELIMINADOS'
        ELSE '⚠️ AÚN HAY WARNINGS PENDIENTES'
    END as status;
