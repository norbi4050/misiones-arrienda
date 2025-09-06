-- =====================================================
-- SOLUCIÓN FINAL DEFINITIVA: WARNINGS SEARCH PATH
-- =====================================================
-- Fecha: 2025-01-27
-- Problema: search_path con comillas incorrectas
-- Solución: Usar sintaxis correcta sin comillas anidadas
-- =====================================================

-- PASO 1: Limpiar completamente todas las funciones problemáticas
DROP FUNCTION IF EXISTS public.update_user_profile(TEXT, JSONB) CASCADE;
DROP FUNCTION IF EXISTS public.validate_operation_type(TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.handle_updated_at() CASCADE;

-- PASO 2: Recrear handle_updated_at con sintaxis correcta
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

-- PASO 3: Crear update_user_profile con sintaxis correcta
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

-- PASO 4: Crear validate_operation_type con sintaxis correcta
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

-- PASO 5: Recrear trigger
CREATE TRIGGER handle_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- PASO 6: Verificar que solo existe una función de cada tipo
SELECT 
    proname as function_name,
    COUNT(*) as count
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND proname IN ('update_user_profile', 'validate_operation_type', 'handle_updated_at')
GROUP BY proname
ORDER BY proname;

-- PASO 7: Verificar configuración correcta (sin comillas anidadas)
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

-- PASO 8: Test funcional
SELECT 'Testing validate_operation_type...' as test;
SELECT public.validate_operation_type('update') as should_be_true;
SELECT public.validate_operation_type('invalid') as should_be_false;

-- PASO 9: Verificar trigger
SELECT 
    trigger_name, 
    event_object_table, 
    action_timing, 
    event_manipulation
FROM information_schema.triggers 
WHERE trigger_schema = 'public' 
AND event_object_table = 'users'
AND trigger_name = 'handle_updated_at';

-- PASO 10: Comentarios finales
COMMENT ON FUNCTION public.handle_updated_at() IS 'Trigger function with fixed search_path for security warnings';
COMMENT ON FUNCTION public.update_user_profile(TEXT, JSONB) IS 'User profile update function with fixed search_path';
COMMENT ON FUNCTION public.validate_operation_type(TEXT) IS 'Operation type validator with fixed search_path';

-- RESULTADO FINAL
SELECT 'WARNINGS SEARCH PATH SOLUCIONADOS - Funciones únicas con search_path fijo' as resultado_final;

-- =====================================================
-- INSTRUCCIONES:
-- 1. Ejecutar este script completo en Supabase SQL Editor
-- 2. Verificar que cada función aparece solo una vez
-- 3. Confirmar que search_path_status = "✅ SEARCH_PATH CORRECTO"
-- 4. Verificar que warnings desaparecieron del linter
-- =====================================================
