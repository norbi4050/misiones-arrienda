-- =====================================================
-- SQL PARA ELIMINAR ÚLTIMA POLÍTICA DUPLICADA
-- =====================================================
-- Elimina la política INSERT duplicada restante en property_inquiries
-- =====================================================

-- Verificar cuál es la política duplicada
SELECT
    schemaname,
    tablename,
    policyname,
    cmd,
    roles
FROM pg_policies
WHERE schemaname = 'public'
    AND tablename = 'property_inquiries'
    AND cmd = 'INSERT'
ORDER BY policyname;

-- Eliminar la política duplicada (mantener solo una)
-- IMPORTANTE: Reemplaza 'NOMBRE_DE_LA_POLITICA_DUPLICADA' con el nombre real
-- que aparezca en la consulta anterior

-- DROP POLICY IF EXISTS "NOMBRE_DE_LA_POLITICA_DUPLICADA" ON public.property_inquiries;

-- Si no sabes cuál eliminar, ejecuta esto para eliminar todas y recrear:
DROP POLICY IF EXISTS "property_inquiries_simple_insert" ON public.property_inquiries;
DROP POLICY IF EXISTS "property_inquiries_consolidated_insert" ON public.property_inquiries;

-- Recrear la política correcta
CREATE POLICY "property_inquiries_final_insert" ON public.property_inquiries
FOR INSERT TO anon, authenticated, authenticator, dashboard_user
WITH CHECK (
    auth.uid()::text = inquirer_user_id OR
    auth.role() = 'service_role'
);

-- Verificación final
SELECT
    'VERIFICACIÓN FINAL' as tipo,
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
    AND tablename = 'property_inquiries'
    AND cmd = 'INSERT'
GROUP BY tablename, cmd;

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
    'CONTEO FINAL DE WARNINGS' as verificacion,
    tipo,
    cantidad,
    CASE
        WHEN tipo = 'multiple_permissive_policies' AND cantidad = 0 THEN '🎉 ÉXITO TOTAL - TODOS LOS WARNINGS ELIMINADOS'
        WHEN tipo = 'multiple_permissive_policies' AND cantidad > 0 THEN '⚠️ AÚN HAY WARNINGS DE POLÍTICAS'
    END as status
FROM warnings_check;
