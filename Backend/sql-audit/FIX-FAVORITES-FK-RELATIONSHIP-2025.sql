-- =====================================================
-- FIX FAVORITES FK RELATIONSHIP 2025
-- =====================================================
-- Solución para el error 500 en /api/favorites:
-- "Could not find a relationship between 'favorites' and 'properties'"
--
-- Este script crea la foreign key necesaria para que PostgREST
-- pueda hacer el join automático en las consultas con .select('*, properties(*)')
-- =====================================================

-- 1. Verificar si la FK ya existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'Favorite_propertyId_fkey'
        AND table_name = 'favorites'
    ) THEN
        -- 2. Crear la foreign key si no existe
        ALTER TABLE favorites
        ADD CONSTRAINT Favorite_propertyId_fkey
        FOREIGN KEY (property_id)
        REFERENCES properties(id)
        ON DELETE CASCADE;
        
        RAISE NOTICE 'Foreign key Favorite_propertyId_fkey creada exitosamente';
    ELSE
        RAISE NOTICE 'Foreign key Favorite_propertyId_fkey ya existe';
    END IF;
END $$;

-- 3. Crear índice para mejorar performance de las consultas
CREATE INDEX IF NOT EXISTS idx_favorites_property_id 
ON favorites(property_id);

CREATE INDEX IF NOT EXISTS idx_favorites_user_id 
ON favorites(user_id);

-- 4. Verificar la relación
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name = 'favorites'
    AND kcu.column_name = 'property_id';

-- 5. Verificar que las políticas RLS estén correctas
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'favorites'
ORDER BY policyname;

COMMENT ON CONSTRAINT Favorite_propertyId_fkey ON favorites IS 
'Foreign key para permitir joins automáticos en PostgREST con .select(*, properties(*))';
