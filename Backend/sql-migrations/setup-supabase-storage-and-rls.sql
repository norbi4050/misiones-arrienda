-- =====================================================
-- CONFIGURACIÓN DE SUPABASE STORAGE Y POLÍTICAS RLS
-- FASE 2: OPTIMIZACIÓN DE RENDIMIENTO
-- =====================================================

-- 1. CREAR BUCKETS DE STORAGE
-- =====================================================

-- Bucket para imágenes de propiedades
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'property-images',
  'property-images',
  true,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
) ON CONFLICT (id) DO NOTHING;

-- Bucket para avatares de usuarios
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'user-avatars',
  'user-avatars',
  true,
  2097152, -- 2MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Bucket para documentos de verificación
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'verification-docs',
  'verification-docs',
  false, -- Privado
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'application/pdf']
) ON CONFLICT (id) DO NOTHING;

-- 2. POLÍTICAS RLS PARA PROPERTY-IMAGES
-- =====================================================

-- Permitir lectura pública de imágenes de propiedades
CREATE POLICY "Public read access for property images"
ON storage.objects FOR SELECT
USING (bucket_id = 'property-images');

-- Permitir subida solo a usuarios autenticados
CREATE POLICY "Authenticated users can upload property images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'property-images' 
  AND auth.role() = 'authenticated'
);

-- Permitir actualización solo al propietario o admin
CREATE POLICY "Users can update their own property images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'property-images' 
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR EXISTS (
      SELECT 1 FROM "User" 
      WHERE id = auth.uid() 
      AND role = 'ADMIN'
    )
  )
);

-- Permitir eliminación solo al propietario o admin
CREATE POLICY "Users can delete their own property images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'property-images' 
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR EXISTS (
      SELECT 1 FROM "User" 
      WHERE id = auth.uid() 
      AND role = 'ADMIN'
    )
  )
);

-- 3. POLÍTICAS RLS PARA USER-AVATARS
-- =====================================================

-- Permitir lectura pública de avatares
CREATE POLICY "Public read access for user avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'user-avatars');

-- Permitir subida solo al propio usuario
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'user-avatars' 
  AND auth.role() = 'authenticated'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Permitir actualización solo al propio usuario
CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'user-avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Permitir eliminación solo al propio usuario
CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'user-avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 4. POLÍTICAS RLS PARA VERIFICATION-DOCS
-- =====================================================

-- Solo el propietario puede leer sus documentos
CREATE POLICY "Users can read their own verification docs"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'verification-docs' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Solo el propietario puede subir documentos
CREATE POLICY "Users can upload their own verification docs"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'verification-docs' 
  AND auth.role() = 'authenticated'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Solo el propietario puede actualizar documentos
CREATE POLICY "Users can update their own verification docs"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'verification-docs' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Solo el propietario puede eliminar documentos
CREATE POLICY "Users can delete their own verification docs"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'verification-docs' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Admins pueden leer todos los documentos de verificación
CREATE POLICY "Admins can read all verification docs"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'verification-docs' 
  AND EXISTS (
    SELECT 1 FROM "User" 
    WHERE id = auth.uid() 
    AND role = 'ADMIN'
  )
);

-- 5. ÍNDICES PARA OPTIMIZACIÓN
-- =====================================================

-- Índice para búsquedas por bucket_id
CREATE INDEX IF NOT EXISTS idx_storage_objects_bucket_id 
ON storage.objects(bucket_id);

-- Índice para búsquedas por propietario (folder)
CREATE INDEX IF NOT EXISTS idx_storage_objects_owner 
ON storage.objects((storage.foldername(name))[1]) 
WHERE bucket_id IN ('property-images', 'user-avatars', 'verification-docs');

-- 6. FUNCIONES AUXILIARES
-- =====================================================

-- Función para obtener URL pública de imagen
CREATE OR REPLACE FUNCTION get_public_image_url(bucket_name text, file_path text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN format('%s/storage/v1/object/public/%s/%s', 
    current_setting('app.supabase_url'), 
    bucket_name, 
    file_path
  );
END;
$$;

-- Función para limpiar imágenes huérfanas
CREATE OR REPLACE FUNCTION cleanup_orphaned_images()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count integer := 0;
BEGIN
  -- Eliminar imágenes de propiedades que ya no existen
  DELETE FROM storage.objects 
  WHERE bucket_id = 'property-images'
  AND NOT EXISTS (
    SELECT 1 FROM "Property" 
    WHERE images @> jsonb_build_array(
      get_public_image_url('property-images', storage.objects.name)
    )
  );
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN deleted_count;
END;
$$;

-- 7. TRIGGERS PARA LIMPIEZA AUTOMÁTICA
-- =====================================================

-- Trigger para limpiar imágenes cuando se elimina una propiedad
CREATE OR REPLACE FUNCTION cleanup_property_images()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  image_url text;
  file_path text;
BEGIN
  -- Extraer URLs de imágenes del JSON
  FOR image_url IN 
    SELECT jsonb_array_elements_text(OLD.images)
  LOOP
    -- Extraer el path del archivo de la URL
    file_path := regexp_replace(image_url, '^.*/property-images/', '');
    
    -- Eliminar el archivo del storage
    DELETE FROM storage.objects 
    WHERE bucket_id = 'property-images' 
    AND name = file_path;
  END LOOP;
  
  RETURN OLD;
END;
$$;

-- Crear trigger
DROP TRIGGER IF EXISTS trigger_cleanup_property_images ON "Property";
CREATE TRIGGER trigger_cleanup_property_images
  AFTER DELETE ON "Property"
  FOR EACH ROW
  EXECUTE FUNCTION cleanup_property_images();

-- 8. CONFIGURACIÓN DE CORS PARA STORAGE
-- =====================================================

-- Nota: Esto debe configurarse en el dashboard de Supabase
-- Dominios permitidos para CORS:
-- - http://localhost:3000 (desarrollo)
-- - https://tu-dominio.com (producción)

-- 9. VERIFICACIÓN DE CONFIGURACIÓN
-- =====================================================

-- Verificar buckets creados
SELECT 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types,
  created_at
FROM storage.buckets
WHERE id IN ('property-images', 'user-avatars', 'verification-docs');

-- Verificar políticas RLS
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE schemaname = 'storage' 
AND tablename = 'objects'
ORDER BY policyname;

-- Verificar funciones creadas
SELECT 
  proname,
  prosrc
FROM pg_proc 
WHERE proname IN ('get_public_image_url', 'cleanup_orphaned_images', 'cleanup_property_images');

COMMENT ON FUNCTION get_public_image_url IS 'Genera URL pública para archivos en Storage';
COMMENT ON FUNCTION cleanup_orphaned_images IS 'Limpia imágenes huérfanas sin referencias';
COMMENT ON FUNCTION cleanup_property_images IS 'Limpia imágenes al eliminar propiedades';
