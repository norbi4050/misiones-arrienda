-- ============================================================================
-- FIX: Usuario Carlos sin user_type definido
-- ============================================================================
-- Fecha: 2025-01-XX
-- Usuario afectado: cgonzalezarchilla@gmail.com (ID: 6403f9d2-e846-4c70-87e0-e051127d9500)
-- Problema: user_type = NULL, tiene propiedades Y posts de comunidad
-- ============================================================================

-- ============================================================================
-- PASO 1: Verificar el estado actual del usuario Carlos
-- ============================================================================

SELECT 
  id,
  email,
  user_type,
  is_company,
  company_name,
  created_at,
  updated_at
FROM users
WHERE email = 'cgonzalezarchilla@gmail.com';

-- Resultado esperado:
-- id: 6403f9d2-e846-4c70-87e0-e051127d9500
-- email: cgonzalezarchilla@gmail.com
-- user_type: NULL ❌
-- is_company: NULL ❌

-- ============================================================================
-- PASO 2: Verificar el contenido del usuario
-- ============================================================================

-- Ver propiedades
SELECT 
  id,
  title,
  created_at
FROM properties
WHERE user_id = '6403f9d2-e846-4c70-87e0-e051127d9500'
ORDER BY created_at DESC;

-- Ver posts de comunidad
SELECT 
  id,
  title,
  created_at
FROM community_posts
WHERE user_id = '6403f9d2-e846-4c70-87e0-e051127d9500'
ORDER BY created_at DESC;

-- ============================================================================
-- PASO 3: DECISIÓN - ¿Qué tipo de usuario es Carlos?
-- ============================================================================

-- OPCIÓN A: Carlos es un INQUILINO/DUEÑO DIRECTO
-- (Puede tener propiedades Y posts de comunidad)
-- Ejecutar este bloque si Carlos es inquilino:

/*
BEGIN;

-- Actualizar tipo de usuario
UPDATE users
SET 
  user_type = 'inquilino',
  is_company = false,
  updated_at = NOW()
WHERE id = '6403f9d2-e846-4c70-87e0-e051127d9500';

-- Verificar el cambio
SELECT 
  id,
  email,
  user_type,
  is_company
FROM users
WHERE id = '6403f9d2-e846-4c70-87e0-e051127d9500';

COMMIT;
*/

-- ============================================================================
-- OPCIÓN B: Carlos es una INMOBILIARIA
-- (Solo puede tener propiedades, NO posts de comunidad)
-- Ejecutar este bloque si Carlos es inmobiliaria:

/*
BEGIN;

-- 1. Actualizar tipo de usuario
UPDATE users
SET 
  user_type = 'inmobiliaria',
  is_company = true,
  updated_at = NOW()
WHERE id = '6403f9d2-e846-4c70-87e0-e051127d9500';

-- 2. ELIMINAR posts de comunidad (inmobiliarias no pueden tenerlos)
DELETE FROM community_posts
WHERE user_id = '6403f9d2-e846-4c70-87e0-e051127d9500';

-- 3. Verificar los cambios
SELECT 
  id,
  email,
  user_type,
  is_company
FROM users
WHERE id = '6403f9d2-e846-4c70-87e0-e051127d9500';

-- 4. Verificar que no quedan posts de comunidad
SELECT COUNT(*) as remaining_community_posts
FROM community_posts
WHERE user_id = '6403f9d2-e846-4c70-87e0-e051127d9500';
-- Debe retornar: 0

COMMIT;
*/

-- ============================================================================
-- PASO 4: Verificar otros usuarios sin user_type
-- ============================================================================

SELECT 
  id,
  email,
  user_type,
  is_company,
  company_name,
  created_at,
  (SELECT COUNT(*) FROM properties WHERE user_id = users.id) as total_properties,
  (SELECT COUNT(*) FROM community_posts WHERE user_id = users.id) as total_community_posts
FROM users
WHERE user_type IS NULL
ORDER BY created_at DESC;

-- ============================================================================
-- PASO 5: Actualizar TODOS los usuarios sin user_type (OPCIONAL)
-- ============================================================================
-- ADVERTENCIA: Solo ejecutar después de revisar manualmente cada usuario

/*
-- Actualizar usuarios sin user_type que tienen posts de comunidad
UPDATE users
SET 
  user_type = 'inquilino',
  is_company = false,
  updated_at = NOW()
WHERE user_type IS NULL
  AND id IN (
    SELECT DISTINCT user_id 
    FROM community_posts
  );

-- Actualizar usuarios sin user_type que solo tienen propiedades
-- (Asumir que son dueños directos)
UPDATE users
SET 
  user_type = 'dueno_directo',
  is_company = false,
  updated_at = NOW()
WHERE user_type IS NULL
  AND id IN (
    SELECT DISTINCT user_id 
    FROM properties
  )
  AND id NOT IN (
    SELECT DISTINCT user_id 
    FROM community_posts
  );
*/

-- ============================================================================
-- VERIFICACIÓN FINAL
-- ============================================================================

-- Verificar que no quedan usuarios sin user_type
SELECT 
  COUNT(*) as usuarios_sin_tipo
FROM users
WHERE user_type IS NULL;
-- Debe retornar: 0

-- Verificar distribución de tipos de usuario
SELECT 
  user_type,
  is_company,
  COUNT(*) as total_usuarios
FROM users
GROUP BY user_type, is_company
ORDER BY total_usuarios DESC;

-- ============================================================================
-- INSTRUCCIONES DE USO
-- ============================================================================
-- 1. Ejecutar PASO 1 y 2 para ver el estado actual
-- 2. DECIDIR si Carlos es inquilino o inmobiliaria
-- 3. Ejecutar OPCIÓN A o OPCIÓN B según corresponda
-- 4. Ejecutar PASO 4 para ver si hay otros usuarios afectados
-- 5. Ejecutar PASO 5 SOLO si es necesario (revisar manualmente primero)
-- 6. Ejecutar VERIFICACIÓN FINAL
-- ============================================================================

-- ============================================================================
-- NOTAS IMPORTANTES
-- ============================================================================
-- - Si Carlos es inquilino: Mantener sus propiedades Y posts de comunidad
-- - Si Carlos es inmobiliaria: Eliminar sus posts de comunidad
-- - Siempre hacer backup antes de ejecutar DELETE
-- - Usar transacciones (BEGIN/COMMIT) para poder hacer ROLLBACK si es necesario
-- ============================================================================
