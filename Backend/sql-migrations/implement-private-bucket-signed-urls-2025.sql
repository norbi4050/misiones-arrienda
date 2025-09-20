-- =====================================================
-- IMPLEMENTACIÓN BUCKET PRIVADO CON SIGNED URLs
-- Fecha: 3 de Enero 2025
-- Objetivo: Servir imágenes desde bucket privado usando signed URLs
-- =====================================================

-- ===== CAMBIAR BUCKET A PRIVADO =====

-- Cambiar bucket property-images de público a privado
UPDATE storage.buckets 
SET public = false 
WHERE id = 'property-images';

-- ===== ACTUALIZAR ESQUEMA DE PROPERTIES =====

-- Cambiar el campo images para almacenar KEYS en lugar de URLs
COMMENT ON COLUMN properties.images IS 
'Array JSON de storage keys (no URLs). Ejemplo: ["userId/propertyId/00-cover.jpg", "userId/propertyId/01-living.jpg"]';

-- Agregar campo para la key de la imagen cover
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS cover_image_key TEXT;

COMMENT ON COLUMN properties.cover_image_key IS 
'Storage key de la imagen principal. Se usa para generar signed URL de cover.';

-- Eliminar cover_image_url ya que ahora usaremos signed URLs
ALTER TABLE properties 
DROP COLUMN IF EXISTS cover_image_url;

-- ===== FUNCIÓN PARA EXTRAER KEYS DE STORAGE =====

-- Función para extraer keys de storage del JSON (sin URLs)
CREATE OR REPLACE FUNCTION extract_image_keys(images_json TEXT)
RETURNS TEXT[] AS $$
DECLARE
    keys TEXT[];
    parsed_json JSONB;
    item TEXT;
BEGIN
    -- Manejar casos nulos o vacíos
    IF images_json IS NULL OR images_json = '' OR images_json = '[]' THEN
        RETURN ARRAY[]::TEXT[];
    END IF;
    
    BEGIN
        -- Intentar parsear como JSON
        parsed_json := images_json::JSONB;
        
        -- Si es un array, extraer strings
        IF jsonb_typeof(parsed_json) = 'array' THEN
            SELECT ARRAY(
                SELECT jsonb_array_elements_text(parsed_json)
                WHERE jsonb_array_elements_text(parsed_json) != ''
            ) INTO keys;
        ELSE
            -- Si es un string, convertir a array
            keys := ARRAY[images_json];
        END IF;
        
    EXCEPTION WHEN OTHERS THEN
        -- Si falla el parsing, tratar como string simple
        IF images_json != '' THEN
            keys := ARRAY[images_json];
        ELSE
            keys := ARRAY[]::TEXT[];
        END IF;
    END;
    
    -- Filtrar solo keys válidas (no URLs públicas)
    SELECT ARRAY(
        SELECT unnest(keys) 
        WHERE unnest(keys) IS NOT NULL 
        AND trim(unnest(keys)) != ''
        AND unnest(keys) NOT LIKE '%/storage/v1/object/public/%'  -- Excluir URLs públicas
        AND unnest(keys) NOT LIKE 'http%'  -- Excluir URLs completas
    ) INTO keys;
    
    RETURN COALESCE(keys, ARRAY[]::TEXT[]);
END;
$$ LANGUAGE plpgsql;

-- ===== FUNCIÓN PARA ACTUALIZAR COVER KEY =====

-- Función para actualizar cover_image_key automáticamente
CREATE OR REPLACE FUNCTION update_property_cover_key()
RETURNS TRIGGER AS $$
DECLARE
    image_keys TEXT[];
BEGIN
    -- Extraer keys de imágenes
    image_keys := extract_image_keys(NEW.images);
    
    -- Actualizar cover_image_key (primera key disponible)
    IF array_length(image_keys, 1) > 0 THEN
        NEW.cover_image_key := image_keys[1];
        NEW.images_count := array_length(image_keys, 1);
    ELSE
        NEW.cover_image_key := NULL;
        NEW.images_count := 0;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Actualizar trigger existente
DROP TRIGGER IF EXISTS trigger_update_property_image_metadata ON properties;
CREATE TRIGGER trigger_update_property_cover_key
    BEFORE INSERT OR UPDATE OF images ON properties
    FOR EACH ROW
    EXECUTE FUNCTION update_property_cover_key();

-- ===== FUNCIÓN PARA VALIDAR KEYS DE STORAGE =====

-- Función para validar que las keys sean válidas (no URLs)
CREATE OR REPLACE FUNCTION validate_storage_keys(images_json TEXT, max_images INTEGER DEFAULT 20)
RETURNS BOOLEAN AS $$
DECLARE
    image_keys TEXT[];
    key TEXT;
BEGIN
    -- Extraer keys
    image_keys := extract_image_keys(images_json);
    
    -- Validar cantidad máxima
    IF array_length(image_keys, 1) > max_images THEN
        RAISE EXCEPTION 'Máximo % imágenes permitidas', max_images;
    END IF;
    
    -- Validar cada key
    FOREACH key IN ARRAY image_keys LOOP
        -- Validar que sea una key válida (no URL)
        IF key LIKE '%/storage/v1/object/%' 
           OR key LIKE 'http%' 
           OR key LIKE 'https%' THEN
            RAISE EXCEPTION 'Debe ser storage key, no URL: %', key;
        END IF;
        
        -- Validar formato de key (userId/propertyId/filename)
        IF key !~ '^[a-zA-Z0-9_-]+/[a-zA-Z0-9_-]+/[a-zA-Z0-9_.-]+$' THEN
            RAISE EXCEPTION 'Formato de key inválido: %', key;
        END IF;
    END LOOP;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- ===== ACTUALIZAR DATOS EXISTENTES =====

