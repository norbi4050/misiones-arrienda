-- =====================================================
-- SOLUCIÓN DEFINITIVA: CORRECCIÓN AUTH_RLS_INITPLAN WARNINGS
-- =====================================================
-- Fecha: 2025-01-27
-- Problema: Políticas con auth.uid() sin (select ...) causando warnings de performance
-- Solución: Recrear todas las políticas con sintaxis correcta
-- =====================================================

-- =====================================================
-- PASO 1: ELIMINAR POLÍTICAS PROBLEMÁTICAS
-- =====================================================

-- USERS POLICIES
DROP POLICY IF EXISTS "users_select_optimized_final" ON public.users;
DROP POLICY IF EXISTS "users_insert_optimized_final" ON public.users;
DROP POLICY IF EXISTS "users_update_optimized_final" ON public.users;
DROP POLICY IF EXISTS "users_delete_optimized_final" ON public.users;

-- FAVORITES POLICIES
DROP POLICY IF EXISTS "favorites_select_optimized_final" ON public.favorites;
DROP POLICY IF EXISTS "favorites_insert_optimized_final" ON public.favorites;
DROP POLICY IF EXISTS "favorites_update_optimized_final" ON public.favorites;
DROP POLICY IF EXISTS "favorites_delete_optimized_final" ON public.favorites;

-- PROPERTY_INQUIRIES POLICIES
DROP POLICY IF EXISTS "property_inquiries_select_optimized_final" ON public.property_inquiries;
DROP POLICY IF EXISTS "property_inquiries_insert_optimized_final" ON public.property_inquiries;
DROP POLICY IF EXISTS "property_inquiries_update_optimized_final" ON public.property_inquiries;
DROP POLICY IF EXISTS "property_inquiries_delete_optimized_final" ON public.property_inquiries;

-- =====================================================
-- PASO 2: RECREAR POLÍTICAS CON SINTAXIS CORRECTA
-- =====================================================

-- USERS POLICIES
CREATE POLICY "users_select_optimized_final" ON public.users
FOR SELECT TO anon, authenticated, authenticator, dashboard_user
USING (
    id::text = (select auth.uid()::text) OR
    auth.role() = 'service_role'
);

CREATE POLICY "users_insert_optimized_final" ON public.users
FOR INSERT TO anon, authenticated, authenticator, dashboard_user
WITH CHECK (
    id::text = (select auth.uid()::text) OR
    auth.role() = 'service_role'
);

CREATE POLICY "users_update_optimized_final" ON public.users
FOR UPDATE TO anon, authenticated, authenticator, dashboard_user
USING (
    id::text = (select auth.uid()::text) OR
    auth.role() = 'service_role'
)
WITH CHECK (
    id::text = (select auth.uid()::text) OR
    auth.role() = 'service_role'
);

CREATE POLICY "users_delete_optimized_final" ON public.users
FOR DELETE TO anon, authenticated, authenticator, dashboard_user
USING (
    id::text = (select auth.uid()::text) OR
    auth.role() = 'service_role'
);

-- FAVORITES POLICIES
CREATE POLICY "favorites_select_optimized_final" ON public.favorites
FOR SELECT TO anon, authenticated, authenticator, dashboard_user
USING (
    user_id::text = (select auth.uid()::text) OR
    auth.role() = 'service_role'
);

CREATE POLICY "favorites_insert_optimized_final" ON public.favorites
FOR INSERT TO anon, authenticated, authenticator, dashboard_user
WITH CHECK (
    user_id::text = (select auth.uid()::text) OR
    auth.role() = 'service_role'
);

CREATE POLICY "favorites_update_optimized_final" ON public.favorites
FOR UPDATE TO anon, authenticated, authenticator, dashboard_user
USING (
    user_id::text = (select auth.uid()::text) OR
    auth.role() = 'service_role'
)
WITH CHECK (
    user_id::text = (select auth.uid()::text) OR
    auth.role() = 'service_role'
);

CREATE POLICY "favorites_delete_optimized_final" ON public.favorites
FOR DELETE TO anon, authenticated, authenticator, dashboard_user
USING (
    user_id::text = (select auth.uid()::text) OR
    auth.role() = 'service_role'
);

-- PROPERTY_INQUIRIES POLICIES
CREATE POLICY "property_inquiries_select_optimized_final" ON public.property_inquiries
FOR SELECT TO anon, authenticated, authenticator, dashboard_user
USING (
    inquirer_user_id::text = (select auth.uid()::text) OR
    auth.role() = 'service_role'
);

CREATE POLICY "property_inquiries_insert_optimized_final" ON public.property_inquiries
FOR INSERT TO anon, authenticated, authenticator, dashboard_user
WITH CHECK (
    inquirer_user_id::text = (select auth.uid()::text) OR
    auth.role() = 'service_role'
);

CREATE POLICY "property_inquiries_update_optimized_final" ON public.property_inquiries
FOR UPDATE TO anon, authenticated, authenticator, dashboard_user
USING (
    inquirer_user_id::text = (select auth.uid()::text) OR
    auth.role() = 'service_role'
)
WITH CHECK (
    inquirer_user_id::text = (select auth.uid()::text) OR
    auth.role() = 'service_role'
);

CREATE POLICY "property_inquiries_delete_optimized_final" ON public.property_inquiries
FOR DELETE TO anon, authenticated, authenticator, dashboard_user
USING (
    inquirer_user_id::text = (select auth.uid()::text) OR
    auth.role() = 'service_role'
);

-- =====================================================
-- PASO 3: VERIFICACIÓN FINAL
-- =====================================================

-- Verificar que las políticas se crearon correctamente
SELECT
    'VERIFICACIÓN POLÍTICAS RECREADAS' as estado,
    schemaname,
    tablename,
    policyname,
    cmd
FROM pg_policies
WHERE schemaname = 'public'
    AND tablename IN ('users', 'favorites', 'property_inquiries')
    AND policyname LIKE '%_optimized_final'
ORDER BY tablename, policyname;

-- Verificar que no hay políticas problemáticas
SELECT
    'VERIFICACIÓN AUTH.UID() SIN SELECT' as tipo,
    COUNT(*) as politicas_problematicas
FROM pg_policies
WHERE schemaname = 'public'
    AND tablename IN ('users', 'favorites', 'property_inquiries')
    AND qual LIKE '%auth.uid()%'
    AND qual NOT LIKE '%(select auth.uid())%';

-- =====================================================
-- RESULTADO ESPERADO:
-- - 12 políticas recreadas con sintaxis correcta
-- - 0 políticas problemáticas restantes
-- - Warnings AUTH_RLS_INITPLAN eliminados
-- =====================================================
