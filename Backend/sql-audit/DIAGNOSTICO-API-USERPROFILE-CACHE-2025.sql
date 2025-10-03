-- ============================================================================
-- DIAGNÓSTICO: API no encuentra UserProfile (problema de caché o query)
-- ============================================================================
-- Usuario afectado: a4ef1f3d-c3e8-46df-b186-5b5c837cc14b
-- Problema: API retorna PROFILE_NOT_FOUND pero el perfil existe en BD
-- ============================================================================

-- PASO 1: Verificar que el UserProfile existe
SELECT 
  'UserProfile existe' AS verificacion,
  id,
  "userId",
  role,
  city,
  "createdAt",
  "updatedAt"
FROM public."UserProfile"
WHERE "userId" = 'a4ef1f3d-c3e8-46df-b186-5b5c837cc14b';

-- PASO 2: Verificar exactamente como lo hace el API
SELECT id
FROM public."UserProfile"
WHERE "userId" = 'a4ef1f3d-c3e8-46df-b186-5b5c837cc14b';

-- PASO 3: Verificar si hay duplicados (no debería haber)
SELECT 
  "userId",
  COUNT(*) as total_profiles
FROM public."UserProfile"
WHERE "userId" = 'a4ef1f3d-c3e8-46df-b186-5b5c837cc14b'
GROUP BY "userId";

-- PASO 4: Verificar todos los UserProfiles
SELECT 
  id,
  "userId",
  role,
  city
FROM public."UserProfile"
ORDER BY "createdAt" DESC;

-- ============================================================================
-- SOLUCIÓN TEMPORAL: Refrescar la sesión del usuario
-- ============================================================================
-- El problema puede ser que el cliente tiene una sesión cacheada
-- Solución: Cerrar sesión y volver a iniciar sesión
-- ============================================================================

-- ============================================================================
-- DIAGNÓSTICO ADICIONAL: Verificar RLS policies
-- ============================================================================
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'UserProfile'
ORDER BY policyname;

-- ============================================================================
-- RESULTADO ESPERADO:
-- ============================================================================
-- ✅ UserProfile debe existir con id y userId correctos
-- ✅ Solo debe haber 1 perfil por userId
-- ✅ Si hay políticas RLS, verificar que no estén bloqueando la consulta
-- ============================================================================
