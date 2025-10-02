-- =====================================================
-- B6 - MESSAGE ATTACHMENTS SCHEMA (FIXED)
-- Fecha: Enero 2025
-- Propósito: Sistema completo de adjuntos para mensajes
-- COMPATIBLE CON: messages.id = TEXT
-- =====================================================

-- =====================================================
-- 1. TABLA MESSAGE_ATTACHMENTS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.message_attachments (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  message_id TEXT NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,  -- Referencia a auth.users pero como TEXT
  bucket TEXT NOT NULL DEFAULT 'message-attachments',
  path TEXT NOT NULL,
  mime TEXT NOT NULL,
  size_bytes INT4 NOT NULL,
  width INT2 NULL,
  height INT2 NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  
  -- Constraints
  CONSTRAINT valid_mime CHECK (mime IN ('image/png', 'image/jpeg', 'image/jpg', 'application/pdf')),
  CONSTRAINT valid_size CHECK (size_bytes > 0 AND size_bytes <= 52428800), -- 50MB max
  CONSTRAINT valid_dimensions CHECK (
    (width IS NULL AND height IS NULL) OR 
    (width > 0 AND height > 0)
  )
);

-- =====================================================
-- 2. ÍNDICES PARA PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_message_attachments_message_id 
  ON public.message_attachments(message_id);

CREATE INDEX IF NOT EXISTS idx_message_attachments_user_id 
  ON public.message_attachments(user_id);

CREATE INDEX IF NOT EXISTS idx_message_attachments_mime 
  ON public.message_attachments(mime);

CREATE INDEX IF NOT EXISTS idx_message_attachments_created_at 
  ON public.message_attachments(created_at DESC);

-- Índice compuesto para queries comunes
CREATE INDEX IF NOT EXISTS idx_message_attachments_user_date 
  ON public.message_attachments(user_id, created_at DESC);

-- =====================================================
-- 3. VISTA AUXILIAR (LIGHT)
-- =====================================================

CREATE OR REPLACE VIEW v_message_attachments_light AS
SELECT 
  id,
  message_id,
  user_id,
  mime,
  size_bytes,
  width,
  height,
  created_at
FROM public.message_attachments;

-- =====================================================
-- 4. FUNCIÓN: CONTEO DIARIO DE ADJUNTOS POR USUARIO
-- =====================================================

CREATE OR REPLACE FUNCTION count_user_daily_attachments(user_uuid TEXT)
RETURNS INT AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INT
    FROM public.message_attachments
    WHERE user_id = user_uuid
    AND created_at >= CURRENT_DATE
    AND created_at < CURRENT_DATE + INTERVAL '1 day'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comentario de la función
COMMENT ON FUNCTION count_user_daily_attachments(TEXT) IS 
  'Cuenta los adjuntos subidos por un usuario en el día actual (para límites de plan)';

-- =====================================================
-- 5. RLS POLICIES - TABLA MESSAGE_ATTACHMENTS
-- =====================================================

-- Habilitar RLS
ALTER TABLE public.message_attachments ENABLE ROW LEVEL SECURITY;

-- Policy 1: Lectura - Solo participantes del thread pueden ver adjuntos
CREATE POLICY "Users can read attachments from their threads" 
  ON public.message_attachments
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 
      FROM public.messages m
      INNER JOIN public.conversations c ON m.conversation_id = c.id
      WHERE m.id = message_attachments.message_id
      AND (c.participant1_id = auth.uid()::text OR c.participant2_id = auth.uid()::text)
    )
  );

-- Policy 2: Inserción - Solo autor del mensaje puede adjuntar
CREATE POLICY "Users can insert attachments to their messages" 
  ON public.message_attachments
  FOR INSERT 
  WITH CHECK (
    user_id = auth.uid()::text
    AND EXISTS (
      SELECT 1 
      FROM public.messages m
      WHERE m.id = message_id
      AND m.sender_id = auth.uid()::text
    )
  );

