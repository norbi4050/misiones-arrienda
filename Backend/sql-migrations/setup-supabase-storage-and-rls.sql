-- =====================================================
-- 🚀 CONFIGURACIÓN SUPABASE STORAGE Y RLS POLICIES
-- FASE 2: OPTIMIZACIÓN DE RENDIMIENTO
-- =====================================================

-- Este script configura el almacenamiento de archivos en Supabase Storage
-- para eliminar el uso de Base64 y mejorar el rendimiento

-- =====================================================
-- 1. CREAR BUCKETS DE ALMACENAMIENTO
-- =====================================================

-- Bucket para imágenes de propiedades
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'properties',
  'properties',
  true,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
) ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Bucket para avatares de usuarios
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  2097152, -- 2MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp']
) ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Bucket para documentos (contratos, etc.)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents',
  'documents',
  false, -- Privado
  52428800, -- 50MB limit
  ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
) ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- =====================================================
-- 2. POLÍTICAS RLS PARA BUCKET PROPERTIES
-- =====================================================

-- Permitir lectura pública de imágenes de propiedades
CREATE POLICY "Public read access for property images" ON storage.objects
FOR SELECT USING (bucket_id = 'properties');

-- Permitir subida solo a usuarios autenticados
CREATE POLICY "Authenticated users can upload property images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'properties' 
  AND auth.role() = 'authenticated'
);

-- Permitir actualización solo al propietario de la propiedad
CREATE POLICY "Users can update their own property images" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'properties' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Permitir eliminación solo al propietario de la propiedad
CREATE POLICY "Users can delete their own property images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'properties' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- =====================================================
-- 3. POLÍTICAS RLS PARA BUCKET AVATARS
-- =====================================================

-- Permitir lectura pública de avatares
CREATE POLICY "Public read access for avatars" ON storage.objects
FOR SELECT USING (bucket_id = 'avatars');

-- Permitir subida solo a usuarios autenticados para su propio avatar
CREATE POLICY "Users can upload their own avatar" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.role() = 'authenticated'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Permitir actualización solo del propio avatar
CREATE POLICY "Users can update their own avatar" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Permitir eliminación solo del propio avatar
CREATE POLICY "Users can delete their own avatar" ON storage.objects
FOR DELETE USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- =====================================================
-- 4. POLÍTICAS RLS PARA BUCKET DOCUMENTS
-- =====================================================

