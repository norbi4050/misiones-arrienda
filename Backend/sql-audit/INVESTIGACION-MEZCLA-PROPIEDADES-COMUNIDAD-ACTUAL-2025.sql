-- ============================================================================
-- INVESTIGACIÓN ACTUAL: MEZCLA DE PROPIEDADES Y POSTS DE COMUNIDAD
-- ============================================================================
-- Fecha: 2025-01-XX
-- Objetivo: Investigar por qué un usuario Inmobiliaria ve anuncios de Comunidad
--           creados por usuarios Inquilino en la página de Propiedades
-- ============================================================================

-- ============================================================================
-- PASO 1: VERIFICAR ESTRUCTURA DE DATOS DE USUARIOS
-- ============================================================================
-- Primero necesitamos entender cómo están almacenados los datos de usuario

-- 1.1: Ver estructura de auth.users (metadatos)
SELECT 
  id,
  email,
  raw_user_meta_data,
  created_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 5;

-- 1.2: Ver si existe tabla public.users
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'users'
) AS tabla_users_existe;

-- 1.3: Si existe, ver estructura de public.users
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'users'
ORDER BY ordinal_position;

-- ============================================================================
-- PASO 2: IDENTIFICAR USUARIOS SIN user_type DEFINIDO
-- ============================================================================

-- 2.1: Buscar en auth.users (metadatos)
SELECT 
  u.id,
  u.email,
  u.raw_user_meta_data->>'user_type' AS user_type_metadata,
  u.raw_user_meta_data->>'is_company' AS is_company_metadata,
  u.created_at,
  -- Contar propiedades
  (SELECT COUNT(*) FROM properties WHERE user_id::text = u.id::text) AS total_properties,
  -- Contar posts de comunidad
  (SELECT COUNT(*) FROM community_posts WHERE user_id::text = u.id::text) AS total_community_posts
FROM auth.users u
WHERE 
  u.raw_user_meta_data->>'user_type' IS NULL
  OR u.raw_user_meta_data->>'user_type' = ''
ORDER BY u.created_at DESC;

-- 2.2: Si existe public.users, buscar ahí también
-- NOTA: Descomenta si la tabla existe
/*
SELECT 
  u.id,
  u.email,
  u.user_type,
  u.is_company,
  u.created_at,
  -- Contar propiedades
  (SELECT COUNT(*) FROM properties WHERE user_id = u.id) AS total_properties,
  -- Contar posts de comunidad
  (SELECT COUNT(*) FROM community_posts WHERE user_id = u.id) AS total_community_posts
FROM public.users u
WHERE 
  u.user_type IS NULL
  OR u.user_type = ''
ORDER BY u.created_at DESC;
*/

-- ============================================================================
-- PASO 3: VERIFICAR POSTS DE COMUNIDAD CREADOS POR INMOBILIARIAS
-- ============================================================================
-- Esto NO debería ocurrir según las reglas de negocio

-- 3.1: Buscar en auth.users
SELECT 
  cp.id AS post_id,
  cp.title AS post_title,
  cp.user_id,
  u.email,
  u.raw_user_meta_data->>'user_type' AS user_type,
  u.raw_user_meta_data->>'is_company' AS is_company,
  cp.is_active,
  cp.created_at
FROM community_posts cp
INNER JOIN auth.users u ON cp.user_id::text = u.id::text
WHERE 
  u.raw_user_meta_data->>'user_type' = 'inmobiliaria'
  OR u.raw_user_meta_data->>'is_company' = 'true'
ORDER BY cp.created_at DESC;

-- 3.2: Si existe public.users
-- NOTA: Descomenta si la tabla existe
/*
SELECT 
  cp.id AS post_id,
  cp.title AS post_title,
  cp.user_id,
  u.email,
  u.user_type,
  u.is_company,
  cp.is_active,
  cp.created_at
FROM community_posts cp
INNER JOIN public.users u ON cp.user_id = u.id
WHERE 
  u.user_type = 'inmobiliaria'
  OR u.is_company = true
ORDER BY cp.created_at DESC;
*/

-- ============================================================================
-- PASO 4: VERIFICAR USUARIOS CON CONTENIDO EN AMBAS TABLAS
-- ============================================================================
-- Usuarios que tienen tanto propiedades como posts de comunidad

-- 4.1: Usando auth.users
SELECT 
  u.id AS user_id,
  u.email,
  u.raw_user_meta_data->>'user_type' AS user_type,
  u.raw_user_meta_data->>'is_company' AS is_company,
  COUNT(DISTINCT p.id) AS total_properties,
  COUNT(DISTINCT cp.id) AS total_community_posts,
  -- Listar títulos de propiedades
  STRING_AGG(DISTINCT p.title, ' | ') AS property_titles,
  -- Listar títulos de posts
  STRING_AGG(DISTINCT cp.title, ' | ') AS community_titles
FROM auth.users u
LEFT JOIN properties p ON u.id::text = p.user_id::text
LEFT JOIN community_posts cp ON u.id::text = cp.user_id::text
WHERE 
  p.id IS NOT NULL 
  AND cp.id IS NOT NULL
GROUP BY u.id, u.email, u.raw_user_meta_data
HAVING COUNT(DISTINCT p.id) > 0 AND COUNT(DISTINCT cp.id) > 0
ORDER BY total_properties DESC, total_community_posts DESC;

-- ============================================================================
-- PASO 5: RESUMEN DE DISTRIBUCIÓN DE CONTENIDO
-- ============================================================================

