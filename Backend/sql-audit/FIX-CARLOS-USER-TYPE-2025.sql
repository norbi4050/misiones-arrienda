-- ============================================================================
-- FIX: Corregir user_type NULL para usuario Carlos
-- ============================================================================
-- Problema detectado: Tu usuario tiene user_type = NULL
-- Esto causa que el sistema no sepa qué tipo de perfil mostrar
-- ============================================================================

-- PASO 1: Verificar estado actual de tu usuario
SELECT 
  id,
  email,
  name,
  user_type,
  is_company,
  created_at
FROM users
WHERE email = 'cgonzalezarchilla@gmail.com';

-- PASO 2: Actualizar tu usuario a 'inquilino' (ya que no eres empresa)
-- Esto hará que veas "Mi Perfil" en lugar de "Mi Empresa"
UPDATE users
SET 
  user_type = 'inquilino',
  is_company = false,
  updated_at = NOW()
WHERE email = 'cgonzalezarchilla@gmail.com';

-- PASO 3: Verificar que el cambio se aplicó correctamente
SELECT 
  id,
  email,
  name,
  user_type,
  is_company,
  updated_at
FROM users
WHERE email = 'cgonzalezarchilla@gmail.com';

-- ============================================================================
-- RESULTADO ESPERADO:
-- ============================================================================
-- user_type: 'inquilino'
-- is_company: false
-- 
-- Esto hará que en el menú veas "Mi Perfil" en lugar de "Mi Empresa"
-- ============================================================================

-- PASO 4 (OPCIONAL): Si prefieres ser una Inmobiliaria o Empresa, usa esto:
-- 
-- Para Inmobiliaria:
-- UPDATE users SET user_type = 'inmobiliaria', is_company = true WHERE email = 'cgonzalezarchilla@gmail.com';
--
-- Para Empresa:
-- UPDATE users SET user_type = 'dueno_directo', is_company = true WHERE email = 'cgonzalezarchilla@gmail.com';
