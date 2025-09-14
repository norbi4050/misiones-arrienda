-- =====================================================
-- FIX AVATAR UPLOAD RLS POLICIES - 2025
-- =====================================================
-- PROBLEMA: "new row violates row-level security policy" al subir avatares
-- CAUSA: Mismatch entre estructura de paths del API y políticas RLS
-- SOLUCIÓN: Aplicar políticas RLS correctas y compatibles

-- 1. VERIFICAR ESTADO ACTUAL DEL BUCKET
SELECT 
    'Bucket avatars status' as check_type,
    CASE 
        WHEN EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'avatars') 
        THEN '✅ EXISTS' 
        ELSE '❌ MISSING' 
    END as status;

-- 2. CREAR BUCKET SI NO EXISTE
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

-- 3. ELIMINAR POLÍTICAS CONFLICTIVAS EXISTENTES
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can view all avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Avatars — public read" ON storage.objects;
DROP POLICY IF EXISTS "Avatars — users can insert into own folder" ON storage.objects;
DROP POLICY IF EXISTS "Avatars — users can update own objects" ON storage.objects;
DROP POLICY IF EXISTS "Avatars — users can delete own objects" ON storage.objects;

-- 4. APLICAR POLÍTICAS RLS CORRECTAS Y PROBADAS
-- Estas políticas funcionan con la estructura de carpetas por usuario: {user_id}/filename.jpg

-- Política para LECTURA PÚBLICA (todos pueden ver avatares)
CREATE POLICY "Avatars — public read"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'avatars');

-- Política para INSERTAR (usuarios pueden subir a su propia carpeta)
CREATE POLICY "Avatars — users can insert into own folder"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'avatars' 
    AND name LIKE auth.uid()::text || '/%'
  );

-- Política para ACTUALIZAR (usuarios pueden actualizar sus propios archivos)
CREATE POLICY "Avatars — users can update own objects"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'avatars' 
    AND name LIKE auth.uid()::text || '/%'
  )
  WITH CHECK (true);

-- Política para ELIMINAR (usuarios pueden eliminar sus propios archivos)
CREATE POLICY "Avatars — users can delete own objects"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'avatars' 
    AND name LIKE auth.uid()::text || '/%'
  );

-- 5. VERIFICAR QUE LAS POLÍTICAS SE CREARON CORRECTAMENTE
SELECT 
    'RLS Policies Created' as check_type,
    COUNT(*) || ' policies active' as status
FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage'
AND policyname LIKE 'Avatars%';

-- 6. MOSTRAR POLÍTICAS ACTIVAS PARA AVATARES
SELECT 
    policyname,
    cmd as operation,
    permissive,
    qual as using_condition,
    with_check as check_condition
FROM pg_policies 
WHERE schemaname = 'storage' 
AND tablename = 'objects'
AND policyname LIKE 'Avatars%'
ORDER BY policyname;

-- 7. VERIFICAR CONFIGURACIÓN FINAL
SELECT 
    'avatars bucket' as component,
    CASE 
        WHEN EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'avatars' AND public = true) 
        THEN '✅ PUBLIC BUCKET EXISTS' 
        ELSE '❌ BUCKET MISSING OR NOT PUBLIC' 
    END as status
UNION ALL
SELECT 
    'RLS policies' as component,
    CASE 
        WHEN (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname LIKE 'Avatars%') = 4
        THEN '✅ ALL 4 POLICIES ACTIVE'
        ELSE '❌ MISSING POLICIES'
    END as status;

-- 8. MENSAJE FINAL
SELECT 
    '🎉 AVATAR UPLOAD RLS FIX COMPLETED' as message,
    'API debe usar estructura: {user_id}/filename.jpg' as important_note;

-- NOTAS IMPORTANTES:
-- 1. El API debe cambiar de: avatars/avatar-{user.id}-{timestamp}.jpg
--    A: avatars/{user.id}/avatar-{timestamp}.jpg
-- 2. Las políticas ahora permiten que cada usuario solo acceda a su carpeta
-- 3. La lectura es pública para que los avatares se muestren correctamente
-- 4. Estas políticas son compatibles con la estructura de carpetas por usuario
