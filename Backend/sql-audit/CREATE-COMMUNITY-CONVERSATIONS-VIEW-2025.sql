-- =====================================================
-- CREAR VISTA PARA COMPATIBILIDAD DE CONVERSACIONES
-- Fecha: 2025-01-XX
-- Objetivo: Crear vista que mapea creator_id/recipient_id a user1_id/user2_id
-- =====================================================

-- IMPORTANTE: Esta vista es NECESARIA para que el código frontend funcione
-- El código usa "community_conversations_view" esperando columnas user1_id/user2_id
-- Pero la tabla real tiene creator_id/recipient_id

-- =====================================================
-- PASO 1: ELIMINAR VISTA SI EXISTE (para recrearla)
-- =====================================================

DROP VIEW IF EXISTS public.community_conversations_view CASCADE;

-- =====================================================
-- PASO 2: CREAR VISTA CON MAPEO DE COLUMNAS
-- =====================================================

CREATE OR REPLACE VIEW public.community_conversations_view AS
SELECT 
  id,
  creator_id as user1_id,      -- Mapear creator_id → user1_id
  recipient_id as user2_id,    -- Mapear recipient_id → user2_id
  created_at,
  updated_at,
  last_message_at,
  status
FROM public.community_conversations
WHERE status = 'active';  -- Solo conversaciones activas

-- =====================================================
-- PASO 3: CREAR VISTA PARA MENSAJES (si no existe)
-- =====================================================

DROP VIEW IF EXISTS public.community_messages_view CASCADE;

CREATE OR REPLACE VIEW public.community_messages_view AS
SELECT 
  id,
  conversation_id,
  sender_id,
  content,
  created_at,
  read_at,
  status
FROM public.community_messages
WHERE status = 'sent';  -- Solo mensajes enviados

-- =====================================================
-- PASO 4: OTORGAR PERMISOS A LAS VISTAS
-- =====================================================

-- Permitir SELECT a usuarios autenticados
GRANT SELECT ON public.community_conversations_view TO authenticated;
GRANT SELECT ON public.community_messages_view TO authenticated;

-- Permitir SELECT a anon (si es necesario para landing pages)
GRANT SELECT ON public.community_conversations_view TO anon;
GRANT SELECT ON public.community_messages_view TO anon;

-- =====================================================
-- PASO 5: VERIFICAR QUE LAS VISTAS FUNCIONAN
-- =====================================================

-- Ver estructura de la vista de conversaciones
SELECT 
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'community_conversations_view'
ORDER BY ordinal_position;

-- Probar la vista con datos reales
SELECT 
  id,
  user1_id,
  user2_id,
  created_at,
  last_message_at
FROM public.community_conversations_view
LIMIT 5;

-- Ver estructura de la vista de mensajes
SELECT 
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'community_messages_view'
ORDER BY ordinal_position;

-- Probar la vista de mensajes
SELECT 
  id,
  conversation_id,
  sender_id,
  content,
  created_at
FROM public.community_messages_view
LIMIT 5;

-- =====================================================
-- RESULTADO ESPERADO
-- =====================================================
-- Las vistas deben mostrar:
-- - community_conversations_view: columnas user1_id, user2_id (mapeadas desde creator_id, recipient_id)
-- - community_messages_view: columnas conversation_id, sender_id, content, etc.
-- 
-- Esto permite que el código frontend funcione sin cambios,
-- ya que espera user1_id/user2_id pero la tabla real tiene creator_id/recipient_id
