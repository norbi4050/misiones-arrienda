-- SOLUCIÓN FINAL: RECONECTAR IMAGEN REAL A PROPIEDAD
-- Fecha: 2025-01-03
-- Objetivo: Conectar la imagen huérfana a la propiedad más reciente

-- =====================================================
-- PASO 1: VERIFICAR ESTADO ACTUAL
-- =====================================================

-- Confirmar que tenemos la imagen huérfana
SELECT 
  'IMAGEN_HUERFANA_CONFIRMADA' as paso,
  name as file_path,
  metadata->>'size' as file_size,
  metadata->>'mimetype' as mime_type,
  created_at
FROM storage.objects 
WHERE bucket_id = 'property-images'
  AND name = '6403f9d2-e846-4c70-87e0-e051127d9500/4d4dc702-953a-41b9-b875-8c1eaa3d8714/00-cover.jpg.jpg';

-- Confirmar propiedades sin imágenes
SELECT 
  'PROPIEDADES_SIN_IMAGENES_CONFIRMADAS' as paso,
  id,
  title,
  status,
  updated_at
FROM properties 
WHERE user_id = '6403f9d2-e846-4c70-87e0-e051127d9500'
  AND (images_urls IS NULL OR array_length(images_urls, 1) = 0)
ORDER BY updated_at DESC;

-- =====================================================
-- PASO 2: RECONECTAR IMAGEN A PROPIEDAD MÁS RECIENTE
-- =====================================================

-- Conectar la imagen real a la propiedad "asdasdffasd" (la más reciente y PUBLISHED)
UPDATE properties 
SET images_urls = ARRAY[
  '6403f9d2-e846-4c70-87e0-e051127d9500/4d4dc702-953a-41b9-b875-8c1eaa3d8714/00-cover.jpg.jpg'
]
WHERE id = '89ecf166-8f87-4174-a0d4-42052166f2dd'
  AND user_id = '6403f9d2-e846-4c70-87e0-e051127d9500';

-- =====================================================
-- PASO 3: VERIFICAR RECONEXIÓN EXITOSA
-- =====================================================

-- Verificar que la imagen se conectó correctamente
SELECT 
  'RECONEXION_EXITOSA' as paso,
  id,
  title,
  status,
  images_urls,
  array_length(images_urls, 1) as images_count,
  images_urls[1] as first_image_path
FROM properties 
WHERE id = '89ecf166-8f87-4174-a0d4-42052166f2dd';

-- =====================================================
-- PASO 4: VERIFICAR QUE EL ARCHIVO EXISTE EN STORAGE
-- =====================================================

-- Confirmar que el archivo referenciado existe
SELECT 
  'ARCHIVO_EXISTE_EN_STORAGE' as paso,
  name,
  bucket_id,
  metadata->>'size' as file_size,
  metadata->>'mimetype' as mime_type,
  'CONNECTED_TO_PROPERTY' as new_status
FROM storage.objects 
WHERE bucket_id = 'property-images'
  AND name = '6403f9d2-e846-4c70-87e0-e051127d9500/4d4dc702-953a-41b9-b875-8c1eaa3d8714/00-cover.jpg.jpg';

-- =====================================================
-- PASO 5: VERIFICACIÓN FINAL COMPLETA
-- =====================================================

-- Estado final de todas las propiedades del usuario
SELECT 
  'ESTADO_FINAL_PROPIEDADES' as paso,
  id,
  title,
  status,
  CASE 
    WHEN images_urls IS NOT NULL AND array_length(images_urls, 1) > 0 THEN 'HAS_IMAGES'
    ELSE 'NO_IMAGES'
  END as image_status,
  array_length(images_urls, 1) as images_count,
  updated_at
FROM properties 
WHERE user_id = '6403f9d2-e846-4c70-87e0-e051127d9500'
ORDER BY updated_at DESC;

-- Verificar que no quedan archivos huérfanos
SELECT 
  'ARCHIVOS_HUERFANOS_RESTANTES' as paso,
  COUNT(*) as archivos_huerfanos
FROM storage.objects so
WHERE so.bucket_id = 'property-images'
  AND so.name LIKE '6403f9d2-e846-4c70-87e0-e051127d9500/%'
  AND NOT EXISTS (
    SELECT 1 FROM properties p 
    WHERE p.images_urls @> ARRAY[so.name]
  );

-- =====================================================
-- RESULTADO ESPERADO
-- =====================================================

-- Después de ejecutar este script:
-- 1. La propiedad "asdasdffasd" tendrá la imagen real conectada
-- 2. Se mostrará la imagen real en lugar de "Sin imágenes"
-- 3. Las otras 2 propiedades seguirán mostrando "Sin imágenes" (correcto)
-- 4. No habrá más archivos huérfanos

SELECT 'SCRIPT_COMPLETADO' as resultado, 'Imagen real reconectada exitosamente' as mensaje;
