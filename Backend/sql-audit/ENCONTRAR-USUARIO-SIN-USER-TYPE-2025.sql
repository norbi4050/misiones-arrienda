-- ============================================================================
-- ENCONTRAR USUARIO SIN USER_TYPE
-- ============================================================================
-- Fecha: 2025-01-XX
-- Objetivo: Encontrar el usuario que todavía tiene user_type = NULL
-- ============================================================================

-- ============================================================================
-- QUERY 1: Encontrar el usuario sin user_type
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
WHERE user_type IS NULL
ORDER BY created_at DESC;

-- ============================================================================
-- QUERY 2: Ver el contenido de ese usuario
-- ============================================================================

-- Primero ejecuta QUERY 1 para obtener el ID del usuario
-- Luego reemplaza 'USER_ID_AQUI' con ese ID

-- Ver propiedades
SELECT 
  'properties' as tipo,
  id,
  title,
  created_at
FROM properties
WHERE user_id::text = 'USER_ID_AQUI'

UNION ALL

-- Ver posts de comunidad
SELECT 
  'community_posts' as tipo,
  id,
  title,
  created_at
FROM community_posts
WHERE user_id::text = 'USER_ID_AQUI'

ORDER BY created_at DESC;

-- ============================================================================
-- QUERY 3: Actualizar el usuario sin user_type
-- ============================================================================

-- OPCIÓN A: Si es inquilino/dueño directo
/*
UPDATE users
SET 
  user_type = 'inquilino',
  is_company = false,
  updated_at = NOW()
WHERE user_type IS NULL;
*/

-- OPCIÓN B: Si es inmobiliaria
/*
BEGIN;

UPDATE users
SET 
  user_type = 'inmobiliaria',
  is_company = true,
  updated_at = NOW()
WHERE user_type IS NULL;

-- Eliminar posts de comunidad si es inmobiliaria
DELETE FROM community_posts
WHERE user_id IN (
  SELECT id FROM users WHERE user_type = 'inmobiliaria'
);

COMMIT;
*/

-- ============================================================================
-- VERIFICACIÓN FINAL
-- ============================================================================

-- Debe retornar 0
SELECT COUNT(*) as usuarios_sin_tipo
FROM users
WHERE user_type IS NULL;

-- Ver distribución final
SELECT 
  user_type,
  is_company,
  COUNT(*) as total_usuarios
FROM users
GROUP BY user_type, is_company
ORDER BY total_usuarios DESC;
