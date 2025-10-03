-- ============================================
-- DIAGNÓSTICO: Registro de Inmobiliarias
-- Fecha: 2025-01-XX
-- Propósito: Verificar estado de usuarios registrados como inmobiliarias
-- ============================================

-- ============================================
-- PASO 1: Verificar estructura de tabla users
-- ============================================
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'users'
  AND column_name IN ('id', 'email', 'user_type', 'company_name', 'is_company')
ORDER BY ordinal_position;

-- Resultado esperado:
-- column_name   | data_type | is_nullable | column_default
-- id            | uuid      | NO          | NULL
-- email         | text      | NO          | NULL
-- user_type     | text      | YES         | NULL
-- company_name  | text      | YES         | NULL
-- is_company    | boolean   | YES         | false

-- ============================================
-- PASO 2: Verificar últimos usuarios creados
-- ============================================
SELECT 
  id,
  email,
  name,
  user_type,
  company_name,
  is_company,
  email_verified,
  created_at,
  updated_at
FROM users
ORDER BY created_at DESC
LIMIT 10;

-- Buscar específicamente usuarios tipo 'inmobiliaria':
-- user_type debe ser 'inmobiliaria'
-- company_name debe tener valor
-- is_company debe ser true

-- ============================================
-- PASO 3: Buscar usuario específico por email
-- ============================================
-- REEMPLAZAR 'tu-email@ejemplo.com' con el email real
SELECT 
  id,
  email,
  name,
  user_type,
  company_name,
  license_number,
  is_company,
  email_verified,
  created_at
FROM users
WHERE email = 'tu-email@ejemplo.com';

-- Resultado esperado para inmobiliaria:
-- user_type: 'inmobiliaria'
-- company_name: (nombre de la empresa)
-- is_company: true

-- ============================================
-- PASO 4: Verificar tabla user_profiles
-- ============================================
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'user_profiles'
ORDER BY ordinal_position;

-- Verificar que NO tiene campo 'user_type'
-- Solo debe tener: user_id, role, created_at, updated_at

-- ============================================
-- PASO 5: Verificar relación entre tablas
-- ============================================
SELECT 
  u.id,
  u.email,
  u.user_type,
  u.company_name,
  up.role as user_profile_role,
  u.created_at as users_created_at,
  up.created_at as profile_created_at
FROM users u
LEFT JOIN user_profiles up ON u.id = up.user_id::uuid
WHERE u.user_type = 'inmobiliaria'
ORDER BY u.created_at DESC
LIMIT 10;

-- Verificar:
-- 1. user_type = 'inmobiliaria' en tabla users
-- 2. role = 'BUSCO' (o NULL) en tabla user_profiles
-- 3. Las dos tablas son independientes

-- ============================================
-- PASO 6: Contar usuarios por tipo
-- ============================================
SELECT 
  user_type,
  COUNT(*) as total,
  COUNT(CASE WHEN is_company = true THEN 1 END) as con_is_company,
  COUNT(CASE WHEN company_name IS NOT NULL THEN 1 END) as con_company_name
FROM users
GROUP BY user_type
ORDER BY total DESC;

-- Resultado esperado:
-- user_type      | total | con_is_company | con_company_name
-- inquilino      | XX    | 0              | 0
-- inmobiliaria   | XX    | XX             | XX
-- dueno_directo  | XX    | 0              | 0

-- ============================================
-- PASO 7: Verificar triggers en tabla users
-- ============================================
SELECT 
  trigger_name,
  event_manipulation,
  action_statement,
  action_timing
FROM information_schema.triggers
WHERE event_object_table = 'users'
  AND event_object_schema = 'public';

-- Verificar que NO hay triggers que modifiquen user_type

-- ============================================
-- PASO 8: Verificar políticas RLS
-- ============================================
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'users'
  AND schemaname = 'public';

-- Verificar que las políticas permiten:
-- 1. INSERT con service_role
-- 2. SELECT del propio usuario (auth.uid())

