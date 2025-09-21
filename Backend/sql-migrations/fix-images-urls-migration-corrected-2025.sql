-- Migración corregida: images legacy a images_urls
-- Fecha: 2025-01-03
-- Objetivo: Migrar datos de images (legacy) a images_urls (nuevo sistema)
-- PROBLEMA: PostgreSQL interpreta campos como arrays nativos, no TEXT con JSON

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

-- PASO 1: Verificar contenido actual de los campos
SELECT 
  id,
  title,
  pg_typeof(images) as images_type,
  pg_typeof(images_urls) as images_urls_type,
  CASE 
    WHEN images IS NULL THEN 'NULL'
    WHEN array_length(images, 1) IS NULL THEN 'EMPTY_ARRAY'
    ELSE 'HAS_DATA'
  END as images_status,
  CASE 
    WHEN images_urls IS NULL THEN 'NULL'
    WHEN array_length(images_urls, 1) IS NULL THEN 'EMPTY_ARRAY'
    ELSE 'HAS_DATA'
  END as images_urls_status,
  array_length(images, 1) as images_count,
  array_length(images_urls, 1) as images_urls_count
FROM properties 
WHERE user_id IS NOT NULL
ORDER BY updated_at DESC 
LIMIT 5;

-- PASO 2: Migrar solo si los campos son arrays nativos
-- Si images_urls está vacío pero images tiene datos
UPDATE properties 
SET images_urls = images,
    updated_at = NOW()
WHERE (
    images_urls IS NULL 
    OR array_length(images_urls, 1) IS NULL
  )
  AND images IS NOT NULL 
  AND array_length(images, 1) > 0;

-- PASO 3: Verificar migración
SELECT 
  COUNT(*) as total_properties,
  COUNT(CASE WHEN images_urls IS NOT NULL AND array_length(images_urls, 1) > 0 THEN 1 END) as with_images_urls,
  COUNT(CASE WHEN images IS NOT NULL AND array_length(images, 1) > 0 THEN 1 END) as with_images_legacy,
  COUNT(CASE WHEN (images_urls IS NULL OR array_length(images_urls, 1) IS NULL) 
                  AND (images IS NULL OR array_length(images, 1) IS NULL) THEN 1 END) as without_images
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
  array_length(images, 1) as images_count,
  CASE 
    WHEN array_length(images_urls, 1) > 0 THEN 'HAS_IMAGES_URLS'
    WHEN array_length(images, 1) > 0 THEN 'HAS_IMAGES_LEGACY'
    ELSE 'NO_IMAGES'
  END as image_status
FROM properties 
WHERE user_id IS NOT NULL
ORDER BY updated_at DESC 
LIMIT 10;
