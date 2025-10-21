-- Debug: Probar si la función puede encontrar el usuario

-- Test 1: Verificar que el usuario existe
SELECT
  id,
  plan_tier,
  COALESCE(plan_tier, 'free') as coalesced_plan
FROM users
WHERE id = 'a4ef1f3d-c3e8-46df-b186-5b5c837cc14b';

-- Test 2: Probar la función con RAISE NOTICE para debug
CREATE OR REPLACE FUNCTION get_user_plan_limits_debug(user_uuid TEXT)
RETURNS TABLE (
  plan_tier VARCHAR,
  max_active_properties INTEGER,
  debug_user_id TEXT,
  debug_plan_found VARCHAR
) AS $$
DECLARE
  user_plan_tier VARCHAR;
  user_id_found TEXT;
BEGIN
  RAISE NOTICE 'Buscando usuario con ID: %', user_uuid;

  -- Intentar obtener el plan del usuario
  SELECT
    u.id,
    COALESCE(u.plan_tier, 'free')
  INTO
    user_id_found,
    user_plan_tier
  FROM users u
  WHERE u.id = user_uuid;

  RAISE NOTICE 'Usuario encontrado: %, Plan: %', user_id_found, user_plan_tier;

  -- Si no se encuentra
  IF NOT FOUND THEN
    RAISE NOTICE 'Usuario NO encontrado, usando defaults';
    user_plan_tier := 'free';
    user_id_found := 'NOT_FOUND';
  END IF;

  -- Retornar resultado simple
  IF user_plan_tier IN ('professional', 'pro') THEN
    RETURN QUERY SELECT
      user_plan_tier::VARCHAR,
      20::INTEGER,
      user_id_found::TEXT,
      'PROFESSIONAL'::VARCHAR;
  ELSE
    RETURN QUERY SELECT
      user_plan_tier::VARCHAR,
      5::INTEGER,
      user_id_found::TEXT,
      'FREE_OR_OTHER'::VARCHAR;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Test 3: Ejecutar la función de debug
SELECT * FROM get_user_plan_limits_debug('a4ef1f3d-c3e8-46df-b186-5b5c837cc14b');

-- IMPORTANTE: Después de ver el resultado, eliminar la función de debug
-- DROP FUNCTION IF EXISTS get_user_plan_limits_debug(TEXT);
