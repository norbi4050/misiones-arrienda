-- ============================================================================
-- PROMPT B1: Backfill de nombres (solo faltantes)
-- ============================================================================
-- Objetivo: Completar nombres mínimos sin romper nada
--
-- IMPORTANTE: Este script es TRANSACCIONAL y solo afecta usuarios que:
--   - Tienen User.name = NULL
--   - NO tienen UserProfile.companyName
--   - NO tienen UserProfile.full_name
--
-- Fecha: 2025-01-XX
-- Autor: Sistema de Auditoría DisplayName/Avatar
-- ============================================================================

-- ============================================================================
-- PASO 1: VERIFICACIÓN PRE-BACKFILL
-- ============================================================================
-- Ejecutar ANTES del backfill para saber cuántos usuarios se actualizarán

SELECT 
  'PRE-BACKFILL: Usuarios a actualizar' AS status,
  COUNT(*) AS total_usuarios,
  COUNT(DISTINCT u.email) AS emails_unicos
FROM public."User" u
LEFT JOIN public."UserProfile" up ON u.id = up."userId"
WHERE u.name IS NULL
  AND (up."companyName" IS NULL OR TRIM(up."companyName") = '')
  AND (up.full_name IS NULL OR TRIM(up.full_name) = '');

-- Muestra de usuarios que serán afectados (primeros 10)
SELECT 
  u.id,
  u.email,
  u.name AS current_name,
  SPLIT_PART(u.email, '@', 1) AS new_name,
  up."companyName",
  up.full_name
FROM public."User" u
LEFT JOIN public."UserProfile" up ON u.id = up."userId"
WHERE u.name IS NULL
  AND (up."companyName" IS NULL OR TRIM(up."companyName") = '')
  AND (up.full_name IS NULL OR TRIM(up.full_name) = '')
LIMIT 10;

-- ============================================================================
-- PASO 2: BACKFILL TRANSACCIONAL
-- ============================================================================
-- EJECUTAR SOLO DESPUÉS DE VERIFICAR EL PASO 1

BEGIN;

-- Actualizar User.name con la parte local del email
UPDATE public."User" u
SET 
  name = SPLIT_PART(u.email, '@', 1),
  updated_at = NOW()
FROM public."UserProfile" up
WHERE u.id = up."userId"
  AND u.name IS NULL
  AND (up."companyName" IS NULL OR TRIM(up."companyName") = '')
  AND (up.full_name IS NULL OR TRIM(up.full_name) = '');

-- Log de filas afectadas
SELECT 
  'BACKFILL COMPLETADO' AS status,
  COUNT(*) AS filas_actualizadas,
  NOW() AS timestamp
FROM public."User"
WHERE name = SPLIT_PART(email, '@', 1)
  AND updated_at > NOW() - INTERVAL '1 minute';

-- Verificar que no se crearon UUIDs accidentalmente
SELECT 
  'VERIFICACIÓN: UUIDs detectados' AS status,
  COUNT(*) AS total_uuids
FROM public."User"
WHERE name ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  AND updated_at > NOW() - INTERVAL '1 minute';

-- Si todo está OK, hacer COMMIT
-- Si hay problemas, hacer ROLLBACK
COMMIT;
-- ROLLBACK; -- Descomentar si necesitas revertir

-- ============================================================================
-- PASO 3: VERIFICACIÓN POST-BACKFILL
-- ============================================================================
-- Ejecutar DESPUÉS del backfill para confirmar el resultado

SELECT 
  'POST-BACKFILL: Usuarios sin nombre' AS status,
  COUNT(*) AS total_usuarios_sin_nombre
FROM public."User" u
LEFT JOIN public."UserProfile" up ON u.id = up."userId"
WHERE u.name IS NULL
  AND (up."companyName" IS NULL OR TRIM(up."companyName") = '')
  AND (up.full_name IS NULL OR TRIM(up.full_name) = '');

-- Distribución de fuentes de displayName después del backfill
WITH user_conversations AS (
  SELECT DISTINCT user_id
  FROM public."Conversation"
  WHERE user_id IS NOT NULL
  
  UNION
  
  SELECT DISTINCT other_user_id
  FROM public."Conversation"
  WHERE other_user_id IS NOT NULL
),

