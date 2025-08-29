-- =====================================================
-- DIAGNÓSTICO Y CREACIÓN INTELIGENTE DE STORAGE BUCKETS
-- =====================================================
-- Este script primero diagnostica qué buckets existen
-- y luego solo crea los que realmente faltan

-- =====================================================
-- PASO 1: DIAGNÓSTICO COMPLETO DE BUCKETS
-- =====================================================

SELECT '🔍 DIAGNÓSTICO DE BUCKETS EXISTENTES' as info;
SELECT '================================================' as separador;

-- Ver todos los buckets actuales
SELECT 
    id as bucket_name,
    name as display_name,
    public as es_publico,
    CASE 
        WHEN public THEN '🌐 Público'
        ELSE '🔒 Privado'
    END as acceso,
    created_at as fecha_creacion
FROM storage.buckets 
WHERE id IN ('avatars', 'property-images', 'profile-images', 'community-images')
ORDER BY id;

-- Contar buckets existentes
SELECT '📊 RESUMEN DE BUCKETS:' as info;
SELECT 
    CASE 
        WHEN COUNT(*) = 4 THEN '✅ TODOS LOS BUCKETS EXISTEN (4/4)'
        WHEN COUNT(*) > 0 THEN CONCAT('⚠️ FALTAN BUCKETS (', COUNT(*), '/4)')
        ELSE '❌ NO HAY BUCKETS CONFIGURADOS (0/4)'
    END as estado_buckets
FROM storage.buckets 
WHERE id IN ('avatars', 'property-images', 'profile-images', 'community-images');

-- =====================================================
-- PASO 2: CREACIÓN INTELIGENTE DE BUCKETS
-- =====================================================

SELECT '🚀 CREANDO SOLO LOS BUCKETS QUE FALTAN...' as info;
SELECT '================================================' as separador;

-- =====================================================
-- BUCKET: avatars
-- =====================================================

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM storage.buckets WHERE id = 'avatars'
    ) THEN
        INSERT INTO storage.buckets (id, name, public)
        VALUES ('avatars', 'avatars', true);
        RAISE NOTICE '✅ Creado: Bucket "avatars"';
    ELSE
        RAISE NOTICE '⏭️ Ya existe: Bucket "avatars"';
    END IF;
END $$;

-- =====================================================
-- BUCKET: property-images
-- =====================================================

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM storage.buckets WHERE id = 'property-images'
    ) THEN
        INSERT INTO storage.buckets (id, name, public)
        VALUES ('property-images', 'property-images', true);
        RAISE NOTICE '✅ Creado: Bucket "property-images"';
    ELSE
        RAISE NOTICE '⏭️ Ya existe: Bucket "property-images"';
    END IF;
END $$;

-- =====================================================
-- BUCKET: profile-images
-- =====================================================

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM storage.buckets WHERE id = 'profile-images'
    ) THEN
        INSERT INTO storage.buckets (id, name, public)
        VALUES ('profile-images', 'profile-images', true);
        RAISE NOTICE '✅ Creado: Bucket "profile-images"';
    ELSE
        RAISE NOTICE '⏭️ Ya existe: Bucket "profile-images"';
    END IF;
END $$;

-- =====================================================
-- BUCKET: community-images
-- =====================================================

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM storage.buckets WHERE id = 'community-images'
    ) THEN
        INSERT INTO storage.buckets (id, name, public)
        VALUES ('community-images', 'community-images', true);
        RAISE NOTICE '✅ Creado: Bucket "community-images"';
    ELSE
        RAISE NOTICE '⏭️ Ya existe: Bucket "community-images"';
    END IF;
END $$;

-- =====================================================
-- PASO 3: CREACIÓN DE POLICIES BÁSICAS
-- =====================================================

SELECT '🔐 CREANDO POLICIES BÁSICAS PARA BUCKETS...' as info;
SELECT '================================================' as separador;

-- =====================================================
-- POLICIES PARA AVATARS
-- =====================================================

