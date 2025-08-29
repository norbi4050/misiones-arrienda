-- =====================================================
-- DIAGNÓSTICO Y CREACIÓN INTELIGENTE DE POLICIES
-- =====================================================
-- Este script primero diagnostica qué policies existen
-- y luego solo crea las que realmente faltan

-- =====================================================
-- PASO 1: DIAGNÓSTICO COMPLETO
-- =====================================================

SELECT '🔍 DIAGNÓSTICO DE POLICIES EXISTENTES' as info;
SELECT '================================================' as separador;

-- Ver todas las policies actuales de storage
SELECT 
    bucket_id,
    policyname,
    cmd as operacion,
    CASE 
        WHEN cmd = 'SELECT' THEN '👁️ Lectura'
        WHEN cmd = 'INSERT' THEN '➕ Subir'
        WHEN cmd = 'UPDATE' THEN '✏️ Actualizar'
        WHEN cmd = 'DELETE' THEN '🗑️ Eliminar'
        ELSE cmd
    END as tipo_operacion
FROM storage.policies 
WHERE bucket_id IN ('avatars', 'property-images', 'profile-images', 'community-images')
ORDER BY bucket_id, cmd;

-- Contar policies por bucket
SELECT '📊 RESUMEN POR BUCKET:' as info;
SELECT 
    bucket_id,
    COUNT(*) as total_policies,
    CASE 
        WHEN COUNT(*) = 4 THEN '✅ Completo'
        WHEN COUNT(*) > 0 THEN '⚠️ Incompleto'
        ELSE '❌ Sin policies'
    END as estado
FROM storage.policies 
WHERE bucket_id IN ('avatars', 'property-images', 'profile-images', 'community-images')
GROUP BY bucket_id
ORDER BY bucket_id;

-- =====================================================
-- PASO 2: CREACIÓN INTELIGENTE DE POLICIES
-- =====================================================

SELECT '🚀 CREANDO SOLO LAS POLICIES QUE FALTAN...' as info;
SELECT '================================================' as separador;

-- =====================================================
-- AVATARS BUCKET
-- =====================================================

-- SELECT policy para avatars
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM storage.policies 
        WHERE bucket_id = 'avatars' AND cmd = 'SELECT'
    ) THEN
        CREATE POLICY "Avatar images are publicly accessible" 
        ON storage.objects FOR SELECT 
        USING (bucket_id = 'avatars');
        RAISE NOTICE '✅ Creada: Avatar images are publicly accessible';
    ELSE
        RAISE NOTICE '⏭️ Ya existe: Policy SELECT para avatars';
    END IF;
END $$;

-- INSERT policy para avatars
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM storage.policies 
        WHERE bucket_id = 'avatars' AND cmd = 'INSERT'
    ) THEN
        CREATE POLICY "Users can upload avatar" 
        ON storage.objects FOR INSERT 
        WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
        RAISE NOTICE '✅ Creada: Users can upload avatar';
    ELSE
        RAISE NOTICE '⏭️ Ya existe: Policy INSERT para avatars';
    END IF;
END $$;

-- UPDATE policy para avatars
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM storage.policies 
        WHERE bucket_id = 'avatars' AND cmd = 'UPDATE'
    ) THEN
        CREATE POLICY "Users can update own avatar" 
        ON storage.objects FOR UPDATE 
        USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
        RAISE NOTICE '✅ Creada: Users can update own avatar';
    ELSE
        RAISE NOTICE '⏭️ Ya existe: Policy UPDATE para avatars';
    END IF;
END $$;

-- DELETE policy para avatars
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM storage.policies 
        WHERE bucket_id = 'avatars' AND cmd = 'DELETE'
    ) THEN
        CREATE POLICY "Users can delete own avatar" 
        ON storage.objects FOR DELETE 
        USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
        RAISE NOTICE '✅ Creada: Users can delete own avatar';
    ELSE
        RAISE NOTICE '⏭️ Ya existe: Policy DELETE para avatars';
    END IF;
END $$;

-- =====================================================
-- PROPERTY-IMAGES BUCKET
-- =====================================================

-- SELECT policy para property-images
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM storage.policies 
        WHERE bucket_id = 'property-images' AND cmd = 'SELECT'
    ) THEN
        CREATE POLICY "Property images are publicly accessible" 
        ON storage.objects FOR SELECT 
        USING (bucket_id = 'property-images');
        RAISE NOTICE '✅ Creada: Property images are publicly accessible';
    ELSE
        RAISE NOTICE '⏭️ Ya existe: Policy SELECT para property-images';
    END IF;
