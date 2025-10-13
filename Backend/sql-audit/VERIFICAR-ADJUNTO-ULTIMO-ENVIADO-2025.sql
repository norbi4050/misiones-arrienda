-- =====================================================
-- VERIFICAR: Último Adjunto Enviado
-- Fecha: 2025-01-13
-- ID del adjunto: be744bb6-fbca-450d-ac5c-3533ace4afdd
-- =====================================================

-- PASO 1: Ver el adjunto específico
SELECT 
    id,
    "userId",
    "messageId",
    path,
    "fileName",
    mime,
    "sizeBytes",
    "createdAt",
    CASE 
        WHEN "messageId" IS NULL THEN '❌ NO VINCULADO'
        ELSE '✅ VINCULADO'
    END as status
FROM "MessageAttachment"
WHERE id = 'be744bb6-fbca-450d-ac5c-3533ace4afdd';

-- PASO 2: Si está vinculado, ver el mensaje
SELECT 
    m.id as message_id,
    m.body as message_content,
    m."senderId",
    m."conversationId",
    m."createdAt" as message_created,
    ma.id as attachment_id,
    ma."fileName",
    ma."createdAt" as attachment_created
FROM "Message" m
INNER JOIN "MessageAttachment" ma ON ma."messageId" = m.id
WHERE ma.id = 'be744bb6-fbca-450d-ac5c-3533ace4afdd';

-- PASO 3: Ver todos los adjuntos recientes (últimos 10)
SELECT 
    id,
    "userId",
    "messageId",
    "fileName",
    "createdAt",
    CASE 
        WHEN "messageId" IS NULL THEN '❌ HUÉRFANO'
        ELSE '✅ VINCULADO'
    END as status
FROM "MessageAttachment"
ORDER BY "createdAt" DESC
LIMIT 10;

-- PASO 4: Ver últimos mensajes de la conversación
SELECT 
    id,
    body,
    "senderId",
    "conversationId",
    "createdAt"
FROM "Message"
WHERE "conversationId" = '60ecdcca-f9df-4511-bb43-9c54d064405e'
ORDER BY "createdAt" DESC
LIMIT 10;

-- PASO 5: Contar adjuntos vinculados vs huérfanos
SELECT 
    CASE 
        WHEN "messageId" IS NULL THEN 'Huérfanos'
        ELSE 'Vinculados'
    END as tipo,
    COUNT(*) as cantidad
FROM "MessageAttachment"
GROUP BY CASE WHEN "messageId" IS NULL THEN 'Huérfanos' ELSE 'Vinculados' END;
