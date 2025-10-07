-- ============================================
-- DIAGNÓSTICO: Usuario Fantasma en Conversaciones
-- ============================================
-- HALLAZGO: userId=53a4bffa-48dd-40af-a6bd-cdd9139d7888
-- NO existe en tabla User ni en auth.users
-- Pero SÍ aparece en conversaciones
-- ============================================

-- PASO 1: Listar TODOS los usuarios que existen
-- ============================================
SELECT 
  'TODOS_LOS_USUARIOS' as tipo,
  id,
  email,
  name,
  "companyName",
  "createdAt"
FROM "User"
ORDER BY "createdAt" DESC;

-- PASO 2: Listar TODOS los UserProfiles que existen
-- ============================================
SELECT 
  'TODOS_LOS_USERPROFILES' as tipo,
  id,
  "userId",
  role,
  city,
  "createdAt"
FROM "UserProfile"
ORDER BY "createdAt" DESC;

-- PASO 3: Listar TODAS las conversaciones
-- ============================================
SELECT 
  'TODAS_LAS_CONVERSACIONES' as tipo,
  id as conversation_id,
  "aId" as profile_a_id,
  "bId" as profile_b_id,
  "isActive",
  "createdAt"
FROM "Conversation"
ORDER BY "createdAt" DESC;

-- PASO 4: Buscar UserProfiles huérfanos (sin User)
-- ============================================
SELECT 
  'USERPROFILES_HUERFANOS' as tipo,
  up.id as profile_id,
  up."userId" as user_id_referenciado,
  up.role,
  up.city,
  CASE 
    WHEN u.id IS NULL THEN 'USER_NO_EXISTE'
    ELSE 'USER_EXISTE'
  END as estado_user
FROM "UserProfile" up
LEFT JOIN "User" u ON u.id = up."userId"
WHERE u.id IS NULL;

-- PASO 5: Verificar si el ID problemático está en UserProfile
-- ============================================
SELECT 
  'VERIFICAR_ID_EN_USERPROFILE' as tipo,
  id,
  "userId",
  role,
  city
FROM "UserProfile"
WHERE id = '53a4bffa-48dd-40af-a6bd-cdd9139d7888'
   OR "userId" = '53a4bffa-48dd-40af-a6bd-cdd9139d7888';

-- PASO 6: Buscar conversaciones con participantes fantasma
-- ============================================
SELECT 
  'CONVERSACIONES_CON_FANTASMAS' as tipo,
  c.id as conversation_id,
  c."aId",
  c."bId",
  CASE 
    WHEN upa.id IS NULL THEN 'PROFILE_A_NO_EXISTE'
    ELSE 'PROFILE_A_OK'
  END as estado_a,
  CASE 
    WHEN upb.id IS NULL THEN 'PROFILE_B_NO_EXISTE'
    ELSE 'PROFILE_B_OK'
  END as estado_b,
  c."createdAt"
FROM "Conversation" c
LEFT JOIN "UserProfile" upa ON upa.id = c."aId"
LEFT JOIN "UserProfile" upb ON upb.id = c."bId"
WHERE upa.id IS NULL OR upb.id IS NULL;

-- PASO 7: Verificar mensajes de la conversación problemática
-- ============================================
SELECT 
  'MENSAJES_CONVERSACION_PROBLEMATICA' as tipo,
  m.id as message_id,
  m."senderId",
  m.body,
  m."createdAt",
  CASE 
    WHEN up.id IS NULL THEN 'SENDER_PROFILE_NO_EXISTE'
    ELSE 'SENDER_PROFILE_OK'
  END as estado_sender
FROM "Message" m
LEFT JOIN "UserProfile" up ON up.id = m."senderId"
WHERE m."conversationId" = '60ecdcca-f9df-4511-bb43-9c54d064405e'
ORDER BY m."createdAt" DESC
LIMIT 10;

-- ============================================
-- CONCLUSIÓN ESPERADA:
-- ============================================
-- Si el usuario 53a4bffa... NO existe en User/auth.users
-- pero SÍ existe como UserProfile o en conversaciones,
-- entonces es un "usuario fantasma" que debe ser:
-- 1. Eliminado de conversaciones, O
-- 2. Creado en tabla User con datos mínimos
-- ============================================
