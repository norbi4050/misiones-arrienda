-- =====================================================
-- DEBUG: Investigar errores en triggers de registro
-- =====================================================

-- 1. Verificar que todos los triggers están activos
SELECT
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'auth'
  AND event_object_table = 'users'
ORDER BY trigger_name;

-- 2. Ver el código de cada función trigger
SELECT
  p.proname as function_name,
  pg_get_functiondef(p.oid) as function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname IN (
    'handle_new_user',
    'sync_user_metadata_to_public_users',
    'ensure_display_name',
    'init_notification_prefs'
  )
ORDER BY p.proname;

-- 3. Verificar estructura de tabla User
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'User'
ORDER BY ordinal_position;

-- 4. Verificar estructura de community_profiles
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'community_profiles'
ORDER BY ordinal_position;

-- 5. Verificar estructura de notification_preferences
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'notification_preferences'
ORDER BY ordinal_position;

-- 6. Intentar crear un usuario de prueba manualmente para ver el error
-- COMENTADO - Descomenta solo si quieres probar manualmente
/*
DO $$
DECLARE
  test_user_id uuid := gen_random_uuid();
BEGIN
  -- Simular lo que hace el trigger handle_new_user
  INSERT INTO public."User" (
    id,
    email,
    name,
    phone,
    password,
    verified,
    emailVerified,
    rating,
    reviewCount,
    createdAt,
    updatedAt
  ) VALUES (
    test_user_id::text,
    'test-manual@ejemplo.com',
    'Test Manual',
    '',
    'hashed_password_here',
    false,
    false,
    0,
    0,
    NOW(),
    NOW()
  );

  RAISE NOTICE 'Usuario creado exitosamente: %', test_user_id;

  -- Limpiar
  DELETE FROM public."User" WHERE id = test_user_id::text;
  RAISE NOTICE 'Usuario de prueba eliminado';

EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'ERROR al crear usuario: % - %', SQLSTATE, SQLERRM;
  ROLLBACK;
END $$;
*/

-- 7. Verificar constraints que podrían estar fallando
SELECT
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  tc.constraint_type,
  pg_get_constraintdef(pgc.oid) as constraint_definition
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN pg_constraint pgc
  ON pgc.conname = tc.constraint_name
WHERE tc.table_schema = 'public'
  AND tc.table_name IN ('User', 'community_profiles', 'notification_preferences')
ORDER BY tc.table_name, tc.constraint_type, tc.constraint_name;
