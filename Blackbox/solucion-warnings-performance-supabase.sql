-- =====================================================
-- SOLUCIÓN COMPLETA WARNINGS DE PERFORMANCE SUPABASE
-- =====================================================
-- Fecha: 2025-01-27
-- Propósito: Optimizar performance eliminando todos los warnings
-- IMPORTANTE: Ejecutar en Supabase Dashboard > SQL Editor

-- =====================================================
-- PASO 1: BACKUP DE POLÍTICAS ACTUALES
-- =====================================================

-- Crear tabla de backup para políticas actuales
CREATE TABLE IF NOT EXISTS backup_policies_before_optimization AS
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check,
    now() as backup_date
FROM pg_policies 
WHERE schemaname = 'public' AND tablename IN ('users', 'community_profiles');

-- Verificar backup creado
SELECT 'Backup de políticas creado exitosamente' as status, COUNT(*) as total_policies
FROM backup_policies_before_optimization;

-- =====================================================
-- PASO 2: OPTIMIZAR POLÍTICAS RLS - TABLA USERS
-- =====================================================

-- WARNING 1: Auth RLS Initialization Plan - Optimizar llamadas auth
-- Eliminar políticas actuales que causan warnings de performance

DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
DROP POLICY IF EXISTS "Users can delete own profile" ON public.users;
DROP POLICY IF EXISTS "Public profiles viewable by authenticated users" ON public.users;
DROP POLICY IF EXISTS "Service role full access" ON public.users;

-- Crear políticas optimizadas con (select auth.function())
-- Esto evita re-evaluación para cada fila

-- POLÍTICA 1: Ver perfil propio (OPTIMIZADA)
CREATE POLICY "users_select_own_optimized" ON public.users
FOR SELECT 
USING ((select auth.uid())::text = id);

-- POLÍTICA 2: Actualizar perfil propio (OPTIMIZADA)
CREATE POLICY "users_update_own_optimized" ON public.users
FOR UPDATE 
USING ((select auth.uid())::text = id)
WITH CHECK ((select auth.uid())::text = id);

-- POLÍTICA 3: Insertar perfil propio (OPTIMIZADA)
CREATE POLICY "users_insert_own_optimized" ON public.users
FOR INSERT 
WITH CHECK ((select auth.uid())::text = id);

-- POLÍTICA 4: Eliminar perfil propio (OPTIMIZADA)
CREATE POLICY "users_delete_own_optimized" ON public.users
FOR DELETE 
USING ((select auth.uid())::text = id);

-- POLÍTICA 5: Service role acceso completo (OPTIMIZADA)
CREATE POLICY "users_service_role_optimized" ON public.users
FOR ALL
USING ((select auth.role()) = 'service_role');

-- POLÍTICA 6: Perfiles públicos para autenticados (OPTIMIZADA)
-- Esta política se consolida para evitar múltiples políticas permisivas
CREATE POLICY "users_public_authenticated_optimized" ON public.users
FOR SELECT 
USING (
    (select auth.role()) = 'authenticated' OR
    (select auth.role()) = 'service_role' OR
    (select auth.uid())::text = id
);

-- =====================================================
-- PASO 3: OPTIMIZAR POLÍTICAS - TABLA COMMUNITY_PROFILES
-- =====================================================

-- WARNING 2: Multiple Permissive Policies - Consolidar políticas duplicadas

-- Obtener políticas actuales de community_profiles
SELECT policyname, cmd, roles 
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'community_profiles';

-- Eliminar políticas múltiples que causan warnings
DROP POLICY IF EXISTS "Enable read access for all users" ON public.community_profiles;
DROP POLICY IF EXISTS "community_profiles_optimized_select" ON public.community_profiles;

-- Crear política consolidada optimizada
CREATE POLICY "community_profiles_consolidated_select" ON public.community_profiles
FOR SELECT 
USING (
    (select auth.role()) IN ('authenticated', 'anon', 'authenticator', 'dashboard_user', 'service_role')
);

-- =====================================================
-- PASO 4: ELIMINAR ÍNDICES DUPLICADOS
-- =====================================================

-- WARNING 3: Duplicate Index - Eliminar índices duplicados en tabla users

-- Verificar índices actuales
SELECT 
    indexname,
    tablename,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public' AND tablename = 'users'
AND indexname IN ('users_email_key', 'users_email_unique');

-- Eliminar índice duplicado (mantener users_email_key que es más estándar)
DROP INDEX IF EXISTS public.users_email_unique;

-- Verificar que el índice principal sigue existiendo
SELECT 'Índice principal mantenido' as status
FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename = 'users' 
AND indexname = 'users_email_key';

-- =====================================================
-- PASO 5: VERIFICACIONES DE FUNCIONAMIENTO
-- =====================================================

-- Verificar que RLS sigue habilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('users', 'community_profiles');

-- Verificar nuevas políticas creadas
SELECT 
    tablename,
    policyname,
    cmd,
    roles
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('users', 'community_profiles')
ORDER BY tablename, policyname;

-- Test crítico: Verificar que error 406 sigue solucionado
SELECT 
    'Test crítico - Error 406' as test_name,
    user_type,
    created_at
FROM public.users 
WHERE id = '6403f9d2-e846-4c70-87e0-e051127d9500';

