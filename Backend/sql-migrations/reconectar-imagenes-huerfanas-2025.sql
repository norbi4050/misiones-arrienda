-- RECONECTAR IMÁGENES HUÉRFANAS A PROPIEDADES
-- Fecha: 2025-01-03
-- Objetivo: Conectar archivos existentes en storage con sus propiedades

-- =====================================================
-- PASO 1: IDENTIFICAR ARCHIVOS HUÉRFANOS
-- =====================================================

-- Verificar archivos huérfanos en storage
SELECT 
  'ARCHIVOS_HUERFANOS_IDENTIFICADOS' as verificacion,
  so.name as file_path,
  SPLIT_PART(so.name, '/', 1) as user_id_from_path,
  SPLIT_PART(so.name, '/', 2) as property_id_from_path,
  SPLIT_PART(so.name, '/', 3) as filename,
  so.metadata->>'size' as file_size,
  so.metadata->>'mimetype' as mime_type,
  CASE 
    WHEN p.id IS NOT NULL THEN 'PROPERTY_EXISTS'
    ELSE 'ORPHANED_FILE'
  END as status,
  p.title as property_title,
  p.images_urls as current_images_urls
FROM storage.objects so
LEFT JOIN properties p ON SPLIT_PART(so.name, '/', 2) = p.id
WHERE so.bucket_id = 'property-images'
  AND so.name LIKE '6403f9d2-e846-4c70-87e0-e051127d9500/%'
ORDER BY so.created_at DESC;

-- =====================================================
-- PASO 2: BUSCAR PROPIEDADES SIN IMÁGENES
-- =====================================================

-- Propiedades del usuario que podrían necesitar estas imágenes
SELECT 
  'PROPIEDADES_SIN_IMAGENES' as verificacion,
  id,
  title,
  status,
  created_at,
  updated_at,
  CASE 
    WHEN images_urls IS NULL THEN 'NULL'
    WHEN array_length(images_urls, 1) = 0 THEN 'EMPTY_ARRAY'
    ELSE 'HAS_IMAGES'
  END as images_status
FROM properties 
WHERE user_id = '6403f9d2-e846-4c70-87e0-e051127d9500'
  AND (images_urls IS NULL OR array_length(images_urls, 1) = 0)
ORDER BY updated_at DESC;

-- =====================================================
-- PASO 3: INTENTAR RECONECTAR AUTOMÁTICAMENTE
-- =====================================================

-- Buscar coincidencias por proximidad temporal
WITH archivos_storage AS (
  SELECT 
    SPLIT_PART(name, '/', 2) as property_id_from_path,
    SPLIT_PART(name, '/', 1) as user_id_from_path,
    SPLIT_PART(name, '/', 3) as filename,
    name as full_path,
    created_at as file_created_at
  FROM storage.objects 
  WHERE bucket_id = 'property-images'
    AND name LIKE '6403f9d2-e846-4c70-87e0-e051127d9500/%'
),
propiedades_sin_imagenes AS (
  SELECT 
    id,
    title,
    created_at as prop_created_at,
    updated_at as prop_updated_at
  FROM properties 
  WHERE user_id = '6403f9d2-e846-4c70-87e0-e051127d9500'
    AND (images_urls IS NULL OR array_length(images_urls, 1) = 0)
)
SELECT 
  'POSIBLES_COINCIDENCIAS' as verificacion,
  p.id as property_id,
  p.title,
  a.property_id_from_path,
  a.full_path,
  a.filename,
  p.prop_created_at,
  a.file_created_at,
  ABS(EXTRACT(EPOCH FROM (p.prop_created_at - a.file_created_at))) as time_diff_seconds,
  CASE 
    WHEN p.id::text = a.property_id_from_path THEN 'EXACT_MATCH'
    WHEN ABS(EXTRACT(EPOCH FROM (p.prop_created_at - a.file_created_at))) < 3600 THEN 'TIME_MATCH'
    ELSE 'NO_MATCH'
  END as match_type
FROM propiedades_sin_imagenes p
CROSS JOIN archivos_storage a
ORDER BY time_diff_seconds ASC;

-- =====================================================
-- PASO 4: SCRIPT DE RECONEXIÓN
-- =====================================================

-- OPCIÓN A: Reconectar por ID exacto (si hay coincidencia)
/*
UPDATE properties 
SET images_urls = ARRAY[
  '6403f9d2-e846-4c70-87e0-e051127d9500/4d4dc702-953a-41b9-b875-8c1eaa3d8714/00-cover.jpg.jpg'
]
WHERE id = '4d4dc702-953a-41b9-b875-8c1eaa3d8714'
  AND user_id = '6403f9d2-e846-4c70-87e0-e051127d9500';
*/

-- OPCIÓN B: Reconectar a la propiedad más reciente (si no hay coincidencia exacta)
/*
UPDATE properties 
SET images_urls = ARRAY[
  '6403f9d2-e846-4c70-87e0-e051127d9500/4d4dc702-953a-41b9-b875-8c1eaa3d8714/00-cover.jpg.jpg'
]
WHERE id = (
  SELECT id 
  FROM properties 
  WHERE user_id = '6403f9d2-e846-4c70-87e0-e051127d9500'
    AND (images_urls IS NULL OR array_length(images_urls, 1) = 0)
  ORDER BY updated_at DESC 
  LIMIT 1
);
*/

-- =====================================================
-- PASO 5: VERIFICACIÓN DESPUÉS DE RECONEXIÓN
-- =====================================================

-- Verificar que la reconexión funcionó
SELECT 
  'VERIFICACION_RECONEXION' as verificacion,
  id,
  title,
  images_urls,
  array_length(images_urls, 1) as images_count,
  updated_at
FROM properties 
WHERE user_id = '6403f9d2-e846-4c70-87e0-e051127d9500'
  AND images_urls IS NOT NULL 
  AND array_length(images_urls, 1) > 0;

-- =====================================================
-- PASO 6: SCRIPT PARA CREAR NUEVAS IMÁGENES SI ES NECESARIO
-- =====================================================

-- Si las propiedades necesitan nuevas imágenes, crear keys de storage válidas
-- basadas en archivos existentes o preparar para nuevas subidas

SELECT 
  'PREPARAR_NUEVAS_IMAGENES' as verificacion,
  id,
  title,
  user_id::text || '/' || id::text || '/image_1.jpg' as suggested_storage_key
FROM properties 
WHERE user_id = '6403f9d2-e846-4c70-87e0-e051127d9500'
  AND (images_urls IS NULL OR array_length(images_urls, 1) = 0);

-- =====================================================
-- PASO 7: LIMPIEZA DE ARCHIVOS HUÉRFANOS (OPCIONAL)
-- =====================================================

-- Listar archivos que no tienen propiedad asociada para posible limpieza
SELECT 
  'ARCHIVOS_PARA_LIMPIEZA' as verificacion,
  so.name,
  so.bucket_id,
  so.metadata->>'size' as file_size,
  so.created_at,
  'ORPHANED - Consider cleanup' as recommendation
FROM storage.objects so
WHERE so.bucket_id = 'property-images'
  AND NOT EXISTS (
    SELECT 1 FROM properties p 
    WHERE p.id = SPLIT_PART(so.name, '/', 2)
  );
