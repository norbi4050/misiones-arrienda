-- ============================================================================
-- PROMPT A1: Auditoría "quién aparece como Usuario"
-- ============================================================================
-- Objetivo: Listar todos los usuarios que participan en conversaciones
--           y NO tienen ninguna fuente válida de displayName
--
-- SCHEMA REAL (verificado con DIAGNOSTICO-SCHEMA-ACTUAL-USER-USERPROFILE-2025.sql):
--   - User.name (text) - nombre del usuario
--   - User.companyName (text) - nombre de empresa para inmobiliarias
--   - User.avatar (text) - URL del avatar
--   - UserProfile NO tiene companyName ni full_name (es para módulo comunidad)
--
-- Fecha: 2025-01-XX
-- Autor: Sistema de Auditoría DisplayName/Avatar
-- ============================================================================

-- QUERY PRINCIPAL: Lista completa de usuarios con análisis de displayName
-- ============================================================================

WITH user_conversations AS (
  -- Usuarios que participan en conversaciones (sender o receiver)
  SELECT DISTINCT user_id
  FROM public."Conversation"
  WHERE user_id IS NOT NULL
  
  UNION
  
  SELECT DISTINCT other_user_id
  FROM public."Conversation"
  WHERE other_user_id IS NOT NULL
),

user_data_enriched AS (
  SELECT 
    uc.user_id,
    u.email,
    u.name AS user_name,
    u.avatar,
    u."companyName",
    
    -- Calcular displayName_source según la lógica de prioridad
    CASE
      -- Prioridad 1: User.name (si existe, no vacío, no UUID)
      WHEN u.name IS NOT NULL 
           AND TRIM(u.name) != '' 
           AND u.name !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      THEN 'User.name'
      
      -- Prioridad 2: User.companyName (para empresas/inmobiliarias)
      WHEN u."companyName" IS NOT NULL 
           AND TRIM(u."companyName") != '' 
           AND u."companyName" !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      THEN 'User.companyName'
      
      -- Prioridad 3: Parte local del email
      WHEN u.email IS NOT NULL 
           AND SPLIT_PART(u.email, '@', 1) IS NOT NULL
           AND TRIM(SPLIT_PART(u.email, '@', 1)) != ''
      THEN 'emailLocal'
      
      -- Prioridad 4: Fallback (NO_DATA)
      ELSE 'NO_DATA'
    END AS displayName_source,
    
    -- Calcular avatar_status
    CASE
      WHEN u.avatar IS NULL THEN 'NULL'
      WHEN TRIM(u.avatar) = '' THEN 'VACIO'
      WHEN u.avatar LIKE 'data:,%' THEN 'DATA_URL_VACIA'
      WHEN u.avatar LIKE '%404%' THEN 'URL_404'
      WHEN u.avatar LIKE 'http://%' OR u.avatar LIKE 'https://%' THEN 'OK'
      ELSE 'SOSPECHOSO'
    END AS avatar_status
    
  FROM user_conversations uc
  LEFT JOIN public."User" u ON uc.user_id = u.id
)

-- RESULTADO FINAL: Lista ordenada con todas las columnas solicitadas
SELECT 
  user_id,
  email,
  user_name AS "User.name",
  "companyName" AS "User.companyName",
  displayName_source,
  avatar_status
FROM user_data_enriched
ORDER BY 
  -- NO_DATA primero (casos críticos)
  CASE WHEN displayName_source = 'NO_DATA' THEN 0 ELSE 1 END,
  -- Luego por fuente (menos confiable primero)
  CASE displayName_source
    WHEN 'NO_DATA' THEN 1
    WHEN 'emailLocal' THEN 2
    WHEN 'User.companyName' THEN 3
    WHEN 'User.name' THEN 4
    ELSE 0
  END,
  email;

-- ============================================================================
-- CONTADOR AGREGADO POR CATEGORÍA
-- ============================================================================

WITH user_conversations AS (
  SELECT DISTINCT user_id
  FROM public."Conversation"
  WHERE user_id IS NOT NULL
  
  UNION
  
  SELECT DISTINCT other_user_id
  FROM public."Conversation"
  WHERE other_user_id IS NOT NULL
),

user_data_enriched AS (
  SELECT 
    uc.user_id,
    u.email,
    u.name AS user_name,
    u."companyName",
    
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
    END AS displayName_source
    
  FROM user_conversations uc
  LEFT JOIN public."User" u ON uc.user_id = u.id
)

SELECT 
  displayName_source AS "Fuente DisplayName",
  COUNT(*) AS "Total Usuarios",
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) AS "Porcentaje %",
  CASE 
    WHEN displayName_source IN ('User.name', 'User.companyName') 
    THEN 'OK ✓'
    ELSE 'NO_DATA ✗'
  END AS "Estado"
FROM user_data_enriched
GROUP BY displayName_source
ORDER BY 
  CASE 
    WHEN displayName_source = 'NO_DATA' THEN 0
    WHEN displayName_source = 'emailLocal' THEN 1
    ELSE 2
  END,
  COUNT(*) DESC;

-- ============================================================================
-- INTERPRETACIÓN Y PRÓXIMOS PASOS
-- ============================================================================

/*
CÓMO INTERPRETAR LOS RESULTADOS:

1. displayName_source = 'NO_DATA':
   - CRÍTICO: Usuarios sin ninguna fuente válida de nombre
   - Aparecerán como "Usuario" en la UI
   - Requieren backfill inmediato (Prompt B1)

2. displayName_source = 'emailLocal':
   - ACEPTABLE: Usan la parte local del email como nombre
   - Funcional pero no ideal
   - Considerar backfill si hay datos disponibles

3. displayName_source = 'User.companyName':
   - OK: Tienen nombre de empresa en User
   - No requieren acción inmediata

4. displayName_source = 'User.name':
   - ÓPTIMO: Tienen nombre en la tabla User
   - Estado ideal, no requieren acción

PRÓXIMOS PASOS:

1. Ejecutar Prompt A2 para auditar avatares inválidos
2. Ejecutar Prompt B1 para backfill de nombres faltantes
3. Ejecutar Prompt B2 para limpieza de avatares inválidos
4. Verificar con Prompt C1 (logs de QA) que los cambios funcionan
5. Implementar Prompt D1 (guardas en server) para prevenir futuros casos

CRITERIO DE ÉXITO:
- displayName_source = 'NO_DATA': 0 usuarios (o < 1%)
- displayName_source = 'emailLocal': < 10% de usuarios
- displayName_source con datos reales: > 90% de usuarios
*/
