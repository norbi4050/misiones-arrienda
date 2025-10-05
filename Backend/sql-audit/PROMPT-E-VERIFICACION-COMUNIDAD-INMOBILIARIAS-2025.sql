-- ============================================================================
-- PROMPT E — Backfill/Migración de Publicaciones Mal Categorizadas
-- ============================================================================
-- Fecha: 2025-01-XX
-- Objetivo: Detectar y corregir posts de comunidad mal categorizados
-- Instrucciones: Ejecutar en Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- PASO 1: VERIFICACIÓN - Posts de comunidad creados por inmobiliarias
-- ============================================================================
-- Objetivo: Detectar si hay inmobiliarias que crearon posts de comunidad
-- Resultado esperado: 0 filas (las inmobiliarias NO deberían crear posts de comunidad)
-- Nota: Ajustado para esquema real de Supabase (snake_case, sin columna 'role')

SELECT 
  cp.id as post_id,
  cp.title as post_title,
  cp.user_id,
  u.email,
  u.user_type,
  u.is_company,
  u.company_name,
  cp.created_at,
  cp.is_active,
  cp.status
FROM community_posts cp
INNER JOIN users u ON cp.user_id::text = u.id::text
WHERE u.user_type = 'inmobiliaria' 
   OR u.is_company = true
ORDER BY cp.created_at DESC;

-- ✅ Si retorna 0 filas: CORRECTO - No hay anomalías
-- ⚠️  Si retorna N filas: REVISAR - Hay posts de comunidad creados por inmobiliarias

-- ============================================================================
-- PASO 2: CONTEO - Resumen de publicaciones por tipo de usuario
-- ============================================================================

SELECT 
  u.user_type,
  u.is_company,
  COUNT(DISTINCT p.id) as propiedades_count,
  COUNT(DISTINCT cp.id) as community_posts_count
FROM users u
LEFT JOIN properties p ON p.user_id::text = u.id::text
LEFT JOIN community_posts cp ON cp.user_id::text = u.id::text
WHERE u.user_type IS NOT NULL
GROUP BY u.user_type, u.is_company
ORDER BY u.user_type;

-- Resultado esperado:
-- - Inmobiliarias: propiedades_count > 0, community_posts_count = 0
-- - Inquilinos: propiedades_count >= 0, community_posts_count >= 0
-- - Dueños directos: propiedades_count >= 0, community_posts_count >= 0

-- ============================================================================
-- PASO 3: VERIFICACIÓN - Propiedades de otros usuarios accesibles
-- ============================================================================
-- Objetivo: Verificar que RLS funciona correctamente
-- Nota: Esta query debe ejecutarse con service_role para ver todos los datos

SELECT 
  p.id,
  p.title,
  p.user_id,
  u.email,
  u.user_type,
  p.is_active,
  p.created_at
FROM properties p
INNER JOIN users u ON p.user_id::text = u.id::text
WHERE p.is_active = true
ORDER BY p.created_at DESC
LIMIT 20;

-- Verificar manualmente que cada propiedad pertenece al usuario correcto

-- ============================================================================
-- PASO 4: DETECCIÓN - Usuarios con tipos inconsistentes
-- ============================================================================

SELECT 
  id,
  email,
  user_type,
  is_company,
  company_name,
  created_at,
  CASE 
    WHEN user_type = 'inmobiliaria' AND (is_company = false OR is_company IS NULL) THEN 'INCONSISTENTE: inmobiliaria pero is_company=false/null'
    WHEN user_type != 'inmobiliaria' AND is_company = true THEN 'INCONSISTENTE: no inmobiliaria pero is_company=true'
    WHEN user_type IS NULL THEN 'INCONSISTENTE: user_type NULL'
    ELSE 'OK'
  END as consistency_check
FROM users
WHERE (user_type = 'inmobiliaria' AND (is_company = false OR is_company IS NULL))
   OR (user_type != 'inmobiliaria' AND is_company = true)
   OR (user_type IS NULL)
ORDER BY created_at DESC;

-- ✅ Si retorna 0 filas: CORRECTO - Todos los usuarios tienen tipos consistentes
-- ⚠️  Si retorna N filas: CORREGIR - Hay usuarios con tipos inconsistentes

-- ============================================================================
-- PASO 5: PLAN DE BACKFILL (Solo ejecutar si se detectan anomalías)
-- ============================================================================

