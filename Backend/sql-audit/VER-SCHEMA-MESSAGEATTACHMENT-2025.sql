-- Ver el schema real de MessageAttachment
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'MessageAttachment'
ORDER BY ordinal_position;

-- Ver todos los adjuntos sin filtrar por columnas específicas
SELECT *
FROM "MessageAttachment"
ORDER BY "createdAt" DESC
LIMIT 5;
