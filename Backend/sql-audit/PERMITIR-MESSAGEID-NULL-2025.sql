-- =====================================================
-- Permitir messageId NULL en MessageAttachment
-- Para que los archivos puedan subirse antes de crear el mensaje
-- =====================================================

-- Modificar la columna messageId para permitir NULL
ALTER TABLE "MessageAttachment" 
ALTER COLUMN "messageId" DROP NOT NULL;

-- Verificar el cambio
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'MessageAttachment'
AND column_name = 'messageId';
