-- Migración corregida: images legacy a images_urls
-- Fecha: 2025-01-03
-- Objetivo: Migrar datos de images (legacy) a images_urls (nuevo sistema)

-- PASO 0: Verificar tipos de datos primero
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'properties' 
  AND column_name IN ('images', 'images_urls')
ORDER BY column_name;

-- PASO 1: Migrar images legacy a images_urls donde esté vacío
-- Tratar como campos TEXT que contienen JSON strings
UPDATE properties 
SET images_urls = images,
    updated_at = NOW()
WHERE (
    images_urls IS NULL 
    OR images_urls = '' 
    OR images_urls = '[]'
    OR LENGTH(COALESCE(images_urls, '')) = 0
  )
  AND images IS NOT NULL 
  AND images != '' 
  AND images != '[]'
  AND LENGTH(images) > 2; -- Más que solo '[]'

-- PASO 2: Verificar migración
SELECT 
  COUNT(*) as total_properties,
  COUNT(CASE WHEN images_urls IS NOT NULL AND images_urls != '[]' AND LENGTH(images_urls) > 2 THEN 1 END) as with_images_urls,
  COUNT(CASE WHEN images IS NOT NULL AND images != '[]' AND LENGTH(images) > 2 THEN 1 END) as with_images_legacy,
  COUNT(CASE WHEN (images_urls IS NULL OR images_urls = '' OR images_urls = '[]') 
                  AND (images IS NULL OR images = '' OR images = '[]') THEN 1 END) as without_images
FROM properties;

-- PASO 3: Crear índices para optimización (opcional)
CREATE INDEX IF NOT EXISTS idx_properties_user_id_status 
ON properties(user_id, status) 
WHERE status IN ('DRAFT', 'PUBLISHED', 'ARCHIVED');

CREATE INDEX IF NOT EXISTS idx_properties_updated_at 
ON properties(updated_at DESC);

-- PASO 4: Ejemplo de consulta para verificar datos migrados
SELECT 
  id,
  title,
  CASE 
    WHEN LENGTH(COALESCE(images_urls, '')) > 2 THEN 'HAS_IMAGES_URLS'
    WHEN LENGTH(COALESCE(images, '')) > 2 THEN 'HAS_IMAGES_LEGACY'
    ELSE 'NO_IMAGES'
  END as image_status,
  LENGTH(COALESCE(images_urls, '')) as images_urls_length,
  LENGTH(COALESCE(images, '')) as images_length,
  images_urls,
  images
FROM properties 
WHERE user_id IS NOT NULL
ORDER BY updated_at DESC 
LIMIT 10;
