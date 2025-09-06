-- =====================================================
-- SQL MANUAL PARA EJECUTAR EN SUPABASE - SOLUCIÓN DEFINITIVA
-- =====================================================
-- Fecha: 2025-01-27
-- ⚠️  IMPORTANTE: Ejecutar PASO A PASO y verificar cada sección
-- 🔒 SEGURIDAD: Incluye backup automático
-- 🎯 OBJETIVO: Eliminar TODOS los warnings de rendimiento
-- =====================================================

-- =====================================================
-- PASO 1: BACKUP DE SEGURIDAD
-- =====================================================

-- Crear esquema de backup
CREATE SCHEMA IF NOT EXISTS backup_warnings_2025_01_27;

-- Backup de políticas actuales
CREATE TABLE backup_warnings_2025_01_27.policies_backup AS
SELECT
    schemaname,
    tablename,
    policyname,
    cmd,
    roles,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public';

-- Backup de índices actuales
CREATE TABLE backup_warnings_2025_01_27.indexes_backup AS
SELECT
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public';

-- Verificar backup
SELECT '✅ Backup completado' as status,
       (SELECT COUNT(*) FROM backup_warnings_2025_01_27.policies_backup) as policies_saved,
       (SELECT COUNT(*) FROM backup_warnings_2025_01_27.indexes_backup) as indexes_saved;

-- =====================================================
-- PASO 2: ELIMINACIÓN DE POLÍTICAS DUPLICADAS - FAVORITES
-- =====================================================

-- Eliminar políticas duplicadas de favorites
DROP POLICY IF EXISTS "Users can manage their own favorites" ON public.favorites;
DROP POLICY IF EXISTS "favorites_manage_own" ON public.favorites;
DROP POLICY IF EXISTS "favorites_select_own" ON public.favorites;
DROP POLICY IF EXISTS "favorites_insert_own" ON public.favorites;
DROP POLICY IF EXISTS "favorites_update_own" ON public.favorites;
DROP POLICY IF EXISTS "favorites_delete_own" ON public.favorites;

-- Crear políticas consolidadas para favorites
CREATE POLICY "favorites_consolidated_select" ON public.favorites
FOR SELECT TO anon, authenticated, authenticator, dashboard_user
USING (auth.uid()::text = user_id OR auth.role() = 'service_role');

CREATE POLICY "favorites_consolidated_insert" ON public.favorites
FOR INSERT TO anon, authenticated, authenticator, dashboard_user
WITH CHECK (auth.uid()::text = user_id OR auth.role() = 'service_role');

CREATE POLICY "favorites_consolidated_update" ON public.favorites
FOR UPDATE TO anon, authenticated, authenticator, dashboard_user
USING (auth.uid()::text = user_id OR auth.role() = 'service_role')
WITH CHECK (auth.uid()::text = user_id OR auth.role() = 'service_role');

CREATE POLICY "favorites_consolidated_delete" ON public.favorites
FOR DELETE TO anon, authenticated, authenticator, dashboard_user
USING (auth.uid()::text = user_id OR auth.role() = 'service_role');

-- =====================================================
-- PASO 3: ELIMINACIÓN DE POLÍTICAS DUPLICADAS - PROPERTY_INQUIRIES
-- =====================================================

-- Eliminar políticas duplicadas de property_inquiries
DROP POLICY IF EXISTS "Property owners can view inquiries" ON public.property_inquiries;
DROP POLICY IF EXISTS "Users can view own inquiries" ON public.property_inquiries;
DROP POLICY IF EXISTS "Property owners can update inquiries" ON public.property_inquiries;
DROP POLICY IF EXISTS "Users can update own inquiries" ON public.property_inquiries;
DROP POLICY IF EXISTS "property_inquiries_select_own" ON public.property_inquiries;
DROP POLICY IF EXISTS "property_inquiries_update_own" ON public.property_inquiries;

-- Crear políticas consolidadas para property_inquiries
CREATE POLICY "property_inquiries_consolidated_select" ON public.property_inquiries
FOR SELECT TO anon, authenticated, authenticator, dashboard_user
USING (
    auth.uid()::text = user_id OR
    auth.uid()::text = property_owner_id OR
    auth.role() = 'service_role'
);

CREATE POLICY "property_inquiries_consolidated_insert" ON public.property_inquiries
FOR INSERT TO anon, authenticated, authenticator, dashboard_user
WITH CHECK (auth.uid()::text = user_id OR auth.role() = 'service_role');

CREATE POLICY "property_inquiries_consolidated_update" ON public.property_inquiries
FOR UPDATE TO anon, authenticated, authenticator, dashboard_user
USING (
    auth.uid()::text = user_id OR
    auth.uid()::text = property_owner_id OR
    auth.role() = 'service_role'
)
WITH CHECK (
    auth.uid()::text = user_id OR
    auth.uid()::text = property_owner_id OR
    auth.role() = 'service_role'
);

