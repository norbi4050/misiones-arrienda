-- =====================================================
-- FIX: ELIMINAR USUARIO FANTASMA juan.perez@test.com
-- Fecha: 2025-01-XX
-- Objetivo: Eliminar usuario que nunca confirmó email y causa "USUARIO" en conversaciones
-- =====================================================

-- ADVERTENCIA: Este script ELIMINA datos permanentemente
-- Solo ejecutar después de confirmar que es un usuario de prueba sin actividad real

-- =====================================================
-- PASO 1: VERIFICAR DATOS ANTES DE ELIMINAR
-- =====================================================

-- Ver conversaciones del usuario
SELECT 
  'Conversaciones donde juan.perez participa' as descripcion,
  cc.id as conversation_id,
  cc.creator_id,
  cc.recipient_id,
  cc.created_at,
  CASE 
    WHEN cc.creator_id = '96b458d2-2d3c-410d-b906-da99527c9ce9' THEN 'Es creator'
    WHEN cc.recipient_id = '96b458d2-2d3c-410d-b906-da99527c9ce9' THEN 'Es recipient'
  END as rol
FROM public.community_conversations cc
WHERE cc.creator_id = '96b458d2-2d3c-410d-b906-da99527c9ce9'
   OR cc.recipient_id = '96b458d2-2d3c-410d-b906-da99527c9ce9';

-- Ver mensajes del usuario
SELECT 
  'Mensajes enviados por juan.perez' as descripcion,
  cm.id as message_id,
  cm.conversation_id,
  cm.content,
  cm.created_at
FROM public.community_messages cm
WHERE cm.sender_id = '96b458d2-2d3c-410d-b906-da99527c9ce9';

-- Ver datos en auth.users
SELECT 
  'Datos en auth.users' as descripcion,
  id,
  email,
  email_confirmed_at,
  last_sign_in_at,
  created_at
FROM auth.users
WHERE id = '96b458d2-2d3c-410d-b906-da99527c9ce9';

-- =====================================================
-- PASO 2: ELIMINAR EN ORDEN CORRECTO (CASCADA MANUAL)
-- =====================================================

-- 2.1. Eliminar mensajes donde es sender
DELETE FROM public.community_messages
WHERE sender_id = '96b458d2-2d3c-410d-b906-da99527c9ce9';

-- Verificar eliminación
SELECT 
  'Mensajes eliminados' as accion,
  COUNT(*) as cantidad_restante
FROM public.community_messages
WHERE sender_id = '96b458d2-2d3c-410d-b906-da99527c9ce9';

-- 2.2. Eliminar conversaciones donde es creator
DELETE FROM public.community_conversations
WHERE creator_id = '96b458d2-2d3c-410d-b906-da99527c9ce9';

-- Verificar eliminación
SELECT 
  'Conversaciones (creator) eliminadas' as accion,
  COUNT(*) as cantidad_restante
FROM public.community_conversations
WHERE creator_id = '96b458d2-2d3c-410d-b906-da99527c9ce9';

-- 2.3. Eliminar conversaciones donde es recipient
DELETE FROM public.community_conversations
WHERE recipient_id = '96b458d2-2d3c-410d-b906-da99527c9ce9';

-- Verificar eliminación
SELECT 
  'Conversaciones (recipient) eliminadas' as accion,
  COUNT(*) as cantidad_restante
FROM public.community_conversations
WHERE recipient_id = '96b458d2-2d3c-410d-b906-da99527c9ce9';

-- 2.4. Eliminar de auth.users (último paso)
DELETE FROM auth.users
WHERE id = '96b458d2-2d3c-410d-b906-da99527c9ce9';

-- Verificar eliminación final
SELECT 
  'Usuario eliminado de auth.users' as accion,
  COUNT(*) as cantidad_restante
FROM auth.users
WHERE id = '96b458d2-2d3c-410d-b906-da99527c9ce9';

-- =====================================================
-- PASO 3: VERIFICACIÓN POST-ELIMINACIÓN
-- =====================================================

-- Verificar que no quedan rastros
SELECT 
  'VERIFICACIÓN FINAL' as seccion,
  '' as detalle
UNION ALL
SELECT 
  'Conversaciones restantes',
  COUNT(*)::text
FROM public.community_conversations
WHERE creator_id = '96b458d2-2d3c-410d-b906-da99527c9ce9'
   OR recipient_id = '96b458d2-2d3c-410d-b906-da99527c9ce9'
UNION ALL
SELECT 
  'Mensajes restantes',
  COUNT(*)::text
FROM public.community_messages
WHERE sender_id = '96b458d2-2d3c-410d-b906-da99527c9ce9'
UNION ALL
SELECT 
  'Usuario en auth.users',
  COUNT(*)::text
FROM auth.users
WHERE id = '96b458d2-2d3c-410d-b906-da99527c9ce9';

-- =====================================================
-- RESULTADO ESPERADO
-- =====================================================
-- Todas las verificaciones deben mostrar 0 (cero)
-- Si alguna muestra > 0, revisar qué quedó sin eliminar
