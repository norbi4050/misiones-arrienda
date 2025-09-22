-- MIGRACIÓN: CONVERTIR IMÁGENES BASE64 A SUPABASE STORAGE
-- Fecha: 2025-01-03
-- Objetivo: Migrar imágenes base64 a storage y actualizar references

-- =====================================================
-- PASO 1: VERIFICAR ESTADO ACTUAL
-- =====================================================

-- Verificar propiedades con imágenes base64
SELECT 
  'PROPIEDADES_CON_BASE64' as verificacion,
  COUNT(*) as total,
  COUNT(CASE WHEN images LIKE '%data:image/jpeg%' THEN 1 END) as jpeg_count,
  COUNT(CASE WHEN images LIKE '%data:image/png%' THEN 1 END) as png_count,
  COUNT(CASE WHEN images LIKE '%data:image/webp%' THEN 1 END) as webp_count
FROM properties 
WHERE images LIKE '%data:image%';

-- Listar propiedades específicas que necesitan migración
SELECT 
  'PROPIEDADES_NECESITAN_MIGRACION' as verificacion,
  id,
  title,
  user_id,
  LEFT(images, 50) as images_preview,
  CASE 
    WHEN images LIKE '%data:image/jpeg%' THEN 'JPEG'
    WHEN images LIKE '%data:image/png%' THEN 'PNG'
    WHEN images LIKE '%data:image/webp%' THEN 'WEBP'
    ELSE 'UNKNOWN'
  END as image_format,
  LENGTH(images) as data_size
FROM properties 
WHERE images LIKE '%data:image%'
ORDER BY updated_at DESC;

-- =====================================================
-- PASO 2: VERIFICAR BUCKET PROPERTY-IMAGES
-- =====================================================

-- Verificar que existe el bucket correcto
SELECT 
  'BUCKET_VERIFICATION' as verificacion,
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets 
WHERE id = 'property-images';

-- Si no existe, crear el bucket (ejecutar solo si es necesario)
/*
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'property-images',
  'property-images',
  false,
  52428800, -- 50MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;
*/

-- =====================================================
-- PASO 3: CREAR FUNCIÓN PARA MIGRACIÓN
-- =====================================================

-- Función para extraer extensión de data URI
CREATE OR REPLACE FUNCTION extract_image_extension(data_uri TEXT)
RETURNS TEXT AS $$
BEGIN
  CASE 
    WHEN data_uri LIKE '%data:image/jpeg%' THEN RETURN '.jpg';
    WHEN data_uri LIKE '%data:image/png%' THEN RETURN '.png';
    WHEN data_uri LIKE '%data:image/webp%' THEN RETURN '.webp';
    WHEN data_uri LIKE '%data:image/gif%' THEN RETURN '.gif';
    ELSE RETURN '.jpg';
  END CASE;
END;
$$ LANGUAGE plpgsql;

-- Función para generar storage path
CREATE OR REPLACE FUNCTION generate_storage_path(user_id_param UUID, property_id_param UUID, image_index INTEGER, extension TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN user_id_param::TEXT || '/' || property_id_param::TEXT || '/image_' || image_index || extension;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- PASO 4: SCRIPT DE MIGRACIÓN MANUAL
-- =====================================================

-- IMPORTANTE: Este script debe ejecutarse con cuidado
-- Primero, crear una tabla temporal para tracking

CREATE TABLE IF NOT EXISTS temp_image_migration (
  id SERIAL PRIMARY KEY,
  property_id UUID,
  user_id UUID,
  original_images TEXT,
  new_storage_paths TEXT[],
  migration_status TEXT DEFAULT 'PENDING',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Insertar propiedades que necesitan migración
INSERT INTO temp_image_migration (property_id, user_id, original_images)
SELECT 
  id,
  user_id,
  images
FROM properties 
WHERE images LIKE '%data:image%'
  AND (images_urls IS NULL OR array_length(images_urls, 1) = 0);

-- =====================================================
-- PASO 5: ACTUALIZACIÓN TEMPORAL PARA MOSTRAR "SIN IMÁGENES"
-- =====================================================

-- Mientras se hace la migración completa, actualizar para mostrar "sin imágenes"
-- en lugar de placeholders para propiedades con base64

UPDATE properties 
SET images = '[]'
WHERE images LIKE '%data:image%'
  AND (images_urls IS NULL OR array_length(images_urls, 1) = 0);

-- Verificar el resultado
SELECT 
  'RESULTADO_ACTUALIZACION' as verificacion,
  COUNT(*) as propiedades_actualizadas
FROM properties 
WHERE images = '[]'
  AND (images_urls IS NULL OR array_length(images_urls, 1) = 0);

-- =====================================================
-- PASO 6: SCRIPT PARA RESTAURAR DESDE BACKUP (SI ES NECESARIO)
-- =====================================================

-- Si necesitas restaurar las imágenes base64 desde el backup
/*
UPDATE properties 
SET images = tim.original_images
FROM temp_image_migration tim
WHERE properties.id = tim.property_id
  AND tim.migration_status = 'PENDING';
*/

-- =====================================================
-- PASO 7: LIMPIEZA FINAL
-- =====================================================

-- Después de completar la migración, limpiar tabla temporal
/*
DROP TABLE IF EXISTS temp_image_migration;
DROP FUNCTION IF EXISTS extract_image_extension(TEXT);
DROP FUNCTION IF EXISTS generate_storage_path(UUID, UUID, INTEGER, TEXT);
*/

-- =====================================================
-- VERIFICACIÓN FINAL
-- =====================================================

-- Verificar que no quedan imágenes base64 problemáticas
SELECT 
  'VERIFICACION_FINAL' as verificacion,
  COUNT(*) as total_properties,
  COUNT(CASE WHEN images LIKE '%data:image%' THEN 1 END) as still_has_base64,
  COUNT(CASE WHEN images = '[]' THEN 1 END) as empty_images,
  COUNT(CASE WHEN images_urls IS NOT NULL AND array_length(images_urls, 1) > 0 THEN 1 END) as has_storage_urls
FROM properties;
