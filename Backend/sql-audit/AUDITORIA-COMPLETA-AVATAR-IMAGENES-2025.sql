-- AUDITORÍA COMPLETA SUPABASE - AVATAR E IMÁGENES
-- Fecha: 2025-01-03
-- Objetivo: Verificar configuración completa tras implementación

-- =====================================================
-- SECCIÓN 1: VERIFICACIÓN DE TABLAS Y ESQUEMAS
-- =====================================================

-- 1.1 Verificar tabla User (para avatars)
SELECT 
  'USER_TABLE_SCHEMA' as audit_section,
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'User' 
  AND column_name IN ('id', 'profile_image', 'updated_at', 'name', 'email')
ORDER BY column_name;

-- 1.2 Verificar tabla properties (para imágenes)
SELECT 
  'PROPERTIES_TABLE_SCHEMA' as audit_section,
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'properties' 
  AND column_name IN ('id', 'user_id', 'images', 'images_urls', 'updated_at')
ORDER BY column_name;

-- 1.3 Verificar tabla user_profiles (sistema legacy)
SELECT 
  'USER_PROFILES_TABLE_SCHEMA' as audit_section,
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
  AND column_name IN ('id', 'avatar_path', 'updated_at')
ORDER BY column_name;

-- =====================================================
-- SECCIÓN 2: VERIFICACIÓN DE STORAGE BUCKETS
-- =====================================================

-- 2.1 Verificar buckets existentes
SELECT 
  'STORAGE_BUCKETS' as audit_section,
  id as bucket_name,
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets 
WHERE id IN ('avatars', 'properties')
ORDER BY id;

-- 2.2 Verificar políticas RLS para bucket avatars
SELECT 
  'AVATARS_RLS_POLICIES' as audit_section,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND policyname LIKE '%avatar%'
ORDER BY policyname;

-- 2.3 Verificar políticas RLS para bucket properties
SELECT 
  'PROPERTIES_RLS_POLICIES' as audit_section,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND policyname LIKE '%propert%'
ORDER BY policyname;

-- =====================================================
-- SECCIÓN 3: VERIFICACIÓN DE DATOS ACTUALES
-- =====================================================

-- 3.1 Estado de avatars en User table
SELECT 
  'USER_AVATARS_STATUS' as audit_section,
  COUNT(*) as total_users,
  COUNT(CASE WHEN profile_image IS NOT NULL THEN 1 END) as users_with_avatar,
  COUNT(CASE WHEN profile_image IS NULL THEN 1 END) as users_without_avatar,
  COUNT(CASE WHEN profile_image LIKE '%supabase%' THEN 1 END) as supabase_storage_avatars,
  COUNT(CASE WHEN profile_image LIKE '%data:image%' THEN 1 END) as base64_avatars
FROM "User";

-- 3.2 Estado de imágenes en properties table
SELECT 
  'PROPERTIES_IMAGES_STATUS' as audit_section,
  COUNT(*) as total_properties,
  COUNT(CASE WHEN images_urls IS NOT NULL AND array_length(images_urls, 1) > 0 THEN 1 END) as with_images_urls,
  COUNT(CASE WHEN images IS NOT NULL AND images != '[]' AND LENGTH(images) > 2 THEN 1 END) as with_images_legacy,
  COUNT(CASE WHEN images LIKE '%data:image%' THEN 1 END) as with_base64_data,
  COUNT(CASE WHEN images LIKE '%supabase%' THEN 1 END) as with_supabase_urls
FROM properties;

-- 3.3 Verificar archivos en bucket avatars
SELECT 
  'AVATARS_BUCKET_FILES' as audit_section,
  COUNT(*) as total_files,
  COUNT(CASE WHEN name LIKE '%avatar%' THEN 1 END) as avatar_files,
  SUM(metadata->>'size')::bigint as total_size_bytes,
  AVG((metadata->>'size')::bigint) as avg_file_size
FROM storage.objects 
WHERE bucket_id = 'avatars';

-- 3.4 Verificar archivos en bucket properties
SELECT 
  'PROPERTIES_BUCKET_FILES' as audit_section,
  COUNT(*) as total_files,
  COUNT(DISTINCT SPLIT_PART(name, '/', 1)) as unique_users,
  COUNT(DISTINCT SPLIT_PART(name, '/', 2)) as unique_properties,
  SUM(metadata->>'size')::bigint as total_size_bytes
FROM storage.objects 
WHERE bucket_id = 'properties';

-- =====================================================
-- SECCIÓN 4: VERIFICACIÓN DE ÍNDICES Y PERFORMANCE
-- =====================================================

-- 4.1 Verificar índices en tabla User
SELECT 
  'USER_TABLE_INDEXES' as audit_section,
  indexname,
  indexdef
FROM pg_indexes 
WHERE tablename = 'User'
  AND indexname LIKE '%user%'
ORDER BY indexname;

