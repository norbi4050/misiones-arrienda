-- =====================================================
-- DIAGNÓSTICO: Conversación 60ecdcca-f9df-4511-bb43-9c54d064405e
-- Usuario: Carlos Gonzalez (6403f9d2-e846-4c70-87e0-e051127d9500)
-- Fecha: 09 Octubre 2025
-- =====================================================

-- PASO 1: Buscar en TODAS las tablas de mensajes
-- =====================================================

-- 1.1. Buscar en tabla 'messages' (principal)
SELECT 
    'messages' as tabla,
    id,
    conversation_id,
    sender_id,
    body,
    created_at,
    is_read
FROM messages
WHERE conversation_id = '60ecdcca-f9df-4511-bb43-9c54d064405e'
ORDER BY created_at DESC
LIMIT 10;

-- 1.2. Buscar en tabla 'user_messages' (si existe)
SELECT 
    'user_messages' as tabla,
    *
FROM user_messages
WHERE conversation_id = '60ecdcca-f9df-4511-bb43-9c54d064405e'
   OR thread_id = '60ecdcca-f9df-4511-bb43-9c54d064405e'
   OR id = '60ecdcca-f9df-4511-bb43-9c54d064405e'
ORDER BY created_at DESC
LIMIT 10;

-- 1.3. Buscar en tabla 'community_messages'
SELECT 
    'community_messages' as tabla,
    *
FROM community_messages
WHERE conversation_id = '60ecdcca-f9df-4511-bb43-9c54d064405e'
ORDER BY created_at DESC
LIMIT 10;


-- PASO 2: Buscar la conversación en TODAS las tablas de conversaciones
-- =====================================================

-- 2.1. Buscar en 'conversations'
SELECT 
    'conversations' as tabla,
    *
FROM conversations
WHERE id = '60ecdcca-f9df-4511-bb43-9c54d064405e';

-- 2.2. Buscar en 'community_conversations'
SELECT 
    'community_conversations' as tabla,
    *
FROM community_conversations
WHERE id = '60ecdcca-f9df-4511-bb43-9c54d064405e';


-- PASO 3: Buscar mensajes del usuario Carlos en CUALQUIER conversación
-- =====================================================

-- 3.1. Mensajes en tabla 'messages'
SELECT 
    'messages' as tabla,
    m.id,
    m.conversation_id,
    m.sender_id,
    m.body,
    m.created_at,
    c.participant_1,
    c.participant_2,
    c.a_id,
    c.b_id
FROM messages m
LEFT JOIN conversations c ON m.conversation_id = c.id
WHERE m.sender_id = '6403f9d2-e846-4c70-87e0-e051127d9500'
ORDER BY m.created_at DESC
LIMIT 20;

-- 3.2. Conversaciones donde Carlos participa
SELECT 
    'conversations' as tabla,
    id,
    participant_1,
    participant_2,
    a_id,
    b_id,
    last_message_at,
    last_message_text,
    created_at
FROM conversations
WHERE participant_1 = '6403f9d2-e846-4c70-87e0-e051127d9500'
   OR participant_2 = '6403f9d2-e846-4c70-87e0-e051127d9500'
   OR a_id = '6403f9d2-e846-4c70-87e0-e051127d9500'
   OR b_id = '6403f9d2-e846-4c70-87e0-e051127d9500'
ORDER BY last_message_at DESC NULLS LAST
LIMIT 10;


-- PASO 4: Verificar si hay VIEWS que puedan estar mostrando datos diferentes
-- =====================================================

-- 4.1. Buscar en 'community_messages_view'
SELECT 
    'community_messages_view' as tabla,
    *
FROM community_messages_view
WHERE conversation_id = '60ecdcca-f9df-4511-bb43-9c54d064405e'
   OR id = '60ecdcca-f9df-4511-bb43-9c54d064405e'
LIMIT 10;

-- 4.2. Buscar en 'conversations_with_participants'
SELECT 
    'conversations_with_participants' as tabla,
    *
FROM conversations_with_participants
WHERE id = '60ecdcca-f9df-4511-bb43-9c54d064405e'
LIMIT 10;

-- 4.3. Buscar en 'community_conversations_view'
SELECT 
    'community_conversations_view' as tabla,
    *
FROM community_conversations_view
WHERE id = '60ecdcca-f9df-4511-bb43-9c54d064405e'
LIMIT 10;


-- PASO 5: Buscar por contenido del mensaje visible
-- =====================================================

-- 5.1. Buscar mensaje "Hola, me interesa esta propiedad en Oberá"
SELECT 
    'messages_by_content' as tabla,
    id,
    conversation_id,
    sender_id,
    body,
    created_at
FROM messages
WHERE body LIKE '%Oberá%'
   OR body LIKE '%interesa%'
   OR body LIKE '%propiedad%'
ORDER BY created_at DESC
LIMIT 10;

-- 5.2. Buscar mensajes "Claro ningún problema"
SELECT 
    'messages_by_content_2' as tabla,
    id,
    conversation_id,
    sender_id,
    body,
    created_at
FROM messages
WHERE body LIKE '%Claro%'
   OR body LIKE '%problema%'
ORDER BY created_at DESC
LIMIT 10;


-- PASO 6: Verificar estructura de TODAS las tablas de mensajes
-- =====================================================

-- 6.1. Estructura de 'user_messages'
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'user_messages'
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 6.2. Estructura de 'community_messages'
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'community_messages'
AND table_schema = 'public'
ORDER BY ordinal_position;


-- PASO 7: Contar mensajes por tabla
-- =====================================================

SELECT 
    'messages' as tabla,
    COUNT(*) as total,
    COUNT(DISTINCT conversation_id) as conversaciones_unicas
FROM messages;

SELECT 
    'user_messages' as tabla,
    COUNT(*) as total
FROM user_messages;

SELECT 
    'community_messages' as tabla,
    COUNT(*) as total
FROM community_messages;


-- PASO 8: Ver definición de las VIEWS para entender de dónde vienen los datos
-- =====================================================

SELECT 
    table_name,
    view_definition
FROM information_schema.views
WHERE table_schema = 'public'
AND (
    table_name LIKE '%message%'
    OR table_name LIKE '%conversation%'
)
ORDER BY table_name;
