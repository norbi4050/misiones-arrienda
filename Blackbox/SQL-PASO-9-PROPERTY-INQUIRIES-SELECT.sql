-- =====================================================
-- PASO 9: CORRECCIÓN PROPERTY_INQUIRIES SELECT POLICY
-- =====================================================
-- Corrige específicamente la política property_inquiries_select_optimized_final
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
    AND tablename = 'property_inquiries'
    AND policyname = 'property_inquiries_select_optimized_final';

-- Crear política temporal corregida
DROP POLICY IF EXISTS "property_inquiries_select_temp" ON public.property_inquiries;
CREATE POLICY "property_inquiries_select_temp" ON public.property_inquiries
FOR SELECT TO anon, authenticated, authenticator, dashboard_user
USING (
    user_id::text = (select auth.uid()::text) OR
    auth.role() = 'service_role'
);

-- Eliminar política antigua
DROP POLICY IF EXISTS "property_inquiries_select_optimized_final" ON public.property_inquiries;

-- Renombrar política temporal a final
ALTER POLICY "property_inquiries_select_temp" ON public.property_inquiries RENAME TO "property_inquiries_select_optimized_final";

-- Verificar que la corrección fue exitosa
SELECT
    'POLÍTICA CORREGIDA' as estado,
    schemaname,
    tablename,
    policyname,
    cmd
FROM pg_policies
WHERE schemaname = 'public'
    AND tablename = 'property_inquiries'
    AND policyname = 'property_inquiries_select_optimized_final';
