-- FIX FAVORITES DUPLICATE FOREIGN KEYS
-- Created: 2025-01-XX
-- Purpose: Remove duplicate foreign key constraints causing ambiguity in Supabase queries

-- PASO 1: Verificar las foreign keys existentes
SELECT 
    conname AS constraint_name,
    conrelid::regclass AS table_name,
    confrelid::regclass AS referenced_table,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'favorites'::regclass
  AND contype = 'f'
ORDER BY conname;

-- PASO 2: Eliminar las foreign keys duplicadas (mantener solo una)
-- Primero, eliminar las FKs antiguas/duplicadas
ALTER TABLE favorites DROP CONSTRAINT IF EXISTS "Favorite_propertyId_fkey";
ALTER TABLE favorites DROP CONSTRAINT IF EXISTS "favorite_propertyid_fkey";
ALTER TABLE favorites DROP CONSTRAINT IF EXISTS "fk_fav_prop";

-- PASO 3: Asegurarnos de que existe la FK correcta
-- Si no existe, crearla
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'favorites_property_id_fkey' 
        AND conrelid = 'favorites'::regclass
    ) THEN
        ALTER TABLE favorites 
        ADD CONSTRAINT favorites_property_id_fkey 
        FOREIGN KEY (property_id) 
        REFERENCES properties(id) 
        ON DELETE CASCADE;
    END IF;
END $$;

-- PASO 4: Verificar que solo queda una FK
SELECT 
    conname AS constraint_name,
    conrelid::regclass AS table_name,
    confrelid::regclass AS referenced_table,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'favorites'::regclass
  AND contype = 'f'
ORDER BY conname;

-- RESULTADO ESPERADO: Solo debe aparecer 'favorites_property_id_fkey'

COMMENT ON CONSTRAINT favorites_property_id_fkey ON favorites IS 
'Foreign key to properties table - cleaned up duplicate constraints on 2025-01-XX';
