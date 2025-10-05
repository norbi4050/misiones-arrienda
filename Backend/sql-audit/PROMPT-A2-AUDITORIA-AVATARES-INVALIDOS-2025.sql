-- ============================================================================
-- PROMPT A2: Auditoría de avatares inválidos
-- ============================================================================
-- Objetivo: Detectar URLs de avatar nulas o probablemente inválidas
--           (vacías, data: URL vacía, 404 conocidas, dominios internos)
--
-- Fecha: 2025-01-XX
-- Autor: Sistema de Auditoría DisplayName/Avatar
-- ============================================================================

-- QUERY PRINCIPAL: Lista de usuarios con análisis de avatar
-- ============================================================================

WITH user_conversations AS (
  -- Usuarios que participan en conversaciones
  SELECT DISTINCT user_id
  FROM public."Conversation"
  WHERE user_id IS NOT NULL
  
  UNION
  
  SELECT DISTINCT other_user_id
  FROM public."Conversation"
  WHERE other_user_id IS NOT NULL
),

avatar_analysis AS (
  SELECT 
    uc.user_id,
    u.email,
    u.avatar,
    
    -- Clasificar avatar según reglas de detección
    CASE
      -- NULL: Avatar no configurado
      WHEN u.avatar IS NULL THEN 'NULL'
      
      -- VACIO: String vacío o solo espacios
      WHEN TRIM(u.avatar) = '' THEN 'VACIO'
      
      -- DATA_URL_VACIA: data: URL sin contenido real
      WHEN u.avatar LIKE 'data:,%' 
           OR u.avatar LIKE 'data:;%'
           OR u.avatar LIKE 'data:image/%'
      THEN 'DATA_URL_VACIA'
      
      -- URL_404: URLs conocidas que retornan 404
      WHEN u.avatar LIKE '%404%'
           OR u.avatar LIKE '%not-found%'
           OR u.avatar LIKE '%error%'
      THEN 'URL_404'
      
      -- HTTP_INSEGURO: URLs http:// (no https://)
      WHEN u.avatar LIKE 'http://%' 
           AND u.avatar NOT LIKE 'https://%'
      THEN 'HTTP_INSEGURO'
      
      -- DOMINIO_INTERNO: localhost, 127.0.0.1, etc.
      WHEN u.avatar LIKE '%localhost%'
           OR u.avatar LIKE '%127.0.0.1%'
           OR u.avatar LIKE '%0.0.0.0%'
           OR u.avatar LIKE '%192.168.%'
           OR u.avatar LIKE '%10.0.%'
      THEN 'DOMINIO_INTERNO'
      
      -- PLACEHOLDER: URLs de placeholder conocidas
      WHEN u.avatar LIKE '%placeholder%'
           OR u.avatar LIKE '%example.com%'
           OR u.avatar LIKE '%test.com%'
           OR u.avatar LIKE '%dummy%'
      THEN 'PLACEHOLDER'
      
      -- UUID_COMO_URL: Parece un UUID en lugar de URL
      WHEN u.avatar ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      THEN 'UUID_COMO_URL'
      
      -- OK: URL válida (https:// y no en categorías anteriores)
      WHEN u.avatar LIKE 'https://%' THEN 'OK'
      
      -- SOSPECHOSO: Cualquier otro caso
      ELSE 'SOSPECHOSO'
    END AS avatar_flag,
    
    -- Longitud del avatar (para detectar anomalías)
    LENGTH(u.avatar) AS avatar_length
    
  FROM user_conversations uc
  LEFT JOIN public."User" u ON uc.user_id = u.id
)

-- RESULTADO FINAL: Lista ordenada con todas las columnas solicitadas
SELECT 
  user_id,
  email,
  CASE 
    WHEN LENGTH(avatar) > 100 THEN SUBSTRING(avatar, 1, 100) || '...'
    ELSE avatar
  END AS avatar_preview,
  avatar_flag,
  avatar_length
FROM avatar_analysis
ORDER BY 
  -- Casos problemáticos primero
  CASE avatar_flag
    WHEN 'NULL' THEN 1
    WHEN 'VACIO' THEN 2
    WHEN 'DATA_URL_VACIA' THEN 3
    WHEN 'URL_404' THEN 4
    WHEN 'DOMINIO_INTERNO' THEN 5
    WHEN 'HTTP_INSEGURO' THEN 6
    WHEN 'PLACEHOLDER' THEN 7
    WHEN 'UUID_COMO_URL' THEN 8
    WHEN 'SOSPECHOSO' THEN 9
    WHEN 'OK' THEN 10
    ELSE 99
  END,
  email;

-- ============================================================================
-- TOTALES POR AVATAR_FLAG
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

avatar_analysis AS (
  SELECT 
    uc.user_id,
    
    CASE
      WHEN u.avatar IS NULL THEN 'NULL'
      WHEN TRIM(u.avatar) = '' THEN 'VACIO'
      WHEN u.avatar LIKE 'data:,%' 
           OR u.avatar LIKE 'data:;%'
           OR u.avatar LIKE 'data:image/%'
      THEN 'DATA_URL_VACIA'
      WHEN u.avatar LIKE '%404%'
           OR u.avatar LIKE '%not-found%'
           OR u.avatar LIKE '%error%'
      THEN 'URL_404'
      WHEN u.avatar LIKE 'http://%' 
           AND u.avatar NOT LIKE 'https://%'
      THEN 'HTTP_INSEGURO'
      WHEN u.avatar LIKE '%localhost%'
           OR u.avatar LIKE '%127.0.0.1%'
           OR u.avatar LIKE '%0.0.0.0%'
           OR u.avatar LIKE '%192.168.%'
           OR u.avatar LIKE '%10.0.%'
      THEN 'DOMINIO_INTERNO'
      WHEN u.avatar LIKE '%placeholder%'
           OR u.avatar LIKE '%example.com%'
           OR u.avatar LIKE '%test.com%'
           OR u.avatar LIKE '%dummy%'
      THEN 'PLACEHOLDER'
      WHEN u.avatar ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      THEN 'UUID_COMO_URL'
      WHEN u.avatar LIKE 'https://%' THEN 'OK'
      ELSE 'SOSPECHOSO'
    END AS avatar_flag
    
  FROM user_conversations uc
  LEFT JOIN public."User" u ON uc.user_id = u.id
)

SELECT 
  avatar_flag AS "Estado Avatar",
  COUNT(*) AS "Total Usuarios",
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) AS "Porcentaje %",
  CASE 
    WHEN avatar_flag = 'OK' THEN '✓ OK'
    WHEN avatar_flag IN ('NULL', 'VACIO') THEN '⚠ REQUIERE LIMPIEZA'
    ELSE '✗ INVÁLIDO'
  END AS "Acción Requerida"
