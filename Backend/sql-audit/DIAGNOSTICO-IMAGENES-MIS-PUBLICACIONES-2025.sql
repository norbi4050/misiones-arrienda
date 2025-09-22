-- DIAGNÓSTICO ESPECÍFICO: IMÁGENES EN MIS PUBLICACIONES
-- Fecha: 2025-01-03
-- Objetivo: Investigar por qué aparecen imágenes demo en lugar de imágenes reales

-- =====================================================
-- SECCIÓN 1: VERIFICACIÓN DE DATOS ESPECÍFICOS
-- =====================================================

-- 1.1 Verificar propiedades del usuario actual con imágenes
SELECT 
  'PROPIEDADES_USUARIO_ACTUAL' as seccion,
  id,
  title,
  status,
  images,
  images_urls,
  LENGTH(images) as images_length,
  CASE 
    WHEN images LIKE '%data:image%' THEN 'BASE64_DATA_URI'
    WHEN images LIKE '%supabase%' THEN 'SUPABASE_URL'
    WHEN images LIKE '%placeholder%' THEN 'PLACEHOLDER'
    WHEN images = '[]' OR images IS NULL THEN 'EMPTY'
    ELSE 'OTHER'
  END as images_type,
  CASE 
    WHEN images_urls IS NOT NULL AND array_length(images_urls, 1) > 0 THEN 'HAS_IMAGES_URLS'
    ELSE 'NO_IMAGES_URLS'
  END as images_urls_status,
  created_at,
  updated_at
FROM properties 
WHERE user_id = '6403f9d2-e846-4c70-87e0-e051127d9500'  -- Usuario de los logs
ORDER BY updated_at DESC;

-- 1.2 Verificar contenido específico de imágenes (primeros 100 caracteres)
SELECT 
  'CONTENIDO_IMAGENES' as seccion,
  id,
  title,
  LEFT(images, 100) as images_preview,
  CASE 
    WHEN images_urls IS NOT NULL THEN array_length(images_urls, 1)
    ELSE 0
  END as images_urls_count,
  CASE 
    WHEN images_urls IS NOT NULL AND array_length(images_urls, 1) > 0 
    THEN images_urls[1]
    ELSE NULL
  END as first_image_url
FROM properties 
WHERE user_id = '6403f9d2-e846-4c70-87e0-e051127d9500'
ORDER BY updated_at DESC;

-- 1.3 Verificar archivos en bucket property-images para este usuario
SELECT 
  'ARCHIVOS_BUCKET_USUARIO' as seccion,
  name as file_path,
  bucket_id,
  metadata->>'size' as file_size,
  metadata->>'mimetype' as mime_type,
  created_at,
  updated_at
FROM storage.objects 
WHERE bucket_id = 'property-images'
  AND name LIKE '6403f9d2-e846-4c70-87e0-e051127d9500/%'
ORDER BY created_at DESC;

-- =====================================================
-- SECCIÓN 2: ANÁLISIS DE DISCREPANCIAS
-- =====================================================

-- 2.1 Comparar datos entre campos images e images_urls
SELECT 
  'COMPARACION_CAMPOS_IMAGENES' as seccion,
  id,
  title,
  CASE 
    WHEN images IS NOT NULL AND images != '[]' AND LENGTH(images) > 10 THEN 'HAS_LEGACY_IMAGES'
    ELSE 'NO_LEGACY_IMAGES'
  END as legacy_status,
  CASE 
    WHEN images_urls IS NOT NULL AND array_length(images_urls, 1) > 0 THEN 'HAS_NEW_IMAGES'
    ELSE 'NO_NEW_IMAGES'
  END as new_status,
  CASE 
    WHEN images LIKE '%data:image%' THEN 'CONTAINS_BASE64'
    ELSE 'NO_BASE64'
  END as base64_check
FROM properties 
WHERE user_id = '6403f9d2-e846-4c70-87e0-e051127d9500';

-- 2.2 Verificar si hay archivos huérfanos en storage
SELECT 
  'ARCHIVOS_HUERFANOS' as seccion,
  so.name,
  so.bucket_id,
  so.metadata->>'size' as file_size,
  SPLIT_PART(so.name, '/', 2) as property_id_from_path,
  CASE 
    WHEN p.id IS NOT NULL THEN 'PROPERTY_EXISTS'
    ELSE 'ORPHANED_FILE'
  END as status
FROM storage.objects so
LEFT JOIN properties p ON SPLIT_PART(so.name, '/', 2) = p.id
WHERE so.bucket_id = 'property-images'
  AND so.name LIKE '6403f9d2-e846-4c70-87e0-e051127d9500/%';

-- =====================================================
-- SECCIÓN 3: VERIFICACIÓN DE BUCKET PROPERTY-IMAGES
-- =====================================================

-- 3.1 Verificar configuración del bucket property-images
SELECT 
  'BUCKET_PROPERTY_IMAGES_CONFIG' as seccion,
  id as bucket_name,
  name,
  public,
  file_size_limit,
  allowed_mime_types,
  created_at,
  updated_at
FROM storage.buckets 
WHERE id = 'property-images';

-- 3.2 Verificar políticas RLS para bucket property-images
SELECT 
  'PROPERTY_IMAGES_RLS_POLICIES' as seccion,
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

