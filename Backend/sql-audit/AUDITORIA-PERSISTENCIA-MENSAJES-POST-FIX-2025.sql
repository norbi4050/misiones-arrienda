-- ============================================
-- AUDITORÍA: Persistencia de Mensajes Post-Fix conversationId
-- Fecha: 2025-01-11
-- Objetivo: Diagnosticar por qué los mensajes no persisten después del fix
-- ============================================

-- PASO 1: Verificar que la tabla Message existe y tiene la columna conversationId
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'Message'
ORDER BY ordinal_position;

-- PASO 2: Verificar mensajes en la conversación de prueba
SELECT 
    id,
    "conversationId",
    "senderId",
    body,
    "isRead",
    "createdAt"
FROM "Message"
WHERE "conversationId" = '60ecdcca-f9df-4511-bb43-9c54d064405e'
ORDER BY "createdAt" DESC
LIMIT 10;

-- PASO 3: Contar total de mensajes en la conversación
SELECT 
    COUNT(*) as total_mensajes,
    COUNT(CASE WHEN "isRead" = false THEN 1 END) as no_leidos,
    MAX("createdAt") as ultimo_mensaje
FROM "Message"
WHERE "conversationId" = '60ecdcca-f9df-4511-bb43-9c54d064405e';

-- PASO 4: Verificar que la conversación existe
SELECT 
    id,
    "aId",
    "bId",
    "isActive",
    "createdAt",
    "updatedAt",
    "lastMessageAt"
FROM "Conversation"
WHERE id = '60ecdcca-f9df-4511-bb43-9c54d064405e';

-- PASO 5: Verificar adjuntos vinculados a mensajes de esta conversación
SELECT 
    ma.id as attachment_id,
    ma."messageId",
    ma."userId",
    ma."fileName",
    ma."createdAt",
    m.body as mensaje_contenido,
    m."conversationId"
FROM "MessageAttachment" ma
LEFT JOIN "Message" m ON ma."messageId" = m.id
WHERE m."conversationId" = '60ecdcca-f9df-4511-bb43-9c54d064405e'
ORDER BY ma."createdAt" DESC
LIMIT 10;

-- PASO 6: Verificar si hay mensajes huérfanos (sin conversationId válido)
SELECT 
    COUNT(*) as mensajes_huerfanos
FROM "Message" m
LEFT JOIN "Conversation" c ON m."conversationId" = c.id
WHERE c.id IS NULL;

-- PASO 7: Verificar RLS policies en tabla Message
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
WHERE tablename = 'Message';

-- PASO 8: Verificar últimos 5 mensajes creados (cualquier conversación)
SELECT 
    id,
    "conversationId",
    "senderId",
    LEFT(body, 50) as body_preview,
    "createdAt"
FROM "Message"
ORDER BY "createdAt" DESC
LIMIT 5;

-- PASO 9: Verificar si hay problema de schema (tabla messages vs Message)
SELECT 
    table_name,
    table_schema
FROM information_schema.tables
WHERE table_name IN ('Message', 'messages', 'Conversation', 'conversations')
ORDER BY table_name;

-- PASO 10: Verificar índices en tabla Message
SELECT
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'Message';

-- ============================================
-- DIAGNÓSTICO ESPERADO:
-- ============================================
-- Si los mensajes NO persisten, verificar:
-- 1. ¿La tabla Message tiene columna conversationId? (PASO 1)
-- 2. ¿Los mensajes se están guardando en DB? (PASO 2)
-- 3. ¿La conversación existe? (PASO 4)
-- 4. ¿Hay políticas RLS bloqueando la lectura? (PASO 7)
-- 5. ¿Hay problema de naming (Message vs messages)? (PASO 9)
-- ============================================
