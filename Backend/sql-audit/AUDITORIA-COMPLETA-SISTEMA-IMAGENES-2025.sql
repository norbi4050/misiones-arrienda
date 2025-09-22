-- AUDITORÍA COMPLETA: SISTEMA DE IMÁGENES
-- Fecha: 2025-01-03
-- Objetivo: Investigar exhaustivamente por qué las imágenes reales no se muestran

-- =====================================================
-- SECCIÓN 1: VERIFICACIÓN DE CONFIGURACIÓN SUPABASE
-- =====================================================

-- 1.1 Verificar buckets de imágenes
SELECT 
  'BUCKETS_IMAGENES' as seccion,
  id as bucket_id,
  name as bucket_name,
  public as is_public,
  file_size_limit,
  allowed_mime_types,
  created_at,
  updated_at
FROM storage.buckets 
WHERE id IN ('property-images', 'properties', 'avatars')
ORDER BY created_at;

-- 1.2 Verificar políticas RLS para bucket property-images
SELECT 
  'RLS_PROPERTY_IMAGES' as seccion,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND (policyname LIKE '%property%' OR policyname LIKE '%image%')
ORDER BY policyname;

-- 1.3 Verificar extensiones necesarias para storage
SELECT 
  'EXTENSIONES_STORAGE' as seccion,
  extname as extension_name,
  extversion as version,
  'REQUIRED_FOR_STORAGE' as purpose
FROM pg_extension 
WHERE extname IN ('uuid-ossp', 'pgcrypto', 'http')
ORDER BY extname;

-- =====================================================
-- SECCIÓN 2: VERIFICACIÓN DE DATOS EN PROPIEDADES
-- =====================================================

-- 2.1 Estado completo de todas las propiedades
SELECT 
  'TODAS_PROPIEDADES' as seccion,
  id,
  title,
  user_id,
  status,
  is_active,
  images,
  images_urls,
  CASE 
    WHEN images IS NULL THEN 'NULL'
    WHEN images = '[]' THEN 'EMPTY_ARRAY'
    WHEN images LIKE '%data:image%' THEN 'BASE64_DATA'
    WHEN images LIKE '%supabase%' THEN 'SUPABASE_URL'
    WHEN images LIKE '%placeholder%' THEN 'PLACEHOLDER'
    ELSE 'OTHER'
  END as images_type,
  CASE 
    WHEN images_urls IS NULL THEN 'NULL'
    WHEN array_length(images_urls, 1) IS NULL THEN 'EMPTY_ARRAY'
    WHEN array_length(images_urls, 1) > 0 THEN 'HAS_URLS'
    ELSE 'UNKNOWN'
  END as images_urls_status,
  array_length(images_urls, 1) as images_urls_count,
  created_at,
  updated_at
FROM properties 
ORDER BY updated_at DESC;

-- 2.2 Propiedades específicas del usuario problema
SELECT 
  'PROPIEDADES_USUARIO_PROBLEMA' as seccion,
  id,
  title,
  status,
  is_active,
  images_urls,
  array_length(images_urls, 1) as images_count,
  CASE 
    WHEN images_urls IS NOT NULL AND array_length(images_urls, 1) > 0 
    THEN images_urls[1]
    ELSE NULL
  END as first_image_url,
  created_at,
  updated_at
FROM properties 
WHERE user_id = '6403f9d2-e846-4c70-87e0-e051127d9500'
ORDER BY updated_at DESC;

-- =====================================================
-- SECCIÓN 3: VERIFICACIÓN DE ARCHIVOS EN STORAGE
-- =====================================================

-- 3.1 Todos los archivos en bucket property-images
SELECT 
  'ARCHIVOS_PROPERTY_IMAGES' as seccion,
  name as file_path,
  SPLIT_PART(name, '/', 1) as user_id_from_path,
  SPLIT_PART(name, '/', 2) as property_id_from_path,
  SPLIT_PART(name, '/', 3) as filename,
  bucket_id,
  metadata->>'size' as file_size,
  metadata->>'mimetype' as mime_type,
  metadata->>'cacheControl' as cache_control,
  created_at,
  updated_at,
  last_accessed_at
FROM storage.objects 
WHERE bucket_id = 'property-images'
ORDER BY created_at DESC;

