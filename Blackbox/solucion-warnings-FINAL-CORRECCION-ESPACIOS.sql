-- =====================================================
-- SOLUCIÓN FINAL: CORREGIR ESPACIOS EN SEARCH_PATH Y FUNCIÓN FALTANTE
-- =====================================================
-- Fecha: 2025-01-27
-- Problema: search_path sigue teniendo espacios y función update_updated_at_column faltante
-- Solución: Reconfigurar search_path sin espacios y agregar función faltante
-- =====================================================

-- PASO 1: Reconfigurar search_path SIN ESPACIOS para funciones existentes
ALTER FUNCTION public.handle_updated_at() SET search_path = 'public,pg_temp';
ALTER FUNCTION public.update_user_profile(TEXT, JSONB) SET search_path = 'public,pg_temp';
ALTER FUNCTION public.validate_operation_type(TEXT) SET search_path = 'public,pg_temp';

-- PASO 2: Crear función update_updated_at_column que falta (mencionada en el warning)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

-- PASO 3: Configurar search_path SIN ESPACIOS para la nueva función
ALTER FUNCTION public.update_updated_at_column() SET search_path = 'public,pg_temp';

-- PASO 4: Verificar que todas las funciones tienen search_path correcto
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
AND proname IN ('update_user_profile', 'validate_operation_type', 'handle_updated_at', 'update_updated_at_column')
ORDER BY proname;

-- PASO 5: Verificar que solo hay UNA función de cada tipo
SELECT 
    proname as function_name,
    COUNT(*) as count_final
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND proname IN ('update_user_profile', 'validate_operation_type', 'handle_updated_at', 'update_updated_at_column')
GROUP BY proname
ORDER BY proname;

-- PASO 6: Test funcional
SELECT 'Testing validate_operation_type...' as test_message;
SELECT public.validate_operation_type('update') as should_be_true;
SELECT public.validate_operation_type('invalid') as should_be_false;

-- PASO 7: Verificar triggers
SELECT 
    trigger_name, 
    event_object_table, 
    action_timing, 
    event_manipulation
FROM information_schema.triggers 
WHERE trigger_schema = 'public' 
AND event_object_table = 'users'
AND trigger_name IN ('handle_updated_at', 'update_updated_at_column');

-- PASO 8: Comentarios finales
COMMENT ON FUNCTION public.handle_updated_at() IS 'Trigger function - search_path=public,pg_temp (no spaces)';
COMMENT ON FUNCTION public.update_user_profile(TEXT, JSONB) IS 'User profile update - search_path=public,pg_temp (no spaces)';
COMMENT ON FUNCTION public.validate_operation_type(TEXT) IS 'Operation validator - search_path=public,pg_temp (no spaces)';
COMMENT ON FUNCTION public.update_updated_at_column() IS 'Updated at column trigger - search_path=public,pg_temp (no spaces)';

-- RESULTADO FINAL
SELECT 'SEARCH_PATH CORREGIDO SIN ESPACIOS - TODAS LAS FUNCIONES CONFIGURADAS' as resultado_final;

-- =====================================================
-- RESULTADO ESPERADO:
-- - search_path_status = "✅ SEARCH_PATH CORRECTO" para todas las funciones
-- - config_settings = ["search_path=public,pg_temp"] (SIN ESPACIOS)
-- - 0 warnings en el linter de Supabase
-- =====================================================
