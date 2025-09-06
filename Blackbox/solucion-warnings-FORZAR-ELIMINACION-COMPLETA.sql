-- =====================================================
-- SOLUCIÓN FORZADA: ELIMINAR FUNCIONES DUPLICADAS
-- =====================================================
-- Fecha: 2025-01-27
-- Problema: DROP FUNCTION IF EXISTS no elimina todas las versiones
-- Solución: Eliminar por OID específico y recrear
-- =====================================================

-- PASO 1: Eliminar TODAS las versiones por OID específico
DO $$
DECLARE
    func_oid OID;
BEGIN
    -- Eliminar todas las versiones de update_user_profile
    FOR func_oid IN 
        SELECT p.oid 
        FROM pg_proc p 
        JOIN pg_namespace n ON p.pronamespace = n.oid 
        WHERE n.nspname = 'public' AND p.proname = 'update_user_profile'
    LOOP
        EXECUTE 'DROP FUNCTION ' || func_oid::regprocedure || ' CASCADE';
    END LOOP;
    
    -- Eliminar todas las versiones de validate_operation_type
    FOR func_oid IN 
        SELECT p.oid 
        FROM pg_proc p 
        JOIN pg_namespace n ON p.pronamespace = n.oid 
        WHERE n.nspname = 'public' AND p.proname = 'validate_operation_type'
    LOOP
        EXECUTE 'DROP FUNCTION ' || func_oid::regprocedure || ' CASCADE';
    END LOOP;
    
    -- Eliminar handle_updated_at
    FOR func_oid IN 
        SELECT p.oid 
        FROM pg_proc p 
        JOIN pg_namespace n ON p.pronamespace = n.oid 
        WHERE n.nspname = 'public' AND p.proname = 'handle_updated_at'
    LOOP
        EXECUTE 'DROP FUNCTION ' || func_oid::regprocedure || ' CASCADE';
    END LOOP;
END $$;

-- PASO 2: Verificar que se eliminaron todas
SELECT 
    proname as function_name,
    COUNT(*) as count
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND proname IN ('update_user_profile', 'validate_operation_type', 'handle_updated_at')
GROUP BY proname
ORDER BY proname;

-- PASO 3: Crear handle_updated_at ÚNICA con search_path correcto
CREATE FUNCTION public.handle_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public,pg_temp
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

-- PASO 4: Crear update_user_profile ÚNICA con search_path correcto
CREATE FUNCTION public.update_user_profile(
    user_id TEXT,
    profile_data JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public,pg_temp
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

-- PASO 5: Crear validate_operation_type ÚNICA con search_path correcto
CREATE FUNCTION public.validate_operation_type(
    operation_type TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public,pg_temp
AS $$
BEGIN
    RETURN operation_type IN ('create', 'update', 'delete', 'read', 'list');
END;
$$;

-- PASO 6: Recrear trigger
CREATE TRIGGER handle_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- PASO 7: Verificar que solo hay UNA función de cada tipo
SELECT 
    proname as function_name,
    COUNT(*) as count
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND proname IN ('update_user_profile', 'validate_operation_type', 'handle_updated_at')
GROUP BY proname
ORDER BY proname;

-- PASO 8: Verificar search_path correcto (debe ser "search_path=public,pg_temp")
SELECT 
    proname as function_name,
    prosecdef as security_definer,
    proconfig as config_settings,
    CASE 
        WHEN proconfig IS NOT NULL AND 'search_path=public,pg_temp' = ANY(proconfig) 
        THEN '✅ SEARCH_PATH CORRECTO' 
        ELSE '❌ SEARCH_PATH INCORRECTO' 
    END as search_path_status
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND proname IN ('update_user_profile', 'validate_operation_type', 'handle_updated_at')
ORDER BY proname;

-- PASO 9: Test funcional
SELECT 'Testing validate_operation_type...' as test;
SELECT public.validate_operation_type('update') as should_be_true;
SELECT public.validate_operation_type('invalid') as should_be_false;

-- PASO 10: Verificar trigger
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
SELECT 'FUNCIONES DUPLICADAS ELIMINADAS FORZADAMENTE - WARNINGS CORREGIDOS' as resultado_final;

-- =====================================================
-- RESULTADO ESPERADO:
-- - count = 1 para cada función (sin duplicados)
-- - search_path_status = "✅ SEARCH_PATH CORRECTO"
-- - config_settings = ["search_path=public,pg_temp"] (sin espacios)
-- =====================================================