-- OPCIÓN A: Eliminar posts de comunidad creados por inmobiliarias
-- (Solo ejecutar si PASO 1 retornó filas)

/*
BEGIN;

-- Backup antes de eliminar
CREATE TABLE IF NOT EXISTS community_posts_backup_2025 AS
SELECT * FROM community_posts
WHERE user_id::text IN (
  SELECT id::text FROM users 
  WHERE user_type = 'inmobiliaria' 
     OR is_company = true
);

-- Eliminar posts de comunidad de inmobiliarias
DELETE FROM community_posts
WHERE user_id::text IN (
  SELECT id::text FROM users 
  WHERE user_type = 'inmobiliaria' 
     OR is_company = true
);

-- Verificar resultado
SELECT COUNT(*) as posts_eliminados FROM community_posts_backup_2025;

COMMIT;
-- Si algo sale mal: ROLLBACK;
*/

-- OPCIÓN B: Corregir tipos de usuario inconsistentes
-- (Solo ejecutar si PASO 4 retornó filas)

/*
BEGIN;

-- Corregir is_company para inmobiliarias
UPDATE users
SET is_company = true
WHERE user_type = 'inmobiliaria' AND is_company = false;

-- Corregir is_company para no-inmobiliarias
UPDATE users
SET is_company = false
WHERE user_type != 'inmobiliaria' AND is_company = true;

-- Verificar resultado
SELECT 
  user_type,
  is_company,
  COUNT(*) as count
FROM users
GROUP BY user_type, is_company
ORDER BY user_type;

COMMIT;
-- Si algo sale mal: ROLLBACK;
*/

-- ============================================================================
-- PASO 6: VERIFICACIÓN FINAL - Conteos antes/después
-- ============================================================================

-- Ejecutar ANTES de cualquier cambio
SELECT 
  'ANTES' as momento,
  (SELECT COUNT(*) FROM community_posts cp 
   INNER JOIN users u ON cp.user_id::text = u.id::text 
   WHERE u.user_type = 'inmobiliaria' OR u.is_company = true) as posts_comunidad_inmobiliarias,
  (SELECT COUNT(*) FROM properties p 
   INNER JOIN users u ON p.user_id::text = u.id::text 
   WHERE u.user_type = 'inmobiliaria' OR u.is_company = true) as propiedades_inmobiliarias,
  (SELECT COUNT(*) FROM community_posts cp 
   INNER JOIN users u ON cp.user_id::text = u.id::text 
   WHERE u.user_type IN ('inquilino', 'busco_alquilar', 'dueno_directo')) as posts_comunidad_inquilinos;

-- Ejecutar DESPUÉS de aplicar cambios (si se aplicaron)
-- Cambiar 'ANTES' por 'DESPUES' y ejecutar nuevamente

-- ============================================================================
-- PASO 7: PLAN DE REVERSIÓN (Si se necesita deshacer cambios)
-- ============================================================================

/*
-- Si se eliminaron posts de comunidad y se necesita restaurar:
BEGIN;

INSERT INTO community_posts
SELECT * FROM community_posts_backup_2025;

-- Verificar
SELECT COUNT(*) FROM community_posts;

COMMIT;
*/

-- ============================================================================
-- NOTAS IMPORTANTES
-- ============================================================================

-- 1. SIEMPRE hacer backup antes de modificar datos
-- 2. Usar transacciones (BEGIN/COMMIT/ROLLBACK)
-- 3. Verificar resultados antes de hacer COMMIT
-- 4. Documentar todos los cambios realizados
-- 5. Guardar conteos antes/después para auditoría

-- ============================================================================
-- RESULTADO ESPERADO
-- ============================================================================

-- ✅ ESCENARIO IDEAL:
--    - PASO 1: 0 filas (no hay posts de comunidad de inmobiliarias)
--    - PASO 4: 0 filas (no hay inconsistencias de tipos)
--    - No se requiere backfill

-- ⚠️  ESCENARIO CON ANOMALÍAS:
--    - PASO 1: N filas → Ejecutar OPCIÓN A (eliminar)
--    - PASO 4: N filas → Ejecutar OPCIÓN B (corregir tipos)
--    - Documentar cambios en REPORTE-BACKFILL-2025.md

-- ============================================================================
-- FIN DEL SCRIPT
-- ============================================================================
