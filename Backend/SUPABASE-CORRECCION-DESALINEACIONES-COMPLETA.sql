-- =====================================================
-- CORRECCIÓN COMPLETA DE DESALINEACIONES CÓDIGO ↔ SUPABASE
-- =====================================================
-- Ejecutar en Supabase SQL Editor para corregir todas las desalineaciones detectadas

-- =====================================================
-- 1. AGREGAR CAMPOS DE CONTACTO A PROPERTIES (PRIORIDAD ALTA)
-- =====================================================

-- Verificar si las columnas ya existen antes de agregarlas
DO $$
BEGIN
    -- Agregar contact_name si no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'properties' AND column_name = 'contact_name') THEN
        ALTER TABLE properties ADD COLUMN contact_name TEXT;
    END IF;
    
    -- Agregar contact_phone si no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'properties' AND column_name = 'contact_phone') THEN
        ALTER TABLE properties ADD COLUMN contact_phone TEXT NOT NULL DEFAULT '';
    END IF;
    
    -- Agregar contact_email si no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'properties' AND column_name = 'contact_email') THEN
        ALTER TABLE properties ADD COLUMN contact_email TEXT;
    END IF;
    
    -- Agregar province si no existe (para alinear con API que usa 'state')
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'properties' AND column_name = 'province') THEN
        ALTER TABLE properties ADD COLUMN province TEXT;
    END IF;
    
    -- Agregar country si no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'properties' AND column_name = 'country') THEN
        ALTER TABLE properties ADD COLUMN country TEXT DEFAULT 'Argentina';
    END IF;
END $$;

-- =====================================================
-- 2. CREAR ENUMS FALTANTES (PRIORIDAD MEDIA)
-- =====================================================

-- Crear enum pet_pref si no existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'pet_pref') THEN
        CREATE TYPE pet_pref AS ENUM ('SI_PET', 'NO_PET', 'INDIFERENTE');
    END IF;
END $$;

-- Crear enum smoke_pref si no existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'smoke_pref') THEN
        CREATE TYPE smoke_pref AS ENUM ('FUMADOR', 'NO_FUMADOR', 'INDIFERENTE');
    END IF;
END $$;

-- Crear enum diet si no existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'diet') THEN
        CREATE TYPE diet AS ENUM ('NINGUNA', 'VEGETARIANO', 'VEGANO', 'CELIACO', 'OTRO');
    END IF;
END $$;

-- Crear enum room_type si no existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'room_type') THEN
        CREATE TYPE room_type AS ENUM ('PRIVADA', 'COMPARTIDA', 'ESTUDIO');
    END IF;
END $$;

-- =====================================================
-- 3. VERIFICAR Y CREAR STORAGE POLICIES (PRIORIDAD ALTA)
-- =====================================================

