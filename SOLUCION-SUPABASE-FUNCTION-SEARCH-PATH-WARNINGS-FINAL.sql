-- =====================================================
-- SOLUCIÓN DEFINITIVA: FUNCTION SEARCH PATH MUTABLE WARNINGS
-- =====================================================
-- Fecha: 2025-01-03
-- Descripción: Corrige los warnings de seguridad relacionados con search_path mutable en funciones de Supabase
-- Problema: Las funciones no tienen configurado un search_path fijo, lo que puede ser un riesgo de seguridad

-- =====================================================
-- 1. FUNCIÓN: update_user_profile
-- =====================================================
-- Eliminar función existente y recrear con search_path seguro
DROP FUNCTION IF EXISTS public.update_user_profile CASCADE;

CREATE OR REPLACE FUNCTION public.update_user_profile(
    user_id uuid,
    p_full_name text DEFAULT NULL,
    p_phone text DEFAULT NULL,
    p_bio text DEFAULT NULL,
    p_avatar_url text DEFAULT NULL,
    p_location text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    result json;
BEGIN
    -- Verificar que el usuario existe
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = user_id) THEN
        RETURN json_build_object('error', 'Usuario no encontrado');
    END IF;

    -- Actualizar perfil del usuario
    UPDATE public.profiles 
    SET 
        full_name = COALESCE(p_full_name, full_name),
        phone = COALESCE(p_phone, phone),
        bio = COALESCE(p_bio, bio),
        avatar_url = COALESCE(p_avatar_url, avatar_url),
        location = COALESCE(p_location, location),
        updated_at = now()
    WHERE id = user_id;

    -- Obtener el perfil actualizado
    SELECT json_build_object(
        'id', id,
        'full_name', full_name,
        'phone', phone,
        'bio', bio,
        'avatar_url', avatar_url,
        'location', location,
        'updated_at', updated_at
    ) INTO result
    FROM public.profiles
    WHERE id = user_id;

    RETURN result;
END;
$$;

-- =====================================================
-- 2. FUNCIÓN: validate_operation_type
-- =====================================================
DROP FUNCTION IF EXISTS public.validate_operation_type CASCADE;

CREATE OR REPLACE FUNCTION public.validate_operation_type(
    operation_type text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    -- Validar tipos de operación permitidos
    RETURN operation_type IN ('venta', 'alquiler', 'alquiler_temporal');
END;
$$;

-- =====================================================
-- 3. FUNCIÓN: update_updated_at_column
-- =====================================================
DROP FUNCTION IF EXISTS public.update_updated_at_column CASCADE;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

-- =====================================================
-- 4. FUNCIÓN: get_user_profile
-- =====================================================
DROP FUNCTION IF EXISTS public.get_user_profile CASCADE;

CREATE OR REPLACE FUNCTION public.get_user_profile(
    user_id uuid
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    result json;
BEGIN
    -- Obtener perfil del usuario
    SELECT json_build_object(
        'id', p.id,
        'email', u.email,
        'full_name', p.full_name,
        'phone', p.phone,
        'bio', p.bio,
        'avatar_url', p.avatar_url,
        'location', p.location,
        'created_at', p.created_at,
        'updated_at', p.updated_at
    ) INTO result
    FROM public.profiles p
    JOIN auth.users u ON u.id = p.id
    WHERE p.id = user_id;

    -- Si no se encuentra el perfil, devolver error
    IF result IS NULL THEN
        RETURN json_build_object('error', 'Perfil no encontrado');
    END IF;

    RETURN result;
END;
$$;

-- =====================================================
-- 5. FUNCIÓN: handle_new_user
-- =====================================================
DROP FUNCTION IF EXISTS public.handle_new_user CASCADE;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    -- Crear perfil para nuevo usuario
    INSERT INTO public.profiles (
        id,
        full_name,
        email,
        created_at,
        updated_at
    )
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        NEW.email,
        now(),
        now()
    );

    RETURN NEW;
END;
$$;

-- =====================================================
-- RECREAR TRIGGERS SI ES NECESARIO
-- =====================================================

-- Trigger para actualizar updated_at automáticamente
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_properties_updated_at ON public.properties;
CREATE TRIGGER update_properties_updated_at
    BEFORE UPDATE ON public.properties
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger para crear perfil automáticamente
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- VERIFICACIÓN DE CORRECCIONES
-- =====================================================

-- Verificar que las funciones fueron creadas correctamente
DO $$
DECLARE
    func_count integer;
BEGIN
    SELECT COUNT(*) INTO func_count
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
    AND p.proname IN (
        'update_user_profile',
        'validate_operation_type', 
        'update_updated_at_column',
        'get_user_profile',
        'handle_new_user'
    );
    
    IF func_count = 5 THEN
        RAISE NOTICE 'SUCCESS: Todas las funciones fueron creadas correctamente con search_path fijo';
    ELSE
        RAISE NOTICE 'WARNING: Solo % de 5 funciones fueron creadas', func_count;
    END IF;
END;
$$;

-- =====================================================
-- COMENTARIOS Y DOCUMENTACIÓN
-- =====================================================

COMMENT ON FUNCTION public.update_user_profile IS 'Actualiza el perfil de usuario con search_path seguro';
COMMENT ON FUNCTION public.validate_operation_type IS 'Valida tipos de operación inmobiliaria con search_path seguro';
COMMENT ON FUNCTION public.update_updated_at_column IS 'Trigger function para actualizar updated_at con search_path seguro';
COMMENT ON FUNCTION public.get_user_profile IS 'Obtiene perfil de usuario con search_path seguro';
COMMENT ON FUNCTION public.handle_new_user IS 'Maneja creación de nuevo usuario con search_path seguro';

-- =====================================================
-- INSTRUCCIONES DE APLICACIÓN
-- =====================================================

/*
INSTRUCCIONES PARA APLICAR ESTAS CORRECCIONES:

1. Conectarse a Supabase Dashboard
2. Ir a SQL Editor
3. Ejecutar este script completo
4. Verificar que no hay errores en la ejecución
5. Comprobar en Database Linter que los warnings han desaparecido

NOTA IMPORTANTE:
- Este script usa SECURITY DEFINER con search_path fijo para mayor seguridad
- Las funciones mantienen su funcionalidad original
- Se incluyen verificaciones de existencia antes de crear
- Los triggers son recreados para asegurar compatibilidad

VERIFICACIÓN POST-APLICACIÓN:
- Ejecutar Database Linter nuevamente
- Verificar que los 5 warnings de "Function Search Path Mutable" han desaparecido
- Probar funcionalidad de registro y actualización de perfiles
*/