-- 3.2 Verificar archivos del usuario específico
SELECT 
  'ARCHIVOS_USUARIO_ESPECIFICO' as seccion,
  name as file_path,
  SPLIT_PART(name, '/', 2) as property_id_from_path,
  SPLIT_PART(name, '/', 3) as filename,
  metadata->>'size' as file_size,
  metadata->>'mimetype' as mime_type,
  created_at,
  CASE 
    WHEN EXISTS(
      SELECT 1 FROM properties p 
      WHERE p.id = SPLIT_PART(objects.name, '/', 2)
        AND p.images_urls @> ARRAY[objects.name]
    ) THEN 'CONNECTED'
    WHEN EXISTS(
      SELECT 1 FROM properties p 
      WHERE p.id = SPLIT_PART(objects.name, '/', 2)
    ) THEN 'PROPERTY_EXISTS_NOT_CONNECTED'
    ELSE 'ORPHANED'
  END as connection_status
FROM storage.objects 
WHERE bucket_id = 'property-images'
  AND name LIKE '6403f9d2-e846-4c70-87e0-e051127d9500/%'
ORDER BY created_at DESC;

-- =====================================================
-- SECCIÓN 4: VERIFICACIÓN DE CONSISTENCIA
-- =====================================================

-- 4.1 Propiedades con images_urls pero sin archivos en storage
SELECT 
  'PROPIEDADES_SIN_ARCHIVOS' as seccion,
  p.id,
  p.title,
  p.images_urls,
  p.images_urls[1] as first_url,
  CASE 
    WHEN EXISTS(
      SELECT 1 FROM storage.objects so 
      WHERE so.bucket_id = 'property-images' 
        AND so.name = p.images_urls[1]
    ) THEN 'FILE_EXISTS'
    ELSE 'FILE_MISSING'
  END as file_status
FROM properties p
WHERE p.images_urls IS NOT NULL 
  AND array_length(p.images_urls, 1) > 0;

-- 4.2 Archivos en storage sin propiedades asociadas
SELECT 
  'ARCHIVOS_SIN_PROPIEDADES' as seccion,
  so.name as file_path,
  SPLIT_PART(so.name, '/', 2) as property_id_from_path,
  so.metadata->>'size' as file_size,
  CASE 
    WHEN p.id IS NOT NULL THEN 'PROPERTY_EXISTS'
    ELSE 'PROPERTY_MISSING'
  END as property_status,
  CASE 
    WHEN p.id IS NOT NULL AND p.images_urls @> ARRAY[so.name] THEN 'CONNECTED'
    WHEN p.id IS NOT NULL THEN 'NOT_CONNECTED'
    ELSE 'NO_PROPERTY'
  END as connection_status
FROM storage.objects so
LEFT JOIN properties p ON SPLIT_PART(so.name, '/', 2) = p.id
WHERE so.bucket_id = 'property-images';

-- =====================================================
-- SECCIÓN 5: VERIFICACIÓN DE PERMISOS Y ACCESO
-- =====================================================

-- 5.1 Verificar permisos de lectura pública
SELECT 
  'PERMISOS_LECTURA_PUBLICA' as seccion,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND cmd = 'SELECT'
  AND (qual LIKE '%property-images%' OR policyname LIKE '%public%')
ORDER BY policyname;

-- 5.2 Verificar configuración de bucket público/privado
SELECT 
  'CONFIGURACION_ACCESO_BUCKET' as seccion,
  id as bucket_id,
  public as is_public_bucket,
  CASE 
    WHEN public = true THEN 'PUBLIC_ACCESS'
    ELSE 'PRIVATE_ACCESS_NEEDS_SIGNED_URLS'
  END as access_type,
  file_size_limit / 1024 / 1024 as size_limit_mb
FROM storage.buckets 
WHERE id = 'property-images';

-- =====================================================
-- SECCIÓN 6: VERIFICACIÓN DE SIGNED URLS
-- =====================================================

-- 6.1 Verificar configuración para signed URLs
SELECT 
  'CONFIG_SIGNED_URLS' as seccion,
  name as setting_name,
  setting as setting_value,
  'REQUIRED_FOR_SIGNED_URLS' as purpose
FROM pg_settings 
WHERE name IN (
  'shared_preload_libraries',
  'max_connections',
  'timezone'
)
ORDER BY name;

-- 6.2 Verificar funciones de storage disponibles
SELECT 
  'FUNCIONES_STORAGE' as seccion,
  routine_name as function_name,
  routine_type,
  routine_schema,
  'STORAGE_FUNCTION' as category
FROM information_schema.routines 
WHERE routine_schema = 'storage'
  AND routine_name LIKE '%sign%'
ORDER BY routine_name;

