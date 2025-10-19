-- =====================================================
-- MIGRACIÓN: Hacer message_id nullable en message_attachments
-- =====================================================
--
-- PROBLEMA: Los adjuntos se suben ANTES de enviar el mensaje,
-- pero message_id tiene constraint NOT NULL y foreign key,
-- causando error 23503 (violación de foreign key).
--
-- SOLUCIÓN: Hacer message_id nullable para permitir el flujo:
-- 1. Upload attachment → message_id = NULL
-- 2. User sends message → UPDATE message_id
-- =====================================================

BEGIN;

-- Paso 1: Eliminar la constraint NOT NULL
ALTER TABLE public.message_attachments
ALTER COLUMN message_id DROP NOT NULL;

-- Paso 2: Eliminar y recrear la foreign key constraint para permitir NULL
ALTER TABLE public.message_attachments
DROP CONSTRAINT IF EXISTS message_attachments_message_id_fkey;

ALTER TABLE public.message_attachments
ADD CONSTRAINT message_attachments_message_id_fkey
FOREIGN KEY (message_id)
REFERENCES public.messages(id)
ON DELETE CASCADE;

-- Paso 3: Crear índice parcial para attachments sin mensaje asignado
-- (útil para queries de cleanup de adjuntos huérfanos)
CREATE INDEX IF NOT EXISTS idx_message_attachments_orphaned
ON public.message_attachments(created_at)
WHERE message_id IS NULL;

-- Verificar cambios
SELECT
  column_name,
  is_nullable,
  data_type
FROM information_schema.columns
WHERE table_name = 'message_attachments'
  AND column_name = 'message_id';

COMMIT;

-- =====================================================
-- NOTAS POST-MIGRACIÓN:
-- =====================================================
--
-- ✅ message_id ahora puede ser NULL
-- ✅ Foreign key permite NULL pero valida referencias cuando hay valor
-- ✅ ON DELETE CASCADE: si se borra el mensaje, se borran sus adjuntos
--
-- PRÓXIMOS PASOS:
-- 1. Regenerar Prisma client: npx prisma generate
-- 2. Probar upload de attachment sin messageId
-- 3. Verificar que la vinculación funciona al enviar mensaje
--
-- LIMPIEZA PERIÓDICA (OPCIONAL):
-- Crear job para borrar adjuntos huérfanos después de 24h:
--
-- DELETE FROM public.message_attachments
-- WHERE message_id IS NULL
--   AND created_at < NOW() - INTERVAL '24 hours';
-- =====================================================
