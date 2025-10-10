-- =====================================================
-- CONFIGURACIÓN DE STORAGE PARA ADJUNTOS
-- Fecha: 11 de Enero de 2025
-- Propósito: Configurar bucket y políticas para message-attachments
-- =====================================================

-- PASO 1: Verificar si el bucket existe
-- Ejecutar en Supabase SQL Editor
SELECT * FROM storage.buckets WHERE name = 'message-attachments';

-- Si NO existe, crear el bucket (esto se hace desde el Dashboard de Supabase)
-- Dashboard > Storage > New Bucket
-- Nombre: message-attachments
-- Público: NO (privado)
-- File size limit: 10485760 (10 MB)

-- =====================================================
-- PASO 2: CONFIGURAR POLÍTICAS DE STORAGE
-- =====================================================

-- 2.1 Eliminar políticas existentes (si las hay)
DROP POLICY IF EXISTS "authenticated_users_can_upload" ON storage.objects;
DROP POLICY IF EXISTS "authenticated_users_can_read" ON storage.objects;
DROP POLICY IF EXISTS "users_can_delete_own_files" ON storage.objects;

-- 2.2 Crear política INSERT (Subir archivos)
CREATE POLICY "authenticated_users_can_upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'message-attachments'
);

-- 2.3 Crear política SELECT (Leer/Descargar archivos)
CREATE POLICY "authenticated_users_can_read"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'message-attachments'
);

-- 2.4 Crear política DELETE (Eliminar archivos propios)
CREATE POLICY "users_can_delete_own_files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'message-attachments' AND
  owner = auth.uid()
);

-- =====================================================
-- PASO 3: VERIFICAR POLÍTICAS CREADAS
-- =====================================================

-- Verificar que las políticas existen
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
  AND policyname LIKE '%message%'
ORDER BY policyname;

-- Resultado esperado: 3 políticas
-- 1. authenticated_users_can_upload (INSERT)
-- 2. authenticated_users_can_read (SELECT)
-- 3. users_can_delete_own_files (DELETE)

-- =====================================================
-- PASO 4: VERIFICAR RLS EN TABLA MessageAttachment
-- =====================================================

-- Verificar que RLS está habilitado
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'MessageAttachment';

-- Resultado esperado: rowsecurity = true

-- Verificar políticas de la tabla
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'MessageAttachment'
ORDER BY policyname;

-- Resultado esperado: Políticas que permiten:
-- - SELECT: Usuarios pueden leer adjuntos de sus conversaciones
-- - INSERT: Usuarios pueden crear adjuntos
-- - UPDATE: Usuarios pueden vincular adjuntos a mensajes
-- - DELETE: Usuarios pueden eliminar sus adjuntos

-- =====================================================
-- PASO 5: TEST DE FUNCIONALIDAD
-- =====================================================

-- 5.1 Verificar adjuntos existentes
SELECT 
  ma.id,
  ma.path,
  ma."messageId",
  ma."userId",
  ma.mime,
  ma."sizeBytes",
  ma."createdAt",
  CASE 
    WHEN ma."messageId" IS NULL THEN 'NO VINCULADO'
    ELSE 'VINCULADO'
  END as estado
FROM "MessageAttachment" ma
ORDER BY ma."createdAt" DESC
LIMIT 10;

-- 5.2 Verificar que los paths son correctos (deben empezar con UserProfile.id)
SELECT 
  ma.id,
  ma.path,
  ma."userId",
  up.id as "userProfileId",
  CASE 
    WHEN ma.path LIKE up.id || '%' THEN 'PATH CORRECTO'
    ELSE 'PATH INCORRECTO'
  END as validacion_path
FROM "MessageAttachment" ma
JOIN "UserProfile" up ON up.id = ma."userId"
ORDER BY ma."createdAt" DESC
LIMIT 10;

-- =====================================================
-- NOTAS IMPORTANTES
-- =====================================================

/*
1. El bucket DEBE ser PRIVADO (no público)
   - Los archivos solo se acceden mediante signed URLs
   - Las signed URLs expiran en 1 hora

2. Las políticas de Storage permiten:
   - INSERT: Cualquier usuario autenticado puede subir
   - SELECT: Cualquier usuario autenticado puede leer
   - DELETE: Solo el dueño puede eliminar

3. Las políticas de RLS en MessageAttachment verifican:
   - Que el usuario pertenece a la conversación
   - Que el mensaje está activo
   - Que el usuario tiene permisos

4. Archivos históricos con paths incorrectos:
   - NO se pueden recuperar
   - Fueron subidos con Auth User ID en lugar de UserProfile ID
   - El sistema maneja el error gracefully

5. Para nuevos uploads:
   - Path correcto: {userProfileId}/{threadId}/{fileName}
   - Vinculación automática al mensaje
   - Signed URLs generadas correctamente
*/

-- =====================================================
-- FIN DEL SCRIPT
-- =====================================================
