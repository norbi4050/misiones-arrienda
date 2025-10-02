-- ============================================================================
-- B7 - DIAGNÓSTICO: Verificar estado de tabla analytics_events
-- Fecha: Enero 2025
-- Objetivo: Diagnosticar por qué la tabla no se crea o no tiene event_time
-- ============================================================================

-- PASO 1: Verificar si la tabla existe
SELECT 
    table_name,
    table_schema,
    table_type
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name = 'analytics_events';

-- PASO 2: Ver TODAS las columnas de la tabla (si existe)
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    ordinal_position
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'analytics_events'
ORDER BY ordinal_position;

-- PASO 3: Ver índices de la tabla
SELECT 
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'analytics_events'
ORDER BY indexname;

-- PASO 4: Ver si hay datos en la tabla
SELECT COUNT(*) as total_rows
FROM public.analytics_events;

-- PASO 5: Intentar SELECT simple
SELECT * FROM public.analytics_events LIMIT 1;

-- ============================================================================
-- RESULTADO ESPERADO:
-- Si la tabla existe correctamente, deberías ver:
-- - Paso 1: 1 fila con table_name = 'analytics_events'
-- - Paso 2: 11-14 columnas (incluyendo event_time)
-- - Paso 3: 4-11 índices
-- - Paso 4: Número de filas (puede ser 0)
-- - Paso 5: 0-1 filas de datos
--
-- Si ves errores:
-- - "relation does not exist" → La tabla NO existe
-- - "column does not exist" → La tabla existe pero con schema diferente
-- ============================================================================
