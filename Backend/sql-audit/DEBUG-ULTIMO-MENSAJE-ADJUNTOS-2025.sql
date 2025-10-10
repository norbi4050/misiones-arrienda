-- =====================================================
-- DEBUG: Verificar último mensaje y sus adjuntos
-- =====================================================

-- 1. Ver último mensaje enviado
SELECT 
    id,
    body,
    "senderId",
    "conversationId",
    "createdAt"
FROM "Message"
WHERE "conversationId" = '60ecdcca-f9df-4511-bb43-9c54d064405e'
ORDER BY "createdAt" DESC
LIMIT 5;

-- 2. Ver adjuntos del último mensaje
SELECT 
    ma.id as attachment_id,
    ma."messageId",
    ma.path,
    ma.mime,
    ma.file_name,
    ma."createdAt",
    m.body as message_body
FROM "MessageAttachment" ma
LEFT JOIN "Message" m ON m.id = ma."messageId"
WHERE ma."userId" IN ('6403f9d2-e846-4c70-87e0-e051127d9500', 'a4ef1f3d-c3e8-46df-b186-5b5c837cc14b')
ORDER BY ma."createdAt" DESC
LIMIT 10;

-- 3. Ver adjuntos huérfanos (sin mensaje)
SELECT 
    id,
    "messageId",
    path,
    file_name,
    "createdAt"
FROM "MessageAttachment"
WHERE "messageId" IS NULL
AND "userId" IN ('6403f9d2-e846-4c70-87e0-e051127d9500', 'a4ef1f3d-c3e8-46df-b186-5b5c837cc14b')
ORDER BY "createdAt" DESC;

-- 4. Vincular adjuntos huérfanos al último mensaje
-- EJECUTAR SOLO SI HAY ADJUNTOS HUÉRFANOS
UPDATE "MessageAttachment" ma
SET "messageId" = (
    SELECT m.id 
    FROM "Message" m 
    WHERE m."createdAt" > ma."createdAt" 
    AND m."createdAt" < ma."createdAt" + INTERVAL '10 seconds'
    AND m.body LIKE '%Archivo adjunto%'
    AND m."conversationId" = '60ecdcca-f9df-4511-bb43-9c54d064405e'
    ORDER BY m."createdAt" ASC
    LIMIT 1
)
WHERE ma."messageId" IS NULL
AND ma."userId" IN ('6403f9d2-e846-4c70-87e0-e051127d9500', 'a4ef1f3d-c3e8-46df-b186-5b5c837cc14b');

-- 5. Verificar resultado final
SELECT 
    ma.id,
    ma."messageId",
    ma.file_name,
    m.body,
    m."createdAt" as message_time,
    ma."createdAt" as attachment_time
FROM "MessageAttachment" ma
LEFT JOIN "Message" m ON m.id = ma."messageId"
WHERE ma."userId" IN ('6403f9d2-e846-4c70-87e0-e051127d9500', 'a4ef1f3d-c3e8-46df-b186-5b5c837cc14b')
ORDER BY ma."createdAt" DESC
LIMIT 10;
