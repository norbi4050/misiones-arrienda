-- ============================================
-- FIX: Sincronizar usuario inmobiliaria "Baldes" a tabla User
-- Problema: Usuario existe en auth.users pero no en tabla User
-- ============================================

-- 1. Verificar si el usuario ya existe en tabla User
SELECT 
    id,
    email,
    name,
    "companyName"
FROM "User"
WHERE id = 'a4ef1f3d-c3e8-46df-b186-5b5c837cc14b';

-- 2. Si NO existe, insertar el usuario en tabla User con los datos de auth.users
INSERT INTO "User" (
    id,
    email,
    name,
    "companyName",
    "userType",
    "createdAt",
    "updatedAt"
)
SELECT 
    au.id,
    au.email,
    (au.raw_user_meta_data->>'name')::text,
    (au.raw_user_meta_data->>'companyName')::text,
    (au.raw_user_meta_data->>'userType')::text,
    au.created_at,
    NOW()
FROM auth.users au
WHERE au.id = 'a4ef1f3d-c3e8-46df-b186-5b5c837cc14b'
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    "companyName" = EXCLUDED."companyName",
    "userType" = EXCLUDED."userType",
    "updatedAt" = NOW();

-- 3. Verificar que se insertó correctamente
SELECT 
    id,
    email,
    name,
    "companyName",
    "userType",
    "createdAt"
FROM "User"
WHERE id = 'a4ef1f3d-c3e8-46df-b186-5b5c837cc14b';

-- 4. Verificar que el UserProfile también existe
SELECT 
    id,
    "userId",
    "createdAt"
FROM "UserProfile"
WHERE "userId" = 'a4ef1f3d-c3e8-46df-b186-5b5c837cc14b';

-- 5. Si NO existe UserProfile, crearlo
INSERT INTO "UserProfile" (
    id,
    "userId",
    "createdAt",
    "updatedAt"
)
SELECT 
    gen_random_uuid(),
    'a4ef1f3d-c3e8-46df-b186-5b5c837cc14b',
    NOW(),
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM "UserProfile" 
    WHERE "userId" = 'a4ef1f3d-c3e8-46df-b186-5b5c837cc14b'
);

-- 6. Verificación final: Simular el query del endpoint
SELECT 
    u.id,
    u.email,
    u.name,
    u."companyName",
    u."userType",
    u.avatar,
    up.id as profile_id
FROM "User" u
LEFT JOIN "UserProfile" up ON up."userId" = u.id
WHERE u.id = 'a4ef1f3d-c3e8-46df-b186-5b5c837cc14b';
