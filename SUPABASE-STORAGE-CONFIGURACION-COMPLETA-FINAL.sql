-- =====================================================
-- CONFIGURACIÓN COMPLETA DE SUPABASE STORAGE
-- =====================================================

-- 1. CREAR BUCKETS NECESARIOS
-- =====================================================

-- Bucket para avatares de usuarios
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
) ON CONFLICT (id) DO NOTHING;

-- Bucket para imágenes de propiedades
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'properties',
  'properties',
  true,
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Bucket para documentos de verificación
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents',
  'documents',
  false, -- Privado
  20971520, -- 20MB
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
) ON CONFLICT (id) DO NOTHING;

-- 2. POLÍTICAS RLS PARA BUCKET AVATARS
-- =====================================================

-- Permitir a usuarios autenticados ver todos los avatares
CREATE POLICY "Avatars are publicly viewable" ON storage.objects
FOR SELECT USING (bucket_id = 'avatars');

-- Permitir a usuarios autenticados subir sus propios avatares
CREATE POLICY "Users can upload their own avatar" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Permitir a usuarios actualizar sus propios avatares
CREATE POLICY "Users can update their own avatar" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Permitir a usuarios eliminar sus propios avatares
CREATE POLICY "Users can delete their own avatar" ON storage.objects
FOR DELETE USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 3. POLÍTICAS RLS PARA BUCKET PROPERTIES
-- =====================================================

-- Permitir a todos ver imágenes de propiedades
CREATE POLICY "Property images are publicly viewable" ON storage.objects
FOR SELECT USING (bucket_id = 'properties');

-- Permitir a usuarios autenticados subir imágenes de propiedades
CREATE POLICY "Authenticated users can upload property images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'properties' 
  AND auth.role() = 'authenticated'
);

-- Permitir a propietarios actualizar imágenes de sus propiedades
CREATE POLICY "Users can update their property images" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'properties' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Permitir a propietarios eliminar imágenes de sus propiedades
CREATE POLICY "Users can delete their property images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'properties' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 4. POLÍTICAS RLS PARA BUCKET DOCUMENTS
-- =====================================================

-- Solo el propietario puede ver sus documentos
CREATE POLICY "Users can view their own documents" ON storage.objects
FOR SELECT USING (
  bucket_id = 'documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Solo usuarios autenticados pueden subir documentos
CREATE POLICY "Users can upload their own documents" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Solo el propietario puede actualizar sus documentos
CREATE POLICY "Users can update their own documents" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Solo el propietario puede eliminar sus documentos
CREATE POLICY "Users can delete their own documents" ON storage.objects
FOR DELETE USING (
  bucket_id = 'documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 5. FUNCIONES AUXILIARES PARA STORAGE
-- =====================================================

-- Función para obtener URL pública de avatar
CREATE OR REPLACE FUNCTION get_avatar_url(user_id UUID)
RETURNS TEXT AS $$
BEGIN
  RETURN (
    SELECT 
      CASE 
        WHEN EXISTS (
          SELECT 1 FROM storage.objects 
          WHERE bucket_id = 'avatars' 
          AND name LIKE user_id::text || '/%'
        )
        THEN (
          SELECT 'https://' || (SELECT ref FROM storage.buckets WHERE id = 'avatars') || '.supabase.co/storage/v1/object/public/avatars/' || name
          FROM storage.objects 
          WHERE bucket_id = 'avatars' 
          AND name LIKE user_id::text || '/%'
          ORDER BY created_at DESC 
          LIMIT 1
        )
        ELSE NULL
      END
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para limpiar archivos huérfanos
CREATE OR REPLACE FUNCTION cleanup_orphaned_files()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER := 0;
BEGIN
  -- Eliminar avatares de usuarios que ya no existen
  DELETE FROM storage.objects 
  WHERE bucket_id = 'avatars' 
  AND (storage.foldername(name))[1]::uuid NOT IN (
    SELECT id FROM auth.users
  );
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  -- Eliminar imágenes de propiedades que ya no existen
  DELETE FROM storage.objects 
  WHERE bucket_id = 'properties' 
  AND (storage.foldername(name))[1]::uuid NOT IN (
    SELECT user_id FROM properties
  );
  
  GET DIAGNOSTICS deleted_count = deleted_count + ROW_COUNT;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. TRIGGERS PARA LIMPIEZA AUTOMÁTICA
-- =====================================================

-- Trigger para limpiar archivos cuando se elimina un usuario
CREATE OR REPLACE FUNCTION cleanup_user_files()
RETURNS TRIGGER AS $$
BEGIN
  -- Eliminar avatar del usuario
  DELETE FROM storage.objects 
  WHERE bucket_id = 'avatars' 
  AND name LIKE OLD.id::text || '/%';
  
  -- Eliminar documentos del usuario
  DELETE FROM storage.objects 
  WHERE bucket_id = 'documents' 
  AND name LIKE OLD.id::text || '/%';
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Aplicar trigger a la tabla de usuarios
DROP TRIGGER IF EXISTS cleanup_user_files_trigger ON auth.users;
CREATE TRIGGER cleanup_user_files_trigger
  AFTER DELETE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION cleanup_user_files();

-- 7. CONFIGURACIÓN DE CORS PARA STORAGE
-- =====================================================

-- Nota: Esto debe configurarse en el dashboard de Supabase
-- Dominios permitidos:
-- - http://localhost:3000
-- - https://tu-dominio.vercel.app
-- - https://tu-dominio-personalizado.com

-- 8. VERIFICACIÓN DE CONFIGURACIÓN
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
ORDER BY created_at;

-- Verificar políticas creadas
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

-- 9. COMANDOS DE MANTENIMIENTO
-- =====================================================

-- Limpiar archivos huérfanos (ejecutar periódicamente)
-- SELECT cleanup_orphaned_files();

-- Ver estadísticas de uso de storage
SELECT 
  bucket_id,
  COUNT(*) as file_count,
  SUM(metadata->>'size')::bigint as total_size_bytes,
  ROUND(SUM(metadata->>'size')::bigint / 1024.0 / 1024.0, 2) as total_size_mb
FROM storage.objects 
GROUP BY bucket_id
ORDER BY bucket_id;

-- Ver archivos recientes por bucket
SELECT 
  bucket_id,
  name,
  metadata->>'size' as size_bytes,
  created_at
FROM storage.objects 
ORDER BY created_at DESC 
LIMIT 20;

-- =====================================================
-- CONFIGURACIÓN COMPLETADA
-- =====================================================

-- IMPORTANTE: Después de ejecutar este script:
-- 1. Configurar CORS en el dashboard de Supabase
-- 2. Verificar que las políticas RLS estén activas
-- 3. Probar la carga de archivos desde la aplicación
-- 4. Configurar limpieza automática si es necesario

COMMIT;
