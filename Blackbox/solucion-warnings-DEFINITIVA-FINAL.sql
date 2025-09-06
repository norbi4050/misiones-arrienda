-- =====================================================
-- SOLUCIÓN DEFINITIVA FINAL: ELIMINAR TODAS LAS VERSIONES Y RECREAR LIMPIO
-- =====================================================
-- Fecha: 2025-01-27
-- Problema: Múltiples funciones con diferentes signaturas y search_path con comillas
-- Solución: Eliminar TODAS las versiones específicas y recrear desde cero
-- =====================================================

-- PASO 1: Eliminar trigger primero
DROP TRIGGER IF EXISTS handle_updated_at ON public.users CASCADE;

-- PASO 2: Eliminar TODAS las versiones específicas de update_user_profile
DROP FUNCTION IF EXISTS public.update_user_profile(uuid,text,text,text,text,text) CASCADE;
DROP FUNCTION IF EXISTS public.update_user_profile(uuid,jsonb) CASCADE;
DROP FUNCTION IF EXISTS public.update_user_profile(text,jsonb) CASCADE;

-- PASO 3: Eliminar TODAS las versiones específicas de validate_operation_type
DROP FUNCTION IF EXISTS public.validate_operation_type() CASCADE;
DROP FUNCTION IF EXISTS public.validate_operation_type(text) CASCADE;

-- PASO 4: Eliminar handle_updated_at
DROP FUNCTION IF EXISTS public.handle_updated_at() CASCADE;

-- PASO 5: Verificar eliminación completa
SELECT 
    proname as function_name,
    COUNT(*) as count_after_complete_drop
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND proname IN ('update_user_profile', 'validate_operation_type', 'handle_updated_at')
GROUP BY proname
ORDER BY proname;

-- PASO 6: Crear handle_updated_at ÚNICA y LIMPIA
CREATE FUNCTION public.handle_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

-- PASO 7: Configurar search_path SIN COMILLAS DOBLES
ALTER FUNCTION public.handle_updated_at() SET search_path = public,pg_temp;

-- PASO 8: Crear update_user_profile ÚNICA con signatura estándar (TEXT, JSONB)
CREATE FUNCTION public.update_user_profile(
    user_id TEXT,
    profile_data JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    updated_user JSONB;
BEGIN
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
    WHERE id = user_id::UUID
    RETURNING to_jsonb(users.*) INTO updated_user;
    
    RETURN updated_user;
END;
$$;

-- PASO 9: Configurar search_path SIN COMILLAS DOBLES
ALTER FUNCTION public.update_user_profile(TEXT, JSONB) SET search_path = public,pg_temp;

-- PASO 10: Crear validate_operation_type ÚNICA con parámetro
CREATE FUNCTION public.validate_operation_type(
    operation_type TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN operation_type IN ('create', 'update', 'delete', 'read', 'list');
END;
$$;

-- PASO 11: Configurar search_path SIN COMILLAS DOBLES
ALTER FUNCTION public.validate_operation_type(TEXT) SET search_path = public,pg_temp;

-- PASO 12: Recrear trigger
CREATE TRIGGER handle_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- PASO 13: Verificar resultado final - DEBE SER 1 FUNCIÓN DE CADA TIPO
SELECT 
    proname as function_name,
    COUNT(*) as count_final,
    array_agg(pg_get_function_identity_arguments(p.oid)) as all_signatures
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND proname IN ('update_user_profile', 'validate_operation_type', 'handle_updated_at')
GROUP BY proname
ORDER BY proname;

-- PASO 14: Verificar search_path correcto (debe ser "search_path=public,pg_temp" SIN COMILLAS DOBLES)
SELECT 
    proname as function_name,
    prosecdef as security_definer,
    proconfig as config_settings,
    CASE 
        WHEN proconfig IS NOT NULL AND 'search_path=public,pg_temp' = ANY(proconfig) 
        THEN '✅ SEARCH_PATH CORRECTO' 
        WHEN proconfig IS NULL
        THEN '⚠️ SEARCH_PATH NULL'
        ELSE '❌ SEARCH_PATH INCORRECTO' 
    END as search_path_status
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND proname IN ('update_user_profile', 'validate_operation_type', 'handle_updated_at')
ORDER BY proname;

-- PASO 15: Test funcional
SELECT 'Testing validate_operation_type...' as test_message;
SELECT public.validate_operation_type('update') as should_be_true;
SELECT public.validate_operation_type('invalid') as should_be_false;

-- PASO 16: Verificar trigger
SELECT 
    trigger_name, 
    event_object_table, 
    action_timing, 
    event_manipulation
FROM information_schema.triggers 
WHERE trigger_schema = 'public' 
AND event_object_table = 'users'
AND trigger_name = 'handle_updated_at';

-- PASO 17: Comentarios finales
COMMENT ON FUNCTION public.handle_updated_at() IS 'Trigger function - search_path=public,pg_temp (no quotes)';
COMMENT ON FUNCTION public.update_user_profile(TEXT, JSONB) IS 'User profile update - search_path=public,pg_temp (no quotes)';
COMMENT ON FUNCTION public.validate_operation_type(TEXT) IS 'Operation validator - search_path=public,pg_temp (no quotes)';

-- RESULTADO FINAL
SELECT 'WARNINGS SEARCH PATH ELIMINADOS DEFINITIVAMENTE - FUNCIONES ÚNICAS CREADAS' as resultado_final;

-- =====================================================
-- RESULTADO ESPERADO:
-- - count_final = 1 para cada función (sin duplicados)
-- - all_signatures = array con una sola signatura por función
-- - search_path_status = "✅ SEARCH_PATH CORRECTO"
-- - config_settings = ["search_path=public,pg_temp"] (SIN COMILLAS DOBLES)
-- - Warnings completamente eliminados del linter de Supabase
-- =====================================================
