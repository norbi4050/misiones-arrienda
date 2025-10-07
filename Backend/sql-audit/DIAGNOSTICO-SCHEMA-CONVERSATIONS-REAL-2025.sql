-- =====================================================
-- DIAGNÓSTICO DEL SCHEMA REAL DE COMMUNITY_CONVERSATIONS
-- Fecha: 2025-01-XX
-- Objetivo: Descubrir los nombres reales de las columnas
-- =====================================================

-- Ver todas las columnas de community_conversations
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'community_conversations'
ORDER BY ordinal_position;

-- Ver todas las columnas de community_messages
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'community_messages'
ORDER BY ordinal_position;

-- Ver todas las columnas de users
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'users'
ORDER BY ordinal_position;

-- Contar conversaciones
SELECT COUNT(*) as total_conversaciones
FROM public.community_conversations;

-- Ver estructura completa de 1 conversación (si existe)
SELECT *
FROM public.community_conversations
LIMIT 1;

-- Contar mensajes
SELECT COUNT(*) as total_mensajes
FROM public.community_messages;

-- Ver estructura completa de 1 mensaje (si existe)
SELECT *
FROM public.community_messages
LIMIT 1;
