-- ============================================================================
-- VERIFICACIÓN DEL CAMPO DESCRIPTION EN PROPERTIES
-- Fecha: 2025-01-11
-- Propósito: Confirmar que el campo description existe y su configuración
-- ============================================================================

-- 1. Verificar estructura del campo description
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'properties'
  AND column_name = 'description';

-- Resultado esperado:
-- column_name  | data_type | character_maximum_length | is_nullable | column_default
-- description  | text      | NULL                     | YES/NO      | NULL

-- ============================================================================

-- 2. Verificar propiedades recientes con/sin description
SELECT 
    id,
    title,
    CASE 
        WHEN description IS NULL THEN '❌ NULL'
        WHEN description = '' THEN '⚠️  VACÍO'
        ELSE '✅ ' || LEFT(description, 50) || '...'
    END as description_status,
    LENGTH(description) as description_length,
    status,
    created_at
FROM properties
ORDER BY created_at DESC
LIMIT 10;

-- ============================================================================

-- 3. Contar propiedades por estado de description
SELECT 
    status,
    COUNT(*) as total,
    COUNT(description) as con_description,
    COUNT(*) - COUNT(description) as sin_description,
    ROUND(100.0 * COUNT(description) / COUNT(*), 2) as porcentaje_con_desc
FROM properties
GROUP BY status
ORDER BY status;

-- ============================================================================

-- 4. Verificar borradores recientes (donde se aplica el fix)
SELECT 
    id,
    title,
    description,
    status,
    created_at,
    updated_at
FROM properties
WHERE status = 'DRAFT'
ORDER BY created_at DESC
LIMIT 5;

-- ============================================================================

-- 5. Test: Crear un borrador de prueba con description
-- (Ejecutar SOLO si querés probar manualmente en Supabase)
/*
INSERT INTO properties (
    id,
    title,
    description,
    price,
    city,
    province,
    property_type,
    user_id,
    user_id_text,
    status,
    is_active,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    'Test - Verificar description',
    'Esta es una descripción de prueba para verificar que el campo funciona correctamente',
    100000,
    'Posadas',
    'Misiones',
    'HOUSE',
    auth.uid(), -- Reemplazar con un user_id válido si no estás autenticado
    auth.uid()::text,
    'DRAFT',
    true,
    NOW(),
    NOW()
)
RETURNING id, title, LEFT(description, 50) as desc_preview;
*/

-- ============================================================================

-- 6. Verificar índices relacionados con description (si existen)
SELECT
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'properties'
  AND indexdef ILIKE '%description%';

-- ============================================================================

-- NOTAS:
-- - Si is_nullable = 'NO', el campo es NOT NULL y requiere un valor
-- - Si is_nullable = 'YES', el campo acepta NULL
-- - Si hay muchas propiedades sin description, el fix es crítico
-- - Después del fix, todas las nuevas propiedades deberían tener description
