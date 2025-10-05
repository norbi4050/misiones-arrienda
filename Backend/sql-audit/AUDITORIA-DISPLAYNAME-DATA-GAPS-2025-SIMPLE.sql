-- ============================================
-- PROMPT D6: Auditoría SIMPLE de DATA GAPS en DisplayName
-- ============================================
-- Versión simplificada que funciona sin asumir nombres de columnas
-- Fecha: 2025-01-XX
-- ============================================

-- 1. LISTAR TODOS LOS USUARIOS CON SUS PERFILES
-- Ver qué datos tienen disponibles
SELECT 
  u.id as user_id,
  u.email,
  u.name as user_name,
  up.id as has_profile,
  up.full_name,
  u."createdAt" as user_created_at
FROM "User" u
LEFT JOIN "UserProfile" up ON up."userId" = u.id
ORDER BY u."createdAt" DESC
LIMIT 50;

-- 2. USUARIOS SIN NAME EN USER
-- Estos dependerán de UserProfile o email
SELECT 
  u.id as user_id,
  u.email,
  u.name as user_name,
  up.full_name,
  u."createdAt" as user_created_at
FROM "User" u
LEFT JOIN "UserProfile" up ON up."userId" = u.id
WHERE (u.name IS NULL OR u.name = '')
ORDER BY u."createdAt" DESC;

-- 3. USUARIOS SIN NAME NI FULL_NAME
-- Estos caerán en fallback de email
SELECT 
  u.id as user_id,
  u.email,
  u.name as user_name,
  up.full_name,
  u."createdAt" as user_created_at,
  'FALLBACK: email' as status
FROM "User" u
LEFT JOIN "UserProfile" up ON up."userId" = u.id
WHERE (u.name IS NULL OR u.name = '')
  AND (up.full_name IS NULL OR up.full_name = '')
ORDER BY u."createdAt" DESC;

-- 4. CONTAR USUARIOS POR FUENTE DE DISPLAYNAME
SELECT 
  CASE 
    WHEN u.name IS NOT NULL AND u.name != '' THEN 'User.name'
    WHEN up.full_name IS NOT NULL AND up.full_name != '' THEN 'UserProfile.full_name'
    WHEN u.email IS NOT NULL THEN 'emailLocal'
    ELSE 'fallback'
  END as source,
  COUNT(*) as count
FROM "User" u
LEFT JOIN "UserProfile" up ON up."userId" = u.id
GROUP BY source
ORDER BY count DESC;

-- 5. USUARIOS CON CONVERSACIONES PERO SIN DATOS
-- Crítico: tienen conversaciones activas pero caerían en fallback
SELECT DISTINCT
  u.id as user_id,
  u.email,
  u.name as user_name,
  up.full_name,
  COUNT(DISTINCT c.id) as active_conversations
FROM "User" u
LEFT JOIN "UserProfile" up ON up."userId" = u.id
LEFT JOIN "Conversation" c ON (c."aId" = up.id OR c."bId" = up.id) AND c."isActive" = true
WHERE (u.name IS NULL OR u.name = '')
  AND (up.full_name IS NULL OR up.full_name = '')
GROUP BY u.id, u.email, u.name, up.full_name
HAVING COUNT(DISTINCT c.id) > 0
ORDER BY active_conversations DESC;

-- ============================================
-- INSTRUCCIONES
-- ============================================
-- 
-- 1. Ejecutar query #1 primero para ver estructura de datos
-- 2. Ejecutar query #2 para ver usuarios sin name
-- 3. Ejecutar query #3 para ver usuarios críticos (sin name ni full_name)
-- 4. Ejecutar query #4 para ver distribución de fuentes
-- 5. Ejecutar query #5 para ver usuarios con conversaciones sin datos
--
-- CORRECCIÓN:
-- UPDATE "User" SET name = 'Nombre' WHERE id = 'user-id';
-- UPDATE "UserProfile" SET full_name = 'Nombre Completo' WHERE "userId" = 'user-id';
--
-- ============================================
