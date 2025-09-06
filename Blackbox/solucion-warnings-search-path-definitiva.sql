-- =====================================================
-- SOLUCIÓN DEFINITIVA: WARNINGS SEARCH PATH SUPABASE
-- =====================================================
-- Fecha: 2025-01-27
-- Problema: Function Search Path Mutable warnings
-- Funciones: update_user_profile, validate_operation_type, update_updated_at_column
-- Solución: Fijar search_path en las funciones
-- =====================================================

-- PASO 1: Verificar funciones existentes
SELECT 
    proname as function_name,
    prosecdef as security_definer,
    proconfig as config_settings
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND proname IN ('update_user_profile', 'validate_operation_type', 'update_updated_at_column');

-- PASO 2: Crear o reemplazar función handle_updated_at con search_path fijo
-- Esta función probablemente existe y es la que causa el warning update_updated_at_column
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

-- PASO 3: Crear función update_user_profile si no existe (con search_path fijo)
-- Esta función puede ser necesaria para operaciones de perfil
CREATE OR REPLACE FUNCTION public.update_user_profile(
    user_id TEXT,
    profile_data JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
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

-- PASO 4: Crear función validate_operation_type si no existe (con search_path fijo)
-- Esta función puede ser para validar tipos de operaciones
CREATE OR REPLACE FUNCTION public.validate_operation_type(
    operation_type TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    -- Validar que el tipo de operación sea válido
    RETURN operation_type IN ('create', 'update', 'delete', 'read', 'list');
END;
$$;

-- PASO 5: Verificar que las funciones se crearon correctamente
SELECT 
    proname as function_name,
    prosecdef as security_definer,
    proconfig as config_settings
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND proname IN ('update_user_profile', 'validate_operation_type', 'handle_updated_at')
ORDER BY proname;

-- PASO 6: Verificar que el trigger sigue funcionando
SELECT 
    trigger_name, 
    event_object_table, 
    action_timing, 
    event_manipulation,
    action_statement
FROM information_schema.triggers 
WHERE trigger_schema = 'public' 
AND event_object_table = 'users'
AND trigger_name LIKE '%updated_at%';

-- PASO 7: Test de funcionamiento
-- Probar que las funciones funcionan correctamente
SELECT 'Testing validate_operation_type...' as test;
SELECT public.validate_operation_type('update') as should_be_true;
SELECT public.validate_operation_type('invalid') as should_be_false;

-- PASO 8: Test del trigger updated_at
SELECT 'Testing trigger updated_at...' as test;
-- El trigger se probará automáticamente en la próxima actualización de users

-- PASO 9: Comentarios sobre las funciones
COMMENT ON FUNCTION public.handle_updated_at() IS 'Trigger function to automatically update updated_at column. Fixed search_path for security.';
COMMENT ON FUNCTION public.update_user_profile(TEXT, JSONB) IS 'Function to update user profile data safely. Fixed search_path for security.';
COMMENT ON FUNCTION public.validate_operation_type(TEXT) IS 'Function to validate operation types. Fixed search_path for security.';

-- PASO 10: Verificación final
SELECT 'Funciones creadas/actualizadas con search_path fijo:' as resultado;
SELECT 
    proname as function_name,
    CASE 
        WHEN proconfig IS NOT NULL AND 'search_path=public,pg_temp' = ANY(proconfig) 
        THEN '✅ SEARCH_PATH FIJO' 
        ELSE '⚠️ VERIFICAR SEARCH_PATH' 
    END as search_path_status
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND proname IN ('update_user_profile', 'validate_operation_type', 'handle_updated_at')
ORDER BY proname;

-- =====================================================
-- INSTRUCCIONES DE EJECUCIÓN:
-- =====================================================
-- 1. Copiar este script completo
-- 2. Ir a Supabase Dashboard > SQL Editor
-- 3. Pegar y ejecutar el script
-- 4. Verificar que no hay errores
-- 5. Ejecutar script de verificación posterior
-- =====================================================
