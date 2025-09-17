-- =====================================================
-- FIX FAVORITES FOREIGN KEY RELATIONSHIP - 2025
-- =====================================================
-- Este script verifica y crea la relación FK entre favorites y properties
-- para solucionar errores 400 en consultas con relaciones anidadas

-- 1. Verificar si existe la tabla favorites
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'favorites') THEN
        -- Crear tabla favorites si no existe
        CREATE TABLE favorites (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            property_id UUID NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(user_id, property_id)
        );
        
        -- Habilitar RLS
        ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
        
        -- Política para que usuarios solo vean sus propios favoritos
        CREATE POLICY "Users can view own favorites" ON favorites
            FOR SELECT USING (auth.uid() = user_id);
            
        -- Política para que usuarios puedan insertar sus propios favoritos
        CREATE POLICY "Users can insert own favorites" ON favorites
            FOR INSERT WITH CHECK (auth.uid() = user_id);
            
        -- Política para que usuarios puedan eliminar sus propios favoritos
        CREATE POLICY "Users can delete own favorites" ON favorites
            FOR DELETE USING (auth.uid() = user_id);
            
        RAISE NOTICE 'Tabla favorites creada con políticas RLS';
    ELSE
        RAISE NOTICE 'Tabla favorites ya existe';
    END IF;
END $$;

-- 2. Verificar si existe la tabla properties
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'properties') THEN
        RAISE EXCEPTION 'La tabla properties no existe. Debe crearse primero.';
    ELSE
        RAISE NOTICE 'Tabla properties existe';
    END IF;
END $$;

-- 3. Verificar si existe la clave foránea entre favorites.property_id y properties.id
DO $$
BEGIN
    -- Verificar si la FK ya existe
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu 
            ON tc.constraint_name = kcu.constraint_name
        WHERE tc.table_name = 'favorites' 
            AND tc.constraint_type = 'FOREIGN KEY'
            AND kcu.column_name = 'property_id'
    ) THEN
        -- Agregar la clave foránea
        ALTER TABLE favorites 
        ADD CONSTRAINT fk_favorites_property_id 
        FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE;
        
        RAISE NOTICE 'Clave foránea favorites.property_id -> properties.id creada';
    ELSE
        RAISE NOTICE 'Clave foránea favorites.property_id -> properties.id ya existe';
    END IF;
END $$;

-- 4. Crear índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_property_id ON favorites(property_id);
CREATE INDEX IF NOT EXISTS idx_favorites_created_at ON favorites(created_at);

-- 5. Verificar que la relación funciona correctamente
DO $$
DECLARE
    test_result RECORD;
BEGIN
    -- Intentar hacer una consulta de prueba con la relación
    SELECT COUNT(*) as count INTO test_result
    FROM favorites f
    LEFT JOIN properties p ON f.property_id = p.id
    LIMIT 1;
    
    RAISE NOTICE 'Consulta de prueba con relación ejecutada correctamente';
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Error en consulta de prueba: %', SQLERRM;
END $$;

-- 6. Mostrar información de la tabla favorites
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'favorites'
ORDER BY ordinal_position;

-- 7. Mostrar las claves foráneas de la tabla favorites
SELECT
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name = 'favorites';

-- 8. Verificar políticas RLS
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
WHERE tablename = 'favorites';

RAISE NOTICE 'Script de corrección de favorites completado exitosamente';
