-- INVESTIGACIÓN SUPABASE: QUERIES PARA DIAGNOSTICAR EL PROBLEMA DEL LISTADO VACÍO
-- Ejecutar estas queries en orden y reportar los resultados

-- ========================================
-- 1. VERIFICAR DATOS BÁSICOS
-- ========================================

-- Query 1: Confirmar las propiedades existentes
SELECT 
    id, 
    title, 
    status, 
    is_active, 
    created_at,
    user_id,
    city,
    province,
    price
FROM properties 
ORDER BY created_at DESC;

-- ========================================
-- 2. PROBAR FILTROS DEL ENDPOINT
-- ========================================

-- Query 2: Simular exactamente el filtro del endpoint (PUBLISHED + AVAILABLE)
SELECT 
    id, 
    title, 
    status, 
    is_active, 
    created_at,
    user_id,
    city,
    province,
    price
FROM properties 
WHERE status IN ('PUBLISHED', 'AVAILABLE') 
  AND is_active = true
ORDER BY created_at DESC;

-- Query 3: Solo PUBLISHED (como tienes en la DB)
SELECT 
    id, 
    title, 
    status, 
    is_active, 
    created_at,
    user_id,
    city,
    province,
    price
FROM properties 
WHERE status = 'PUBLISHED' 
  AND is_active = true
ORDER BY created_at DESC;

-- ========================================
-- 3. VERIFICAR ESTRUCTURA DE TABLA
-- ========================================

-- Query 4: Verificar estructura de la tabla properties
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'properties' 
ORDER BY ordinal_position;

-- ========================================
-- 4. VERIFICAR RLS (ROW LEVEL SECURITY)
-- ========================================

-- Query 5: Verificar si RLS está habilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity,
    forcerowsecurity
FROM pg_tables 
WHERE tablename = 'properties';

-- Query 6: Verificar políticas RLS activas
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'properties';

-- ========================================
-- 5. PROBAR DIFERENTES ESCENARIOS
-- ========================================

-- Query 7: Contar propiedades por status
SELECT 
    status, 
    is_active, 
    COUNT(*) as count
FROM properties 
GROUP BY status, is_active
ORDER BY status, is_active;

-- Query 8: Verificar campos requeridos para el endpoint
SELECT 
    id,
    title,
    price,
    currency,
    city,
    province,
    property_type,
    bedrooms,
    bathrooms,
    area,
    status,
    is_active,
    created_at,
    operation_type,
    cover_image_key,
    images_count
FROM properties 
WHERE status IN ('PUBLISHED', 'AVAILABLE') 
  AND is_active = true
ORDER BY created_at DESC;

-- ========================================
-- 6. VERIFICAR PERMISOS Y AUTENTICACIÓN
-- ========================================

-- Query 9: Verificar el usuario actual y sus permisos
SELECT current_user, current_role;

-- Query 10: Verificar si hay restricciones por user_id
SELECT 
    id,
    title,
    status,
    is_active,
    user_id,
    created_at
FROM properties 
WHERE status = 'PUBLISHED' 
  AND is_active = true;

-- ========================================
-- 7. DEBUGGING AVANZADO
-- ========================================

-- Query 11: Verificar si hay triggers o funciones que puedan interferir
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'properties';

-- Query 12: Verificar índices en la tabla
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'properties';

-- ========================================
-- INSTRUCCIONES DE EJECUCIÓN
-- ========================================

/*
INSTRUCCIONES:
1. Ejecuta las queries en orden (1-12)
2. Para cada query, reporta:
   - El resultado completo
   - Número de filas retornadas
   - Cualquier error que aparezca
3. Si alguna query falla, reporta el error exacto
4. Presta especial atención a:
   - Query 2 y 3: Deberían retornar la propiedad PUBLISHED
   - Query 5 y 6: Verificar si RLS está bloqueando el acceso
   - Query 9: Confirmar qué usuario está ejecutando las queries

RESULTADO ESPERADO:
- Query 2 y 3 deberían retornar 1 fila (la propiedad PUBLISHED)
- Si no retornan nada, el problema está en RLS o permisos
- Si retornan datos, el problema está en el código del endpoint
*/
