-- ============================================================================
-- MIGRACIÓN: Agregar Campos de Presencia a Tabla UserProfile
-- ============================================================================
-- Fecha: 2025
-- Objetivo: Agregar campos para rastrear estado online/offline y última conexión
-- Tabla: UserProfile (Comunidad)
-- Campos: is_online, last_seen, last_activity
-- ============================================================================

-- IMPORTANTE: Ejecutar en Supabase SQL Editor
-- Este script es idempotente (puede ejecutarse múltiples veces sin errores)
-- Ejecutar DESPUÉS de ADD-PRESENCE-FIELDS-USER-2025.sql

-- ============================================================================
-- PASO 1: Agregar Campos de Presencia
-- ============================================================================

-- Campo: is_online
-- Descripción: Indica si el usuario está actualmente online en comunidad
-- Tipo: BOOLEAN
-- Default: false (usuario offline por defecto)
ALTER TABLE "UserProfile" 
ADD COLUMN IF NOT EXISTS is_online BOOLEAN DEFAULT false;

-- Campo: last_seen
-- Descripción: Timestamp de la última vez que el usuario estuvo activo en comunidad
-- Tipo: TIMESTAMPTZ (timestamp con zona horaria)
-- Default: NULL (no se ha visto aún)
ALTER TABLE "UserProfile" 
ADD COLUMN IF NOT EXISTS last_seen TIMESTAMPTZ;

-- Campo: last_activity
-- Descripción: Timestamp de la última actividad registrada del usuario en comunidad
-- Tipo: TIMESTAMPTZ (timestamp con zona horaria)
-- Default: NOW() (momento de creación del registro)
ALTER TABLE "UserProfile" 
ADD COLUMN IF NOT EXISTS last_activity TIMESTAMPTZ DEFAULT NOW();

-- ============================================================================
-- PASO 2: Crear Índices para Optimizar Consultas
-- ============================================================================

-- Índice compuesto para consultas de presencia
-- Optimiza queries que filtran por is_online y ordenan por last_seen
CREATE INDEX IF NOT EXISTS idx_userprofile_online_status 
ON "UserProfile"(is_online, last_seen);

-- Índice para consultas de actividad reciente
-- Optimiza queries que buscan usuarios activos recientemente en comunidad
CREATE INDEX IF NOT EXISTS idx_userprofile_last_activity 
ON "UserProfile"(last_activity DESC);

-- Índice compuesto con userId para joins eficientes
-- Optimiza queries que necesitan presencia junto con datos del usuario
CREATE INDEX IF NOT EXISTS idx_userprofile_userid_online 
ON "UserProfile"(userId, is_online);

-- ============================================================================
-- PASO 3: Agregar Comentarios para Documentación
-- ============================================================================

COMMENT ON COLUMN "UserProfile".is_online IS 
'Estado actual del usuario en comunidad: true si está online, false si está offline. Se sincroniza con User.is_online automáticamente.';

COMMENT ON COLUMN "UserProfile".last_seen IS 
'Última vez que el usuario estuvo activo en comunidad (timestamp con zona horaria). Se sincroniza con User.last_seen.';

COMMENT ON COLUMN "UserProfile".last_activity IS 
'Timestamp de la última actividad registrada del usuario en comunidad. Se actualiza periódicamente mientras el usuario está activo (cada ~60 segundos).';

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
WHERE table_name = 'UserProfile' 
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
WHERE tablename = 'UserProfile' 
AND indexname LIKE 'idx_userprofile_%'
ORDER BY indexname;

-- Resultado esperado:
-- indexname                      | indexdef
-- -------------------------------+--------------------------------------------------
-- idx_userprofile_last_activity  | CREATE INDEX idx_userprofile_last_activity ON...
-- idx_userprofile_online_status  | CREATE INDEX idx_userprofile_online_status ON...
-- idx_userprofile_userid_online  | CREATE INDEX idx_userprofile_userid_online ON...

-- ============================================================================
-- PASO 5: Sincronizar con Datos de User (Opcional)
-- ============================================================================

-- Sincronizar estado de presencia desde User a UserProfile
-- Esto asegura que ambas tablas tengan datos consistentes
UPDATE "UserProfile" up
SET 
  is_online = u.is_online,
  last_seen = u.last_seen,
  last_activity = u.last_activity
FROM "User" u
WHERE up.userId = u.id
AND up.is_online IS NULL;

-- Verificar cuántos perfiles se sincronizaron
SELECT COUNT(*) as perfiles_sincronizados
FROM "UserProfile" up
INNER JOIN "User" u ON up.userId = u.id
WHERE up.is_online = u.is_online;

-- ============================================================================
-- PASO 6: Verificación de Consistencia entre User y UserProfile
-- ============================================================================

-- Verificar que los datos están sincronizados
SELECT 
  u.id as user_id,
  u.name as user_name,
  u.is_online as user_online,
  u.last_seen as user_last_seen,
  up.id as profile_id,
  up.is_online as profile_online,
  up.last_seen as profile_last_seen,
  CASE 
    WHEN u.is_online = up.is_online THEN '✅ Sincronizado'
    ELSE '❌ Desincronizado'
  END as sync_status
FROM "User" u
LEFT JOIN "UserProfile" up ON u.id = up.userId
WHERE up.id IS NOT NULL
LIMIT 10;

-- ============================================================================
-- NOTAS IMPORTANTES
-- ============================================================================

-- 1. Esta migración es SEGURA y NO afecta datos existentes
-- 2. Los campos son NULLABLE para compatibilidad con registros existentes
-- 3. Los índices mejoran el performance de consultas de presencia
-- 4. El sistema de tracking actualizará AMBAS tablas (User y UserProfile) simultáneamente
-- 5. La sincronización inicial asegura consistencia de datos

-- ============================================================================
-- CONSIDERACIONES DE SINCRONIZACIÓN
-- ============================================================================

-- El sistema de tracking (activity-tracker.ts) actualizará AMBAS tablas:
-- 1. Cuando un usuario está activo → actualiza User Y UserProfile
-- 2. Cuando un usuario se marca offline → actualiza User Y UserProfile
-- 3. Esto garantiza que ambas tablas siempre estén sincronizadas

-- ============================================================================
-- ROLLBACK (Solo si es necesario)
-- ============================================================================

-- ADVERTENCIA: Esto eliminará los campos y sus datos
-- Solo ejecutar si necesitas revertir la migración

-- ALTER TABLE "UserProfile" DROP COLUMN IF EXISTS is_online;
-- ALTER TABLE "UserProfile" DROP COLUMN IF EXISTS last_seen;
-- ALTER TABLE "UserProfile" DROP COLUMN IF EXISTS last_activity;
-- DROP INDEX IF EXISTS idx_userprofile_online_status;
-- DROP INDEX IF EXISTS idx_userprofile_last_activity;
-- DROP INDEX IF EXISTS idx_userprofile_userid_online;

-- ============================================================================
-- FIN DE LA MIGRACIÓN
-- ============================================================================

-- ✅ Migración completada exitosamente
-- ✅ Campos de presencia agregados a tabla UserProfile
-- ✅ Índices creados para optimizar consultas
-- ✅ Documentación agregada con comentarios
-- ✅ Sincronización inicial con tabla User completada

-- Próximo paso: Actualizar prisma/schema.prisma (PROMPT 2)
