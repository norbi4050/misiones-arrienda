-- ============================================================================
-- HOTFIX CORREGIDO: Conflicto de función suspend_profile
-- Error: function name "public.suspend_profile" is not unique
-- Solución: Eliminar todas las versiones y recrear correctamente
-- ============================================================================

-- PASO 1: Eliminar TODAS las versiones de suspend_profile
-- ============================================================================
DO $$ 
DECLARE
  r RECORD;
BEGIN
  -- Buscar y eliminar todas las funciones con nombre suspend_profile
  FOR r IN 
    SELECT oid::regprocedure 
    FROM pg_proc 
    WHERE proname = 'suspend_profile' 
    AND pronamespace = 'public'::regnamespace
  LOOP
    EXECUTE 'DROP FUNCTION IF EXISTS ' || r.oid::regprocedure || ' CASCADE';
    RAISE NOTICE 'Eliminada función: %', r.oid::regprocedure;
  END LOOP;
  
  RAISE NOTICE '✅ Todas las versiones de suspend_profile eliminadas';
END $$;


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
GRANT EXECUTE ON FUNCTION public.suspend_profile(boolean) TO authenticated;


-- PASO 4: Verificación final
-- ============================================================================
DO $$
DECLARE
  v_function_count integer;
  v_function_signature text;
BEGIN
  -- Contar cuántas versiones de suspend_profile existen
  SELECT COUNT(*) INTO v_function_count
  FROM pg_proc 
  WHERE proname = 'suspend_profile'
  AND pronamespace = 'public'::regnamespace;
  
  IF v_function_count = 0 THEN
    RAISE WARNING '❌ NO se encontró la función suspend_profile';
  ELSIF v_function_count = 1 THEN
    -- Obtener la firma de la función
    SELECT oid::regprocedure::text INTO v_function_signature
    FROM pg_proc 
    WHERE proname = 'suspend_profile'
    AND pronamespace = 'public'::regnamespace;
    
    RAISE NOTICE '✅ Función suspend_profile creada correctamente';
    RAISE NOTICE '   Firma: %', v_function_signature;
  ELSE
    RAISE WARNING '⚠️ Existen % versiones de suspend_profile (debería ser 1)', v_function_count;
  END IF;
END $$;


-- ============================================================================
-- INSTRUCCIONES DE USO
-- ============================================================================
/*
EJECUTAR ESTE SCRIPT COMPLETO en Supabase Dashboard (SQL Editor)

Uso desde TypeScript:
  await supabase.rpc('suspend_profile', { p_enable: true })  // Suspender
  await supabase.rpc('suspend_profile', { p_enable: false }) // Reactivar

Si persisten errores, ejecutar manualmente en SQL Editor:
  
  SELECT oid::regprocedure 
  FROM pg_proc 
  WHERE proname = 'suspend_profile';
  
  -- Esto mostrará todas las versiones existentes
  -- Luego eliminar manualmente cada una con:
  -- DROP FUNCTION [nombre_completo_con_parametros] CASCADE;
*/
