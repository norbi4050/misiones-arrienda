-- =====================================================
-- ÍNDICES Y CAMPOS PARA PERFIL PÚBLICO DE INMOBILIARIAS
-- Fecha: 2025-01-XX
-- Propósito: Optimizar queries de propiedades por inmobiliaria
--            y agregar campos de privacidad
-- =====================================================

-- =====================================================
-- PARTE 1: ÍNDICES PARA PERFORMANCE
-- =====================================================

-- Índice compuesto para filtrar propiedades activas por inmobiliaria
-- Usado en: /api/inmobiliarias/[id]/properties
CREATE INDEX IF NOT EXISTS idx_properties_user_id_is_active 
ON properties(user_id, is_active)
WHERE is_active = true;

-- Índice para ordenar por fecha de creación (más recientes primero)
-- Usado en: sort=recent
CREATE INDEX IF NOT EXISTS idx_properties_created_at 
ON properties(created_at DESC);

-- Índice compuesto para ordenar por precio
-- Usado en: sort=price_asc, sort=price_desc
CREATE INDEX IF NOT EXISTS idx_properties_user_id_price 
ON properties(user_id, price)
WHERE is_active = true;

-- Índice para contar propiedades activas por inmobiliaria
CREATE INDEX IF NOT EXISTS idx_properties_user_id_active_count 
ON properties(user_id)
WHERE is_active = true;

-- =====================================================
-- PARTE 2: CAMPOS DE PRIVACIDAD EN USERS
-- =====================================================

-- Agregar campos para controlar qué información es pública
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS show_phone_public BOOLEAN DEFAULT false;

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS show_address_public BOOLEAN DEFAULT false;

-- Comentarios para documentación
COMMENT ON COLUMN users.show_phone_public IS 
'Controla si el teléfono se muestra en el perfil público de la inmobiliaria';

COMMENT ON COLUMN users.show_address_public IS 
'Controla si la dirección se muestra en el perfil público de la inmobiliaria';

-- =====================================================
-- PARTE 3: VERIFICACIÓN DE ÍNDICES
-- =====================================================

-- Query para verificar que los índices se crearon correctamente
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'properties'
AND indexname LIKE 'idx_properties_%'
ORDER BY indexname;

-- =====================================================
-- PARTE 4: ESTADÍSTICAS DE PERFORMANCE
-- =====================================================

-- Analizar tabla para actualizar estadísticas
ANALYZE properties;
ANALYZE users;

-- Query para verificar uso de índices (ejecutar después de usar la API)
-- SELECT * FROM pg_stat_user_indexes WHERE relname = 'properties';

-- =====================================================
-- ROLLBACK (si es necesario)
-- =====================================================

/*
-- Para revertir los cambios:

DROP INDEX IF EXISTS idx_properties_user_id_is_active;
DROP INDEX IF EXISTS idx_properties_created_at;
DROP INDEX IF EXISTS idx_properties_user_id_price;
DROP INDEX IF EXISTS idx_properties_user_id_active_count;

ALTER TABLE users DROP COLUMN IF EXISTS show_phone_public;
ALTER TABLE users DROP COLUMN IF EXISTS show_address_public;
*/

-- =====================================================
-- NOTAS DE IMPLEMENTACIÓN
-- =====================================================

/*
ÍNDICES CREADOS:
1. idx_properties_user_id_is_active
   - Optimiza: SELECT WHERE user_id = X AND is_active = true
   - Impacto: Listado de propiedades por inmobiliaria
   - Tamaño estimado: ~1-2MB por cada 10k propiedades

2. idx_properties_created_at
   - Optimiza: ORDER BY created_at DESC
   - Impacto: Sort por fecha (más recientes)
   - Tamaño estimado: ~500KB por cada 10k propiedades

3. idx_properties_user_id_price
   - Optimiza: ORDER BY price ASC/DESC WHERE user_id = X
   - Impacto: Sort por precio
   - Tamaño estimado: ~1MB por cada 10k propiedades

4. idx_properties_user_id_active_count
   - Optimiza: COUNT(*) WHERE user_id = X AND is_active = true
   - Impacto: Contador de propiedades activas
   - Tamaño estimado: ~500KB por cada 10k propiedades

CAMPOS DE PRIVACIDAD:
- show_phone_public: DEFAULT false (opt-in para privacidad)
- show_address_public: DEFAULT false (opt-in para privacidad)

PERFORMANCE ESPERADA:
- Sin índices: ~500-1000ms para 10k propiedades
- Con índices: ~10-50ms para 10k propiedades
- Mejora: 10-100x más rápido

MANTENIMIENTO:
- Los índices se actualizan automáticamente
- Ejecutar ANALYZE periódicamente (semanal)
- Monitorear tamaño con pg_indexes
*/
