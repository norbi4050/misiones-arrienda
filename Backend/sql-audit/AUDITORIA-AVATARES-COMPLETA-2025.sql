-- ============================================================================
-- AUDITORÍA COMPLETA: SISTEMA DE AVATARES
-- Fecha: 8 de Enero 2025
-- Objetivo: Investigar por qué los avatares no se reflejan correctamente
-- ============================================================================

-- IMPORTANTE: Estos queries son SOLO DE LECTURA (SELECT)
-- NO modifican ningún dato, solo recopilan información

-- ============================================================================
-- QUERY 1: AUDITORÍA GENERAL DE AVATARES
-- ============================================================================
-- Muestra el estado de avatares para todos los usuarios

SELECT 
  u.id,
  u.email,
  u.name,
  u.user_type,
  u.is_company,
  u.created_at as usuario_creado,
  
  -- Campo deprecado
  u.profile_image as users_profile_image_deprecated,
  
  -- Campos actuales
  up.id as user_profile_id,
  up.photos as userprofiles_photos_array,
  up.photos[1] as avatar_url_principal,
  up.full_name,
  up.company_name,
  up.updated_at as avatar_actualizado,
  
  -- Diagnóstico
  CASE 
    WHEN up.id IS NULL THEN '❌ SIN user_profiles'
    WHEN up.photos IS NULL OR array_length(up.photos, 1) = 0 THEN '⚠️ user_profiles existe pero photos vacío'
    WHEN up.photos[1] LIKE '%/avatar/%avatar.%' THEN '❌ URL mal formada (carpeta /avatar/ extra)'
    WHEN up.photos[1] LIKE '%-%avatar.%' THEN '❌ URL con timestamp en nombre'
    WHEN up.photos[1] IS NOT NULL THEN '✅ Avatar configurado'
    ELSE '⚠️ Estado desconocido'
  END as diagnostico,
  
  -- Fuente del avatar
  CASE 
    WHEN up.photos IS NOT NULL AND array_length(up.photos, 1) > 0 THEN 'user_profiles.photos'
    WHEN u.profile_image IS NOT NULL THEN 'users.profile_image (deprecado)'
    ELSE 'ninguna (usará ui-avatars.com)'
  END as fuente_avatar

FROM users u
LEFT JOIN user_profiles up ON up.user_id = u.id
ORDER BY u.created_at DESC
LIMIT 100;

-- ============================================================================
-- QUERY 2: USUARIOS SIN user_profiles (PROBLEMA CRÍTICO)
-- ============================================================================
-- Identifica usuarios que no tienen registro en user_profiles

SELECT 
  u.id,
  u.email,
  u.name,
  u.user_type,
  u.is_company,
  u.profile_image as tiene_profile_image_deprecated,
  u.created_at,
  '❌ FALTA user_profiles - Debe crearse' as problema
FROM users u
LEFT JOIN user_profiles up ON up.user_id = u.id
WHERE up.id IS NULL
ORDER BY u.created_at DESC;

-- ============================================================================
-- QUERY 3: AVATARES CON URLs MAL FORMADAS
-- ============================================================================
-- Detecta URLs con estructura incorrecta

SELECT 
  u.id,
  u.email,
  u.name,
  up.photos[1] as avatar_url_incorrecta,
  CASE 
    WHEN up.photos[1] LIKE '%/avatar/%avatar.%' THEN 'Tiene carpeta /avatar/ extra'
    WHEN up.photos[1] LIKE '%-%avatar.%' THEN 'Tiene timestamp en nombre'
    ELSE 'Otro problema'
  END as tipo_problema,
  up.updated_at
FROM users u
INNER JOIN user_profiles up ON up.user_id = u.id
WHERE up.photos[1] LIKE '%/avatar/%avatar.%'  -- Detecta carpeta /avatar/ extra
   OR up.photos[1] LIKE '%-%avatar.%'         -- Detecta timestamp en nombre
ORDER BY up.updated_at DESC;

-- ============================================================================
-- QUERY 4: VERIFICAR ARCHIVOS EN STORAGE
-- ============================================================================
-- Lista archivos en el bucket 'avatars'

