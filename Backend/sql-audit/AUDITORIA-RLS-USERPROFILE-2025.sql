-- ============================================================================
-- AUDITORÍA: Políticas RLS en UserProfile
-- ============================================================================
-- Propósito: Verificar si RLS está bloqueando las consultas del API
-- Problema: API no encuentra UserProfile aunque existe en BD
-- ============================================================================

-- PASO 1: Verificar si RLS está habilitado en UserProfile
SELECT 
  schemaname,
  tablename,
  rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname = 'public' 
  AND tablename = 'UserProfile';

-- PASO 2: Listar TODAS las políticas RLS de UserProfile
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'UserProfile'
ORDER BY policyname;

-- PASO 3: Ver definición completa de cada política
SELECT 
  policyname,
  pg_get_expr(qual, 'public."UserProfile"'::regclass) AS using_expression,
  pg_get_expr(with_check, 'public."UserProfile"'::regclass) AS with_check_expression
FROM pg_policy
WHERE polrelid = 'public."UserProfile"'::regclass
ORDER BY policyname;

-- PASO 4: Verificar si service_role puede leer UserProfile
-- (El API usa service_role en el servidor)
SELECT 
  'Verificación de acceso service_role' AS test,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE tablename = 'UserProfile' 
        AND cmd = 'SELECT'
        AND (roles @> ARRAY['service_role'] OR roles @> ARRAY['authenticated'])
    )
    THEN '✅ service_role tiene política SELECT'
    ELSE '⚠️ service_role NO tiene política SELECT explícita'
  END AS resultado;

-- PASO 5: Verificar si authenticated puede leer UserProfile
SELECT 
  'Verificación de acceso authenticated' AS test,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE tablename = 'UserProfile' 
        AND cmd = 'SELECT'
        AND roles @> ARRAY['authenticated']
    )
    THEN '✅ authenticated tiene política SELECT'
    ELSE '⚠️ authenticated NO tiene política SELECT'
  END AS resultado;

-- PASO 6: Probar acceso directo como si fuera el API
-- Simular la consulta que hace el API
SET ROLE authenticated;
SELECT 
  'Test como authenticated' AS test,
  id,
  "userId",
  role
FROM public."UserProfile"
WHERE "userId" = 'a4ef1f3d-c3e8-46df-b186-5b5c837cc14b';
RESET ROLE;

-- PASO 7: Verificar si hay políticas que bloquean por userId
SELECT 
  policyname,
  cmd,
  qual::text AS condicion
FROM pg_policy p
JOIN pg_class c ON p.polrelid = c.oid
WHERE c.relname = 'UserProfile'
  AND qual::text LIKE '%userId%'
ORDER BY policyname;

-- ============================================================================
-- SOLUCIÓN TEMPORAL: Deshabilitar RLS para testing
-- ============================================================================
-- ⚠️ SOLO PARA TESTING - NO EJECUTAR EN PRODUCCIÓN SIN REVISAR
-- ============================================================================

-- Ver estado actual de RLS
SELECT 
  'Estado RLS UserProfile' AS info,
  CASE 
    WHEN relrowsecurity THEN 'HABILITADO'
    ELSE 'DESHABILITADO'
  END AS estado
FROM pg_class
WHERE relname = 'UserProfile';

-- Si necesitas deshabilitar RLS temporalmente para testing:
-- ALTER TABLE public."UserProfile" DISABLE ROW LEVEL SECURITY;

-- Para volver a habilitar:
