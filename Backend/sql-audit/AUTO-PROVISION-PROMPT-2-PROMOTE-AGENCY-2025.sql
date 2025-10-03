-- ============================================================================
-- PROMPT 2: Elevación a inmobiliaria post-onboarding
-- ============================================================================
-- Fecha: 2025-01-XX
-- Propósito: Función para actualizar el rol del perfil cuando el usuario
--            termina el onboarding de inmobiliaria
-- 
-- FUNCIONALIDAD:
-- 1. Validar que existe UserProfile para user_id
-- 2. Actualizar role a OFREZCO (rol de inmobiliaria)
-- 3. No modificar city, budgetMin, budgetMax
-- 4. Actualizar updatedAt
-- 5. Idempotente: si ya está en OFREZCO, no hacer nada
-- ============================================================================

BEGIN;

-- ============================================================================
-- PASO 1: Crear función SECURITY DEFINER para promover a inmobiliaria
-- ============================================================================

CREATE OR REPLACE FUNCTION public.promote_user_to_agency(p_user_id text)
RETURNS TABLE (
  success boolean,
  message text,
  user_id text,
  old_role text,
  new_role text,
  updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
DECLARE
  v_profile_exists boolean;
  v_current_role text;
  v_updated_at timestamptz;
BEGIN
  -- ============================================================================
  -- PASO 1: Validar que existe UserProfile para user_id
  -- ============================================================================
  SELECT EXISTS (
    SELECT 1 
    FROM public."UserProfile" 
    WHERE "userId" = p_user_id
  ) INTO v_profile_exists;
  
  IF NOT v_profile_exists THEN
    RETURN QUERY SELECT 
      false AS success,
      'UserProfile no encontrado para el usuario especificado' AS message,
      p_user_id AS user_id,
      NULL::text AS old_role,
      NULL::text AS new_role,
      NULL::timestamptz AS updated_at;
    RETURN;
  END IF;
  
  -- ============================================================================
  -- PASO 2: Obtener el rol actual
  -- ============================================================================
  SELECT role INTO v_current_role
  FROM public."UserProfile"
  WHERE "userId" = p_user_id;
  
  -- ============================================================================
  -- PASO 3: Verificar si ya está en OFREZCO (idempotente)
  -- ============================================================================
  IF v_current_role = 'OFREZCO' THEN
    RETURN QUERY SELECT 
      true AS success,
      'El usuario ya tiene el rol OFREZCO (inmobiliaria)' AS message,
      p_user_id AS user_id,
      v_current_role AS old_role,
      v_current_role AS new_role,
      (SELECT "updatedAt" FROM public."UserProfile" WHERE "userId" = p_user_id) AS updated_at;
    RETURN;
  END IF;
  
  -- ============================================================================
  -- PASO 4: Actualizar role a OFREZCO y updatedAt
  -- ============================================================================
  UPDATE public."UserProfile"
  SET 
    role = 'OFREZCO',
    "updatedAt" = NOW()
  WHERE "userId" = p_user_id
  RETURNING "updatedAt" INTO v_updated_at;
  
  -- ============================================================================
  -- PASO 5: Retornar resultado exitoso
  -- ============================================================================
  RETURN QUERY SELECT 
    true AS success,
    'Usuario promovido exitosamente a inmobiliaria (OFREZCO)' AS message,
    p_user_id AS user_id,
    v_current_role AS old_role,
    'OFREZCO'::text AS new_role,
    v_updated_at AS updated_at;
  
END;
$$;

-- ============================================================================
-- PASO 2: Agregar comentario a la función
-- ============================================================================

COMMENT ON FUNCTION public.promote_user_to_agency(text) IS 
'Promueve un usuario a rol de inmobiliaria (OFREZCO) después del onboarding.
- Valida existencia de UserProfile
- Actualiza solo role y updatedAt
- No modifica city, budgetMin, budgetMax
- Es idempotente: si ya está en OFREZCO, no hace nada
- Retorna información detallada del cambio';

COMMIT;

-- ============================================================================
-- VERIFICACIÓN: Consultas para verificar la implementación
-- ============================================================================

-- Verificar que la función existe
SELECT 
  p.proname as function_name,
  pg_get_function_arguments(p.oid) as arguments,
  pg_get_function_result(p.oid) as return_type
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
  AND p.proname = 'promote_user_to_agency';

-- ============================================================================
-- EJEMPLO DE USO:
-- ============================================================================

-- Promover un usuario específico a inmobiliaria
-- SELECT * FROM public.promote_user_to_agency('user-id-aqui');

-- Ejemplo de resultado esperado:
-- | success | message                                              | user_id      | old_role | new_role | updated_at                |
-- |---------|------------------------------------------------------|--------------|----------|----------|---------------------------|
-- | true    | Usuario promovido exitosamente a inmobiliaria (OFREZCO) | clxxx...     | BUSCO    | OFREZCO  | 2025-01-15 10:30:45+00    |

-- ============================================================================
-- PRUEBA DE IDEMPOTENCIA:
-- ============================================================================

-- Primera ejecución: cambia de BUSCO a OFREZCO
-- SELECT * FROM public.promote_user_to_agency('user-id-aqui');

-- Segunda ejecución: no hace cambios, retorna mensaje informativo
-- SELECT * FROM public.promote_user_to_agency('user-id-aqui');
-- | success | message                                    | user_id  | old_role | new_role | updated_at                |
-- |---------|-------------------------------------------|----------|----------|----------|---------------------------|
-- | true    | El usuario ya tiene el rol OFREZCO (inmobiliaria) | clxxx... | OFREZCO  | OFREZCO  | 2025-01-15 10:30:45+00    |

-- ============================================================================
-- VERIFICACIÓN FINAL: Consultar el perfil actualizado
-- ============================================================================

-- Verificar el perfil de un usuario específico después de la promoción
-- SELECT 
--   "userId",
--   role,
--   city,
--   "budgetMin",
--   "budgetMax",
--   "createdAt",
--   "updatedAt"
-- FROM public."UserProfile"
-- WHERE "userId" = 'user-id-aqui';

-- ============================================================================
-- RESULTADO ESPERADO:
-- ============================================================================
-- ✅ Función public.promote_user_to_agency(text) creada con SECURITY DEFINER
-- ✅ Valida existencia de UserProfile antes de actualizar
-- ✅ Actualiza solo role a OFREZCO y updatedAt
-- ✅ No modifica city, budgetMin, budgetMax
-- ✅ Es idempotente: múltiples ejecuciones no causan errores
-- ✅ Retorna información detallada del cambio realizado
-- ============================================================================

-- ============================================================================
-- INTEGRACIÓN CON API:
-- ============================================================================
-- Esta función puede ser llamada desde tu API de Next.js después de que
-- el usuario complete el onboarding de inmobiliaria:
--
-- // En tu API route (e.g., /api/account/upgrade-to-agency/route.ts)
-- const { data, error } = await supabase.rpc('promote_user_to_agency', {
--   p_user_id: userId
-- });
--
-- if (data && data[0].success) {
--   console.log('Usuario promovido:', data[0]);
-- }
-- ============================================================================
