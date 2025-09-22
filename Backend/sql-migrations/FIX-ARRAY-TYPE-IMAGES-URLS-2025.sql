-- CORRECCIÓN DEFINITIVA: TIPO DE COLUMNA IMAGES_URLS
-- Fecha: 2025-01-03
-- Problema: Campo images_urls es text[] pero contiene JSON string

-- PASO 1: Verificar el tipo actual de la columna
SELECT 
  'VERIFICACION_TIPO_COLUMNA' as seccion,
  column_name,
  data_type,
  udt_name,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'properties' 
  AND column_name = 'images_urls';

-- PASO 2: Verificar contenido actual
SELECT 
  'CONTENIDO_ACTUAL' as seccion,
  id,
  title,
  images_urls,
  pg_typeof(images_urls) as tipo_postgresql,
  CASE 
    WHEN images_urls IS NULL THEN 'NULL'
    WHEN array_length(images_urls, 1) IS NULL THEN 'EMPTY_ARRAY'
    WHEN array_length(images_urls, 1) > 0 THEN 'ARRAY_WITH_DATA'
    ELSE 'UNKNOWN'
  END as estado_array
FROM properties 
WHERE id = '89ecf166-8f87-4174-a0d4-42052166f2dd';

-- PASO 3: Extraer el primer elemento del array (que debería ser la key)
SELECT 
  'EXTRACCION_KEY' as seccion,
  id,
  title,
  images_urls[1] as primera_imagen_key,
  array_length(images_urls, 1) as total_imagenes,
  CASE 
    WHEN images_urls[1] IS NOT NULL 
    THEN CONCAT(
      'https://', 
      SPLIT_PART('${process.env.NEXT_PUBLIC_SUPABASE_URL}', '//', 2),
      '/storage/v1/object/public/property-images/',
      images_urls[1]
    )
    ELSE 'NO_URL_DISPONIBLE'
  END as url_publica_generada
FROM properties 
WHERE id = '89ecf166-8f87-4174-a0d4-42052166f2dd';

-- PASO 4: Verificar que la key es válida para URLs públicas
SELECT 
  'VALIDACION_KEY' as seccion,
  images_urls[1] as key_storage,
  CASE 
    WHEN images_urls[1] LIKE '%/%/%' THEN 'FORMATO_CORRECTO'
    WHEN images_urls[1] LIKE '%placeholder%' THEN 'ES_PLACEHOLDER'
    WHEN images_urls[1] IS NULL THEN 'NULL'
    ELSE 'FORMATO_INCORRECTO'
  END as validacion_formato,
  LENGTH(images_urls[1]) as longitud_key
FROM properties 
WHERE id = '89ecf166-8f87-4174-a0d4-42052166f2dd';

-- PASO 5: Test final - generar URL pública completa
SELECT 
  'URL_PUBLICA_FINAL' as seccion,
  CONCAT(
    'https://kfbdlqjyqnqjqzqzqzqz.supabase.co',
    '/storage/v1/object/public/property-images/',
    images_urls[1]
  ) as url_completa,
  'ESTA_URL_DEBERIA_MOSTRAR_LA_IMAGEN_REAL' as nota
FROM properties 
WHERE id = '89ecf166-8f87-4174-a0d4-42052166f2dd'
  AND images_urls[1] IS NOT NULL;