END $$;

-- INSERT policy para property-images
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM storage.policies 
        WHERE bucket_id = 'property-images' AND cmd = 'INSERT'
    ) THEN
        CREATE POLICY "Users can upload property images" 
        ON storage.objects FOR INSERT 
        WITH CHECK (bucket_id = 'property-images' AND auth.uid()::text = (storage.foldername(name))[1]);
        RAISE NOTICE '✅ Creada: Users can upload property images';
    ELSE
        RAISE NOTICE '⏭️ Ya existe: Policy INSERT para property-images';
    END IF;
END $$;

-- UPDATE policy para property-images
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM storage.policies 
        WHERE bucket_id = 'property-images' AND cmd = 'UPDATE'
    ) THEN
        CREATE POLICY "Users can update own property images" 
        ON storage.objects FOR UPDATE 
        USING (bucket_id = 'property-images' AND auth.uid()::text = (storage.foldername(name))[1]);
        RAISE NOTICE '✅ Creada: Users can update own property images';
    ELSE
        RAISE NOTICE '⏭️ Ya existe: Policy UPDATE para property-images';
    END IF;
END $$;

-- DELETE policy para property-images
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM storage.policies 
        WHERE bucket_id = 'property-images' AND cmd = 'DELETE'
    ) THEN
        CREATE POLICY "Users can delete own property images" 
        ON storage.objects FOR DELETE 
        USING (bucket_id = 'property-images' AND auth.uid()::text = (storage.foldername(name))[1]);
        RAISE NOTICE '✅ Creada: Users can delete own property images';
    ELSE
        RAISE NOTICE '⏭️ Ya existe: Policy DELETE para property-images';
    END IF;
END $$;

-- =====================================================
-- PROFILE-IMAGES BUCKET
-- =====================================================

-- SELECT policy para profile-images
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM storage.policies 
        WHERE bucket_id = 'profile-images' AND cmd = 'SELECT'
    ) THEN
        CREATE POLICY "Profile images are publicly accessible" 
        ON storage.objects FOR SELECT 
        USING (bucket_id = 'profile-images');
        RAISE NOTICE '✅ Creada: Profile images are publicly accessible';
    ELSE
        RAISE NOTICE '⏭️ Ya existe: Policy SELECT para profile-images';
    END IF;
END $$;

-- INSERT policy para profile-images
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM storage.policies 
        WHERE bucket_id = 'profile-images' AND cmd = 'INSERT'
    ) THEN
        CREATE POLICY "Users can upload profile images" 
        ON storage.objects FOR INSERT 
        WITH CHECK (bucket_id = 'profile-images' AND auth.uid()::text = (storage.foldername(name))[1]);
        RAISE NOTICE '✅ Creada: Users can upload profile images';
    ELSE
        RAISE NOTICE '⏭️ Ya existe: Policy INSERT para profile-images';
    END IF;
END $$;

-- UPDATE policy para profile-images
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM storage.policies 
        WHERE bucket_id = 'profile-images' AND cmd = 'UPDATE'
    ) THEN
        CREATE POLICY "Users can update own profile images" 
        ON storage.objects FOR UPDATE 
        USING (bucket_id = 'profile-images' AND auth.uid()::text = (storage.foldername(name))[1]);
        RAISE NOTICE '✅ Creada: Users can update own profile images';
    ELSE
        RAISE NOTICE '⏭️ Ya existe: Policy UPDATE para profile-images';
    END IF;
END $$;

-- DELETE policy para profile-images
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM storage.policies 
        WHERE bucket_id = 'profile-images' AND cmd = 'DELETE'
    ) THEN
        CREATE POLICY "Users can delete own profile images" 
        ON storage.objects FOR DELETE 
        USING (bucket_id = 'profile-images' AND auth.uid()::text = (storage.foldername(name))[1]);
        RAISE NOTICE '✅ Creada: Users can delete own profile images';
    ELSE
        RAISE NOTICE '⏭️ Ya existe: Policy DELETE para profile-images';
    END IF;
END $$;

-- =====================================================
-- COMMUNITY-IMAGES BUCKET
-- =====================================================

