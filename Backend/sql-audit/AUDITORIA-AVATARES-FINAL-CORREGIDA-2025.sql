-- ============================================================================
-- AUDITORÍA AVATARES - VERSIÓN FINAL CORREGIDA
-- Fecha: 8 de Enero 2025
-- Fix: Agregado cast explícito para users.id (TEXT) → UUID
-- ============================================================================

-- ============================================================================
-- QUERY 1: AUDITORÍA COMPLETA (con cast de tipos)
-- ============================================================================

SELECT 
  u.id,
  u.email,
  u.name,
  u.user_type,
  u.is_company,
  u.created_at as usuario_creado,
  
  -- Campos de avatar en users
  u.avatar as users_avatar,
  u.profile_image as users_profile_image,
  u.logo_url as users_logo_url,
  
  -- Campos en user_profiles
  up.id as user_profile_existe,
  up.display_name,
  up.avatar_url as userprofiles_avatar_url,
  up.updated_at as avatar_actualizado,
  
  -- Diagnóstico
  CASE 
    WHEN up.id IS NULL THEN '❌ SIN user_profiles'
    WHEN up.avatar_url IS NULL AND u.avatar IS NULL AND u.profile_image IS NULL AND u.logo_url IS NULL 
      THEN '⚠️ Sin avatar en ninguna tabla'
    WHEN up.avatar_url IS NOT NULL THEN '✅ Avatar en user_profiles.avatar_url'
    WHEN u.avatar IS NOT NULL THEN '⚠️ Avatar solo en users.avatar'
    WHEN u.profile_image IS NOT NULL THEN '⚠️ Avatar solo en users.profile_image'
    WHEN u.logo_url IS NOT NULL THEN '⚠️ Logo solo en users.logo_url'
    ELSE '⚠️ Estado desconocido'
  END as diagnostico

FROM users u
LEFT JOIN user_profiles up ON up.id = u.id::uuid  -- ✅ CAST AGREGADO
ORDER BY u.created_at DESC
LIMIT 100;

-- ============================================================================
-- QUERY 2: USUARIOS SIN user_profiles
-- ============================================================================

SELECT 
  u.id,
  u.email,
  u.name,
  u.user_type,
  u.is_company,
  u.avatar,
  u.profile_image,
  u.logo_url,
  u.created_at,
  '❌ FALTA user_profiles' as problema
FROM users u
LEFT JOIN user_profiles up ON up.id = u.id::uuid  -- ✅ CAST AGREGADO
WHERE up.id IS NULL
ORDER BY u.created_at DESC;

-- ============================================================================
-- QUERY 3: COMPARAR users vs user_profiles
-- ============================================================================

SELECT 
  u.id,
  u.email,
  u.name,
  u.is_company,
  
  -- Avatares en users
  u.avatar as users_avatar,
  u.profile_image as users_profile_image,
  u.logo_url as users_logo_url,
  
  -- Avatar en user_profiles
  up.avatar_url as userprofiles_avatar_url,
  
  -- Estado
  CASE 
    WHEN up.id IS NULL THEN '❌ Sin user_profiles'
    WHEN up.avatar_url IS NULL AND (u.avatar IS NOT NULL OR u.profile_image IS NOT NULL OR u.logo_url IS NOT NULL)
      THEN '⚠️ Avatar en users pero NO en user_profiles'
    WHEN up.avatar_url IS NOT NULL AND u.avatar IS NULL AND u.profile_image IS NULL AND u.logo_url IS NULL
      THEN '✅ Solo en user_profiles (ideal)'
    WHEN up.avatar_url IS NOT NULL AND (u.avatar IS NOT NULL OR u.profile_image IS NOT NULL)
      THEN '⚠️ Duplicado en ambas tablas'
    ELSE '✅ Ambos vacíos'
  END as estado

FROM users u
LEFT JOIN user_profiles up ON up.id = u.id::uuid  -- ✅ CAST AGREGADO
WHERE u.avatar IS NOT NULL 
   OR u.profile_image IS NOT NULL 
   OR u.logo_url IS NOT NULL
   OR up.avatar_url IS NOT NULL
ORDER BY u.created_at DESC;

-- ============================================================================
-- QUERY 4: VERIFICAR STORAGE vs DATABASE
-- ============================================================================

SELECT 
  u.id,
  u.email,
  u.name,
  
  -- URLs en DB
  u.avatar as users_avatar,
  u.profile_image as users_profile_image,
  up.avatar_url as userprofiles_avatar_url,
  
  -- Archivos en Storage
  so.name as archivo_en_storage,
  so.created_at as archivo_creado,
  
  -- Diagnóstico
  CASE 
    WHEN up.avatar_url IS NOT NULL AND so.name IS NULL 
      THEN '❌ URL en user_profiles pero archivo NO existe'
    WHEN (u.avatar IS NOT NULL OR u.profile_image IS NOT NULL) AND so.name IS NULL 
      THEN '❌ URL en users pero archivo NO existe'
    WHEN up.avatar_url IS NULL AND so.name IS NOT NULL 
      THEN '⚠️ Archivo existe pero NO está en user_profiles.avatar_url'
    WHEN up.avatar_url IS NOT NULL AND so.name IS NOT NULL 
      THEN '✅ Sincronizado'
    ELSE '⚠️ Ambos vacíos'
  END as estado

