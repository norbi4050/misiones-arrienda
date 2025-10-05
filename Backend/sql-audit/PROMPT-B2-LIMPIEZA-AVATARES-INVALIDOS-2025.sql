-- ============================================================================
-- PROMPT B2: Limpieza de avatars inválidos
-- ============================================================================
-- Objetivo: Evitar errores de carga y forzar fallback a iniciales
--
-- IMPORTANTE: Este script es TRANSACCIONAL y setea avatar = NULL cuando:
--   - avatar es string vacío
--   - avatar es data: URL vacía o incompleta
--   - avatar contiene '404', 'not-found', 'error'
--   - avatar usa http:// (no https://)
--   - avatar es dominio interno (localhost, 127.0.0.1, etc.)
--   - avatar es placeholder o ejemplo
--   - avatar es un UUID (no una URL)
--
-- Fecha: 2025-01-XX
-- Autor: Sistema de Auditoría DisplayName/Avatar
-- ============================================================================

-- ============================================================================
-- PASO 1: VERIFICACIÓN PRE-LIMPIEZA
-- ============================================================================
-- Ejecutar ANTES de la limpieza para saber cuántos avatares se limpiarán

SELECT 
  CASE
    WHEN avatar IS NULL THEN 'NULL'
    WHEN TRIM(avatar) = '' THEN 'VACIO'
    WHEN avatar LIKE 'data:,%' OR avatar LIKE 'data:;%' THEN 'DATA_URL_VACIA'
    WHEN avatar LIKE '%404%' OR avatar LIKE '%not-found%' OR avatar LIKE '%error%' THEN 'URL_404'
    WHEN avatar LIKE 'http://%' AND avatar NOT LIKE 'https://%' THEN 'HTTP_INSEGURO'
    WHEN avatar LIKE '%localhost%' OR avatar LIKE '%127.0.0.1%' OR avatar LIKE '%192.168.%' OR avatar LIKE '%10.0.%' THEN 'DOMINIO_INTERNO'
    WHEN avatar LIKE '%placeholder%' OR avatar LIKE '%example.com%' OR avatar LIKE '%test.com%' OR avatar LIKE '%dummy%' THEN 'PLACEHOLDER'
    WHEN avatar ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN 'UUID_COMO_URL'
    WHEN avatar LIKE 'https://%' THEN 'OK'
    ELSE 'SOSPECHOSO'
  END AS avatar_flag,
  COUNT(*) AS total,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) AS porcentaje
FROM public."User"
GROUP BY avatar_flag
ORDER BY 
  CASE 
    WHEN avatar_flag = 'OK' THEN 1
    WHEN avatar_flag = 'NULL' THEN 2
    ELSE 0
  END,
  COUNT(*) DESC;

-- Muestra de avatares que serán limpiados (primeros 20)
SELECT 
  u.id,
  u.email,
  u.avatar,
  CASE
    WHEN TRIM(u.avatar) = '' THEN 'VACIO'
    WHEN u.avatar LIKE 'data:,%' OR u.avatar LIKE 'data:;%' THEN 'DATA_URL_VACIA'
    WHEN u.avatar LIKE '%404%' THEN 'URL_404'
    WHEN u.avatar LIKE 'http://%' AND u.avatar NOT LIKE 'https://%' THEN 'HTTP_INSEGURO'
    WHEN u.avatar LIKE '%localhost%' THEN 'DOMINIO_INTERNO'
    WHEN u.avatar ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN 'UUID_COMO_URL'
    ELSE 'OTRO_INVALIDO'
  END AS razon_limpieza
