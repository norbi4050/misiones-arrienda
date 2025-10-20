-- =====================================================
-- MIGRACIÓN PARTE 2: Corregir Foreign Key
-- =====================================================
--
-- PROBLEMA DETECTADO EN TEST E2E:
-- La foreign key apunta a "messages" (schema Supabase antiguo)
-- pero los mensajes se crean en "Message" (schema Prisma).
--
-- ERROR: insert or update on table "message_attachments" violates
-- foreign key constraint "message_attachments_message_id_fkey"
--
-- SOLUCIÓN: Actualizar FK para apuntar a la tabla correcta
-- =====================================================

BEGIN;

-- Verificar cuál tabla se está usando para mensajes
DO $$
DECLARE
  message_count_prisma INT;
  message_count_supabase INT;
BEGIN
  SELECT COUNT(*) INTO message_count_prisma FROM public."Message";
  SELECT COUNT(*) INTO message_count_supabase FROM public.messages;

  RAISE NOTICE 'Mensajes en "Message" (Prisma): %', message_count_prisma;
  RAISE NOTICE 'Mensajes en "messages" (Supabase): %', message_count_supabase;
END $$;

-- Eliminar foreign key existente
ALTER TABLE public.message_attachments
DROP CONSTRAINT IF EXISTS message_attachments_message_id_fkey;

-- Recrear foreign key apuntando a la tabla CORRECTA (Message con PascalCase)
ALTER TABLE public.message_attachments
ADD CONSTRAINT message_attachments_message_id_fkey
FOREIGN KEY (message_id)
REFERENCES public."Message"(id)  -- ← Cambiado de messages a "Message"
ON DELETE CASCADE;

-- Verificar constraint actualizada
SELECT
  tc.constraint_name,
  kcu.table_name as from_table,
  kcu.column_name as from_column,
  ccu.table_name AS to_table,
  ccu.column_name AS to_column
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND kcu.table_name = 'message_attachments'
  AND kcu.column_name = 'message_id';

COMMIT;

-- =====================================================
-- RESULTADO ESPERADO:
-- =====================================================
-- from_table: message_attachments
-- from_column: message_id
-- to_table: Message  ← Debe ser "Message" (PascalCase)
-- to_column: id
-- =====================================================
