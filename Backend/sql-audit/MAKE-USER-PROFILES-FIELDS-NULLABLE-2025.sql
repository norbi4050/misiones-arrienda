-- ============================================================================
-- SOLUCIÓN PERMANENTE: Hacer campos NULLABLE en user_profiles
-- ============================================================================
-- Problema: Campos NOT NULL diseñados solo para inquilinos (city, budget_min, budget_max)
--           causan errores al crear perfiles para inmobiliarias
-- Solución: Hacer estos campos NULLABLE para soportar ambos tipos de usuarios
-- ============================================================================

-- PASO 1: Verificar constraints actuales
SELECT 
  column_name,
  is_nullable,
  data_type
FROM information_schema.columns
WHERE table_name = 'user_profiles'
  AND column_name IN ('city', 'budget_min', 'budget_max')
ORDER BY column_name;

-- PASO 2: Hacer campos NULLABLE
ALTER TABLE user_profiles 
  ALTER COLUMN city DROP NOT NULL,
  ALTER COLUMN budget_min DROP NOT NULL,
  ALTER COLUMN budget_max DROP NOT NULL;

-- PASO 3: Verificar cambios
SELECT 
  column_name,
  is_nullable,
  data_type
FROM information_schema.columns
WHERE table_name = 'user_profiles'
  AND column_name IN ('city', 'budget_min', 'budget_max')
ORDER BY column_name;

-- PASO 4: Limpiar valores dummy de inmobiliarias existentes
UPDATE user_profiles
SET 
  city = NULL,
  budget_min = NULL,
  budget_max = NULL
WHERE role = 'AGENCY'
  AND city = 'N/A'
  AND budget_min = 0
  AND budget_max = 0;

-- ============================================================================
-- RESULTADO ESPERADO:
-- ============================================================================
-- city: YES (nullable)
-- budget_min: YES (nullable)
-- budget_max: YES (nullable)
-- 
-- Inmobiliarias existentes tendrán NULL en estos campos
-- ============================================================================

-- ✅ BENEFICIOS:
-- 1. No más errores al crear perfiles para inmobiliarias
-- 2. Datos más limpios (NULL en lugar de valores dummy)
-- 3. Endpoint /api/users/avatar funcionará automáticamente
-- 4. Solución escalable para futuros tipos de usuarios
