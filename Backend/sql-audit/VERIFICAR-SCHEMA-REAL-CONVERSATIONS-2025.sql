-- ============================================================================
-- VERIFICACIÓN SCHEMA REAL: CONVERSATIONS (no message_threads)
-- Fecha: 2025-01-13
-- Propósito: Verificar el schema REAL de Supabase
-- ============================================================================

-- PASO 1: Ver estructura REAL de conversations
-- ============================================================================
\echo '=== PASO 1: ESTRUCTURA DE CONVERSATIONS ==='

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'conversations'
ORDER BY ordinal_position;

-- PASO 2: Ver estructura REAL de messages
-- ============================================================================
\echo '=== PASO 2: ESTRUCTURA DE MESSAGES ==='

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'messages'
ORDER BY ordinal_position;

-- PASO 3: Ver últimos 10 mensajes con nombres de columnas REALES
-- ============================================================================
\echo '=== PASO 3: ÚLTIMOS 10 MENSAJES ==='

SELECT 
    m.id,
    m.conversation_id,
    m.sender_id,
    m.body as content,
    m.created_at,
    u.name as sender_name
FROM messages m
LEFT JOIN users u ON m.sender_id = u.id::text
ORDER BY m.created_at DESC
LIMIT 10;

-- PASO 4: Ver últimas 10 conversaciones
-- ============================================================================
\echo '=== PASO 4: ÚLTIMAS 10 CONVERSACIONES ==='

SELECT 
    c.id,
    c.a_id,
    c.b_id,
    c.participant_1,
    c.participant_2,
    c.created_at,
    c.updated_at,
    u1.name as user_a_name,
    u2.name as user_b_name,
    COUNT(m.id) as message_count
FROM conversations c
LEFT JOIN users u1 ON c.a_id = u1.id::text OR c.participant_1 = u1.id::text
LEFT JOIN users u2 ON c.b_id = u2.id::text OR c.participant_2 = u2.id::text
LEFT JOIN messages m ON c.id = m.conversation_id
GROUP BY c.id, c.a_id, c.b_id, c.participant_1, c.participant_2, 
         c.created_at, c.updated_at, u1.name, u2.name
ORDER BY c.updated_at DESC NULLS LAST
LIMIT 10;

-- PASO 5: Ver mensajes de una conversación específica
-- ============================================================================
\echo '=== PASO 5: MENSAJES DE LA CONVERSACIÓN MÁS RECIENTE ==='

WITH recent_conversation AS (
    SELECT id 
    FROM conversations 
    ORDER BY updated_at DESC NULLS LAST 
    LIMIT 1
)
SELECT 
    m.id,
    m.conversation_id,
    m.sender_id,
    m.body as content,
    m.created_at,
    u.name as sender_name
FROM messages m
LEFT JOIN users u ON m.sender_id = u.id::text
WHERE m.conversation_id = (SELECT id FROM recent_conversation)
ORDER BY m.created_at DESC
LIMIT 20;

-- PASO 6: Verificar políticas RLS en conversations
-- ============================================================================
\echo '=== PASO 6: POLÍTICAS RLS EN CONVERSATIONS ==='

SELECT 
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'conversations';

-- PASO 7: Verificar políticas RLS en messages
-- ============================================================================
\echo '=== PASO 7: POLÍTICAS RLS EN MESSAGES ==='

SELECT 
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'messages';

-- PASO 8: Verificar message_attachments (schema real)
-- ============================================================================
\echo '=== PASO 8: ESTRUCTURA DE MESSAGE_ATTACHMENTS ==='

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'message_attachments'
ORDER BY ordinal_position;

-- PASO 9: Ver últimos adjuntos
-- ============================================================================
\echo '=== PASO 9: ÚLTIMOS 10 ADJUNTOS ==='

SELECT 
    ma.id,
    ma.message_id,
    ma.filename,
    ma.file_size,
    ma.mime_type,
    ma.storage_path,
    ma.created_at
FROM message_attachments ma
ORDER BY ma.created_at DESC
LIMIT 10;

-- PASO 10: Estadísticas
-- ============================================================================
\echo '=== PASO 10: ESTADÍSTICAS ==='

SELECT 
    'Total Conversations' as metric,
    COUNT(*) as value
FROM conversations
UNION ALL
SELECT 
    'Total Messages' as metric,
    COUNT(*) as value
FROM messages
UNION ALL
SELECT 
    'Messages Today' as metric,
    COUNT(*) as value
FROM messages
WHERE created_at >= CURRENT_DATE
UNION ALL
SELECT 
    'Messages Last Hour' as metric,
    COUNT(*) as value
FROM messages
WHERE created_at >= NOW() - INTERVAL '1 hour'
UNION ALL
SELECT 
    'Total Attachments' as metric,
    COUNT(*) as value
FROM message_attachments;

-- ============================================================================
-- DIAGNÓSTICO COMPLETADO
-- ============================================================================
