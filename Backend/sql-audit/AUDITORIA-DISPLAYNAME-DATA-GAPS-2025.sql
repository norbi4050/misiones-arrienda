-- ============================================
-- PROMPT D6: Auditoría de DATA GAPS en DisplayName
-- ============================================
-- Encuentra usuarios que no tienen datos suficientes para generar displayName
-- y caerían en fallback "Usuario"
--
-- Fecha: 2025-01-XX
-- Propósito: Identificar usuarios que necesitan corrección de datos
-- ============================================

-- 1. USUARIOS SIN DATOS PARA DISPLAYNAME
-- Encuentra usuarios que NO tienen name, companyName ni full_name
-- NOTA: Ajustar nombres de columnas según tu esquema real
SELECT 
  u.id as user_id,
  u.email,
  u.name as user_name,
  up."companyName" as company_name,  -- O usar up.company_name si es snake_case
  up.full_name,
  u."createdAt" as user_created_at,
  CASE 
    WHEN u.name IS NOT NULL AND u.name != '' THEN 'OK: User.name'
    WHEN up."companyName" IS NOT NULL AND up."companyName" != '' THEN 'OK: companyName'
    WHEN up.full_name IS NOT NULL AND up.full_name != '' THEN 'OK: full_name'
    WHEN u.email IS NOT NULL THEN 'FALLBACK: email'
    ELSE 'CRITICAL: no data'
  END as displayname_status
FROM "User" u
LEFT JOIN "UserProfile" up ON up."userId" = u.id
WHERE (u.name IS NULL OR u.name = '')
  AND (up."companyName" IS NULL OR up."companyName" = '')
  AND (up.full_name IS NULL OR up.full_name = '')
ORDER BY u."createdAt" DESC;

-- 2. INMOBILIARIAS SIN COMPANY NAME (VERSIÓN SIMPLIFICADA)
-- Encuentra usuarios con perfil que NO tienen companyName
-- NOTA: Ajustar si tu esquema usa user_type en lugar de is_company
SELECT 
  u.id as user_id,
  u.email,
  u.name as user_name,
  up."companyName" as company_name,
  up.full_name,
  u."createdAt" as user_created_at
FROM "User" u
LEFT JOIN "UserProfile" up ON up."userId" = u.id
WHERE up.id IS NOT NULL  -- Tiene UserProfile
  AND (up."companyName" IS NULL OR up."companyName" = '')
  AND (up.full_name IS NULL OR up.full_name = '')
ORDER BY u."createdAt" DESC;

-- 3. USUARIOS CON CONVERSACIONES ACTIVAS SIN DISPLAYNAME
-- Encuentra usuarios que tienen conversaciones pero caerían en fallback
SELECT DISTINCT
  u.id as user_id,
  u.email,
  u.name as user_name,
  up."companyName" as company_name,
  up.full_name,
  COUNT(DISTINCT c.id) as active_conversations,
  CASE 
    WHEN u.name IS NOT NULL AND u.name != '' THEN 'OK: User.name'
    WHEN up."companyName" IS NOT NULL AND up."companyName" != '' THEN 'OK: companyName'
    WHEN up.full_name IS NOT NULL AND up.full_name != '' THEN 'OK: full_name'
    WHEN u.email IS NOT NULL THEN 'FALLBACK: email'
    ELSE 'CRITICAL: no data'
  END as displayname_status
FROM "User" u
LEFT JOIN "UserProfile" up ON up."userId" = u.id
LEFT JOIN "Conversation" c ON (c."aId" = up.id OR c."bId" = up.id) AND c."isActive" = true
WHERE (u.name IS NULL OR u.name = '')
  AND (up."companyName" IS NULL OR up."companyName" = '')
  AND (up.full_name IS NULL OR up.full_name = '')
GROUP BY u.id, u.email, u.name, up."companyName", up.full_name
HAVING COUNT(DISTINCT c.id) > 0
ORDER BY active_conversations DESC;

-- 4. ESTADÍSTICAS GENERALES
-- Resumen de fuentes de displayName en la base de datos
SELECT 
  CASE 
    WHEN u.name IS NOT NULL AND u.name != '' THEN 'User.name'
    WHEN up."companyName" IS NOT NULL AND up."companyName" != '' THEN 'UserProfile.companyName'
    WHEN up.full_name IS NOT NULL AND up.full_name != '' THEN 'UserProfile.full_name'
    WHEN u.email IS NOT NULL THEN 'emailLocal'
    ELSE 'fallback'
  END as source,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM "User"), 2) as percentage
FROM "User" u
LEFT JOIN "UserProfile" up ON up."userId" = u.id
GROUP BY source
ORDER BY count DESC;

-- 5. USUARIOS CREADOS RECIENTEMENTE SIN DATOS
-- Últimos 30 días
SELECT 
  u.id as user_id,
  u.email,
  u.name as user_name,
  up."companyName" as company_name,
  up.full_name,
  u."createdAt" as created_at,
  CASE 
    WHEN u.name IS NOT NULL AND u.name != '' THEN 'OK: User.name'
    WHEN up."companyName" IS NOT NULL AND up."companyName" != '' THEN 'OK: companyName'
    WHEN up.full_name IS NOT NULL AND up.full_name != '' THEN 'OK: full_name'
    WHEN u.email IS NOT NULL THEN 'FALLBACK: email'
    ELSE 'CRITICAL: no data'
  END as displayname_status
FROM "User" u
LEFT JOIN "UserProfile" up ON up."userId" = u.id
WHERE u."createdAt" >= NOW() - INTERVAL '30 days'
  AND (u.name IS NULL OR u.name = '')
  AND (up."companyName" IS NULL OR up."companyName" = '')
  AND (up.full_name IS NULL OR up.full_name = '')
ORDER BY u."createdAt" DESC;

-- ============================================
-- INSTRUCCIONES DE USO
-- ============================================
-- 
-- 1. Ejecutar cada query por separado en Supabase SQL Editor
-- 2. Revisar resultados de cada sección
-- 3. Para usuarios con DATA GAP:
--    - Si es inmobiliaria: asegurar companyName en UserProfile
--    - Si es inquilino: asegurar name en User o full_name en UserProfile
-- 4. Ejecutar query #4 para ver distribución de fuentes
-- 5. Monitorear query #5 para nuevos usuarios sin datos
--
-- ============================================
-- CORRECCIÓN DE DATA GAPS
-- ============================================
--
-- Ejemplo: Actualizar companyName para inmobiliaria
-- UPDATE "UserProfile"
-- SET "companyName" = 'Nombre de la Inmobiliaria'
-- WHERE "userId" = 'user-id-aqui';
--
-- Ejemplo: Actualizar name para inquilino
-- UPDATE "User"
-- SET name = 'Nombre del Usuario'
-- WHERE id = 'user-id-aqui';
--
-- ============================================
