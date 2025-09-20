-- =====================================================
-- SOLUCIÓN DEFINITIVA: Agregar columna 'currency' faltante
-- Fecha: 18 de Enero 2025
-- Problema: Error 500 en /publicar por columna inexistente
-- =====================================================

-- Verificar si la columna 'currency' existe
DO $$
BEGIN
    -- Intentar agregar la columna 'currency' si no existe
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'Property' 
        AND column_name = 'currency'
        AND table_schema = 'public'
    ) THEN
        -- Agregar la columna 'currency' con valor por defecto 'ARS'
        ALTER TABLE "public"."Property" 
        ADD COLUMN "currency" TEXT DEFAULT 'ARS';
        
        -- Actualizar registros existentes para que tengan 'ARS' como moneda
        UPDATE "public"."Property" 
        SET "currency" = 'ARS' 
        WHERE "currency" IS NULL;
        
        RAISE NOTICE 'Columna currency agregada exitosamente a la tabla Property';
    ELSE
        RAISE NOTICE 'La columna currency ya existe en la tabla Property';
    END IF;
END $$;

-- Verificar que la columna se agregó correctamente
SELECT 
    column_name,
    data_type,
    column_default,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'Property' 
AND column_name = 'currency'
AND table_schema = 'public';

-- Mostrar algunas propiedades para verificar
SELECT 
    id,
    title,
    price,
    currency,
    city
FROM "public"."Property" 
LIMIT 5;