-- ============================================
-- PASO 9: Buscar inconsistencias
-- ============================================

-- Usuarios con user_type='inmobiliaria' pero sin company_name
SELECT 
  id,
  email,
  user_type,
  company_name,
  is_company
FROM users
WHERE user_type = 'inmobiliaria'
  AND (company_name IS NULL OR company_name = '');

-- Resultado esperado: 0 filas (no debe haber inconsistencias)

-- Usuarios con is_company=true pero user_type diferente
SELECT 
  id,
  email,
  user_type,
  company_name,
  is_company
FROM users
WHERE is_company = true
  AND user_type != 'inmobiliaria';

-- Resultado esperado: 0 filas (no debe haber inconsistencias)

-- ============================================
-- PASO 10: Verificar metadata en auth.users
-- ============================================
-- NOTA: Esta query solo funciona con service_role
-- Ejecutar en Supabase SQL Editor con permisos de admin

SELECT 
  id,
  email,
  raw_user_meta_data->>'userType' as metadata_user_type,
  raw_user_meta_data->>'companyName' as metadata_company_name,
  created_at,
  email_confirmed_at
FROM auth.users
WHERE email = 'tu-email@ejemplo.com';

-- Verificar:
-- 1. metadata_user_type = 'inmobiliaria'
-- 2. metadata_company_name tiene valor
-- 3. email_confirmed_at tiene valor (email confirmado)

-- ============================================
-- RESUMEN DE VERIFICACIÓN
-- ============================================

-- Ejecutar esta query final para resumen completo:
WITH auth_data AS (
  SELECT 
    id,
    email,
    raw_user_meta_data->>'userType' as auth_user_type,
    raw_user_meta_data->>'companyName' as auth_company_name,
    email_confirmed_at IS NOT NULL as email_confirmed
  FROM auth.users
  WHERE email = 'tu-email@ejemplo.com'
),
users_data AS (
  SELECT 
    id,
    email,
    user_type,
    company_name,
    is_company
  FROM users
  WHERE email = 'tu-email@ejemplo.com'
),
profile_data AS (
  SELECT 
    user_id,
    role
  FROM user_profiles
  WHERE user_id::text = (SELECT id::text FROM users WHERE email = 'tu-email@ejemplo.com')
)
SELECT 
  'auth.users' as tabla,
  a.email,
  a.auth_user_type as user_type,
  a.auth_company_name as company_name,
  a.email_confirmed as email_confirmed,
  NULL::text as role
FROM auth_data a
UNION ALL
SELECT 
  'public.users' as tabla,
  u.email,
  u.user_type,
  u.company_name,
  NULL::boolean as email_confirmed,
  NULL::text as role
FROM users_data u
UNION ALL
SELECT 
  'public.user_profiles' as tabla,
  NULL::text as email,
  NULL::text as user_type,
  NULL::text as company_name,
  NULL::boolean as email_confirmed,
  p.role
FROM profile_data p;

-- Resultado esperado:
-- tabla              | email              | user_type    | company_name | email_confirmed | role
-- auth.users         | tu@ejemplo.com     | inmobiliaria | Mi Empresa   | true            | NULL
-- public.users       | tu@ejemplo.com     | inmobiliaria | Mi Empresa   | NULL            | NULL
-- public.user_profiles| NULL              | NULL         | NULL         | NULL            | BUSCO

-- ============================================
-- INSTRUCCIONES DE USO
-- ============================================

/*
1. Abrir Supabase Dashboard
2. Ir a SQL Editor
3. Copiar y pegar estas queries una por una
4. Reemplazar 'tu-email@ejemplo.com' con el email real
5. Ejecutar cada query y revisar resultados
6. Comparar con resultados esperados
7. Reportar cualquier discrepancia

IMPORTANTE:
- Algunas queries requieren permisos de service_role
- Si una query falla, continuar con la siguiente
- Documentar todos los resultados
*/
