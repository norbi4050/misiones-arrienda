-- INVESTIGACIÓN ESPECÍFICA - TRIGGERS PROPERTY-IMAGES
-- Fecha: 3 Enero 2025
-- Problema: text = uuid error específicamente en property-images

-- =====================================================
-- INVESTIGAR TRIGGERS ESPECÍFICOS
-- =====================================================

-- 1. Verificar función touch_property_on_image_change (SOSPECHOSA)
SELECT 
    proname as function_name,
    prosrc as source_code
FROM pg_proc 
WHERE proname = 'touch_property_on_image_change';

-- 2. Verificar si esta función tiene el problema text = uuid
SELECT 
    proname,
    prosrc
FROM pg_proc 
WHERE prosrc LIKE '%text = uuid%' 
OR prosrc LIKE '%uuid = text%'
OR prosrc LIKE '%property-images%';

-- 3. Verificar triggers específicos de property-images
SELECT 
    t.trigger_name,
    t.event_manipulation,
    t.action_timing,
    t.action_statement,
    p.prosrc as function_source
FROM information_schema.triggers t
LEFT JOIN pg_proc p ON p.proname = REPLACE(REPLACE(t.action_statement, 'EXECUTE FUNCTION ', ''), '()', '')
WHERE t.event_object_schema = 'storage' 
AND t.event_object_table = 'objects'
AND t.trigger_name LIKE '%property%';

-- =====================================================
-- SOLUCIÓN: DESHABILITAR TRIGGER PROBLEMÁTICO
-- =====================================================

-- Si el trigger touch_property_on_image_change causa el problema:
-- OPCIÓN 1: Deshabilitar temporalmente
-- DROP TRIGGER IF EXISTS trg_touch_property_on_image_insert ON storage.objects;
-- DROP TRIGGER IF EXISTS trg_touch_property_on_image_update ON storage.objects;
-- DROP TRIGGER IF EXISTS trg_touch_property_on_image_delete ON storage.objects;

-- OPCIÓN 2: Modificar la función para manejar el casting correctamente
-- (Requiere ver el código fuente de la función primero)

-- =====================================================
-- VERIFICACIÓN DE DIFERENCIAS AVATARS VS PROPERTY-IMAGES
-- =====================================================

-- Verificar si avatars tiene triggers diferentes
SELECT 
    'avatars' as bucket,
    COUNT(*) as trigger_count
FROM information_schema.triggers t
WHERE t.event_object_schema = 'storage' 
AND t.event_object_table = 'objects'
AND t.action_statement LIKE '%avatars%'

UNION ALL

SELECT 
    'property-images' as bucket,
    COUNT(*) as trigger_count
FROM information_schema.triggers t
WHERE t.event_object_schema = 'storage' 
AND t.event_object_table = 'objects'
AND t.action_statement LIKE '%property-images%';

-- =====================================================
-- TEST DE INSERCIÓN MANUAL
-- =====================================================

-- Test 1: Intentar inserción directa (NO EJECUTAR - solo para debug)
/*
INSERT INTO storage.objects (
    bucket_id, 
    name, 
    owner,
    metadata
) VALUES (
    'property-images',
    'test/test-file.jpg',
    '6403f9d2-e846-4c70-87e0-e051127d9500'::uuid,
    '{}'::jsonb
);
*/

-- Test 2: Ver qué pasa si usamos owner_id en lugar de owner
/*
INSERT INTO storage.objects (
    bucket_id, 
    name, 
    owner_id,
    metadata
) VALUES (
    'property-images',
    'test/test-file.jpg',
    '6403f9d2-e846-4c70-87e0-e051127d9500',
    '{}'::jsonb
);
*/

-- =====================================================
-- INSTRUCCIONES
-- =====================================================

/*
PASOS PARA RESOLVER:

1. Ejecutar queries de investigación para encontrar la función problemática
2. Si touch_property_on_image_change tiene el error text = uuid:
   - Deshabilitar triggers temporalmente
   - O arreglar la función con casting correcto
3. Probar upload después del fix
4. Re-habilitar triggers si es necesario

HIPÓTESIS:
- La función touch_property_on_image_change intenta comparar text con uuid
- Esto funciona en avatars pero falla en property-images
- Posiblemente por diferencias en el path structure o metadata
*/
