-- =====================================================
-- SOLUCIÓN DEFINITIVA PARA PROBLEMAS POSTGREST SCHEMA CACHE
-- =====================================================
-- Este script soluciona los errores de "column not found" en PostgREST
-- causados por desincronización del schema cache

-- 1. REFRESCAR SCHEMA CACHE DE POSTGREST (CRÍTICO)
NOTIFY pgrst, 'reload schema';

-- 2. VERIFICAR TABLA properties Y SUS COLUMNAS
DO $$
BEGIN
    -- Mostrar todas las columnas de la tabla properties
    RAISE NOTICE '=== COLUMNAS EN TABLA properties ===';
    FOR rec IN 
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'properties'
        ORDER BY ordinal_position
    LOOP
        RAISE NOTICE 'Columna: % | Tipo: % | Nullable: % | Default: %', 
            rec.column_name, rec.data_type, rec.is_nullable, rec.column_default;
    END LOOP;
END $$;

-- 3. ASEGURAR QUE EXISTAN LAS COLUMNAS CRÍTICAS
DO $$
BEGIN
    -- Verificar y agregar currency si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'properties' AND column_name = 'currency'
    ) THEN
        ALTER TABLE properties ADD COLUMN currency text DEFAULT 'ARS';
        RAISE NOTICE 'Columna currency agregada';
    ELSE
        RAISE NOTICE 'Columna currency ya existe';
    END IF;

    -- Verificar y agregar createdAt si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'properties' AND column_name = 'createdAt'
    ) THEN
        ALTER TABLE properties ADD COLUMN "createdAt" timestamp DEFAULT NOW();
        RAISE NOTICE 'Columna createdAt agregada';
    ELSE
        RAISE NOTICE 'Columna createdAt ya existe';
    END IF;

    -- Verificar y agregar updatedAt si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'properties' AND column_name = 'updatedAt'
    ) THEN
        ALTER TABLE properties ADD COLUMN "updatedAt" timestamp DEFAULT NOW();
        RAISE NOTICE 'Columna updatedAt agregada';
    ELSE
        RAISE NOTICE 'Columna updatedAt ya existe';
    END IF;

    -- Verificar y agregar userId si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'properties' AND column_name = 'userId'
    ) THEN
        ALTER TABLE properties ADD COLUMN "userId" text;
        RAISE NOTICE 'Columna userId agregada';
    ELSE
        RAISE NOTICE 'Columna userId ya existe';
    END IF;

    -- Verificar y agregar propertyType si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'properties' AND column_name = 'propertyType'
    ) THEN
        ALTER TABLE properties ADD COLUMN "propertyType" text;
        RAISE NOTICE 'Columna propertyType agregada';
    ELSE
        RAISE NOTICE 'Columna propertyType ya existe';
    END IF;
END $$;

-- 4. CREAR TRIGGER PARA ACTUALIZAR updatedAt AUTOMÁTICAMENTE
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Eliminar trigger si existe y crearlo de nuevo
DROP TRIGGER IF EXISTS update_properties_updated_at ON properties;
CREATE TRIGGER update_properties_updated_at
    BEFORE UPDATE ON properties
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 5. CONFIGURAR PERMISOS PARA POSTGREST
-- Asegurar que la tabla sea accesible por PostgREST
GRANT ALL ON properties TO postgres;
GRANT ALL ON properties TO anon;
GRANT ALL ON properties TO authenticated;

-- 6. REFRESCAR SCHEMA CACHE NUEVAMENTE (CRÍTICO)
NOTIFY pgrst, 'reload schema';

-- 7. VERIFICACIÓN FINAL
SELECT 
    'VERIFICACIÓN FINAL' as status,
    COUNT(*) as total_columnas,
    string_agg(column_name, ', ' ORDER BY ordinal_position) as columnas_disponibles
FROM information_schema.columns 
WHERE table_name = 'properties';

-- 8. MOSTRAR INFORMACIÓN DE LA TABLA
SELECT 
    table_name,
    table_type,
    table_schema
FROM information_schema.tables 
WHERE table_name = 'properties';

RAISE NOTICE '=== SOLUCIÓN APLICADA ===';
RAISE NOTICE '1. Schema cache de PostgREST refrescado';
RAISE NOTICE '2. Columnas críticas verificadas/agregadas';
RAISE NOTICE '3. Triggers configurados';
RAISE NOTICE '4. Permisos establecidos';
RAISE NOTICE '5. Ahora puedes probar publicar una propiedad';
