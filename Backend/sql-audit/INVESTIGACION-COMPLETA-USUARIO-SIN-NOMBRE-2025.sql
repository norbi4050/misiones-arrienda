-- ============================================
-- INVESTIGACIÓN COMPLETA: Usuario sin nombre aparece como "Usuario"
-- ============================================
-- Problema: userId=53a4bffa-48dd-40af-a6bd-cdd9139d7888 no tiene name/companyName/full_name
-- Resultado: Aparece "Usuario" en vez del nombre real
-- ============================================

-- PASO 1: Verificar datos del usuario problemático
-- ============================================
SELECT 
  'USER_PROBLEMATICO' as tipo,
  id,
  email,
  name,
  "companyName",
  user_type,
  is_company,
  company_name,
  created_at
FROM "User"
WHERE id = '53a4bffa-48dd-40af-a6bd-cdd9139d7888';

-- PASO 2: Verificar si tiene UserProfile
-- ============================================
SELECT 
  'USERPROFILE_PROBLEMATICO' as tipo,
  id,
  "userId",
  full_name,
  created_at
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
  user_type,
  is_company,
  company_name,
  CASE 
    WHEN name IS NOT NULL AND name != '' THEN 'OK'
    WHEN "companyName" IS NOT NULL AND "companyName" != '' THEN 'OK_COMPANY'
    WHEN company_name IS NOT NULL AND company_name != '' THEN 'OK_COMPANY_SNAKE'
    ELSE 'MISSING'
  END as estado_nombre
FROM "User"
WHERE (name IS NULL OR name = '')
  AND ("companyName" IS NULL OR "companyName" = '')
  AND (company_name IS NULL OR company_name = '')
ORDER BY created_at DESC;

-- PASO 4: Usuarios con UserProfile pero sin full_name
-- ============================================
SELECT 
  'USUARIOS_CON_PROFILE_SIN_FULLNAME' as tipo,
  u.id as user_id,
  u.email,
  u.name as user_name,
  u."companyName" as user_company_name,
  up.id as profile_id,
  up.full_name,
  CASE 
    WHEN u.name IS NOT NULL AND u.name != '' THEN 'OK_USER_NAME'
    WHEN u."companyName" IS NOT NULL AND u."companyName" != '' THEN 'OK_COMPANY_NAME'
    WHEN up.full_name IS NOT NULL AND up.full_name != '' THEN 'OK_FULL_NAME'
    ELSE 'MISSING_ALL'
  END as estado
FROM "User" u
INNER JOIN "UserProfile" up ON up."userId" = u.id
WHERE (up.full_name IS NULL OR up.full_name = '')
  AND (u.name IS NULL OR u.name = '')
  AND (u."companyName" IS NULL OR "companyName" = '')
ORDER BY u.created_at DESC;

-- PASO 5: Estadísticas generales
-- ============================================
SELECT 
  'ESTADISTICAS_GENERALES' as tipo,
  COUNT(*) as total_usuarios,
  COUNT(CASE WHEN name IS NOT NULL AND name != '' THEN 1 END) as con_name,
  COUNT(CASE WHEN "companyName" IS NOT NULL AND "companyName" != '' THEN 1 END) as con_company_name,
  COUNT(CASE WHEN company_name IS NOT NULL AND company_name != '' THEN 1 END) as con_company_name_snake,
  COUNT(CASE WHEN (name IS NULL OR name = '') 
                  AND ("companyName" IS NULL OR "companyName" = '')
                  AND (company_name IS NULL OR company_name = '') THEN 1 END) as sin_nombre_alguno
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

-- PASO 7: Verificar estructura de columnas en tabla User
-- ============================================
SELECT 
  'ESTRUCTURA_TABLA_USER' as tipo,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'User'
  AND column_name IN ('name', 'companyName', 'company_name', 'email', 'user_type', 'is_company')
ORDER BY ordinal_position;

-- PASO 8: Verificar estructura de columnas en tabla UserProfile
-- ============================================
SELECT 
  'ESTRUCTURA_TABLA_USERPROFILE' as tipo,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'UserProfile'
  AND column_name IN ('id', 'userId', 'full_name', 'company_name')
ORDER BY ordinal_position;

-- ============================================
-- RECOMENDACIONES BASADAS EN RESULTADOS:
-- ============================================
-- 1. Si el usuario NO tiene name/companyName/full_name:
--    → Ejecutar backfill para poblar estos campos
--
-- 2. Si la columna companyName no existe en User:
--    → Agregar columna: ALTER TABLE "User" ADD COLUMN "companyName" TEXT;
--
-- 3. Si hay usuarios sin nombre en producción:
--    → Implementar guard en registro para requerir nombre
--    → Backfill nombres faltantes desde email o generar placeholder
-- ============================================