-- =====================================================
-- SECCIÓN 4: VERIFICACIÓN DE MIGRACIÓN DE IMÁGENES
-- =====================================================

-- 4.1 Verificar si las imágenes fueron migradas correctamente
SELECT 
  'ESTADO_MIGRACION_IMAGENES' as seccion,
  COUNT(*) as total_properties,
  COUNT(CASE WHEN images LIKE '%data:image%' THEN 1 END) as properties_with_base64,
  COUNT(CASE WHEN images_urls IS NOT NULL AND array_length(images_urls, 1) > 0 THEN 1 END) as properties_with_storage_keys,
  COUNT(CASE WHEN images LIKE '%data:image%' AND (images_urls IS NULL OR array_length(images_urls, 1) = 0) THEN 1 END) as base64_not_migrated
FROM properties;

-- 4.2 Propiedades específicas que necesitan migración
SELECT 
  'PROPIEDADES_NECESITAN_MIGRACION' as seccion,
  id,
  title,
  user_id,
  LEFT(images, 50) as images_preview,
  CASE 
    WHEN images_urls IS NOT NULL THEN array_length(images_urls, 1)
    ELSE 0
  END as images_urls_count
FROM properties 
WHERE images LIKE '%data:image%'
  AND (images_urls IS NULL OR array_length(images_urls, 1) = 0)
ORDER BY updated_at DESC
LIMIT 10;

-- =====================================================
-- SECCIÓN 5: SCRIPTS DE CORRECCIÓN SUGERIDOS
-- =====================================================

-- 5.1 Script para migrar imágenes base64 a storage (SOLO MOSTRAR, NO EJECUTAR)
/*
-- IMPORTANTE: Este script debe ejecutarse con cuidado
-- Migra imágenes base64 a storage y actualiza images_urls

DO $$
DECLARE
    prop_record RECORD;
    base64_data TEXT;
    file_extension TEXT;
    storage_path TEXT;
    upload_result JSONB;
BEGIN
    FOR prop_record IN 
        SELECT id, user_id, images 
        FROM properties 
        WHERE images LIKE '%data:image%'
          AND (images_urls IS NULL OR array_length(images_urls, 1) = 0)
    LOOP
        -- Extraer datos base64
        base64_data := SUBSTRING(prop_record.images FROM 'data:image/[^;]+;base64,(.+)');
        
        -- Determinar extensión
        file_extension := CASE 
            WHEN prop_record.images LIKE '%data:image/jpeg%' THEN '.jpg'
            WHEN prop_record.images LIKE '%data:image/png%' THEN '.png'
            WHEN prop_record.images LIKE '%data:image/webp%' THEN '.webp'
            ELSE '.jpg'
        END;
        
        -- Crear path de storage
        storage_path := prop_record.user_id || '/' || prop_record.id || '/image_1' || file_extension;
        
        -- Aquí iría la lógica de upload a storage
        -- (Requiere función personalizada o API call)
        
        RAISE NOTICE 'Propiedad % necesita migración: %', prop_record.id, storage_path;
    END LOOP;
END $$;
*/

-- 5.2 Script para limpiar imágenes base64 problemáticas
/*
-- CUIDADO: Solo ejecutar después de migrar a storage
UPDATE properties 
SET images = '[]'
WHERE images LIKE '%data:image%'
  AND images_urls IS NOT NULL 
  AND array_length(images_urls, 1) > 0;
*/

-- =====================================================
-- SECCIÓN 6: VERIFICACIÓN DE BUCKET PROPERTY-IMAGES
-- =====================================================

-- 6.1 Verificar si existe el bucket correcto
SELECT 
  'VERIFICACION_BUCKET' as seccion,
  CASE 
    WHEN EXISTS(SELECT 1 FROM storage.buckets WHERE id = 'property-images') 
    THEN 'BUCKET_PROPERTY_IMAGES_EXISTS'
    ELSE 'BUCKET_PROPERTY_IMAGES_MISSING'
  END as bucket_status,
  CASE 
    WHEN EXISTS(SELECT 1 FROM storage.buckets WHERE id = 'properties') 
    THEN 'BUCKET_PROPERTIES_EXISTS'
    ELSE 'BUCKET_PROPERTIES_MISSING'
  END as old_bucket_status;

-- 6.2 Listar todos los buckets disponibles
SELECT 
  'BUCKETS_DISPONIBLES' as seccion,
  id,
  name,
  public,
  created_at
FROM storage.buckets
ORDER BY created_at;

-- =====================================================
-- SECCIÓN 7: RECOMENDACIONES ESPECÍFICAS
-- =====================================================

-- 7.1 Resumen del problema identificado
SELECT 
  'RESUMEN_PROBLEMA' as seccion,
  'Las propiedades tienen imágenes almacenadas como data URIs base64' as problema,
  'El sistema de signed URLs no puede procesar data URIs' as causa,
  'Se necesita migrar las imágenes base64 a Supabase Storage' as solucion;

-- 7.2 Próximos pasos recomendados
SELECT 
  'PROXIMOS_PASOS' as seccion,
  '1. Crear script de migración para convertir base64 a archivos en storage' as paso_1,
  '2. Actualizar campo images_urls con las nuevas keys de storage' as paso_2,
  '3. Limpiar campo images legacy después de verificar migración' as paso_3,
  '4. Verificar que el frontend muestre las imágenes correctamente' as paso_4;
