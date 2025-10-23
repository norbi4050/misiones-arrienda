-- Diagnóstico completo del error en /api/admin/reports

-- 1. Verificar estructura de la tabla property_reports
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'property_reports'
ORDER BY ordinal_position;

-- 2. Contar reportes por status
SELECT status, COUNT(*) as count
FROM property_reports
GROUP BY status
ORDER BY count DESC;

-- 3. Ver algunos reportes con sus relaciones
SELECT
  pr.id,
  pr.property_id,
  pr.reporter_id,
  pr.reason,
  pr.status,
  pr.created_at,
  -- Verificar si existe la propiedad
  CASE WHEN p.id IS NOT NULL THEN 'EXISTS' ELSE 'MISSING' END as property_exists,
  -- Verificar si existe el reporter
  CASE WHEN u.id IS NOT NULL THEN 'EXISTS' ELSE 'MISSING' END as reporter_exists
FROM property_reports pr
LEFT JOIN "Property" p ON pr.property_id = p.id
LEFT JOIN "User" u ON pr.reporter_id = u.id
LIMIT 5;

-- 4. Buscar reportes con property_id NULL o reporter_id NULL
SELECT
  COUNT(*) as reportes_con_problemas,
  SUM(CASE WHEN property_id IS NULL THEN 1 ELSE 0 END) as sin_property_id,
  SUM(CASE WHEN reporter_id IS NULL THEN 1 ELSE 0 END) as sin_reporter_id
FROM property_reports;

-- 5. Buscar reportes huérfanos (sin propiedad o sin reporter)
SELECT
  pr.id,
  pr.property_id,
  pr.reporter_id,
  pr.reason,
  pr.status,
  CASE
    WHEN p.id IS NULL THEN 'Propiedad eliminada'
    WHEN u.id IS NULL THEN 'Usuario eliminado'
    ELSE 'OK'
  END as problema
FROM property_reports pr
LEFT JOIN "Property" p ON pr.property_id = p.id
LEFT JOIN "User" u ON pr.reporter_id = u.id
WHERE p.id IS NULL OR u.id IS NULL;

-- 6. Verificar tipos de datos en las FK
SELECT
  'property_reports.property_id' as columna,
  pg_typeof(property_id) as tipo
FROM property_reports
LIMIT 1;

SELECT
  'property_reports.reporter_id' as columna,
  pg_typeof(reporter_id) as tipo
FROM property_reports
LIMIT 1;

SELECT
  'Property.id' as columna,
  pg_typeof(id) as tipo
FROM "Property"
LIMIT 1;

SELECT
  'User.id' as columna,
  pg_typeof(id) as tipo
FROM "User"
LIMIT 1;
