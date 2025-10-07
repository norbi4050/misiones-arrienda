-- =====================================================
-- AUDITORÍA DE CONVERSACIONES CON USUARIOS FALTANTES
-- Fecha: 2025-01-XX
-- Objetivo: Detectar conversaciones con usuarios que no existen o tienen problemas
-- =====================================================

-- =====================================================
-- 1. VERIFICAR CONVERSACIONES EXISTENTES
-- =====================================================

-- Contar conversaciones totales
SELECT 
  'Total conversaciones en community_conversations' as descripcion,
  COUNT(*) as cantidad
FROM public.community_conversations;

-- Ver todas las conversaciones con sus participantes
SELECT 
  cc.id as conversation_id,
  cc.user1_id,
  cc.user2_id,
  cc.created_at,
  cc.last_message_at,
  u1.email as user1_email,
  u1.name as user1_name,
  u2.email as user2_email,
  u2.name as user2_name,
  CASE 
    WHEN u1.id IS NULL THEN '❌ user1 NO EXISTE'
    WHEN u2.id IS NULL THEN '❌ user2 NO EXISTE'
    ELSE '✅ Ambos usuarios existen'
  END as estado_usuarios
FROM public.community_conversations cc
LEFT JOIN public.users u1 ON cc.user1_id = u1.id
LEFT JOIN public.users u2 ON cc.user2_id = u2.id
ORDER BY cc.created_at DESC;

-- =====================================================
-- 2. DETECTAR CONVERSACIONES CON USUARIOS FALTANTES
-- =====================================================

-- Conversaciones donde user1 no existe en public.users
SELECT 
  '❌ Conversaciones con user1_id que NO existe en public.users' as problema,
  COUNT(*) as cantidad
FROM public.community_conversations cc
LEFT JOIN public.users u1 ON cc.user1_id = u1.id
WHERE u1.id IS NULL;

-- Detalle de conversaciones con user1 faltante
SELECT 
  cc.id as conversation_id,
  cc.user1_id as user_id_faltante,
  cc.user2_id,
  u2.email as user2_email,
  u2.name as user2_name,
  cc.created_at,
  'user1 no existe en public.users' as problema
FROM public.community_conversations cc
LEFT JOIN public.users u1 ON cc.user1_id = u1.id
LEFT JOIN public.users u2 ON cc.user2_id = u2.id
WHERE u1.id IS NULL
ORDER BY cc.created_at DESC;

-- Conversaciones donde user2 no existe en public.users
SELECT 
  '❌ Conversaciones con user2_id que NO existe en public.users' as problema,
  COUNT(*) as cantidad
FROM public.community_conversations cc
LEFT JOIN public.users u2 ON cc.user2_id = u2.id
WHERE u2.id IS NULL;

-- Detalle de conversaciones con user2 faltante
SELECT 
  cc.id as conversation_id,
  cc.user1_id,
  u1.email as user1_email,
  u1.name as user1_name,
  cc.user2_id as user_id_faltante,
  cc.created_at,
  'user2 no existe en public.users' as problema
FROM public.community_conversations cc
LEFT JOIN public.users u1 ON cc.user1_id = u1.id
LEFT JOIN public.users u2 ON cc.user2_id = u2.id
WHERE u2.id IS NULL
ORDER BY cc.created_at DESC;

-- =====================================================
-- 3. VERIFICAR USUARIOS EN auth.users PERO NO EN public.users
-- =====================================================

-- Conversaciones con usuarios que están en auth.users pero NO en public.users
SELECT 
  cc.id as conversation_id,
  cc.user1_id,
  cc.user2_id,
  au1.email as user1_auth_email,
  au2.email as user2_auth_email,
  CASE 
    WHEN u1.id IS NULL AND au1.id IS NOT NULL THEN '⚠️ user1 en auth.users pero NO en public.users'
    WHEN u2.id IS NULL AND au2.id IS NOT NULL THEN '⚠️ user2 en auth.users pero NO en public.users'
    ELSE '✅ OK'
  END as problema
FROM public.community_conversations cc
LEFT JOIN public.users u1 ON cc.user1_id = u1.id
LEFT JOIN public.users u2 ON cc.user2_id = u2.id
LEFT JOIN auth.users au1 ON cc.user1_id = au1.id
LEFT JOIN auth.users au2 ON cc.user2_id = au2.id
WHERE (u1.id IS NULL AND au1.id IS NOT NULL) 
   OR (u2.id IS NULL AND au2.id IS NOT NULL)
ORDER BY cc.created_at DESC;

-- =====================================================
-- 4. VERIFICAR MENSAJES HUÉRFANOS
-- =====================================================

-- Mensajes en conversaciones que ya no existen
SELECT 
  '❌ Mensajes en conversaciones inexistentes' as problema,
  COUNT(*) as cantidad
FROM public.community_messages cm
LEFT JOIN public.community_conversations cc ON cm.conversation_id = cc.id
WHERE cc.id IS NULL;

-- Detalle de mensajes huérfanos
SELECT 
  cm.id as message_id,
  cm.conversation_id as conversation_id_inexistente,
  cm.sender_id,
  u.email as sender_email,
  cm.content,
  cm.created_at,
  'Conversación no existe' as problema