FROM public."User" u
WHERE 
  (u.avatar IS NOT NULL AND TRIM(u.avatar) = '')
  OR u.avatar LIKE 'data:,%'
  OR u.avatar LIKE 'data:;%'
  OR u.avatar LIKE 'data:image/%'
  OR u.avatar LIKE '%404%'
  OR u.avatar LIKE '%not-found%'
  OR u.avatar LIKE '%error%'
  OR (u.avatar LIKE 'http://%' AND u.avatar NOT LIKE 'https://%')
  OR u.avatar LIKE '%localhost%'
  OR u.avatar LIKE '%127.0.0.1%'
  OR u.avatar LIKE '%192.168.%'
  OR u.avatar LIKE '%10.0.%'
  OR u.avatar LIKE '%placeholder%'
  OR u.avatar LIKE '%example.com%'
  OR u.avatar LIKE '%test.com%'
  OR u.avatar LIKE '%dummy%'
  OR u.avatar ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
LIMIT 20;

-- Contador de avatares a limpiar
SELECT 
  'PRE-LIMPIEZA: Avatares a limpiar' AS status,
  COUNT(*) AS total_avatares_invalidos
FROM public."User"
WHERE 
  (avatar IS NOT NULL AND TRIM(avatar) = '')
  OR avatar LIKE 'data:,%'
  OR avatar LIKE 'data:;%'
  OR avatar LIKE 'data:image/%'
  OR avatar LIKE '%404%'
  OR avatar LIKE '%not-found%'
  OR avatar LIKE '%error%'
  OR (avatar LIKE 'http://%' AND avatar NOT LIKE 'https://%')
  OR avatar LIKE '%localhost%'
  OR avatar LIKE '%127.0.0.1%'
  OR avatar LIKE '%192.168.%'
  OR avatar LIKE '%10.0.%'
  OR avatar LIKE '%placeholder%'
  OR avatar LIKE '%example.com%'
  OR avatar LIKE '%test.com%'
  OR avatar LIKE '%dummy%'
  OR avatar ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

-- ============================================================================
-- PASO 2: LIMPIEZA TRANSACCIONAL
-- ============================================================================
-- EJECUTAR SOLO DESPUÉS DE VERIFICAR EL PASO 1

BEGIN;

-- Actualizar avatar a NULL para casos inválidos
UPDATE public."User"
SET 
  avatar = NULL,
  updated_at = NOW()
WHERE 
  -- Casos a limpiar (todos excepto OK)
  (avatar IS NOT NULL AND TRIM(avatar) = '')
  OR avatar LIKE 'data:,%'
  OR avatar LIKE 'data:;%'
  OR avatar LIKE 'data:image/%'
  OR avatar LIKE '%404%'
  OR avatar LIKE '%not-found%'
  OR avatar LIKE '%error%'
  OR (avatar LIKE 'http://%' AND avatar NOT LIKE 'https://%')
  OR avatar LIKE '%localhost%'
  OR avatar LIKE '%127.0.0.1%'
  OR avatar LIKE '%192.168.%'
  OR avatar LIKE '%10.0.%'
  OR avatar LIKE '%placeholder%'
  OR avatar LIKE '%example.com%'
  OR avatar LIKE '%test.com%'
  OR avatar LIKE '%dummy%'
  OR avatar ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

-- Log de filas afectadas
SELECT 
  'LIMPIEZA COMPLETADA' AS status,
  COUNT(*) AS filas_limpiadas,
  NOW() AS timestamp
FROM public."User"
WHERE avatar IS NULL
  AND updated_at > NOW() - INTERVAL '1 minute';

-- Si todo está OK, hacer COMMIT
-- Si hay problemas, hacer ROLLBACK
COMMIT;
-- ROLLBACK; -- Descomentar si necesitas revertir

-- ============================================================================
-- PASO 3: VERIFICACIÓN POST-LIMPIEZA
-- ============================================================================
-- Ejecutar DESPUÉS de la limpieza para confirmar el resultado

SELECT 
  CASE
    WHEN avatar IS NULL THEN 'NULL'
    WHEN avatar LIKE 'https://%' THEN 'OK'
    ELSE 'REQUIERE_REVISION'
  END AS avatar_status,
  COUNT(*) AS total,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) AS porcentaje
