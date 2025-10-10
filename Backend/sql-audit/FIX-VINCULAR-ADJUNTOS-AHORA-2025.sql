-- =====================================================
-- FIX: Vincular adjuntos huérfanos a sus mensajes
-- Ejecutar AHORA para ver los botones de descarga
-- =====================================================

-- Vincular adjuntos a mensajes creados en los siguientes 10 segundos
UPDATE "MessageAttachment" ma
SET "messageId" = (
    SELECT m.id 
    FROM "Message" m 
    WHERE m."createdAt" > ma."createdAt" 
    AND m."createdAt" < ma."createdAt" + INTERVAL '10 seconds'
    AND m.body LIKE '%Archivo adjunto%'
    ORDER BY m."createdAt" ASC
    LIMIT 1
)
WHERE ma."messageId" IS NULL
AND ma."userId" = '6403f9d2-e846-4c70-87e0-e051127d9500';

-- Verificar resultado
SELECT 
    ma.id,
    ma."messageId",
    ma.path,
    m.body
FROM "MessageAttachment" ma
LEFT JOIN "Message" m ON m.id = ma."messageId"
WHERE ma."userId" = '6403f9d2-e846-4c70-87e0-e051127d9500'
ORDER BY ma."createdAt" DESC
LIMIT 5;
