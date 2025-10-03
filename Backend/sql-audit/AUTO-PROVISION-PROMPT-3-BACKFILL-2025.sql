-- ============================================================================
-- PROMPT 3: Backfill masivo - Reparar usuarios históricos
-- ============================================================================
-- Fecha: 2025-01-XX
-- Propósito: Script transaccional e idempotente para insertar usuarios
--            históricos faltantes en public."User" y public."UserProfile"
-- 
-- FUNCIONALIDAD:
-- 1. Insertar en public."User" todas las filas faltantes desde auth.users
-- 2. Insertar en public."UserProfile" todas las filas faltantes
-- 3. Determinar role basado en raw_user_meta_data
-- 4. Mostrar conteos y ejemplos de registros insertados
-- ============================================================================

BEGIN;

-- ============================================================================
-- PASO 1: Insertar usuarios faltantes en public."User"
-- ============================================================================

WITH inserted_users AS (
  INSERT INTO public."User" (
    id,
    name,
    email,
    phone,
    password,
    "createdAt",
    "updatedAt"
  )
  SELECT 
    au.id::text AS id,
    COALESCE(
      au.raw_user_meta_data->>'full_name',
      split_part(au.email, '@', 1)
    ) AS name,
    au.email,
    COALESCE(au.phone, '') AS phone,
    '' AS password, -- auth.users maneja la autenticación
    COALESCE(au.created_at, NOW()) AS "createdAt",
    NOW() AS "updatedAt"
  FROM auth.users au
  LEFT JOIN public."User" u ON u.id = au.id::text
  WHERE u.id IS NULL -- Solo insertar los que no existen
  ON CONFLICT (id) DO NOTHING -- Idempotente
  RETURNING id, name, email
)
SELECT COUNT(*) AS users_inserted FROM inserted_users;

-- ============================================================================
-- PASO 2: Insertar perfiles faltantes en public."UserProfile"
-- ============================================================================

WITH inserted_profiles AS (
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
      WHEN au.raw_user_meta_data->>'user_type' IN ('inmobiliaria', 'agency', 'ofrezco') 
      THEN 'OFREZCO'
      ELSE 'BUSCO'
    END)::"CommunityRole" AS role,
    'Posadas' AS city,
    0 AS "budgetMin",
    999999999 AS "budgetMax",
    NOW() AS "createdAt",
    NOW() AS "updatedAt"
  FROM public."User" u
  INNER JOIN auth.users au ON au.id::text = u.id
  LEFT JOIN public."UserProfile" up ON up."userId" = u.id
  WHERE up.id IS NULL -- Solo insertar los que no existen
  ON CONFLICT ("userId") DO NOTHING -- Idempotente
  RETURNING id, "userId", role, city
)
SELECT COUNT(*) AS profiles_inserted FROM inserted_profiles;

COMMIT;

-- ============================================================================
-- VERIFICACIÓN: Mostrar conteos insertados
-- ============================================================================

-- Contar usuarios en auth.users vs public."User"
SELECT 
  'Usuarios en auth.users' AS tabla,
  COUNT(*) AS total
FROM auth.users
UNION ALL
SELECT 
  'Usuarios en public."User"' AS tabla,
  COUNT(*) AS total
FROM public."User"
UNION ALL
SELECT 
  'Perfiles en public."UserProfile"' AS tabla,
  COUNT(*) AS total
FROM public."UserProfile";

-- ============================================================================
-- VERIFICACIÓN: Mostrar 10 ejemplos recientes de public."User"
-- ============================================================================

SELECT 
  u.id,
  u.email,
  u.name,
  u."createdAt",
  u."updatedAt"
FROM public."User" u
ORDER BY u."createdAt" DESC
LIMIT 10;

-- ============================================================================
-- VERIFICACIÓN: Mostrar 10 ejemplos recientes de public."UserProfile"
-- ============================================================================

SELECT 
  up.id,
  up."userId",
  up.role,
  up.city,
  up."budgetMin",
  up."budgetMax",
  up."createdAt",
  up."updatedAt"
FROM public."UserProfile" up
ORDER BY up."createdAt" DESC
LIMIT 10;

