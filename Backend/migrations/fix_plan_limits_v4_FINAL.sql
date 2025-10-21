-- Fix v4 FINAL: Corregir lógica de COALESCE
-- El problema era que COALESCE se aplicaba ANTES del SELECT INTO, no después

-- Eliminar funciones existentes
DROP FUNCTION IF EXISTS get_user_plan_limits(TEXT);
DROP FUNCTION IF EXISTS can_user_activate_property(TEXT);

-- Recrear get_user_plan_limits con lógica corregida
CREATE OR REPLACE FUNCTION get_user_plan_limits(user_uuid TEXT)
RETURNS TABLE (
  plan_tier VARCHAR,
  max_active_properties INTEGER,
  allow_attachments BOOLEAN,
  allow_featured BOOLEAN,
  allow_analytics BOOLEAN,
  allow_priority_support BOOLEAN,
  max_images_per_property INTEGER,
  plan_expires_at TIMESTAMPTZ,
  is_expired BOOLEAN,
  description TEXT,
  price_monthly DECIMAL
) AS $$
DECLARE
  user_plan_tier VARCHAR;
  user_plan_end_date TIMESTAMPTZ;
BEGIN
  -- Obtener el plan_tier y plan_end_date del usuario
  SELECT
    u.plan_tier,
    u.plan_end_date
  INTO
    user_plan_tier,
    user_plan_end_date
  FROM users u
  WHERE u.id = user_uuid;

  -- Si no se encuentra el usuario O plan_tier es NULL, usar 'free'
  IF NOT FOUND OR user_plan_tier IS NULL THEN
    user_plan_tier := 'free';
    user_plan_end_date := NULL;
  END IF;

  -- Retornar límites según el plan
  IF user_plan_tier = 'free' THEN
    RETURN QUERY SELECT
      'free'::VARCHAR,
      5::INTEGER,
      false::BOOLEAN,
      false::BOOLEAN,
      false::BOOLEAN,
      false::BOOLEAN,
      10::INTEGER,
      NULL::TIMESTAMPTZ,
      false::BOOLEAN,
      'Plan gratuito con funciones básicas'::TEXT,
      0::DECIMAL;

  ELSIF user_plan_tier IN ('professional', 'pro') THEN
    RETURN QUERY SELECT
      user_plan_tier::VARCHAR,
      20::INTEGER,
      true::BOOLEAN,
      true::BOOLEAN,
      true::BOOLEAN,
      true::BOOLEAN,
      30::INTEGER,
      user_plan_end_date::TIMESTAMPTZ,
      CASE
        WHEN user_plan_end_date IS NOT NULL AND user_plan_end_date < NOW() THEN true
        ELSE false
      END::BOOLEAN,
      'Plan profesional para inmobiliarias en crecimiento'::TEXT,
      27500::DECIMAL;

  ELSIF user_plan_tier IN ('premium', 'business') THEN
    RETURN QUERY SELECT
      user_plan_tier::VARCHAR,
      NULL::INTEGER,
      true::BOOLEAN,
      true::BOOLEAN,
      true::BOOLEAN,
      true::BOOLEAN,
      50::INTEGER,
      user_plan_end_date::TIMESTAMPTZ,
      CASE
        WHEN user_plan_end_date IS NOT NULL AND user_plan_end_date < NOW() THEN true
        ELSE false
      END::BOOLEAN,
      'Plan premium/business con propiedades ilimitadas'::TEXT,
      50000::DECIMAL;

  ELSE
    -- Cualquier otro valor, usar free como default
    RETURN QUERY SELECT
      'free'::VARCHAR,
      5::INTEGER,
      false::BOOLEAN,
      false::BOOLEAN,
      false::BOOLEAN,
      false::BOOLEAN,
      10::INTEGER,
      NULL::TIMESTAMPTZ,
      false::BOOLEAN,
      'Plan gratuito con funciones básicas'::TEXT,
      0::DECIMAL;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recrear can_user_activate_property
CREATE OR REPLACE FUNCTION can_user_activate_property(user_uuid TEXT)
RETURNS TABLE (
  allowed BOOLEAN,
  reason VARCHAR,
  plan_tier VARCHAR,
  current_count INTEGER,
  "limit" INTEGER
) AS $$
DECLARE
  user_plan_tier VARCHAR;
  max_props INTEGER;
  current_props INTEGER;
BEGIN
  -- Obtener plan del usuario
  SELECT u.plan_tier
  INTO user_plan_tier
  FROM users u
  WHERE u.id = user_uuid;

  -- Si no se encuentra O es NULL, asumir free
  IF NOT FOUND OR user_plan_tier IS NULL THEN
    user_plan_tier := 'free';
  END IF;

  -- Determinar límite según el plan
  IF user_plan_tier = 'free' THEN
    max_props := 5;
  ELSIF user_plan_tier IN ('professional', 'pro') THEN
    max_props := 20;
  ELSIF user_plan_tier IN ('premium', 'business') THEN
    max_props := NULL;
  ELSE
    max_props := 5;
  END IF;

  -- Contar propiedades activas
  SELECT COUNT(*)::INTEGER
  INTO current_props
  FROM properties
  WHERE user_id = user_uuid
    AND status IN ('AVAILABLE', 'PUBLISHED', 'RESERVED');

  -- Si es NULL, poner en 0
  IF current_props IS NULL THEN
    current_props := 0;
  END IF;

  -- Si es ilimitado
  IF max_props IS NULL THEN
    RETURN QUERY SELECT
      true::BOOLEAN,
      'unlimited'::VARCHAR,
      user_plan_tier::VARCHAR,
      current_props::INTEGER,
      NULL::INTEGER;
    RETURN;
  END IF;

  -- Verificar límite
  IF current_props < max_props THEN
    RETURN QUERY SELECT
      true::BOOLEAN,
      'within_limit'::VARCHAR,
      user_plan_tier::VARCHAR,
      current_props::INTEGER,
      max_props::INTEGER;
  ELSE
    RETURN QUERY SELECT
      false::BOOLEAN,
      'limit_reached'::VARCHAR,
      user_plan_tier::VARCHAR,
      current_props::INTEGER,
      max_props::INTEGER;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Dar permisos
GRANT EXECUTE ON FUNCTION get_user_plan_limits(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_plan_limits(TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION can_user_activate_property(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION can_user_activate_property(TEXT) TO service_role;

-- Comentarios
COMMENT ON FUNCTION get_user_plan_limits(TEXT) IS 'Retorna los límites del plan para un usuario. Soporta: free, professional, pro, premium, business';
COMMENT ON FUNCTION can_user_activate_property(TEXT) IS 'Verifica si un usuario puede activar más propiedades según su plan';

-- Verificación
SELECT 'Testing con user_id: a4ef1f3d-c3e8-46df-b186-5b5c837cc14b' as test;
SELECT * FROM get_user_plan_limits('a4ef1f3d-c3e8-46df-b186-5b5c837cc14b');
