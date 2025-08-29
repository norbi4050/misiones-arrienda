-- =====================================================
-- SOLO LAS POLICIES QUE FALTAN PARA SUPABASE STORAGE
-- =====================================================
-- Basado en las imágenes proporcionadas
-- Ya tienes los buckets: avatars, property-images, profile-images, community-images

-- =====================================================
-- POLICIES PARA AVATARS
-- =====================================================

-- Lectura pública de avatares
CREATE POLICY "Avatar images are publicly accessible" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'avatars');

-- Usuarios pueden subir su propio avatar
CREATE POLICY "Users can upload avatar" 
ON storage.objects FOR INSERT 
WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Usuarios pueden actualizar su propio avatar
CREATE POLICY "Users can update own avatar" 
ON storage.objects FOR UPDATE 
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Usuarios pueden eliminar su propio avatar
CREATE POLICY "Users can delete own avatar" 
ON storage.objects FOR DELETE 
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- =====================================================
-- POLICIES PARA PROPERTY-IMAGES
-- =====================================================

-- Lectura pública de imágenes de propiedades
CREATE POLICY "Property images are publicly accessible" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'property-images');

-- Usuarios pueden subir imágenes de sus propiedades
CREATE POLICY "Users can upload property images" 
ON storage.objects FOR INSERT 
WITH CHECK (
  bucket_id = 'property-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Usuarios pueden actualizar imágenes de sus propiedades
CREATE POLICY "Users can update own property images" 
ON storage.objects FOR UPDATE 
USING (
  bucket_id = 'property-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Usuarios pueden eliminar imágenes de sus propiedades
CREATE POLICY "Users can delete own property images" 
ON storage.objects FOR DELETE 
USING (
  bucket_id = 'property-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- =====================================================
-- POLICIES PARA PROFILE-IMAGES
-- =====================================================

-- Lectura pública de imágenes de perfil
CREATE POLICY "Profile images are publicly accessible" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'profile-images');

-- Usuarios pueden subir imágenes de su perfil
CREATE POLICY "Users can upload profile images" 
ON storage.objects FOR INSERT 
WITH CHECK (
  bucket_id = 'profile-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Usuarios pueden actualizar imágenes de su perfil
CREATE POLICY "Users can update own profile images" 
ON storage.objects FOR UPDATE 
USING (
  bucket_id = 'profile-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Usuarios pueden eliminar imágenes de su perfil
CREATE POLICY "Users can delete own profile images" 
ON storage.objects FOR DELETE 
USING (
  bucket_id = 'profile-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- =====================================================
-- POLICIES PARA COMMUNITY-IMAGES
-- =====================================================

-- Lectura pública de imágenes de comunidad
CREATE POLICY "Community images are publicly accessible" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'community-images');

-- Usuarios pueden subir imágenes de comunidad
CREATE POLICY "Users can upload community images" 
ON storage.objects FOR INSERT 
WITH CHECK (
  bucket_id = 'community-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Usuarios pueden actualizar imágenes de comunidad
CREATE POLICY "Users can update own community images" 
ON storage.objects FOR UPDATE 
USING (
  bucket_id = 'community-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Usuarios pueden eliminar imágenes de comunidad
CREATE POLICY "Users can delete own community images" 
ON storage.objects FOR DELETE 
USING (
  bucket_id = 'community-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- =====================================================
-- VERIFICAR RESULTADO
-- =====================================================

-- Ver todas las policies creadas
SELECT bucket_id, policyname, cmd 
FROM storage.policies 
WHERE bucket_id IN ('avatars', 'property-images', 'profile-images', 'community-images')
ORDER BY bucket_id, cmd;

-- Mensaje final
SELECT '✅ POLICIES DE STORAGE CREADAS CORRECTAMENTE' as resultado;
SELECT '✅ Problema #2 "Perfil no permite cambiar foto" SOLUCIONADO' as solucion;