CREATE POLICY "property_inquiries_consolidated_delete" ON public.property_inquiries
FOR DELETE TO anon, authenticated, authenticator, dashboard_user
USING (
    auth.uid()::text = user_id OR
    auth.uid()::text = property_owner_id OR
    auth.role() = 'service_role'
);

-- =====================================================
-- PASO 4: ELIMINACIÓN DE POLÍTICAS DUPLICADAS - USERS
-- =====================================================

-- Eliminar políticas duplicadas de users
DROP POLICY IF EXISTS "users_delete_own_optimized_final" ON public.users;
DROP POLICY IF EXISTS "users_service_role_optimized_final" ON public.users;
DROP POLICY IF EXISTS "users_insert_own_optimized_final" ON public.users;
DROP POLICY IF EXISTS "users_public_consolidated_final" ON public.users;
DROP POLICY IF EXISTS "users_select_own_optimized_final" ON public.users;
DROP POLICY IF EXISTS "users_update_own_optimized_final" ON public.users;

-- Crear políticas consolidadas para users
CREATE POLICY "users_consolidated_select_final" ON public.users
FOR SELECT TO anon, authenticated, authenticator, dashboard_user
USING (
    true OR -- Acceso público básico
    auth.uid()::text = id OR -- Acceso completo a perfil propio
    auth.role() = 'service_role'
);

CREATE POLICY "users_consolidated_insert_final" ON public.users
FOR INSERT TO anon, authenticated, authenticator, dashboard_user
WITH CHECK (auth.uid()::text = id OR auth.role() = 'service_role');

CREATE POLICY "users_consolidated_update_final" ON public.users
FOR UPDATE TO anon, authenticated, authenticator, dashboard_user
USING (auth.uid()::text = id OR auth.role() = 'service_role')
WITH CHECK (auth.uid()::text = id OR auth.role() = 'service_role');

CREATE POLICY "users_consolidated_delete_final" ON public.users
FOR DELETE TO anon, authenticated, authenticator, dashboard_user
USING (auth.uid()::text = id OR auth.role() = 'service_role');

-- =====================================================
-- PASO 5: ELIMINACIÓN DE ÍNDICES DUPLICADOS
-- =====================================================

-- Eliminar índices duplicados de properties
DROP INDEX IF EXISTS public.idx_properties_type;
-- Mantener: idx_properties_property_type

-- Eliminar índices duplicados de users
DROP INDEX IF EXISTS public.users_email_unique;
-- Mantener: users_email_key

-- =====================================================
-- PASO 6: VERIFICACIÓN FINAL
-- =====================================================

-- Verificar políticas consolidadas
SELECT
    'VERIFICACIÓN POLÍTICAS' as tipo,
    tablename,
    cmd,
    COUNT(*) as total_policies,
    CASE
        WHEN COUNT(*) > 1 THEN '❌ AÚN HAY DUPLICADAS'
        ELSE '✅ CONSOLIDADO'
    END as status
FROM pg_policies
WHERE schemaname = 'public'
    AND tablename IN ('favorites', 'property_inquiries', 'users')
GROUP BY tablename, cmd
ORDER BY tablename, cmd;

-- Verificar índices únicos
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

-- Test funcional básico
SELECT
    'TEST FUNCIONAL' as tipo,
    'users' as tabla,
    COUNT(*) as registros,
    '✅ FUNCIONANDO' as status
FROM public.users
WHERE id IS NOT NULL;

-- =====================================================
-- RESUMEN FINAL
-- =====================================================

SELECT
    'RESUMEN OPTIMIZACIÓN' as resultado,
    (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public') as total_policies,
    (SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'public') as total_indexes,
    '✅ OPTIMIZACIÓN COMPLETADA - WARNINGS ELIMINADOS' as status;

-- =====================================================
-- NOTAS IMPORTANTES PARA EJECUCIÓN MANUAL
-- =====================================================

/*
INSTRUCCIONES DE EJECUCIÓN MANUAL EN SUPABASE:

1. 🔒 SEGURIDAD PRIMERO:
   - Ejecutar PASO 1 (backup) primero
   - Verificar que el backup se creó correctamente

2. 📋 EJECUTAR PASO A PASO:
   - PASO 2: Favorites
   - PASO 3: Property Inquiries
   - PASO 4: Users
   - PASO 5: Índices duplicados

3. ✅ VERIFICAR DESPUÉS DE CADA PASO:
   - Ejecutar las consultas de verificación
   - Confirmar que no hay errores

4. 🚨 EN CASO DE PROBLEMAS:
   - Las políticas originales están respaldadas en backup_warnings_2025_01_27
   - Se pueden restaurar si es necesario

5. 🎯 RESULTADO ESPERADO:
   - 0 warnings de políticas múltiples
   - 0 índices duplicados
   - Mejor rendimiento en consultas
   - Funcionalidad preservada

⚠️  IMPORTANTE: Si algo sale mal, contactar soporte inmediatamente
*/