FROM avatar_analysis
GROUP BY avatar_flag
ORDER BY 
  CASE avatar_flag
    WHEN 'NULL' THEN 1
    WHEN 'VACIO' THEN 2
    WHEN 'DATA_URL_VACIA' THEN 3
    WHEN 'URL_404' THEN 4
    WHEN 'DOMINIO_INTERNO' THEN 5
    WHEN 'HTTP_INSEGURO' THEN 6
    WHEN 'PLACEHOLDER' THEN 7
    WHEN 'UUID_COMO_URL' THEN 8
    WHEN 'SOSPECHOSO' THEN 9
    WHEN 'OK' THEN 10
    ELSE 99
  END;

-- ============================================================================
-- REGLAS DE DETECCIÓN DETALLADAS
-- ============================================================================

/*
REGLAS SIMPLES DE DETECCIÓN:

1. NULL:
   - avatar IS NULL
   - No hay avatar configurado
   - Acción: Dejar en NULL (fallback a iniciales)

2. VACIO:
   - avatar = '' o solo espacios
   - String vacío sin contenido
   - Acción: Setear a NULL

3. DATA_URL_VACIA:
   - avatar LIKE 'data:,%'
   - avatar LIKE 'data:;%'
   - avatar LIKE 'data:image/%' (sin contenido base64)
   - Data URL malformada o vacía
   - Acción: Setear a NULL

4. URL_404:
   - avatar contiene '404', 'not-found', 'error'
   - URLs que probablemente retornan 404
   - Acción: Setear a NULL

5. HTTP_INSEGURO:
   - avatar LIKE 'http://%' (no https)
   - Protocolo inseguro
   - Acción: Considerar actualizar a https:// o setear a NULL

6. DOMINIO_INTERNO:
   - localhost, 127.0.0.1, 192.168.x.x, 10.0.x.x
   - URLs de desarrollo/testing
   - Acción: Setear a NULL

7. PLACEHOLDER:
   - Contiene 'placeholder', 'example.com', 'test.com', 'dummy'
   - URLs de prueba
   - Acción: Setear a NULL

8. UUID_COMO_URL:
   - El avatar es un UUID en lugar de una URL
   - Error de configuración
   - Acción: Setear a NULL

9. SOSPECHOSO:
   - Cualquier otro patrón no reconocido
   - Requiere revisión manual
   - Acción: Revisar caso por caso

10. OK:
    - avatar LIKE 'https://%'
    - URL válida con protocolo seguro
    - Acción: Ninguna
*/

-- ============================================================================
-- RECOMENDACIÓN DE LIMPIEZA
-- ============================================================================

/*
RECOMENDACIÓN DE LIMPIEZA:

Para todos los casos EXCEPTO 'OK':
- Setear User.avatar = NULL
- Esto forzará el fallback a iniciales en el frontend
- Las iniciales se generan automáticamente desde displayName

VENTAJAS DE SETEAR A NULL:
1. Evita errores de carga de imagen en el frontend
2. Fallback automático a iniciales (mejor UX que imagen rota)
3. Consistencia: todos los usuarios sin avatar válido usan iniciales
4. Fácil de identificar usuarios que necesitan actualizar su avatar

PRÓXIMOS PASOS:
1. Ejecutar Prompt B2 para limpieza automática de avatares inválidos
2. Verificar con Prompt C1 (logs de QA) que el fallback funciona
3. Implementar Prompt D1 (guardas en server) para prevenir futuros casos

CRITERIO DE ÉXITO:
- avatar_flag = 'OK': > 50% de usuarios (tienen imagen válida)
- avatar_flag = 'NULL': < 50% de usuarios (usan iniciales)
- avatar_flag = otros: 0 usuarios (no hay avatares inválidos)
*/