-- Policy 3: Eliminación - Solo autor del adjunto puede eliminar
CREATE POLICY "Users can delete their own attachments" 
  ON public.message_attachments
  FOR DELETE 
  USING (user_id = auth.uid()::text);

-- Policy 4: Service Role bypass (para operaciones administrativas)
CREATE POLICY "Service role has full access" 
  ON public.message_attachments
  FOR ALL 
  USING (auth.jwt()->>'role' = 'service_role');

-- =====================================================
-- 6. STORAGE BUCKET CONFIGURATION
-- =====================================================

-- Crear bucket (ejecutar en Supabase Dashboard > Storage o via SQL)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'message-attachments',
  'message-attachments',
  false,  -- NO público - usar signed URLs
  52428800,  -- 50MB límite máximo (BUSINESS plan)
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- =====================================================
-- 7. STORAGE RLS POLICIES
-- =====================================================

-- Policy 1: Lectura - Solo participantes del thread
CREATE POLICY "Thread participants can read attachments" 
  ON storage.objects
  FOR SELECT 
  USING (
    bucket_id = 'message-attachments'
    AND (
      -- Permitir al service role
      auth.jwt()->>'role' = 'service_role'
      OR
      -- Permitir a participantes del thread
      EXISTS (
        SELECT 1 
        FROM public.message_attachments ma
        INNER JOIN public.messages m ON ma.message_id = m.id
        INNER JOIN public.conversations c ON m.conversation_id = c.id
        WHERE ma.path = storage.objects.name
        AND (c.participant1_id = auth.uid()::text OR c.participant2_id = auth.uid()::text)
      )
    )
  );

