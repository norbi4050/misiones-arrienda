-- ============================================
-- FIX DIRECTO: Actualizar companyName de "Baldes"
-- Problema: companyName está NULL en tabla User pero existe en auth.users
-- ============================================

-- 1. Actualizar directamente el companyName desde auth.users.raw_user_meta_data
UPDATE "User"
SET 
    "companyName" = 'Baldes',
    "userType" = 'inmobiliaria',
    "updatedAt" = NOW()
WHERE id = 'a4ef1f3d-c3e8-46df-b186-5b5c837cc14b';

-- 2. Verificar que se actualizó correctamente
SELECT 
    id,
    email,
    name,
    "companyName",
    "userType",
    "updatedAt"
FROM "User"
WHERE id = 'a4ef1f3d-c3e8-46df-b186-5b5c837cc14b';

-- 3. Verificar cómo se vería en el sistema de mensajes
SELECT 
    u.id,
    u.email,
    u.name,
    u."companyName",
    u."userType",
    CASE 
        WHEN u.name IS NOT NULL AND u.name != '' THEN u.name
        WHEN u."companyName" IS NOT NULL AND u."companyName" != '' THEN u."companyName"
        ELSE split_part(u.email, '@', 1)
    END as "displayName_would_be"
FROM "User" u
WHERE u.id = 'a4ef1f3d-c3e8-46df-b186-5b5c837cc14b';
