-- =====================================================
-- SOLUCIÓN CORREGIDA: WARNINGS SEARCH PATH SUPABASE
-- =====================================================
-- Fecha: 2025-01-27
-- Problema: Funciones duplicadas y search_path incorrecto
-- Basado en: Resultados del testing real
-- =====================================================

-- PASO 1: Limpiar funciones duplicadas y problemáticas
DROP FUNCTION IF EXISTS public.update_user_profile(TEXT, JSONB);
DROP FUNCTION IF EXISTS public.validate_operation_type(TEXT);

-- PASO 2: Recrear handle_updated_at con configuración correcta
DROP FUNCTION IF EXISTS public.handle_updated_at() CASCADE;

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public, pg_temp'
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

-- PASO 3: Crear update_user_profile única con search_path correcto
CREATE OR REPLACE FUNCTION public.update_user_profile(
    user_id TEXT,
    profile_data JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public, pg_temp'
AS $$
DECLARE
    updated_user JSONB;
BEGIN
    -- Actualizar el perfil del usuario
    UPDATE public.users 
    SET 
        name = COALESCE(profile_data->>'name', name),
        phone = COALESCE(profile_data->>'phone', phone),
        location = COALESCE(profile_data->>'location', location),
        bio = COALESCE(profile_data->>'bio', bio),
        profile_image = COALESCE(profile_data->>'profile_image', profile_image),
        search_type = COALESCE(profile_data->>'search_type', search_type),
        budget_range = COALESCE(profile_data->>'budget_range', budget_range),
        preferred_areas = COALESCE(profile_data->>'preferred_areas', preferred_areas),
        family_size = CASE 
            WHEN profile_data->>'family_size' IS NOT NULL 
            THEN (profile_data->>'family_size')::INTEGER 
            ELSE family_size 
        END,
        pet_friendly = CASE 
            WHEN profile_data->>'pet_friendly' IS NOT NULL 
            THEN (profile_data->>'pet_friendly')::BOOLEAN 
            ELSE pet_friendly 
        END,
        move_in_date = CASE 
            WHEN profile_data->>'move_in_date' IS NOT NULL 
            THEN (profile_data->>'move_in_date')::DATE 
            ELSE move_in_date 
        END,
        employment_status = COALESCE(profile_data->>'employment_status', employment_status),
        monthly_income = CASE 
            WHEN profile_data->>'monthly_income' IS NOT NULL 
            THEN (profile_data->>'monthly_income')::NUMERIC 
            ELSE monthly_income 
        END,
        updated_at = now()
    WHERE id = user_id
    RETURNING to_jsonb(users.*) INTO updated_user;
    
    RETURN updated_user;
END;
$$;

-- PASO 4: Crear validate_operation_type única con search_path correcto
CREATE OR REPLACE FUNCTION public.validate_operation_type(
    operation_type TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public, pg_temp'
AS $$
BEGIN
    -- Validar que el tipo de operación sea válido
    RETURN operation_type IN ('create', 'update', 'delete', 'read', 'list');
END;
$$;

-- PASO 5: Recrear trigger con función corregida
DROP TRIGGER IF EXISTS handle_updated_at ON public.users;

CREATE TRIGGER handle_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- PASO 6: Verificar configuración correcta
SELECT 
    proname as function_name,
    prosecdef as security_definer,
    proconfig as config_settings,
    CASE 
        WHEN proconfig IS NOT NULL AND 'search_path=public, pg_temp' = ANY(proconfig) 
        THEN '✅ SEARCH_PATH CORRECTO' 
        ELSE '❌ SEARCH_PATH INCORRECTO' 
    END as search_path_status
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND proname IN ('update_user_profile', 'validate_operation_type', 'handle_updated_at')
ORDER BY proname;

-- PASO 7: Test funcional
SELECT 'Testing validate_operation_type...' as test;
SELECT public.validate_operation_type('update') as should_be_true;
SELECT public.validate_operation_type('invalid') as should_be_false;

-- PASO 8: Verificar trigger
SELECT 
    trigger_name, 
    event_object_table, 
    action_timing, 
    event_manipulation
FROM information_schema.triggers 
WHERE trigger_schema = 'public' 
AND event_object_table = 'users'
AND trigger_name = 'handle_updated_at';

-- PASO 9: Comentarios
COMMENT ON FUNCTION public.handle_updated_at() IS 'Trigger function to automatically update updated_at column. Fixed search_path for security.';
COMMENT ON FUNCTION public.update_user_profile(TEXT, JSONB) IS 'Function to update user profile data safely. Fixed search_path for security.';
COMMENT ON FUNCTION public.validate_operation_type(TEXT) IS 'Function to validate operation types. Fixed search_path for security.';

-- PASO 10: Verificación final
SELECT 'SOLUCIÓN APLICADA - Funciones corregidas con search_path fijo' as resultado;

-- =====================================================
-- RESULTADO ESPERADO:
-- - 3 funciones únicas con search_path='public, pg_temp'
-- - Trigger funcionando correctamente
-- - Warnings eliminados
-- =====================================================
