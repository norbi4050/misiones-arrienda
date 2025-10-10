-- DEBUG: Por qué getMessagesAttachments() devuelve Map vacío
-- Fecha: 11 de Enero de 2025

-- 1. Verificar attachments en la conversación
SELECT 
  ma.id,
  ma."messageId",
  ma."userId",
  ma.path,
  ma.mime,
  m.id as message_id,
  m.body,
  m."conversationId"
FROM "MessageAttachment" ma
LEFT JOIN "Message" m ON m.id = ma."messageId"
WHERE m."conversationId" = '60ecdcca-f9df-4511-bb43-9c54d064405e'
ORDER BY ma."createdAt" DESC
LIMIT 20;

-- 2. Verificar attachments SIN vincular (messageId NULL)
SELECT 
  ma.id,
  ma."messageId",
  ma."userId",
  ma.path,
  ma."createdAt"
FROM "MessageAttachment" ma
WHERE ma."messageId" IS NULL
  AND ma.path LIKE '%60ecdcca-f9df-4511-bb43-9c54d064405e%'
ORDER BY ma."createdAt" DESC;

-- 3. Verificar TODOS los attachments de la conversación (vinculados o no)
SELECT 
  ma.id,
  ma."messageId",
  ma."userId",
  ma.path,
  ma."createdAt",
  CASE 
    WHEN ma."messageId" IS NULL THEN '❌ NO VINCULADO'
    ELSE '✅ VINCULADO'
  END as status
FROM "MessageAttachment" ma
WHERE ma.path LIKE '%60ecdcca-f9df-4511-bb43-9c54d064405e%'
ORDER BY ma."createdAt" DESC;

-- 4. Verificar mensajes de la conversación
SELECT 
  m.id,
  m.body,
  m."senderId",
  m."createdAt",
  COUNT(ma.id) as attachment_count
FROM "Message" m
LEFT JOIN "MessageAttachment" ma ON ma."messageId" = m.id
WHERE m."conversationId" = '60ecdcca-f9df-4511-bb43-9c54d064405e'
GROUP BY m.id, m.body, m."senderId", m."createdAt"
ORDER BY m."createdAt" DESC
LIMIT 10;

-- 5. Buscar el mensaje específico que debería tener attachment
SELECT 
  m.id,
  m.body,
  m."senderId",
  m."createdAt",
  ma.id as attachment_id,
  ma.path,
  ma."userId"
FROM "Message" m
LEFT JOIN "MessageAttachment" ma ON ma."messageId" = m.id
WHERE m.id = '474218f3-77bd-4702-bc33-335d4c3b72d6'  -- Mensaje "[Adjunto]"
;
