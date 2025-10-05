-- ============================================================================
-- PROMPT A1: Auditoría DisplayName - VERSIÓN ULTRA SIMPLE
-- ============================================================================
-- Objetivo: Listar TODOS los usuarios y analizar sus fuentes de displayName
--
-- IMPORTANTE: Ejecutar cada query POR SEPARADO
--
-- Fecha: 2025-01-XX
-- ============================================================================

-- ============================================================================
-- QUERY 1: LISTADO COMPLETO DE USUARIOS (Primeros 100)
-- ============================================================================

SELECT 
  id AS user_id,
  email,
  name AS "User.name",
  "companyName" AS "User.companyName",
  
  CASE
    WHEN name IS NOT NULL 
         AND TRIM(name) != '' 
         AND name !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    THEN 'User.name'
    
    WHEN "companyName" IS NOT NULL 
         AND TRIM("companyName") != '' 
         AND "companyName" !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    THEN 'User.companyName'
    
    WHEN email IS NOT NULL 
         AND SPLIT_PART(email, '@', 1) IS NOT NULL
    THEN 'emailLocal'
    
    ELSE 'NO_DATA'
  END AS displayName_source,
  
  CASE
    WHEN avatar IS NULL THEN 'NULL'
    WHEN TRIM(avatar) = '' THEN 'VACIO'
    WHEN avatar LIKE 'data:,%' THEN 'DATA_URL_VACIA'
    WHEN avatar LIKE '%404%' THEN 'URL_404'
    WHEN avatar LIKE 'https://%' THEN 'OK'
    ELSE 'SOSPECHOSO'
  END AS avatar_status

FROM public."User"
ORDER BY 
  CASE 
    WHEN name IS NULL AND ("companyName" IS NULL OR TRIM("companyName") = '') 
    THEN 0 
    ELSE 1 
  END,
  email
LIMIT 100;


-- ============================================================================
-- QUERY 2: CONTADOR POR FUENTE DE DISPLAYNAME
-- ============================================================================

SELECT 
  CASE
    WHEN name IS NOT NULL 
         AND TRIM(name) != '' 
         AND name !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    THEN 'User.name'
    
    WHEN "companyName" IS NOT NULL 
         AND TRIM("companyName") != '' 
         AND "companyName" !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    THEN 'User.companyName'
    
    WHEN email IS NOT NULL 
    THEN 'emailLocal'
    
    ELSE 'NO_DATA'
  END AS "Fuente DisplayName",
  
  COUNT(*) AS "Total Usuarios",
  ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM public."User"), 2) AS "Porcentaje %"

FROM public."User"
GROUP BY 1
ORDER BY 
  CASE 
    WHEN "Fuente DisplayName" = 'NO_DATA' THEN 0
    WHEN "Fuente DisplayName" = 'emailLocal' THEN 1
    ELSE 2
  END,
  COUNT(*) DESC;


-- ============================================================================
-- QUERY 3: SOLO CASOS CRÍTICOS (NO_DATA)
-- ============================================================================

SELECT 
  id AS user_id,
  email,
  name AS "User.name",
  "companyName" AS "User.companyName",
  'NO_DATA' AS displayName_source,
  avatar AS avatar_url

FROM public."User"
WHERE (name IS NULL OR TRIM(name) = '' OR name ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$')
  AND ("companyName" IS NULL OR TRIM("companyName") = '' OR "companyName" ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$')
ORDER BY email
LIMIT 50;


-- ============================================================================
-- QUERY 4: CONTADOR DE AVATARES
-- ============================================================================

SELECT 
  CASE
    WHEN avatar IS NULL THEN 'NULL'
    WHEN TRIM(avatar) = '' THEN 'VACIO'
    WHEN avatar LIKE 'data:,%' THEN 'DATA_URL_VACIA'
    WHEN avatar LIKE '%404%' THEN 'URL_404'
    WHEN avatar LIKE 'https://%' THEN 'OK'
    ELSE 'SOSPECHOSO'
  END AS avatar_status,
  
  COUNT(*) AS total,
  ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM public."User"), 2) AS porcentaje

FROM public."User"
GROUP BY 1
ORDER BY COUNT(*) DESC;


-- ============================================================================
-- INTERPRETACIÓN
-- ============================================================================

/*
QUERY 1 - Listado completo:
  Muestra los primeros 100 usuarios con su fuente de displayName y estado del avatar.
  Ordenado con NO_DATA primero.

QUERY 2 - Contador por fuente:
  Distribución de usuarios por fuente de displayName.
  Permite ver el % de usuarios con NO_DATA.

QUERY 3 - Solo casos críticos:
  Muestra SOLO usuarios con NO_DATA.
  Estos requieren backfill inmediato (Prompt B1).

QUERY 4 - Contador de avatares:
  Distribución de usuarios por estado del avatar.
  Permite ver cuántos tienen avatares inválidos.

CRITERIO DE ÉXITO:
- displayName_source = 'NO_DATA': < 1%
- displayName_source = 'emailLocal': < 10%
- displayName_source con datos reales: > 90%
- avatar_status = 'OK' o 'NULL': 100%
*/