-- 5.1: Propiedades por tipo de usuario (auth.users)
SELECT 
  COALESCE(u.raw_user_meta_data->>'user_type', 'NULL/UNDEFINED') AS user_type,
  COALESCE(u.raw_user_meta_data->>'is_company', 'NULL') AS is_company,
  COUNT(p.id) AS total_properties,
  COUNT(CASE WHEN p.is_active = true THEN 1 END) AS active_properties,
  COUNT(CASE WHEN p.status = 'published' THEN 1 END) AS published_properties
FROM auth.users u
LEFT JOIN properties p ON u.id::text = p.user_id::text
GROUP BY u.raw_user_meta_data->>'user_type', u.raw_user_meta_data->>'is_company'
ORDER BY total_properties DESC;

-- 5.2: Posts de comunidad por tipo de usuario (auth.users)
SELECT 
  COALESCE(u.raw_user_meta_data->>'user_type', 'NULL/UNDEFINED') AS user_type,
  COALESCE(u.raw_user_meta_data->>'is_company', 'NULL') AS is_company,
  COUNT(cp.id) AS total_community_posts,
  COUNT(CASE WHEN cp.is_active = true THEN 1 END) AS active_posts
FROM auth.users u
LEFT JOIN community_posts cp ON u.id::text = cp.user_id::text
GROUP BY u.raw_user_meta_data->>'user_type', u.raw_user_meta_data->>'is_company'
ORDER BY total_community_posts DESC;

-- ============================================================================
-- PASO 6: VERIFICAR ÚLTIMAS PROPIEDADES Y POSTS CREADOS
-- ============================================================================

-- 6.1: Últimas 20 propiedades con info del usuario
SELECT 
  p.id,
  p.title,
  p.user_id,
  u.email,
  u.raw_user_meta_data->>'user_type' AS user_type,
  u.raw_user_meta_data->>'is_company' AS is_company,
  p.is_active,
  p.status,
  p.created_at
FROM properties p
INNER JOIN auth.users u ON p.user_id::text = u.id::text
ORDER BY p.created_at DESC
LIMIT 20;

-- 6.2: Últimos 20 posts de comunidad con info del usuario
SELECT 
  cp.id,
  cp.title,
  cp.user_id,
  u.email,
  u.raw_user_meta_data->>'user_type' AS user_type,
  u.raw_user_meta_data->>'is_company' AS is_company,
  cp.is_active,
  cp.created_at
FROM community_posts cp
INNER JOIN auth.users u ON cp.user_id::text = u.id::text
ORDER BY cp.created_at DESC
LIMIT 20;

-- ============================================================================
-- PASO 7: VERIFICAR SI HAY PROBLEMA EN LA API/FRONTEND
-- ============================================================================
-- Verificar si el problema es que la API de propiedades está devolviendo
-- posts de comunidad por error

-- 7.1: Verificar que las tablas son diferentes
SELECT 
  'properties' AS tabla,
  COUNT(*) AS total_registros,
  (SELECT COUNT(*) FROM properties WHERE is_active = true) AS activos
FROM properties
UNION ALL
SELECT 
  'community_posts' AS tabla,
  COUNT(*) AS total_registros,
  (SELECT COUNT(*) FROM community_posts WHERE is_active = true) AS activos
FROM community_posts;

-- 7.2: Verificar columnas de cada tabla
SELECT 
  'properties' AS tabla,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'properties'
ORDER BY ordinal_position;

SELECT 
  'community_posts' AS tabla,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'community_posts'
ORDER BY ordinal_position;

-- ============================================================================
-- PASO 8: BUSCAR USUARIO ESPECÍFICO REPORTANDO EL PROBLEMA
-- ============================================================================
-- Si tienes el email o ID del usuario inmobiliaria que reporta el problema,
-- reemplaza 'EMAIL_INMOBILIARIA_AQUI' con su email

/*
SELECT 
  u.id,
  u.email,
  u.raw_user_meta_data->>'user_type' AS user_type,
  u.raw_user_meta_data->>'is_company' AS is_company,
  u.created_at,
  -- Propiedades del usuario
  (SELECT COUNT(*) FROM properties WHERE user_id::text = u.id::text) AS mis_propiedades,
  -- Posts de comunidad del usuario (NO debería tener si es inmobiliaria)
  (SELECT COUNT(*) FROM community_posts WHERE user_id::text = u.id::text) AS mis_posts_comunidad
FROM auth.users u
WHERE u.email = 'EMAIL_INMOBILIARIA_AQUI';
*/

-- ============================================================================
-- INSTRUCCIONES DE USO
-- ============================================================================
-- 1. Ejecuta las queries en orden desde PASO 1 hasta PASO 7
-- 2. Guarda los resultados de cada query en un archivo de texto
-- 3. Presta especial atención a:
--    - PASO 2: Usuarios sin user_type (estos son problemáticos)
--    - PASO 3: Posts de comunidad de inmobiliarias (NO debería haber)
--    - PASO 4: Usuarios con contenido en ambas tablas
--    - PASO 5: Distribución general de contenido
-- 4. Si encuentras usuarios problemáticos, anota sus IDs y emails
-- 5. Comparte los resultados para análisis y solución
-- ============================================================================

-- ============================================================================
-- NOTAS IMPORTANTES
-- ============================================================================
-- - Este script es SOLO de lectura (SELECT), no modifica datos
-- - Es seguro ejecutarlo en producción
-- - Los resultados te dirán exactamente qué está mal
-- - Después de los resultados, te daré los SQLs de corrección necesarios
-- ============================================================================
