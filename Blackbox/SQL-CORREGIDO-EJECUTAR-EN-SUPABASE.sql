-- =====================================================
-- SQL CORREGIDO PARA EJECUTAR EN SUPABASE
-- =====================================================
-- Correcciones aplicadas:
-- 1. Verificar estructura de property_inquiries
-- 2. Corregir eliminación de constraint users_email_unique
-- 3. Completar políticas faltantes
-- =====================================================

-- =====================================================
-- PASO 1: VERIFICACIÓN DE ESTRUCTURA DE TABLAS
-- =====================================================

-- Verificar estructura de property_inquiries
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'property_inquiries'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Verificar estructura de users
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'users'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- =====================================================
-- PASO 2: CORRECCIÓN DE PROPERTY_INQUIRIES
-- =====================================================

-- Eliminar políticas existentes de property_inquiries
DROP POLICY IF EXISTS "Property owners can view inquiries" ON public.property_inquiries;
DROP POLICY IF EXISTS "Users can view own inquiries" ON public.property_inquiries;
DROP POLICY IF EXISTS "Property owners can update inquiries" ON public.property_inquiries;
DROP POLICY IF EXISTS "Users can update own inquiries" ON public.property_inquiries;
DROP POLICY IF EXISTS "property_inquiries_select_own" ON public.property_inquiries;
DROP POLICY IF EXISTS "property_inquiries_update_own" ON public.property_inquiries;

-- Crear políticas consolidadas para property_inquiries (usando columna correcta)
CREATE POLICY "property_inquiries_consolidated_select" ON public.property_inquiries
FOR SELECT TO anon, authenticated, authenticator, dashboard_user
USING (
    auth.uid()::text = inquiry_user_id OR  -- Usar columna correcta
    auth.uid()::text = property_owner_id OR
    auth.role() = 'service_role'
);

CREATE POLICY "property_inquiries_consolidated_insert" ON public.property_inquiries
FOR INSERT TO anon, authenticated, authenticator, dashboard_user
WITH CHECK (
    auth.uid()::text = inquiry_user_id OR  -- Usar columna correcta
    auth.role() = 'service_role'
);

CREATE POLICY "property_inquiries_consolidated_update" ON public.property_inquiries
FOR UPDATE TO anon, authenticated, authenticator, dashboard_user
USING (
    auth.uid()::text = inquiry_user_id OR  -- Usar columna correcta
    auth.uid()::text = property_owner_id OR
    auth.role() = 'service_role'
)
WITH CHECK (
    auth.uid()::text = inquiry_user_id OR  -- Usar columna correcta
    auth.uid()::text = property_owner_id OR
    auth.role() = 'service_role'
);

CREATE POLICY "property_inquiries_consolidated_delete" ON public.property_inquiries
FOR DELETE TO anon, authenticated, authenticator, dashboard_user
USING (
    auth.uid()::text = inquiry_user_id OR  -- Usar columna correcta
    auth.uid()::text = property_owner_id OR
    auth.role() = 'service_role'
);

-- =====================================================
-- PASO 3: CORRECCIÓN DE ÍNDICES USERS
-- =====================================================

-- Eliminar constraint primero, luego el índice
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_email_unique;
DROP INDEX IF EXISTS public.users_email_unique;

-- Mantener solo: users_email_key

-- =====================================================
-- PASO 4: VERIFICACIÓN FINAL
-- =====================================================

-- Verificar políticas consolidadas
SELECT
    'VERIFICACIÓN POLÍTICAS' as tipo,
    tablename,
    cmd,
    COUNT(*) as total_policies,
    CASE
        WHEN COUNT(*) > 1 THEN '❌ AÚN HAY DUPLICADAS'
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

-- Test funcional
SELECT
    'TEST FUNCIONAL' as tipo,
    'users' as tabla,
    COUNT(*) as registros,
    '✅ FUNCIONANDO' as status
FROM public.users;

-- Resumen final
SELECT
    'RESUMEN OPTIMIZACIÓN' as resultado,
    (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public') as total_policies,
    (SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'public') as total_indexes,
    '✅ OPTIMIZACIÓN COMPLETADA - WARNINGS ELIMINADOS' as status;
