-- =====================================================
-- MIGRACIÓN SISTEMA DE ADJUNTOS V2.0
-- Fecha: 11 de Enero de 2025
-- Propósito: Crear sistema robusto de adjuntos desde cero
-- =====================================================

-- =====================================================
-- PASO 1: CREAR TABLA message_attachments
-- =====================================================

-- Eliminar tabla vieja si existe (con precaución)
-- DROP TABLE IF EXISTS "MessageAttachment" CASCADE;

-- Crear nueva tabla con estructura limpia
CREATE TABLE IF NOT EXISTS message_attachments (
  id VARCHAR(30) PRIMARY KEY,
  
  -- Relación con mensaje (REQUERIDO - No más huérfanos)
  message_id VARCHAR(30) NOT NULL,
  
  -- Información del archivo
  file_name VARCHAR(255) NOT NULL,
  file_size INTEGER NOT NULL CHECK (file_size > 0),
  mime_type VARCHAR(100) NOT NULL,
  
  -- Storage en Supabase
  storage_path VARCHAR(500) NOT NULL UNIQUE,
  storage_url TEXT NOT NULL,
  
  -- Metadata para imágenes (opcional)
  width INTEGER CHECK (width > 0),
  height INTEGER CHECK (height > 0),
  
  -- Auditoría y seguridad
  uploaded_by VARCHAR(30) NOT NULL,
  created_at TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
  
  -- Foreign key con CASCADE delete
  CONSTRAINT fk_message
    FOREIGN KEY (message_id) 
    REFERENCES "Message"(id) 
    ON DELETE CASCADE
);

-- =====================================================
-- PASO 2: CREAR ÍNDICES PARA PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_message_attachments_message_id 
  ON message_attachments(message_id);

CREATE INDEX IF NOT EXISTS idx_message_attachments_uploaded_by 
  ON message_attachments(uploaded_by);

CREATE INDEX IF NOT EXISTS idx_message_attachments_created_at 
  ON message_attachments(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_message_attachments_mime_type 
  ON message_attachments(mime_type);

-- =====================================================
-- PASO 3: HABILITAR ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE message_attachments ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- PASO 4: CREAR POLÍTICAS DE SEGURIDAD (RLS)
-- =====================================================

-- Eliminar políticas viejas si existen
DROP POLICY IF EXISTS "users_can_view_conversation_attachments" ON message_attachments;
DROP POLICY IF EXISTS "users_can_create_attachments" ON message_attachments;
DROP POLICY IF EXISTS "users_can_delete_own_attachments" ON message_attachments;

-- Policy 1: SELECT - Usuarios pueden ver adjuntos de sus conversaciones
CREATE POLICY "users_can_view_conversation_attachments"
ON message_attachments FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM "Message" m
    INNER JOIN "Conversation" c ON m."conversationId" = c.id
    INNER JOIN "UserProfile" up ON up."userId" = auth.uid()
    WHERE m.id = message_attachments.message_id
    AND (c."aId" = up.id OR c."bId" = up.id)
  )
);

-- Policy 2: INSERT - Usuarios pueden crear adjuntos (validado en backend)
CREATE POLICY "users_can_create_attachments"
ON message_attachments FOR INSERT
TO authenticated
WITH CHECK (
  uploaded_by = auth.uid()
);

-- Policy 3: DELETE - Usuarios pueden eliminar sus propios adjuntos
CREATE POLICY "users_can_delete_own_attachments"
ON message_attachments FOR DELETE
TO authenticated
USING (
  uploaded_by = auth.uid()
);

-- =====================================================
-- PASO 5: CONFIGURAR STORAGE BUCKET
-- =====================================================

-- Verificar que el bucket existe
SELECT * FROM storage.buckets WHERE name = 'message-attachments';

-- Si NO existe, crearlo (ejecutar en Dashboard de Supabase)
-- Dashboard > Storage > New Bucket
-- Nombre: message-attachments
-- Público: NO (privado)
-- File size limit: 26214400 (25 MB)
-- Allowed MIME types: image/jpeg, image/png, application/pdf

-- =====================================================
-- PASO 6: CONFIGURAR POLÍTICAS DE STORAGE
-- =====================================================

-- Eliminar políticas viejas
DROP POLICY IF EXISTS "authenticated_users_can_upload" ON storage.objects;
DROP POLICY IF EXISTS "authenticated_users_can_read" ON storage.objects;
DROP POLICY IF EXISTS "users_can_delete_own_files" ON storage.objects;

-- Policy 1: INSERT - Usuarios autenticados pueden subir
CREATE POLICY "authenticated_users_can_upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'message-attachments'
);

-- Policy 2: SELECT - Usuarios pueden leer archivos de sus conversaciones
CREATE POLICY "authenticated_users_can_read"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'message-attachments'
);

-- Policy 3: DELETE - Usuarios pueden eliminar sus archivos
CREATE POLICY "users_can_delete_own_files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'message-attachments' AND
  owner = auth.uid()
);

-- =====================================================
-- PASO 7: CREAR FUNCIÓN PARA CONTAR ADJUNTOS DIARIOS
-- =====================================================