-- Migrar URLs existentes a keys (si las hay)
UPDATE properties 
SET images = (
    SELECT jsonb_agg(
        regexp_replace(
            jsonb_array_elements_text(images::jsonb), 
            '^.*/storage/v1/object/public/property-images/', 
            ''
        )
    )::text
    FROM (SELECT images) AS t
    WHERE images IS NOT NULL 
    AND images != '[]'
    AND images::jsonb ? 0  -- Tiene al menos un elemento
    AND jsonb_array_elements_text(images::jsonb) LIKE '%/storage/v1/object/public/property-images/%'
)
WHERE images IS NOT NULL 
AND images != '[]'
AND images LIKE '%/storage/v1/object/public/property-images/%';

-- Actualizar cover_image_key para propiedades existentes
UPDATE properties 
SET cover_image_key = (extract_image_keys(images))[1]
WHERE images IS NOT NULL AND images != '[]';

-- ===== POLÍTICAS RLS PARA BUCKET PRIVADO =====

-- Eliminar políticas públicas existentes
DROP POLICY IF EXISTS "Public read access for property images" ON storage.objects;

-- Crear política para lectura autenticada solamente
CREATE POLICY "Authenticated read access for property images"
ON storage.objects FOR SELECT
USING (
    bucket_id = 'property-images'
    AND auth.role() = 'authenticated'
);

-- Mantener políticas de escritura existentes (solo el dueño)
-- (Las políticas de INSERT/UPDATE/DELETE ya están configuradas correctamente)

-- ===== ÍNDICES PARA PERFORMANCE =====

-- Índice para cover_image_key
CREATE INDEX IF NOT EXISTS idx_properties_cover_key 
ON properties(cover_image_key) 
WHERE cover_image_key IS NOT NULL;

-- ===== TESTING DE MIGRACIÓN =====

-- Test 1: Verificar que el bucket es privado
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM storage.buckets 
        WHERE id = 'property-images' AND public = true
    ) THEN
        RAISE EXCEPTION 'ERROR: Bucket property-images sigue siendo público';
    END IF;
    
    RAISE NOTICE 'SUCCESS: Bucket property-images es privado';
END $$;

-- Test 2: Verificar función de extracción de keys
DO $$
DECLARE
    test_result TEXT[];
BEGIN
    -- Test con keys válidas
    test_result := extract_image_keys('["user123/prop456/cover.jpg", "user123/prop456/living.jpg"]');
    IF array_length(test_result, 1) != 2 THEN
        RAISE EXCEPTION 'Test 1 falló: keys válidas';
    END IF;
    
    -- Test con URLs (deben ser filtradas)
    test_result := extract_image_keys('["http://example.com/image.jpg", "/storage/v1/object/public/bucket/file.jpg"]');
    IF array_length(test_result, 1) IS NOT NULL THEN
        RAISE EXCEPTION 'Test 2 falló: URLs deben ser filtradas';
    END IF;
    
    RAISE NOTICE 'SUCCESS: Función extract_image_keys funciona correctamente';
END $$;

-- ===== DOCUMENTACIÓN =====

COMMENT ON FUNCTION extract_image_keys(TEXT) IS 
'Extrae array de storage keys desde el campo JSON images. Filtra URLs y solo acepta keys válidas.';

COMMENT ON FUNCTION update_property_cover_key() IS 
'Trigger function que actualiza cover_image_key automáticamente cuando se modifica images.';

COMMENT ON FUNCTION validate_storage_keys(TEXT, INTEGER) IS 
'Valida que las keys de storage sean correctas (no URLs) y no excedan el límite máximo.';

-- ===== RESUMEN DE CAMBIOS =====

SELECT 
    '🔒 BUCKET PRIVADO CONFIGURADO' as component,
    CASE 
        WHEN EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'property-images' AND public = false)
        THEN '✅ PRIVADO'
        ELSE '❌ PÚBLICO'
    END as bucket_status,
    (SELECT COUNT(*) FROM properties WHERE cover_image_key IS NOT NULL) as properties_with_cover_key;

-- ===== RECOMENDACIONES DE USO =====

/*
CONFIGURACIÓN BUCKET PRIVADO CON SIGNED URLs:

1. ALMACENAMIENTO EN DB:
   - Campo 'images': Array JSON de keys ["userId/propertyId/file.jpg"]
   - Campo 'cover_image_key': Key de la imagen principal
   - NO almacenar URLs, solo keys de storage

2. GENERACIÓN DE SIGNED URLs:
   - Listado: Solo cover (15 min expiry)
   - Detalle: Todas las imágenes (15 min expiry)
   - Usar Service Role para generar signed URLs

3. SEGURIDAD:
   - Bucket privado (no acceso público)
   - Solo usuarios autenticados pueden leer
   - Signed URLs expiran automáticamente
   - DRAFT properties no generan signed URLs

4. PERFORMANCE:
   - Cache browser hasta expiry
   - Batch signing cuando sea posible
   - Solo firmar cover para listados

EJEMPLO DE KEYS:
✅ Correcto: "user123/prop456/00-cover.jpg"
❌ Incorrecto: "https://...storage/v1/object/public/..."
*/

-- ===== VERIFICACIÓN FINAL =====

SELECT 
    '🎉 MIGRACIÓN COMPLETADA' as status,
    'Bucket privado con signed URLs configurado' as message;