user_data_enriched AS (
  SELECT 
    uc.user_id,
    
    CASE
      WHEN u.name IS NOT NULL 
           AND TRIM(u.name) != '' 
           AND u.name !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      THEN 'User.name'
      
      WHEN up."companyName" IS NOT NULL 
           AND TRIM(up."companyName") != '' 
      THEN 'UserProfile.companyName'
      
      WHEN up.full_name IS NOT NULL 
           AND TRIM(up.full_name) != '' 
      THEN 'UserProfile.full_name'
      
      WHEN u.email IS NOT NULL 
           AND SPLIT_PART(u.email, '@', 1) IS NOT NULL
      THEN 'emailLocal'
      
      ELSE 'NO_DATA'
    END AS displayName_source
    
  FROM user_conversations uc
  LEFT JOIN public."User" u ON uc.user_id = u.id
  LEFT JOIN public."UserProfile" up ON uc.user_id = up."userId"
)

SELECT 
  displayName_source AS "Fuente DisplayName",
  COUNT(*) AS "Total Usuarios",
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) AS "Porcentaje %"
FROM user_data_enriched
GROUP BY displayName_source
ORDER BY 
  CASE 
    WHEN displayName_source = 'NO_DATA' THEN 0
    ELSE 1
  END,
  COUNT(*) DESC;

-- ============================================================================
-- CHECKLIST DE EJECUCIÓN
-- ============================================================================

/*
CHECKLIST PARA STAGING:

□ 1. Hacer backup de la tabla User
     pg_dump -h <host> -U <user> -d <database> -t public."User" > backup_user_pre_backfill.sql

□ 2. Ejecutar PASO 1 (Verificación PRE-BACKFILL)
     - Anotar número de usuarios a actualizar: _______
     - Revisar muestra de 10 usuarios
     - Confirmar que los new_name son correctos

□ 3. Ejecutar PASO 2 (Backfill transaccional)
     - Verificar que filas_actualizadas coincide con el PASO 1
     - Verificar que total_uuids = 0
     - Si todo OK: COMMIT
     - Si hay problemas: ROLLBACK

□ 4. Ejecutar PASO 3 (Verificación POST-BACKFILL)
     - Confirmar que total_usuarios_sin_nombre = 0 (o muy bajo)
     - Revisar distribución de displayName_source
     - Confirmar que NO_DATA < 1%

□ 5. Verificar en UI (staging)
     - Navegar a /messages
     - Verificar que no hay UUIDs en pantalla
     - Verificar que no hay "Usuario" (salvo casos sin email)

CHECKLIST PARA PRODUCCIÓN:

□ 1. Confirmar que staging funcionó correctamente

□ 2. Hacer backup de la tabla User en producción
     pg_dump -h <host> -U <user> -d <database> -t public."User" > backup_user_prod_pre_backfill.sql

□ 3. Ejecutar PASO 1 (Verificación PRE-BACKFILL)
     - Anotar número de usuarios a actualizar: _______

□ 4. Ejecutar PASO 2 (Backfill transaccional)
     - Verificar resultados
     - COMMIT si todo OK

□ 5. Ejecutar PASO 3 (Verificación POST-BACKFILL)
     - Confirmar resultados esperados

□ 6. Verificar en UI (producción)
     - Navegar a /messages
     - Verificar que no hay UUIDs
     - Verificar que no hay "Usuario"

□ 7. Monitorear por 24 horas
     - Revisar logs de errores
     - Revisar reportes de usuarios
     - Confirmar que no hay regresiones
*/

-- ============================================================================
-- ROLLBACK (SI ES NECESARIO)
-- ============================================================================

/*
Si necesitas revertir el backfill:

BEGIN;

-- Restaurar name a NULL para usuarios que fueron actualizados
UPDATE public."User"
SET 
  name = NULL,
  updated_at = NOW()
WHERE name = SPLIT_PART(email, '@', 1)
  AND updated_at > '2025-01-XX 00:00:00'; -- Ajustar fecha del backfill

-- Verificar cuántos se revirtieron
SELECT 
  'ROLLBACK COMPLETADO' AS status,
  COUNT(*) AS filas_revertidas
FROM public."User"
WHERE name IS NULL
  AND updated_at > NOW() - INTERVAL '1 minute';

COMMIT;
*/

-- ============================================================================
-- NOTAS IMPORTANTES
-- ============================================================================

/*
1. Este script NO afecta usuarios que ya tienen:
   - User.name con valor
   - UserProfile.companyName con valor
   - UserProfile.full_name con valor

2. Solo actualiza usuarios que NO tienen ninguna fuente de displayName

3. El backfill usa SPLIT_PART(email, '@', 1) que es seguro y predecible

4. La verificación de UUIDs previene que se creen nombres inválidos

5. El script es idempotente: se puede ejecutar múltiples veces sin problemas

6. SIEMPRE hacer backup antes de ejecutar en producción

7. SIEMPRE probar en staging primero
*/