-- Verificar si las policies de storage existen y crearlas si no
DO $$
BEGIN
    -- Policy para lectura pública de avatars
    IF NOT EXISTS (
        SELECT 1 FROM storage.policies 
        WHERE bucket_id = 'avatars' AND name = 'Avatar images are publicly accessible'
    ) THEN
        CREATE POLICY "Avatar images are publicly accessible" ON storage.objects
        FOR SELECT USING (bucket_id = 'avatars');
    END IF;
    
    -- Policy para escritura de avatars por usuario
    IF NOT EXISTS (
        SELECT 1 FROM storage.policies 
        WHERE bucket_id = 'avatars' AND name = 'Users can upload avatar'
    ) THEN
        CREATE POLICY "Users can upload avatar" ON storage.objects
        FOR INSERT WITH CHECK (
            bucket_id = 'avatars' AND 
            auth.uid()::text = (storage.foldername(name))[1]
        );
    END IF;
    
    -- Policy para lectura pública de property-images
    IF NOT EXISTS (
        SELECT 1 FROM storage.policies 
        WHERE bucket_id = 'property-images' AND name = 'Property images are publicly accessible'
    ) THEN
        CREATE POLICY "Property images are publicly accessible" ON storage.objects
        FOR SELECT USING (bucket_id = 'property-images');
    END IF;
    
    -- Policy para escritura de property-images por usuario
    IF NOT EXISTS (
        SELECT 1 FROM storage.policies 
        WHERE bucket_id = 'property-images' AND name = 'Users can upload property images'
    ) THEN
        CREATE POLICY "Users can upload property images" ON storage.objects
        FOR INSERT WITH CHECK (
            bucket_id = 'property-images' AND 
            auth.uid()::text = (storage.foldername(name))[1]
        );
    END IF;
    
    -- Policy para lectura pública de profile-images
    IF NOT EXISTS (
        SELECT 1 FROM storage.policies 
        WHERE bucket_id = 'profile-images' AND name = 'Profile images are publicly accessible'
    ) THEN
        CREATE POLICY "Profile images are publicly accessible" ON storage.objects
        FOR SELECT USING (bucket_id = 'profile-images');
    END IF;
    
    -- Policy para escritura de profile-images por usuario
    IF NOT EXISTS (
        SELECT 1 FROM storage.policies 
        WHERE bucket_id = 'profile-images' AND name = 'Users can upload profile images'
    ) THEN
        CREATE POLICY "Users can upload profile images" ON storage.objects
        FOR INSERT WITH CHECK (
            bucket_id = 'profile-images' AND 
            auth.uid()::text = (storage.foldername(name))[1]
        );
    END IF;
    
    -- Policy para lectura pública de community-images
    IF NOT EXISTS (
        SELECT 1 FROM storage.policies 
        WHERE bucket_id = 'community-images' AND name = 'Community images are publicly accessible'
    ) THEN
        CREATE POLICY "Community images are publicly accessible" ON storage.objects
        FOR SELECT USING (bucket_id = 'community-images');
    END IF;
    
    -- Policy para escritura de community-images por usuario
    IF NOT EXISTS (
        SELECT 1 FROM storage.policies 
        WHERE bucket_id = 'community-images' AND name = 'Users can upload community images'
    ) THEN
        CREATE POLICY "Users can upload community images" ON storage.objects
        FOR INSERT WITH CHECK (
            bucket_id = 'community-images' AND 
            auth.uid()::text = (storage.foldername(name))[1]
        );
    END IF;
END $$;

-- =====================================================
-- 4. CREAR AGENT POR DEFECTO (PRIORIDAD ALTA)
-- =====================================================

-- Crear un agente por defecto para evitar errores en properties
INSERT INTO agents (id, name, email, phone, license, created_at, updated_at)
VALUES (
    'default-agent-001',
    'Agente por Defecto',
    'agente@misionesarrienda.com',
    '+54 376 123-4567',
    'LIC-DEFAULT-001',
    NOW(),
    NOW()
)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 5. VERIFICACIONES Y REPORTES
-- =====================================================

-- Mostrar resumen de campos agregados a properties
SELECT 
    'CAMPOS AGREGADOS A PROPERTIES' as tipo,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'properties' 
AND column_name IN ('contact_name', 'contact_phone', 'contact_email', 'province', 'country')
ORDER BY column_name;

-- Mostrar enums creados
SELECT 
    'ENUMS CREADOS' as tipo,
    typname as enum_name,
    array_agg(enumlabel ORDER BY enumsortorder) as valores
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
WHERE typname IN ('pet_pref', 'smoke_pref', 'diet', 'room_type')
GROUP BY typname
ORDER BY typname;

-- Mostrar policies de storage creadas
SELECT 
    'STORAGE POLICIES CREADAS' as tipo,
    bucket_id,
    name as policy_name,
    cmd as command_type
FROM storage.policies 
WHERE bucket_id IN ('avatars', 'property-images', 'profile-images', 'community-images')
ORDER BY bucket_id, name;

-- Verificar agente por defecto
SELECT 
    'AGENTE POR DEFECTO' as tipo,
    id,
    name,
    email,
    license
FROM agents 
WHERE id = 'default-agent-001';

-- =====================================================
-- 6. MENSAJE FINAL
-- =====================================================

SELECT 
    '✅ CORRECCIÓN COMPLETA FINALIZADA' as status,
    'Todas las desalineaciones críticas han sido corregidas' as mensaje,
    NOW() as timestamp;
