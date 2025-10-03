-- ============================================================================
-- AUDITORÍA: MEZCLA DE PROPIEDADES Y POSTS DE COMUNIDAD
-- ============================================================================
-- Fecha: 2025-01-XX
-- Objetivo: Investigar si hay propiedades creadas por usuarios tipo inquilino
--           que están apareciendo en listados de inmobiliarias
-- ============================================================================

-- ============================================================================
-- QUERY 1: Verificar propiedades creadas por usuarios NO inmobiliarias
-- ============================================================================
-- Esta query busca propiedades en la tabla 'properties' que fueron creadas
-- por usuarios que NO son inmobiliarias (inquilinos, dueños directos, etc.)

SELECT 
  p.id AS property_id,
  p.title,
  p.user_id,
  u.email,
  u.user_type,
  u.role,
  u.is_company,
  p.is_active,
  p.status,
  p.created_at,
  p.updated_at
FROM properties p
INNER JOIN users u ON p.user_id = u.id
WHERE 
  -- Usuarios con user_type de inquilino/dueño
  (u.user_type IN ('inquilino', 'dueno_directo', 'busco_alquilar'))
  -- O usuarios sin user_type pero con role diferente a inmobiliaria
  OR (u.user_type IS NULL AND u.role != 'inmobiliaria')
  -- O usuarios marcados como NO empresa
  OR (u.is_company = false OR u.is_company IS NULL)
ORDER BY p.created_at DESC
LIMIT 100;

-- ============================================================================
-- QUERY 2: Verificar usuarios con tipos inconsistentes
-- ============================================================================
-- Esta query busca usuarios que tienen valores inconsistentes entre
-- user_type, role e is_company

SELECT 
  id,
  email,
  user_type,
  role,
  is_company,
  created_at,
  updated_at,
  -- Contar cuántas propiedades tiene
  (SELECT COUNT(*) FROM properties WHERE user_id = users.id) AS total_properties
FROM users
WHERE 
  -- Inmobiliaria pero marcada como NO empresa
  (user_type = 'inmobiliaria' AND is_company = false)
  -- NO inmobiliaria pero marcada como empresa
  OR (user_type != 'inmobiliaria' AND is_company = true)
  -- user_type NULL pero tiene role
  OR (user_type IS NULL AND role IS NOT NULL)
  -- role inmobiliaria pero user_type diferente
  OR (role = 'inmobiliaria' AND user_type != 'inmobiliaria')
ORDER BY created_at DESC;

-- ============================================================================
-- QUERY 3: Verificar posts de comunidad creados por inmobiliarias
-- ============================================================================
-- Esta query busca si hay posts en community_posts creados por inmobiliarias
-- (lo cual NO debería ocurrir según las reglas de negocio)

SELECT 
  'community_posts' AS source_table,
  cp.id,
  cp.title,
  cp.user_id,
  u.email,
  u.user_type,
  u.role,
  u.is_company,
  cp.created_at
FROM community_posts cp
INNER JOIN users u ON cp.user_id = u.id
WHERE 
  u.user_type = 'inmobiliaria' 
  OR u.is_company = true
  OR u.role = 'inmobiliaria'
ORDER BY cp.created_at DESC;

-- ============================================================================
-- QUERY 4: Resumen de propiedades por tipo de usuario
-- ============================================================================
-- Esta query muestra un resumen de cuántas propiedades tiene cada tipo de usuario

SELECT 
  COALESCE(u.user_type, 'NULL') AS user_type,
  COALESCE(u.role, 'NULL') AS role,
  COALESCE(u.is_company::text, 'NULL') AS is_company,
  COUNT(p.id) AS total_properties,
  COUNT(CASE WHEN p.is_active = true THEN 1 END) AS active_properties,
  COUNT(CASE WHEN p.status = 'published' THEN 1 END) AS published_properties
FROM users u
LEFT JOIN properties p ON u.id = p.user_id
GROUP BY u.user_type, u.role, u.is_company
ORDER BY total_properties DESC;

-- ============================================================================
-- QUERY 5: Resumen de posts de comunidad por tipo de usuario
-- ============================================================================
-- Esta query muestra un resumen de cuántos posts de comunidad tiene cada tipo

SELECT 
  COALESCE(u.user_type, 'NULL') AS user_type,
  COALESCE(u.role, 'NULL') AS role,
  COALESCE(u.is_company::text, 'NULL') AS is_company,
  COUNT(cp.id) AS total_community_posts,
  COUNT(CASE WHEN cp.is_active = true THEN 1 END) AS active_posts
