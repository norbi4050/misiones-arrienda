-- ============================================================================
-- FIX FINAL: RLS Policy para tabla public.users (snake_case)
-- Fecha: 16 de Enero 2025
-- Problema: RLS bloquea lectura de public.users cuando se usa ANON KEY
-- Solución: Crear policy pública para SELECT en tabla users
-- ============================================================================

\echo '============================================================================'
\echo 'FIX FINAL: RLS POLICY PARA public.users (snake_case)'
\echo 'Fecha: 2025-01-16'
\echo '============================================================================'
\echo ''

-- ============================================================================
-- PASO 1: VERIFICAR POLICIES ACTUALES
-- ============================================================================

\echo '--- 1. POLICIES ACTUALES EN public.users ---'
\echo ''

SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual AS using_expression
FROM pg_policies
WHERE schemaname = 'public'
    AND tablename = 'users'
ORDER BY policyname;

\echo ''

-- ============================================================================
-- PASO 2: APLICAR FIX
-- ============================================================================

\echo '--- 2. APLICANDO FIX: Permitir lectura pública ---'
\echo ''

-- Eliminar policy restrictiva si existe
DROP POLICY IF EXISTS "Users can view own data" ON public.users;

-- Crear policy pública para SELECT
-- Permite que cualquier usuario autenticado pueda leer datos básicos de otros usuarios
CREATE POLICY "Anyone can view basic user data" ON public.users
FOR SELECT TO authenticated
USING (true);

-- Mantener policy de UPDATE (solo propio perfil)
DROP POLICY IF EXISTS "Users can update own data" ON public.users;
CREATE POLICY "Users can update own data" ON public.users
FOR UPDATE TO authenticated
USING (id = auth.uid()::text)
WITH CHECK (id = auth.uid()::text);

\echo ''
\echo '✓ Policies creadas exitosamente'
\echo ''

-- ============================================================================
-- PASO 3: VERIFICAR POLICIES DESPUÉS DEL FIX
-- ============================================================================

\echo '--- 3. POLICIES DESPUÉS DEL FIX ---'
\echo ''

SELECT
    policyname,
    cmd AS operation,
    qual AS using_expression
FROM pg_policies
WHERE schemaname = 'public'
    AND tablename = 'users'
ORDER BY policyname;

\echo ''

-- ============================================================================
-- PASO 4: TESTING
-- ============================================================================

\echo '--- 4. TESTING: Consultar usuario 6403f9d2... ---'
\echo ''

SELECT
    id,
    name,
    email,
    avatar,
    profile_image,
    logo_url
FROM public.users
WHERE id = '6403f9d2-e846-4c70-87e0-e051127d9500';

\echo ''
\echo '============================================================================'
\echo 'FIX COMPLETADO'
\echo '============================================================================'
\echo ''
\echo 'PRÓXIMOS PASOS:'
\echo '  1. Probar endpoint: GET /api/users/avatar?userId=6403f9d2-e846-4c70-87e0-e051127d9500'
\echo '  2. Debería retornar:'
\echo '     {"url": "https://...avatar.jpg", "v": 1758519463, "source": "users_deprecated"}'
\echo '  3. El avatar debería mostrarse en la UI'
\echo ''