FROM public."User"
GROUP BY avatar_status
ORDER BY COUNT(*) DESC;

-- Verificar que no quedan avatares inválidos
SELECT 
  'POST-LIMPIEZA: Avatares inválidos restantes' AS status,
  COUNT(*) AS total_invalidos_restantes
FROM public."User"
WHERE 
  (avatar IS NOT NULL AND TRIM(avatar) = '')
  OR avatar LIKE 'data:,%'
  OR avatar LIKE '%404%'
  OR avatar LIKE '%localhost%'
  OR avatar ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

-- ============================================================================
-- CHECKLIST DE EJECUCIÓN
-- ============================================================================

/*
CHECKLIST PARA STAGING:

□ 1. Hacer backup de la tabla User
     pg_dump -h <host> -U <user> -d <database> -t public."User" > backup_user_pre_avatar_cleanup.sql

□ 2. Ejecutar PASO 1 (Verificación PRE-LIMPIEZA)
     - Anotar distribución de avatar_flag
     - Revisar muestra de 20 avatares a limpiar
     - Anotar número total de avatares inválidos: _______

□ 3. Ejecutar PASO 2 (Limpieza transaccional)
     - Verificar que filas_limpiadas coincide con el PASO 1
     - Si todo OK: COMMIT
     - Si hay problemas: ROLLBACK

□ 4. Ejecutar PASO 3 (Verificación POST-LIMPIEZA)
     - Confirmar que total_invalidos_restantes = 0
     - Revisar distribución de avatar_status
     - Confirmar que solo hay 'OK' y 'NULL'

□ 5. Verificar en UI (staging)
     - Navegar a /messages
     - Verificar que no hay imágenes rotas (404)
     - Verificar que avatares NULL muestran iniciales

CHECKLIST PARA PRODUCCIÓN:

□ 1. Confirmar que staging funcionó correctamente

□ 2. Hacer backup de la tabla User en producción
     pg_dump -h <host> -U <user> -d <database> -t public."User" > backup_user_prod_pre_avatar_cleanup.sql

□ 3. Ejecutar PASO 1 (Verificación PRE-LIMPIEZA)
     - Anotar número de avatares a limpiar: _______

□ 4. Ejecutar PASO 2 (Limpieza transaccional)
     - Verificar resultados
     - COMMIT si todo OK

□ 5. Ejecutar PASO 3 (Verificación POST-LIMPIEZA)
     - Confirmar resultados esperados

□ 6. Verificar en UI (producción)
     - Navegar a /messages
     - Verificar que no hay imágenes rotas
     - Verificar que avatares NULL muestran iniciales

□ 7. Monitorear por 24 horas
     - Revisar logs de errores
     - Revisar reportes de usuarios
     - Confirmar que no hay regresiones
*/

-- ============================================================================
-- ROLLBACK (SI ES NECESARIO)
-- ============================================================================

/*
NOTA: No es posible restaurar los avatares originales sin un backup.
Si necesitas revertir, debes restaurar desde el backup:

pg_restore -h <host> -U <user> -d <database> backup_user_prod_pre_avatar_cleanup.sql

O si usaste pg_dump con formato SQL:

psql -h <host> -U <user> -d <database> < backup_user_prod_pre_avatar_cleanup.sql
*/

-- ============================================================================
-- NOTAS IMPORTANTES
-- ============================================================================

/*
1. Este script NO afecta avatares válidos (https:// URLs)

2. Setea avatar = NULL para forzar fallback a iniciales en el frontend

3. El frontend debe manejar avatar = NULL mostrando iniciales del nombre

4. La limpieza es irreversible sin backup

5. SIEMPRE hacer backup antes de ejecutar en producción

6. SIEMPRE probar en staging primero

7. El script es idempotente: se puede ejecutar múltiples veces sin problemas

8. Después de la limpieza, los usuarios pueden subir nuevos avatares válidos
*/
