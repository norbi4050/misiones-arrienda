-- =====================================================
-- DIAGNÓSTICO: Verificar adjunto nuevo 1760064512450
-- =====================================================

-- 1. Verificar que el adjunto existe en MessageAttachment
SELECT 
  id,
  "userId",
  "messageId",
  path,
  mime,
  "sizeBytes",
  "createdAt"
FROM "MessageAttachment"
WHERE path LIKE '%1760064512450%'
ORDER BY "createdAt" DESC;

-- 2. Verificar el mensaje asociado
SELECT 
  m.id as message_id,
  m."senderId",
  m.body,
  m."conversationId",
  m."createdAt",
  m."isRead"
FROM "Message" m
WHERE m.id = '2ba53997-7e7a-466e-a9af-49925439e4fb';

-- 3. Verificar todos los adjuntos del thread
SELECT 
  ma.id,
  ma."messageId",
  ma.path,
  ma."createdAt",
  m.body,
  m."senderId"
FROM "MessageAttachment" ma
LEFT JOIN "Message" m ON m.id = ma."messageId"
WHERE m."conversationId" = '60ecdcca-f9df-4511-bb43-9c54d064405e'
ORDER BY ma."createdAt" DESC
LIMIT 20;

-- 4. Verificar adjuntos huérfanos (sin messageId)
SELECT 
  id,
  "userId",
  "messageId",
  path,
  "createdAt"
FROM "MessageAttachment"
WHERE "conversationId" = '60ecdcca-f9df-4511-bb43-9c54d064405e'
  AND "messageId" IS NULL
ORDER BY "createdAt" DESC;

-- 5. Verificar el archivo en storage (simulado - necesitas verificar en Supabase UI)
-- Path esperado: 43eb40bb-094a-4184-823e-aef33bac9c21/60ecdcca-f9df-4511-bb43-9c54d064405e/1760064512450-MARCCCCCCCCCA.jpg

-- 6. Verificar RLS policies para MessageAttachment
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'MessageAttachment';

-- 7. Verificar últimos mensajes del thread
SELECT 
  m.id,
  m."senderId",
  m.body,
  m."createdAt",
  m."isRead",
  COUNT(ma.id) as attachment_count
FROM "Message" m
LEFT JOIN "MessageAttachment" ma ON ma."messageId" = m.id
WHERE m."conversationId" = '60ecdcca-f9df-4511-bb43-9c54d064405e'
GROUP BY m.id, m."senderId", m.body, m."createdAt", m."isRead"
ORDER BY m."createdAt" DESC
LIMIT 10;
