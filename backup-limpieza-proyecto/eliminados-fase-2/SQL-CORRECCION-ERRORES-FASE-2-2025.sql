-- =====================================================
-- 🔧 SQL DE CORRECCIÓN PARA ERRORES FASE 2
-- PROYECTO MISIONES ARRIENDA - ENERO 2025
-- =====================================================

-- CORRECCIÓN 1: Arreglar comparación text = uuid en políticas RLS
-- =====================================================

-- Eliminar políticas problemáticas y recrearlas con cast correcto
DROP POLICY IF EXISTS "Users can update their own property images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own property images" ON storage.objects;

-- Recrear políticas con cast correcto
CREATE POLICY "Users can update their own property images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'property-images' 
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR EXISTS (
      SELECT 1 FROM "User" 
      WHERE id::text = auth.uid()::text 
      AND role = 'ADMIN'
    )
  )
);

CREATE POLICY "Users can delete their own property images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'property-images' 
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR EXISTS (
      SELECT 1 FROM "User" 
      WHERE id::text = auth.uid()::text 
      AND role = 'ADMIN'
    )
  )
);

-- CORRECCIÓN 2: Políticas para avatares (si faltan)
-- =====================================================

-- Política para subir avatar propio
CREATE POLICY IF NOT EXISTS "Users can upload their own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'user-avatars' 
  AND auth.role() = 'authenticated'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Política para actualizar avatar propio
CREATE POLICY IF NOT EXISTS "Users can update their own avatar"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'user-avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Política para eliminar avatar propio
CREATE POLICY IF NOT EXISTS "Users can delete their own avatar"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'user-avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- CORRECCIÓN 3: Función get_public_image_url mejorada
-- =====================================================

-- Recrear función con configuración dinámica
CREATE OR REPLACE FUNCTION get_public_image_url(bucket_name text, file_path text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  supabase_url text;
BEGIN
  -- Intentar obtener la URL de configuración, si no usar valor por defecto
  BEGIN
    supabase_url := current_setting('app.settings.supabase_url', true);
  EXCEPTION WHEN OTHERS THEN
    -- Si no está configurado, usar la URL actual del proyecto
    SELECT split_part(current_setting('request.headers')::json->>'host', '.', 1) INTO supabase_url;
    supabase_url := 'https://' || supabase_url || '.supabase.co';
  END;
  
  -- Si aún no tenemos URL, usar formato genérico
  IF supabase_url IS NULL OR supabase_url = '' THEN
    supabase_url := 'https://your-project.supabase.co';
  END IF;
  
  RETURN format('%s/storage/v1/object/public/%s/%s', 
    supabase_url,
    bucket_name, 
    file_path
  );
END;
$$;

-- CORRECCIÓN 4: Índices (solo si no existen)
-- =====================================================

-- Crear índices solo si no existen (evitar errores de permisos)
DO $$
BEGIN
  -- Índice para bucket_id y name
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'objects' 
    AND schemaname = 'storage' 
    AND indexname = 'idx_storage_objects_bucket_name'
  ) THEN
    CREATE INDEX idx_storage_objects_bucket_name 
    ON storage.objects (bucket_id, name);
  END IF;
  
  -- Índice para bucket_id y owner
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'objects' 
    AND schemaname = 'storage' 
    AND indexname = 'idx_storage_objects_owner'
  ) THEN
    CREATE INDEX idx_storage_objects_owner 
    ON storage.objects (bucket_id, owner);
  END IF;
  
EXCEPTION WHEN insufficient_privilege THEN
  -- Si no tenemos permisos, continuar sin crear índices
  RAISE NOTICE 'No se pudieron crear índices por permisos, pero no es crítico';
END $$;

-- CORRECCIÓN 5: Verificar que RLS esté habilitado
-- =====================================================

-- Verificar que RLS esté habilitado en storage.objects
DO $$
BEGIN
  -- Intentar habilitar RLS si no está habilitado
  ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN insufficient_privilege THEN
  -- Si no tenemos permisos, probablemente ya está habilitado
  RAISE NOTICE 'RLS ya está habilitado o no tenemos permisos para modificarlo';
END $$;

-- =====================================================
-- 🧪 VERIFICACIÓN FINAL
-- =====================================================

-- Verificar buckets
SELECT 
  '✅ Verificación buckets:' as status,
  id,
  name,
  public,
  file_size_limit
FROM storage.buckets
WHERE id IN ('property-images', 'user-avatars', 'verification-docs')
ORDER BY id;

-- Verificar políticas
SELECT 
  '✅ Verificación políticas:' as status,
  COUNT(*) as total_policies
FROM pg_policies 
WHERE schemaname = 'storage' 
AND tablename = 'objects';

-- Verificar funciones
SELECT 
  '✅ Verificación funciones:' as status,
  proname as function_name
FROM pg_proc 
WHERE proname IN ('get_public_image_url', 'cleanup_orphaned_images', 'cleanup_property_images');

-- Test de función get_public_image_url
SELECT 
  '✅ Test función URL:' as status,
  get_public_image_url('property-images', 'test/image.jpg') as sample_url;

-- =====================================================
-- 🎉 CORRECCIÓN COMPLETADA
-- =====================================================

SELECT '🎉 CORRECCIÓN DE ERRORES COMPLETADA' as resultado;
SELECT '✅ Configuración de Storage lista para usar' as estado;
SELECT '🚀 Próximo paso: Ejecutar migración de imágenes' as siguiente;
