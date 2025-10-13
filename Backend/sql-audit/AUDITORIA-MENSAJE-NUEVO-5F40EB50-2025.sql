-- ============================================================================
-- AUDITORÍA: Mensaje Nuevo que NO Aparece en UI
-- Mensaje ID: 5f40eb50-911c-4e86-ba1b-50718f4a41b0
-- Thread ID: 60ecdcca-f9df-4511-bb43-9c54d064405e
-- ============================================================================

-- PASO 1: Verificar que el mensaje existe en la tabla Message (PRISMA)
\echo '=== PASO 1: VERIFICAR MENSAJE EN TABLA MESSAGE (PRISMA) ==='

SELECT 
    id,
    conversationId,
    senderId,
    body,
    createdAt,
    isRead
FROM "Message"
WHERE id = '5f40eb50-911c-4e86-ba1b-50718f4a41b0';

-- PASO 2: Verificar todos los mensajes del thread en Message (PRISMA)
\echo '=== PASO 2: TODOS LOS MENSAJES DEL THREAD EN MESSAGE ==='

SELECT 
    id,
    conversationId,
    senderId,
    body,
    createdAt,
    isRead
FROM "Message"
WHERE "conversationId" = '60ecdcca-f9df-4511-bb43-9c54d064405e'
ORDER BY "createdAt" DESC
LIMIT 10;

-- PASO 3: Verificar el thread en Conversation (PRISMA)
\echo '=== PASO 3: THREAD EN CONVERSATION (PRISMA) ==='

SELECT 
    id,
    aId,
    bId,
    isActive,
    lastMessageAt,
    createdAt,
    updatedAt
FROM "Conversation"
WHERE id = '60ecdcca-f9df-4511-bb43-9c54d064405e';

-- PASO 4: Verificar UserProfile de los participantes
\echo '=== PASO 4: USERPROFILES DE LOS PARTICIPANTES ==='

SELECT 
    up.id,
    up.userId,
    u.name,
    u.email
FROM "UserProfile" up
LEFT JOIN "User" u ON up.userId = u.id
WHERE up.id IN (
    SELECT aId FROM "Conversation" WHERE id = '60ecdcca-f9df-4511-bb43-9c54d064405e'
    UNION
    SELECT bId FROM "Conversation" WHERE id = '60ecdcca-f9df-4511-bb43-9c54d064405e'
);

-- PASO 5: Verificar si existe TAMBIÉN en messages (Supabase)
\echo '=== PASO 5: VERIFICAR SI EXISTE EN MESSAGES (SUPABASE) ==='

SELECT 
    id,
    conversation_id,
    sender_id,
    body,
    created_at,
    is_read
FROM messages
WHERE id = '5f40eb50-911c-4e86-ba1b-50718f4a41b0';

-- PASO 6: Ver TODOS los mensajes (ambas tablas)
\echo '=== PASO 6: CONTEO DE MENSAJES EN AMBAS TABLAS ==='

SELECT 
    'Message (PRISMA)' as tabla,
    COUNT(*) as total,
    COUNT(CASE WHEN "conversationId" = '60ecdcca-f9df-4511-bb43-9c54d064405e' THEN 1 END) as en_thread
FROM "Message"
UNION ALL
SELECT 
    'messages (SUPABASE)' as tabla,
    COUNT(*) as total,
    COUNT(CASE WHEN conversation_id = '60ecdcca-f9df-4511-bb43-9c54d064405e' THEN 1 END) as en_thread
FROM messages;

-- PASO 7: Verificar RPC get_unread_messages_count
\echo '=== PASO 7: VERIFICAR SI EXISTE RPC get_unread_messages_count ==='

SELECT 
    routine_name,
    routine_type,
    routine_definition
FROM information_schema.routines
WHERE routine_name = 'get_unread_messages_count';

-- ============================================================================
-- FIN DE AUDITORÍA
-- ============================================================================

\echo ''
\echo '=== RESUMEN ==='
\echo 'Si el mensaje existe en Message (PRISMA) pero NO en messages (SUPABASE),'
\echo 'entonces el problema es que el GET está buscando en la tabla incorrecta.'
\echo ''
\echo 'Si el RPC get_unread_messages_count NO EXISTE (404), eso es normal.'
\echo ''
