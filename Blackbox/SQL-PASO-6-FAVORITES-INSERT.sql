-- =====================================================
-- PASO 6: CORRECCIÓN FAVORITES INSERT POLICY
-- =====================================================
-- Corrige específicamente la política favorites_insert_optimized_final
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
    AND policyname = 'favorites_insert_optimized_final';

-- Crear política temporal corregida
DROP POLICY IF EXISTS "favorites_insert_temp" ON public.favorites;
CREATE POLICY "favorites_insert_temp" ON public.favorites
FOR INSERT TO anon, authenticated, authenticator, dashboard_user
WITH CHECK (
    user_id::text = (select auth.uid()::text) OR
    auth.role() = 'service_role'
);

-- Eliminar política antigua
DROP POLICY IF EXISTS "favorites_insert_optimized_final" ON public.favorites;

-- Renombrar política temporal a final
ALTER POLICY "favorites_insert_temp" ON public.favorites RENAME TO "favorites_insert_optimized_final";

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
    AND policyname = 'favorites_insert_optimized_final';
