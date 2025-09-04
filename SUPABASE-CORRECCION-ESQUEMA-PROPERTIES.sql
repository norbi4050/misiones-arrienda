-- CORRECCIÓN 1: Esquema de Propiedades
-- Agregar columna 'location' faltante en tabla properties

-- Verificar si la columna existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'properties' AND column_name = 'location'
    ) THEN
        -- Agregar columna location
        ALTER TABLE properties ADD COLUMN location TEXT;
        RAISE NOTICE 'Columna location agregada exitosamente';
    ELSE
        RAISE NOTICE 'Columna location ya existe';
    END IF;
END $$;

-- Verificar otras columnas importantes
DO $$
BEGIN
    -- Verificar columna address
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'properties' AND column_name = 'address'
    ) THEN
        ALTER TABLE properties ADD COLUMN address TEXT;
        RAISE NOTICE 'Columna address agregada';
    END IF;

    -- Verificar columna city
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'properties' AND column_name = 'city'
    ) THEN
        ALTER TABLE properties ADD COLUMN city TEXT;
        RAISE NOTICE 'Columna city agregada';
    END IF;

    -- Verificar columna province
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'properties' AND column_name = 'province'
    ) THEN
        ALTER TABLE properties ADD COLUMN province TEXT DEFAULT 'Misiones';
        RAISE NOTICE 'Columna province agregada';
    END IF;
END $$;

-- Refrescar schema cache de PostgREST
SELECT pg_notify('pgrst', 'reload schema');

-- Verificar estructura final
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'properties' 
ORDER BY ordinal_position;