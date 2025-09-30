-- 🔍 INVESTIGACIÓN: Status de propiedades en la DB
-- Fecha: 2025-09-29
-- Problema: Se muestran imágenes demo porque no hay propiedades con status='PUBLISHED'

-- 1. Verificar todas las propiedades y sus status
SELECT 
    id,
    title,
    status,
    is_active,
    created_at,
    updated_at,
    published_at,
    user_id,
    images,
    images_urls
FROM properties 
ORDER BY created_at DESC
LIMIT 10;

-- 2. Contar propiedades por status
SELECT 
    status,
    is_active,
    COUNT(*) as count
FROM properties 
GROUP BY status, is_active
ORDER BY count DESC;

-- 3. Verificar propiedades que deberían estar publicadas
SELECT 
    id,
    title,
    status,
    is_active,
    CASE 
        WHEN status = 'PUBLISHED' AND is_active = true THEN '✅ Visible en /properties'
        WHEN status = 'DRAFT' THEN '📝 Borrador (no visible)'
        WHEN status = 'PENDING' THEN '⏳ Pendiente (no visible)'
        WHEN is_active = false THEN '❌ Inactiva (no visible)'
        ELSE '❓ Estado desconocido'
    END as visibility_status
FROM properties 
ORDER BY created_at DESC;

-- 4. SOLUCIÓN TEMPORAL: Publicar propiedades existentes (COMENTADO - ejecutar manualmente si es necesario)
/*
UPDATE properties 
SET 
    status = 'PUBLISHED',
    is_active = true,
    published_at = NOW()
WHERE status IN ('DRAFT', 'PENDING') 
  AND is_active IS NOT FALSE;
*/

-- 5. Verificar después de la actualización (ejecutar después del UPDATE)
/*
SELECT 
    'Después del UPDATE' as momento,
    status,
    is_active,
    COUNT(*) as count
FROM properties 
GROUP BY status, is_active
ORDER BY count DESC;
*/

-- 6. Verificar imágenes de las propiedades
SELECT 
    id,
    title,
    status,
    CASE 
        WHEN images IS NOT NULL AND images != '[]' AND images != '' THEN 'Tiene imágenes en campo images'
        WHEN images_urls IS NOT NULL AND array_length(images_urls, 1) > 0 THEN 'Tiene URLs en images_urls'
        ELSE 'Sin imágenes'
    END as images_status,
    images,
    images_urls
FROM properties 
WHERE status = 'PUBLISHED' OR status = 'DRAFT'
ORDER BY created_at DESC;

-- 7. Verificar bucket property-images para las propiedades
-- (Esto requiere verificación manual en Supabase Storage)
-- Buscar carpetas: {user_id}/{property_id}/

-- NOTAS:
-- - Si no hay propiedades con status='PUBLISHED', el query en /api/properties devuelve array vacío
-- - Esto causa que se muestren placeholders en lugar de propiedades reales
-- - La solución es publicar las propiedades existentes o ajustar el query temporalmente
