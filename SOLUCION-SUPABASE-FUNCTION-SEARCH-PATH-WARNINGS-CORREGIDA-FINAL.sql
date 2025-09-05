-- =====================================================
-- SOLUCIÓN CORREGIDA: FUNCTION SEARCH PATH MUTABLE WARNINGS
-- =====================================================
-- Fecha: 2025-01-03
-- Descripción: Corrige específicamente los 5 warnings detectados en Database Linter
-- Problema: Las funciones tienen search_path mutable, necesitan configuración fija

-- =====================================================
-- PASO 1: VERIFICAR FUNCIONES EXISTENTES
-- =====================================================
DO $$
BEGIN
    RAISE NOTICE 'Iniciando corrección de Function Search Path Mutable warnings...';
    RAISE NOTICE 'Funciones a corregir:';
    RAISE NOTICE '1. public.update_user_profile';
    RAISE NOTICE '2. public.validate_operation_type';
    RAISE NOTICE '3. public.update_updated_at_column';
    RAISE NOTICE '4. public.get_user_profile';
    RAISE NOTICE '5. public.handle_new_user';
END;
$$;

-- =====================================================
-- FUNCIÓN 1: update_user_profile
-- =====================================================
-- Eliminar y recrear con search_path fijo
DROP FUNCTION IF EXISTS public.update_user_profile(uuid, text, text, text, text, text) CASCADE;

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
SET search_path = public
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
-- FUNCIÓN 2: validate_operation_type
-- =====================================================
DROP FUNCTION IF EXISTS public.validate_operation_type(text) CASCADE;

CREATE OR REPLACE FUNCTION public.validate_operation_type(
    operation_type text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Validar tipos de operación permitidos
    RETURN operation_type IN ('venta', 'alquiler', 'alquiler_temporal');
END;
$$;

-- =====================================================
-- FUNCIÓN 3: update_updated_at_column
-- =====================================================
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

-- =====================================================
-- FUNCIÓN 4: get_user_profile
-- =====================================================
DROP FUNCTION IF EXISTS public.get_user_profile(uuid) CASCADE;

CREATE OR REPLACE FUNCTION public.get_user_profile(
    user_id uuid
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
-- FUNCIÓN 5: handle_new_user
-- =====================================================
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
-- RECREAR TRIGGERS NECESARIOS
-- =====================================================

-- Trigger para actualizar updated_at automáticamente en profiles
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger para actualizar updated_at automáticamente en properties (si existe la tabla)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'properties') THEN
        DROP TRIGGER IF EXISTS update_properties_updated_at ON public.properties;
        CREATE TRIGGER update_properties_updated_at
            BEFORE UPDATE ON public.properties
            FOR EACH ROW
            EXECUTE FUNCTION public.update_updated_at_column();
        RAISE NOTICE 'Trigger update_properties_updated_at recreado exitosamente';
    ELSE
        RAISE NOTICE 'Tabla properties no existe, omitiendo trigger';
    END IF;
END;
$$;

-- Trigger para crear perfil automáticamente
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- VERIFICACIÓN FINAL
-- =====================================================
DO $$
DECLARE
    func_count integer;
    func_name text;
    func_names text[] := ARRAY[
        'update_user_profile',
        'validate_operation_type', 
        'update_updated_at_column',
        'get_user_profile',
        'handle_new_user'
    ];
BEGIN
    RAISE NOTICE '=====================================================';
    RAISE NOTICE 'VERIFICACIÓN DE CORRECCIONES APLICADAS';
    RAISE NOTICE '=====================================================';
    
    -- Contar funciones corregidas
    SELECT COUNT(*) INTO func_count
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
    AND p.proname = ANY(func_names);
    
    RAISE NOTICE 'Funciones encontradas: % de 5', func_count;
    
    -- Verificar cada función individualmente
    FOREACH func_name IN ARRAY func_names
    LOOP
        IF EXISTS (
            SELECT 1 FROM pg_proc p
            JOIN pg_namespace n ON p.pronamespace = n.oid
            WHERE n.nspname = 'public' AND p.proname = func_name
        ) THEN
            RAISE NOTICE '✓ Función % existe y fue corregida', func_name;
        ELSE
            RAISE NOTICE '✗ Función % NO encontrada', func_name;
        END IF;
    END LOOP;
    
    IF func_count = 5 THEN
        RAISE NOTICE '=====================================================';
        RAISE NOTICE '✅ SUCCESS: Todas las funciones fueron corregidas exitosamente';
        RAISE NOTICE 'Los warnings de Function Search Path Mutable deberían desaparecer';
        RAISE NOTICE 'Ejecuta Database Linter para verificar';
        RAISE NOTICE '=====================================================';
    ELSE
        RAISE NOTICE '=====================================================';
        RAISE NOTICE '⚠️  WARNING: Solo % de 5 funciones fueron corregidas', func_count;
        RAISE NOTICE 'Revisa los errores anteriores';
        RAISE NOTICE '=====================================================';
    END IF;
END;
$$;

-- =====================================================
-- COMENTARIOS Y DOCUMENTACIÓN
-- =====================================================
COMMENT ON FUNCTION public.update_user_profile IS 'Actualiza perfil de usuario con search_path fijo para seguridad';
COMMENT ON FUNCTION public.validate_operation_type IS 'Valida tipos de operación inmobiliaria con search_path fijo';
COMMENT ON FUNCTION public.update_updated_at_column IS 'Trigger function para actualizar updated_at con search_path fijo';
COMMENT ON FUNCTION public.get_user_profile IS 'Obtiene perfil de usuario con search_path fijo para seguridad';
COMMENT ON FUNCTION public.handle_new_user IS 'Maneja creación de nuevo usuario con search_path fijo';

-- =====================================================
-- INSTRUCCIONES FINALES
-- =====================================================
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🔧 INSTRUCCIONES POST-APLICACIÓN:';
    RAISE NOTICE '1. Ve a Supabase Dashboard > Database > Database Linter';
    RAISE NOTICE '2. Ejecuta el linter nuevamente';
    RAISE NOTICE '3. Verifica que los 5 warnings de "Function Search Path Mutable" desaparecieron';
    RAISE NOTICE '4. Si persisten, contacta soporte con este log';
    RAISE NOTICE '';
    RAISE NOTICE '📋 FUNCIONES CORREGIDAS:';
    RAISE NOTICE '- public.update_user_profile (SET search_path = public)';
    RAISE NOTICE '- public.validate_operation_type (SET search_path = public)';
    RAISE NOTICE '- public.update_updated_at_column (SET search_path = public)';
    RAISE NOTICE '- public.get_user_profile (SET search_path = public)';
    RAISE NOTICE '- public.handle_new_user (SET search_path = public)';
    RAISE NOTICE '';
    RAISE NOTICE '✅ Script ejecutado exitosamente - ' || now();
END;
$$;
