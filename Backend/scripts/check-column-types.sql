-- Verificar tipos de datos de user_id en todas las tablas
SELECT
  table_name,
  column_name,
  data_type,
  udt_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND column_name IN ('id', 'user_id')
  AND table_name IN ('User', 'community_profiles', 'notification_preferences')
ORDER BY table_name, column_name;
