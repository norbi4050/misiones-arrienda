-- =====================================================
-- DIAGNÓSTICO COMPLETO DEL PROBLEMA CURRENCY FIELD
-- =====================================================
-- Este script diagnostica si el problema viene de Supabase
-- y proporciona información detallada para solucionarlo

-- 1. VERIFICAR QUÉ TABLAS EXISTEN (Property vs properties)
SELECT 
    'TABLAS EXISTENTES' as diagnostico,
    table_schema,
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_name IN ('Property', 'properties')
ORDER BY table_name;

-- 2. VERIFICAR COLUMNAS EN AMBAS TABLAS (si existen)
SELECT 
    'COLUMNAS EN PROPERTY (mayúscula)' as diagnostico,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'Property'
ORDER BY ordinal_position;

SELECT 
    'COLUMNAS EN properties (minúscula)' as diagnostico,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'properties'
ORDER BY ordinal_position;

-- 3. BUSCAR ESPECÍFICAMENTE EL CAMPO CURRENCY
SELECT 
    'CAMPO CURRENCY - UBICACIÓN' as diagnostico,
    table_schema,
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE column_name = 'currency';

-- 4. VERIFICAR SI HAY VISTAS RELACIONADAS
SELECT 
    'VISTAS RELACIONADAS' as diagnostico,
    table_schema,
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_type = 'VIEW' 
AND (table_name LIKE '%Property%' OR table_name LIKE '%properties%');

-- 5. VERIFICAR PERMISOS EN LAS TABLAS
SELECT 
    'PERMISOS EN TABLAS' as diagnostico,
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE tablename IN ('Property', 'properties');

-- 6. CONTAR REGISTROS EN LAS TABLAS (si existen)
DO $$
DECLARE
    property_count INTEGER := 0;
    properties_count INTEGER := 0;
BEGIN
    -- Contar en Property (mayúscula)
    BEGIN
        EXECUTE 'SELECT COUNT(*) FROM "Property"' INTO property_count;
        RAISE NOTICE 'REGISTROS EN Property (mayúscula): %', property_count;
    EXCEPTION
        WHEN undefined_table THEN
            RAISE NOTICE 'TABLA Property (mayúscula) NO EXISTE';
    END;
    
    -- Contar en properties (minúscula)
    BEGIN
        EXECUTE 'SELECT COUNT(*) FROM properties' INTO properties_count;
        RAISE NOTICE 'REGISTROS EN properties (minúscula): %', properties_count;
    EXCEPTION
        WHEN undefined_table THEN
            RAISE NOTICE 'TABLA properties (minúscula) NO EXISTE';
    END;
END $$;

-- 7. VERIFICAR ESTRUCTURA ESPECÍFICA DE LA TABLA QUE EXISTE
DO $$
DECLARE
    table_exists BOOLEAN := FALSE;
    table_name_to_check TEXT;
BEGIN
    -- Verificar cuál tabla existe
    SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'properties') INTO table_exists;
    
    IF table_exists THEN
        table_name_to_check := 'properties';
        RAISE NOTICE '=== ESTRUCTURA DE LA TABLA properties (minúscula) ===';
        
        -- Mostrar estructura completa
        FOR rec IN 
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = 'properties'
            ORDER BY ordinal_position
        LOOP
            RAISE NOTICE 'Columna: % | Tipo: % | Nullable: % | Default: %', 
                rec.column_name, rec.data_type, rec.is_nullable, rec.column_default;
        END LOOP;
    ELSE
        SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'Property') INTO table_exists;
        
        IF table_exists THEN
            table_name_to_check := 'Property';
            RAISE NOTICE '=== ESTRUCTURA DE LA TABLA Property (mayúscula) ===';
            
            -- Mostrar estructura completa
            FOR rec IN 
                SELECT column_name, data_type, is_nullable, column_default
                FROM information_schema.columns 
                WHERE table_name = 'Property'
                ORDER BY ordinal_position
            LOOP
                RAISE NOTICE 'Columna: % | Tipo: % | Nullable: % | Default: %', 
                    rec.column_name, rec.data_type, rec.is_nullable, rec.column_default;
            END LOOP;
        ELSE
            RAISE NOTICE 'NO EXISTE NINGUNA TABLA DE PROPIEDADES';
        END IF;
    END IF;
END $$;

-- 8. VERIFICAR CONFIGURACIÓN DE POSTGREST
SELECT 
    'CONFIGURACIÓN POSTGREST' as diagnostico,
    name,
    setting,
    context
FROM pg_settings 
WHERE name LIKE '%postgrest%' OR name LIKE '%api%';

-- 9. CREAR TABLA Y CAMPO SI NO EXISTEN (SOLUCIÓN AUTOMÁTICA)
DO $$
BEGIN
    -- Si no existe la tabla properties, crearla
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'properties') THEN
        -- Si existe Property (mayúscula), crear vista
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'Property') THEN
            RAISE NOTICE 'CREANDO VISTA properties desde tabla Property';
            CREATE OR REPLACE VIEW properties AS SELECT * FROM "Property";
        ELSE
            RAISE NOTICE 'CREANDO TABLA properties desde cero';
            CREATE TABLE properties (
                id SERIAL PRIMARY KEY,
                title TEXT NOT NULL,
                description TEXT,
                price NUMERIC NOT NULL,
                currency TEXT NOT NULL DEFAULT 'ARS',
                city TEXT NOT NULL,
                address TEXT,
                deposit NUMERIC DEFAULT 0,
                "userId" TEXT,
                "createdAt" TIMESTAMP DEFAULT NOW(),
                "updatedAt" TIMESTAMP DEFAULT NOW()
            );
        END IF;
    END IF;
    
    -- Verificar y agregar campo currency si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'properties' AND column_name = 'currency'
    ) THEN
        RAISE NOTICE 'AGREGANDO CAMPO currency a tabla properties';
        ALTER TABLE properties ADD COLUMN currency TEXT NOT NULL DEFAULT 'ARS';
    ELSE
        RAISE NOTICE 'CAMPO currency YA EXISTE en tabla properties';
    END IF;
    
END $$;

-- 10. REFRESCAR SCHEMA CACHE DE POSTGREST
NOTIFY pgrst, 'reload schema';

-- 11. VERIFICACIÓN FINAL
SELECT 
    'VERIFICACIÓN FINAL' as diagnostico,
    'Campo currency existe en properties: ' || 
    CASE WHEN EXISTS(
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'properties' AND column_name = 'currency'
    ) THEN 'SÍ' ELSE 'NO' END as resultado;

-- 12. MOSTRAR RESUMEN FINAL
SELECT 
    'RESUMEN FINAL' as diagnostico,
    COUNT(*) as total_columnas
FROM information_schema.columns 
WHERE table_name = 'properties';

RAISE NOTICE '=== DIAGNÓSTICO COMPLETADO ===';
RAISE NOTICE 'Ejecuta este script en tu dashboard de Supabase';
RAISE NOTICE 'Revisa los mensajes de NOTICE para ver los resultados';
