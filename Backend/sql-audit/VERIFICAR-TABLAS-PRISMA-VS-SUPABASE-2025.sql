-- =====================================================
-- VERIFICACIÓN: Tablas PRISMA vs SUPABASE
-- Objetivo: Encontrar dónde están realmente los datos
-- =====================================================

-- 1. Listar TODAS las tablas (case-sensitive)
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- 2. Buscar tablas con nombres PRISMA (PascalCase)
SELECT 
    table_name
FROM information_schema.tables 
WHERE table_schema = 'public'
AND (
    table_name = 'Conversation'  -- PRISMA
    OR table_name = 'Message'     -- PRISMA
    OR table_name = 'UserProfile' -- PRISMA
    OR table_name = 'User'        -- PRISMA
);

-- 3. Contar registros en cada tabla de mensajes/conversaciones
-- (Ejecutar cada una por separado)

-- 3a. Tabla 'Conversation' (PRISMA - PascalCase)
SELECT 'Conversation (PRISMA)' as tabla, COUNT(*) as total FROM "Conversation";

-- 3b. Tabla 'conversations' (Supabase - lowercase)
SELECT 'conversations (Supabase)' as tabla, COUNT(*) as total FROM conversations;

-- 3c. Tabla 'Message' (PRISMA)
SELECT 'Message (PRISMA)' as tabla, COUNT(*) as total FROM "Message";

-- 3d. Tabla 'messages' (Supabase)
SELECT 'messages (Supabase)' as tabla, COUNT(*) as total FROM messages;

-- 3e. Tabla 'user_messages'
SELECT 'user_messages' as tabla, COUNT(*) as total FROM user_messages;

-- 3f. Tabla 'community_messages'
SELECT 'community_messages' as tabla, COUNT(*) as total FROM community_messages;

-- 4. Si existe 'Conversation' (PRISMA), buscar el thread específico
SELECT 
    'Conversation (PRISMA)' as tabla,
    *
FROM "Conversation"
WHERE id = '60ecdcca-f9df-4511-bb43-9c54d064405e';

-- 5. Si existe 'Message' (PRISMA), buscar mensajes del thread
SELECT 
    'Message (PRISMA)' as tabla,
    *
FROM "Message"
WHERE "conversationId" = '60ecdcca-f9df-4511-bb43-9c54d064405e'
ORDER BY "createdAt" DESC
LIMIT 10;

-- 6. Buscar en user_messages por el usuario Carlos
SELECT 
    'user_messages' as tabla,
    *
FROM user_messages
WHERE sender_id = '6403f9d2-e846-4c70-87e0-e051127d9500'
   OR receiver_id = '6403f9d2-e846-4c70-87e0-e051127d9500'
ORDER BY created_at DESC
LIMIT 10;

-- 7. Ver estructura de user_messages completa
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'user_messages'
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 8. CRÍTICO: Verificar políticas RLS que puedan estar bloqueando datos
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
WHERE tablename IN ('messages', 'user_messages', 'community_messages', 'Message', 'Conversation')
ORDER BY tablename, policyname;

-- 9. Verificar si hay datos en user_messages SIN filtros RLS (usando service role)
-- NOTA: Esta query debe ejecutarse con service_role key
SELECT 
    id,
    sender_id,
    receiver_id,
    message,
    property_id,
    created_at
FROM user_messages
LIMIT 10;
