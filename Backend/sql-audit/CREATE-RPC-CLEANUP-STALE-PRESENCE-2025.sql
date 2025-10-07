-- =====================================================
-- FUNCIÓN RPC: Limpieza de Presencia Stale
-- =====================================================
-- Descripción: Marca como offline a usuarios que no han tenido
--              actividad reciente (más de 5 minutos)
-- Fecha: 2025
-- Autor: Sistema de Presencia
-- =====================================================

-- Eliminar función si existe (para re-crear)
DROP FUNCTION IF EXISTS cleanup_stale_presence();

-- Crear función para limpiar presencia stale
CREATE OR REPLACE FUNCTION cleanup_stale_presence(
  threshold_minutes INTEGER DEFAULT 5
)
RETURNS TABLE (
  users_marked_offline INTEGER,
  execution_time TIMESTAMP WITH TIME ZONE
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_users_count INTEGER := 0;
  v_threshold TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Calcular timestamp threshold
  v_threshold := NOW() - (threshold_minutes || ' minutes')::INTERVAL;
  
  -- Log inicio
  RAISE NOTICE 'cleanup_stale_presence: Iniciando limpieza con threshold de % minutos', threshold_minutes;
  RAISE NOTICE 'cleanup_stale_presence: Threshold timestamp: %', v_threshold;
  
  -- Actualizar tabla User
  -- Marcar como offline usuarios con last_activity anterior al threshold
  UPDATE "User"
  SET 
    is_online = false,
    last_seen = last_activity
  WHERE 
    is_online = true 
    AND last_activity < v_threshold;
  
  -- Obtener cantidad de usuarios actualizados en User
  GET DIAGNOSTICS v_users_count = ROW_COUNT;
  
  RAISE NOTICE 'cleanup_stale_presence: % usuarios marcados offline en tabla User', v_users_count;
  
  -- Actualizar tabla UserProfile (sincronización)
  -- Marcar como offline usuarios con last_activity anterior al threshold
  UPDATE "UserProfile" up
  SET 
    is_online = false,
    last_seen = up.last_activity
  WHERE 
    up.is_online = true 
    AND up.last_activity < v_threshold;
  
  RAISE NOTICE 'cleanup_stale_presence: Tabla UserProfile sincronizada';
  
  -- Retornar resultado
  RETURN QUERY
  SELECT 
    v_users_count,
    NOW();
    
  RAISE NOTICE 'cleanup_stale_presence: Limpieza completada exitosamente';
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'cleanup_stale_presence: Error durante limpieza: %', SQLERRM;
    -- Re-lanzar el error
    RAISE;
END;
$$;

-- =====================================================
-- COMENTARIOS Y DOCUMENTACIÓN
-- =====================================================

COMMENT ON FUNCTION cleanup_stale_presence IS 
'Marca como offline a usuarios que no han tenido actividad reciente.
Threshold por defecto: 5 minutos.
Actualiza ambas tablas: User y UserProfile.
Retorna cantidad de usuarios marcados offline y timestamp de ejecución.';

-- =====================================================
-- PERMISOS
-- =====================================================

-- Revocar permisos públicos
REVOKE ALL ON FUNCTION cleanup_stale_presence FROM PUBLIC;

-- Otorgar permisos solo a roles específicos
-- GRANT EXECUTE ON FUNCTION cleanup_stale_presence TO service_role;
-- GRANT EXECUTE ON FUNCTION cleanup_stale_presence TO authenticated; -- Solo si es necesario

-- =====================================================
-- TESTING
-- =====================================================

-- Test 1: Ejecutar limpieza con threshold por defecto (5 minutos)
-- SELECT * FROM cleanup_stale_presence();

-- Test 2: Ejecutar limpieza con threshold personalizado (10 minutos)
-- SELECT * FROM cleanup_stale_presence(10);

-- Test 3: Verificar usuarios marcados offline
-- SELECT id, email, is_online, last_seen, last_activity
-- FROM "User"
-- WHERE is_online = false
-- ORDER BY last_activity DESC
-- LIMIT 10;

-- =====================================================
-- NOTAS DE IMPLEMENTACIÓN
-- =====================================================

/*
IMPORTANTE:
1. Esta función debe ser ejecutada periódicamente (cada 5-10 minutos)
2. Puede ser llamada desde:
   - Cron job en Vercel
   - Endpoint API protegido
   - Supabase Edge Function
   
3. Threshold recomendado: 5 minutos
   - Muy bajo (< 3 min): Puede marcar usuarios activos como offline
   - Muy alto (> 10 min): Usuarios aparecerán online cuando ya no lo están
   
4. Performance:
   - Usa índice en (is_online, last_activity)
   - Actualización eficiente con WHERE clause
   
5. Sincronización:
   - Actualiza User Y UserProfile
   - Mantiene consistencia entre tablas
*/

-- =====================================================
-- ROLLBACK (si es necesario)
-- =====================================================

-- Para eliminar la función:
-- DROP FUNCTION IF EXISTS cleanup_stale_presence();
