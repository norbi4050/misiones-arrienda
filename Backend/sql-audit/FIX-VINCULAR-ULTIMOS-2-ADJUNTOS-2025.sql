-- =====================================================
-- FIX: Vincular los últimos 2 adjuntos huérfanos
-- =====================================================

-- Vincular adjunto 20d2985d a mensaje 2897206b
UPDATE "MessageAttachment"
SET "messageId" = '2897206b-ec3b-4cac-8cdf-87f777e06e4f'
WHERE id = '20d2985d-7b51-4e3b-a2d5-fabc59729c8f';

-- Vincular adjunto 66e39b60 a mensaje 01af0f7a
UPDATE "MessageAttachment"
SET "messageId" = '01af0f7a-7263-4392-a51b-ee3ad4496b8b'
WHERE id = '66e39b60-477e-42cd-9b3b-c38dbac99878';

-- Verificar
SELECT 
  m.id as message_id,
  m.body,
  ma.id as attachment_id,
  ma.path
FROM "Message" m
LEFT JOIN "MessageAttachment" ma ON ma."messageId" = m.id
WHERE m.id IN ('2897206b-ec3b-4cac-8cdf-87f777e06e4f', '01af0f7a-7263-4392-a51b-ee3ad4496b8b');
