-- ============================================
-- SISTEMA DE AUTO-EXPIRACIÓN DE PLANES
-- ============================================
-- Este archivo implementa:
-- 1. Función para expirar planes automáticamente
-- 2. Función para desactivar propiedades que excedan límites
-- 3. Función para reactivar propiedades al mejorar plan
-- ============================================

-- ============================================
-- 1. FUNCIÓN: Expirar plan y downgrade a FREE
-- ============================================
CREATE OR REPLACE FUNCTION expire_user_plan(user_uuid UUID)
RETURNS TABLE (
  success BOOLEAN,
  old_plan VARCHAR,
  new_plan VARCHAR,
  properties_deactivated INTEGER,
  message TEXT
) AS $$
DECLARE
  v_old_plan VARCHAR;
  v_plan_end_date TIMESTAMPTZ;
  v_is_expired BOOLEAN;
  v_max_properties INTEGER;
  v_properties_deactivated INTEGER := 0;
  v_is_founder BOOLEAN;
BEGIN
  -- Obtener datos del usuario
  SELECT
    COALESCE(plan_tier, 'free'),
    plan_end_date,
    COALESCE(is_founder, false)
  INTO
    v_old_plan,
    v_plan_end_date,
    v_is_founder
  FROM users
  WHERE id = user_uuid;

  -- Si no existe el usuario
  IF NOT FOUND THEN
    RETURN QUERY SELECT
      false,
      NULL::VARCHAR,
      NULL::VARCHAR,
      0,
      'Usuario no encontrado'::TEXT;
    RETURN;
  END IF;

  -- Verificar si el plan está expirado
  v_is_expired := (v_plan_end_date IS NOT NULL AND v_plan_end_date < NOW());

  -- Si no está expirado, no hacer nada
  IF NOT v_is_expired THEN
    RETURN QUERY SELECT
      true,
      v_old_plan,
      v_old_plan,
      0,
      'Plan aún vigente'::TEXT;
    RETURN;
  END IF;

  -- Si ya está en plan free, no hacer nada
  IF v_old_plan = 'free' THEN
    RETURN QUERY SELECT
      true,
      'free'::VARCHAR,
      'free'::VARCHAR,
      0,
      'Ya está en plan free'::TEXT;
    RETURN;
  END IF;

  -- DOWNGRADE a plan FREE
  UPDATE users
  SET
    plan_tier = 'free',
    plan_end_date = NULL
  WHERE id = user_uuid;

  -- Obtener límite de propiedades del plan FREE (5)
  v_max_properties := 5;

  -- Desactivar propiedades que excedan el límite
  -- Mantener activas las más recientes
  WITH ranked_properties AS (
    SELECT
      id,
      ROW_NUMBER() OVER (ORDER BY created_at DESC, id DESC) as rn
    FROM properties
    WHERE user_id = user_uuid
      AND is_active = true
  )
  UPDATE properties
  SET
    is_active = false,
    deactivated_reason = 'plan_downgrade',
    deactivated_at = NOW()
  WHERE id IN (
    SELECT id
    FROM ranked_properties
    WHERE rn > v_max_properties
  );

  GET DIAGNOSTICS v_properties_deactivated = ROW_COUNT;

  -- Retornar resultado
  RETURN QUERY SELECT
    true,
    v_old_plan,
    'free'::VARCHAR,
    v_properties_deactivated,
    format('Plan expirado: %s → free. %s propiedades desactivadas.',
           v_old_plan,
           v_properties_deactivated)::TEXT;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 2. FUNCIÓN: Desactivar propiedades que excedan límite
-- ============================================
CREATE OR REPLACE FUNCTION deactivate_excess_properties(user_uuid UUID, max_allowed INTEGER)
RETURNS INTEGER AS $$
DECLARE
  v_deactivated INTEGER := 0;
BEGIN
  -- Desactivar propiedades que excedan el límite
  -- Mantener activas las más recientes
  WITH ranked_properties AS (
    SELECT
      id,
      ROW_NUMBER() OVER (ORDER BY created_at DESC, id DESC) as rn
    FROM properties
    WHERE user_id = user_uuid
      AND is_active = true
  )
  UPDATE properties
  SET
    is_active = false,
    deactivated_reason = 'plan_limit_exceeded',
    deactivated_at = NOW()
  WHERE id IN (
    SELECT id
    FROM ranked_properties
    WHERE rn > max_allowed
  );

  GET DIAGNOSTICS v_deactivated = ROW_COUNT;

  RETURN v_deactivated;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 3. FUNCIÓN: Reactivar propiedades al mejorar plan
