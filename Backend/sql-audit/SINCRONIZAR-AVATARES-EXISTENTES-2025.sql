-- ============================================================================
-- SINCRONIZAR AVATARES EXISTENTES
-- Fecha: 8 de Enero 2025
-- Objetivo: Copiar URLs de avatares a user_profiles.avatar_url
-- IMPORTANTE: Ejecutar ANTES de modificar el código
-- ============================================================================

-- ============================================================================
-- PASO 1: SINCRONIZAR AVATARES
-- ============================================================================

-- Carlos: Corregir URL mal formada y copiar a user_profiles
-- URL incorrecta en users.profile_image tiene carpeta /avatar/ y timestamp
-- URL correcta basada en archivo real en Storage
UPDATE user_profiles
SET avatar_url = 'https://qfeyhaaxyemmnohqdele.supabase.co/storage/v1/object/public/avatars/6403f9d2-e846-4c70-87e0-e051127d9500/avatar.png',
    updated_at = NOW()
WHERE id = '6403f9d2-e846-4c70-87e0-e051127d9500'::uuid;

-- Norbi: Copiar avatar (no logo) a user_profiles
-- Archivo existe en Storage como avatar.png
UPDATE user_profiles
SET avatar_url = 'https://qfeyhaaxyemmnohqdele.supabase.co/storage/v1/object/public/avatars/a4ef1f3d-c3e8-46df-b186-5b5c837cc14b/avatar.png',
    updated_at = NOW()
WHERE id = 'a4ef1f3d-c3e8-46df-b186-5b5c837cc14b'::uuid;

-- ============================================================================
-- PASO 2: VERIFICAR SINCRONIZACIÓN
-- ============================================================================

SELECT 
  id,
  display_name,
  avatar_url,
  updated_at,
  CASE 
    WHEN avatar_url IS NOT NULL THEN '✅ Avatar sincronizado'
    ELSE '❌ Avatar faltante'
  END as estado
FROM user_profiles
ORDER BY display_name;

-- Resultado esperado:
-- cgonzalezarchilla | https://.../avatar.png | ✅ Avatar sincronizado
-- norbi4050         | https://.../avatar.png | ✅ Avatar sincronizado

-- ============================================================================
-- PASO 3: VERIFICAR QUE ARCHIVOS EXISTEN EN STORAGE
-- ============================================================================

SELECT 
  up.id,
  up.display_name,
  up.avatar_url,
  so.name as archivo_en_storage,
  CASE 
    WHEN so.name IS NOT NULL THEN '✅ Archivo existe'
    ELSE '❌ Archivo NO existe'
  END as estado_archivo
FROM user_profiles up
LEFT JOIN storage.objects so ON so.name LIKE up.id::text || '/avatar%' AND so.bucket_id = 'avatars'
WHERE up.avatar_url IS NOT NULL
ORDER BY up.display_name;

-- Resultado esperado:
-- Ambos usuarios deben tener archivo en Storage

-- ============================================================================
-- PASO 4: COMPARAR ANTES Y DESPUÉS
-- ============================================================================

SELECT 
  u.id,
  u.email,
  u.name,
  
  -- ANTES (campos deprecados)
  u.profile_image as antes_profile_image,
  u.avatar as antes_avatar,
  u.logo_url as antes_logo_url,
  
  -- DESPUÉS (campo correcto)
  up.avatar_url as despues_avatar_url,
  
  -- Estado
  CASE 
    WHEN up.avatar_url IS NOT NULL THEN '✅ Migrado a user_profiles'
    ELSE '⚠️ Pendiente de migrar'
  END as estado_migracion

FROM users u
LEFT JOIN user_profiles up ON up.id = u.id::uuid
ORDER BY u.email;

-- ============================================================================
-- FIN DE SINCRONIZACIÓN
-- ============================================================================

-- NOTAS:
-- 1. Estos UPDATE son seguros - solo modifican user_profiles.avatar_url
-- 2. NO modifican la tabla users
-- 3. Las URLs apuntan a archivos que YA EXISTEN en Storage
-- 4. Después de ejecutar, verificar que ambos usuarios tienen avatar_url poblado
-- 5. Luego proceder a modificar el código según TODO-FIX-AVATARES-SCHEMA-REAL-2025.md