-- =====================================================
-- SECCIÓN 7: VERIFICACIÓN DE VARIABLES DE ENTORNO
-- =====================================================

-- 7.1 Verificar configuración de autenticación
SELECT 
  'AUTH_CONFIG' as seccion,
  'JWT_SECRET' as config_key,
  CASE 
    WHEN current_setting('app.settings.jwt_secret', true) IS NOT NULL 
    THEN 'CONFIGURED'
    ELSE 'NOT_CONFIGURED'
  END as status
UNION ALL
SELECT 
  'AUTH_CONFIG' as seccion,
  'SERVICE_ROLE' as config_key,
  CASE 
    WHEN current_setting('app.settings.service_role_key', true) IS NOT NULL 
    THEN 'CONFIGURED'
    ELSE 'NOT_CONFIGURED'
  END as status;

-- =====================================================
-- SECCIÓN 8: ANÁLISIS DE RENDIMIENTO
-- =====================================================

-- 8.1 Verificar índices en tabla properties
SELECT 
  'INDICES_PROPERTIES' as seccion,
  indexname,
  indexdef,
  'PERFORMANCE_INDEX' as category
FROM pg_indexes 
WHERE tablename = 'properties'
  AND (indexname LIKE '%user_id%' OR indexname LIKE '%status%' OR indexname LIKE '%active%')
ORDER BY indexname;

-- 8.2 Estadísticas de uso de storage
SELECT 
  'ESTADISTICAS_STORAGE' as seccion,
  bucket_id,
  COUNT(*) as total_files,
  SUM((metadata->>'size')::bigint) as total_size_bytes,
  AVG((metadata->>'size')::bigint) as avg_file_size,
  MIN(created_at) as oldest_file,
  MAX(created_at) as newest_file
FROM storage.objects 
WHERE bucket_id IN ('property-images', 'properties', 'avatars')
GROUP BY bucket_id
ORDER BY bucket_id;

-- =====================================================
-- SECCIÓN 9: VERIFICACIÓN DE INTEGRIDAD
-- =====================================================

-- 9.1 Verificar integridad referencial
SELECT 
  'INTEGRIDAD_REFERENCIAL' as seccion,
  COUNT(DISTINCT p.id) as total_properties,
  COUNT(DISTINCT CASE WHEN p.images_urls IS NOT NULL AND array_length(p.images_urls, 1) > 0 THEN p.id END) as properties_with_images_urls,
  COUNT(DISTINCT so.name) as total_storage_files,
  COUNT(DISTINCT CASE WHEN p.id IS NOT NULL THEN so.name END) as files_with_properties
FROM properties p
FULL OUTER JOIN storage.objects so ON so.bucket_id = 'property-images' 
  AND SPLIT_PART(so.name, '/', 2) = p.id;

-- 9.2 Verificar propiedades con imágenes pero archivos faltantes
SELECT 
  'PROPIEDADES_ARCHIVOS_FALTANTES' as seccion,
  p.id,
  p.title,
  p.images_urls[1] as expected_file_path,
  CASE 
    WHEN so.name IS NOT NULL THEN 'FILE_EXISTS'
    ELSE 'FILE_MISSING'
  END as file_status
FROM properties p
LEFT JOIN storage.objects so ON so.bucket_id = 'property-images' 
  AND so.name = p.images_urls[1]
WHERE p.images_urls IS NOT NULL 
  AND array_length(p.images_urls, 1) > 0;

-- =====================================================
-- SECCIÓN 10: VERIFICACIÓN DE ACCESO PÚBLICO
-- =====================================================

-- 10.1 Verificar si las imágenes son accesibles públicamente
SELECT 
  'ACCESO_PUBLICO_IMAGENES' as seccion,
  b.id as bucket_id,
  b.public as bucket_is_public,
  COUNT(pol.policyname) as public_read_policies,
  CASE 
    WHEN b.public = true THEN 'DIRECT_PUBLIC_ACCESS'
    WHEN COUNT(pol.policyname) > 0 THEN 'RLS_PUBLIC_ACCESS'
    ELSE 'PRIVATE_ACCESS_ONLY'
  END as access_method
FROM storage.buckets b
LEFT JOIN pg_policies pol ON pol.schemaname = 'storage' 
  AND pol.tablename = 'objects'
  AND pol.cmd = 'SELECT'
  AND pol.qual LIKE '%' || b.id || '%'
  AND (pol.roles @> ARRAY['public'] OR pol.roles @> ARRAY['anon'])
