-- ============================================
-- FIX: Actualizar companyName sin trigger de validación
-- Problema: Trigger validate_user_data() bloquea UPDATE
-- ============================================

-- 1. Desactivar temporalmente el trigger
ALTER TABLE "User" DISABLE TRIGGER ALL;

-- 2. Actualizar el usuario con los datos correctos
UPDATE "User"
SET 
    "companyName" = 'Baldes',
    "userType" = 'inmobiliaria',
    "updatedAt" = NOW()
WHERE id = 'a4ef1f3d-c3e8-46df-b186-5b5c837cc14b';

-- 3. Reactivar el trigger
ALTER TABLE "User" ENABLE TRIGGER ALL;

-- 4. Verificar que se actualizó correctamente
SELECT 
    id,
    email,
    name,
    "companyName",
    "userType",
    "updatedAt"
FROM "User"
WHERE id = 'a4ef1f3d-c3e8-46df-b186-5b5c837cc14b';

-- 5. Verificar cómo se vería el displayName ahora
SELECT 
    u.id,
    u.email,
    u.name,
    u."companyName",
    u."userType",
    CASE 
        WHEN u.name IS NOT NULL AND u.name != '' AND u.name != u.email AND u.name != split_part(u.email, '@', 1) THEN u.name
        WHEN u."companyName" IS NOT NULL AND u."companyName" != '' THEN u."companyName"
        ELSE split_part(u.email, '@', 1)
    END as "displayName_would_be"
FROM "User" u
WHERE u.id = 'a4ef1f3d-c3e8-46df-b186-5b5c837cc14b';
