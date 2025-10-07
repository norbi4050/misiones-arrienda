-- ============================================================================
-- DIAGNÓSTICO: SCHEMA REAL DE user_profiles
-- Fecha: 8 de Enero 2025
-- Objetivo: Descubrir la estructura real de la tabla user_profiles
-- ============================================================================

-- QUERY 1: Ver estructura completa de user_profiles
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'user_profiles'
ORDER BY ordinal_position;

-- QUERY 2: Ver todas las tablas relacionadas con usuarios
SELECT 
  table_name,
  table_type
FROM information_schema.tables
WHERE table_schema = 'public'
  AND (table_name LIKE '%user%' OR table_name LIKE '%profile%')
ORDER BY table_name;

-- QUERY 3: Ver constraints y foreign keys de user_profiles
SELECT
  tc.constraint_name,
  tc.constraint_type,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
LEFT JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.table_schema = 'public'
  AND tc.table_name = 'user_profiles';

-- QUERY 4: Ver primeras 5 filas de user_profiles (para entender estructura)
SELECT *
FROM user_profiles
LIMIT 5;

-- QUERY 5: Contar registros en user_profiles
SELECT COUNT(*) as total_user_profiles
FROM user_profiles;

-- QUERY 6: Ver estructura de tabla users
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'users'
ORDER BY ordinal_position;
