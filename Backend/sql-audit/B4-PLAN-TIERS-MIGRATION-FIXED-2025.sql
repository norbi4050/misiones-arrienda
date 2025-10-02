-- =====================================================
-- B4 - LIMITACIÓN POR PLAN (FREEMIUM + GATING) - VERSIÓN CORREGIDA
-- Fecha: 2025-01-XX
-- Objetivo: Implementar sistema de planes con límites
-- NOTA: Usa tabla public.user_plans en lugar de auth.users
-- =====================================================

-- =====================================================
-- PASO 1: Crear tabla de planes de usuario (en public schema)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.user_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_tier TEXT NOT NULL DEFAULT 'free' CHECK (plan_tier IN ('free', 'pro', 'business')),
  plan_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Comentarios para documentación
COMMENT ON TABLE public.user_plans IS 'Planes de usuario para sistema freemium';
COMMENT ON COLUMN public.user_plans.plan_tier IS 'Tier del plan del usuario: free, pro, business';
COMMENT ON COLUMN public.user_plans.plan_expires_at IS 'Fecha de expiración del plan (null = sin expiración)';

-- Índices para user_plans
CREATE INDEX IF NOT EXISTS idx_user_plans_user_id ON public.user_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_user_plans_plan_tier ON public.user_plans(plan_tier);
CREATE INDEX IF NOT EXISTS idx_user_plans_expires ON public.user_plans(plan_expires_at) 
WHERE plan_expires_at IS NOT NULL;

-- =====================================================
-- PASO 2: Crear tabla de configuración de límites
-- =====================================================