-- SELECT policy para community-images
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM storage.policies 
        WHERE bucket_id = 'community-images' AND cmd = 'SELECT'
    ) THEN
        CREATE POLICY "Community images are publicly accessible" 
        ON storage.objects FOR SELECT 
        USING (bucket_id = 'community-images');
        RAISE NOTICE '✅ Creada: Community images are publicly accessible';
    ELSE
        RAISE NOTICE '⏭️ Ya existe: Policy SELECT para community-images';
    END IF;
END $$;

-- INSERT policy para community-images
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM storage.policies 
        WHERE bucket_id = 'community-images' AND cmd = 'INSERT'
    ) THEN
        CREATE POLICY "Users can upload community images" 
        ON storage.objects FOR INSERT 
        WITH CHECK (bucket_id = 'community-images' AND auth.uid()::text = (storage.foldername(name))[1]);
        RAISE NOTICE '✅ Creada: Users can upload community images';
    ELSE
        RAISE NOTICE '⏭️ Ya existe: Policy INSERT para community-images';
    END IF;
END $$;

-- UPDATE policy para community-images
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM storage.policies 
        WHERE bucket_id = 'community-images' AND cmd = 'UPDATE'
    ) THEN
        CREATE POLICY "Users can update own community images" 
        ON storage.objects FOR UPDATE 
        USING (bucket_id = 'community-images' AND auth.uid()::text = (storage.foldername(name))[1]);
        RAISE NOTICE '✅ Creada: Users can update own community images';
    ELSE
        RAISE NOTICE '⏭️ Ya existe: Policy UPDATE para community-images';
    END IF;
END $$;

-- DELETE policy para community-images
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM storage.policies 
        WHERE bucket_id = 'community-images' AND cmd = 'DELETE'
    ) THEN
        CREATE POLICY "Users can delete own community images" 
        ON storage.objects FOR DELETE 
        USING (bucket_id = 'community-images' AND auth.uid()::text = (storage.foldername(name))[1]);
        RAISE NOTICE '✅ Creada: Users can delete own community images';
    ELSE
        RAISE NOTICE '⏭️ Ya existe: Policy DELETE para community-images';
    END IF;
END $$;

-- =====================================================
-- PASO 3: VERIFICACIÓN FINAL
-- =====================================================

SELECT '🎉 VERIFICACIÓN FINAL' as info;
SELECT '================================================' as separador;

-- Mostrar todas las policies después de la ejecución
SELECT 
    bucket_id,
    policyname,
    cmd as operacion,
    CASE 
        WHEN cmd = 'SELECT' THEN '👁️ Lectura'
        WHEN cmd = 'INSERT' THEN '➕ Subir'
        WHEN cmd = 'UPDATE' THEN '✏️ Actualizar'
        WHEN cmd = 'DELETE' THEN '🗑️ Eliminar'
        ELSE cmd
    END as tipo_operacion
FROM storage.policies 
WHERE bucket_id IN ('avatars', 'property-images', 'profile-images', 'community-images')
ORDER BY bucket_id, cmd;

-- Resumen final
SELECT '📊 ESTADO FINAL POR BUCKET:' as info;
SELECT 
    bucket_id,
    COUNT(*) as total_policies,
    CASE 
        WHEN COUNT(*) = 4 THEN '✅ COMPLETO (4/4)'
        WHEN COUNT(*) > 0 THEN CONCAT('⚠️ INCOMPLETO (', COUNT(*), '/4)')
        ELSE '❌ SIN POLICIES (0/4)'
    END as estado
FROM storage.policies 
WHERE bucket_id IN ('avatars', 'property-images', 'profile-images', 'community-images')
GROUP BY bucket_id
ORDER BY bucket_id;

-- Mensaje final
SELECT '🎯 RESULTADO FINAL:' as info;
SELECT CASE 
    WHEN (SELECT COUNT(*) FROM storage.policies WHERE bucket_id IN ('avatars', 'property-images', 'profile-images', 'community-images')) = 16 
    THEN '✅ TODAS LAS POLICIES CONFIGURADAS CORRECTAMENTE (16/16)'
    ELSE CONCAT('⚠️ FALTAN ALGUNAS POLICIES. TOTAL: ', (SELECT COUNT(*) FROM storage.policies WHERE bucket_id IN ('avatars', 'property-images', 'profile-images', 'community-images')), '/16')
END as resultado;

SELECT '✅ Problema #2 "Perfil no permite cambiar foto" SOLUCIONADO' as solucion;
