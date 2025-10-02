-- =====================================================
-- B4 - ROLLBACK: LIMITACIÓN POR PLAN (VERSIÓN CORREGIDA)
-- Fecha: 2025-01-XX
-- Objetivo: Revertir cambios de sistema de planes
-- ADVERTENCIA: Esto eliminará datos de límites y logs
-- =====================================================

-- =====================================================
-- PASO 1: Eliminar triggers primero
-- =====================================================

DROP TRIGGER IF EXISTS trigger_update_user_plans_updated_at ON public.user_plans;
DROP TRIGGER IF EXISTS trigger_update_plan_limits_config_updated_at ON public.plan_limits_config;

-- =====================================================
-- PASO 2: Eliminar funciones con CASCADE
-- =====================================================

DROP FUNCTION IF EXISTS public.can_user_activate_property(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.count_user_active_properties(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.get_user_plan_limits(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.get_or_create_user_plan(UUID) CASCADE;
DROP FUNCTION IF EXISTS update_user_plans_updated_at() CASCADE;
DROP FUNCTION IF EXISTS update_plan_limits_config_updated_at() CASCADE;

-- =====================================================
-- PASO 3: Eliminar tablas
-- =====================================================

DROP TABLE IF EXISTS public.plan_limit_blocks CASCADE;
DROP TABLE IF EXISTS public.user_plans CASCADE;
DROP TABLE IF EXISTS public.plan_limits_config CASCADE;

-- =====================================================
-- PASO 4: Eliminar índice de properties
-- =====================================================

DROP INDEX IF EXISTS idx_properties_user_status_active;

-- =====================================================
-- VERIFICACIÓN FINAL
-- =====================================================

DO $$
BEGIN
  -- Verificar que las tablas fueron eliminadas
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_plans') THEN
    RAISE EXCEPTION 'Tabla user_plans no fue eliminada correctamente';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'plan_limits_config') THEN
    RAISE EXCEPTION 'Tabla plan_limits_config no fue eliminada correctamente';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'plan_limit_blocks') THEN
    RAISE EXCEPTION 'Tabla plan_limit_blocks no fue eliminada correctamente';
  END IF;
  
  RAISE NOTICE '✓ Rollback B4 completado exitosamente';
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
- Ejecutar nuevamente B4-PLAN-TIERS-MIGRATION-FIXED-2025.sql
- Reconfigurar planes manualmente si es necesario
*/
