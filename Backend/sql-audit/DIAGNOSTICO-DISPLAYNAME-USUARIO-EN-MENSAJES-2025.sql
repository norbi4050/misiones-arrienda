-- ============================================================================
-- DIAGNÓSTICO COMPLETO: Problema "Usuario" en Mensajes
-- Fecha: Enero 2025
-- Propósito: Identificar usuarios con datos faltantes que causan el fallback a "Usuario"
-- ============================================================================

-- IMPORTANTE: Ejecutar estas queries en orden para un diagnóstico completo
-- Cada query está diseñada para revelar un aspecto específico del problema

-- ============================================================================
-- QUERY 1: VISTA GENERAL - Usuarios en Conversaciones
-- ============================================================================
-- Esta query muestra TODOS los usuarios que participan en conversaciones
-- y qué datos tienen disponibles para el displayName

WITH user_profiles_in_conversations AS (
  SELECT DISTINCT "aId" as profile_id FROM "Conversation"
  UNION
  SELECT DISTINCT "bId" as profile_id FROM "Conversation"
),
user_data AS (
  SELECT 
    u.id as user_id,
    u.email,
    u.name as user_name,
    up.full_name as profile_full_name,
    up."companyName" as profile_company_name,
    up.company_name as profile_company_name_snake,
    
    -- Detectar si son UUIDs (inválidos para displayName)
    CASE 
      WHEN u.name ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN '⚠️ UUID'
      WHEN u.name IS NOT NULL AND u.name != '' THEN '✅ Válido'
      ELSE '❌ Vacío'
    END as user_name_status,
    
    CASE 
      WHEN up."companyName" ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN '⚠️ UUID'
      WHEN up."companyName" IS NOT NULL AND up."companyName" != '' THEN '✅ Válido'
      ELSE '❌ Vacío'
    END as company_name_status,
    
    CASE 
      WHEN up.full_name ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN '⚠️ UUID'
      WHEN up.full_name IS NOT NULL AND up.full_name != '' THEN '✅ Válido'
      ELSE '❌ Vacío'
    END as full_name_status,
    
    -- Simular la lógica de prioridades del sistema
    CASE 
      WHEN u.name IS NOT NULL 
           AND u.name != '' 
           AND u.name !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' 
      THEN '1️⃣ User.name: ' || u.name
      
      WHEN up."companyName" IS NOT NULL 
           AND up."companyName" != '' 
           AND up."companyName" !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' 
      THEN '2️⃣ companyName: ' || up."companyName"
      
      WHEN up.full_name IS NOT NULL 
           AND up.full_name != '' 
           AND up.full_name !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' 
      THEN '3️⃣ full_name: ' || up.full_name
      
      WHEN u.email IS NOT NULL 
      THEN '4️⃣ emailLocal: ' || split_part(u.email, '@', 1)
      
      ELSE '5️⃣ FALLBACK → Usuario ⚠️'
    END as display_name_resultado,
    
    -- Contar conversaciones
    (SELECT COUNT(*) 
     FROM "Conversation" c 
     WHERE c."aId" = up.id OR c."bId" = up.id) as total_conversaciones
  
  FROM "User" u
  INNER JOIN "UserProfile" up ON up."userId" = u.id
  WHERE up.id IN (SELECT profile_id FROM user_profiles_in_conversations)
)
SELECT *
FROM user_data
ORDER BY 
  CASE 
    WHEN display_name_resultado LIKE '5️⃣%' THEN 1  -- Problemas primero
    WHEN display_name_resultado LIKE '4️⃣%' THEN 2  -- Email local segundo
    ELSE 3
  END,
  email;


-- ============================================================================
-- QUERY 2: USUARIOS PROBLEMÁTICOS - Solo los que muestran "Usuario"
-- ============================================================================
-- Esta query filtra SOLO los usuarios que causarán el fallback a "Usuario"

