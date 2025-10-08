-- =====================================================
-- DIAGNÓSTICO: user_type faltante para usuario Baldes
-- =====================================================
-- Fecha: 7 de Enero 2025
-- Problema: Stats API retorna error PGRST116 (0 rows)
-- Causa: Usuario no tiene user_type = 'inmobiliaria'
-- =====================================================

-- 1. Verificar datos actuales del usuario
SELECT 
  id,
  email,
  user_type,
  is_company,
  company_name,
  created_at,
  updated_at
FROM users
WHERE id = 'a4ef1f3d-c3e8-46df-b186-5b5c837cc14b';

-- Resultado esperado:
-- Si user_type es NULL o diferente de 'inmobiliaria', ese es el problema

-- 2. Verificar si hay propiedades asociadas
SELECT COUNT(*) as total_properties
FROM properties
WHERE user_id = 'a4ef1f3d-c3e8-46df-b186-5b5c837cc14b';

-- 3. FIX: Actualizar user_type a 'inmobiliaria'
UPDATE users
SET 
  user_type = 'inmobiliaria',
  updated_at = NOW()
WHERE id = 'a4ef1f3d-c3e8-46df-b186-5b5c837cc14b'
  AND (user_type IS NULL OR user_type != 'inmobiliaria');

-- 4. Verificar el fix
SELECT 
  id,
  email,
  user_type,
  is_company,
  company_name
FROM users
WHERE id = 'a4ef1f3d-c3e8-46df-b186-5b5c837cc14b';

-- Resultado esperado después del fix:
-- user_type = 'inmobiliaria'

-- =====================================================
-- NOTAS:
-- - Este usuario tiene is_company = true y company_name = 'Baldes'
-- - Claramente es una inmobiliaria pero falta el user_type
-- - Esto probablemente pasó durante el registro o migración
-- =====================================================
