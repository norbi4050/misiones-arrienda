-- =====================================================
-- SUPABASE STORAGE SETUP - CONFIGURACIÓN COMPLETA
-- =====================================================
-- Ejecutar estos comandos en el SQL Editor de Supabase
-- Basado en auditoría de evidencias reales

-- =====================================================
-- 1. CREAR STORAGE BUCKETS (CRÍTICO)
-- =====================================================

-- Crear bucket para avatares de usuarios
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Crear bucket para imágenes de propiedades
INSERT INTO storage.buckets (id, name, public) 
VALUES ('properties', 'properties', true)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 2. STORAGE POLICIES - AVATARS (CRÍTICO)
-- =====================================================

-- Policy: Lectura pública de avatares
CREATE POLICY "Avatar images are publicly accessible" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'avatars');

-- Policy: Usuarios pueden subir su propio avatar
CREATE POLICY "Users can upload avatar" 
ON storage.objects FOR INSERT 
WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Usuarios pueden actualizar su propio avatar
CREATE POLICY "Users can update own avatar" 
ON storage.objects FOR UPDATE 
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Usuarios pueden eliminar su propio avatar
CREATE POLICY "Users can delete own avatar" 
ON storage.objects FOR DELETE 
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- =====================================================
-- 3. STORAGE POLICIES - PROPERTIES (CRÍTICO)
-- =====================================================

-- Policy: Lectura pública de imágenes de propiedades
CREATE POLICY "Property images are publicly accessible" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'properties');

-- Policy: Usuarios pueden subir imágenes de sus propiedades
CREATE POLICY "Users can upload property images" 
ON storage.objects FOR INSERT 
WITH CHECK (
  bucket_id = 'properties' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Usuarios pueden actualizar imágenes de sus propiedades
CREATE POLICY "Users can update own property images" 
ON storage.objects FOR UPDATE 
USING (
  bucket_id = 'properties' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Usuarios pueden eliminar imágenes de sus propiedades
CREATE POLICY "Users can delete own property images" 
ON storage.objects FOR DELETE 
USING (
  bucket_id = 'properties' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- =====================================================
-- 4. CREAR ENUMS FALTANTES (MEDIO)
-- =====================================================

-- Crear enum para status de propiedades
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'property_status') THEN
        CREATE TYPE property_status AS ENUM (
            'AVAILABLE',
            'SOLD', 
            'RENTED',
            'RESERVED',
            'EXPIRED',
            'DRAFT'
        );
    END IF;
END $$;

-- Crear enum para tipos de moneda
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'currency_type') THEN
        CREATE TYPE currency_type AS ENUM (
            'ARS',
            'USD',
            'EUR'
        );
    END IF;
END $$;

-- =====================================================
-- 5. VERIFICAR CONFIGURACIÓN (OPCIONAL)
-- =====================================================

-- Verificar buckets creados
SELECT id, name, public FROM storage.buckets 
WHERE id IN ('avatars', 'properties');

-- Verificar policies de storage
SELECT policyname, cmd, qual 
FROM storage.policies 
WHERE bucket_id IN ('avatars', 'properties')
ORDER BY bucket_id, cmd;

-- Verificar enums creados
SELECT t.typname, e.enumlabel 
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid 
WHERE t.typname IN ('property_status', 'currency_type', 'community_role')
ORDER BY t.typname, e.enumlabel;

-- =====================================================
-- 6. CONFIGURACIÓN ADICIONAL (OPCIONAL)
-- =====================================================

-- Configurar límites de tamaño para avatares (5MB)
UPDATE storage.buckets 
SET file_size_limit = 5242880 
WHERE id = 'avatars';

-- Configurar límites de tamaño para propiedades (10MB)
UPDATE storage.buckets 
SET file_size_limit = 10485760 
WHERE id = 'properties';

-- Configurar tipos de archivo permitidos para avatares
UPDATE storage.buckets 
SET allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp']
WHERE id = 'avatars';

-- Configurar tipos de archivo permitidos para propiedades
UPDATE storage.buckets 
SET allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp']
WHERE id = 'properties';

-- =====================================================
-- INSTRUCCIONES DE USO
-- =====================================================

/*
CÓMO EJECUTAR:

1. Ir a tu proyecto Supabase
2. Abrir SQL Editor
3. Copiar y pegar este script completo
4. Hacer clic en "Run"

ESTRUCTURA DE CARPETAS EN STORAGE:

avatars/
  └── {user_id}/
      └── avatar.jpg

properties/
  └── {user_id}/
      ├── property_1_image_1.jpg
      ├── property_1_image_2.jpg
      └── property_2_image_1.jpg

URLS DE EJEMPLO:

Avatar:
https://your-project.supabase.co/storage/v1/object/public/avatars/user-uuid/avatar.jpg

Property:
https://your-project.supabase.co/storage/v1/object/public/properties/user-uuid/property-image.jpg

TESTING:

Después de ejecutar, verificar que:
1. Los buckets aparecen en Storage > Buckets
2. Las policies aparecen en Storage > Policies  
3. Los enums se pueden usar en las tablas
4. El upload de imágenes funciona desde la aplicación
*/
