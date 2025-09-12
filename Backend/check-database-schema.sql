-- 1. Verificar qué tablas existen relacionadas con propiedades
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name ILIKE '%propert%'
ORDER BY table_name;

-- 2. Ver la estructura de la tabla de propiedades (ajusta el nombre según el resultado anterior)
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name IN ('Property', 'properties', 'Properties')
ORDER BY table_name, ordinal_position;

-- 3. Ver algunos registros de ejemplo para entender los datos
-- (Ejecuta solo UNA de estas según qué tabla exista)

-- Si la tabla se llama 'Property':
SELECT id, title, status, "propertyType", property_type, created_at, updated_at
FROM "Property" 
LIMIT 5;

-- Si la tabla se llama 'properties':
SELECT id, title, status, "propertyType", property_type, created_at, updated_at
FROM properties 
LIMIT 5;

-- 4. Ver qué valores de status existen
-- (Ejecuta solo UNA según qué tabla exista)

-- Para tabla 'Property':
SELECT DISTINCT status, COUNT(*) as count
FROM "Property" 
GROUP BY status;

-- Para tabla 'properties':
SELECT DISTINCT status, COUNT(*) as count
FROM properties 
GROUP BY status;
