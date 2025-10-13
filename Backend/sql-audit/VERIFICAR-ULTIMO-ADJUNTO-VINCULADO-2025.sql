-- Verificar el último adjunto vinculado
-- Fecha: 2025-01-13
-- Propósito: Confirmar que el adjunto se vinculó correctamente en la base de datos

-- Ver el último mensaje creado
SELECT 
  id,
  "senderId",
  body,
  "createdAt",
  "conversationId"
FROM "Message"
WHERE "conversationId" = '60ecdcca-f9df-4511-bb43-9c54d064405e'
ORDER BY "createdAt" DESC
LIMIT 5;

-- Ver adjuntos del último mensaje (messageId: 61b9fad4-3d95-4af0-80c3-d0642e6f873c)
SELECT 
  id,
  "messageId",
  "userId",
  path,
  "fileName",
  mime,
  size,
  "createdAt"
FROM "MessageAttachment"
WHERE "messageId" = '61b9fad4-3d95-4af0-80c3-d0642e6f873c';

-- Ver el adjunto específico (ae63e8eb-4492-4c44-95d7-8ca0960e8b09)
SELECT 
  id,
  "messageId",
  "userId",
  path,
  "fileName",
  mime,
  size,
  "createdAt"
FROM "MessageAttachment"
WHERE id = 'ae63e8eb-4492-4c44-95d7-8ca0960e8b09';

-- Ver TODOS los adjuntos recientes (últimos 10)
SELECT 
  id,
  "messageId",
  "userId",
  path,
  "fileName",
  "createdAt",
  CASE 
    WHEN "messageId" IS NULL THEN '❌ SIN VINCULAR'
    ELSE '✅ VINCULADO'
  END as estado
FROM "MessageAttachment"
ORDER BY "createdAt" DESC
LIMIT 10;