CREATE TABLE IF NOT EXISTS public.plan_limits_config (
  plan_tier TEXT PRIMARY KEY CHECK (plan_tier IN ('free', 'pro', 'business')),
  max_active_properties INTEGER, -- NULL = ilimitado
  allow_attachments BOOLEAN NOT NULL DEFAULT false,
  allow_featured BOOLEAN NOT NULL DEFAULT false,
  allow_analytics BOOLEAN NOT NULL DEFAULT false,
  allow_priority_support BOOLEAN NOT NULL DEFAULT false,
  max_images_per_property INTEGER DEFAULT 10,
  description TEXT,
  price_monthly NUMERIC(10,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.plan_limits_config IS 'Configuración de límites y características por plan';

-- =====================================================
-- PASO 3: Insertar configuración de planes
-- =====================================================

INSERT INTO public.plan_limits_config (
  plan_tier,
  max_active_properties,
  allow_attachments,
  allow_featured,
  allow_analytics,
  allow_priority_support,
  max_images_per_property,
  description,
  price_monthly
) VALUES 
  (
    'free',
    10,
    false,
    false,
    false,
    false,
    5,
    'Plan gratuito con funcionalidades básicas. Ideal para comenzar.',
    0.00
  ),
  (
    'pro',
    100,
    true,
    true,
    true,
    false,
    15,
    'Plan profesional con características avanzadas. Perfecto para inmobiliarias pequeñas.',
    2999.00
  ),
  (
    'business',
    NULL, -- ilimitado
    true,
    true,
    true,
    true,
    30,
    'Plan empresarial sin límites. Para inmobiliarias grandes con alto volumen.',
    4999.00
  )
ON CONFLICT (plan_tier) DO UPDATE SET
  max_active_properties = EXCLUDED.max_active_properties,
  allow_attachments = EXCLUDED.allow_attachments,
  allow_featured = EXCLUDED.allow_featured,
  allow_analytics = EXCLUDED.allow_analytics,
  allow_priority_support = EXCLUDED.allow_priority_support,
  max_images_per_property = EXCLUDED.max_images_per_property,
  description = EXCLUDED.description,
  price_monthly = EXCLUDED.price_monthly,
  updated_at = NOW();

-- =====================================================
-- PASO 4: Crear índices para optimización
-- =====================================================

-- Índice compuesto para conteo rápido de propiedades activas
CREATE INDEX IF NOT EXISTS idx_properties_user_status_active 
ON public.properties(user_id, status) 
WHERE status IN ('AVAILABLE', 'PUBLISHED', 'RESERVED');

-- =====================================================
-- PASO 5: Funciones helper para límites
-- =====================================================

-- Función para obtener o crear plan de usuario (default FREE)
CREATE OR REPLACE FUNCTION public.get_or_create_user_plan(user_uuid UUID)
RETURNS TABLE (
  plan_tier TEXT,
  plan_expires_at TIMESTAMPTZ
) AS $$
BEGIN
  -- Intentar obtener plan existente
  RETURN QUERY
  SELECT up.plan_tier, up.plan_expires_at
  FROM public.user_plans up
  WHERE up.user_id = user_uuid;
  
  -- Si no existe, crear uno FREE
  IF NOT FOUND THEN
    INSERT INTO public.user_plans (user_id, plan_tier)
    VALUES (user_uuid, 'free')
    ON CONFLICT (user_id) DO NOTHING;
    
    RETURN QUERY
    SELECT 'free'::TEXT, NULL::TIMESTAMPTZ;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para obtener límites del plan de un usuario
CREATE OR REPLACE FUNCTION public.get_user_plan_limits(user_uuid UUID)
RETURNS TABLE (
  plan_tier TEXT,
  max_active_properties INTEGER,
  allow_attachments BOOLEAN,
  allow_featured BOOLEAN,
  allow_analytics BOOLEAN,
  allow_priority_support BOOLEAN,
  max_images_per_property INTEGER,
  plan_expires_at TIMESTAMPTZ,
  is_expired BOOLEAN
) AS $$
DECLARE
  user_plan RECORD;
BEGIN
  -- Obtener o crear plan del usuario
  SELECT * INTO user_plan FROM public.get_or_create_user_plan(user_uuid);
  
  -- Retornar límites combinados
  RETURN QUERY
  SELECT 
    COALESCE(user_plan.plan_tier, 'free')::TEXT,
    plc.max_active_properties,
    plc.allow_attachments,
    plc.allow_featured,
    plc.allow_analytics,
    plc.allow_priority_support,
    plc.max_images_per_property,
    user_plan.plan_expires_at,
    CASE 
      WHEN user_plan.plan_expires_at IS NULL THEN false
      WHEN user_plan.plan_expires_at < NOW() THEN true
      ELSE false
    END as is_expired
  FROM public.plan_limits_config plc
  WHERE plc.plan_tier = COALESCE(user_plan.plan_tier, 'free');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para contar propiedades activas de un usuario
CREATE OR REPLACE FUNCTION public.count_user_active_properties(user_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
  active_count INTEGER;
BEGIN
  SELECT COUNT(*)::INTEGER INTO active_count
  FROM public.properties
  WHERE user_id = user_uuid
    AND status IN ('AVAILABLE', 'PUBLISHED', 'RESERVED');
  
  RETURN COALESCE(active_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para verificar si usuario puede activar más propiedades
CREATE OR REPLACE FUNCTION public.can_user_activate_property(user_uuid UUID)
RETURNS JSONB AS $$
DECLARE
  user_plan RECORD;
  active_count INTEGER;
  result JSONB;
BEGIN
  -- Obtener límites del plan
  SELECT * INTO user_plan FROM public.get_user_plan_limits(user_uuid);
  
  -- Si el plan expiró, usar límites de FREE
  IF user_plan.is_expired THEN
    SELECT * INTO user_plan FROM public.get_user_plan_limits(user_uuid);
  END IF;
  
  -- Contar propiedades activas
  active_count := public.count_user_active_properties(user_uuid);
  
  -- Verificar límite
  IF user_plan.max_active_properties IS NULL THEN
    -- Plan ilimitado
    result := jsonb_build_object(
      'allowed', true,
      'reason', 'unlimited',
      'current_count', active_count,
      'limit', null,
      'plan_tier', user_plan.plan_tier
    );
  ELSIF active_count >= user_plan.max_active_properties THEN
    -- Límite alcanzado
    result := jsonb_build_object(
      'allowed', false,
      'reason', 'PLAN_LIMIT',
      'current_count', active_count,
      'limit', user_plan.max_active_properties,
      'plan_tier', user_plan.plan_tier
    );
  ELSE
    -- Puede activar
    result := jsonb_build_object(
      'allowed', true,
      'reason', 'within_limit',
      'current_count', active_count,
      'limit', user_plan.max_active_properties,
      'plan_tier', user_plan.plan_tier
    );
  END IF;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- PASO 6: Trigger para actualizar updated_at
-- =====================================================

CREATE OR REPLACE FUNCTION update_user_plans_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_user_plans_updated_at ON public.user_plans;
CREATE TRIGGER trigger_update_user_plans_updated_at
  BEFORE UPDATE ON public.user_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_user_plans_updated_at();

CREATE OR REPLACE FUNCTION update_plan_limits_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_plan_limits_config_updated_at ON public.plan_limits_config;
CREATE TRIGGER trigger_update_plan_limits_config_updated_at
  BEFORE UPDATE ON public.plan_limits_config
  FOR EACH ROW
  EXECUTE FUNCTION update_plan_limits_config_updated_at();

-- =====================================================
-- PASO 7: RLS (Row Level Security)
-- =====================================================

-- user_plans: usuarios solo ven su propio plan
ALTER TABLE public.user_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own plan" ON public.user_plans;
CREATE POLICY "Users can view own plan" 
ON public.user_plans FOR SELECT 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own plan" ON public.user_plans;
CREATE POLICY "Users can insert own plan" 
ON public.user_plans FOR INSERT 
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own plan" ON public.user_plans;
CREATE POLICY "Users can update own plan" 
ON public.user_plans FOR UPDATE 
USING (auth.uid() = user_id);

-- plan_limits_config: todos pueden leer
ALTER TABLE public.plan_limits_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view plan limits" ON public.plan_limits_config;
CREATE POLICY "Anyone can view plan limits" 
ON public.plan_limits_config FOR SELECT 
USING (true);

-- =====================================================
-- PASO 8: Tabla de logs de bloqueos (para telemetría)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.plan_limit_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_tier TEXT NOT NULL,
  action TEXT NOT NULL,
  feature TEXT NOT NULL,
  current_usage INTEGER,
  limit_value INTEGER,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para logs
CREATE INDEX IF NOT EXISTS idx_plan_limit_blocks_user_id ON public.plan_limit_blocks(user_id);
CREATE INDEX IF NOT EXISTS idx_plan_limit_blocks_created_at ON public.plan_limit_blocks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_plan_limit_blocks_action ON public.plan_limit_blocks(action);

-- RLS para logs
ALTER TABLE public.plan_limit_blocks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own blocks" ON public.plan_limit_blocks;
CREATE POLICY "Users can view own blocks" 
ON public.plan_limit_blocks FOR SELECT 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role can insert blocks" ON public.plan_limit_blocks;
CREATE POLICY "Service role can insert blocks" 
ON public.plan_limit_blocks FOR INSERT 
WITH CHECK (true);

-- =====================================================
-- PASO 9: Grants de permisos
-- =====================================================

GRANT EXECUTE ON FUNCTION public.get_or_create_user_plan(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_plan_limits(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.count_user_active_properties(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_user_activate_property(UUID) TO authenticated;

GRANT SELECT, INSERT, UPDATE ON public.user_plans TO authenticated;
GRANT SELECT ON public.plan_limits_config TO authenticated;
GRANT SELECT ON public.plan_limits_config TO anon;
GRANT SELECT ON public.plan_limit_blocks TO authenticated;

-- =====================================================
-- PASO 10: Crear planes FREE para usuarios existentes
-- =====================================================

-- Crear plan FREE para todos los usuarios que no tienen plan
INSERT INTO public.user_plans (user_id, plan_tier)
SELECT id, 'free'
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM public.user_plans)
ON CONFLICT (user_id) DO NOTHING;

-- =====================================================
-- VERIFICACIÓN FINAL
-- =====================================================

DO $$
DECLARE
  config_count INTEGER;
  users_count INTEGER;
  plans_count INTEGER;
BEGIN
  -- Verificar que la tabla user_plans existe
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_plans') THEN
    RAISE EXCEPTION 'Tabla user_plans no fue creada correctamente';
  END IF;
  
  -- Verificar que la tabla plan_limits_config existe
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'plan_limits_config') THEN
    RAISE EXCEPTION 'Tabla plan_limits_config no fue creada correctamente';
  END IF;
  
  -- Verificar que hay 3 planes configurados
  SELECT COUNT(*) INTO config_count FROM public.plan_limits_config;
  IF config_count != 3 THEN
    RAISE EXCEPTION 'No se configuraron los 3 planes correctamente (encontrados: %)', config_count;
  END IF;
  
  -- Verificar que se crearon planes para usuarios existentes
  SELECT COUNT(*) INTO users_count FROM auth.users;
  SELECT COUNT(*) INTO plans_count FROM public.user_plans;
  
  RAISE NOTICE '✓ Migración B4 completada exitosamente';
  RAISE NOTICE '✓ Planes configurados: %', config_count;
  RAISE NOTICE '✓ Usuarios totales: %', users_count;
  RAISE NOTICE '✓ Planes de usuario creados: %', plans_count;
END $$;

-- =====================================================
-- RESUMEN DE CAMBIOS
-- =====================================================

/*
TABLAS CREADAS:
- public.user_plans: Planes asignados a usuarios
- public.plan_limits_config: Configuración de límites por plan
- public.plan_limit_blocks: Logs de bloqueos por límites

FUNCIONES CREADAS:
- get_or_create_user_plan(UUID): Obtiene o crea plan del usuario
- get_user_plan_limits(UUID): Obtiene límites del plan de un usuario
- count_user_active_properties(UUID): Cuenta propiedades activas
- can_user_activate_property(UUID): Verifica si puede activar más propiedades

ÍNDICES CREADOS:
- idx_properties_user_status_active: Para conteo rápido
- idx_user_plans_*: Para búsquedas de planes
- idx_plan_limit_blocks_*: Para logs de bloqueos

PLANES CONFIGURADOS:
- FREE: 10 propiedades, sin adjuntos, sin destacados
- PRO: 100 propiedades, con adjuntos, con destacados
- BUSINESS: Ilimitado, todas las características

DATOS INICIALES:
- Todos los usuarios existentes tienen plan FREE asignado
*/
