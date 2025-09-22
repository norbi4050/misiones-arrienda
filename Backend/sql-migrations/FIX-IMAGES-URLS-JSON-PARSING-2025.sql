-- CORRECCIÓN CRÍTICA: PARSING JSON EN IMAGES_URLS
-- Fecha: 2025-01-03
-- Problema: Error "Unexpected non-whitespace character after JSON at position 4"

-- PASO 1: Verificar el contenido actual de images_urls
SELECT 
  'VERIFICACION_IMAGES_URLS' as seccion,
  id,
  title,
  images_urls,
  length(images_urls::text) as length_field,
  substr(images_urls::text, 1, 20) as first_20_chars,
  substr(images_urls::text, -20) as last_20_chars,
  CASE 
    WHEN images_urls IS NULL THEN 'NULL'
    WHEN images_urls::text = '[]' THEN 'EMPTY_ARRAY'
    WHEN images_urls::text LIKE '[%]' THEN 'VALID_JSON_ARRAY'
    WHEN images_urls::text LIKE '{%}' THEN 'JSON_OBJECT'
    ELSE 'INVALID_FORMAT'
  END as format_type
FROM properties 
WHERE id = '89ecf166-8f87-4174-a0d4-42052166f2dd';

-- PASO 2: Intentar corregir el formato si es necesario
-- Solo ejecutar si el formato es inválido
UPDATE properties 
SET images_urls = '["6403f9d2-e846-4c70-87e0-e051127d9500/4d4dc702-953a-41b9-b875-8c1eaa3d8714/00-cover.jpg.jpg"]'::text[]
WHERE id = '89ecf166-8f87-4174-a0d4-42052166f2dd'
  AND (
    images_urls IS NULL 
    OR images_urls::text NOT LIKE '[%]'
    OR images_urls::text = '[]'
  );

-- PASO 3: Verificar la corrección
SELECT 
  'VERIFICACION_POST_CORRECCION' as seccion,
  id,
  title,
  images_urls,
  array_length(images_urls, 1) as images_count,
  images_urls[1] as first_image_url,
  CASE 
    WHEN images_urls IS NOT NULL AND array_length(images_urls, 1) > 0 
    THEN 'CORREGIDO_EXITOSAMENTE'
    ELSE 'REQUIERE_ATENCION'
  END as status
FROM properties 
WHERE id = '89ecf166-8f87-4174-a0d4-42052166f2dd';

-- PASO 4: Verificar que el archivo existe en storage
SELECT 
  'VERIFICACION_ARCHIVO_STORAGE' as seccion,
  name as file_path,
  metadata->>'size' as file_size,
  metadata->>'mimetype' as mime_type,
  created_at,
  CASE 
    WHEN name = '6403f9d2-e846-4c70-87e0-e051127d9500/4d4dc702-953a-41b9-b875-8c1eaa3d8714/00-cover.jpg.jpg'
    THEN 'ARCHIVO_CORRECTO_ENCONTRADO'
    ELSE 'ARCHIVO_DIFERENTE'
  END as match_status
FROM storage.objects 
WHERE bucket_id = 'property-images'
  AND name LIKE '%6403f9d2-e846-4c70-87e0-e051127d9500%';

-- PASO 5: Test de URL pública directa
SELECT 
  'TEST_URL_PUBLICA' as seccion,
  'https://your-supabase-url.supabase.co/storage/v1/object/public/property-images/6403f9d2-e846-4c70-87e0-e051127d9500/4d4dc702-953a-41b9-b875-8c1eaa3d8714/00-cover.jpg.jpg' as url_publica_directa,
  'ESTA_URL_DEBERIA_FUNCIONAR_DIRECTAMENTE' as nota;
