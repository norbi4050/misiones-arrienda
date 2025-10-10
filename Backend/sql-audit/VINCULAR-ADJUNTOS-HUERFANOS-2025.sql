-- =====================================================
-- Vincular adjuntos huérfanos a sus mensajes
-- =====================================================

-- Ver adjuntos sin mensaje y mensajes recientes
SELECT 
    ma.id as attachment_id,
    ma."createdAt" as attachment_created,
    m.id as message_id,
    m."createdAt" as message_created,
    m.body
FROM "MessageAttachment" ma
LEFT JOIN "Message" m ON m."createdAt" > ma."createdAt" 
    AND m."createdAt" < ma."createdAt" + INTERVAL '10 seconds'
    AND m.body LIKE '%Archivo adjunto%'
WHERE ma."messageId" IS NULL
ORDER BY ma."createdAt" DESC
LIMIT 10;

-- Vincular automáticamente (CUIDADO: revisar primero el SELECT arriba)
-- UPDATE "MessageAttachment" ma
-- SET "messageId" = (
--     SELECT m.id 
--     FROM "Message" m 
--     WHERE m."createdAt" > ma."createdAt" 
--     AND m."createdAt" < ma."createdAt" + INTERVAL '10 seconds'
--     AND m.body LIKE '%Archivo adjunto%'
--     LIMIT 1
-- )
-- WHERE ma."messageId" IS NULL;
