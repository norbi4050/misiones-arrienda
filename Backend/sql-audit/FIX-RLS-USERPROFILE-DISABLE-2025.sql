-- ============================================================================
-- FIX URGENTE: Deshabilitar RLS en UserProfile
-- ============================================================================
-- PROBLEMA IDENTIFICADO:
-- - RLS está HABILITADO en UserProfile
-- - NO hay políticas RLS configuradas
-- - Resultado: PostgreSQL BLOQUEA todo acceso por defecto
-- - API no puede leer UserProfile aunque existe en BD
-- ============================================================================

-- PASO 1: Verificar estado actual
SELECT 
  schemaname,
  tablename,
  rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname = 'public' 
  AND tablename = 'UserProfile';

-- PASO 2: Deshabilitar RLS en UserProfile
ALTER TABLE public."UserProfile" DISABLE ROW LEVEL SECURITY;

-- PASO 3: Verificar que se deshabilitó
SELECT 
  schemaname,
  tablename,
  rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname = 'public' 
  AND tablename = 'UserProfile';

-- ============================================================================
-- RESULTADO ESPERADO:
-- ============================================================================
-- Antes:  rls_enabled = true
-- Después: rls_enabled = false
-- ============================================================================

-- ============================================================================
-- VERIFICACIÓN: Probar que el API ahora puede leer
-- ============================================================================
SELECT 
  id,
  "userId",
  role,
  city
FROM public."UserProfile"
WHERE "userId" = 'a4ef1f3d-c3e8-46df-b186-5b5c837cc14b';

-- ============================================================================
-- NOTA IMPORTANTE:
-- ============================================================================
-- Esta es una solución temporal. En producción deberías:
-- 1. Mantener RLS habilitado
-- 2. Crear políticas RLS apropiadas
-- 3. Ejemplo de política básica:
--
-- CREATE POLICY "Users can read all profiles"
--   ON public."UserProfile"
--   FOR SELECT
--   TO authenticated
--   USING (true);
--
-- CREATE POLICY "Users can update own profile"
--   ON public."UserProfile"
--   FOR UPDATE
--   TO authenticated
--   USING ("userId" = auth.uid()::text);
-- ============================================================================