-- ============================================================================
-- VERIFICACIÓN: Detectar usuarios desincronizados (si quedan)
-- ============================================================================

-- Usuarios en auth.users sin espejo en public."User"
SELECT 
  'auth.users sin User' AS tipo,
  COUNT(*) AS total
FROM auth.users au
LEFT JOIN public."User" u ON u.id = au.id::text
WHERE u.id IS NULL

UNION ALL

-- Usuarios en public."User" sin espejo en public."UserProfile"
SELECT 
  'User sin UserProfile' AS tipo,
  COUNT(*) AS total
FROM public."User" u
LEFT JOIN public."UserProfile" up ON up."userId" = u.id
WHERE up.id IS NULL;

-- ============================================================================
-- RESULTADO ESPERADO:
-- ============================================================================
-- ✅ Todos los usuarios de auth.users tienen espejo en public."User"
-- ✅ Todos los usuarios de public."User" tienen espejo en public."UserProfile"
-- ✅ Roles asignados correctamente según raw_user_meta_data
-- ✅ Ciudad por defecto: 'Posadas'
-- ✅ Presupuestos por defecto: 0 - 999999999
-- ✅ Script es idempotente: múltiples ejecuciones no duplican registros
-- ============================================================================

-- ============================================================================
-- EJEMPLO DE SALIDA ESPERADA:
-- ============================================================================

-- Conteos insertados:
-- | users_inserted |
-- |----------------|
-- | 15             |

-- | profiles_inserted |
-- |-------------------|
-- | 15                |

-- Conteos totales:
-- | tabla                           | total |
-- |---------------------------------|-------|
-- | Usuarios en auth.users          | 50    |
-- | Usuarios en public."User"       | 50    |
-- | Perfiles en public."UserProfile"| 50    |

-- Ejemplos de User:
-- | id       | email                | name          | createdAt           | updatedAt           |
-- |----------|----------------------|---------------|---------------------|---------------------|
-- | clxxx... | juan@ejemplo.com     | Juan Pérez    | 2025-01-15 10:00:00 | 2025-01-15 10:00:00 |
-- | clyyy... | maria@ejemplo.com    | María García  | 2025-01-15 09:30:00 | 2025-01-15 09:30:00 |
-- | ...      | ...                  | ...           | ...                 | ...                 |

-- Ejemplos de UserProfile:
-- | id       | userId   | role    | city    | budgetMin | budgetMax |
-- |----------|----------|---------|---------|-----------|-----------|
-- | clzzz... | clxxx... | BUSCO   | Posadas | 0         | 999999999 |
-- | claaa... | clyyy... | OFREZCO | Posadas | 0         | 999999999 |
-- | ...      | ...      | ...     | ...     | ...       | ...       |

-- Usuarios desincronizados (debe ser 0):
-- | tipo                  | total |
-- |-----------------------|-------|
-- | auth.users sin User   | 0     |
-- | User sin UserProfile  | 0     |
-- ============================================================================

-- ============================================================================
-- NOTAS DE USO:
-- ============================================================================
-- 1. Este script debe ejecutarse UNA VEZ para reparar usuarios históricos
-- 2. Es idempotente: puede ejecutarse múltiples veces sin duplicar datos
-- 3. Después de ejecutar este script, el trigger del PROMPT 1 manejará
--    automáticamente los nuevos usuarios
-- 4. Si hay muchos usuarios (>1000), considerar ejecutar en lotes
-- 5. Verificar los conteos finales para asegurar sincronización completa
-- ============================================================================

-- ============================================================================
-- ROLLBACK (si es necesario):
-- ============================================================================
-- Si necesitas revertir los cambios (CUIDADO: esto eliminará datos):
--
-- BEGIN;
-- 
-- -- Eliminar perfiles creados en esta sesión (últimos N minutos)
-- DELETE FROM public."UserProfile"
-- WHERE "createdAt" > NOW() - INTERVAL '15 minutes';
-- 
-- -- Eliminar usuarios creados en esta sesión (últimos N minutos)
-- DELETE FROM public."User"
-- WHERE "createdAt" > NOW() - INTERVAL '15 minutes';
-- 
-- COMMIT;
-- ============================================================================
