-- =====================================================
-- B4 - ROLLBACK: LIMITACIÓN POR PLAN
-- Fecha: 2025-01-XX
-- Objetivo: Revertir cambios de sistema de planes
-- ADVERTENCIA: Esto eliminará datos de límites y logs
-- =====================================================

-- =====================================================
-- PASO 1: Eliminar funciones
-- =====================================================

DROP FUNCTION IF EXISTS public.can_user_activate_property(UUID);
DROP FUNCTION IF EXISTS public.count_user_active_properties(UUID);
DROP FUNCTION IF EXISTS public.get_user_plan_limits(UUID);
DROP FUNCTION IF EXISTS update_plan_limits_config_updated_at();

-- =====================================================
-- PASO 2: Eliminar tablas
-- =====================================================

DROP TABLE IF EXISTS public.plan_limit_blocks CASCADE;
DROP TABLE IF EXISTS public.plan_limits_config CASCADE;

-- =====================================================
-- PASO 3: Eliminar índices de users
-- =====================================================

DROP INDEX IF EXISTS idx_users_plan_tier;
DROP INDEX IF EXISTS idx_users_plan_expires;

-- =====================================================
-- PASO 4: Eliminar índice de properties
-- =====================================================

DROP INDEX IF EXISTS idx_properties_user_status_active;

-- =====================================================
-- PASO 5: Eliminar campos de auth.users
-- =====================================================

ALTER TABLE auth.users DROP COLUMN IF EXISTS plan_tier;
ALTER TABLE auth.users DROP COLUMN IF EXISTS plan_expires_at;

-- =====================================================
-- VERIFICACIÓN FINAL
-- =====================================================

DO $$
BEGIN
  -- Verificar que las tablas fueron eliminadas
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'plan_limits_config') THEN
    RAISE EXCEPTION 'Tabla plan_limits_config no fue eliminada correctamente';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'plan_limit_blocks') THEN
    RAISE EXCEPTION 'Tabla plan_limit_blocks no fue eliminada correctamente';
  END IF;
  
  -- Verificar que los campos fueron eliminados
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' 
    AND column_name = 'plan_tier'
  ) THEN
    RAISE EXCEPTION 'Campo plan_tier no fue eliminado correctamente';
  END IF;
  
  RAISE NOTICE 'Rollback B4 completado exitosamente';
END $$;

-- =====================================================
-- NOTAS
-- =====================================================

/*
ADVERTENCIAS:
- Este rollback eliminará TODOS los datos de configuración de planes
- Se perderán TODOS los logs de bloqueos históricos
- Los usuarios volverán a no tener plan asignado
- Ejecutar solo si es absolutamente necesario

DATOS PERDIDOS:
- Configuración de límites por plan
- Historial de bloqueos por límites
- Asignaciones de plan a usuarios
- Fechas de expiración de planes

PARA RESTAURAR:
- Ejecutar nuevamente B4-PLAN-TIERS-MIGRATION-2025.sql
- Reconfigurar planes manualmente si es necesario
*/
