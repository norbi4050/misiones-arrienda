-- =====================================================
-- AUDITORÍA: Schema Real de Supabase (snake_case)
-- Fecha: 2025-01-13
-- Objetivo: Verificar el schema REAL de las tablas en Supabase
-- =====================================================

-- PASO 1: Ver el schema REAL de la tabla Message
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'Message'
AND table_schema = 'public'
ORDER BY ordinal_position;

-- PASO 2: Ver el schema REAL de la tabla MessageAttachment
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'MessageAttachment'
AND table_schema = 'public'
ORDER BY ordinal_position;

-- PASO 3: Ver últimos mensajes (usando nombres de columnas reales)
SELECT 
    id,
    sender_id,
    conversation_id,
    created_at
FROM "Message"
ORDER BY created_at DESC
LIMIT 5;

-- PASO 4: Ver últimos adjuntos (usando nombres de columnas reales)
SELECT 
    id,
    user_id,
    message_id,
    path,
    file_name,
    mime,
    size_bytes,
    created_at
FROM "MessageAttachment"
ORDER BY created_at DESC
LIMIT 5;

-- PASO 5: Buscar el adjunto específico (be744bb6-fbca-450d-ac5c-3533ace4afdd)
SELECT 
    id,
    user_id,
    message_id,
    path,
    file_name,
    created_at,
    CASE 
        WHEN message_id IS NULL THEN '❌ NO VINCULADO'
        ELSE '✅ VINCULADO'
    END as status
FROM "MessageAttachment"
WHERE id = 'be744bb6-fbca-450d-ac5c-3533ace4afdd';

-- PASO 6: Ver mensaje asociado al adjunto
SELECT 
    m.id as message_id,
    m.sender_id,
    m.conversation_id,
    m.created_at as message_created,
    ma.id as attachment_id,
    ma.file_name,
    ma.created_at as attachment_created
FROM "Message" m
INNER JOIN "MessageAttachment" ma ON ma.message_id = m.id
WHERE ma.id = 'be744bb6-fbca-450d-ac5c-3533ace4afdd';
