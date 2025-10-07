-- ============================================
-- FIX FINAL: Actualizar name a "Baldes" para inmobiliaria
-- Solución: Cambiar name de "norbi4050" a "Baldes"
-- Esto hará que el displayName helper muestre "Baldes"
-- ============================================

-- 1. Actualizar el campo name a "Baldes"
UPDATE "User"
SET 
    name = 'Baldes',
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

-- 3. Verificar cómo se vería el displayName ahora
-- Según la lógica del helper:
-- Prioridad 1: User.name (si existe y no está vacío)
-- Prioridad 2: User.companyName
-- Prioridad 3: emailLocal
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

-- Resultado esperado: displayName_would_be = "Baldes"
