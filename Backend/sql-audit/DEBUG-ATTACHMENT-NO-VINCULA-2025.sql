-- =====================================================
-- DEBUG: Por qué el attachment no se vincula
-- Attachment ID: 28f57fad-657e-4b8f-bf04-1b835633818b
-- =====================================================

-- 1. Verificar si el attachment existe
SELECT 
  id,
  "messageId",
  "userId",
  path,
  "createdAt"
FROM "MessageAttachment"
WHERE id = '28f57fad-657e-4b8f-bf04-1b835633818b';

-- 2. Verificar todos los attachments recientes del usuario
SELECT 
  id,
  "messageId",
  "userId",
  path,
  "createdAt"
FROM "MessageAttachment"
WHERE "userId" = '43eb40bb-094a-4184-823e-aef33bac9c21'
ORDER BY "createdAt" DESC
LIMIT 10;

-- 3. Verificar si hay attachments sin vincular (messageId NULL)
SELECT 
  id,
  "messageId",
  "userId",
  path,
  "createdAt"
FROM "MessageAttachment"
WHERE "userId" = '43eb40bb-094a-4184-823e-aef33bac9c21'
  AND "messageId" IS NULL
ORDER BY "createdAt" DESC;

-- 4. Intentar el UPDATE manualmente para ver qué pasa
UPDATE "MessageAttachment"
SET "messageId" = '07cd3429-8c2f-472d-8b2a-7f939367e7cf'
WHERE id = '28f57fad-657e-4b8f-bf04-1b835633818b'
  AND "userId" = '43eb40bb-094a-4184-823e-aef33bac9c21';

-- 5. Verificar el resultado
SELECT 
  id,
  "messageId",
  "userId",
  path
FROM "MessageAttachment"
WHERE id = '28f57fad-657e-4b8f-bf04-1b835633818b';
