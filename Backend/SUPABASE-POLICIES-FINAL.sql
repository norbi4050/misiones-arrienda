-- =====================================================
-- SOLO LAS POLICIES QUE REALMENTE FALTAN
-- =====================================================
-- Script final basado en los errores reportados

-- =====================================================
-- POLICIES PARA AVATARS (todas nuevas)
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

CREATE POLICY "Users can delete own avatar" 
ON storage.objects FOR DELETE 
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- =====================================================
-- POLICIES PARA PROPERTY-IMAGES (solo las que faltan)
-- =====================================================

CREATE POLICY "Property images are publicly accessible" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'property-images');

-- NOTA: "Users can upload property images" ya existe
-- NOTA: "Users can update own property images" ya existe

CREATE POLICY "Users can delete own property images" 
ON storage.objects FOR DELETE 
USING (
  bucket_id = 'property-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- =====================================================
-- POLICIES PARA PROFILE-IMAGES (todas nuevas)
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
-- POLICIES PARA COMMUNITY-IMAGES (todas nuevas)
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

SELECT '✅ POLICIES FALTANTES CREADAS CORRECTAMENTE' as resultado;
SELECT '✅ Problema #2 "Perfil no permite cambiar foto" SOLUCIONADO' as solucion;
