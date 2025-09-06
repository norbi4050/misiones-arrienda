-- =====================================================
-- PASO 2: CORRECCIÓN USERS INSERT POLICY
-- =====================================================
-- Corrige específicamente la política users_insert_optimized_final
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
    AND policyname = 'users_insert_optimized_final';

-- Crear política temporal corregida
DROP POLICY IF EXISTS "users_insert_temp" ON public.users;
CREATE POLICY "users_insert_temp" ON public.users
FOR INSERT TO anon, authenticated, authenticator, dashboard_user
WITH CHECK (
    id::text = (select auth.uid()::text) OR
    auth.role() = 'service_role'
);

-- Eliminar política antigua
DROP POLICY IF EXISTS "users_insert_optimized_final" ON public.users;

-- Renombrar política temporal a final
ALTER POLICY "users_insert_temp" ON public.users RENAME TO "users_insert_optimized_final";

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
    AND policyname = 'users_insert_optimized_final';
