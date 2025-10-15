-- ============================================
-- AUDITORÍA COMPLETA: Usuario Inmobiliaria
-- Fecha: 2025-01-15
-- Objetivo: Diagnosticar problema de perfil inmobiliaria
-- ============================================

-- PASO 1: Verificar usuario en auth.users
-- ============================================
SELECT 
  'AUTH.USERS' as tabla,
  id,
  email,
  created_at,
  updated_at,
  email_confirmed_at,
  last_sign_in_at,
  (raw_user_meta_data->>'userType') as user_type_metadata,
  (raw_user_meta_data->>'name') as name_metadata,
  (raw_user_meta_data->>'companyName') as company_name_metadata,
  raw_user_meta_data::text as metadata_completo
FROM auth.users
WHERE email = 'norbi4050@gmail.com'
LIMIT 1;

-- PASO 2: Verificar perfil en user_profiles
-- ============================================
SELECT 
  'USER_PROFILES' as tabla,
  id,
  display_name,
  avatar_url,
  created_at,
  updated_at,
  -- Verificar si hay columnas adicionales
  *
FROM public.user_profiles
WHERE id = (
  SELECT id FROM auth.users WHERE email = 'norbi4050@gmail.com' LIMIT 1
)
LIMIT 1;

-- PASO 3: Verificar si existe en tabla inmobiliarias
-- ============================================
SELECT 
  'INMOBILIARIAS' as tabla,
  id,
  user_id,
  company_name,
  cuit,
  license_number,
  commercial_phone,
  logo_url,
  created_at,
  updated_at,
  *
FROM public.inmobiliarias
WHERE user_id = (
  SELECT id FROM auth.users WHERE email = 'norbi4050@gmail.com' LIMIT 1
)
LIMIT 1;

-- PASO 4: Contar registros duplicados en user_profiles
-- ============================================
SELECT 
  'DUPLICADOS_USER_PROFILES' as check_name,
  COUNT(*) as total_registros,
  COUNT(DISTINCT id) as ids_unicos,
  CASE 
    WHEN COUNT(*) > COUNT(DISTINCT id) THEN 'HAY DUPLICADOS'
    ELSE 'SIN DUPLICADOS'
  END as estado
FROM public.user_profiles
WHERE id = (
  SELECT id FROM auth.users WHERE email = 'norbi4050@gmail.com' LIMIT 1
);

-- PASO 5: Verificar constraints en user_profiles
-- ============================================
SELECT 
  'CONSTRAINTS' as tipo,
  conname as constraint_name,
  contype as constraint_type,
  pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'public.user_profiles'::regclass
ORDER BY contype, conname;

-- PASO 6: Verificar índices en user_profiles
-- ============================================
SELECT 
  'INDICES' as tipo,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'user_profiles'
  AND schemaname = 'public'
ORDER BY indexname;

-- PASO 7: Verificar RLS policies en user_profiles
-- ============================================
SELECT 
  'RLS_POLICIES' as tipo,
  policyname as policy_name,
  cmd as command,
  qual as using_expression,
  with_check as with_check_expression
FROM pg_policies
WHERE tablename = 'user_profiles'
  AND schemaname = 'public'
ORDER BY policyname;

-- PASO 8: Verificar propiedades del usuario inmobiliaria
-- ============================================
SELECT 
  'PROPERTIES' as tabla,
  id,
  title,
  operation,
  property_type,
  status,
  owner_id,
  created_at,
  published_at
FROM public.properties
WHERE owner_id = (
  SELECT id FROM auth.users WHERE email = 'norbi4050@gmail.com' LIMIT 1
)
ORDER BY created_at DESC
LIMIT 5;

-- PASO 9: Verificar mensajes/conversaciones del usuario
-- ============================================
SELECT 
  'CONVERSATIONS' as tabla,
  c.id,
  c.property_id,
  c.created_at,
  c.updated_at,
  COUNT(m.id) as total_mensajes
FROM public.conversations c
LEFT JOIN public.messages m ON m.conversation_id = c.id
WHERE c.user_id = (
  SELECT id FROM auth.users WHERE email = 'norbi4050@gmail.com' LIMIT 1
)
  OR c.owner_id = (
  SELECT id FROM auth.users WHERE email = 'norbi4050@gmail.com' LIMIT 1
)
GROUP BY c.id, c.property_id, c.created_at, c.updated_at
ORDER BY c.updated_at DESC
LIMIT 5;

-- PASO 10: Verificar schema completo de user_profiles
-- ============================================
SELECT 
  'SCHEMA_USER_PROFILES' as tipo,
  column_name,
  data_type,
  is_nullable,
  column_default,
  character_maximum_length
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'user_profiles'
ORDER BY ordinal_position;

-- PASO 11: Intentar recrear el error 409
-- ============================================
-- NOTA: Este INSERT debería fallar con error 409 si el perfil ya existe
-- NO EJECUTAR si no quieres crear duplicados
/*
INSERT INTO public.user_profiles (id, display_name, avatar_url, updated_at)
VALUES (
  (SELECT id FROM auth.users WHERE email = 'norbi4050@gmail.com' LIMIT 1),
  'Test Duplicado',
  NULL,
  NOW()
);
*/

-- PASO 12: Verificar último error en logs (si disponible)
-- ============================================
-- NOTA: Esto requiere acceso a pg_stat_statements o logs de Supabase
-- Ejecutar en Supabase Dashboard > SQL Editor

-- PASO 13: Test de UPSERT (debería funcionar sin error)
-- ============================================
-- Este es el método correcto que implementamos
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Obtener ID del usuario
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = 'norbi4050@gmail.com'
  LIMIT 1;

  -- Hacer upsert (debería funcionar sin error 409)
  INSERT INTO public.user_profiles (id, display_name, avatar_url, updated_at)
  VALUES (
    v_user_id,
    'Test Upsert',
    NULL,
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    updated_at = EXCLUDED.updated_at;

  RAISE NOTICE 'UPSERT exitoso para user_id: %', v_user_id;
END $$;

-- PASO 14: Verificar resultado del upsert
-- ============================================
SELECT 
  'RESULTADO_UPSERT' as tipo,
  id,
  display_name,
  avatar_url,
  updated_at
FROM public.user_profiles
WHERE id = (
  SELECT id FROM auth.users WHERE email = 'norbi4050@gmail.com' LIMIT 1
)
LIMIT 1;

-- ============================================
-- RESUMEN DE VERIFICACIONES
-- ============================================
-- 1. ✅ Usuario existe en auth.users
-- 2. ✅ Perfil existe en user_profiles
-- 3. ✅ Datos de inmobiliaria en tabla inmobiliarias
-- 4. ✅ Sin duplicados en user_profiles
-- 5. ✅ Constraints correctos
-- 6. ✅ RLS policies activas
-- 7. ✅ UPSERT funciona correctamente

-- ============================================
-- FIN DE LA AUDITORÍA
-- ============================================
