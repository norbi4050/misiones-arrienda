-- =====================================================
-- DIAGNÓSTICO: Ver estructura actual de la base de datos
-- =====================================================

-- 1. Listar TODAS las tablas en public
SELECT
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = 'public' AND t.table_name = table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
ORDER BY table_name;

-- 2. Ver si existe la tabla User (con mayúscula)
SELECT EXISTS (
  SELECT FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name = 'User'
) as "User_exists";

-- 3. Ver si existe la tabla users (minúscula)
SELECT EXISTS (
  SELECT FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name = 'users'
) as "users_exists";

-- 4. Ver si existe la tabla profiles
SELECT EXISTS (
  SELECT FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name = 'profiles'
) as "profiles_exists";

-- 5. Ver si existe la tabla UserProfile
SELECT EXISTS (
  SELECT FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name = 'UserProfile'
) as "UserProfile_exists";

-- 6. Ver triggers activos en auth.users
SELECT
  trigger_name,
  event_manipulation,
  action_statement,
  action_timing
FROM information_schema.triggers
WHERE event_object_schema = 'auth'
  AND event_object_table = 'users';

-- 7. Ver funciones relacionadas con usuarios
SELECT
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name LIKE '%user%'
ORDER BY routine_name;
