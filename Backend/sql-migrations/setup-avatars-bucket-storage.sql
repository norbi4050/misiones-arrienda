-- CONFIGURACIÓN COMPLETA DEL BUCKET DE AVATARES EN SUPABASE
-- Ejecutar este script en el SQL Editor de Supabase

-- 1. CREAR BUCKET DE AVATARES (si no existe)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars', 
  true,
  5242880, -- 5MB en bytes
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'];

-- 2. CONFIGURAR POLÍTICAS RLS PARA EL BUCKET DE AVATARES

-- Eliminar políticas existentes si existen
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can view all avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;

-- Política para SUBIR avatares (solo el propio usuario)
CREATE POLICY "Users can upload their own avatar" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Política para VER avatares (todos pueden ver avatares públicos)
CREATE POLICY "Users can view all avatars" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

-- Política para ACTUALIZAR avatares (solo el propio usuario)
CREATE POLICY "Users can update their own avatar" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Política para ELIMINAR avatares (solo el propio usuario)
CREATE POLICY "Users can delete their own avatar" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- 3. VERIFICAR QUE LA TABLA USERS TENGA LA COLUMNA profile_image

-- Agregar columna profile_image si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'profile_image'
    ) THEN
        ALTER TABLE users ADD COLUMN profile_image TEXT;
    END IF;
END $$;

-- 4. CREAR FUNCIÓN PARA LIMPIAR AVATARES HUÉRFANOS

CREATE OR REPLACE FUNCTION cleanup_orphaned_avatars()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER := 0;
    avatar_record RECORD;
BEGIN
    -- Buscar archivos en storage que no tienen usuario asociado
    FOR avatar_record IN 
        SELECT name 
        FROM storage.objects 
        WHERE bucket_id = 'avatars'
        AND name NOT IN (
            SELECT SUBSTRING(profile_image FROM '.*/(.*)$') 
            FROM users 
            WHERE profile_image IS NOT NULL
            AND profile_image LIKE '%/avatars/%'
        )
    LOOP
        -- Eliminar archivo huérfano
        DELETE FROM storage.objects 
        WHERE bucket_id = 'avatars' AND name = avatar_record.name;
        
        deleted_count := deleted_count + 1;
    END LOOP;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. CREAR TRIGGER PARA LIMPIAR AVATAR AL ELIMINAR USUARIO

CREATE OR REPLACE FUNCTION cleanup_user_avatar()
RETURNS TRIGGER AS $$
BEGIN
    -- Si el usuario tenía avatar, eliminarlo del storage
    IF OLD.profile_image IS NOT NULL AND OLD.profile_image LIKE '%/avatars/%' THEN
        -- Extraer nombre del archivo
        DECLARE
            file_path TEXT;
        BEGIN
            file_path := SUBSTRING(OLD.profile_image FROM '.*/avatars/(.*)$');
            
            IF file_path IS NOT NULL THEN
                DELETE FROM storage.objects 
                WHERE bucket_id = 'avatars' AND name = 'avatars/' || file_path;
            END IF;
        END;
    END IF;
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crear trigger si no existe
DROP TRIGGER IF EXISTS cleanup_user_avatar_trigger ON users;
CREATE TRIGGER cleanup_user_avatar_trigger
    BEFORE DELETE ON users
    FOR EACH ROW
    EXECUTE FUNCTION cleanup_user_avatar();

-- 6. VERIFICAR CONFIGURACIÓN

-- Verificar que el bucket existe
SELECT 
    'avatars bucket' as component,
    CASE 
        WHEN EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'avatars') 
        THEN '✅ EXISTS' 
        ELSE '❌ MISSING' 
    END as status;

-- Verificar políticas RLS
SELECT 
    'RLS policies' as component,
    COUNT(*) || ' policies created' as status
FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage'
AND policyname LIKE '%avatar%';

-- Verificar columna profile_image
SELECT 
    'profile_image column' as component,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'users' AND column_name = 'profile_image'
        ) 
        THEN '✅ EXISTS' 
        ELSE '❌ MISSING' 
    END as status;

-- Verificar función de limpieza
SELECT 
    'cleanup function' as component,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_proc 
            WHERE proname = 'cleanup_orphaned_avatars'
        ) 
        THEN '✅ EXISTS' 
        ELSE '❌ MISSING' 
    END as status;

-- 7. MENSAJE FINAL
SELECT 
    '🎉 CONFIGURACIÓN COMPLETADA' as message,
    'El bucket de avatares está listo para usar' as details;

-- INSTRUCCIONES ADICIONALES:
-- 
-- 1. Verificar en Supabase Dashboard > Storage que el bucket 'avatars' aparezca
-- 2. Verificar que sea público (public = true)
-- 3. Probar subir un archivo de prueba desde la interfaz
-- 4. Verificar que las políticas RLS permitan las operaciones correctas
--
-- Si hay problemas, revisar:
-- - Variables de entorno NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY
-- - Permisos del usuario en Supabase
-- - Configuración de CORS si es necesario