WITH user_profiles_in_conversations AS (
  SELECT DISTINCT "aId" as profile_id FROM "Conversation"
  UNION
  SELECT DISTINCT "bId" as profile_id FROM "Conversation"
)
SELECT 
  u.id as user_id,
  u.email,
  u.name as user_name,
  up.full_name,
  up."companyName",
  
  '🔴 PROBLEMA: Mostrará "Usuario"' as diagnostico,
  
  -- Razón específica del problema
  CASE 
    WHEN up.id IS NULL THEN 'Sin UserProfile'
    WHEN u.name ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' 
         AND (up."companyName" IS NULL OR up."companyName" = '')
         AND (up.full_name IS NULL OR up.full_name = '')
    THEN 'User.name es UUID y sin companyName/full_name'
    ELSE 'Todos los campos vacíos o UUIDs'
  END as razon,
  
  (SELECT COUNT(*) 
   FROM "Conversation" c 
   WHERE c."aId" = up.id OR c."bId" = up.id) as conversaciones_afectadas

FROM "User" u
LEFT JOIN "UserProfile" up ON up."userId" = u.id
WHERE up.id IN (SELECT profile_id FROM user_profiles_in_conversations)
AND (
  -- Sin UserProfile
  up.id IS NULL
  OR
  -- Todos los campos relevantes están vacíos o son UUIDs
  (
    (u.name IS NULL OR u.name = '' OR u.name ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$')
    AND
    (up."companyName" IS NULL OR up."companyName" = '' OR up."companyName" ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$')
    AND
    (up.full_name IS NULL OR up.full_name = '' OR up.full_name ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$')
  )
)
ORDER BY conversaciones_afectadas DESC, u.email;


-- ============================================================================
-- QUERY 3: ESTADÍSTICAS GENERALES
-- ============================================================================
-- Resumen cuantitativo del problema

WITH user_profiles_in_conversations AS (
  SELECT DISTINCT "aId" as profile_id FROM "Conversation"
  UNION
  SELECT DISTINCT "bId" as profile_id FROM "Conversation"
),
user_ids AS (
  SELECT DISTINCT up."userId" as user_id
  FROM "UserProfile" up
  WHERE up.id IN (SELECT profile_id FROM user_profiles_in_conversations)
)
SELECT 
  'Total usuarios en conversaciones' as metrica,
  COUNT(DISTINCT u.id) as cantidad
FROM "User" u
WHERE u.id IN (SELECT user_id FROM user_ids)

UNION ALL

SELECT 
  'Usuarios CON nombre válido (User.name)' as metrica,
  COUNT(DISTINCT u.id) as cantidad
FROM "User" u
WHERE u.id IN (SELECT user_id FROM user_ids)
AND u.name IS NOT NULL 
AND u.name != '' 
AND u.name !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'

UNION ALL

SELECT 
  'Usuarios CON companyName válido' as metrica,
  COUNT(DISTINCT u.id) as cantidad
FROM "User" u
LEFT JOIN "UserProfile" up ON up."userId" = u.id
WHERE u.id IN (SELECT user_id FROM user_ids)
AND up."companyName" IS NOT NULL 
AND up."companyName" != '' 
AND up."companyName" !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'

UNION ALL

SELECT 
  'Usuarios CON full_name válido' as metrica,
  COUNT(DISTINCT u.id) as cantidad
FROM "User" u
LEFT JOIN "UserProfile" up ON up."userId" = u.id
WHERE u.id IN (SELECT user_id FROM user_ids)
AND up.full_name IS NOT NULL 
AND up.full_name != '' 
AND up.full_name !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'

UNION ALL

SELECT 
  '🔴 Usuarios que mostrarán "Usuario"' as metrica,
  COUNT(DISTINCT u.id) as cantidad
FROM "User" u
LEFT JOIN "UserProfile" up ON up."userId" = u.id
WHERE u.id IN (SELECT user_id FROM user_ids)
AND (
  up.id IS NULL
  OR
  (
    (u.name IS NULL OR u.name = '' OR u.name ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$')
    AND
    (up."companyName" IS NULL OR up."companyName" = '' OR up."companyName" ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$')
    AND
    (up.full_name IS NULL OR up.full_name = '' OR up.full_name ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$')
  )
);


-- ============================================================================
-- QUERY 4: ANÁLISIS POR TIPO DE USUARIO
-- ============================================================================
-- Desglose del problema por tipo de usuario (inmobiliarias vs inquilinos)

WITH user_profiles_in_conversations AS (
  SELECT DISTINCT "aId" as profile_id FROM "Conversation"
  UNION
  SELECT DISTINCT "bId" as profile_id FROM "Conversation"
)
SELECT 
  COALESCE(u.user_type, 'sin_tipo') as tipo_usuario,
  COUNT(*) as total_usuarios,
  
  -- Usuarios con datos válidos
  COUNT(CASE 
    WHEN u.name IS NOT NULL 
         AND u.name != '' 
         AND u.name !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' 
    THEN 1 
  END) as con_user_name,
  
  COUNT(CASE 
    WHEN up."companyName" IS NOT NULL 
         AND up."companyName" != '' 
         AND up."companyName" !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' 
    THEN 1 
  END) as con_company_name,
  
  COUNT(CASE 
    WHEN up.full_name IS NOT NULL 
         AND up.full_name != '' 
         AND up.full_name !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' 
    THEN 1 
  END) as con_full_name,
  
  -- Usuarios problemáticos
  COUNT(CASE 
    WHEN (
      up.id IS NULL
      OR
      (
        (u.name IS NULL OR u.name = '' OR u.name ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$')
        AND
        (up."companyName" IS NULL OR up."companyName" = '' OR up."companyName" ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$')
        AND
        (up.full_name IS NULL OR up.full_name = '' OR up.full_name ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$')
      )
    )
    THEN 1 
  END) as mostraran_usuario,
  
  -- Porcentaje problemático
  ROUND(
    COUNT(CASE 
      WHEN (
        up.id IS NULL
        OR
        (
          (u.name IS NULL OR u.name = '' OR u.name ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$')
          AND
          (up."companyName" IS NULL OR up."companyName" = '' OR up."companyName" ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$')
          AND
          (up.full_name IS NULL OR up.full_name = '' OR up.full_name ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$')
        )
      )
      THEN 1 
    END) * 100.0 / NULLIF(COUNT(*), 0),
    2
  ) as porcentaje_problematico

FROM "User" u
INNER JOIN "UserProfile" up ON up."userId" = u.id
WHERE up.id IN (SELECT profile_id FROM user_profiles_in_conversations)
GROUP BY u.user_type
ORDER BY mostraran_usuario DESC;


-- ============================================================================
-- QUERY 5: CONVERSACIONES AFECTADAS
-- ============================================================================
-- Muestra qué conversaciones específicas están afectadas por el problema

WITH problematic_conversations AS (
  SELECT 
    c.id as conversation_id,
    c."createdAt" as fecha_creacion,
    c."aId",
    c."bId",
    
    -- Usuario A
    ua.email as usuario_a_email,
    CASE 
      WHEN ua.name IS NOT NULL 
           AND ua.name != '' 
           AND ua.name !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' 
      THEN ua.name
      WHEN upa."companyName" IS NOT NULL 
           AND upa."companyName" != '' 
           AND upa."companyName" !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' 
      <edit_file>
<path>sql-audit/DIAGNOSTICO-DISPLAYNAME-USUARIO-EN-MENSAJES-2025.sql</path>
<content>
  (SELECT COUNT(*) 
   FROM "Conversation" c 
   INNER JOIN "UserProfile" up2 ON up2.id = c."aId" OR up2.id = c."bId"
   WHERE up2."userId" = u.id) as conversaciones_activas
=======
  (SELECT COUNT(*)
   FROM "Conversation" c
   WHERE c."aId" = up.id OR c."bId" = up.id) as conversaciones_activas
