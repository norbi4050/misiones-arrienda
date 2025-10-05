-- ============================================================================
-- PROMPT A1: Auditoría "quién aparece como Usuario" - VERSIÓN SIMPLE
-- ============================================================================
-- Objetivo: Listar todos los usuarios y analizar sus fuentes de displayName
--
-- SCHEMA REAL:
--   - User.name (text)
--   - User.companyName (text)
--   - User.avatar (text)
--
-- Fecha: 2025-01-XX
-- ============================================================================

-- QUERY 1: Lista de usuarios con análisis de displayName
-- ============================================================================

SELECT 
  u.id AS user_id,
  u.email,
  u.name AS "User.name",
  u."companyName" AS "User.companyName",
  
  -- Calcular displayName_source
  CASE
    WHEN u.name IS NOT NULL 
         AND TRIM(u.name) != '' 
         AND u.name !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    THEN 'User.name'
    
    WHEN u."companyName" IS NOT NULL 
         AND TRIM(u."companyName") != '' 
         AND u."companyName" !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    THEN 'User.companyName'
    
    WHEN u.email IS NOT NULL 
         AND SPLIT_PART(u.email, '@', 1) IS NOT NULL
         AND TRIM(SPLIT_PART(u.email, '@', 1)) != ''
    THEN 'emailLocal'
    
    ELSE 'NO_DATA'
  END AS displayName_source,
  
  -- Calcular avatar_status
  CASE
    WHEN u.avatar IS NULL THEN 'NULL'
    WHEN TRIM(u.avatar) = '' THEN 'VACIO'
    WHEN u.avatar LIKE 'data:,%' THEN 'DATA_URL_VACIA'
    WHEN u.avatar LIKE '%404%' THEN 'URL_404'
    WHEN u.avatar LIKE 'https://%' THEN 'OK'
    ELSE 'SOSPECHOSO'
  END AS avatar_status

FROM public."User" u
ORDER BY 
  CASE 
    WHEN u.name IS NULL AND u."companyName" IS NULL THEN 0
    ELSE 1
  END,
  u.email;

-- ============================================================================
-- QUERY 2: Contador por categoría
-- ============================================================================

SELECT 
  CASE
    WHEN u.name IS NOT NULL 
         AND TRIM(u.name) != '' 
         AND u.name !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    THEN 'User.name'
    
    WHEN u."companyName" IS NOT NULL 
         AND TRIM(u."companyName") != '' 
         AND u."companyName" !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    THEN 'User.companyName'
    
    WHEN u.email IS NOT NULL 
         AND SPLIT_PART(u.email, '@', 1) IS NOT NULL
    THEN 'emailLocal'
    
    ELSE 'NO_DATA'
  END AS "Fuente DisplayName",
  
  COUNT(*) AS "Total Usuarios",
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) AS "Porcentaje %"

FROM public."User" u
GROUP BY 1
ORDER BY 
  CASE 
    WHEN CASE
      WHEN u.name IS NOT NULL AND TRIM(u.name) != '' THEN 'User.name'
      WHEN u."companyName" IS NOT NULL AND TRIM(u."companyName") != '' THEN 'User.companyName'
      WHEN u.email IS NOT NULL THEN 'emailLocal'
      ELSE 'NO_DATA'
    END = 'NO_DATA' THEN 0
    ELSE 1
  END,
  COUNT(*) DESC;

-- ============================================================================
-- INTERPRETACIÓN
-- ============================================================================

/*
RESULTADOS ESPERADOS:

- User.name: Usuarios con nombre configurado (ÓPTIMO)
- User.companyName: Inmobiliarias con nombre de empresa (OK)
- emailLocal: Usuarios usando parte del email (ACEPTABLE)
- NO_DATA: Usuarios sin ninguna fuente (CRÍTICO - requiere backfill)

PRÓXIMOS PASOS:
1. Ejecutar Prompt A2 (auditoría de avatares)
2. Ejecutar Prompt B1 (backfill de nombres)
3. Ejecutar Prompt B2 (limpieza de avatares)
*/