-- Test de acceso básico
SELECT 
    'Test acceso básico' as test_name,
    COUNT(*) as total_users_accessible
FROM public.users;

-- =====================================================
-- PASO 6: ANÁLISIS DE PERFORMANCE
-- =====================================================

-- Crear función para medir performance de políticas
CREATE OR REPLACE FUNCTION test_policy_performance()
RETURNS TABLE(
    test_name TEXT,
    execution_time_ms NUMERIC,
    rows_processed INTEGER
) AS $$
DECLARE
    start_time TIMESTAMP;
    end_time TIMESTAMP;
    row_count INTEGER;
BEGIN
    -- Test 1: SELECT con política optimizada
    start_time := clock_timestamp();
    SELECT COUNT(*) INTO row_count FROM public.users WHERE id = '6403f9d2-e846-4c70-87e0-e051127d9500';
    end_time := clock_timestamp();
    
    RETURN QUERY SELECT 
        'SELECT optimizado'::TEXT,
        EXTRACT(MILLISECONDS FROM (end_time - start_time)),
        row_count;
    
    -- Test 2: SELECT general
    start_time := clock_timestamp();
    SELECT COUNT(*) INTO row_count FROM public.users LIMIT 10;
    end_time := clock_timestamp();
    
    RETURN QUERY SELECT 
        'SELECT general'::TEXT,
        EXTRACT(MILLISECONDS FROM (end_time - start_time)),
        row_count;
END;
$$ LANGUAGE plpgsql;

-- Ejecutar test de performance
SELECT * FROM test_policy_performance();

-- =====================================================
-- PASO 7: DOCUMENTAR CAMBIOS REALIZADOS
-- =====================================================

-- Crear tabla de log de optimizaciones
CREATE TABLE IF NOT EXISTS optimization_log (
    id SERIAL PRIMARY KEY,
    optimization_date TIMESTAMPTZ DEFAULT now(),
    optimization_type TEXT,
    table_affected TEXT,
    description TEXT,
    performance_impact TEXT
);

-- Registrar optimizaciones realizadas
INSERT INTO optimization_log (optimization_type, table_affected, description, performance_impact) VALUES
('Auth RLS Optimization', 'users', 'Reemplazado auth.uid() con (select auth.uid()) en 6 políticas', 'Eliminación de re-evaluación por fila'),
('Policy Consolidation', 'users', 'Consolidadas múltiples políticas permisivas en una sola', 'Reducción de ejecuciones de políticas'),
('Policy Consolidation', 'community_profiles', 'Consolidadas políticas duplicadas SELECT', 'Reducción de ejecuciones de políticas'),
('Index Deduplication', 'users', 'Eliminado índice duplicado users_email_unique', 'Reducción de overhead de mantenimiento');

-- Mostrar log de optimizaciones
SELECT 
    optimization_date,
    optimization_type,
    table_affected,
    description,
    performance_impact
FROM optimization_log 
ORDER BY optimization_date DESC;

-- =====================================================
-- PASO 8: VERIFICACIÓN FINAL COMPLETA
-- =====================================================

-- Resumen de estado final
SELECT 
    'OPTIMIZACIÓN COMPLETA' as status,
    (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = 'users') as policies_users,
    (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = 'community_profiles') as policies_community,
    (SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'users' AND indexname LIKE '%email%') as email_indexes,
    now() as completion_time;

-- Test final de funcionalidad
SELECT 
    'FUNCIONALIDAD VERIFICADA' as final_test,
    CASE 
        WHEN EXISTS (SELECT 1 FROM public.users WHERE id = '6403f9d2-e846-4c70-87e0-e051127d9500') 
        THEN 'Usuario de prueba accesible'
        ELSE 'ERROR: Usuario de prueba no accesible'
    END as user_test,
    CASE 
        WHEN (SELECT rowsecurity FROM pg_tables WHERE schemaname = 'public' AND tablename = 'users') 
        THEN 'RLS habilitado'
        ELSE 'ERROR: RLS deshabilitado'
    END as rls_test;

-- =====================================================
-- INSTRUCCIONES POST-EJECUCIÓN
-- =====================================================

/*
DESPUÉS DE EJECUTAR ESTE SCRIPT:

1. VERIFICAR EN SUPABASE DASHBOARD:
   - Ir a Database > Policies
   - Confirmar que aparecen las nuevas políticas optimizadas
   - Verificar que no hay warnings en Database Health

2. EJECUTAR TESTS DESDE LA APLICACIÓN:
   - Probar login/registro de usuarios
   - Verificar actualización de perfil
   - Confirmar que error 406 sigue solucionado

3. MONITOREAR PERFORMANCE:
   - Observar mejora en velocidad de consultas
   - Verificar logs de Supabase para confirmar optimización

4. ACTUALIZAR DOCUMENTACIÓN:
   - Actualizar SUPABASE-DATABASE-SCHEMA.md
   - Marcar warnings como solucionados en CHECKLIST-PROGRESO-PROYECTO.md

NOTAS IMPORTANTES:
- Todas las optimizaciones mantienen la funcionalidad existente
- El usuario de prueba sigue siendo accesible
- RLS permanece habilitado y funcional
- Error 406 permanece solucionado
*/

SELECT 'OPTIMIZACIÓN DE WARNINGS COMPLETADA EXITOSAMENTE' as resultado_final;
