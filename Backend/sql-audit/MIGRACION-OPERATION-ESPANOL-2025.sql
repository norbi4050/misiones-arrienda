-- ============================================================================
-- MIGRACIÓN: Valores de operationType de INGLÉS a ESPAÑOL
-- Proyecto: MisionesArrienda
-- Fecha: 2025-01-10
-- Objetivo: Migrar valores de operation_type de inglés (RENT/SALE/BOTH) a español (alquiler/venta/ambos)
-- ============================================================================

-- PASO 1: Verificar estado actual
-- ============================================================================

-- Ver distribución actual de valores
SELECT 
  operation_type,
  COUNT(*) as cantidad,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as porcentaje
FROM properties
WHERE operation_type IS NOT NULL
GROUP BY operation_type
ORDER BY cantidad DESC;

-- Ver ejemplos de cada tipo
SELECT id, title, operation_type, status, created_at
FROM properties
WHERE operation_type IS NOT NULL
ORDER BY operation_type, created_at DESC
LIMIT 20;


-- PASO 2: SAFE-FIX - Migración de valores
-- ============================================================================

-- IMPORTANTE: Ejecutar DESPUÉS de desplegar el código actualizado
-- Esto asegura que el frontend ya puede manejar valores en español

BEGIN;

-- Actualizar valores de inglés a español
UPDATE properties 
SET operation_type = CASE 
  WHEN operation_type = 'RENT' THEN 'alquiler'
  WHEN operation_type = 'SALE' THEN 'venta'
  WHEN operation_type = 'BOTH' THEN 'ambos'
  -- Si ya está en español, mantener el valor
  WHEN operation_type IN ('alquiler', 'venta', 'ambos') THEN operation_type
  -- ROLLBACK: Si el valor no es reconocido, default a 'alquiler'
  ELSE 'alquiler'
END
WHERE operation_type IS NOT NULL;

-- Actualizar propiedades sin operation_type (NULL) a 'alquiler' (default seguro)
UPDATE properties
SET operation_type = 'alquiler'
WHERE operation_type IS NULL;

COMMIT;


-- PASO 3: Verificar resultados de la migración
-- ============================================================================

-- Ver nueva distribución de valores (debe mostrar solo español)
SELECT 
  operation_type,
  COUNT(*) as cantidad,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as porcentaje
FROM properties
GROUP BY operation_type
ORDER BY cantidad DESC;

-- Verificar que NO quedan valores en inglés
SELECT COUNT(*) as propiedades_con_valores_ingleses
FROM properties
WHERE operation_type IN ('RENT', 'SALE', 'BOTH');
-- Resultado esperado: 0

-- Verificar que NO hay valores NULL
SELECT COUNT(*) as propiedades_sin_operation_type
FROM properties
WHERE operation_type IS NULL;
-- Resultado esperado: 0

-- Verificar que todos los valores son válidos
SELECT COUNT(*) as propiedades_con_valores_invalidos
FROM properties
WHERE operation_type NOT IN ('alquiler', 'venta', 'ambos');
-- Resultado esperado: 0


-- PASO 4: Verificación de integridad
-- ============================================================================

-- Ver ejemplos de propiedades migradas
SELECT 
  id,
  title,
  operation_type,
  status,
  price,
  city,
  created_at
FROM properties
ORDER BY updated_at DESC
LIMIT 10;

-- Estadísticas por ciudad y tipo de operación
SELECT 
  city,
  operation_type,
  COUNT(*) as cantidad
FROM properties
WHERE status = 'PUBLISHED'
GROUP BY city, operation_type
ORDER BY city, operation_type;


-- PASO 5: ROLLBACK (solo si es necesario)
-- ============================================================================

-- Si algo sale mal, revertir a valores en inglés
-- ADVERTENCIA: Solo ejecutar si es absolutamente necesario

/*
BEGIN;

UPDATE properties 
SET operation_type = CASE 
  WHEN operation_type = 'alquiler' THEN 'RENT'
  WHEN operation_type = 'venta' THEN 'SALE'
  WHEN operation_type = 'ambos' THEN 'BOTH'
  ELSE operation_type
END
WHERE operation_type IN ('alquiler', 'venta', 'ambos');

COMMIT;
*/


-- PASO 6: Optimización de índices (opcional)
-- ============================================================================

-- Verificar si existe índice en operation_type
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'properties'
  AND indexdef LIKE '%operation_type%';

-- Si no existe, crear índice para mejorar performance de filtros
-- CREATE INDEX IF NOT EXISTS idx_properties_operation_type 
-- ON properties(operation_type)
-- WHERE status = 'PUBLISHED' AND is_active = true;


-- ============================================================================
-- FIN DE LA MIGRACIÓN
-- ============================================================================

-- NOTAS IMPORTANTES:
-- 1. Ejecutar este script DESPUÉS de desplegar el código actualizado
-- 2. Hacer backup de la tabla properties antes de ejecutar
-- 3. Ejecutar en horario de bajo tráfico
-- 4. Monitorear logs de la aplicación después de la migración
-- 5. Verificar que los filtros funcionan correctamente en el frontend

-- VERIFICACIÓN POST-MIGRACIÓN:
-- ✅ Todos los valores están en español
-- ✅ No hay valores NULL
-- ✅ No hay valores en inglés
-- ✅ Los filtros funcionan correctamente
-- ✅ Las propiedades se muestran correctamente en el listado
-- ✅ El formulario de publicación funciona
-- ✅ El formulario de edición funciona
