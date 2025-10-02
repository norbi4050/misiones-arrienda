-- =============================================
-- FIX: Corregir nombre de campo verified
-- Fecha: 2025-01-XX
-- Problema: El campo se llama 'verified' no 'is_verified'
-- =============================================

-- 1. Verificar nombre actual del campo
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'users'
AND column_name IN ('verified', 'is_verified');

-- 2. Si existe 'verified' y NO existe 'is_verified', crear alias o renombrar
-- Opción A: Crear índice con el nombre correcto
DROP INDEX IF EXISTS idx_users_verified_inmobiliarias;
CREATE INDEX idx_users_verified_inmobiliarias 
ON users(user_type, verified) 
WHERE user_type = 'inmobiliaria' AND verified = true;

-- 3. Verificar conteo de inmobiliarias (con nombre correcto)
SELECT 
  COUNT(*) as total_inmobiliarias,
  COUNT(logo_url) as con_logo,
  COUNT(cuit) as con_cuit,
  COUNT(CASE WHEN verified = true THEN 1 END) as verificadas
FROM users
WHERE user_type = 'inmobiliaria';

-- =============================================
-- RESULTADO ESPERADO
-- =============================================
-- El campo 'verified' ya existe en la tabla users
-- Usaremos 'verified' en lugar de 'is_verified'
-- =============================================
