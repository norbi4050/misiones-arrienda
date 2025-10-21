-- Migration: Actualizar función get_user_plan_limits para soportar plan 'professional'
-- Date: 2025-10-21
-- Description: Agregar soporte para el plan 'professional' en los límites de planes

-- Primero, eliminar la función existente si existe
DROP FUNCTION IF EXISTS get_user_plan_limits(UUID);

-- Crear la función actualizada con soporte para 'professional'
CREATE OR REPLACE FUNCTION get_user_plan_limits(user_uuid UUID)
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
    COALESCE(u.plan_tier, 'free'),
    u.plan_end_date
  INTO
    user_plan_tier,
    user_plan_end_date
  FROM users u
  WHERE u.id = user_uuid;

  -- Si no se encuentra el usuario, retornar plan free
  IF NOT FOUND THEN
    user_plan_tier := 'free';
    user_plan_end_date := NULL;
  END IF;

  -- Retornar límites según el plan
  CASE user_plan_tier
    WHEN 'free' THEN
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

    WHEN 'professional' THEN
      RETURN QUERY SELECT
        'professional'::VARCHAR,
        20::INTEGER,
        true::BOOLEAN,
        true::BOOLEAN,
        true::BOOLEAN,
        true::BOOLEAN,
        30::INTEGER,
        user_plan_end_date,
        CASE
          WHEN user_plan_end_date IS NOT NULL AND user_plan_end_date < NOW() THEN true
          ELSE false
        END::BOOLEAN,
        'Plan profesional para inmobiliarias en crecimiento'::TEXT,
        27500::DECIMAL;

    WHEN 'pro' THEN
      RETURN QUERY SELECT
        'pro'::VARCHAR,
        20::INTEGER,
        true::BOOLEAN,
        true::BOOLEAN,
        true::BOOLEAN,
        true::BOOLEAN,
        30::INTEGER,
        user_plan_end_date,
        CASE
          WHEN user_plan_end_date IS NOT NULL AND user_plan_end_date < NOW() THEN true
          ELSE false
        END::BOOLEAN,
        'Plan profesional para inmobiliarias en crecimiento'::TEXT,
        27500::DECIMAL;

    WHEN 'premium' THEN
      RETURN QUERY SELECT
        'premium'::VARCHAR,
        NULL::INTEGER, -- Ilimitado
        true::BOOLEAN,
        true::BOOLEAN,
        true::BOOLEAN,
        true::BOOLEAN,
        50::INTEGER,
        user_plan_end_date,
        CASE
          WHEN user_plan_end_date IS NOT NULL AND user_plan_end_date < NOW() THEN true
          ELSE false
        END::BOOLEAN,
        'Plan premium con propiedades ilimitadas'::TEXT,
        50000::DECIMAL;

    WHEN 'business' THEN
      RETURN QUERY SELECT
        'business'::VARCHAR,
        NULL::INTEGER, -- Ilimitado
        true::BOOLEAN,
        true::BOOLEAN,
        true::BOOLEAN,
        true::BOOLEAN,
        50::INTEGER,
        user_plan_end_date,
        CASE
          WHEN user_plan_end_date IS NOT NULL AND user_plan_end_date < NOW() THEN true
          ELSE false
        END::BOOLEAN,
        'Plan business con propiedades ilimitadas'::TEXT,
        50000::DECIMAL;

    ELSE
      -- Default: free
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
  END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Dar permisos de ejecución
GRANT EXECUTE ON FUNCTION get_user_plan_limits(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_plan_limits(UUID) TO service_role;

-- Comentario
COMMENT ON FUNCTION get_user_plan_limits(UUID) IS 'Retorna los límites del plan para un usuario. Soporta: free, professional, pro, premium, business';

-- =====================================================
-- Actualizar función can_user_activate_property
-- =====================================================

-- Eliminar función existente
DROP FUNCTION IF EXISTS can_user_activate_property(UUID);

-- Crear función actualizada
CREATE OR REPLACE FUNCTION can_user_activate_property(user_uuid UUID)
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
  SELECT COALESCE(u.plan_tier, 'free')
  INTO user_plan_tier
  FROM users u
  WHERE u.id = user_uuid;

  -- Si no se encuentra, asumir free
  IF NOT FOUND THEN
    user_plan_tier := 'free';
  END IF;

  -- Determinar límite según el plan
  IF user_plan_tier = 'free' THEN
    max_props := 5;
  ELSIF user_plan_tier IN ('professional', 'pro') THEN
    max_props := 20;
  ELSIF user_plan_tier IN ('premium', 'business') THEN
    max_props := NULL; -- Ilimitado
  ELSE
    max_props := 5; -- Default: free
  END IF;

  -- Contar propiedades activas del usuario
  SELECT COUNT(*)
  INTO current_props
  FROM properties
  WHERE user_id = user_uuid
    AND status IN ('AVAILABLE', 'PUBLISHED', 'RESERVED');

  -- Si es ilimitado, siempre permitir
  IF max_props IS NULL THEN
    RETURN QUERY SELECT
      true::BOOLEAN,
      'unlimited'::VARCHAR,
      user_plan_tier::VARCHAR,
      current_props::INTEGER,
      NULL::INTEGER;
    RETURN;
  END IF;

  -- Verificar si puede activar más propiedades
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
GRANT EXECUTE ON FUNCTION can_user_activate_property(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION can_user_activate_property(UUID) TO service_role;

-- Comentario
COMMENT ON FUNCTION can_user_activate_property(UUID) IS 'Verifica si un usuario puede activar más propiedades según su plan';