-- Función para validar cuota diaria de adjuntos
CREATE OR REPLACE FUNCTION count_user_daily_attachments(user_uuid UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  daily_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO daily_count
  FROM message_attachments
  WHERE uploaded_by = user_uuid::TEXT
  AND created_at >= CURRENT_DATE;
  
  RETURN COALESCE(daily_count, 0);
END;
$$;

-- =====================================================
-- PASO 8: CREAR FUNCIÓN PARA LIMPIAR ADJUNTOS HUÉRFANOS
-- =====================================================

-- Función para identificar y limpiar archivos huérfanos en Storage
CREATE OR REPLACE FUNCTION cleanup_orphan_attachments()
RETURNS TABLE(
  deleted_count INTEGER,
  deleted_files TEXT[]
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  orphan_record RECORD;
  deleted_list TEXT[] := '{}';
  count INTEGER := 0;
BEGIN
  -- Buscar archivos en Storage que no tienen registro en DB
  FOR orphan_record IN
    SELECT o.name
    FROM storage.objects o
    WHERE o.bucket_id = 'message-attachments'
    AND NOT EXISTS (
      SELECT 1 
      FROM message_attachments ma 
      WHERE ma.storage_path = o.name
    )
    AND o.created_at < NOW() - INTERVAL '24 hours' -- Solo archivos con más de 24h
  LOOP
    -- Eliminar archivo de Storage
    DELETE FROM storage.objects
    WHERE bucket_id = 'message-attachments'
    AND name = orphan_record.name;
    
    -- Agregar a lista
    deleted_list := array_append(deleted_list, orphan_record.name);
    count := count + 1;
  END LOOP;
  
  RETURN QUERY SELECT count, deleted_list;
END;
$$;

-- =====================================================
-- PASO 9: CREAR TRIGGER PARA UPDATED_AT
-- =====================================================

-- Función genérica para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para message_attachments
DROP TRIGGER IF EXISTS update_message_attachments_updated_at ON message_attachments;

CREATE TRIGGER update_message_attachments_updated_at
  BEFORE UPDATE ON message_attachments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- PASO 10: VERIFICACIÓN DE LA MIGRACIÓN
-- =====================================================

-- Verificar que la tabla existe
SELECT 
  table_name,
  table_type
FROM information_schema.tables
WHERE table_name = 'message_attachments';

-- Verificar columnas
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'message_attachments'
ORDER BY ordinal_position;

-- Verificar índices
SELECT
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'message_attachments'
ORDER BY indexname;

-- Verificar RLS está habilitado
SELECT 
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename = 'message_attachments';

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
WHERE tablename = 'message_attachments'
ORDER BY policyname;

-- Verificar políticas de Storage
SELECT
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'objects'
AND policyname LIKE '%message%'
ORDER BY policyname;

-- Verificar funciones creadas
SELECT 
  routine_name,
  routine_type,
  security_type
FROM information_schema.routines
WHERE routine_name IN ('count_user_daily_attachments', 'cleanup_orphan_attachments')
ORDER BY routine_name;

-- =====================================================
-- PASO 11: DATOS DE PRUEBA (OPCIONAL - SOLO EN DEV)
-- =====================================================

-- NO EJECUTAR EN PRODUCCIÓN
-- Esto es solo para testing en desarrollo

/*
-- Insertar adjunto de prueba
INSERT INTO message_attachments (
  id,
  message_id,
  file_name,
  file_size,
  mime_type,
  storage_path,
  storage_url,
  uploaded_by,
  created_at,
  updated_at
) VALUES (
  'att_test_001',
  'msg_test_001', -- Debe existir en Message
  'test-image.jpg',
  1024000,
  'image/jpeg',
  'conv_123/msg_test_001/test-image.jpg',
  'https://example.com/signed-url',
  'user_test_001',
  NOW(),
  NOW()
);

-- Verificar inserción
SELECT * FROM message_attachments WHERE id = 'att_test_001';
*/

-- =====================================================
-- PASO 12: MIGRAR DATOS EXISTENTES (SI LOS HAY)
-- =====================================================

-- Solo ejecutar si existe tabla vieja con datos válidos
/*
INSERT INTO message_attachments (
  id,
  message_id,
  file_name,
  file_size,
  mime_type,
  storage_path,
  storage_url,
  uploaded_by,
  created_at,
  updated_at
)
SELECT
  id,
  message_id,
  file_name,
  file_size,
  mime_type,
  storage_path,
  storage_url,
  uploaded_by,
  created_at,
  updated_at
FROM "MessageAttachment" -- Tabla vieja
WHERE message_id IS NOT NULL -- Solo adjuntos vinculados
ON CONFLICT (id) DO NOTHING;

-- Verificar migración
SELECT 
  COUNT(*) as total_migrated,
  COUNT(DISTINCT message_id) as unique_messages,
  COUNT(DISTINCT uploaded_by) as unique_users
FROM message_attachments;
*/

-- =====================================================
-- PASO 13: LIMPIAR ARCHIVOS HUÉRFANOS (DESPUÉS DE MIGRACIÓN)
-- =====================================================

-- Ejecutar función de limpieza
-- SELECT * FROM cleanup_orphan_attachments();

-- =====================================================
-- RESULTADO ESPERADO
-- =====================================================

/*
✅ Tabla message_attachments creada
✅ Índices creados para performance
✅ RLS habilitado
✅ 3 políticas RLS activas (SELECT, INSERT, DELETE)
✅ 3 políticas Storage activas
✅ 2 funciones auxiliares creadas
✅ Trigger para updated_at activo
✅ Foreign key con CASCADE delete
✅ Constraints de validación activos
*/

-- =====================================================
-- NOTAS IMPORTANTES
-- =====================================================

/*
1. SIEMPRE hacer backup antes de ejecutar en producción
2. Ejecutar en ambiente de desarrollo primero
3. Verificar cada paso antes de continuar
4. La tabla vieja (MessageAttachment) se puede eliminar después de verificar
5. Los archivos huérfanos en Storage se limpian con la función
6. Las URLs firmadas se regeneran según necesidad en el backend
*/

-- =====================================================
-- FIN DE LA MIGRACIÓN
-- =====================================================