-- 4.2 Verificar índices en tabla properties
SELECT 
  'PROPERTIES_TABLE_INDEXES' as audit_section,
  indexname,
  indexdef
FROM pg_indexes 
WHERE tablename = 'properties'
  AND (indexname LIKE '%user_id%' OR indexname LIKE '%updated_at%')
ORDER BY indexname;

-- =====================================================
-- SECCIÓN 5: VERIFICACIÓN DE PERMISOS Y SEGURIDAD
-- =====================================================

-- 5.1 Verificar RLS habilitado en tablas críticas
SELECT 
  'RLS_STATUS' as audit_section,
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename IN ('User', 'properties', 'user_profiles')
ORDER BY tablename;

-- 5.2 Verificar políticas RLS en tabla User
SELECT 
  'USER_RLS_POLICIES' as audit_section,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'User'
ORDER BY policyname;

-- 5.3 Verificar políticas RLS en tabla properties
SELECT 
  'PROPERTIES_RLS_POLICIES' as audit_section,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'properties'
ORDER BY policyname;

-- =====================================================
-- SECCIÓN 6: VERIFICACIÓN DE CONSISTENCIA DE DATOS
-- =====================================================

-- 6.1 Verificar consistencia User vs user_profiles
SELECT 
  'USER_PROFILES_CONSISTENCY' as audit_section,
  COUNT(u.id) as users_in_user_table,
  COUNT(up.id) as users_in_profiles_table,
  COUNT(CASE WHEN u.profile_image IS NOT NULL AND up.avatar_path IS NOT NULL THEN 1 END) as both_have_avatar,
  COUNT(CASE WHEN u.profile_image IS NOT NULL AND up.avatar_path IS NULL THEN 1 END) as only_user_has_avatar,
  COUNT(CASE WHEN u.profile_image IS NULL AND up.avatar_path IS NOT NULL THEN 1 END) as only_profiles_has_avatar
FROM "User" u
FULL OUTER JOIN user_profiles up ON u.id = up.id;

-- 6.2 Verificar consistencia properties images
SELECT 
  'PROPERTIES_IMAGES_CONSISTENCY' as audit_section,
  COUNT(*) as total_properties,
  COUNT(CASE WHEN images_urls IS NOT NULL AND array_length(images_urls, 1) > 0 
              AND (images IS NULL OR images = '[]') THEN 1 END) as only_new_system,
  COUNT(CASE WHEN (images_urls IS NULL OR array_length(images_urls, 1) IS NULL)
              AND images IS NOT NULL AND images != '[]' THEN 1 END) as only_legacy_system,
  COUNT(CASE WHEN images_urls IS NOT NULL AND array_length(images_urls, 1) > 0
              AND images IS NOT NULL AND images != '[]' THEN 1 END) as both_systems
FROM properties;

-- =====================================================
-- SECCIÓN 7: VERIFICACIÓN DE CONFIGURACIÓN
-- =====================================================

-- 7.1 Verificar configuración de storage
SELECT 
  'STORAGE_CONFIG' as audit_section,
  name,
  value
FROM pg_settings 
WHERE name LIKE '%storage%' OR name LIKE '%bucket%'
ORDER BY name;

-- 7.2 Verificar extensiones necesarias
SELECT 
  'EXTENSIONS_STATUS' as audit_section,
  extname as extension_name,
  extversion as version
FROM pg_extension 
WHERE extname IN ('uuid-ossp', 'pgcrypto', 'http')
ORDER BY extname;

-- =====================================================
-- SECCIÓN 8: REPORTE FINAL Y RECOMENDACIONES
-- =====================================================

-- 8.1 Resumen de configuración
SELECT 
  'CONFIGURATION_SUMMARY' as audit_section,
  'avatars_bucket' as component,
  CASE WHEN EXISTS(SELECT 1 FROM storage.buckets WHERE id = 'avatars') 
       THEN 'CONFIGURED' ELSE 'MISSING' END as status;

SELECT 
  'CONFIGURATION_SUMMARY' as audit_section,
  'properties_bucket' as component,
  CASE WHEN EXISTS(SELECT 1 FROM storage.buckets WHERE id = 'properties') 
       THEN 'CONFIGURED' ELSE 'MISSING' END as status;

SELECT 
  'CONFIGURATION_SUMMARY' as audit_section,
  'user_table_profile_image' as component,
  CASE WHEN EXISTS(SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'User' AND column_name = 'profile_image') 
       THEN 'CONFIGURED' ELSE 'MISSING' END as status;

SELECT 
  'CONFIGURATION_SUMMARY' as audit_section,
  'properties_images_urls' as component,
  CASE WHEN EXISTS(SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'properties' AND column_name = 'images_urls') 
       THEN 'CONFIGURED' ELSE 'MISSING' END as status;

-- 8.2 Verificar conectividad básica
SELECT 
  'CONNECTIVITY_TEST' as audit_section,
  NOW() as current_timestamp,
  version() as postgres_version,
  current_database() as database_name,
  current_user as current_user;
