-- ============================================================================
-- PROMPT 1: ACCOUNT MANAGEMENT (Suspender/Eliminar Cuenta)
-- Fecha: Enero 2025
-- Descripción: SQL para gestión de estado de cuentas (suspender/eliminar)
-- ============================================================================

-- PASO 1: Agregar columna 'status' a user_profiles
-- ============================================================================
DO $$ 
BEGIN
  -- Verificar si la columna ya existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'user_profiles' 
    AND column_name = 'status'
  ) THEN
    -- Agregar columna con valor por defecto
    ALTER TABLE public.user_profiles 
    ADD COLUMN status text DEFAULT 'active' 
    CHECK (status IN ('active', 'suspended', 'deleted'));
    
    RAISE NOTICE '✅ Columna status agregada a user_profiles';
  ELSE
    RAISE NOTICE '⚠️ Columna status ya existe en user_profiles';
  END IF;
END $$;

-- Actualizar registros existentes que no tengan status
UPDATE public.user_profiles 
SET status = 'active' 
WHERE status IS NULL;

-- Crear índice para mejorar performance en queries por status
CREATE INDEX IF NOT EXISTS idx_user_profiles_status 
ON public.user_profiles(status);

COMMENT ON COLUMN public.user_profiles.status IS 
'Estado de la cuenta: active (activa), suspended (suspendida), deleted (eliminada soft delete)';


-- PASO 2: Función para suspender/reactivar cuenta
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


-- PASO 3: Función para soft delete de cuenta
-- ============================================================================
CREATE OR REPLACE FUNCTION public.soft_delete_profile()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id text;
  v_result jsonb;
BEGIN
  -- Obtener el user_id del usuario autenticado
  v_user_id := auth.uid()::text;
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'No authenticated user';
  END IF;
  
  -- Marcar como eliminado y anonimizar datos sensibles
  UPDATE public.user_profiles
  SET 
    status = 'deleted',
    display_name = 'Usuario eliminado',
    avatar = NULL,
    bio = NULL,
    phone = NULL,
    updated_at = now()
  WHERE user_id = v_user_id
  RETURNING jsonb_build_object(
    'user_id', user_id,
    'status', status,
    'deleted_at', updated_at
  ) INTO v_result;
  
  IF v_result IS NULL THEN
    RAISE EXCEPTION 'User profile not found';
  END IF;
  
  -- Despublicar todas las propiedades del usuario
  UPDATE public.properties
  SET 
    status = 'archived',
    updated_at = now()
  WHERE owner_id = v_user_id
  AND status IN ('published', 'draft');
  
  -- Despublicar todos los posts de comunidad
  UPDATE public.community_posts
  SET 
    status = 'deleted',
    updated_at = now()
  WHERE user_id = v_user_id
  AND status = 'published';
  
  -- Log de auditoría
  INSERT INTO public.audit_log (
    user_id,
    action,
    details,
    created_at
  ) VALUES (
    v_user_id,
    'account_deleted',
    jsonb_build_object(
      'deletion_type', 'soft_delete',
      'anonymized', true
    ),
    now()
  );
  
  RETURN v_result;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Error deleting profile: %', SQLERRM;
END;
$$;

COMMENT ON FUNCTION public.soft_delete_profile IS 
'Elimina (soft delete) la cuenta del usuario autenticado, anonimiza datos y despublica contenido.';


-- PASO 4: Función para obtener status de cuenta
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_account_status()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id text;
  v_result jsonb;
BEGIN
  -- Obtener el user_id del usuario autenticado
  v_user_id := auth.uid()::text;
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'No authenticated user';
  END IF;
  
  -- Obtener información del perfil
  SELECT jsonb_build_object(
    'user_id', user_id,
    'status', status,
    'display_name', display_name,
    'user_type', user_type,
    'created_at', created_at,
    'updated_at', updated_at,
    'is_suspended', (status = 'suspended'),
    'is_deleted', (status = 'deleted'),
    'is_active', (status = 'active')
  )
  INTO v_result
  FROM public.user_profiles
  WHERE user_id = v_user_id;
  
  IF v_result IS NULL THEN
    RAISE EXCEPTION 'User profile not found';
  END IF;
  
  RETURN v_result;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Error getting account status: %', SQLERRM;
END;
$$;

COMMENT ON FUNCTION public.get_account_status IS 
'Obtiene el estado actual de la cuenta del usuario autenticado.';


