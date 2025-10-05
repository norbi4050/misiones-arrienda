-- ============================================================================
-- DIAGNÓSTICO: Schema actual de User y UserProfile
-- ============================================================================
-- Objetivo: Verificar qué columnas existen realmente en Supabase
-- ============================================================================

-- Ver columnas de la tabla User
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'User'
ORDER BY ordinal_position;

-- Ver columnas de la tabla UserProfile
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'UserProfile'
ORDER BY ordinal_position;

-- Verificar si existen las columnas mencionadas en el task
SELECT 
  'User.name' AS campo,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'User' AND column_name = 'name'
  ) THEN 'EXISTE' ELSE 'NO EXISTE' END AS status
UNION ALL
SELECT 
  'User.companyName' AS campo,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'User' AND column_name = 'companyName'
  ) THEN 'EXISTE' ELSE 'NO EXISTE' END AS status
UNION ALL
SELECT 
  'UserProfile.companyName' AS campo,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'UserProfile' AND column_name = 'companyName'
  ) THEN 'EXISTE' ELSE 'NO EXISTE' END AS status
UNION ALL
SELECT 
  'UserProfile.full_name' AS campo,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'UserProfile' AND column_name = 'full_name'
  ) THEN 'EXISTE' ELSE 'NO EXISTE' END AS status;
