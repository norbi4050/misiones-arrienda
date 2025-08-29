-- =====================================================
-- SOLO LAS POLICIES QUE FALTAN - SIN ERRORES
-- =====================================================
-- Script seguro que verifica antes de crear

-- =====================================================
-- VERIFICAR QUE POLICIES EXISTEN
-- =====================================================

-- Ver policies actuales
SELECT 'POLICIES ACTUALES:' as info;
SELECT bucket_id, policyname, cmd 
FROM storage.policies 
WHERE bucket_id IN ('avatars', 'property-images', 'profile-images', 'community-images')
ORDER BY bucket_id, cmd;

-- =====================================================
-- CREAR SOLO LAS POLICIES QUE FALTAN
-- =====================================================

-- AVATARS - Solo crear si no existe
DO $$ 
BEGIN
    -- Lectura pública
    IF NOT EXISTS (SELECT 1 FROM storage.policies WHERE bucket_id = 'avatars' AND policyname = 'Avatar images are publicly accessible') THEN
        CREATE POLICY "Avatar images are publicly accessible" 
        ON storage.objects FOR SELECT 
        USING (bucket_id = 'avatars');
        RAISE NOTICE 'Created: Avatar images are publicly accessible';
    END IF;

    -- Upload
    IF NOT EXISTS (SELECT 1 FROM storage.policies WHERE bucket_id = 'avatars' AND policyname = 'Users can upload avatar') THEN
        CREATE POLICY "Users can upload avatar" 
        ON storage.objects FOR INSERT 
        WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
        RAISE NOTICE 'Created: Users can upload avatar';
    END IF;

    -- Update
    IF NOT EXISTS (SELECT 1 FROM storage.policies WHERE bucket_id = 'avatars' AND policyname = 'Users can update own avatar') THEN
        CREATE POLICY "Users can update own avatar" 
        ON storage.objects FOR UPDATE 
        USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
        RAISE NOTICE 'Created: Users can update own avatar';
    END IF;

    -- Delete
    IF NOT EXISTS (SELECT 1 FROM storage.policies WHERE bucket_id = 'avatars' AND policyname = 'Users can delete own avatar') THEN
        CREATE POLICY "Users can delete own avatar" 
        ON storage.objects FOR DELETE 
        USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
        RAISE NOTICE 'Created: Users can delete own avatar';
    END IF;
END $$;

-- PROPERTY-IMAGES - Solo crear si no existe
DO $$ 
BEGIN
    -- Lectura pública
    IF NOT EXISTS (SELECT 1 FROM storage.policies WHERE bucket_id = 'property-images' AND policyname = 'Property images are publicly accessible') THEN
        CREATE POLICY "Property images are publicly accessible" 
        ON storage.objects FOR SELECT 
        USING (bucket_id = 'property-images');
        RAISE NOTICE 'Created: Property images are publicly accessible';
    END IF;

    -- Upload (esta ya existe según el error)
    IF NOT EXISTS (SELECT 1 FROM storage.policies WHERE bucket_id = 'property-images' AND policyname = 'Users can upload property images') THEN
        CREATE POLICY "Users can upload property images" 
        ON storage.objects FOR INSERT 
        WITH CHECK (bucket_id = 'property-images' AND auth.uid()::text = (storage.foldername(name))[1]);
        RAISE NOTICE 'Created: Users can upload property images';
    ELSE
        RAISE NOTICE 'Already exists: Users can upload property images';
    END IF;

    -- Update
    IF NOT EXISTS (SELECT 1 FROM storage.policies WHERE bucket_id = 'property-images' AND policyname = 'Users can update own property images') THEN
        CREATE POLICY "Users can update own property images" 
        ON storage.objects FOR UPDATE 
        USING (bucket_id = 'property-images' AND auth.uid()::text = (storage.foldername(name))[1]);
        RAISE NOTICE 'Created: Users can update own property images';
    END IF;

    -- Delete
    IF NOT EXISTS (SELECT 1 FROM storage.policies WHERE bucket_id = 'property-images' AND policyname = 'Users can delete own property images') THEN
        CREATE POLICY "Users can delete own property images" 
        ON storage.objects FOR DELETE 
        USING (bucket_id = 'property-images' AND auth.uid()::text = (storage.foldername(name))[1]);
        RAISE NOTICE 'Created: Users can delete own property images';
    END IF;
END $$;

