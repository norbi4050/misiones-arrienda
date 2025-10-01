-- ============================================
-- AUDITORÍA COMPLETA: Tabla Conversation
-- Fecha: 2025-01-XX
-- Objetivo: Verificar esquema y columnas de la tabla Conversation
-- ============================================

-- 1. Verificar si existe la tabla Conversation
SELECT 
    table_name,
    table_schema,
    table_type
FROM information_schema.tables
WHERE table_name IN ('Conversation', 'conversations')
ORDER BY table_name;

-- 2. Ver todas las columnas de la tabla Conversation
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns
WHERE table_name = 'Conversation'
ORDER BY ordinal_position;

-- 3. Ver todas las columnas de la tabla conversations (si existe)
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns
WHERE table_name = 'conversations'
ORDER BY ordinal_position;

-- 4. Ver una muestra de datos de Conversation
SELECT *
FROM "Conversation"
LIMIT 5;

-- 5. Contar registros en Conversation
SELECT COUNT(*) as total_conversations
FROM "Conversation";

-- 6. Ver estructura de índices
SELECT
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'Conversation';

-- 7. Ver constraints (claves foráneas, etc.)
SELECT
    conname AS constraint_name,
    contype AS constraint_type,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = '"Conversation"'::regclass;

-- 8. Verificar si tiene columnas Prisma (aId, bId)
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'Conversation' AND column_name = 'aId'
        ) THEN 'SÍ'
        ELSE 'NO'
    END as tiene_aId,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'Conversation' AND column_name = 'bId'
        ) THEN 'SÍ'
        ELSE 'NO'
    END as tiene_bId;

-- 9. Verificar si tiene columnas Supabase (sender_id, receiver_id)
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'Conversation' AND column_name = 'sender_id'
        ) THEN 'SÍ'
        ELSE 'NO'
    END as tiene_sender_id,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'Conversation' AND column_name = 'receiver_id'
        ) THEN 'SÍ'
        ELSE 'NO'
    END as tiene_receiver_id;

-- 10. Ver tablas relacionadas (Message, UserProfile, etc.)
SELECT 
    table_name
FROM information_schema.tables
WHERE table_name IN ('Message', 'messages', 'UserProfile', 'user_profiles', 'User', 'users')
ORDER BY table_name;

-- ============================================
-- INSTRUCCIONES PARA EJECUTAR:
-- ============================================
-- 1. Copiar cada query (separadas por comentarios)
-- 2. Ejecutar en Supabase SQL Editor
-- 3. Guardar resultados en un archivo de texto
-- 4. Compartir resultados completos
-- ============================================
