-- ============================================================================
-- FIX: Corregir inconsistencias en user_type e is_company
-- ============================================================================
-- Fecha: 2025-01-XX
-- Propósito: Alinear los datos existentes con la nueva lógica de perfiles
--
-- NUEVA LÓGICA:
-- 1. inquilino → is_company = false (Inquilino / Dueño Directo)
-- 2. inmobiliaria → is_company = true (Inmobiliaria)
-- 3. dueno_directo → is_company = true (Empresa)
-- ============================================================================

-- PASO 1: Verificar estado actual
SELECT 
  user_type,
  is_company,
  COUNT(*) as total_usuarios,
  STRING_AGG(DISTINCT email, ', ') as emails_ejemplo
FROM users
GROUP BY user_type, is_company
ORDER BY user_type, is_company;

-- PASO 2: Corregir usuarios con user_type = 'inmobiliaria' pero is_company = false
-- Estos deben tener is_company = true
UPDATE users
SET 
  is_company = true,
  updated_at = NOW()
WHERE user_type = 'inmobiliaria' 
  AND (is_company = false OR is_company IS NULL);

-- PASO 3: Corregir usuarios con user_type = 'dueno_directo' 
-- Estos deben tener is_company = true (ahora son "Empresa")
UPDATE users
SET 
  is_company = true,
  updated_at = NOW()
WHERE user_type = 'dueno_directo' 
  AND (is_company = false OR is_company IS NULL);

-- PASO 4: Asegurar que inquilinos tengan is_company = false
UPDATE users
SET 
  is_company = false,
  updated_at = NOW()
WHERE user_type = 'inquilino' 
  AND (is_company = true OR is_company IS NULL);

-- PASO 5: Verificar resultados después de la corrección
SELECT 
  user_type,
  is_company,
  COUNT(*) as total_usuarios,
  STRING_AGG(DISTINCT email, ', ') as emails_ejemplo
FROM users
GROUP BY user_type, is_company
ORDER BY user_type, is_company;

-- PASO 6: Verificar tu usuario específico
SELECT 
  id,
  email,
  name,
  user_type,
  is_company,
  created_at,
  updated_at
FROM users
WHERE email = 'cgonzalezarchilla@gmail.com';

-- ============================================================================
-- RESULTADO ESPERADO:
-- ============================================================================
-- user_type       | is_company | Descripción
-- ----------------|------------|------------------------------------------
-- inquilino       | false      | Inquilino / Dueño Directo (individuales)
-- inmobiliaria    | true       | Inmobiliarias
-- dueno_directo   | true       | Empresas
-- ============================================================================
