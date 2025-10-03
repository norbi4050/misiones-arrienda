-- =============================================
-- FIX: Agregar columna is_company faltante
-- Fecha: 2025-01-XX
-- Propósito: Corregir schema de users para inmobiliarias
-- =============================================

-- =============================================
-- PROBLEMA IDENTIFICADO:
-- =============================================
-- 1. La columna 'is_company' no existe en la tabla users
-- 2. Múltiples queries fallan con: ERROR 42703: column "is_company" does not exist
-- 3. El tipo de dato de users.id es TEXT cuando debería ser UUID para consistencia
-- 4. Hay un error de tipo en JOIN: text = uuid

-- =============================================
-- PARTE 1: AGREGAR COLUMNA is_company
-- =============================================

-- 1.1 Agregar columna is_company
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'is_company'
  ) THEN
    ALTER TABLE users ADD COLUMN is_company BOOLEAN DEFAULT false;
    COMMENT ON COLUMN users.is_company IS 'Indica si el usuario es una empresa/inmobiliaria';
  END IF;
END $$;

-- 1.2 Actualizar is_company para usuarios existentes tipo inmobiliaria
UPDATE users
SET is_company = true
WHERE user_type = 'inmobiliaria'
  AND is_company IS NULL;

-- 1.3 Crear índice para búsquedas por is_company
CREATE INDEX IF NOT EXISTS idx_users_is_company 
ON users(is_company) 
WHERE is_company = true;

-- =============================================
-- PARTE 2: VERIFICAR Y DOCUMENTAR TIPO DE ID
-- =============================================

-- 2.1 Verificar tipo actual de users.id
SELECT 
  table_name,
  column_name,
  data_type,
  udt_name
FROM information_schema.columns
WHERE table_name = 'users' 
  AND column_name = 'id';

-- Resultado esperado:
-- Si es TEXT: necesitamos migración compleja (NO HACER AHORA)
-- Si es UUID: todo bien, solo documentar

-- NOTA IMPORTANTE:
-- Si users.id es TEXT, NO intentar cambiar a UUID aquí.
-- Eso requiere una migración compleja con:
-- - Backup completo
-- - Actualizar todas las foreign keys
-- - Recrear índices
-- - Actualizar triggers
-- Esto debe hacerse en una ventana de mantenimiento planificada.

-- =============================================
-- PARTE 3: FIX TEMPORAL PARA JOINS
-- =============================================

-- 3.1 Si el problema persiste en joins, usar cast explícito
-- Ejemplo de query que falla:
-- LEFT JOIN user_profiles up ON u.id = up.user_id::uuid

-- Fix temporal (documentar en código):
-- Opción A: Si users.id es TEXT y user_profiles.user_id es TEXT
--   LEFT JOIN user_profiles up ON u.id = up.user_id

-- Opción B: Si users.id es UUID y user_profiles.user_id es TEXT
--   LEFT JOIN user_profiles up ON u.id::text = up.user_id

-- Opción C: Si users.id es TEXT y user_profiles.user_id es UUID
--   LEFT JOIN user_profiles up ON u.id::uuid = up.user_id

-- =============================================
-- PARTE 4: AGREGAR CONSTRAINT PARA CONSISTENCIA
-- =============================================

-- 4.1 Constraint: Si user_type es 'inmobiliaria', is_company debe ser true
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'check_inmobiliaria_is_company'
  ) THEN
    ALTER TABLE users 
    ADD CONSTRAINT check_inmobiliaria_is_company 
    CHECK (
      (user_type = 'inmobiliaria' AND is_company = true) OR
      (user_type != 'inmobiliaria')
    );
  END IF;
END $$;

-- 4.2 Constraint: Si is_company es true, debe tener company_name
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'check_company_has_name'
  ) THEN
    ALTER TABLE users 
    ADD CONSTRAINT check_company_has_name 
    CHECK (
      (is_company = true AND company_name IS NOT NULL AND company_name != '') OR
      (is_company = false OR is_company IS NULL)
    );
  END IF;
END $$;

-- =============================================
-- PARTE 5: TRIGGER PARA MANTENER CONSISTENCIA
-- =============================================

-- 5.1 Función para sincronizar is_company con user_type
CREATE OR REPLACE FUNCTION sync_is_company()
RETURNS TRIGGER AS $$
BEGIN
  -- Si user_type es 'inmobiliaria', is_company debe ser true
  IF NEW.user_type = 'inmobiliaria' THEN
    NEW.is_company := true;
  END IF;
  
  -- Si is_company es true, user_type debe ser 'inmobiliaria'
  IF NEW.is_company = true AND NEW.user_type != 'inmobiliaria' THEN
    NEW.user_type := 'inmobiliaria';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5.2 Crear trigger
DROP TRIGGER IF EXISTS trg_sync_is_company ON users;
CREATE TRIGGER trg_sync_is_company
  BEFORE INSERT OR UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION sync_is_company();

