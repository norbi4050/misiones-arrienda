-- =========================================
-- QA DATABASE PERFORMANCE CHECK - 2025
-- Filtros Avanzados: minArea, maxArea, amenities
-- =========================================

-- 1. CHECK EXISTING INDEXES ON Property TABLE
-- =========================================
SELECT
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'Property'
ORDER BY indexname;

-- 2. EXPLAIN ANALYZE: Area range + ordering
-- =========================================
-- This should use an index on 'area' column for efficient filtering
EXPLAIN ANALYZE
SELECT *
FROM "Property"
WHERE area >= 80 AND area <= 200
ORDER BY area DESC
LIMIT 12;

-- 3. EXPLAIN ANALYZE: Amenities search
-- =========================================
-- Check if amenities search uses appropriate index (GIN for JSON/JSONB or text search)
EXPLAIN ANALYZE
SELECT *
FROM "Property"
WHERE amenities ILIKE '%pool%'
ORDER BY created_at DESC
LIMIT 12;

-- 4. EXPLAIN ANALYZE: Province search with ordering
-- =========================================
-- Should use trigram index (pg_trgm) for efficient ILIKE search
EXPLAIN ANALYZE
SELECT *
FROM "Property"
WHERE province ILIKE '%mi%'
ORDER BY created_at DESC
LIMIT 12;

-- 5. EXPLAIN ANALYZE: Complex filter combination
-- =========================================
-- Test multiple filters together (area + amenities + province)
EXPLAIN ANALYZE
SELECT *
FROM "Property"
WHERE area >= 80
  AND area <= 200
  AND amenities ILIKE '%pool%'
  AND province ILIKE '%misiones%'
ORDER BY price ASC
LIMIT 12;

-- 6. EXPLAIN ANALYZE: Price range with bedrooms/bathrooms
-- =========================================
EXPLAIN ANALYZE
SELECT *
FROM "Property"
WHERE price >= 100000
  AND price <= 300000
  AND bedrooms >= 2
  AND bathrooms >= 1
ORDER BY price ASC
LIMIT 12;

-- 7. CHECK INDEX USAGE STATISTICS
-- =========================================
-- See which indexes are being used most
SELECT
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes
WHERE tablename = 'Property'
ORDER BY idx_scan DESC;

-- 8. CHECK TABLE STATISTICS
-- =========================================
-- General table statistics
SELECT
    schemaname,
    tablename,
    n_tup_ins,
    n_tup_upd,
    n_tup_del,
    n_live_tup,
    n_dead_tup
FROM pg_stat_user_tables
WHERE tablename = 'Property';

-- 9. RECOMMENDED INDEXES (if missing)
-- =========================================
-- Run these if indexes are missing for optimal performance:

-- Index for area column (if not exists)
-- CREATE INDEX IF NOT EXISTS idx_property_area ON "Property" (area);

-- Index for price column (if not exists)
-- CREATE INDEX IF NOT EXISTS idx_property_price ON "Property" (price);

-- Index for bedrooms column (if not exists)
-- CREATE INDEX IF NOT EXISTS idx_property_bedrooms ON "Property" (bedrooms);

-- Index for bathrooms column (if not exists)
-- CREATE INDEX IF NOT EXISTS idx_property_bathrooms ON "Property" (bathrooms);

-- Index for province with trigram (if not exists)
-- CREATE INDEX IF NOT EXISTS idx_property_province_trgm ON "Property" USING gin (province gin_trgm_ops);

-- Index for amenities (depending on column type)
-- If amenities is TEXT: CREATE INDEX IF NOT EXISTS idx_property_amenities_trgm ON "Property" USING gin (amenities gin_trgm_ops);
-- If amenities is JSONB: CREATE INDEX IF NOT EXISTS idx_property_amenities_gin ON "Property" USING gin (amenities);

-- Composite index for common filter combinations
-- CREATE INDEX IF NOT EXISTS idx_property_area_price ON "Property" (area, price);
-- CREATE INDEX IF NOT EXISTS idx_property_province_city ON "Property" (province, city);

-- 10. PERFORMANCE METRICS
-- =========================================
-- Query execution time comparison (run multiple times to get average)

-- Fast query (with proper indexes)
EXPLAIN (ANALYZE, BUFFERS)
SELECT COUNT(*) FROM "Property" WHERE area BETWEEN 80 AND 200;

-- Potentially slow query (without indexes)
EXPLAIN (ANALYZE, BUFFERS)
SELECT COUNT(*) FROM "Property" WHERE amenities ILIKE '%pool%';

-- Complex query performance
EXPLAIN (ANALYZE, BUFFERS)
SELECT *
FROM "Property"
WHERE area >= 80
  AND price <= 300000
  AND bedrooms >= 2
  AND province ILIKE '%misiones%'
ORDER BY created_at DESC
LIMIT 12;
