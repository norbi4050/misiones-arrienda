-- ============================================================================
-- MIGRACIÓN: Agregar Campos de Presencia a Tabla User
-- ============================================================================
-- Fecha: 2025
-- Objetivo: Agregar campos para rastrear estado online/offline y última conexión
-- Tabla: User
-- Campos: is_online, last_seen, last_activity
-- ============================================================================

-- IMPORTANTE: Ejecutar en Supabase SQL Editor
-- Este script es idempotente (puede ejecutarse múltiples veces sin errores)

-- ============================================================================
-- PASO 1: Agregar Campos de Presencia
-- ============================================================================

-- Campo: is_online
-- Descripción: Indica si el usuario está actualmente online
-- Tipo: BOOLEAN
-- Default: false (usuario offline por defecto)
ALTER TABLE "User" 
ADD COLUMN IF NOT EXISTS is_online BOOLEAN DEFAULT false;

-- Campo: last_seen
-- Descripción: Timestamp de la última vez que el usuario estuvo activo
-- Tipo: TIMESTAMPTZ (timestamp con zona horaria)
-- Default: NULL (no se ha visto aún)
ALTER TABLE "User" 
ADD COLUMN IF NOT EXISTS last_seen TIMESTAMPTZ;

-- Campo: last_activity
-- Descripción: Timestamp de la última actividad registrada del usuario
-- Tipo: TIMESTAMPTZ (timestamp con zona horaria)
-- Default: NOW() (momento de creación del registro)
ALTER TABLE "User" 
ADD COLUMN IF NOT EXISTS last_activity TIMESTAMPTZ DEFAULT NOW();

-- ============================================================================
-- PASO 2: Crear Índices para Optimizar Consultas
-- ============================================================================

-- Índice compuesto para consultas de presencia
-- Optimiza queries que filtran por is_online y ordenan por last_seen
CREATE INDEX IF NOT EXISTS idx_user_online_status 
ON "User"(is_online, last_seen);

-- Índice para consultas de actividad reciente
-- Optimiza queries que buscan usuarios activos recientemente
CREATE INDEX IF NOT EXISTS idx_user_last_activity 
ON "User"(last_activity DESC);

-- ============================================================================
-- PASO 3: Agregar Comentarios para Documentación
-- ============================================================================

COMMENT ON COLUMN "User".is_online IS 
'Estado actual del usuario: true si está online, false si está offline. Se actualiza automáticamente por el sistema de tracking de presencia.';

COMMENT ON COLUMN "User".last_seen IS 
'Última vez que el usuario estuvo activo (timestamp con zona horaria). Se actualiza cuando el usuario realiza cualquier actividad o cuando se marca como offline.';

COMMENT ON COLUMN "User".last_activity IS 
'Timestamp de la última actividad registrada del usuario. Se actualiza periódicamente mientras el usuario está activo (cada ~60 segundos).';

-- ============================================================================
-- PASO 4: Verificación de la Migración
-- ============================================================================

-- Verificar que los campos se crearon correctamente
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'User' 
AND column_name IN ('is_online', 'last_seen', 'last_activity')
ORDER BY column_name;

-- Resultado esperado:
-- column_name   | data_type                   | is_nullable | column_default
-- --------------+-----------------------------+-------------+----------------
-- is_online     | boolean                     | YES         | false
-- last_activity | timestamp with time zone    | YES         | now()
-- last_seen     | timestamp with time zone    | YES         | NULL

-- Verificar que los índices se crearon correctamente
SELECT 
  indexname,
  indexdef
FROM pg_indexes 
WHERE tablename = 'User' 
AND indexname LIKE 'idx_user_%'
ORDER BY indexname;

-- Resultado esperado:
-- indexname              | indexdef
-- -----------------------+--------------------------------------------------
-- idx_user_last_activity | CREATE INDEX idx_user_last_activity ON "User"...
-- idx_user_online_status | CREATE INDEX idx_user_online_status ON "User"...

-- ============================================================================
-- PASO 5: Inicializar Datos Existentes (Opcional)
-- ============================================================================

-- Marcar todos los usuarios existentes como offline
-- Esto es opcional, ya que el default es false
UPDATE "User" 
SET 
  is_online = false,
  last_seen = NOW(),
  last_activity = NOW()
WHERE is_online IS NULL;

-- Verificar cuántos usuarios se actualizaron
SELECT COUNT(*) as usuarios_actualizados
FROM "User"
WHERE is_online = false;

-- ============================================================================
-- NOTAS IMPORTANTES
-- ============================================================================

-- 1. Esta migración es SEGURA y NO afecta datos existentes
-- 2. Los campos son NULLABLE para compatibilidad con registros existentes
-- 3. Los índices mejoran el performance de consultas de presencia
-- 4. El sistema de tracking actualizará estos campos automáticamente
-- 5. Si necesitas revertir, ejecuta: DROP COLUMN IF EXISTS is_online, last_seen, last_activity

-- ============================================================================
-- ROLLBACK (Solo si es necesario)
-- ============================================================================

-- ADVERTENCIA: Esto eliminará los campos y sus datos
-- Solo ejecutar si necesitas revertir la migración

-- ALTER TABLE "User" DROP COLUMN IF EXISTS is_online;
-- ALTER TABLE "User" DROP COLUMN IF EXISTS last_seen;
-- ALTER TABLE "User" DROP COLUMN IF EXISTS last_activity;
-- DROP INDEX IF EXISTS idx_user_online_status;
-- DROP INDEX IF EXISTS idx_user_last_activity;

-- ============================================================================
-- FIN DE LA MIGRACIÓN
-- ============================================================================

-- ✅ Migración completada exitosamente
-- ✅ Campos de presencia agregados a tabla User
-- ✅ Índices creados para optimizar consultas
-- ✅ Documentación agregada con comentarios

-- Próximo paso: Ejecutar ADD-PRESENCE-FIELDS-USERPROFILE-2025.sql
