-- =====================================================
-- VERIFICAR: Usuario de prueba creado correctamente
-- =====================================================

-- 1. Ver usuario en auth.users
SELECT
  'auth.users' as tabla,
  id::text as user_id,
  email,
  email_confirmed_at IS NOT NULL as email_verified,
  created_at
FROM auth.users
WHERE email = 'test@ejemplo.com';

-- 2. Ver usuario en public.User
SELECT
  'public.User' as tabla,
  id as user_id,
  email,
  name,
  "emailVerified",
  "userType"
FROM public."User"
WHERE email = 'test@ejemplo.com';

-- 3. Ver perfil de comunidad
SELECT
  'community_profiles' as tabla,
  cp.user_id,
  cp.display_name,
  cp.is_active,
  cp.created_at
FROM public.community_profiles cp
JOIN public."User" u ON cp.user_id::text = u.id
WHERE u.email = 'test@ejemplo.com';

-- 4. Ver preferencias de notificaciones
SELECT
  'notification_preferences' as tabla,
  np.user_id,
  np.email_enabled,
  np.in_app_enabled,
  np.new_messages,
  np.created_at
FROM public.notification_preferences np
JOIN public."User" u ON np.user_id::text = u.id
WHERE u.email = 'test@ejemplo.com';

-- 5. Resumen general
SELECT
  '✅ VERIFICACIÓN COMPLETA' as status,
  COUNT(DISTINCT au.id) as users_in_auth,
  COUNT(DISTINCT u.id) as users_in_User,
  COUNT(DISTINCT cp.user_id) as users_with_profile,
  COUNT(DISTINCT np.user_id) as users_with_preferences
FROM auth.users au
LEFT JOIN public."User" u ON au.id::text = u.id
LEFT JOIN public.community_profiles cp ON au.id = cp.user_id
LEFT JOIN public.notification_preferences np ON au.id = np.user_id
WHERE au.email = 'test@ejemplo.com';