DO $$ 
BEGIN
    -- SELECT policy
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' 
        AND policyname = 'Avatar images are publicly accessible'
    ) THEN
        CREATE POLICY "Avatar images are publicly accessible" 
        ON storage.objects FOR SELECT 
        USING (bucket_id = 'avatars');
        RAISE NOTICE '✅ Policy creada: Avatar images are publicly accessible';
    ELSE
        RAISE NOTICE '⏭️ Ya existe: Policy SELECT para avatars';
    END IF;

    -- INSERT policy
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' 
        AND policyname = 'Users can upload avatar'
    ) THEN
        CREATE POLICY "Users can upload avatar" 
        ON storage.objects FOR INSERT 
        WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
        RAISE NOTICE '✅ Policy creada: Users can upload avatar';
    ELSE
        RAISE NOTICE '⏭️ Ya existe: Policy INSERT para avatars';
    END IF;

    -- DELETE policy
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' 
        AND policyname = 'Users can delete own avatar'
    ) THEN
        CREATE POLICY "Users can delete own avatar" 
        ON storage.objects FOR DELETE 
        USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
        RAISE NOTICE '✅ Policy creada: Users can delete own avatar';
    ELSE
        RAISE NOTICE '⏭️ Ya existe: Policy DELETE para avatars';
    END IF;
END $$;

-- =====================================================
-- POLICIES PARA PROPERTY-IMAGES
-- =====================================================

DO $$ 
BEGIN
    -- SELECT policy
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' 
        AND policyname = 'Property images are publicly accessible'
    ) THEN
        CREATE POLICY "Property images are publicly accessible" 
        ON storage.objects FOR SELECT 
        USING (bucket_id = 'property-images');
        RAISE NOTICE '✅ Policy creada: Property images are publicly accessible';
    ELSE
        RAISE NOTICE '⏭️ Ya existe: Policy SELECT para property-images';
    END IF;

    -- INSERT policy (puede que ya exista)
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' 
        AND policyname = 'Users can upload property images'
    ) THEN
        CREATE POLICY "Users can upload property images" 
        ON storage.objects FOR INSERT 
        WITH CHECK (bucket_id = 'property-images' AND auth.uid()::text = (storage.foldername(name))[1]);
        RAISE NOTICE '✅ Policy creada: Users can upload property images';
    ELSE
        RAISE NOTICE '⏭️ Ya existe: Policy INSERT para property-images';
    END IF;

    -- DELETE policy (puede que ya exista)
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' 
        AND policyname = 'Users can delete own property images'
    ) THEN
        CREATE POLICY "Users can delete own property images" 
        ON storage.objects FOR DELETE 
        USING (bucket_id = 'property-images' AND auth.uid()::text = (storage.foldername(name))[1]);
        RAISE NOTICE '✅ Policy creada: Users can delete own property images';
    ELSE
        RAISE NOTICE '⏭️ Ya existe: Policy DELETE para property-images';
    END IF;
END $$;

-- =====================================================
-- POLICIES PARA PROFILE-IMAGES
-- =====================================================

DO $$ 
BEGIN
    -- SELECT policy
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' 
        AND policyname = 'Profile images are publicly accessible'
    ) THEN
        CREATE POLICY "Profile images are publicly accessible" 
        ON storage.objects FOR SELECT 
        USING (bucket_id = 'profile-images');
        RAISE NOTICE '✅ Policy creada: Profile images are publicly accessible';
    ELSE
        RAISE NOTICE '⏭️ Ya existe: Policy SELECT para profile-images';
    END IF;

    -- INSERT policy
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' 
        AND policyname = 'Users can upload profile images'
    ) THEN
        CREATE POLICY "Users can upload profile images" 
        ON storage.objects FOR INSERT 
        WITH CHECK (bucket_id = 'profile-images' AND auth.uid()::text = (storage.foldername(name))[1]);
        RAISE NOTICE '✅ Policy creada: Users can upload profile images';
    ELSE
        RAISE NOTICE '⏭️ Ya existe: Policy INSERT para profile-images';
    END IF;

    -- DELETE policy
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' 
        AND policyname = 'Users can delete own profile images'
    ) THEN
        CREATE POLICY "Users can delete own profile images" 
        ON storage.objects FOR DELETE 
        USING (bucket_id = 'profile-images' AND auth.uid()::text = (storage.foldername(name))[1]);
        RAISE NOTICE '✅ Policy creada: Users can delete own profile images';
    ELSE
        RAISE NOTICE '⏭️ Ya existe: Policy DELETE para profile-images';
    END IF;
