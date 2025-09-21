-- Migración definitiva: images (TEXT JSON) a images_urls (ARRAY)
-- Fecha: 2025-01-03
-- PROBLEMA IDENTIFICADO: images contiene base64 data URLs, no URLs públicas
-- SOLUCIÓN: NO migrar base64, solo URLs públicas válidas

-- PASO 1: Analizar contenido de images para identificar tipos de datos
SELECT 
  id,
  title,
  CASE 
    WHEN images IS NULL THEN 'NULL'
    WHEN images = '[]' THEN 'EMPTY_ARRAY'
    WHEN images LIKE '%data:image%' THEN 'BASE64_DATA'
    WHEN images LIKE '%http%' THEN 'HTTP_URLS'
    WHEN LENGTH(images) > 1000 THEN 'LARGE_DATA'
    ELSE 'OTHER'
  END as images_content_type,
  LENGTH(images) as images_size,
  LEFT(images, 100) as images_preview
FROM properties 
WHERE images IS NOT NULL AND images != '[]'
ORDER BY LENGTH(images) DESC;

-- PASO 2: Migrar solo URLs públicas válidas (NO base64)
-- Filtrar base64 data URLs que no son útiles para el frontend
UPDATE properties 
SET images_urls = (
    SELECT ARRAY(
      SELECT value::text
      FROM jsonb_array_elements_text(images::jsonb) AS value
      WHERE value::text LIKE 'http%'  -- Solo URLs públicas
        AND value::text NOT LIKE '%data:image%'  -- Excluir base64
        AND LENGTH(value::text) > 10  -- URLs mínimas válidas
    )
  ),
  updated_at = NOW()
WHERE images_urls IS NULL 
  AND images IS NOT NULL 
  AND images != '[]'
  AND LENGTH(images) > 2
  AND images::jsonb ? '0'  -- Verificar que tenga elementos
  AND EXISTS (
    SELECT 1 
    FROM jsonb_array_elements_text(images::jsonb) AS value
    WHERE value::text LIKE 'http%' 
      AND value::text NOT LIKE '%data:image%'
  );

-- PASO 3: Verificar migración
SELECT 
  COUNT(*) as total_properties,
  COUNT(CASE WHEN images_urls IS NOT NULL AND array_length(images_urls, 1) > 0 THEN 1 END) as with_images_urls,
  COUNT(CASE WHEN images IS NOT NULL AND images != '[]' AND LENGTH(images) > 2 THEN 1 END) as with_images_legacy,
  COUNT(CASE WHEN images LIKE '%data:image%' THEN 1 END) as with_base64_data,
  COUNT(CASE WHEN images LIKE '%http%' AND images NOT LIKE '%data:image%' THEN 1 END) as with_http_urls
FROM properties;

-- PASO 4: Mostrar resultados de migración
SELECT 
  id,
  title,
  array_length(images_urls, 1) as migrated_urls_count,
  CASE 
    WHEN array_length(images_urls, 1) > 0 THEN 'MIGRATED_TO_URLS'
    WHEN images LIKE '%data:image%' THEN 'SKIPPED_BASE64'
    WHEN images = '[]' THEN 'EMPTY_LEGACY'
    ELSE 'NO_MIGRATION_NEEDED'
  END as migration_status,
  images_urls[1] as first_migrated_url
FROM properties 
WHERE user_id IS NOT NULL
ORDER BY updated_at DESC;

-- PASO 5: Crear índices para optimización
CREATE INDEX IF NOT EXISTS idx_properties_user_id_status 
ON properties(user_id, status) 
WHERE status IN ('DRAFT', 'PUBLISHED', 'ARCHIVED');

CREATE INDEX IF NOT EXISTS idx_properties_updated_at 
ON properties(updated_at DESC);

-- PASO 6: Reporte final
SELECT 
  'MIGRATION_COMPLETE' as status,
  COUNT(CASE WHEN array_length(images_urls, 1) > 0 THEN 1 END) as successfully_migrated,
  COUNT(CASE WHEN images LIKE '%data:image%' THEN 1 END) as base64_skipped,
  COUNT(CASE WHEN images = '[]' OR images IS NULL THEN 1 END) as no_images
FROM properties;
