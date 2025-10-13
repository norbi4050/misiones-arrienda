-- =====================================================
-- AUDITORÍA COMPLETA: Sistema de Adjuntos y Descarga
-- =====================================================
-- Fecha: 2025-01-13
-- Propósito: Verificar configuración completa de adjuntos
-- =====================================================

-- =====================================================
-- PARTE 1: VERIFICAR TABLAS EXISTENTES
-- =====================================================

-- 1.1. Listar todas las tablas relacionadas con attachments
SELECT 
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND (
    table_name LIKE '%attach%' 
    OR table_name LIKE '%message%'
  )
ORDER BY table_name;

-- 1.2. Ver estructura de MessageAttachment (Prisma)
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'MessageAttachment'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 1.3. Ver estructura de message_attachments (Supabase)
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'message_attachments'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- =====================================================
-- PARTE 2: CONTAR REGISTROS
-- =====================================================

-- 2.1. Contar registros en MessageAttachment (Prisma)
SELECT 
  'MessageAttachment' as tabla,
  COUNT(*) as total_registros
FROM "MessageAttachment";

-- 2.2. Contar registros en message_attachments (Supabase)
SELECT 
  'message_attachments' as tabla,
  COUNT(*) as total_registros
FROM message_attachments;

-- 2.3. Ver todos los registros en MessageAttachment
SELECT 
  id,
  "messageId",
  "userId",
  path,
  mime,
  "sizeBytes",
  "createdAt"
FROM "MessageAttachment"
ORDER BY "createdAt" DESC
LIMIT 10;

-- =====================================================
-- PARTE 3: VERIFICAR STORAGE BUCKET
-- =====================================================

-- 3.1. Ver configuración del bucket message-attachments
SELECT 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets
WHERE name = 'message-attachments';

-- 3.2. Ver políticas RLS del bucket
SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND policyname LIKE '%message%';

-- =====================================================
-- PARTE 4: VERIFICAR RLS POLICIES EN TABLAS
-- =====================================================

-- 4.1. Ver si RLS está habilitado en MessageAttachment
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename IN ('MessageAttachment', 'message_attachments');

-- 4.2. Ver políticas RLS de MessageAttachment
SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'MessageAttachment';

-- 4.3. Ver políticas RLS de message_attachments
SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'message_attachments';

-- =====================================================
-- PARTE 5: ANÁLISIS DE DATOS
-- =====================================================

-- 5.1. Ver adjuntos con sus mensajes asociados
SELECT 
  ma.id as attachment_id,
  ma."messageId",
  ma."userId",
  ma.path,
  ma.mime,
  ma."sizeBytes",
  m.id as message_exists,
  m.content as message_content
FROM "MessageAttachment" ma
LEFT JOIN "Message" m ON m.id = ma."messageId"
ORDER BY ma."createdAt" DESC
LIMIT 10;

-- 5.2. Buscar adjuntos huérfanos (sin mensaje asociado)
SELECT 
  id,
  "messageId",
  "userId",
  path,
  mime,
  "sizeBytes",
  "createdAt"
FROM "MessageAttachment"
WHERE "messageId" IS NULL
ORDER BY "createdAt" DESC;

-- 5.3. Verificar si hay duplicados de path
SELECT 
  path,
  COUNT(*) as veces
FROM "MessageAttachment"
GROUP BY path
HAVING COUNT(*) > 1;

-- =====================================================
-- PARTE 6: VERIFICAR FUNCIÓN RPC
-- =====================================================

-- 6.1. Ver si existe la función get_unread_messages_count
SELECT 
  routine_name,
  routine_type,
  data_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name LIKE '%unread%';

-- =====================================================
-- PARTE 7: RECOMENDACIONES Y FIXES
-- =====================================================

-- 7.1. Si message_attachments está vacía, crear vista que mapee a MessageAttachment
-- EJECUTAR SOLO SI ES NECESARIO:
/*
CREATE OR REPLACE VIEW message_attachments AS
SELECT 
  id,
  "messageId" as message_id,
  "userId" as user_id,
  path,
  mime,
  "sizeBytes" as size_bytes,
  bucket,
  "createdAt" as created_at,
  "updatedAt" as updated_at
FROM "MessageAttachment";
*/

-- 7.2. Verificar que el bucket permite descargas
-- EJECUTAR EN SUPABASE DASHBOARD > Storage > message-attachments > Settings:
-- - Public: NO (debe ser privado)
-- - File size limit: 10485760 (10MB) o según necesites
-- - Allowed MIME types: image/*, application/pdf, etc.

-- 7.3. Crear índices si no existen
CREATE INDEX IF NOT EXISTS idx_messageattachment_messageid 
  ON "MessageAttachment"("messageId");

CREATE INDEX IF NOT EXISTS idx_messageattachment_userid 
  ON "MessageAttachment"("userId");

CREATE INDEX IF NOT EXISTS idx_messageattachment_path 
  ON "MessageAttachment"(path);

-- =====================================================
-- PARTE 8: LIMPIEZA (OPCIONAL)
-- =====================================================

-- 8.1. Ver archivos en Storage que NO tienen registro en DB
-- (Esto requiere ejecutar desde el código, no desde SQL)
-- Usar el endpoint: /api/debug-attachments-tables

-- 8.2. Eliminar registros huérfanos (SIN mensaje asociado) más antiguos de 7 días
-- CUIDADO: Solo ejecutar si estás seguro
/*
DELETE FROM "MessageAttachment"
WHERE "messageId" IS NULL
  AND "createdAt" < NOW() - INTERVAL '7 days';
*/

-- =====================================================
-- PARTE 9: VERIFICACIÓN FINAL
-- =====================================================

-- 9.1. Resumen ejecutivo
SELECT 
  'MessageAttachment' as tabla,
  COUNT(*) as total,
  COUNT(CASE WHEN "messageId" IS NULL THEN 1 END) as sin_mensaje,
  COUNT(CASE WHEN "messageId" IS NOT NULL THEN 1 END) as con_mensaje,
  SUM("sizeBytes") as bytes_totales,
  pg_size_pretty(SUM("sizeBytes")::bigint) as tamaño_legible
FROM "MessageAttachment";

-- 9.2. Últimos 5 adjuntos subidos
SELECT 
  id,
  "messageId",
  "userId",
  path,
  mime,
  pg_size_pretty("sizeBytes"::bigint) as tamaño,
  "createdAt"
FROM "MessageAttachment"
ORDER BY "createdAt" DESC
LIMIT 5;

-- 9.3. Verificar que el adjunto específico existe
SELECT 
  id,
  "messageId",
  "userId",
  path,
  mime,
  "sizeBytes",
  "createdAt"
FROM "MessageAttachment"
WHERE id = '99e91d46-dfea-49f0-8787-f30c7efdf48f';

-- =====================================================
-- RESULTADO ESPERADO
-- =====================================================
/*
ESPERADO:
- MessageAttachment: 1+ registros
- message_attachments: 0 registros (es una vista o tabla vacía)
- Bucket message-attachments: configurado y privado
- RLS policies: habilitadas y correctas
- Índices: creados
- Adjunto 99e91d46-dfea-49f0-8787-f30c7efdf48f: existe y tiene path válido

SI TODO ESTÁ BIEN:
- El código ya está corregido para buscar en MessageAttachment
- La descarga debería funcionar ahora
- Puedes probar con: http://localhost:3000/api/messages/attachments/99e91d46-dfea-49f0-8787-f30c7efdf48f
*/
