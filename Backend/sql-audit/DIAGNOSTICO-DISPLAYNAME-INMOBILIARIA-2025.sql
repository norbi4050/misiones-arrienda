-- ============================================
-- DIAGNÓSTICO: DisplayName Inmobiliaria
-- Problema: Se muestra email en vez de nombre comercial
-- ============================================

-- 1. Verificar datos del usuario de la inmobiliaria
SELECT 
    u.id as user_id,
    u.email,
    u.name,
    u."companyName",
    u."isCompany",
    u."userType",
    u.avatar,
    up.id as profile_id,
    up."userId" as profile_user_id
FROM "User" u
LEFT JOIN "UserProfile" up ON up."userId" = u.id
WHERE u.id = 'a4ef1f3d-c3e8-46df-b186-5b5c837cc14b';

-- 2. Verificar si existe en auth.users
SELECT 
    id,
    email,
    raw_user_meta_data,
    created_at
FROM auth.users
WHERE id = 'a4ef1f3d-c3e8-46df-b186-5b5c837cc14b';

-- 3. Verificar conversación
SELECT 
    c.id as conversation_id,
    c."aId",
    c."bId",
    c."isActive",
    up_a.id as profile_a_id,
    up_a."userId" as user_a_id,
    up_b.id as profile_b_id,
    up_b."userId" as user_b_id
FROM "Conversation" c
LEFT JOIN "UserProfile" up_a ON up_a.id = c."aId"
LEFT JOIN "UserProfile" up_b ON up_b.id = c."bId"
WHERE c.id = '60ecdcca-f9df-4511-bb43-9c54d064405e';

-- 4. Si no existe en tabla User, verificar en qué tabla está
-- Verificar si el usuario está solo en auth.users pero no en User
SELECT 
    au.id,
    au.email,
    u.id as user_table_id,
    u.email as user_table_email
FROM auth.users au
LEFT JOIN "User" u ON u.id = au.id
WHERE au.id = 'a4ef1f3d-c3e8-46df-b186-5b5c837cc14b';
