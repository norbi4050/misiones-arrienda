-- ============================================================================
-- DIAGNÓSTICO: Verificar tipo de dato del campo ID en tabla users
-- Fecha: Enero 2025
-- ============================================================================

-- Verificar el tipo de dato del campo id en la tabla users
SELECT 
  table_name,
  column_name,
  data_type,
  udt_name,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'users'
  AND column_name = 'id';

-- Verificar si hay otras tablas con foreign keys a users
SELECT
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  tc.constraint_type
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE ccu.table_name = 'users'
  AND tc.constraint_type = 'FOREIGN KEY';
