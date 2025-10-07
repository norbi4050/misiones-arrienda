-- ============================================================================
-- FIX: Usuario específico sin nombre (53a4bffa-48dd-40af-a6bd-cdd9139d7888)
-- ============================================================================

-- PASO 1: Ver datos actuales del usuario
SELECT 
  id,
  email,
  name,
  "companyName",
  "userType"
FROM "User"
WHERE id = '53a4bffa-48dd-40af-a6bd-cdd9139d7888';

-- PASO 2: Actualizar el usuario con un nombre basado en su email
UPDATE "User"
SET name = COALESCE(
  name,  -- Si ya tiene nombre, mantenerlo
  "companyName",  -- Si tiene companyName, usarlo
  split_part(email, '@', 1)  -- Si no, usar parte local del email
)
WHERE id = '53a4bffa-48dd-40af-a6bd-cdd9139d7888'
  AND (name IS NULL OR name = '');

-- PASO 3: Verificar el cambio
SELECT 
  id,
  email,
  name,
  "companyName",
  "userType",
  'Ahora mostrará: ' || COALESCE(name, "companyName", split_part(email, '@', 1)) as display_name
FROM "User"
WHERE id = '53a4bffa-48dd-40af-a6bd-cdd9139d7888';

-- ============================================================================
-- ALTERNATIVA: Si querés actualizar TODOS los usuarios sin nombre
-- ============================================================================

-- Ver cuántos usuarios tienen el problema
SELECT COUNT(*) as usuarios_sin_nombre
FROM "User"
WHERE (name IS NULL OR name = '')
  AND ("companyName" IS NULL OR "companyName" = '');

-- Actualizar todos los usuarios sin nombre
UPDATE "User"
SET name = split_part(email, '@', 1)
WHERE (name IS NULL OR name = '')
  AND ("companyName" IS NULL OR "companyName" = '')
  AND email IS NOT NULL;