FROM users u
LEFT JOIN user_profiles up ON up.id = u.id::uuid  -- ✅ CAST AGREGADO
LEFT JOIN storage.objects so ON so.name LIKE u.id || '/avatar%' AND so.bucket_id = 'avatars'
WHERE up.avatar_url IS NOT NULL 
   OR u.avatar IS NOT NULL
   OR u.profile_image IS NOT NULL
   OR so.name IS NOT NULL
ORDER BY u.created_at DESC;

-- ============================================================================
-- QUERY 5: ESTADÍSTICAS
-- ============================================================================

SELECT 
  'Total usuarios' as metrica,
  COUNT(*) as cantidad
FROM users
UNION ALL
SELECT 
  'Usuarios con user_profiles',
  COUNT(*)
FROM users u
INNER JOIN user_profiles up ON up.id = u.id::uuid  -- ✅ CAST AGREGADO
UNION ALL
SELECT 
  'Usuarios SIN user_profiles',
  COUNT(*)
FROM users u
LEFT JOIN user_profiles up ON up.id = u.id::uuid  -- ✅ CAST AGREGADO
WHERE up.id IS NULL
UNION ALL
SELECT 
  'Avatares en user_profiles.avatar_url',
  COUNT(*)
FROM user_profiles
WHERE avatar_url IS NOT NULL
UNION ALL
SELECT 
  'Avatares en users.avatar',
  COUNT(*)
FROM users
WHERE avatar IS NOT NULL
UNION ALL
SELECT 
  'Avatares en users.profile_image',
  COUNT(*)
FROM users
WHERE profile_image IS NOT NULL
UNION ALL
SELECT 
  'Logos en users.logo_url',
  COUNT(*)
FROM users
WHERE logo_url IS NOT NULL
UNION ALL
SELECT 
  'Archivos en Storage',
  COUNT(*)
FROM storage.objects
WHERE bucket_id = 'avatars';

-- ============================================================================
-- QUERY 6: USUARIOS ESPECÍFICOS
-- ============================================================================

SELECT 
  u.id,
  u.email,
  u.name,
  u.user_type,
  u.is_company,
  
  -- Avatares en users
  u.avatar,
  u.profile_image,
  u.logo_url,
  
  -- Avatar en user_profiles
  up.display_name,
  up.avatar_url,
  up.updated_at,
  
  -- Diagnóstico
  CASE 
    WHEN up.id IS NULL THEN '❌ NO TIENE user_profiles'
    WHEN up.avatar_url IS NULL THEN '⚠️ user_profiles existe pero avatar_url es NULL'
    ELSE '✅ Avatar configurado'
  END as diagnostico

FROM users u
LEFT JOIN user_profiles up ON up.id = u.id::uuid  -- ✅ CAST AGREGADO
WHERE u.email IN ('norbi4050@gmail.com', 'carlos@example.com')
   OR u.id IN ('6403f9d2-e846-4c70-87e0-e051127d9500', 'a4ef1f3d-c3e8-46df-b186-5b5c837cc14b')
ORDER BY u.email;

-- ============================================================================
-- QUERY 7: ARCHIVOS EN STORAGE CON ESTRUCTURA CORRECTA
-- ============================================================================

SELECT 
  so.name as ruta_completa,
  split_part(so.name, '/', 1) as user_id_extraido,
  so.created_at,
  (so.metadata->>'size')::bigint as tamano_bytes,
  
  -- Verificar si el usuario existe
  CASE 
    WHEN EXISTS (SELECT 1 FROM users WHERE id = split_part(so.name, '/', 1))
      THEN '✅ Usuario existe'
    ELSE '❌ Usuario NO existe'
  END as usuario_existe,
  
  -- Verificar si está en user_profiles.avatar_url
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id::text = split_part(so.name, '/', 1)
        AND up.avatar_url LIKE '%' || so.name || '%'
    ) THEN '✅ Registrado en user_profiles.avatar_url'
    ELSE '⚠️ NO registrado en user_profiles.avatar_url'
  END as registrado_en_db

FROM storage.objects so
WHERE so.bucket_id = 'avatars'
  AND so.name ~ '^[a-f0-9-]{36}/avatar\.(jpg|jpeg|png|webp|gif)$'
ORDER BY so.created_at DESC;

-- ============================================================================
-- QUERY 8: ARCHIVOS DE PRUEBA
-- ============================================================================

SELECT 
  so.name as archivo_prueba,
  so.created_at,
  (so.metadata->>'size')::bigint as tamano_bytes
FROM storage.objects so
WHERE so.bucket_id = 'avatars'
  AND (so.name LIKE '%smoketest%' OR so.name LIKE '%test%')
ORDER BY so.created_at DESC;
