-- ============================================================================
-- FIX: Crear UserProfile para usuario inmobiliaria sin perfil
-- ============================================================================
-- Fecha: 2025-01-XX
-- Usuario afectado: a4ef1f3d-c3e8-46df-b186-5b5c837cc14b
-- Problema: Usuario existe en User pero no tiene UserProfile
-- Solución: Crear UserProfile con role OFREZCO (inmobiliaria)
-- ============================================================================

BEGIN;

-- ============================================================================
-- PASO 1: Verificar estado actual del usuario
-- ============================================================================

-- Verificar en auth.users
SELECT 
  'auth.users' AS tabla,
  id::text AS user_id,
  email,
  raw_user_meta_data->>'full_name' AS full_name,
  raw_user_meta_data->>'user_type' AS user_type,
  created_at
FROM auth.users
WHERE id::text = 'a4ef1f3d-c3e8-46df-b186-5b5c837cc14b';

-- Verificar en public."User"
SELECT 
  'public.User' AS tabla,
  id,
  name,
  email,
  "userType",
  "createdAt"
FROM public."User"
WHERE id = 'a4ef1f3d-c3e8-46df-b186-5b5c837cc14b';

-- Verificar en public."UserProfile" (debería estar vacío)
SELECT 
  'public.UserProfile' AS tabla,
  id,
  "userId",
  role,
  city
FROM public."UserProfile"
WHERE "userId" = 'a4ef1f3d-c3e8-46df-b186-5b5c837cc14b';

-- ============================================================================
-- PASO 2: Crear UserProfile para el usuario inmobiliaria
-- ============================================================================

INSERT INTO public."UserProfile" (
  id,
  "userId",
  role,
  city,
  "budgetMin",
  "budgetMax",
  "createdAt",
  "updatedAt"
)
VALUES (
  gen_random_uuid()::text,
  'a4ef1f3d-c3e8-46df-b186-5b5c837cc14b',
  'OFREZCO'::"CommunityRole", -- Rol de inmobiliaria
  'Posadas',
  0,
  999999999,
  NOW(),
  NOW()
)
ON CONFLICT ("userId") DO UPDATE SET
  role = 'OFREZCO'::"CommunityRole",
  "updatedAt" = NOW();

-- ============================================================================
-- PASO 3: Verificar que se creó correctamente
-- ============================================================================

SELECT 
  up.id AS profile_id,
  up."userId",
  up.role,
  up.city,
  up."budgetMin",
  up."budgetMax",
  u.email,
  u.name,
  u."userType",
  up."createdAt",
  up."updatedAt"
FROM public."UserProfile" up
JOIN public."User" u ON u.id = up."userId"
WHERE up."userId" = 'a4ef1f3d-c3e8-46df-b186-5b5c837cc14b';

COMMIT;

-- ============================================================================
-- VERIFICACIÓN FINAL: El usuario ahora debe poder enviar mensajes
-- ============================================================================

-- Verificar que el perfil existe
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM public."UserProfile" 
      WHERE "userId" = 'a4ef1f3d-c3e8-46df-b186-5b5c837cc14b'
    )
    THEN '✅ UserProfile existe - Usuario puede enviar mensajes'
    ELSE '❌ UserProfile NO existe - Usuario NO puede enviar mensajes'
  END AS estado_mensajeria;

-- ============================================================================
-- RESULTADO ESPERADO:
-- ============================================================================
-- ✅ UserProfile creado con:
--    - id: UUID generado como texto
--    - userId: a4ef1f3d-c3e8-46df-b186-5b5c837cc14b
--    - role: OFREZCO (inmobiliaria)
--    - city: Posadas
--    - budgetMin: 0
--    - budgetMax: 999999999
--    - timestamps: NOW()
--
-- ✅ Usuario ahora puede:
--    - Enviar mensajes
--    - Crear conversaciones
--    - Usar todas las funciones de comunidad
-- ============================================================================

-- ============================================================================
-- SCRIPT ALTERNATIVO: Si necesitas crear perfiles para TODOS los usuarios
-- sin perfil, ejecuta esto en su lugar:
-- ============================================================================

/*
BEGIN;

INSERT INTO public."UserProfile" (
  id,
  "userId",
  role,
  city,
  "budgetMin",
  "budgetMax",
  "createdAt",
  "updatedAt"
)
SELECT 
  gen_random_uuid()::text AS id,
  u.id AS "userId",
  (CASE 
    WHEN u."userType" IN ('inmobiliaria', 'agency', 'ofrezco') 
    THEN 'OFREZCO'
    ELSE 'BUSCO'
  END)::"CommunityRole" AS role,
  'Posadas' AS city,
  0 AS "budgetMin",
  999999999 AS "budgetMax",
  NOW() AS "createdAt",
  NOW() AS "updatedAt"
FROM public."User" u
LEFT JOIN public."UserProfile" up ON up."userId" = u.id
WHERE up.id IS NULL -- Solo usuarios sin perfil
ON CONFLICT ("userId") DO NOTHING;

COMMIT;
*/

-- ============================================================================
-- NOTAS:
-- ============================================================================
-- 1. Este script es idempotente: puede ejecutarse múltiples veces
-- 2. Si el perfil ya existe, se actualiza a OFREZCO
-- 3. El usuario debe tener registro en public."User" primero
-- 4. Después de ejecutar, el usuario puede usar mensajería
-- ============================================================================
