-- ============================================================================
-- DIAGNÓSTICO: Teléfono Comercial Inmobiliaria
-- Fecha: Enero 2025
-- Propósito: Verificar y configurar el teléfono comercial en perfiles públicos
-- ============================================================================

-- PASO 1: Verificar el schema actual de la tabla users
-- ============================================================================
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'users'
  AND column_name IN ('commercial_phone', 'show_phone_public', 'user_type', 'role')
ORDER BY column_name;

-- PASO 2: Verificar tu usuario específico (REEMPLAZA 'TU_ID_AQUI' con tu ID real)
-- ============================================================================
-- Obtén tu ID desde la consola del navegador o desde Mi Empresa
SELECT 
  id,
  email,
  company_name,
  phone,
  commercial_phone,
  show_phone_public,
  show_address_public,
  user_type,
  created_at,
  updated_at
FROM users
WHERE id = 'TU_ID_AQUI';  -- ⚠️ REEMPLAZA ESTO CON TU ID

-- PASO 3: Si commercial_phone existe pero está NULL, actualizarlo
-- ============================================================================
-- Descomenta y ejecuta SOLO si quieres setear un valor de prueba:
/*
UPDATE users
SET 
  commercial_phone = '+54 376 987-6543',  -- ⚠️ REEMPLAZA con tu número comercial
  show_phone_public = true,
  updated_at = NOW()
WHERE id = 'TU_ID_AQUI';  -- ⚠️ REEMPLAZA ESTO CON TU ID
*/

-- PASO 4: Si el campo commercial_phone NO EXISTE, crearlo
-- ============================================================================
-- Ejecuta esto SOLO si el PASO 1 muestra que commercial_phone no existe:
/*
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS commercial_phone TEXT;

COMMENT ON COLUMN users.commercial_phone IS 'Teléfono comercial de la inmobiliaria (opcional, se muestra en perfil público si show_phone_public es true)';
*/

-- PASO 5: Si show_phone_public NO EXISTE, crearlo
-- ============================================================================
-- Ejecuta esto SOLO si el PASO 1 muestra que show_phone_public no existe:
/*
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS show_phone_public BOOLEAN DEFAULT true;

COMMENT ON COLUMN users.show_phone_public IS 'Controla si los teléfonos (phone y commercial_phone) se muestran en el perfil público';
*/

-- PASO 6: Verificar todos los usuarios inmobiliaria
-- ============================================================================
SELECT 
  id,
  company_name,
  phone,
  commercial_phone,
  show_phone_public,
  user_type
FROM users
WHERE user_type = 'inmobiliaria'
ORDER BY created_at DESC
LIMIT 10;

-- PASO 7: Activar show_phone_public para todas las inmobiliarias (OPCIONAL)
-- ============================================================================
-- Ejecuta esto SOLO si quieres activar la visibilidad de teléfonos para todas:
/*
UPDATE users
SET 
  show_phone_public = true,
  updated_at = NOW()
WHERE user_type = 'inmobiliaria'
  AND (show_phone_public IS NULL OR show_phone_public = false);
*/

-- ============================================================================
-- RESULTADOS ESPERADOS
-- ============================================================================
-- Después de ejecutar los pasos necesarios, deberías ver:
-- ✅ commercial_phone con un valor (ej: '+54 376 987-6543')
-- ✅ show_phone_public = true
-- ✅ user_type = 'inmobiliaria'
--
-- Si todo está correcto pero aún no se muestra en el frontend:
-- 1. Reinicia el servidor de desarrollo (npm run dev)
-- 2. Haz hard refresh en el navegador (Ctrl+Shift+R)
-- 3. Verifica que no haya errores en la consola del navegador
-- ============================================================================
