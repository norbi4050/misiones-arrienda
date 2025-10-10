-- =====================================================
-- DEBUG: Verificar por qué getMessagesAttachments retorna vacío
-- =====================================================

-- 1. Ver todos los adjuntos en la tabla
SELECT 
  id,
  "messageId",
  "userId",
  path,
  mime,
  "sizeBytes",
  "createdAt"
FROM "MessageAttachment"
ORDER BY "createdAt" DESC
LIMIT 10;

-- 2. Ver adjuntos de los mensajes recientes
SELECT 
  m.id as message_id,
  m.body as message_content,
  m."createdAt" as message_date,
  ma.id as attachment_id,
  ma.path as attachment_path,
  ma.mime as attachment_mime
FROM "Message" m
LEFT JOIN "MessageAttachment" ma ON ma."messageId" = m.id
WHERE m."conversationId" = '60ecdcca-f9df-4511-bb43-9c54d064405e'
ORDER BY m."createdAt" DESC
LIMIT 10;

-- 3. Contar adjuntos por mensaje
SELECT 
  m.id,
  m.body,
  COUNT(ma.id) as attachments_count
FROM "Message" m
LEFT JOIN "MessageAttachment" ma ON ma."messageId" = m.id
WHERE m."conversationId" = '60ecdcca-f9df-4511-bb43-9c54d064405e'
GROUP BY m.id, m.body
ORDER BY m."createdAt" DESC;

-- 4. Ver el último mensaje enviado con su adjunto
SELECT 
  m.id as message_id,
  m.body,
  m."createdAt",
  ma.id as attachment_id,
  ma."messageId" as attachment_message_id,
  ma.path
FROM "Message" m
LEFT JOIN "MessageAttachment" ma ON ma."messageId" = m.id
WHERE m.id = '2897206b-ec3b-4cac-8cdf-87f777e06e4f';