-- ============================================
CREATE OR REPLACE FUNCTION reactivate_properties_on_upgrade(user_uuid UUID, new_max_properties INTEGER)
RETURNS INTEGER AS $$
DECLARE
  v_reactivated INTEGER := 0;
  v_current_active INTEGER := 0;
  v_can_reactivate INTEGER := 0;
BEGIN
  -- Contar propiedades actualmente activas
  SELECT COUNT(*)
  INTO v_current_active
  FROM properties
  WHERE user_id = user_uuid
    AND is_active = true;

  -- Calcular cuántas podemos reactivar
  v_can_reactivate := GREATEST(0, new_max_properties - v_current_active);

  -- Si no hay espacio, no reactivar nada
  IF v_can_reactivate <= 0 THEN
    RETURN 0;
  END IF;

  -- Reactivar propiedades desactivadas por plan
  -- Priorizar las más recientes
  WITH ranked_inactive AS (
    SELECT
      id,
      ROW_NUMBER() OVER (ORDER BY created_at DESC, id DESC) as rn
    FROM properties
    WHERE user_id = user_uuid
      AND is_active = false
      AND deactivated_reason IN ('plan_downgrade', 'plan_limit_exceeded')
  )
  UPDATE properties
  SET
    is_active = true,
    deactivated_reason = NULL,
    deactivated_at = NULL
  WHERE id IN (
    SELECT id
    FROM ranked_inactive
    WHERE rn <= v_can_reactivate
  );

  GET DIAGNOSTICS v_reactivated = ROW_COUNT;

  RETURN v_reactivated;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 4. FUNCIÓN: Verificar y expirar múltiples planes
-- ============================================
-- Esta función se puede llamar desde un cron job
CREATE OR REPLACE FUNCTION expire_all_expired_plans()
RETURNS TABLE (
  user_id UUID,
  old_plan VARCHAR,
  new_plan VARCHAR,
  properties_deactivated INTEGER,
  expired_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    u.id,
    (expire_user_plan(u.id)).old_plan,
    (expire_user_plan(u.id)).new_plan,
    (expire_user_plan(u.id)).properties_deactivated,
    NOW()
  FROM users u
  WHERE u.plan_end_date IS NOT NULL
    AND u.plan_end_date < NOW()
    AND u.plan_tier != 'free';
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 5. AÑADIR COLUMNAS A LA TABLA PROPERTIES
-- ============================================
-- Agregar columnas para tracking de desactivación
DO $$
BEGIN
  -- Agregar columna deactivated_reason si no existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'properties'
    AND column_name = 'deactivated_reason'
  ) THEN
    ALTER TABLE properties
    ADD COLUMN deactivated_reason VARCHAR(50);
  END IF;

  -- Agregar columna deactivated_at si no existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'properties'
    AND column_name = 'deactivated_at'
  ) THEN
    ALTER TABLE properties
    ADD COLUMN deactivated_at TIMESTAMPTZ;
  END IF;
END $$;

-- ============================================
-- 6. CREAR ÍNDICES PARA PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_properties_user_active
  ON properties(user_id, is_active);

CREATE INDEX IF NOT EXISTS idx_properties_deactivated_reason
  ON properties(deactivated_reason)
  WHERE deactivated_reason IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_users_plan_expiration
  ON users(plan_end_date)
  WHERE plan_end_date IS NOT NULL;

-- ============================================
-- COMENTARIOS
-- ============================================
COMMENT ON FUNCTION expire_user_plan IS 'Expira el plan de un usuario y desactiva propiedades que excedan el límite del plan free';
COMMENT ON FUNCTION deactivate_excess_properties IS 'Desactiva propiedades que excedan el límite del plan actual';
COMMENT ON FUNCTION reactivate_properties_on_upgrade IS 'Reactiva propiedades al mejorar de plan';
COMMENT ON FUNCTION expire_all_expired_plans IS 'Expira todos los planes vencidos (para cron job)';
