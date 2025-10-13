-- ============================================================================
-- DIAGNÓSTICO COMPLETO: ENVÍO DE MENSAJES
-- Fecha: 2025-01-13
-- Propósito: Verificar todo el flujo de mensajes en Supabase
-- ============================================================================

-- PASO 1: Verificar estructura de tablas
-- ============================================================================
\echo '=== PASO 1: ESTRUCTURA DE TABLAS ==='

-- Ver estructura de la tabla messages
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'messages'
ORDER BY ordinal_position;

-- Ver estructura de la tabla message_threads
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'message_threads'
ORDER BY ordinal_position;

-- PASO 2: Verificar últimos mensajes enviados
-- ============================================================================
\echo '=== PASO 2: ÚLTIMOS 10 MENSAJES ENVIADOS ==='

SELECT 
    m.id,
    m.thread_id,
    m.sender_id,
    m.content,
    m.created_at,
    m.updated_at,
    u.name as sender_name,
    u.email as sender_email
FROM messages m
LEFT JOIN users u ON m.sender_id = u.id
ORDER BY m.created_at DESC
LIMIT 10;

-- PASO 3: Verificar threads activos
-- ============================================================================
\echo '=== PASO 3: THREADS ACTIVOS (últimos 10) ==='

SELECT 
    mt.id as thread_id,
    mt.participant1_id,
    mt.participant2_id,
    mt.last_message_at,
    mt.created_at,
    u1.name as participant1_name,
    u2.name as participant2_name,
    COUNT(m.id) as message_count
FROM message_threads mt
LEFT JOIN users u1 ON mt.participant1_id = u1.id
LEFT JOIN users u2 ON mt.participant2_id = u2.id
LEFT JOIN messages m ON mt.id = m.thread_id
GROUP BY mt.id, mt.participant1_id, mt.participant2_id, mt.last_message_at, 
         mt.created_at, u1.name, u2.name
ORDER BY mt.last_message_at DESC NULLS LAST
LIMIT 10;

-- PASO 4: Verificar mensajes de un thread específico (reemplaza el ID)
-- ============================================================================
\echo '=== PASO 4: MENSAJES DE UN THREAD ESPECÍFICO ==='
\echo 'NOTA: Reemplaza el thread_id con el ID real de tu conversación'

-- Obtener el thread más reciente
WITH recent_thread AS (
    SELECT id 
    FROM message_threads 
    ORDER BY last_message_at DESC NULLS LAST 
    LIMIT 1
)
SELECT 
    m.id,
    m.thread_id,
    m.sender_id,
    m.content,
    m.created_at,
    u.name as sender_name,
    CASE 
        WHEN m.sender_id = (SELECT participant1_id FROM message_threads WHERE id = m.thread_id) 
        THEN 'participant1'
        ELSE 'participant2'
    END as sender_role
FROM messages m
LEFT JOIN users u ON m.sender_id = u.id
WHERE m.thread_id = (SELECT id FROM recent_thread)
ORDER BY m.created_at DESC
LIMIT 20;

-- PASO 5: Verificar políticas RLS (Row Level Security)
-- ============================================================================
\echo '=== PASO 5: POLÍTICAS RLS EN MESSAGES ==='

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
WHERE tablename = 'messages';

\echo '=== PASO 5b: POLÍTICAS RLS EN MESSAGE_THREADS ==='

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
WHERE tablename = 'message_threads';

-- PASO 6: Verificar adjuntos (si existen)
-- ============================================================================
\echo '=== PASO 6: ÚLTIMOS ADJUNTOS ==='

SELECT 
    ma.id,
    ma.message_id,
    ma.file_name,
    ma.file_size,
    ma.mime_type,
    ma.storage_path,
    ma.created_at,
    m.content as message_content
FROM message_attachments ma
LEFT JOIN messages m ON ma.message_id = m.id
ORDER BY ma.created_at DESC
LIMIT 10;

-- PASO 7: Verificar integridad de datos
-- ============================================================================
\echo '=== PASO 7: VERIFICACIÓN DE INTEGRIDAD ==='

-- Mensajes sin thread
SELECT COUNT(*) as mensajes_sin_thread
FROM messages m
WHERE NOT EXISTS (
    SELECT 1 FROM message_threads mt WHERE mt.id = m.thread_id
);

-- Mensajes sin sender
SELECT COUNT(*) as mensajes_sin_sender
FROM messages m
WHERE NOT EXISTS (
    SELECT 1 FROM users u WHERE u.id = m.sender_id
);

-- Threads sin mensajes
SELECT COUNT(*) as threads_sin_mensajes
FROM message_threads mt
WHERE NOT EXISTS (
    SELECT 1 FROM messages m WHERE m.thread_id = mt.id
);

-- PASO 8: Estadísticas generales
-- ============================================================================
\echo '=== PASO 8: ESTADÍSTICAS GENERALES ==='

SELECT 
    'Total Threads' as metric,
    COUNT(*) as value
FROM message_threads
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

-- PASO 9: Verificar triggers y funciones
-- ============================================================================
\echo '=== PASO 9: TRIGGERS EN MESSAGES ==='

SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement,
    action_timing
FROM information_schema.triggers
WHERE event_object_table IN ('messages', 'message_threads')
ORDER BY event_object_table, trigger_name;

-- PASO 10: Test de inserción (COMENTADO - descomenta para probar)
-- ============================================================================
\echo '=== PASO 10: TEST DE INSERCIÓN (COMENTADO) ==='
\echo 'Para probar inserción, descomenta las siguientes líneas:'

/*
-- Reemplaza estos UUIDs con IDs reales de tu base de datos
DO $$
DECLARE
    test_thread_id UUID;
    test_user_id UUID;
    test_message_id UUID;
BEGIN
    -- Obtener un thread existente
    SELECT id INTO test_thread_id FROM message_threads LIMIT 1;
    
    -- Obtener un usuario existente
    SELECT participant1_id INTO test_user_id FROM message_threads WHERE id = test_thread_id;
    
    -- Intentar insertar un mensaje de prueba
    INSERT INTO messages (thread_id, sender_id, content)
    VALUES (test_thread_id, test_user_id, '🧪 TEST MESSAGE - ' || NOW()::TEXT)
    RETURNING id INTO test_message_id;
    
    RAISE NOTICE 'Test message created with ID: %', test_message_id;
    
    -- Verificar que se insertó
    IF EXISTS (SELECT 1 FROM messages WHERE id = test_message_id) THEN
        RAISE NOTICE '✅ Message successfully inserted and readable';
    ELSE
        RAISE NOTICE '❌ Message inserted but not readable (RLS issue?)';
    END IF;
    
    -- Limpiar el mensaje de prueba
    DELETE FROM messages WHERE id = test_message_id;
    RAISE NOTICE 'Test message cleaned up';
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '❌ Error during test: %', SQLERRM;
END $$;
*/

-- ============================================================================
-- FIN DEL DIAGNÓSTICO
-- ============================================================================

\echo ''
\echo '=== DIAGNÓSTICO COMPLETADO ==='
\echo 'Revisa los resultados arriba para identificar problemas'
\echo ''
\echo 'CHECKLIST:'
\echo '1. ✓ Estructura de tablas correcta'
\echo '2. ✓ Mensajes se están guardando'
\echo '3. ✓ Threads existen y tienen mensajes'
\echo '4. ✓ Políticas RLS permiten lectura/escritura'
\echo '5. ✓ No hay mensajes huérfanos'
\echo '6. ✓ Adjuntos vinculados correctamente'
\echo ''
