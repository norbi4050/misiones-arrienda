-- =====================================================
-- INVESTIGACIÓN: Sistema de Mensajería y Threads
-- Fecha: 09 Octubre 2025
-- Objetivo: Encontrar dónde están las conversaciones UUID
-- =====================================================

-- 1. Listar TODAS las tablas relacionadas con mensajes
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public'
AND (
    table_name LIKE '%message%' 
    OR table_name LIKE '%conversation%'
    OR table_name LIKE '%thread%'
    OR table_name LIKE '%chat%'
)
ORDER BY table_name;

-- 2. Buscar el thread específico en TODAS las tablas posibles
-- (Ejecutar cada query por separado)

-- 2a. Buscar en message_threads (si existe)
SELECT 'message_threads' as tabla, * 
FROM message_threads 
WHERE id = '60ecdcca-f9df-4511-bb43-9c54d064405e'
LIMIT 1;

-- 2b. Buscar en conversations
SELECT 'conversations' as tabla, * 
FROM conversations 
WHERE id = '60ecdcca-f9df-4511-bb43-9c54d064405e'
LIMIT 1;

-- 2c. Buscar en messages relacionados
SELECT 'messages' as tabla, *
FROM messages
WHERE conversation_id = '60ecdcca-f9df-4511-bb43-9c54d064405e'
ORDER BY created_at DESC
LIMIT 5;

-- 3. Ver estructura de cada tabla de mensajes

-- 3a. Estructura de message_threads (si existe)
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'message_threads'
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3b. Estructura de conversations
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'conversations'
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3c. Estructura de messages
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'messages'
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 4. Buscar conversaciones recientes para entender el patrón de IDs
SELECT 
    id,
    created_at,
    CASE 
        WHEN id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN 'UUID'
        WHEN id LIKE '%-%' THEN 'ID_CALCULADO'
        ELSE 'OTRO'
    END as tipo_id
FROM conversations
ORDER BY created_at DESC
LIMIT 10;

-- 5. Contar mensajes por tipo de ID
SELECT 
    CASE 
        WHEN id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN 'UUID'
        WHEN id LIKE '%-%' THEN 'ID_CALCULADO'
        ELSE 'OTRO'
    END as tipo_id,
    COUNT(*) as total
FROM conversations
GROUP BY tipo_id;

-- 6. Si existe message_threads, ver su contenido
SELECT 
    id,
    user1_id,
    user2_id,
    created_at
FROM message_threads
ORDER BY created_at DESC
LIMIT 10;

-- 7. Buscar mensajes del usuario específico (Carlos Gonzalez)
-- Usuario ID: 6403f9d2-e846-4c70-87e0-e051127d9500
SELECT 
    m.id,
    m.conversation_id,
    m.sender_id,
    m.body,
    m.created_at,
    c.id as conv_id,
    c.user1_id,
    c.user2_id
FROM messages m
LEFT JOIN conversations c ON m.conversation_id = c.id
WHERE m.sender_id = '6403f9d2-e846-4c70-87e0-e051127d9500'
   OR c.user1_id = '6403f9d2-e846-4c70-87e0-e051127d9500'
   OR c.user2_id = '6403f9d2-e846-4c70-87e0-e051127d9500'
ORDER BY m.created_at DESC
LIMIT 20;

-- 8. Ver si hay una tabla diferente en Supabase que no está en Prisma
-- (Esto requiere acceso directo a Supabase Dashboard)