SELECT 
  so.id as storage_object_id,
  so.name as ruta_completa,
  so.bucket_id,
  so.created_at as archivo_creado,
  so.updated_at as archivo_actualizado,
  so.last_accessed_at as ultimo_acceso,
  
  -- Extraer user_id del path
  split_part(so.name, '/', 1) as user_id_extraido,
  
  -- Diagnóstico de estructura
  CASE 
    WHEN so.name ~ '^[a-f0-9-]{36}/avatar\.(jpg|jpeg|png|webp|gif)$' THEN '✅ Estructura correcta'
    WHEN so.name LIKE '%/avatar/%' THEN '❌ Tiene carpeta /avatar/ extra'
    WHEN so.name LIKE '%-%avatar.%' THEN '❌ Tiene timestamp en nombre'
    ELSE '⚠️ Estructura desconocida'
  END as diagnostico_estructura,
  
  -- Tamaño del archivo
  (so.metadata->>'size')::bigint as tamano_bytes,
  round((so.metadata->>'size')::numeric / 1024, 2) as tamano_kb

FROM storage.objects so
WHERE so.bucket_id = 'avatars'
ORDER BY so.created_at DESC
LIMIT 100;

-- ============================================================================
-- QUERY 5: COMPARAR DB vs STORAGE
-- ============================================================================
-- Verifica si las URLs en DB corresponden a archivos reales en Storage

SELECT 
  u.id,
  u.email,
  u.name,
  up.photos[1] as url_en_db,
  so.name as archivo_en_storage,
  
  CASE 
    WHEN up.photos[1] IS NOT NULL AND so.name IS NULL THEN '❌ URL en DB pero archivo NO existe en Storage'
    WHEN up.photos[1] IS NULL AND so.name IS NOT NULL THEN '⚠️ Archivo en Storage pero NO en DB'
    WHEN up.photos[1] IS NOT NULL AND so.name IS NOT NULL THEN '✅ Sincronizado'
    ELSE '⚠️ Ambos vacíos'
  END as estado_sincronizacion,
  
  so.created_at as archivo_creado,
  up.updated_at as db_actualizado

FROM users u
LEFT JOIN user_profiles up ON up.user_id = u.id
LEFT JOIN storage.objects so ON so.name LIKE u.id || '/avatar%' AND so.bucket_id = 'avatars'
WHERE up.photos IS NOT NULL 
   OR so.name IS NOT NULL
ORDER BY u.created_at DESC
LIMIT 50;

-- ============================================================================
-- QUERY 6: DESINCRONIZACIÓN users.profile_image vs user_profiles.photos
-- ============================================================================
-- Detecta inconsistencias entre el campo deprecado y el actual

SELECT 
  u.id,
  u.email,
  u.name,
  u.profile_image as campo_deprecado,
  up.photos[1] as campo_actual,
  
  CASE 
    WHEN u.profile_image IS NOT NULL AND (up.photos IS NULL OR array_length(up.photos, 1) = 0) 
      THEN '⚠️ Tiene profile_image pero photos vacío'
    WHEN u.profile_image IS NOT NULL AND up.photos[1] IS NOT NULL AND u.profile_image != up.photos[1] 
      THEN '⚠️ Desincronizados (diferentes URLs)'
    WHEN u.profile_image IS NULL AND up.photos[1] IS NOT NULL 
      THEN '✅ Solo en photos (correcto)'
    WHEN u.profile_image IS NOT NULL AND u.profile_image = up.photos[1] 
      THEN '✅ Sincronizados'
    ELSE '⚠️ Ambos vacíos'
  END as estado

FROM users u
LEFT JOIN user_profiles up ON up.user_id = u.id
WHERE u.profile_image IS NOT NULL 
   OR (up.photos IS NOT NULL AND array_length(up.photos, 1) > 0)
ORDER BY u.created_at DESC
LIMIT 50;

-- ============================================================================
-- QUERY 7: ESTADÍSTICAS GENERALES
-- ============================================================================
-- Resumen del estado del sistema de avatares

SELECT 
  'Total usuarios' as metrica,
  COUNT(*) as cantidad
FROM users
UNION ALL
SELECT 
  'Usuarios con user_profiles',
  COUNT(*)
FROM users u
INNER JOIN user_profiles up ON up.user_id = u.id
UNION ALL
SELECT 
  'Usuarios SIN user_profiles',
  COUNT(*)