-- Policy 2: Escritura - Solo usuarios autenticados en su carpeta
CREATE POLICY "Users can upload their attachments" 
  ON storage.objects
  FOR INSERT 
  WITH CHECK (
    bucket_id = 'message-attachments'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Policy 3: Actualización - Solo dueño del archivo
CREATE POLICY "Users can update their attachments" 
  ON storage.objects
  FOR UPDATE 
  USING (
    bucket_id = 'message-attachments'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Policy 4: Eliminación - Solo dueño del archivo
CREATE POLICY "Users can delete their attachments" 
  ON storage.objects
  FOR DELETE 
  USING (
    bucket_id = 'message-attachments'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- =====================================================
-- 8. TRIGGERS Y FUNCIONES AUXILIARES
-- =====================================================

-- Función para limpiar archivos huérfanos en storage
CREATE OR REPLACE FUNCTION cleanup_orphan_attachment_files()
RETURNS TRIGGER AS $$
BEGIN
  -- Cuando se elimina un registro de message_attachments,
  -- también eliminar el archivo del storage
  PERFORM storage.delete_object('message-attachments', OLD.path);
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para limpieza automática
CREATE TRIGGER trigger_cleanup_attachment_files
  AFTER DELETE ON public.message_attachments
  FOR EACH ROW
  EXECUTE FUNCTION cleanup_orphan_attachment_files();

-- =====================================================
-- 9. VERIFICACIÓN DE CONFIGURACIÓN
-- =====================================================

-- Verificar que el bucket existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'message-attachments'
  ) THEN
    RAISE NOTICE 'ADVERTENCIA: Bucket message-attachments no existe. Créalo manualmente en Supabase Dashboard.';
  ELSE
    RAISE NOTICE 'OK: Bucket message-attachments existe';
  END IF;
END $$;

-- Verificar tabla
SELECT 
  'message_attachments' as tabla,
  COUNT(*) as registros,
  pg_size_pretty(pg_total_relation_size('public.message_attachments')) as tamaño
FROM public.message_attachments;

-- Verificar índices
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes 
WHERE tablename = 'message_attachments'
ORDER BY indexname;

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
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'objects' 
AND policyname LIKE '%attachment%'
ORDER BY policyname;

-- =====================================================
-- 10. DATOS DE PRUEBA (OPCIONAL - SOLO DESARROLLO)
-- =====================================================

-- Descomentar solo en entorno de desarrollo
/*
-- Insertar adjunto de prueba (requiere mensaje y conversación existentes)
INSERT INTO public.message_attachments (
  message_id,
  user_id,
  path,
  mime,
  size_bytes,
  width,
  height
) VALUES (
  'MESSAGE_ID_AQUI',  -- TEXT, no UUID
  auth.uid()::text,
  auth.uid()::text || '/thread-id/test-image.jpg',
  'image/jpeg',
  1024000,
  1920,
  1080
);
*/

-- =====================================================
-- 11. COMANDOS DE ROLLBACK (SI ES NECESARIO)
-- =====================================================

/*
-- ADVERTENCIA: Esto eliminará TODOS los datos de adjuntos

-- Eliminar trigger
DROP TRIGGER IF EXISTS trigger_cleanup_attachment_files ON public.message_attachments;

-- Eliminar función de trigger
DROP FUNCTION IF EXISTS cleanup_orphan_attachment_files();

-- Eliminar función de conteo
DROP FUNCTION IF EXISTS count_user_daily_attachments(UUID);

-- Eliminar vista
DROP VIEW IF EXISTS v_message_attachments_light;

-- Eliminar políticas de storage
DROP POLICY IF EXISTS "Thread participants can read attachments" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their attachments" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their attachments" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their attachments" ON storage.objects;

-- Eliminar políticas de tabla
DROP POLICY IF EXISTS "Users can read attachments from their threads" ON public.message_attachments;
DROP POLICY IF EXISTS "Users can insert attachments to their messages" ON public.message_attachments;
DROP POLICY IF EXISTS "Users can delete their own attachments" ON public.message_attachments;
DROP POLICY IF EXISTS "Service role has full access" ON public.message_attachments;

-- Eliminar tabla
DROP TABLE IF EXISTS public.message_attachments CASCADE;

-- Eliminar bucket (ejecutar en Supabase Dashboard)
-- DELETE FROM storage.buckets WHERE id = 'message-attachments';
*/

-- =====================================================
-- NOTAS IMPORTANTES
-- =====================================================

/*
ESTRUCTURA DE PATHS EN STORAGE:
- Formato: {userId}/{threadId}/{timestamp}-{filename}
- Ejemplo: 6403f9d2-e846-4c70-87e0-e051127d9500/thread-abc/1704312345678-documento.pdf

PERMISOS:
- Lectura: Solo participantes del thread (via RLS)
- Escritura: Solo propietario autenticado
- Service Role: Bypasea todas las políticas

LÍMITES POR PLAN:
- FREE: 5MB, 20 adjuntos/día
- PRO: 15MB, 200 adjuntos/día  
- BUSINESS: 50MB, 1000 adjuntos/día

TIPOS PERMITIDOS (FASE 1):
- image/png
- image/jpeg
- image/jpg
- application/pdf

SEGURIDAD:
- Bucket NO público
- URLs firmadas con expiración (1 hora)
- RLS en tabla y storage
- Validación de participación en thread
- Sanitización de nombres de archivo en API

VARIABLES DE ENTORNO REQUERIDAS:
- NEXT_PUBLIC_SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY
- NEXT_PUBLIC_SUPABASE_ANON_KEY

ENDPOINTS QUE USARÁN ESTE SCHEMA:
- POST /api/messages/attachments (upload)
- DELETE /api/messages/attachments/[id] (delete)
- GET /api/messages/[id]/attachments (list)
*/

-- =====================================================
-- FIN DEL SCRIPT
-- =====================================================

-- Log de ejecución
DO $$
BEGIN
  RAISE NOTICE '==============================================';
  RAISE NOTICE 'B6 - MESSAGE ATTACHMENTS SCHEMA';
  RAISE NOTICE 'Ejecutado: %', NOW();
  RAISE NOTICE '==============================================';
END $$;
