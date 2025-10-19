-- =====================================================
-- VERIFICACIÓN COMPLETA - Estado de Producción
-- =====================================================
-- Ejecuta este script en Supabase SQL Editor
-- para verificar el estado actual de la base de datos
-- =====================================================

-- ==================================================
-- 1. VERIFICAR SI message_id ES NULLABLE
-- ==================================================
SELECT
  '1. message_id NULLABLE?' as verificacion,
  column_name,
  is_nullable as resultado_esperado_YES,
  data_type
FROM information_schema.columns
WHERE table_name = 'message_attachments'
  AND column_name = 'message_id';

-- ==================================================
-- 2. VERIFICAR FOREIGN KEY APUNTA A TABLA CORRECTA
-- ==================================================
SELECT
  '2. FK apunta a Message?' as verificacion,
  kcu.table_name as from_table,
  kcu.column_name as from_column,
  ccu.table_name AS to_table_esperado_Message,
  ccu.column_name AS to_column
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND kcu.table_name = 'message_attachments'
  AND kcu.column_name = 'message_id';

-- ==================================================
-- 3. VERIFICAR ESTRUCTURA DE message_attachments
-- ==================================================
SELECT
  '3. Columnas de message_attachments' as verificacion,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'message_attachments'
ORDER BY ordinal_position;

-- ==================================================
-- 4. VERIFICAR SI EXISTEN AMBAS TABLAS
-- ==================================================
SELECT
  '4. Tablas existentes' as verificacion,
  table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('Message', 'messages', 'message_attachments', 'Conversation', 'user_profiles')
ORDER BY table_name;

-- ==================================================
-- 5. VERIFICAR ATTACHMENTS HUÉRFANOS (message_id NULL)
-- ==================================================
SELECT
  '5. Attachments huérfanos' as verificacion,
  COUNT(*) as cantidad_con_message_id_null,
  MAX(created_at) as mas_reciente
FROM message_attachments
WHERE message_id IS NULL;

-- ==================================================
-- 6. VERIFICAR ÚLTIMO ATTACHMENT CREADO
-- ==================================================
SELECT
  '6. Último attachment' as verificacion,
  id,
  message_id,
  file_name,
  uploaded_by,
  created_at
FROM message_attachments
ORDER BY created_at DESC
LIMIT 5;

-- ==================================================
-- 7. VERIFICAR CONSTRAINT ON DELETE CASCADE
-- ==================================================
SELECT
  '7. CASCADE en FK?' as verificacion,
  tc.constraint_name,
  rc.delete_rule as debe_ser_CASCADE
FROM information_schema.table_constraints AS tc
JOIN information_schema.referential_constraints AS rc
  ON tc.constraint_name = rc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name = 'message_attachments'
  AND tc.constraint_name = 'message_attachments_message_id_fkey';

-- ==================================================
-- RESUMEN DE RESULTADOS ESPERADOS
-- ==================================================
-- 1. is_nullable debe ser 'YES'
-- 2. to_table debe ser 'Message' (con comillas en schema)
-- 3. Debe tener columnas: message_id, uploaded_by, storage_path, mime_type, file_size, file_name, storage_url
-- 4. Deben existir todas las tablas listadas
-- 5. Puede haber attachments con message_id NULL (es válido)
-- 6. Ver estructura de últimos attachments
-- 7. delete_rule debe ser 'CASCADE'
-- ==================================================
