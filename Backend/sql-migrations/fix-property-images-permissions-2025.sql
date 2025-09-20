-- =====================================================
-- FIX PERMISOS PARA PROPERTY IMAGES BUCKET
-- Fecha: 2025-01-XX
-- Propósito: Corregir políticas RLS sin errores de permisos
-- =====================================================

-- 1. ELIMINAR POLÍTICAS DUPLICADAS O PROBLEMÁTICAS
-- =====================================================
DROP POLICY IF EXISTS "Public read access for property images" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload to their own folder" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own images" ON storage.objects;

-- 2. CREAR POLÍTICAS RLS SIMPLIFICADAS
-- =====================================================

-- Política de lectura pública (cualquiera puede ver las imágenes)
CREATE POLICY "property_images_public_read"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'property-images');

-- Política de subida (solo usuarios autenticados a su propia carpeta)
CREATE POLICY "property_images_authenticated_upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'property-images' 
  AND split_part(name, '/', 1) = auth.uid()::text
);

-- Política de actualización (solo usuarios autenticados a sus propias imágenes)
CREATE POLICY "property_images_authenticated_update"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'property-images' 
  AND split_part(name, '/', 1) = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'property-images' 
  AND split_part(name, '/', 1) = auth.uid()::text
);

-- Política de eliminación (solo usuarios autenticados a sus propias imágenes)
CREATE POLICY "property_images_authenticated_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'property-images' 
  AND split_part(name, '/', 1) = auth.uid()::text
);

-- 3. FUNCIÓN SIMPLIFICADA PARA OBTENER IMÁGENES
-- =====================================================
CREATE OR REPLACE FUNCTION public.get_property_images_simple(
  p_user_id TEXT,
  p_property_id TEXT
)
RETURNS TABLE (
  name TEXT,
  public_url TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    obj.name,
    CONCAT(
      'https://your-project.supabase.co/storage/v1/object/public/property-images/',
      obj.name
    ) as public_url,
    obj.created_at
  FROM storage.objects obj
  WHERE obj.bucket_id = 'property-images'
    AND obj.name LIKE CONCAT(p_user_id, '/', p_property_id, '/%')
  ORDER BY obj.created_at ASC;
$$;

-- 4. VERIFICAR CONFIGURACIÓN ACTUAL
-- =====================================================
SELECT 
  'Bucket configurado correctamente' as status,
  id, 
  name, 
  public, 
  file_size_limit
FROM storage.buckets 
WHERE id = 'property-images';

-- Verificar políticas activas
SELECT 
  'Políticas RLS activas' as status,
  policyname,
  cmd,
  roles
FROM pg_policies 
WHERE tablename = 'objects' 
  AND policyname LIKE '%property_images%'
ORDER BY policyname;

-- =====================================================
-- INSTRUCCIONES DE USO SIMPLIFICADAS
-- =====================================================

/*
CONFIGURACIÓN COMPLETADA:

1. BUCKET: 'property-images' (público, 10MB límite)
2. ESTRUCTURA: {user_id}/{property_id}/{filename}
3. POLÍTICAS:
   - Lectura: Pública (cualquiera puede ver)
   - Escritura: Solo usuarios autenticados en su carpeta

EJEMPLO DE USO EN CÓDIGO:

// Subir imagen
const { data, error } = await supabase.storage
  .from('property-images')
  .upload(`${userId}/${propertyId}/image.jpg`, file);

// Obtener URL pública
const { data } = supabase.storage
  .from('property-images')
  .getPublicUrl(`${userId}/${propertyId}/image.jpg`);

// Listar imágenes de una propiedad
const { data, error } = await supabase.storage
  .from('property-images')
  .list(`${userId}/${propertyId}`);

FUNCIÓN SQL DISPONIBLE:
SELECT * FROM public.get_property_images_simple('user-id', 'property-id');
*/
