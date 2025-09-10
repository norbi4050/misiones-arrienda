-- ===========================================
-- ÍNDICES DE OPTIMIZACIÓN PARA TABLA Property
-- Fecha: Enero 2025
-- Propósito: Optimización de consultas ILIKE y ordenamiento
-- ===========================================

-- Extensión pg_trgm para búsquedas de texto completo
create extension if not exists pg_trgm;

-- ===========================================
-- ÍNDICES GIN (TRGM) PARA BÚSQUEDAS ILIKE
-- ===========================================

-- Índice para búsquedas ILIKE en city (case-insensitive)
create index if not exists idx_property_city_trgm
  on public."Property" using gin (lower(city) gin_trgm_ops);

-- Índice para búsquedas ILIKE en province (case-insensitive)
create index if not exists idx_property_province_trgm
  on public."Property" using gin (lower(province) gin_trgm_ops);

-- ===========================================
-- ÍNDICES BTREE PARA ORDENAMIENTO Y FILTROS
-- ===========================================

-- Índice para ordenamiento por precio
create index if not exists idx_property_price
  on public."Property" (price);

-- Índice para ordenamiento por fecha de creación
create index if not exists idx_property_created_at
  on public."Property" (created_at);

-- Índice para ordenamiento por ID
create index if not exists idx_property_id
  on public."Property" (id);

-- ===========================================
-- ÍNDICES PARA FILTROS ADICIONALES
-- ===========================================

-- Índice para bedrooms (filtrado por cantidad de dormitorios)
create index if not exists idx_property_bedrooms
  on public."Property" (bedrooms);

-- Índice para bathrooms (filtrado por cantidad de baños)
create index if not exists idx_property_bathrooms
  on public."Property" (bathrooms);

-- Índice para propertyType (filtrado por tipo de propiedad)
create index if not exists idx_property_property_type
  on public."Property" (property_type);

-- ===========================================
-- ÍNDICE COMPUESTO PARA STATUS + ACTIVO
-- ===========================================

-- Índice parcial para propiedades publicadas y activas
-- Nota: Ajustar nombre de columna 'isActive' según esquema real
create index if not exists idx_property_published_active
  on public."Property" (status, isActive)
  where status = 'PUBLISHED' and isActive = true;

-- ===========================================
-- VERIFICACIÓN DE ÍNDICES CREADOS
-- ===========================================

-- Consulta para verificar índices creados
-- SELECT schemaname, tablename, indexname, indexdef
-- FROM pg_indexes
-- WHERE tablename = 'Property'
-- ORDER BY indexname;
