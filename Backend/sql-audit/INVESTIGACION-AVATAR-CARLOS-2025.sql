-- ============================================
-- INVESTIGACIÓN: Avatar de Carlos González
-- ============================================
-- Basado en hallazgos previos:
-- User.id = 6403f9d2-e846-4c70-87e0-e051127d9500
-- User.name = "Carlos González"
-- ============================================

-- PASO 1: Verificar si existe tabla 'users' (snake_case)
-- ============================================
SELECT 
  'VERIFICAR_TABLA_USERS' as tipo,
  table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('users', 'User');

-- PASO 2: Verificar datos de avatar en tabla users (si existe)
-- ============================================
SELECT 
  'AVATAR_EN_USERS' as tipo,
  id,
  name,
  profile_image,
  updated_at
FROM users
WHERE id = '6403f9d2-e846-4c70-87e0-e051127d9500';

-- PASO 3: Verificar datos de avatar en user_profiles
-- ============================================
SELECT 
  'AVATAR_EN_USER_PROFILES' as tipo,
  user_id,
  photos,
  updated_at
FROM user_profiles
WHERE user_id = '6403f9d2-e846-4c70-87e0-e051127d9500';

-- PASO 4: Verificar TODOS los usuarios y sus avatares
-- ============================================
SELECT 
  'TODOS_AVATARES_USERS' as tipo,
  u.id,
  u.name,
  u.profile_image,
  CASE 
    WHEN u.profile_image IS NOT NULL AND u.profile_image != '' THEN 'HAS_PROFILE_IMAGE'
    ELSE 'NO_PROFILE_IMAGE'
  END as estado_profile_image
FROM users u
ORDER BY u.created_at DESC;

-- PASO 5: Verificar TODOS los user_profiles y sus photos
-- ============================================
SELECT 
  'TODOS_AVATARES_USER_PROFILES' as tipo,
  up.user_id,
  up.photos,
  array_length(up.photos, 1) as num_photos,
  CASE 
    WHEN up.photos IS NOT NULL AND array_length(up.photos, 1) > 0 THEN 'HAS_PHOTOS'
    ELSE 'NO_PHOTOS'
  END as estado_photos
FROM user_profiles up
ORDER BY up.created_at DESC;

-- PASO 6: JOIN para ver relación completa
-- ============================================
SELECT 
  'RELACION_COMPLETA_AVATARES' as tipo,
  u.id as user_id,
  u.name,
  u.profile_image as users_profile_image,
  up.photos as user_profiles_photos,
  CASE 
    WHEN up.photos IS NOT NULL AND array_length(up.photos, 1) > 0 THEN 'user_profiles.photos'
    WHEN u.profile_image IS NOT NULL AND u.profile_image != '' THEN 'users.profile_image'
    ELSE 'NINGUNO'
  END as fuente_avatar
FROM users u
LEFT JOIN user_profiles up ON up.user_id = u.id
ORDER BY u.created_at DESC;

-- ============================================
-- CONCLUSIÓN ESPERADA:
-- ============================================
-- Si Carlos González NO tiene avatar configurado,
-- el endpoint /api/users/avatar retornará fallback de ui-avatars
-- ============================================
