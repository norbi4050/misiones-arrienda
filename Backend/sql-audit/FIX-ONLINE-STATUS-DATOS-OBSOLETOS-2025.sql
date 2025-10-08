-- ============================================================================
-- FIX: Limpiar Estados de Presencia Obsoletos
-- ============================================================================
-- Fecha: 2025-01-XX
-- Problema: Usuarios marcados como "online" pero con last_activity antigua
-- Solución: Marcar como offline a usuarios con actividad > 5 minutos
-- ============================================================================

-- PASO 1: Ver usuarios con datos obsoletos (DIAGNÓSTICO)
-- ============================================================================
SELECT 
  id,
  email,
  name,
  company_name,
  is_online,
  last_activity,
  last_seen,
  EXTRACT(EPOCH FROM (NOW() - last_activity))/60 as minutes_since_activity,
  CASE 
    WHEN is_online = true AND last_activity < NOW() - INTERVAL '5 minutes' THEN '⚠️ OBSOLETO'
    WHEN is_online = true THEN '✅ ONLINE VÁLIDO'
    ELSE '❌ OFFLINE'
  END as status_validation
FROM "User"
WHERE is_online = true
ORDER BY last_activity DESC;

-- PASO 2: Marcar como offline a usuarios con actividad obsoleta
-- ============================================================================
UPDATE "User"
SET 
  is_online = false,
  last_seen = last_activity  -- Usar last_activity como last_seen
WHERE is_online = true
  AND last_activity < NOW() - INTERVAL '5 minutes';

-- PASO 3: Sincronizar con UserProfile (si existe)
-- ============================================================================
UPDATE "UserProfile" up
SET 
  is_online = false,
  last_seen = u.last_activity
FROM "User" u
WHERE up."userId" = u.id
  AND u.is_online = false
  AND up.is_online = true;

-- PASO 4: Verificar resultados
-- ============================================================================
SELECT 
  COUNT(*) FILTER (WHERE is_online = true) as usuarios_online,
  COUNT(*) FILTER (WHERE is_online = false) as usuarios_offline,
  COUNT(*) FILTER (
    WHERE is_online = true 
    AND last_activity < NOW() - INTERVAL '5 minutes'
  ) as usuarios_con_datos_obsoletos
FROM "User";

-- ============================================================================
-- NOTAS IMPORTANTES
-- ============================================================================
-- 1. Este script limpia datos obsoletos UNA VEZ
-- 2. El fix en getUserPresence() previene el problema en el futuro
-- 3. Se recomienda ejecutar cleanup_stale_presence() periódicamente
-- 4. Considerar configurar un cron job para ejecutar cada 10 minutos
-- ============================================================================

-- PASO 5 (OPCIONAL): Ejecutar función de cleanup automática
-- ============================================================================
-- Si existe la función cleanup_stale_presence(), ejecutarla:
-- SELECT cleanup_stale_presence();

-- ============================================================================
-- RESULTADOS ESPERADOS
-- ============================================================================
-- ✅ Usuarios con actividad > 5 minutos marcados como offline
-- ✅ last_seen actualizado con el timestamp de last_activity
-- ✅ Sincronización entre User y UserProfile
-- ✅ Estado de presencia refleja la realidad
-- ============================================================================
