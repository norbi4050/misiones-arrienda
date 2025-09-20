-- =====================================================
-- AUDITORÍA COMPLETA: SISTEMA FAVORITOS Y MENSAJES
-- Fecha: 2025-01-XX
-- Objetivo: Verificar estructura actual antes de FASE 1
-- =====================================================

-- =====================================================
-- 1. AUDITORÍA TABLA FAVORITOS
-- =====================================================

-- Verificar si existe tabla favorites
SELECT 
    schemaname,
    tablename,
    tableowner,
    hasindexes,
    hasrules,
    hastriggers
FROM pg_tables 
WHERE tablename IN ('favorites', 'user_favorites', 'property_favorites')
ORDER BY tablename;

-- Obtener estructura de tabla favorites (si existe)
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name IN ('favorites', 'user_favorites', 'property_favorites')
ORDER BY table_name, ordinal_position;

-- Verificar constraints de favorites
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
LEFT JOIN information_schema.constraint_column_usage ccu 
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name IN ('favorites', 'user_favorites', 'property_favorites')
ORDER BY tc.table_name, tc.constraint_type;

-- Verificar índices de favorites
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename IN ('favorites', 'user_favorites', 'property_favorites')
ORDER BY tablename, indexname;

-- Contar registros en favorites (si existe)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'favorites') THEN
        RAISE NOTICE 'Tabla favorites existe - contando registros...';
        EXECUTE 'SELECT COUNT(*) as total_favorites FROM favorites';
    ELSIF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_favorites') THEN
        RAISE NOTICE 'Tabla user_favorites existe - contando registros...';
        EXECUTE 'SELECT COUNT(*) as total_favorites FROM user_favorites';
    ELSE
        RAISE NOTICE 'No se encontró tabla de favoritos';
    END IF;
END $$;

-- =====================================================
-- 2. AUDITORÍA TABLA MENSAJES
-- =====================================================

-- Verificar si existen tablas de mensajes
SELECT 
    schemaname,
    tablename,
    tableowner,
    hasindexes,
    hasrules,
    hastriggers
FROM pg_tables 
WHERE tablename IN ('messages', 'conversations', 'user_messages', 'property_messages')
ORDER BY tablename;

-- Obtener estructura de tabla messages (si existe)
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name IN ('messages', 'conversations', 'user_messages')
ORDER BY table_name, ordinal_position;

-- Verificar constraints de messages
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
LEFT JOIN information_schema.constraint_column_usage ccu 
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name IN ('messages', 'conversations', 'user_messages')
ORDER BY tc.table_name, tc.constraint_type;

-- Contar registros en messages (si existe)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'messages') THEN
        RAISE NOTICE 'Tabla messages existe - contando registros...';
        EXECUTE 'SELECT COUNT(*) as total_messages FROM messages';
    ELSIF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'conversations') THEN
        RAISE NOTICE 'Tabla conversations existe - contando registros...';
        EXECUTE 'SELECT COUNT(*) as total_conversations FROM conversations';
    ELSE
        RAISE NOTICE 'No se encontró tabla de mensajes';
    END IF;
END $$;

-- =====================================================
-- 3. AUDITORÍA RLS POLICIES
-- =====================================================

-- Verificar RLS habilitado en tablas relevantes
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename IN ('favorites', 'user_favorites', 'messages', 'conversations', 'properties', 'users')
ORDER BY tablename;

-- Listar policies existentes para favoritos y mensajes
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
WHERE tablename IN ('favorites', 'user_favorites', 'messages', 'conversations')
ORDER BY tablename, policyname;

-- =====================================================
-- 4. VERIFICAR TABLAS RELACIONADAS
-- =====================================================

-- Verificar tabla users
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'users'
    AND column_name IN ('id', 'email', 'name', 'created_at', 'updated_at')
ORDER BY ordinal_position;

-- Verificar tabla properties
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'properties'
    AND column_name IN ('id', 'title', 'user_id', 'status', 'is_active', 'created_at')
ORDER BY ordinal_position;

-- =====================================================
-- 5. VERIFICAR FUNCIONES Y TRIGGERS
-- =====================================================

-- Buscar funciones relacionadas con favoritos/mensajes
SELECT 
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines 
WHERE routine_name ILIKE '%favorite%' 
   OR routine_name ILIKE '%message%'
   OR routine_name ILIKE '%conversation%'
ORDER BY routine_name;

-- Buscar triggers relacionados
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table IN ('favorites', 'user_favorites', 'messages', 'conversations')
ORDER BY event_object_table, trigger_name;

-- =====================================================
-- 6. RESUMEN DE AUDITORÍA
-- =====================================================

-- Generar resumen final
SELECT 
    'AUDITORÍA COMPLETADA' as status,
    NOW() as timestamp,
    'Revisar resultados para determinar migraciones necesarias' as next_steps;

-- =====================================================
-- NOTAS PARA ANÁLISIS:
-- 
-- 1. Si no existen tablas de favoritos, crear:
--    - favorites (id, user_id, property_id, created_at)
--    - Índices únicos y foreign keys
--    - RLS policies
--
-- 2. Si no existen tablas de mensajes, crear:
--    - conversations (id, user1_id, user2_id, property_id, created_at)
--    - messages (id, conversation_id, sender_id, content, created_at)
--    - Índices y foreign keys
--    - RLS policies
--
-- 3. Verificar que todas las foreign keys apunten correctamente
-- 4. Asegurar que RLS esté habilitado y configurado
-- =====================================================
