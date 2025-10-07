-- =====================================================
-- FIX: Permisos para función cleanup_stale_presence
-- =====================================================
-- Descripción: Otorga permisos necesarios para que la función
--              RPC pueda ser ejecutada por usuarios autenticados
-- Fecha: 2025
-- =====================================================

-- Otorgar permisos de ejecución a usuarios autenticados
GRANT EXECUTE ON FUNCTION cleanup_stale_presence TO authenticated;

-- Otorgar permisos de ejecución a service_role (para cron jobs)
GRANT EXECUTE ON FUNCTION cleanup_stale_presence TO service_role;

-- Verificar permisos
SELECT 
  routine_name,
  routine_type,
  security_type,
  grantee,
  privilege_type
FROM information_schema.routine_privileges
WHERE routine_name = 'cleanup_stale_presence';

-- =====================================================
-- NOTAS
-- =====================================================

/*
IMPORTANTE:
- authenticated: Permite que usuarios logueados ejecuten la función
- service_role: Permite que el cron job ejecute la función
- La función ya tiene SECURITY DEFINER, por lo que se ejecuta
  con los permisos del creador (postgres/owner)
*/
