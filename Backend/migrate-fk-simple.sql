-- =====================================================
-- MIGRACIÓN PARTE 2: Corregir Foreign Key (SIMPLIFICADA)
-- =====================================================

-- Eliminar foreign key existente
ALTER TABLE public.message_attachments
DROP CONSTRAINT IF EXISTS message_attachments_message_id_fkey;

-- Recrear foreign key apuntando a la tabla CORRECTA (Message con PascalCase)
ALTER TABLE public.message_attachments
ADD CONSTRAINT message_attachments_message_id_fkey
FOREIGN KEY (message_id)
REFERENCES public."Message"(id)
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