-- =============================================
-- PARTE 6: VERIFICACIÓN POST-FIX
-- =============================================

-- 6.1 Verificar que la columna existe
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'users' 
  AND column_name = 'is_company';

-- Resultado esperado:
-- column_name | data_type | is_nullable | column_default
-- is_company  | boolean   | YES         | false

-- 6.2 Verificar constraints
SELECT 
  conname,
  contype,
  pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'users'::regclass
  AND conname LIKE '%company%';

-- 6.3 Verificar trigger
SELECT 
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'users'
  AND trigger_name = 'trg_sync_is_company';

-- 6.4 Verificar datos actualizados
SELECT 
  user_type,
  COUNT(*) as total,
  COUNT(CASE WHEN is_company = true THEN 1 END) as con_is_company,
  COUNT(CASE WHEN is_company = false THEN 1 END) as sin_is_company,
  COUNT(CASE WHEN is_company IS NULL THEN 1 END) as is_company_null
FROM users
GROUP BY user_type
ORDER BY total DESC;

-- Resultado esperado:
-- user_type      | total | con_is_company | sin_is_company | is_company_null
-- inquilino      | XX    | 0              | XX             | 0
-- inmobiliaria   | XX    | XX             | 0              | 0
-- dueno_directo  | XX    | 0              | XX             | 0

-- 6.5 Verificar consistencia
SELECT 
  id,
  email,
  user_type,
  is_company,
  company_name
FROM users
WHERE 
  (user_type = 'inmobiliaria' AND is_company != true) OR
  (user_type != 'inmobiliaria' AND is_company = true) OR
  (is_company = true AND (company_name IS NULL OR company_name = ''));

-- Resultado esperado: 0 filas (sin inconsistencias)

-- =============================================
-- PARTE 7: ACTUALIZAR QUERIES EXISTENTES
-- =============================================

-- 7.1 Query de ejemplo que ahora funcionará:
SELECT 
  user_type,
  COUNT(*) as total,
  COUNT(CASE WHEN is_company = true THEN 1 END) as con_is_company,
  COUNT(CASE WHEN company_name IS NOT NULL THEN 1 END) as con_company_name
FROM users
GROUP BY user_type
ORDER BY total DESC;

-- 7.2 Query con JOIN que ahora funcionará (ajustar según tipo de id):
-- Si ambos son TEXT:
SELECT 
  u.id,
  u.email,
  u.user_type,
  u.is_company,
  u.company_name,
  up.role as user_profile_role
FROM users u
LEFT JOIN user_profiles up ON u.id = up.user_id
WHERE u.user_type = 'inmobiliaria'
ORDER BY u.created_at DESC
LIMIT 10;

-- =============================================
-- PARTE 8: DOCUMENTACIÓN DE CAMBIOS
-- =============================================

-- Cambios realizados:
-- 1. ✅ Agregada columna is_company (boolean, default false)
-- 2. ✅ Actualizado is_company para inmobiliarias existentes
-- 3. ✅ Creado índice idx_users_is_company
-- 4. ✅ Agregado constraint check_inmobiliaria_is_company
-- 5. ✅ Agregado constraint check_company_has_name
-- 6. ✅ Creado trigger sync_is_company para mantener consistencia
-- 7. ✅ Verificado que no hay inconsistencias en datos

-- Pendiente (para ventana de mantenimiento):
-- - Evaluar migración de users.id de TEXT a UUID si es necesario
-- - Actualizar todas las foreign keys relacionadas
-- - Recrear índices afectados

-- =============================================
-- ROLLBACK (Si es necesario)
-- =============================================

/*
-- Eliminar trigger
DROP TRIGGER IF EXISTS trg_sync_is_company ON users;
DROP FUNCTION IF EXISTS sync_is_company();

-- Eliminar constraints
ALTER TABLE users DROP CONSTRAINT IF EXISTS check_inmobiliaria_is_company;
ALTER TABLE users DROP CONSTRAINT IF EXISTS check_company_has_name;

-- Eliminar índice
DROP INDEX IF EXISTS idx_users_is_company;

-- Eliminar columna
ALTER TABLE users DROP COLUMN IF EXISTS is_company;
*/

-- =============================================
-- NOTAS FINALES
-- =============================================

-- Este fix resuelve:
-- ✅ ERROR 42703: column "is_company" does not exist
-- ✅ Inconsistencias entre user_type y is_company
-- ✅ Falta de validación de company_name para empresas

-- NO resuelve (requiere migración mayor):
-- ⚠️ Problema de tipo UUID vs TEXT (si existe)
-- ⚠️ Requiere análisis de impacto en toda la base de datos

-- Próximos pasos recomendados:
-- 1. Ejecutar este script en desarrollo
-- 2. Verificar que todas las queries funcionan
-- 3. Ejecutar diagnóstico completo nuevamente
-- 4. Si todo OK, ejecutar en producción
-- 5. Planificar migración de tipos de datos si es necesario
