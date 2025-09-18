-- =====================================================
-- 📋 SQL COMPLETO PARA FASE 2: SUPABASE STORAGE
-- PROYECTO MISIONES ARRIENDA - ENERO 2025
-- =====================================================

-- INSTRUCCIONES:
-- 1. Ir a Supabase Dashboard > SQL Editor
-- 2. Copiar y ejecutar este script completo
-- 3. Verificar que no hay errores
-- 4. Ejecutar script de testing: node Backend/test-fase-2-storage-setup.js

-- =====================================================
-- PASO 1: CREAR BUCKETS DE STORAGE
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

-- =====================================================
-- PASO 2: POLÍTICAS RLS PARA PROPERTY-IMAGES
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

-- =====================================================
-- PASO 3: POLÍTICAS RLS PARA USER-AVATARS
-- =====================================================

-- Permitir lectura pública de avatares
CREATE POLICY "Public read access for user avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'user-avatars');

-- Permitir subida solo del propio avatar
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'user-avatars' 
  AND auth.role() = 'authenticated'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Permitir actualización solo del propio avatar
CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'user-avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Permitir eliminación solo del propio avatar
CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'user-avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- =====================================================
-- PASO 4: POLÍTICAS RLS PARA VERIFICATION-DOCS
-- =====================================================

-- Solo el propietario puede ver sus documentos
CREATE POLICY "Users can view their own verification docs"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'verification-docs' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Solo el propietario puede subir sus documentos
CREATE POLICY "Users can upload their own verification docs"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'verification-docs' 
  AND auth.role() = 'authenticated'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Solo el propietario puede actualizar sus documentos
CREATE POLICY "Users can update their own verification docs"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'verification-docs' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Solo el propietario puede eliminar sus documentos
CREATE POLICY "Users can delete their own verification docs"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'verification-docs' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- =====================================================
-- PASO 5: FUNCIONES AUXILIARES
-- =====================================================

-- Función para generar URL pública
CREATE OR REPLACE FUNCTION get_public_image_url(bucket_name text, file_path text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN format('%s/storage/v1/object/public/%s/%s', 
    current_setting('app.settings.supabase_url', true),
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
  -- Eliminar imágenes de propiedades que no tienen referencia
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

-- =====================================================
-- PASO 6: TRIGGERS PARA LIMPIEZA AUTOMÁTICA
-- =====================================================

-- Función trigger para limpiar imágenes cuando se elimina una propiedad
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

-- =====================================================
-- PASO 7: ÍNDICES PARA OPTIMIZACIÓN
-- =====================================================

-- Índice para búsquedas rápidas en storage.objects
CREATE INDEX IF NOT EXISTS idx_storage_objects_bucket_name 
ON storage.objects (bucket_id, name);

-- Índice para búsquedas por usuario
CREATE INDEX IF NOT EXISTS idx_storage_objects_owner 
ON storage.objects (bucket_id, owner);

-- =====================================================
-- PASO 8: VERIFICACIÓN DE CONFIGURACIÓN
-- =====================================================

-- Verificar buckets creados
SELECT 
  '✅ Buckets creados:' as status,
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types,
  created_at
FROM storage.buckets
WHERE id IN ('property-images', 'user-avatars', 'verification-docs')
ORDER BY id;

-- Verificar políticas RLS
SELECT 
  '✅ Políticas RLS creadas:' as status,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE schemaname = 'storage' 
AND tablename = 'objects'
AND policyname LIKE '%property images%' 
   OR policyname LIKE '%user avatars%' 
   OR policyname LIKE '%verification docs%'
ORDER BY policyname;

-- Verificar funciones creadas
SELECT 
  '✅ Funciones auxiliares creadas:' as status,
  proname as function_name,
  prosrc as definition
FROM pg_proc 
WHERE proname IN ('get_public_image_url', 'cleanup_orphaned_images', 'cleanup_property_images');

-- =====================================================
-- PASO 9: DATOS DE PRUEBA (OPCIONAL)
-- =====================================================

-- Comentario: Los datos de prueba se pueden crear después
-- usando el script de migración de Node.js

-- =====================================================
-- PASO 10: CONFIGURACIÓN ADICIONAL
-- =====================================================

-- Habilitar RLS en storage.objects si no está habilitado
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Comentarios sobre funciones
COMMENT ON FUNCTION get_public_image_url IS 'Genera URL pública para archivos en Storage';
COMMENT ON FUNCTION cleanup_orphaned_images IS 'Limpia imágenes huérfanas sin referencias';
COMMENT ON FUNCTION cleanup_property_images IS 'Limpia imágenes al eliminar propiedades';

-- =====================================================
-- 🎉 CONFIGURACIÓN COMPLETADA
-- =====================================================

SELECT '🎉 CONFIGURACIÓN DE SUPABASE STORAGE COMPLETADA EXITOSAMENTE' as resultado;
SELECT '📋 Próximo paso: Ejecutar node Backend/test-fase-2-storage-setup.js' as siguiente_paso;
SELECT '🚀 Después: Ejecutar node Backend/scripts/migrate-images-to-storage.js migrate' as migracion;
