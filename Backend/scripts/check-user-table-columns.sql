-- Ver EXACTAMENTE cómo se llaman las columnas en la tabla User
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'User'
ORDER BY ordinal_position;
