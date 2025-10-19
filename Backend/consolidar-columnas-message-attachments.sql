-- =====================================================
-- CONSOLIDACIÓN: Limpiar columnas duplicadas
-- =====================================================
--
-- PROBLEMA IDENTIFICADO:
-- La tabla message_attachments tiene columnas duplicadas:
-- - uploaded_by (nueva) + user_id (vieja)
-- - storage_path (nueva) + path (vieja)
-- - mime_type (nueva) + mime (vieja)
-- - file_size (nueva) + size_bytes (vieja)
--
-- SOLUCIÓN:
-- 1. Copiar datos de columnas nuevas a viejas (por compatibilidad)
-- 2. O eliminar columnas viejas (rompe código antiguo)
--
-- RECOMENDACIÓN: Opción 1 (más segura)
-- =====================================================

BEGIN;

-- =====================================================
-- PASO 1: Verificar datos actuales
-- =====================================================

-- Ver cuántos registros tienen datos en cada columna
SELECT
  'Datos en columnas' as info,
  COUNT(*) as total_registros,
  COUNT(uploaded_by) as tiene_uploaded_by,
  COUNT(user_id) as tiene_user_id,
  COUNT(storage_path) as tiene_storage_path,
  COUNT(path) as tiene_path,
  COUNT(mime_type) as tiene_mime_type,
  COUNT(mime) as tiene_mime,
  COUNT(file_size) as tiene_file_size,
  COUNT(size_bytes) as tiene_size_bytes
FROM message_attachments;

-- =====================================================
-- PASO 2: Sincronizar datos (copiar de nuevas a viejas)
-- =====================================================

-- SOLO si queremos mantener compatibilidad con código viejo
-- UPDATE message_attachments
-- SET
--   user_id = uploaded_by,
--   path = storage_path,
--   mime = mime_type,
--   size_bytes = file_size
-- WHERE uploaded_by IS NOT NULL;

-- =====================================================
-- PASO 3 (ALTERNATIVA): Eliminar columnas viejas
-- =====================================================

-- ⚠️ CUIDADO: Esto romperá cualquier código que use las columnas viejas

-- Eliminar columnas duplicadas viejas
ALTER TABLE message_attachments DROP COLUMN IF EXISTS user_id;
ALTER TABLE message_attachments DROP COLUMN IF EXISTS path;
ALTER TABLE message_attachments DROP COLUMN IF EXISTS bucket;
ALTER TABLE message_attachments DROP COLUMN IF EXISTS mime;
ALTER TABLE message_attachments DROP COLUMN IF EXISTS size_bytes;

-- Verificar estructura final
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'message_attachments'
ORDER BY ordinal_position;

COMMIT;

-- =====================================================
-- RESULTADO ESPERADO (después de eliminar columnas viejas):
-- =====================================================
-- Solo deben quedar estas columnas:
-- - id (text, NOT NULL)
-- - message_id (text, NULL) ✅
-- - uploaded_by (text, NOT NULL)
-- - storage_path (text, NOT NULL)
-- - mime_type (text, NOT NULL)
-- - file_size (integer, NOT NULL)
-- - file_name (text, NOT NULL)
-- - storage_url (text, NOT NULL)
-- - width (smallint, NULL)
-- - height (smallint, NULL)
-- - created_at (timestamp, NULL)
-- - updated_at (timestamp, NULL)
-- =====================================================
