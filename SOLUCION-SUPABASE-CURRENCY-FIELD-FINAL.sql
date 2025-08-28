-- SOLUCIÓN DEFINITIVA PARA EL PROBLEMA DEL CAMPO CURRENCY
-- Este script asegura que la tabla properties tenga el campo currency
-- y crea una vista Property si es necesaria

-- 1. VERIFICAR SI LA TABLA properties EXISTE Y TIENE EL CAMPO currency
DO $$
BEGIN
    -- Verificar si la tabla properties existe
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'properties') THEN
        -- Verificar si el campo currency existe en la tabla properties
        IF NOT EXISTS (SELECT FROM information_schema.columns 
                      WHERE table_name = 'properties' AND column_name = 'currency') THEN
            -- Agregar el campo currency si no existe
            ALTER TABLE properties ADD COLUMN currency text NOT NULL DEFAULT 'ARS';
            RAISE NOTICE 'Campo currency agregado a la tabla properties';
        ELSE
            RAISE NOTICE 'Campo currency ya existe en la tabla properties';
        END IF;
    ELSE
        RAISE NOTICE 'La tabla properties no existe';
    END IF;
END $$;

-- 2. VERIFICAR SI LA TABLA Property (con mayúscula) EXISTE
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'Property') THEN
        -- Verificar si el campo currency existe en la tabla Property
        IF NOT EXISTS (SELECT FROM information_schema.columns 
                      WHERE table_name = 'Property' AND column_name = 'currency') THEN
            -- Agregar el campo currency si no existe
            ALTER TABLE "Property" ADD COLUMN currency text NOT NULL DEFAULT 'ARS';
            RAISE NOTICE 'Campo currency agregado a la tabla Property';
        ELSE
            RAISE NOTICE 'Campo currency ya existe en la tabla Property';
        END IF;
    ELSE
        RAISE NOTICE 'La tabla Property no existe';
    END IF;
END $$;

-- 3. CREAR VISTA Property SI LA TABLA properties EXISTE PERO Property NO
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'properties') 
       AND NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'Property') THEN
        
        -- Crear vista Property que mapee a la tabla properties
        CREATE OR REPLACE VIEW "Property" AS
        SELECT 
            id,
            title,
            description,
            price,
            currency,
            "oldPrice",
            bedrooms,
            bathrooms,
            garages,
            area,
            "lotArea",
            address,
            city,
            province,
            "postalCode",
            latitude,
            longitude,
            "propertyType",
            status,
            images,
            "virtualTourUrl",
            amenities,
            features,
            "yearBuilt",
            floor,
            "totalFloors",
            featured,
            "expiresAt",
            "highlightedUntil",
            "isPaid",
            "createdAt",
            "updatedAt",
            "userId",
            "agentId",
            deposit,
            mascotas,
            "expensasIncl",
            servicios
        FROM properties;
        
        RAISE NOTICE 'Vista Property creada exitosamente';
    END IF;
END $$;

-- 4. REFRESCAR EL SCHEMA CACHE DE PostgREST
NOTIFY pgrst, 'reload schema';

-- 5. MOSTRAR INFORMACIÓN FINAL
SELECT 
    'properties' as tabla,
    EXISTS(SELECT FROM information_schema.tables WHERE table_name = 'properties') as existe,
    EXISTS(SELECT FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'currency') as tiene_currency
UNION ALL
SELECT 
    'Property' as tabla,
    EXISTS(SELECT FROM information_schema.tables WHERE table_name = 'Property') as existe,
    EXISTS(SELECT FROM information_schema.columns WHERE table_name = 'Property' AND column_name = 'currency') as tiene_currency;
