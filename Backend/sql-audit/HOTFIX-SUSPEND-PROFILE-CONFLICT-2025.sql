-- ============================================================================
-- HOTFIX: Conflicto de función suspend_profile
-- Error: function name "public.suspend_profile" is not unique
-- Solución: Eliminar función existente y recrear con firma correcta
-- ============================================================================

-- PASO 1: Eliminar función existente (si existe)
-- ============================================================================
DROP FUNCTION IF EXISTS public.suspend_profile CASCADE;
DROP FUNCTION IF EXISTS public.suspend_profile(boolean) CASCADE;
DROP FUNCTION IF EXISTS public.suspend_profile(uuid, boolean) CASCADE;

RAISE NOTICE '✅ Funciones suspend_profile anteriores eliminadas';


-- PASO 2: Recrear función con firma correcta
-- ============================================================================
CREATE OR REPLACE FUNCTION public.suspend_profile(
  p_enable boolean DEFAULT true
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id text;
  v_new_status text;
  v_result jsonb;
BEGIN
  -- Obtener el user_id del usuario autenticado
  v_user_id := auth.uid()::text;
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'No authenticated user';
  END IF;
  
  -- Determinar nuevo status
  v_new_status := CASE WHEN p_enable THEN 'suspended' ELSE 'active' END;
  
  -- Actualizar status
  UPDATE public.user_profiles
  SET 
    status = v_new_status,
    updated_at = now()
  WHERE user_id = v_user_id
  RETURNING jsonb_build_object(
    'user_id', user_id,
    'status', status,
    'updated_at', updated_at
  ) INTO v_result;
  
  IF v_result IS NULL THEN
    RAISE EXCEPTION 'User profile not found';
  END IF;
  
  -- Log de auditoría
  INSERT INTO public.audit_log (
    user_id,
    action,
    details,
    created_at
  ) VALUES (
    v_user_id,
    CASE WHEN p_enable THEN 'account_suspended' ELSE 'account_reactivated' END,
    jsonb_build_object(
      'previous_status', CASE WHEN p_enable THEN 'active' ELSE 'suspended' END,
      'new_status', v_new_status
    ),
    now()
  );
  
  RETURN v_result;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Error suspending profile: %', SQLERRM;
END;
$$;

COMMENT ON FUNCTION public.suspend_profile IS 
'Suspende o reactiva la cuenta del usuario autenticado. p_enable=true suspende, p_enable=false reactiva.';


-- PASO 3: Otorgar permisos
-- ============================================================================
GRANT EXECUTE ON FUNCTION public.suspend_profile TO authenticated;


-- PASO 4: Verificación
-- ============================================================================
DO $$
DECLARE
  v_function_exists boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'suspend_profile'
    AND pronargs = 1  -- Solo 1 argumento
  ) INTO v_function_exists;
  
  IF v_function_exists THEN
    RAISE NOTICE '✅ Función suspend_profile recreada correctamente';
  ELSE
    RAISE WARNING '❌ Función suspend_profile NO fue creada';
  END IF;
END $$;


-- ============================================================================
-- INSTRUCCIONES DE USO
-- ============================================================================
/*
1. Ejecutar este script completo en Supabase Dashboard
2. Verificar que no hay errores
3. La función ahora acepta solo 1 parámetro: p_enable (boolean)
4. Uso desde TypeScript:
   
   await supabase.rpc('suspend_profile', { p_enable: true })  // Suspender
   await supabase.rpc('suspend_profile', { p_enable: false }) // Reactivar

5. Si aún hay conflictos, ejecutar manualmente:
   
   DROP FUNCTION IF EXISTS public.suspend_profile CASCADE;
   
   Y luego volver a ejecutar este script.
*/