-- PROFILE-IMAGES - Solo crear si no existe
DO $$ 
BEGIN
    -- Lectura pública
    IF NOT EXISTS (SELECT 1 FROM storage.policies WHERE bucket_id = 'profile-images' AND policyname = 'Profile images are publicly accessible') THEN
        CREATE POLICY "Profile images are publicly accessible" 
        ON storage.objects FOR SELECT 
        USING (bucket_id = 'profile-images');
        RAISE NOTICE 'Created: Profile images are publicly accessible';
    END IF;

    -- Upload
    IF NOT EXISTS (SELECT 1 FROM storage.policies WHERE bucket_id = 'profile-images' AND policyname = 'Users can upload profile images') THEN
        CREATE POLICY "Users can upload profile images" 
        ON storage.objects FOR INSERT 
        WITH CHECK (bucket_id = 'profile-images' AND auth.uid()::text = (storage.foldername(name))[1]);
        RAISE NOTICE 'Created: Users can upload profile images';
    END IF;

    -- Update
    IF NOT EXISTS (SELECT 1 FROM storage.policies WHERE bucket_id = 'profile-images' AND policyname = 'Users can update own profile images') THEN
        CREATE POLICY "Users can update own profile images" 
        ON storage.objects FOR UPDATE 
        USING (bucket_id = 'profile-images' AND auth.uid()::text = (storage.foldername(name))[1]);
        RAISE NOTICE 'Created: Users can update own profile images';
    END IF;

    -- Delete
    IF NOT EXISTS (SELECT 1 FROM storage.policies WHERE bucket_id = 'profile-images' AND policyname = 'Users can delete own profile images') THEN
        CREATE POLICY "Users can delete own profile images" 
        ON storage.objects FOR DELETE 
        USING (bucket_id = 'profile-images' AND auth.uid()::text = (storage.foldername(name))[1]);
        RAISE NOTICE 'Created: Users can delete own profile images';
    END IF;
END $$;

-- COMMUNITY-IMAGES - Solo crear si no existe
DO $$ 
BEGIN
    -- Lectura pública
    IF NOT EXISTS (SELECT 1 FROM storage.policies WHERE bucket_id = 'community-images' AND policyname = 'Community images are publicly accessible') THEN
        CREATE POLICY "Community images are publicly accessible" 
        ON storage.objects FOR SELECT 
        USING (bucket_id = 'community-images');
        RAISE NOTICE 'Created: Community images are publicly accessible';
    END IF;

    -- Upload
    IF NOT EXISTS (SELECT 1 FROM storage.policies WHERE bucket_id = 'community-images' AND policyname = 'Users can upload community images') THEN
        CREATE POLICY "Users can upload community images" 
        ON storage.objects FOR INSERT 
        WITH CHECK (bucket_id = 'community-images' AND auth.uid()::text = (storage.foldername(name))[1]);
        RAISE NOTICE 'Created: Users can upload community images';
    END IF;

    -- Update
    IF NOT EXISTS (SELECT 1 FROM storage.policies WHERE bucket_id = 'community-images' AND policyname = 'Users can update own community images') THEN
        CREATE POLICY "Users can update own community images" 
        ON storage.objects FOR UPDATE 
        USING (bucket_id = 'community-images' AND auth.uid()::text = (storage.foldername(name))[1]);
        RAISE NOTICE 'Created: Users can update own community images';
    END IF;

    -- Delete
    IF NOT EXISTS (SELECT 1 FROM storage.policies WHERE bucket_id = 'community-images' AND policyname = 'Users can delete own community images') THEN
        CREATE POLICY "Users can delete own community images" 
        ON storage.objects FOR DELETE 
        USING (bucket_id = 'community-images' AND auth.uid()::text = (storage.foldername(name))[1]);
        RAISE NOTICE 'Created: Users can delete own community images';
    END IF;
END $$;

-- =====================================================
-- VERIFICAR RESULTADO FINAL
-- =====================================================

SELECT 'POLICIES FINALES:' as info;
SELECT bucket_id, policyname, cmd 
FROM storage.policies 
WHERE bucket_id IN ('avatars', 'property-images', 'profile-images', 'community-images')
ORDER BY bucket_id, cmd;

-- Contar policies por bucket
SELECT 'RESUMEN POR BUCKET:' as info;
SELECT bucket_id, COUNT(*) as total_policies
FROM storage.policies 
WHERE bucket_id IN ('avatars', 'property-images', 'profile-images', 'community-images')
GROUP BY bucket_id
ORDER BY bucket_id;

SELECT '✅ SCRIPT EJECUTADO SIN ERRORES' as resultado;
SELECT '✅ Solo se crearon las policies que faltaban' as detalle;