FROM users u
LEFT JOIN user_profiles up ON up.user_id = u.id
WHERE up.id IS NULL
UNION ALL
SELECT 
  'Avatares configurados (photos)',
  COUNT(*)
FROM user_profiles
WHERE photos IS NOT NULL AND array_length(photos, 1) > 0
UNION ALL
SELECT 
  'Avatares con URL mal formada',
  COUNT(*)
FROM user_profiles
WHERE photos[1] LIKE '%/avatar/%avatar.%'
   OR photos[1] LIKE '%-%avatar.%'
UNION ALL
SELECT 
  'Archivos en Storage (bucket avatars)',
  COUNT(*)
FROM storage.objects
WHERE bucket_id = 'avatars'
UNION ALL
SELECT 
  'Usuarios con profile_image deprecado',
  COUNT(*)
FROM users
WHERE profile_image IS NOT NULL;

-- ============================================================================
-- QUERY 8: USUARIOS ESPECÍFICOS PARA TESTING
-- ============================================================================
-- Verifica usuarios conocidos (Carlos y tu usuario)

SELECT 
  u.id,
  u.email,
  u.name,
  u.user_type,
  u.is_company,
  u.profile_image as deprecated_field,
  up.photos as photos_array,
  up.photos[1] as primary_avatar,
  up.full_name,
  up.company_name,
  up.updated_at,
  
  CASE 
    WHEN up.id IS NULL THEN '❌ NO TIENE user_profiles'
    WHEN up.photos IS NULL OR array_length(up.photos, 1) = 0 THEN '⚠️ user_profiles existe pero photos vacío'
    WHEN up.photos[1] LIKE '%/avatar/%avatar.%' THEN '❌ URL mal formada (carpeta /avatar/ extra)'
    WHEN up.photos[1] LIKE '%-%avatar.%' THEN '❌ URL con timestamp'
    ELSE '✅ OK'
  END as diagnostico

FROM users u
LEFT JOIN user_profiles up ON up.user_id = u.id
WHERE u.email IN (
  'norbi4050@gmail.com',  -- Tu usuario
  'carlos@example.com',    -- Usuario Carlos (si existe)
  'test@example.com'       -- Otros usuarios de prueba
)
OR u.id = '6403f9d2-e846-4c70-87e0-e051127d9500'  -- ID de Carlos conocido
ORDER BY u.email;

-- ============================================================================
-- QUERY 9: ARCHIVOS HUÉRFANOS EN STORAGE
-- ============================================================================
-- Archivos en Storage que no tienen usuario correspondiente

SELECT 
  so.name as archivo_huerfano,
  split_part(so.name, '/', 1) as user_id_extraido,
  so.created_at,
  so.updated_at,
  '⚠️ Archivo sin usuario en DB' as problema
FROM storage.objects so
WHERE so.bucket_id = 'avatars'
  AND NOT EXISTS (
    SELECT 1 FROM users u 
    WHERE u.id::text = split_part(so.name, '/', 1)
  )
ORDER BY so.created_at DESC;

-- ============================================================================
-- QUERY 10: USUARIOS EMPRESA (is_company = true)
-- ============================================================================
-- Verifica específicamente usuarios tipo empresa

SELECT 
  u.id,
  u.email,
  u.name,
  u.user_type,
  u.is_company,
  up.company_name,
  up.photos[1] as logo_url,
  
  CASE 
    WHEN up.id IS NULL THEN '❌ SIN user_profiles'
    WHEN up.photos IS NULL OR array_length(up.photos, 1) = 0 THEN '⚠️ Sin logo configurado'
    WHEN up.photos[1] IS NOT NULL THEN '✅ Logo configurado'
    ELSE '⚠️ Estado desconocido'
  END as estado_logo

FROM users u
LEFT JOIN user_profiles up ON up.user_id = u.id
WHERE u.is_company = true
ORDER BY u.created_at DESC;

-- ============================================================================
-- FIN DE AUDITORÍA
-- ============================================================================

-- INSTRUCCIONES DE USO:
-- 1. Ejecuta cada query por separado en Supabase SQL Editor
-- 2. Copia los resultados de cada query
-- 3. Pega los resultados en un archivo de texto
-- 4. Comparte los resultados para análisis

-- NOTA: Estos queries NO modifican ningún dato
-- Son completamente seguros de ejecutar
