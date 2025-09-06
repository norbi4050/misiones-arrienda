-- =====================================================
-- PASO 1: CORRECCIÓN USERS SELECT POLICY
-- =====================================================
-- Corrige específicamente la política users_select_optimized_final
-- =====================================================

-- Verificar política actual antes de modificar
SELECT
    'POLÍTICA ACTUAL' as estado,
    schemaname,
    tablename,
    policyname,
    cmd
FROM pg_policies
WHERE schemaname = 'public'
    AND tablename = 'users'
    AND policyname = 'users_select_optimized_final';

-- Crear política temporal corregida
DROP POLICY IF EXISTS "users_select_temp" ON public.users;
CREATE POLICY "users_select_temp" ON public.users
FOR SELECT TO anon, authenticated, authenticator, dashboard_user
USING (
    id::text = (select auth.uid()::text) OR
    auth.role() = 'service_role'
);

-- Eliminar política antigua
DROP POLICY IF EXISTS "users_select_optimized_final" ON public.users;

-- Renombrar política temporal a final
ALTER POLICY "users_select_temp" ON public.users RENAME TO "users_select_optimized_final";

-- Verificar que la corrección fue exitosa
SELECT
    'POLÍTICA CORREGIDA' as estado,
    schemaname,
    tablename,
    policyname,
    cmd
FROM pg_policies
WHERE schemaname = 'public'
    AND tablename = 'users'
    AND policyname = 'users_select_optimized_final';