-- Solo lectura para el propietario del documento
CREATE POLICY "Users can read their own documents" ON storage.objects
FOR SELECT USING (
  bucket_id = 'documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Solo subida para usuarios autenticados de sus propios documentos
CREATE POLICY "Users can upload their own documents" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'documents' 
  AND auth.role() = 'authenticated'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Solo actualización de propios documentos
CREATE POLICY "Users can update their own documents" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Solo eliminación de propios documentos
CREATE POLICY "Users can delete their own documents" ON storage.objects
FOR DELETE USING (
  bucket_id = 'documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- =====================================================
-- 5. FUNCIONES AUXILIARES PARA LIMPIEZA
-- =====================================================

-- Función para limpiar archivos huérfanos
CREATE OR REPLACE FUNCTION cleanup_orphaned_files()
RETURNS void AS $$
BEGIN
  -- Eliminar imágenes de propiedades que no tienen propiedad asociada
  DELETE FROM storage.objects 
  WHERE bucket_id = 'properties' 
  AND NOT EXISTS (
    SELECT 1 FROM "Property" p 
    WHERE p.id::text = (storage.foldername(name))[2]
  );
  
  -- Eliminar avatares de usuarios que no existen
  DELETE FROM storage.objects 
  WHERE bucket_id = 'avatars' 
  AND NOT EXISTS (
    SELECT 1 FROM "User" u 
    WHERE u.id::text = (storage.foldername(name))[1]
  );
  
  RAISE NOTICE 'Cleanup completed';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para obtener URL pública de archivo
CREATE OR REPLACE FUNCTION get_public_url(bucket_name text, file_path text)
RETURNS text AS $$
BEGIN
  RETURN concat(
    current_setting('app.settings.supabase_url', true),
    '/storage/v1/object/public/',
    bucket_name,
    '/',
    file_path
  );
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 6. TRIGGERS PARA LIMPIEZA AUTOMÁTICA
-- =====================================================

-- Trigger para limpiar imágenes cuando se elimina una propiedad
CREATE OR REPLACE FUNCTION cleanup_property_images()
RETURNS trigger AS $$
BEGIN
  -- Eliminar todas las imágenes de la propiedad eliminada
  DELETE FROM storage.objects 
  WHERE bucket_id = 'properties' 
  AND (storage.foldername(name))[2] = OLD.id::text;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Aplicar trigger a la tabla Property
DROP TRIGGER IF EXISTS cleanup_property_images_trigger ON "Property";
CREATE TRIGGER cleanup_property_images_trigger
  AFTER DELETE ON "Property"
  FOR EACH ROW EXECUTE FUNCTION cleanup_property_images();

-- Trigger para limpiar avatar cuando se elimina un usuario
CREATE OR REPLACE FUNCTION cleanup_user_avatar()
RETURNS trigger AS $$
BEGIN
  -- Eliminar avatar del usuario eliminado
  DELETE FROM storage.objects 
  WHERE bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = OLD.id::text;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Aplicar trigger a la tabla User
DROP TRIGGER IF EXISTS cleanup_user_avatar_trigger ON "User";
CREATE TRIGGER cleanup_user_avatar_trigger
  AFTER DELETE ON "User"
  FOR EACH ROW EXECUTE FUNCTION cleanup_user_avatar();

-- =====================================================
-- 7. ÍNDICES PARA OPTIMIZACIÓN
-- =====================================================

-- Índice para búsquedas por bucket_id
CREATE INDEX IF NOT EXISTS idx_storage_objects_bucket_id 
ON storage.objects(bucket_id);

-- Índice para búsquedas por owner
CREATE INDEX IF NOT EXISTS idx_storage_objects_owner 
ON storage.objects(owner);

-- Índice compuesto para búsquedas frecuentes
CREATE INDEX IF NOT EXISTS idx_storage_objects_bucket_owner 
ON storage.objects(bucket_id, owner);

-- =====================================================
-- 8. CONFIGURACIÓN DE CORS (si es necesario)
-- =====================================================

-- Nota: CORS se configura a nivel de Supabase Dashboard
-- Asegúrate de permitir tu dominio en la configuración de Storage

-- =====================================================
-- 9. VERIFICACIONES Y TESTING
-- =====================================================

-- Verificar que los buckets se crearon correctamente
SELECT 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types,
  created_at
FROM storage.buckets 
WHERE id IN ('properties', 'avatars', 'documents');

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
WHERE tablename = 'objects' 
AND schemaname = 'storage';

-- Verificar funciones creadas
SELECT 
  proname,
  prosrc
FROM pg_proc 
WHERE proname IN ('cleanup_orphaned_files', 'get_public_url', 'cleanup_property_images', 'cleanup_user_avatar');

-- Verificar triggers
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_timing
FROM information_schema.triggers 
WHERE trigger_name IN ('cleanup_property_images_trigger', 'cleanup_user_avatar_trigger');

-- =====================================================
-- 10. COMANDOS DE TESTING
-- =====================================================

-- Test de subida (ejecutar desde la aplicación)
/*
-- Ejemplo de uso en JavaScript:
const { data, error } = await supabase.storage
  .from('properties')
  .upload(`${userId}/${propertyId}/image1.jpg`, file);

-- Ejemplo de obtener URL pública:
const { data } = supabase.storage
  .from('properties')
  .getPublicUrl(`${userId}/${propertyId}/image1.jpg`);
*/

-- =====================================================
-- NOTAS IMPORTANTES:
-- =====================================================

/*
1. Ejecutar este script en el SQL Editor de Supabase Dashboard
2. Verificar que las variables de entorno incluyan SUPABASE_SERVICE_ROLE_KEY
3. Configurar CORS en Storage settings si es necesario
4. Actualizar el código de la aplicación para usar Storage en lugar de Base64
5. Migrar imágenes existentes de Base64 a Storage gradualmente
6. Monitorear el uso de almacenamiento en el dashboard
*/

-- =====================================================
-- FIN DEL SCRIPT
-- =====================================================

COMMIT;
