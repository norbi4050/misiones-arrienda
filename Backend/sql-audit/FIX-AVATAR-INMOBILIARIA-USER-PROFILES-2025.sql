-- ============================================================================
-- FIX: Crear fila en user_profiles para inmobiliaria sin perfil
-- ============================================================================
-- Problema: El avatar se sube a Storage pero no se refleja en la UI
-- Causa: No existe fila en user_profiles para la inmobiliaria
-- Solución: Crear/actualizar fila con el avatar subido
-- ============================================================================

-- PASO 1: Verificar estado actual
SELECT 
  u.id,
  u.email,
  u.user_type,
  up.user_id,
  up.photos,
  up.updated_at
FROM users u
LEFT JOIN user_profiles up ON up.user_id = u.id
WHERE u.id = 'a4ef1f3d-c3e8-46df-b186-5b5c837cc14b';

-- PASO 2: Crear/actualizar fila en user_profiles con el avatar
-- NOTA: Varios campos son NOT NULL, usar valores por defecto para inmobiliarias
INSERT INTO user_profiles (
  user_id,
  photos,
  updated_at,
  role,
  city,
  budget_min,
  budget_max
)
VALUES (
  'a4ef1f3d-c3e8-46df-b186-5b5c837cc14b',
  ARRAY['https://qfeyhaaxyemmnohqdele.supabase.co/storage/v1/object/public/avatars/a4ef1f3d-c3e8-46df-b186-5b5c837cc14b/avatar.png'],
  NOW(),
  'AGENCY',
  'N/A',  -- Campo requerido (no aplica para inmobiliarias)
  0,      -- budget_min NOT NULL (no aplica para inmobiliarias)
  0       -- budget_max NOT NULL (no aplica para inmobiliarias)
)
ON CONFLICT (user_id) 
DO UPDATE SET
  photos = EXCLUDED.photos,
  updated_at = EXCLUDED.updated_at;

-- PASO 3: Verificar que se creó correctamente
SELECT 
  user_id,
  photos,
  updated_at,
  role,
  city,
  budget_min,
  budget_max
FROM user_profiles
WHERE user_id = 'a4ef1f3d-c3e8-46df-b186-5b5c837cc14b';

-- ============================================================================
-- RESULTADO ESPERADO:
-- ============================================================================
-- user_id: a4ef1f3d-c3e8-46df-b186-5b5c837cc14b
-- photos: ["https://...avatar.png"]
-- updated_at: (timestamp actual)
-- role: AGENCY
-- city: N/A
-- budget_min: 0
-- budget_max: 0
-- ============================================================================

-- ✅ ÉXITO CONFIRMADO
-- 
-- NOTA: Después de ejecutar este SQL, refresca la página /mi-empresa
-- y el avatar debería aparecer correctamente.
--
-- PROBLEMA IDENTIFICADO: Varios campos NOT NULL en user_profiles:
-- - city: NOT NULL (diseñado para inquilinos, no aplica a inmobiliarias)
-- - budget_min: NOT NULL (diseñado para inquilinos, no aplica a inmobiliarias)
-- - budget_max: NOT NULL (diseñado para inquilinos, no aplica a inmobiliarias)
-- 
-- Solución: Usar valores por defecto ('N/A' para city, 0 para budgets)