-- PASO 5: Crear tabla de audit_log si no existe
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  action text NOT NULL,
  details jsonb,
  created_at timestamp with time zone DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_user_id 
ON public.audit_log(user_id);

CREATE INDEX IF NOT EXISTS idx_audit_log_created_at 
ON public.audit_log(created_at DESC);

COMMENT ON TABLE public.audit_log IS 
'Registro de auditoría para acciones sensibles de usuarios';


-- PASO 6: Políticas RLS para audit_log
-- ============================================================================
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Los usuarios solo pueden ver sus propios logs
DROP POLICY IF EXISTS "Users can view own audit logs" ON public.audit_log;
CREATE POLICY "Users can view own audit logs"
  ON public.audit_log
  FOR SELECT
  USING (user_id = auth.uid()::text);

-- Solo el sistema puede insertar logs (via SECURITY DEFINER functions)
DROP POLICY IF EXISTS "System can insert audit logs" ON public.audit_log;
CREATE POLICY "System can insert audit logs"
  ON public.audit_log
  FOR INSERT
  WITH CHECK (true);


-- PASO 7: Grants de permisos
-- ============================================================================
-- Permitir a usuarios autenticados ejecutar las funciones
GRANT EXECUTE ON FUNCTION public.suspend_profile TO authenticated;
GRANT EXECUTE ON FUNCTION public.soft_delete_profile TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_account_status TO authenticated;

-- Permitir acceso a la tabla audit_log
GRANT SELECT ON public.audit_log TO authenticated;


-- PASO 8: Verificación de instalación
-- ============================================================================
DO $$
DECLARE
  v_status_column_exists boolean;
  v_suspend_function_exists boolean;
  v_delete_function_exists boolean;
  v_status_function_exists boolean;
  v_audit_table_exists boolean;
BEGIN
  -- Verificar columna status
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'user_profiles' 
    AND column_name = 'status'
  ) INTO v_status_column_exists;
  
  -- Verificar funciones
  SELECT EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'suspend_profile'
  ) INTO v_suspend_function_exists;
  
  SELECT EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'soft_delete_profile'
  ) INTO v_delete_function_exists;
  
  SELECT EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'get_account_status'
  ) INTO v_status_function_exists;
  
  -- Verificar tabla audit_log
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'audit_log'
  ) INTO v_audit_table_exists;
  
  -- Reporte de verificación
  RAISE NOTICE '========================================';
  RAISE NOTICE 'VERIFICACIÓN DE INSTALACIÓN';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Columna status: %', CASE WHEN v_status_column_exists THEN '✅' ELSE '❌' END;
  RAISE NOTICE 'Función suspend_profile: %', CASE WHEN v_suspend_function_exists THEN '✅' ELSE '❌' END;
  RAISE NOTICE 'Función soft_delete_profile: %', CASE WHEN v_delete_function_exists THEN '✅' ELSE '❌' END;
  RAISE NOTICE 'Función get_account_status: %', CASE WHEN v_status_function_exists THEN '✅' ELSE '❌' END;
  RAISE NOTICE 'Tabla audit_log: %', CASE WHEN v_audit_table_exists THEN '✅' ELSE '❌' END;
  RAISE NOTICE '========================================';
  
  IF v_status_column_exists AND v_suspend_function_exists AND 
     v_delete_function_exists AND v_status_function_exists AND v_audit_table_exists THEN
    RAISE NOTICE '✅ INSTALACIÓN COMPLETA Y EXITOSA';
  ELSE
    RAISE WARNING '⚠️ INSTALACIÓN INCOMPLETA - Revisar errores arriba';
  END IF;
END $$;


-- ============================================================================
-- ROLLBACK (En caso de necesitar revertir cambios)
-- ============================================================================
-- DESCOMENTAR SOLO SI NECESITAS REVERTIR:

/*
-- Eliminar funciones
DROP FUNCTION IF EXISTS public.suspend_profile CASCADE;
DROP FUNCTION IF EXISTS public.soft_delete_profile CASCADE;
DROP FUNCTION IF EXISTS public.get_account_status CASCADE;

-- Eliminar columna status (CUIDADO: esto eliminará datos)
-- ALTER TABLE public.user_profiles DROP COLUMN IF EXISTS status;

-- Eliminar tabla audit_log (CUIDADO: esto eliminará datos)
-- DROP TABLE IF EXISTS public.audit_log CASCADE;

RAISE NOTICE '⚠️ ROLLBACK COMPLETADO - Funciones y estructuras eliminadas';
*/