WHERE b.id = 'property-images'
GROUP BY b.id, b.public;

-- =====================================================
-- SECCIÓN 11: VERIFICACIÓN DE CREDENCIALES
-- =====================================================

-- 11.1 Verificar configuración de autenticación actual
SELECT 
  'AUTH_CURRENT_CONFIG' as seccion,
  current_user as current_db_user,
  session_user as session_db_user,
  current_database() as database_name,
  version() as postgres_version,
  NOW() as current_timestamp;

-- 11.2 Verificar roles disponibles
SELECT 
  'ROLES_DISPONIBLES' as seccion,
  rolname as role_name,
  rolsuper as is_superuser,
  rolcreaterole as can_create_roles,
  rolcreatedb as can_create_db,
  'DATABASE_ROLE' as category
FROM pg_roles 
WHERE rolname IN ('postgres', 'authenticated', 'anon', 'service_role')
ORDER BY rolname;

-- =====================================================
-- SECCIÓN 12: VERIFICACIÓN DE LOGS Y ERRORES
-- =====================================================

-- 12.1 Verificar configuración de logging
SELECT 
  'LOGGING_CONFIG' as seccion,
  name as setting_name,
  setting as setting_value,
  'LOG_SETTING' as category
FROM pg_settings 
WHERE name IN (
  'log_statement',
  'log_min_duration_statement',
  'log_line_prefix'
)
ORDER BY name;

-- =====================================================
-- SECCIÓN 13: VERIFICACIÓN DE CONECTIVIDAD
-- =====================================================

-- 13.1 Test de conectividad básica
SELECT 
  'CONECTIVIDAD_TEST' as seccion,
  'DATABASE_CONNECTION' as test_type,
  'SUCCESS' as result,
  NOW() as test_timestamp;

-- 13.2 Verificar que podemos acceder a storage.objects
SELECT 
  'STORAGE_ACCESS_TEST' as seccion,
  COUNT(*) as total_objects_accessible,
  COUNT(DISTINCT bucket_id) as buckets_accessible,
  'STORAGE_READ_ACCESS' as test_type
FROM storage.objects 
LIMIT 1;

-- =====================================================
-- SECCIÓN 14: RECOMENDACIONES ESPECÍFICAS
-- =====================================================

-- 14.1 Identificar problemas potenciales
SELECT 
  'PROBLEMAS_IDENTIFICADOS' as seccion,
  CASE 
    WHEN NOT EXISTS(SELECT 1 FROM storage.buckets WHERE id = 'property-images' AND public = true)
    THEN 'BUCKET_PRIVADO_NECESITA_SIGNED_URLS'
    ELSE 'BUCKET_PUBLICO_OK'
  END as bucket_issue,
  CASE 
    WHEN NOT EXISTS(
      SELECT 1 FROM pg_policies 
      WHERE schemaname = 'storage' 
        AND tablename = 'objects'
        AND cmd = 'SELECT'
        AND qual LIKE '%property-images%'
        AND roles @> ARRAY['public']
    ) AND NOT EXISTS(SELECT 1 FROM storage.buckets WHERE id = 'property-images' AND public = true)
    THEN 'SIN_ACCESO_PUBLICO_NI_POLITICAS'
    ELSE 'ACCESO_CONFIGURADO'
  END as access_issue;

-- 14.2 Sugerencias de corrección
SELECT 
  'SUGERENCIAS_CORRECCION' as seccion,
  '1. Verificar SUPABASE_SERVICE_ROLE_KEY en variables de entorno' as sugerencia_1,
  '2. Considerar hacer bucket property-images público para simplificar acceso' as sugerencia_2,
  '3. Verificar que generateSignedUrl funciona correctamente' as sugerencia_3,
  '4. Revisar políticas RLS para acceso público a imágenes' as sugerencia_4;

-- =====================================================
-- SECCIÓN 15: VERIFICACIÓN FINAL
-- =====================================================

-- 15.1 Resumen ejecutivo
SELECT 
  'RESUMEN_EJECUTIVO' as seccion,
  (SELECT COUNT(*) FROM properties WHERE images_urls IS NOT NULL AND array_length(images_urls, 1) > 0) as propiedades_con_imagenes,
  (SELECT COUNT(*) FROM storage.objects WHERE bucket_id = 'property-images') as archivos_en_storage,
  (SELECT public FROM storage.buckets WHERE id = 'property-images') as bucket_es_publico,
  (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND cmd = 'SELECT' AND qual LIKE '%property-images%') as politicas_lectura;
