-- Ver el último adjunto subido
SELECT 
  id,
  "messageId",
  "userId",
  path,
  mime,
  "sizeBytes",
  "createdAt"
FROM "MessageAttachment"
WHERE path LIKE '%1760064117371%'
ORDER BY "createdAt" DESC
LIMIT 1;

-- Ver si tiene messageId asignado
SELECT 
  ma.id as attachment_id,
  ma."messageId",
  ma.path,
  m.id as message_id,
  m.content,
  m."createdAt" as message_created
FROM "MessageAttachment" ma
LEFT JOIN "Message" m ON m.id = ma."messageId"
WHERE ma.path LIKE '%1760064117371%';