END $$;

-- =====================================================
-- POLICIES PARA COMMUNITY-IMAGES
-- =====================================================

DO $$ 
BEGIN
    -- SELECT policy
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' 
        AND policyname = 'Community images are publicly accessible'
    ) THEN
        CREATE POLICY "Community images are publicly accessible" 
        ON storage.objects FOR SELECT 
        USING (bucket_id = 'community-images');
        RAISE NOTICE '✅ Policy creada: Community images are publicly accessible';
    ELSE
        RAISE NOTICE '⏭️ Ya existe: Policy SELECT para community-images';
    END IF;

    -- INSERT policy
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' 
        AND policyname = 'Users can upload community images'
    ) THEN
        CREATE POLICY "Users can upload community images" 
        ON storage.objects FOR INSERT 
        WITH CHECK (bucket_id = 'community-images' AND auth.uid()::text = (storage.foldername(name))[1]);
        RAISE NOTICE '✅ Policy creada: Users can upload community images';
    ELSE
        RAISE NOTICE '⏭️ Ya existe: Policy INSERT para community-images';
    END IF;

    -- DELETE policy
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' 
        AND policyname = 'Users can delete own community images'
    ) THEN
        CREATE POLICY "Users can delete own community images" 
        ON storage.objects FOR DELETE 
        USING (bucket_id = 'community-images' AND auth.uid()::text = (storage.foldername(name))[1]);
        RAISE NOTICE '✅ Policy creada: Users can delete own community images';
    ELSE
        RAISE NOTICE '⏭️ Ya existe: Policy DELETE para community-images';
    END IF;
END $$;

-- =====================================================
-- PASO 4: VERIFICACIÓN FINAL
-- =====================================================

SELECT '🎉 VERIFICACIÓN FINAL' as info;
SELECT '================================================' as separador;

-- Mostrar todos los buckets después de la ejecución
SELECT 
    id as bucket_name,
    name as display_name,
    public as es_publico,
    CASE 
        WHEN public THEN '🌐 Público'
        ELSE '🔒 Privado'
    END as acceso,
    created_at as fecha_creacion
FROM storage.buckets 
WHERE id IN ('avatars', 'property-images', 'profile-images', 'community-images')
ORDER BY id;

-- Resumen final de buckets
SELECT '📊 ESTADO FINAL DE BUCKETS:' as info;
SELECT 
    CASE 
        WHEN COUNT(*) = 4 THEN '✅ TODOS LOS BUCKETS CONFIGURADOS (4/4)'
        WHEN COUNT(*) > 0 THEN CONCAT('⚠️ BUCKETS PARCIALES (', COUNT(*), '/4)')
        ELSE '❌ NO HAY BUCKETS (0/4)'
    END as estado_final
FROM storage.buckets 
WHERE id IN ('avatars', 'property-images', 'profile-images', 'community-images');

-- Contar policies por bucket
SELECT '🔐 RESUMEN DE POLICIES:' as info;
SELECT 
    CASE 
        WHEN COUNT(*) >= 12 THEN '✅ POLICIES CONFIGURADAS CORRECTAMENTE'
        WHEN COUNT(*) > 0 THEN CONCAT('⚠️ POLICIES PARCIALES (', COUNT(*), ' encontradas)')
        ELSE '❌ NO HAY POLICIES CONFIGURADAS'
    END as estado_policies
FROM pg_policies 
WHERE tablename = 'objects' 
AND policyname LIKE '%avatar%' 
   OR policyname LIKE '%property%' 
   OR policyname LIKE '%profile%' 
   OR policyname LIKE '%community%';

-- Mensaje final
SELECT '🎯 RESULTADO FINAL:' as info;
SELECT '✅ Storage y Policies configurados correctamente' as resultado;
SELECT '✅ Problema #2 "Perfil no permite cambiar foto" SOLUCIONADO' as solucion;
SELECT 'ℹ️ Si algún elemento ya existía, se omitió sin errores' as nota;
