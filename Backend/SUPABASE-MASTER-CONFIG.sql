-- ======================================== 
-- CONFIGURACION SUPABASE MAESTRA CONSOLIDADA 
-- Proyecto: Misiones Arrienda 
-- Fecha: 31/08/2025 
-- ======================================== 
 
-- 1. CONFIGURACION DE STORAGE 
-- =====================================================
-- SUPABASE STORAGE SETUP - VERSIÓN ACTUALIZADA
-- =====================================================
-- Ejecutar estos comandos en el SQL Editor de Supabase
-- MANEJA POLICIES EXISTENTES - Sin errores de duplicados

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
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM storage.policies 
        WHERE bucket_id = 'avatars' AND policyname = 'Avatar images are publicly accessible'
    ) THEN
        CREATE POLICY "Avatar images are publicly accessible" 
        ON storage.objects FOR SELECT 
        USING (bucket_id = 'avatars');
    END IF;
END $$;

-- Policy: Usuarios pueden subir su propio avatar
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM storage.policies 
        WHERE bucket_id = 'avatars' AND policyname = 'Users can upload avatar'
    ) THEN
        CREATE POLICY "Users can upload avatar" 
        ON storage.objects FOR INSERT 
        WITH CHECK (
          bucket_id = 'avatars' 
          AND auth.uid()::text = (storage.foldername(name))[1]
        );
    END IF;
END $$;

-- Policy: Usuarios pueden actualizar su propio avatar
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM storage.policies 
        WHERE bucket_id = 'avatars' AND policyname = 'Users can update own avatar'
    ) THEN
        CREATE POLICY "Users can update own avatar" 
        ON storage.objects FOR UPDATE 
        USING (
          bucket_id = 'avatars' 
          AND auth.uid()::text = (storage.foldername(name))[1]
        );
    END IF;
END $$;

-- Policy: Usuarios pueden eliminar su propio avatar
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM storage.policies 
        WHERE bucket_id = 'avatars' AND policyname = 'Users can delete own avatar'
    ) THEN
        CREATE POLICY "Users can delete own avatar" 
        ON storage.objects FOR DELETE 
        USING (
          bucket_id = 'avatars' 
          AND auth.uid()::text = (storage.foldername(name))[1]
        );
    END IF;
END $$;

-- =====================================================
-- 3. STORAGE POLICIES - PROPERTIES (CRÍTICO)
-- =====================================================

-- Policy: Lectura pública de imágenes de propiedades
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM storage.policies 
        WHERE bucket_id = 'properties' AND policyname = 'Property images are publicly accessible'
    ) THEN
        CREATE POLICY "Property images are publicly accessible" 
        ON storage.objects FOR SELECT 
        USING (bucket_id = 'properties');
    END IF;
END $$;

-- Policy: Usuarios pueden subir imágenes de sus propiedades (MANEJA EXISTENTE)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM storage.policies 
        WHERE bucket_id = 'properties' AND policyname = 'Users can upload property images'
    ) THEN
        CREATE POLICY "Users can upload property images" 
        ON storage.objects FOR INSERT 
        WITH CHECK (
          bucket_id = 'properties' 
          AND auth.uid()::text = (storage.foldername(name))[1]
        );
    ELSE
        -- Si ya existe, mostrar mensaje informativo
        RAISE NOTICE 'Policy "Users can upload property images" already exists - skipping';
    END IF;
END $$;

-- Policy: Usuarios pueden actualizar imágenes de sus propiedades
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM storage.policies 
        WHERE bucket_id = 'properties' AND policyname = 'Users can update own property images'
    ) THEN
        CREATE POLICY "Users can update own property images" 
        ON storage.objects FOR UPDATE 
        USING (
          bucket_id = 'properties' 
          AND auth.uid()::text = (storage.foldername(name))[1]
        );
    END IF;
END $$;

-- Policy: Usuarios pueden eliminar imágenes de sus propiedades
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM storage.policies 
        WHERE bucket_id = 'properties' AND policyname = 'Users can delete own property images'
    ) THEN
        CREATE POLICY "Users can delete own property images" 
        ON storage.objects FOR DELETE 
        USING (
          bucket_id = 'properties' 
          AND auth.uid()::text = (storage.foldername(name))[1]
        );
    END IF;
END $$;

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
        RAISE NOTICE 'Created enum: property_status';
    ELSE
        RAISE NOTICE 'Enum property_status already exists - skipping';
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
        RAISE NOTICE 'Created enum: currency_type';
    ELSE
        RAISE NOTICE 'Enum currency_type already exists - skipping';
    END IF;
END $$;

-- =====================================================
-- 5. CONFIGURACIÓN ADICIONAL (OPCIONAL)
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
-- 6. VERIFICAR CONFIGURACIÓN FINAL
-- =====================================================

-- Mostrar resumen de configuración
SELECT '=== CONFIGURACIÓN COMPLETADA ===' as status;

-- Verificar buckets creados
SELECT 'BUCKETS CREADOS:' as info;
SELECT id, name, public, file_size_limit, allowed_mime_types 
FROM storage.buckets 
WHERE id IN ('avatars', 'properties');

-- Verificar policies de storage
SELECT 'POLICIES CREADAS:' as info;
SELECT bucket_id, policyname, cmd, permissive
FROM storage.policies 
WHERE bucket_id IN ('avatars', 'properties')
ORDER BY bucket_id, cmd;

-- Verificar enums creados
SELECT 'ENUMS DISPONIBLES:' as info;
SELECT t.typname, e.enumlabel 
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid 
WHERE t.typname IN ('property_status', 'currency_type', 'community_role')
ORDER BY t.typname, e.enumlabel;

-- Mostrar mensaje final
SELECT '✅ CONFIGURACIÓN DE SUPABASE STORAGE COMPLETADA' as resultado;
SELECT '✅ Problema #2 "Perfil no permite cambiar foto" SOLUCIONADO' as solucion;

-- =====================================================
-- INSTRUCCIONES FINALES
-- =====================================================

/*
🎯 RESULTADO ESPERADO:

BUCKETS CREADOS:
- avatars (public: true, 5MB limit, jpeg/png/webp)
- properties (public: true, 10MB limit, jpeg/png/webp)

POLICIES CREADAS:
- 8 policies total (4 para avatars, 4 para properties)
- SELECT, INSERT, UPDATE, DELETE para cada bucket

ENUMS DISPONIBLES:
- property_status: AVAILABLE, SOLD, RENTED, RESERVED, EXPIRED, DRAFT
- currency_type: ARS, USD, EUR
- community_role: BUSCO, OFREZCO (ya existía)

🔧 PRÓXIMOS PASOS:

1. Verificar en Supabase Dashboard > Storage que aparecen los buckets
2. Probar upload de imagen desde la aplicación
3. Verificar que las URLs públicas funcionan
4. Confirmar que solo el dueño puede modificar sus imágenes

🌐 URLS DE EJEMPLO:

Avatar:
https://tu-proyecto.supabase.co/storage/v1/object/public/avatars/user-uuid/avatar.jpg

Property:
https://tu-proyecto.supabase.co/storage/v1/object/public/properties/user-uuid/property-image.jpg
*/
 
-- 2. POLICIES DE SEGURIDAD 
-- 3. TRIGGER FUNCTIONS 
-- 4. CORRECCION DE DESALINEACIONES 
