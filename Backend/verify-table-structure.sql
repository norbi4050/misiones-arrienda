-- Verificar estructura de tabla message_attachments

-- Opción 1: Verificar si existe la tabla (snake_case)
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('message_attachments', 'MessageAttachment');

-- Opción 2: Ver columnas de message_attachments (si existe)
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'message_attachments'
ORDER BY ordinal_position;

-- Opción 3: Ver columnas de MessageAttachment (si existe)
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'MessageAttachment'
ORDER BY ordinal_position;
