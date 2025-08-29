-- =====================================================
-- POLICIES SIMPLES PARA SUPABASE STORAGE
-- =====================================================
-- Script básico sin verificaciones complejas

-- =====================================================
-- POLICIES PARA AVATARS
-- =====================================================

CREATE POLICY "Avatar images are publicly accessible" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload avatar" 
ON storage.objects FOR INSERT 
WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update own avatar" 
ON storage.objects FOR UPDATE 
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete own avatar" 
ON storage.objects FOR DELETE 
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- =====================================================
-- POLICIES PARA PROPERTY-IMAGES
-- =====================================================

CREATE POLICY "Property images are publicly accessible" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'property-images');

-- Esta ya existe según tu error, así que la comentamos
-- CREATE POLICY "Users can upload property images" 
-- ON storage.objects FOR INSERT 
-- WITH CHECK (
--   bucket_id = 'property-images' 
--   AND auth.uid()::text = (storage.foldername(name))[1]
-- );

CREATE POLICY "Users can update own property images" 
ON storage.objects FOR UPDATE 
USING (
  bucket_id = 'property-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete own property images" 
ON storage.objects FOR DELETE 
USING (
  bucket_id = 'property-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- =====================================================
-- POLICIES PARA PROFILE-IMAGES
-- =====================================================

CREATE POLICY "Profile images are publicly accessible" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'profile-images');

CREATE POLICY "Users can upload profile images" 
ON storage.objects FOR INSERT 
WITH CHECK (
  bucket_id = 'profile-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update own profile images" 
ON storage.objects FOR UPDATE 
USING (
  bucket_id = 'profile-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete own profile images" 
ON storage.objects FOR DELETE 
USING (
  bucket_id = 'profile-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- =====================================================
-- POLICIES PARA COMMUNITY-IMAGES
-- =====================================================

CREATE POLICY "Community images are publicly accessible" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'community-images');

CREATE POLICY "Users can upload community images" 
ON storage.objects FOR INSERT 
WITH CHECK (
  bucket_id = 'community-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update own community images" 
ON storage.objects FOR UPDATE 
USING (
  bucket_id = 'community-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete own community images" 
ON storage.objects FOR DELETE 
USING (
  bucket_id = 'community-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- =====================================================
-- MENSAJE FINAL
-- =====================================================

SELECT '✅ POLICIES CREADAS CORRECTAMENTE' as resultado;
SELECT '✅ Problema #2 "Perfil no permite cambiar foto" SOLUCIONADO' as solucion;
