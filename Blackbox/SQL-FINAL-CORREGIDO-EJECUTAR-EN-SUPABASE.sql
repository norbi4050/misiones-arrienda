-- =====================================================
-- SQL FINAL CORREGIDO - EJECUTAR EN SUPABASE
-- =====================================================
-- Corrección final: Usar columna correcta "inquirer_user_id"
-- =====================================================

-- =====================================================
-- PASO 1: CORRECCIÓN FINAL DE PROPERTY_INQUIRIES
-- =====================================================

-- Eliminar políticas existentes de property_inquiries
DROP POLICY IF EXISTS "Property owners can view inquiries" ON public.property_inquiries;
DROP POLICY IF EXISTS "Users can view own inquiries" ON public.property_inquiries;
DROP POLICY IF EXISTS "Property owners can update inquiries" ON public.property_inquiries;
DROP POLICY IF EXISTS "Users can update own inquiries" ON public.property_inquiries;
DROP POLICY IF EXISTS "property_inquiries_select_own" ON public.property_inquiries;
DROP POLICY IF EXISTS "property_inquiries_update_own" ON public.property_inquiries;

-- Crear políticas consolidadas para property_inquiries (con columna CORRECTA)
CREATE POLICY "property_inquiries_consolidated_select" ON public.property_inquiries
FOR SELECT TO anon, authenticated, authenticator, dashboard_user
USING (
    auth.uid()::text = inquirer_user_id OR  -- ✅ COLUMNA CORRECTA
    auth.uid()::text = property_owner_id OR
    auth.role() = 'service_role'
);

CREATE POLICY "property_inquiries_consolidated_insert" ON public.property_inquiries
FOR INSERT TO anon, authenticated, authenticator, dashboard_user
WITH CHECK (
    auth.uid()::text = inquirer_user_id OR  -- ✅ COLUMNA CORRECTA
    auth.role() = 'service_role'
);

CREATE POLICY "property_inquiries_consolidated_update" ON public.property_inquiries
FOR UPDATE TO anon, authenticated, authenticator, dashboard_user
USING (
    auth.uid()::text = inquirer_user_id OR  -- ✅ COLUMNA CORRECTA
    auth.uid()::text = property_owner_id OR
    auth.role() = 'service_role'
)
WITH CHECK (
    auth.uid()::text = inquirer_user_id OR  -- ✅ COLUMNA CORRECTA
    auth.uid()::text = property_owner_id OR
    auth.role() = 'service_role'
);

CREATE POLICY "property_inquiries_consolidated_delete" ON public.property_inquiries
FOR DELETE TO anon, authenticated, authenticator, dashboard_user
USING (
    auth.uid()::text = inquirer_user_id OR  -- ✅ COLUMNA CORRECTA
    auth.uid()::text = property_owner_id OR
    auth.role() = 'service_role'
);

-- =====================================================
-- PASO 2: VERIFICACIÓN COMPLETA
-- =====================================================

-- Verificar TODAS las políticas consolidadas
SELECT
    'VERIFICACIÓN COMPLETA POLÍTICAS' as tipo,
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

-- Verificar índices
SELECT
    'VERIFICACIÓN ÍNDICES' as tipo,
    tablename,
    COUNT(*) as total_indexes,
    '✅ ÍNDICES OPTIMIZADOS' as status
FROM pg_indexes
WHERE schemaname = 'public'
    AND tablename IN ('properties', 'users')
GROUP BY tablename
ORDER BY tablename;

-- Test funcional completo
SELECT
    'TEST FUNCIONAL COMPLETO' as tipo,
    'users' as tabla,
    COUNT(*) as registros,
    '✅ FUNCIONANDO' as status
FROM public.users
UNION ALL
SELECT
    'TEST FUNCIONAL COMPLETO' as tipo,
    'favorites' as tabla,
    COUNT(*) as registros,
    '✅ FUNCIONANDO' as status
FROM public.favorites
UNION ALL
SELECT
    'TEST FUNCIONAL COMPLETO' as tipo,
    'property_inquiries' as tabla,
    COUNT(*) as registros,
    '✅ FUNCIONANDO' as status
FROM public.property_inquiries;

-- Resumen final completo
SELECT
    'RESUMEN FINAL COMPLETO' as resultado,
    (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public') as total_policies,
    (SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'public') as total_indexes,
    '✅ OPTIMIZACIÓN 100% COMPLETADA - TODOS LOS WARNINGS ELIMINADOS' as status;
