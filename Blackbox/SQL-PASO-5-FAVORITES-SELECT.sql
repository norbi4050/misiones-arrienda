-- =====================================================
-- PASO 5: CORRECCIÓN FAVORITES SELECT POLICY
-- =====================================================
-- Corrige específicamente la política favorites_select_optimized_final
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
    AND tablename = 'favorites'
    AND policyname = 'favorites_select_optimized_final';

-- Crear política temporal corregida
DROP POLICY IF EXISTS "favorites_select_temp" ON public.favorites;
CREATE POLICY "favorites_select_temp" ON public.favorites
FOR SELECT TO anon, authenticated, authenticator, dashboard_user
USING (
    user_id::text = (select auth.uid()::text) OR
    auth.role() = 'service_role'
);

-- Eliminar política antigua
DROP POLICY IF EXISTS "favorites_select_optimized_final" ON public.favorites;

-- Renombrar política temporal a final
ALTER POLICY "favorites_select_temp" ON public.favorites RENAME TO "favorites_select_optimized_final";

-- Verificar que la corrección fue exitosa
SELECT
    'POLÍTICA CORREGIDA' as estado,
    schemaname,
    tablename,
    policyname,
    cmd
FROM pg_policies
WHERE schemaname = 'public'
    AND tablename = 'favorites'
    AND policyname = 'favorites_select_optimized_final';
