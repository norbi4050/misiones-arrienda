-- =====================================================
-- SETUP COMPLETO PARA PROPERTY IMAGES BUCKET
-- Fecha: 2025-01-XX
-- Propósito: Configurar bucket y políticas RLS para imágenes de propiedades
-- =====================================================

-- 1. CREAR BUCKET PARA IMÁGENES DE PROPIEDADES
-- =====================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'property-images',
  'property-images',
  true, -- Bucket público para acceso directo a imágenes
  10485760, -- 10MB límite por archivo
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2. POLÍTICAS RLS PARA LECTURA PÚBLICA
-- =====================================================
-- Permitir que cualquiera pueda VER las imágenes (necesario para mostrar propiedades)
CREATE POLICY "Public read access for property images"
ON storage.objects FOR SELECT
USING (bucket_id = 'property-images');

-- 3. POLÍTICAS RLS PARA SUBIDA DE IMÁGENES
-- =====================================================
-- Solo usuarios autenticados pueden SUBIR imágenes a sus propias carpetas
CREATE POLICY "Users can upload to their own folder"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'property-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 4. POLÍTICAS RLS PARA ACTUALIZACIÓN DE IMÁGENES
-- =====================================================
-- Solo usuarios autenticados pueden ACTUALIZAR sus propias imágenes
CREATE POLICY "Users can update their own images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'property-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'property-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 5. POLÍTICAS RLS PARA ELIMINACIÓN DE IMÁGENES
-- =====================================================
-- Solo usuarios autenticados pueden ELIMINAR sus propias imágenes
CREATE POLICY "Users can delete their own images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'property-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 6. FUNCIÓN AUXILIAR PARA OBTENER IMÁGENES DE UNA PROPIEDAD
-- =====================================================
CREATE OR REPLACE FUNCTION get_property_images(
  p_user_id TEXT,
  p_property_id TEXT
)
RETURNS TABLE (
  name TEXT,
  public_url TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  size BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    obj.name,
    CONCAT(
      current_setting('app.settings.supabase_url', true),
      '/storage/v1/object/public/property-images/',
      obj.name
    ) as public_url,
    obj.created_at,
    obj.updated_at,
    obj.metadata->>'size'::BIGINT as size
  FROM storage.objects obj
  WHERE obj.bucket_id = 'property-images'
    AND obj.name LIKE CONCAT(p_user_id, '/', p_property_id, '/%')
  ORDER BY obj.created_at ASC;
END;
$$;

-- 7. FUNCIÓN PARA LIMPIAR IMÁGENES HUÉRFANAS
-- =====================================================
CREATE OR REPLACE FUNCTION cleanup_orphaned_property_images()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count INTEGER := 0;
BEGIN
  -- Eliminar imágenes de propiedades que ya no existen
  DELETE FROM storage.objects
  WHERE bucket_id = 'property-images'
    AND NOT EXISTS (
      SELECT 1 FROM properties p
      WHERE CONCAT(p.user_id, '/', p.id, '/') = SUBSTRING(name FROM '^[^/]+/[^/]+/')
    );
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN deleted_count;
END;
$$;

-- 8. TRIGGER PARA LIMPIAR IMÁGENES AL ELIMINAR PROPIEDADES
-- =====================================================
CREATE OR REPLACE FUNCTION cleanup_property_images_on_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Eliminar todas las imágenes de la propiedad eliminada
  DELETE FROM storage.objects
  WHERE bucket_id = 'property-images'
    AND name LIKE CONCAT(OLD.user_id, '/', OLD.id, '/%');
  
  RETURN OLD;
END;
$$;

-- Crear el trigger
DROP TRIGGER IF EXISTS trigger_cleanup_property_images ON properties;
CREATE TRIGGER trigger_cleanup_property_images
  AFTER DELETE ON properties
  FOR EACH ROW
  EXECUTE FUNCTION cleanup_property_images_on_delete();

-- 9. ÍNDICES PARA OPTIMIZAR CONSULTAS
-- =====================================================
-- Índice en storage.objects para búsquedas por bucket y path
CREATE INDEX IF NOT EXISTS idx_storage_objects_bucket_name 
ON storage.objects (bucket_id, name);

-- 10. PERMISOS PARA FUNCIONES
-- =====================================================
-- Permitir que usuarios autenticados usen las funciones
GRANT EXECUTE ON FUNCTION get_property_images(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_orphaned_property_images() TO service_role;

-- 11. CONFIGURACIÓN DE VARIABLES
-- =====================================================
-- Configurar URL base de Supabase (reemplazar con tu URL real)
-- ALTER DATABASE postgres SET app.settings.supabase_url = 'https://tu-proyecto.supabase.co';

-- =====================================================
-- VERIFICACIÓN DE LA CONFIGURACIÓN
-- =====================================================

-- Verificar que el bucket se creó correctamente
SELECT 
  id, 
  name, 
  public, 
  file_size_limit,
  allowed_mime_types
FROM storage.buckets 
WHERE id = 'property-images';

-- Verificar políticas RLS
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'objects' 
  AND policyname LIKE '%property%';

-- =====================================================
-- INSTRUCCIONES DE USO
-- =====================================================

/*
ESTRUCTURA DE CARPETAS RECOMENDADA:
property-images/
├── {user_id}/
│   ├── {property_id}/
│   │   ├── cover.jpg
│   │   ├── image-1.jpg
│   │   ├── image-2.jpg
│   │   └── ...

EJEMPLO DE USO:
- Usuario: 123e4567-e89b-12d3-a456-426614174000
- Propiedad: prop-456
- Imagen: cover.jpg
- Path completo: 123e4567-e89b-12d3-a456-426614174000/prop-456/cover.jpg

FUNCIONES DISPONIBLES:
1. get_property_images('user_id', 'property_id') - Obtener todas las imágenes de una propiedad
2. cleanup_orphaned_property_images() - Limpiar imágenes huérfanas (solo service_role)

POLÍTICAS RLS:
- Lectura pública: Cualquiera puede ver las imágenes
- Escritura privada: Solo el propietario puede subir/modificar/eliminar sus imágenes
*/
