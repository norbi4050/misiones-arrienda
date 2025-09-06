-- =====================================================
-- SOLUCIÓN ULTRA ESPECÍFICA: ELIMINAR FUNCIONES POR SIGNATURA EXACTA
-- =====================================================
-- Fecha: 2025-01-27
-- Problema: Funciones duplicadas con signaturas diferentes
-- Solución: Identificar y eliminar cada función por su signatura exacta
-- =====================================================

-- PASO 1: Identificar todas las signaturas exactas de las funciones
SELECT 
    proname as function_name,
    pg_get_function_identity_arguments(p.oid) as arguments,
    p.oid::regprocedure as full_signature
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND proname IN ('update_user_profile', 'validate_operation_type', 'handle_updated_at')
ORDER BY proname, arguments;

-- PASO 2: Eliminar trigger primero
DROP TRIGGER IF EXISTS handle_updated_at ON public.users CASCADE;

-- PASO 3: Eliminar funciones por signatura específica (basado en los resultados anteriores)
-- Estas son las signaturas más comunes que hemos visto:

-- handle_updated_at (sin parámetros)
DROP FUNCTION IF EXISTS public.handle_updated_at() CASCADE;

-- update_user_profile con diferentes signaturas
DROP FUNCTION IF EXISTS public.update_user_profile(text, jsonb) CASCADE;
DROP FUNCTION IF EXISTS public.update_user_profile(user_id text, profile_data jsonb) CASCADE;

-- validate_operation_type con diferentes signaturas  
DROP FUNCTION IF EXISTS public.validate_operation_type(text) CASCADE;
DROP FUNCTION IF EXISTS public.validate_operation_type(operation_type text) CASCADE;

-- PASO 4: Verificar eliminación
SELECT 
    proname as function_name,
    COUNT(*) as count_after_specific_drop
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND proname IN ('update_user_profile', 'validate_operation_type', 'handle_updated_at')
GROUP BY proname
ORDER BY proname;

-- PASO 5: Si aún quedan funciones, usar CREATE OR REPLACE para sobrescribir
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

-- PASO 6: Configurar search_path SIN ESPACIOS
ALTER FUNCTION public.handle_updated_at() SET search_path = 'public,pg_temp';

-- PASO 7: Crear/Reemplazar update_user_profile
CREATE OR REPLACE FUNCTION public.update_user_profile(
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
    WHERE id = user_id
    RETURNING to_jsonb(users.*) INTO updated_user;
    
    RETURN updated_user;
END;
$$;

-- PASO 8: Configurar search_path SIN ESPACIOS
ALTER FUNCTION public.update_user_profile(TEXT, JSONB) SET search_path = 'public,pg_temp';

-- PASO 9: Crear/Reemplazar validate_operation_type
CREATE OR REPLACE FUNCTION public.validate_operation_type(
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

-- PASO 10: Configurar search_path SIN ESPACIOS
ALTER FUNCTION public.validate_operation_type(TEXT) SET search_path = 'public,pg_temp';

-- PASO 11: Recrear trigger
CREATE TRIGGER handle_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- PASO 12: Verificar resultado final - debe ser 1 función de cada tipo
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

-- PASO 13: Verificar search_path correcto (debe ser "search_path=public,pg_temp" SIN ESPACIOS)
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

-- PASO 14: Test funcional
SELECT 'Testing validate_operation_type...' as test_message;
SELECT public.validate_operation_type('update') as should_be_true;
SELECT public.validate_operation_type('invalid') as should_be_false;

-- PASO 15: Verificar trigger
SELECT 
    trigger_name, 
    event_object_table, 
    action_timing, 
    event_manipulation
FROM information_schema.triggers 
WHERE trigger_schema = 'public' 
AND event_object_table = 'users'
AND trigger_name = 'handle_updated_at';

-- RESULTADO FINAL
SELECT 'WARNINGS SEARCH PATH CORREGIDOS CON SIGNATURAS ESPECÍFICAS' as resultado_final;

-- =====================================================
-- RESULTADO ESPERADO:
-- - count_final = 1 para cada función (sin duplicados)
-- - all_signatures = array con una sola signatura por función
-- - search_path_status = "✅ SEARCH_PATH CORRECTO"
-- - config_settings = ["search_path=public,pg_temp"] (SIN ESPACIOS)
-- - Warnings eliminados del linter de Supabase
-- =====================================================
