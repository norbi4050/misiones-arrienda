-- ============================================
-- INVESTIGACIÓN CORREGIDA: Usuario sin nombre
-- ============================================
-- CORRECCIONES aplicadas basadas en resultados:
-- - user_type → userType (camelCase)
-- - full_name NO EXISTE en UserProfile
-- - company_name → companyName (camelCase)
-- ============================================

-- PASO 1: Verificar datos del usuario problemático
-- ============================================
SELECT 
  'USER_PROBLEMATICO' as tipo,
  id,
  email,
  name,
  "companyName",
  "userType",
  "isCompany",
  "createdAt"
FROM "User"
WHERE id = '53a4bffa-48dd-40af-a6bd-cdd9139d7888';

-- PASO 2: Verificar si tiene UserProfile
-- ============================================
SELECT 
  'USERPROFILE_PROBLEMATICO' as tipo,
  id,
  "userId",
  "createdAt"
FROM "UserProfile"
WHERE "userId" = '53a4bffa-48dd-40af-a6bd-cdd9139d7888';

-- PASO 3: Auditoría COMPLETA - Todos los usuarios sin nombre
-- ============================================
SELECT 
  'USUARIOS_SIN_NAME' as tipo,
  id,
  email,
  name,
  "companyName",
  "userType",
  "isCompany",
  CASE 
    WHEN name IS NOT NULL AND name != '' THEN 'OK_NAME'
    WHEN "companyName" IS NOT NULL AND "companyName" != '' THEN 'OK_COMPANY'
    ELSE 'MISSING'
  END as estado_nombre,
  "createdAt"
FROM "User"
WHERE (name IS NULL OR name = '')
  AND ("companyName" IS NULL OR "companyName" = '')
ORDER BY "createdAt" DESC;

-- PASO 4: Usuarios con UserProfile (sin verificar full_name porque no existe)
-- ============================================
SELECT 
  'USUARIOS_CON_PROFILE' as tipo,
  u.id as user_id,
  u.email,
  u.name as user_name,
  u."companyName" as user_company_name,
  up.id as profile_id,
  CASE 
    WHEN u.name IS NOT NULL AND u.name != '' THEN 'OK_USER_NAME'
    WHEN u."companyName" IS NOT NULL AND u."companyName" != '' THEN 'OK_COMPANY_NAME'
    ELSE 'MISSING_ALL'
  END as estado,
  u."createdAt"
FROM "User" u
INNER JOIN "UserProfile" up ON up."userId" = u.id
WHERE (u.name IS NULL OR u.name = '')
  AND (u."companyName" IS NULL OR u."companyName" = '')
ORDER BY u."createdAt" DESC
LIMIT 20;

-- PASO 5: Estadísticas generales
-- ============================================
SELECT 
  'ESTADISTICAS_GENERALES' as tipo,
  COUNT(*) as total_usuarios,
  COUNT(CASE WHEN name IS NOT NULL AND name != '' THEN 1 END) as con_name,
  COUNT(CASE WHEN "companyName" IS NOT NULL AND "companyName" != '' THEN 1 END) as con_company_name,
  COUNT(CASE WHEN (name IS NULL OR name = '') 
                  AND ("companyName" IS NULL OR "companyName" = '') THEN 1 END) as sin_nombre_alguno,
  ROUND(100.0 * COUNT(CASE WHEN (name IS NULL OR name = '') 
                  AND ("companyName" IS NULL OR "companyName" = '') THEN 1 END) / COUNT(*), 2) as porcentaje_sin_nombre
FROM "User";

-- PASO 6: Verificar conversaciones del usuario problemático
-- ============================================
SELECT 
  'CONVERSACIONES_USUARIO_PROBLEMATICO' as tipo,
  c.id as conversation_id,
  c."aId",
  c."bId",
  c."createdAt",
  CASE 
    WHEN c."aId" = (SELECT id FROM "UserProfile" WHERE "userId" = '53a4bffa-48dd-40af-a6bd-cdd9139d7888') THEN 'ES_A'
    WHEN c."bId" = (SELECT id FROM "UserProfile" WHERE "userId" = '53a4bffa-48dd-40af-a6bd-cdd9139d7888') THEN 'ES_B'
    ELSE 'NO_PARTICIPA'
  END as rol_en_conversacion
FROM "Conversation" c
WHERE c."aId" = (SELECT id FROM "UserProfile" WHERE "userId" = '53a4bffa-48dd-40af-a6bd-cdd9139d7888')
   OR c."bId" = (SELECT id FROM "UserProfile" WHERE "userId" = '53a4bffa-48dd-40af-a6bd-cdd9139d7888');

-- PASO 7: Listar TODAS las columnas de UserProfile
-- ============================================
SELECT 
  'TODAS_COLUMNAS_USERPROFILE' as tipo,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'UserProfile'
ORDER BY ordinal_position;

-- PASO 8: Verificar si existe user_profiles (snake_case) como alternativa
-- ============================================
SELECT 
  'VERIFICAR_USER_PROFILES_SNAKE' as tipo,
  table_name,
  COUNT(*) as num_columnas
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('UserProfile', 'user_profiles')
GROUP BY table_name;

-- ============================================
-- ANÁLISIS ADICIONAL: Verificar datos de auth.users
-- ============================================
SELECT 
  'AUTH_USERS_PROBLEMATICO' as tipo,
  id,
  email,
  raw_user_meta_data,
  created_at
FROM auth.users
WHERE id = '53a4bffa-48dd-40af-a6bd-cdd9139d7888';
