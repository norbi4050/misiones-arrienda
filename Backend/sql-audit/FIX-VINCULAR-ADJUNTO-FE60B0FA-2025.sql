-- =====================================================
-- FIX: Vincular adjunto huérfano fe60b0fa al mensaje 2ba53997
-- =====================================================

-- 1. Verificar estado actual
SELECT 
  id,
  "userId",
  "messageId",
  path,
  "createdAt"
FROM "MessageAttachment"
WHERE id = 'fe60b0fa-e3db-47d8-8d87-fbafc66560a1';

-- 2. Vincular el adjunto al mensaje
UPDATE "MessageAttachment"
SET "messageId" = '2ba53997-7e7a-466e-a9af-49925439e4fb'
WHERE id = 'fe60b0fa-e3db-47d8-8d87-fbafc66560a1'
  AND "userId" = '43eb40bb-094a-4184-823e-aef33bac9c21';

-- 3. Verificar que se vinculó correctamente
SELECT 
  ma.id,
  ma."messageId",
  ma.path,
  m.body,
  m."senderId"
FROM "MessageAttachment" ma
LEFT JOIN "Message" m ON m.id = ma."messageId"
WHERE ma.id = 'fe60b0fa-e3db-47d8-8d87-fbafc66560a1';

-- 4. Verificar el conteo de adjuntos del mensaje
SELECT 
  m.id,
  m.body,
  m."createdAt",
  COUNT(ma.id) as attachment_count
FROM "Message" m
LEFT JOIN "MessageAttachment" ma ON ma."messageId" = m.id
WHERE m.id = '2ba53997-7e7a-466e-a9af-49925439e4fb'
GROUP BY m.id, m.body, m."createdAt";