FROM public.community_messages cm
LEFT JOIN public.community_conversations cc ON cm.conversation_id = cc.id
LEFT JOIN public.users u ON cm.sender_id = u.id
WHERE cc.id IS NULL
ORDER BY cm.created_at DESC
LIMIT 50;

-- Mensajes con sender_id que no existe en public.users
SELECT 
  '❌ Mensajes con sender_id que NO existe en public.users' as problema,
  COUNT(*) as cantidad
FROM public.community_messages cm
LEFT JOIN public.users u ON cm.sender_id = u.id
WHERE u.id IS NULL;

-- Detalle de mensajes con sender faltante
SELECT 
  cm.id as message_id,
  cm.conversation_id,
  cm.sender_id as sender_id_faltante,
  cm.content,
  cm.created_at,
  'Sender no existe en public.users' as problema
FROM public.community_messages cm
LEFT JOIN public.users u ON cm.sender_id = u.id
WHERE u.id IS NULL
ORDER BY cm.created_at DESC
LIMIT 50;

-- =====================================================
-- 5. SCRIPT DE LIMPIEZA (OPCIONAL - NO EJECUTAR SIN CONFIRMAR)
-- =====================================================

-- ADVERTENCIA: Este script ELIMINA datos. Solo ejecutar si se confirma que son datos basura.

-- Comentado por seguridad - descomentar solo si se necesita limpiar
/*
-- Eliminar conversaciones donde user1 no existe
DELETE FROM public.community_conversations
WHERE user1_id NOT IN (SELECT id FROM public.users);

-- Eliminar conversaciones donde user2 no existe
DELETE FROM public.community_conversations
WHERE user2_id NOT IN (SELECT id FROM public.users);

-- Eliminar mensajes huérfanos (sin conversación)
DELETE FROM public.community_messages
WHERE conversation_id NOT IN (SELECT id FROM public.community_conversations);

-- Eliminar mensajes con sender inexistente
DELETE FROM public.community_messages
WHERE sender_id NOT IN (SELECT id FROM public.users);
*/

-- =====================================================
-- 6. VERIFICAR USUARIO juan.perez@test.com
-- =====================================================

-- Este usuario está en auth.users pero NO confirmó email
-- Verificar si tiene conversaciones o mensajes

SELECT 
  'Conversaciones del usuario juan.perez@test.com (96b458d2-2d3c-410d-b906-da99527c9ce9)' as descripcion,
  COUNT(*) as cantidad
FROM public.community_conversations
WHERE user1_id = '96b458d2-2d3c-410d-b906-da99527c9ce9'
   OR user2_id = '96b458d2-2d3c-410d-b906-da99527c9ce9';

-- Detalle de conversaciones de juan.perez
SELECT 
  cc.id as conversation_id,
  cc.user1_id,
  cc.user2_id,
  u1.email as user1_email,
  u2.email as user2_email,
  cc.created_at,
  'Usuario juan.perez@test.com (email no confirmado)' as nota
FROM public.community_conversations cc
LEFT JOIN public.users u1 ON cc.user1_id = u1.id
LEFT JOIN public.users u2 ON cc.user2_id = u2.id
WHERE cc.user1_id = '96b458d2-2d3c-410d-b906-da99527c9ce9'
   OR cc.user2_id = '96b458d2-2d3c-410d-b906-da99527c9ce9'
ORDER BY cc.created_at DESC;

-- Mensajes enviados por juan.perez
SELECT 
  'Mensajes enviados por juan.perez@test.com' as descripcion,
  COUNT(*) as cantidad
FROM public.community_messages
WHERE sender_id = '96b458d2-2d3c-410d-b906-da99527c9ce9';

-- =====================================================
-- 7. RESUMEN EJECUTIVO
-- =====================================================

SELECT 
  'RESUMEN EJECUTIVO - CONVERSACIONES' as seccion,
  '' as detalle
UNION ALL
SELECT 
  '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━<execute_command>
<command>
cd sql-audit && echo "
-- VERIFICAR SI EL USUARIO juan.perez@test.com APARECE EN CONVERSACIONES
SELECT 
  'Conversaciones donde juan.perez@test.com es user1' as descripcion,
  COUNT(*) as cantidad
FROM community_conversations 
WHERE user1_id = '96b458d2-2d3c-410d-b906-da99527c9ce9'
UNION ALL
SELECT 
  'Conversaciones donde juan.perez@test.com es user2' as descripcion,
  COUNT(*) as cantidad
FROM community_conversations 
WHERE user2_id = '96b458d2-2d3c-410d-b906-da99527c9ce9'
UNION ALL
SELECT 
  'Mensajes enviados por juan.perez@test.com' as descripcion,
  COUNT(*) as cantidad
FROM community_messages 
WHERE sender_id = '96b458d2-2d3c-410d-b906-da99527c9ce9'
UNION ALL
SELECT 
  'Total conversaciones en el sistema' as descripcion,
  COUNT(*) as cantidad
FROM community_conversations;
" > verificar-usuario-juan-conversaciones.sql
</command>
</execute_command>