FROM users u
LEFT JOIN community_posts cp ON u.id = cp.user_id
GROUP BY u.user_type, u.role, u.is_company
ORDER BY total_community_posts DESC;

-- ============================================================================
-- QUERY 6: Verificar propiedades específicas de un usuario inmobiliaria
-- ============================================================================
-- Reemplaza 'USER_ID_AQUI' con el ID del usuario inmobiliaria que reporta el problema

-- SELECT 
--   p.id,
--   p.title,
--   p.user_id,
--   u.email,
--   u.user_type,
--   u.role,
--   u.is_company,
--   p.created_at
-- FROM properties p
-- INNER JOIN users u ON p.user_id = u.id
-- WHERE p.user_id = 'USER_ID_AQUI'
-- ORDER BY p.created_at DESC;

-- ============================================================================
-- QUERY 7: Buscar propiedades que podrían ser posts de comunidad
-- ============================================================================
-- Esta query busca propiedades que tienen características de posts de comunidad
-- (creadas por inquilinos y con ciertos patrones en el título)

SELECT 
  p.id,
  p.title,
  p.user_id,
  u.email,
  u.user_type,
  u.role,
  p.created_at,
  -- Verificar si el título contiene palabras típicas de búsqueda de compañeros
  CASE 
    WHEN LOWER(p.title) LIKE '%busco%' THEN true
    WHEN LOWER(p.title) LIKE '%compañero%' THEN true
    WHEN LOWER(p.title) LIKE '%roommate%' THEN true
    WHEN LOWER(p.title) LIKE '%compartir%' THEN true
    ELSE false
  END AS parece_busqueda_companero
FROM properties p
INNER JOIN users u ON p.user_id = u.id
WHERE 
  u.user_type IN ('inquilino', 'busco_alquilar')
  AND (
    LOWER(p.title) LIKE '%busco%'
    OR LOWER(p.title) LIKE '%compañero%'
    OR LOWER(p.title) LIKE '%roommate%'
    OR LOWER(p.title) LIKE '%compartir%'
  )
ORDER BY p.created_at DESC;

-- ============================================================================
-- QUERY 8: Verificar si hay duplicados entre properties y community_posts
-- ============================================================================
-- Esta query busca si el mismo usuario tiene contenido similar en ambas tablas

SELECT 
  u.id AS user_id,
  u.email,
  u.user_type,
  COUNT(DISTINCT p.id) AS total_properties,
  COUNT(DISTINCT cp.id) AS total_community_posts,
  ARRAY_AGG(DISTINCT p.title) FILTER (WHERE p.title IS NOT NULL) AS property_titles,
  ARRAY_AGG(DISTINCT cp.title) FILTER (WHERE cp.title IS NOT NULL) AS community_titles
FROM users u
LEFT JOIN properties p ON u.id = p.user_id
LEFT JOIN community_posts cp ON u.id = cp.user_id
WHERE 
  p.id IS NOT NULL 
  AND cp.id IS NOT NULL
GROUP BY u.id, u.email, u.user_type
HAVING COUNT(DISTINCT p.id) > 0 AND COUNT(DISTINCT cp.id) > 0
ORDER BY total_properties DESC;

-- ============================================================================
-- INSTRUCCIONES DE USO
-- ============================================================================
-- 1. Ejecuta las queries en orden
-- 2. Guarda los resultados de cada query
-- 3. Analiza especialmente:
--    - QUERY 1: Si hay propiedades de inquilinos (NO debería haber muchas)
--    - QUERY 2: Si hay usuarios con tipos inconsistentes
--    - QUERY 3: Si hay posts de comunidad de inmobiliarias (NO debería haber)
--    - QUERY 4 y 5: Para entender la distribución de contenido
-- 4. Si encuentras datos incorrectos, documenta los IDs para corrección
-- ============================================================================

-- ============================================================================
-- NOTAS IMPORTANTES
-- ============================================================================
-- - Las propiedades (properties) pueden ser creadas por CUALQUIER tipo de usuario
-- - Los posts de comunidad (community_posts) SOLO por inquilinos/dueños directos
-- - Si encuentras propiedades de inquilinos, NO es necesariamente un error
-- - El problema reportado puede ser de UI/UX, no de datos
-- ============================================================================
