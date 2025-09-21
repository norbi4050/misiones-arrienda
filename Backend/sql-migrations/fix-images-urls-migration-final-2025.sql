-- Migración final corregida: images legacy a images_urls
-- Fecha: 2025-01-03
-- Objetivo: Migrar datos de images (TEXT con JSON) a images_urls (ARRAY nativo)
-- TIPOS IDENTIFICADOS: images = TEXT, images_urls = ARRAY

-- PASO 0: Verificar tipos de datos actuales
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'properties' 
  AND column_name IN ('images', 'images_urls')
ORDER BY column_name;

-- PASO 1: Verificar contenido actual con tipos correctos
SELECT 
  id,
  title,
  pg_typeof(images) as images_type,
  pg_typeof(images_urls) as images_urls_type,
  -- Para images (TEXT): verificar si es JSON válido
  CASE 
    WHEN images IS NULL THEN 'NULL'
    WHEN images = '' THEN 'EMPTY_STRING'
    WHEN images = '[]' THEN 'EMPTY_JSON_ARRAY'
    WHEN LENGTH(images) > 2 THEN 'HAS_JSON_DATA'
    ELSE 'OTHER'
  END as images_status,
  -- Para images_urls (ARRAY): usar array_length
  CASE 
    WHEN images_urls IS NULL THEN 'NULL'
    WHEN array_length(images_urls, 1) IS NULL THEN 'EMPTY_ARRAY'
    WHEN array_length(images_urls, 1) > 0 THEN 'HAS_ARRAY_DATA'
    ELSE 'OTHER'
  END as images_urls_status,
  LENGTH(COALESCE(images, '')) as images_length,
  array_length(images_urls, 1) as images_urls_count
FROM properties 
WHERE user_id IS NOT NULL
ORDER BY updated_at DESC 
LIMIT 5;

-- PASO 2: Migrar de images (TEXT JSON) a images_urls (ARRAY)
-- Solo migrar donde images_urls esté vacío pero images tenga datos JSON válidos
UPDATE properties 
SET images_urls = (
    SELECT ARRAY(
      SELECT jsonb_array_elements_text(images::jsonb)
    )
  ),
  updated_at = NOW()
WHERE (
    images_urls IS NULL 
    OR array_length(images_urls, 1) IS NULL
  )
  AND images IS NOT NULL 
  AND images != '' 
  AND images != '[]'
  AND LENGTH(images) > 2
  AND images::jsonb ? '0'; -- Verificar que el JSON tenga al menos un elemento

-- PASO 3: Verificar migración
SELECT 
  COUNT(*) as total_properties,
  COUNT(CASE WHEN images_urls IS NOT NULL AND array_length(images_urls, 1) > 0 THEN 1 END) as with_images_urls,
  COUNT(CASE WHEN images IS NOT NULL AND images != '' AND images != '[]' AND LENGTH(images) > 2 THEN 1 END) as with_images_legacy,
  COUNT(CASE WHEN (images_urls IS NULL OR array_length(images_urls, 1) IS NULL) 
                  AND (images IS NULL OR images = '' OR images = '[]') THEN 1 END) as without_images
FROM properties;

-- PASO 4: Crear índices para optimización
CREATE INDEX IF NOT EXISTS idx_properties_user_id_status 
ON properties(user_id, status) 
WHERE status IN ('DRAFT', 'PUBLISHED', 'ARCHIVED');

CREATE INDEX IF NOT EXISTS idx_properties_updated_at 
ON properties(updated_at DESC);

-- PASO 5: Consulta final para verificar datos migrados
SELECT 
  id,
  title,
  array_length(images_urls, 1) as images_urls_count,
  LENGTH(COALESCE(images, '')) as images_text_length,
  CASE 
    WHEN array_length(images_urls, 1) > 0 THEN 'HAS_IMAGES_URLS'
    WHEN images IS NOT NULL AND images != '' AND images != '[]' THEN 'HAS_IMAGES_LEGACY'
    ELSE 'NO_IMAGES'
  END as image_status,
  images_urls[1] as first_image_url, -- Mostrar primera imagen del array
  LEFT(images, 50) as images_preview -- Mostrar preview del JSON
FROM properties 
WHERE user_id IS NOT NULL
ORDER BY updated_at DESC 
LIMIT 10;

-- PASO 6: Verificar que la migración fue exitosa
-- Esta consulta debe mostrar cuántas propiedades se migraron
SELECT 
  'MIGRATION_SUMMARY' as report_type,
  COUNT(*) as total_migrated
FROM properties 
WHERE images_urls IS NOT NULL 
  AND array_length(images_urls, 1) > 0
  AND images IS NOT NULL 
  AND images != '' 
  AND images != '[]';
