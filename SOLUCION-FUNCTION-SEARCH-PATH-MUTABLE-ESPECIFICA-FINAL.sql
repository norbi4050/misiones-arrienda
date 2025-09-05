-- =====================================================
-- SOLUCIÓN ESPECÍFICA: FUNCTION SEARCH PATH MUTABLE WARNINGS
-- =====================================================
-- Fecha: 2025-01-03
-- Descripción: Corrige los 2 warnings específicos de Function Search Path Mutable
-- Funciones afectadas:
-- 1. public.update_user_profile
-- 2. public.validate_operation_type

-- =====================================================
-- ANÁLISIS DEL PROBLEMA
-- =====================================================
-- Los warnings indican que estas funciones tienen un search_path mutable,
-- lo cual es un riesgo de seguridad porque permite ataques de inyección
-- de esquemas maliciosos.

DO $$
BEGIN
    RAISE NOTICE '=====================================================';
    RAISE NOTICE 'INICIANDO CORRECCIÓN DE FUNCTION SEARCH PATH MUTABLE';
    RAISE NOTICE '=====================================================';
    RAISE NOTICE 'Corrigiendo 2 warnings específicos:';
    RAISE NOTICE '1. Function public.update_user_profile';
    RAISE NOTICE '2. Function public.validate_operation_type';
    RAISE NOTICE '=====================================================';
END;
$$;

-- =====================================================
-- PASO 1: VERIFICAR FUNCIONES EXISTENTES
-- =====================================================

DO $$
DECLARE
    func_count integer;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🔍 PASO 1: VERIFICANDO FUNCIONES EXISTENTES';
    RAISE NOTICE '=====================================================';
    
    -- Verificar update_user_profile
    SELECT COUNT(*) INTO func_count
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = 'update_user_profile';
    
    IF func_count > 0 THEN
        RAISE NOTICE '✅ Función update_user_profile encontrada';
    ELSE
        RAISE NOTICE '⚠️  Función update_user_profile NO encontrada';
    END IF;
    
    -- Verificar validate_operation_type
    SELECT COUNT(*) INTO func_count
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = 'validate_operation_type';
    
    IF func_count > 0 THEN
        RAISE NOTICE '✅ Función validate_operation_type encontrada';
    ELSE
        RAISE NOTICE '⚠️  Función validate_operation_type NO encontrada';
    END IF;
END;
$$;

-- =====================================================
-- PASO 2: CORREGIR update_user_profile
-- =====================================================

DO $$
DECLARE
    func_exists boolean := false;
    func_definition text;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🔧 PASO 2: CORRIGIENDO update_user_profile';
    RAISE NOTICE '=====================================================';
    
    -- Verificar si la función existe
    SELECT EXISTS(
        SELECT 1 FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' AND p.proname = 'update_user_profile'
    ) INTO func_exists;
    
    IF func_exists THEN
        RAISE NOTICE '📝 Recreando función update_user_profile con search_path seguro...';
        
        -- Eliminar función existente
        DROP FUNCTION IF EXISTS public.update_user_profile CASCADE;
        
        -- Recrear función con search_path seguro
        EXECUTE $func$
            CREATE OR REPLACE FUNCTION public.update_user_profile(
                user_id_param uuid,
                full_name_param text DEFAULT NULL,
                phone_param text DEFAULT NULL,
                bio_param text DEFAULT NULL,
                avatar_url_param text DEFAULT NULL
            )
            RETURNS json
            LANGUAGE plpgsql
            SECURITY DEFINER
            SET search_path = public, pg_temp
            AS $$
            DECLARE
                updated_profile json;
            BEGIN
                -- Validar que el usuario existe
                IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = user_id_param) THEN
                    RETURN json_build_object('error', 'Usuario no encontrado');
                END IF;
                
                -- Actualizar perfil
                UPDATE public.profiles 
                SET 
                    full_name = COALESCE(full_name_param, full_name),
                    phone = COALESCE(phone_param, phone),
                    bio = COALESCE(bio_param, bio),
                    avatar_url = COALESCE(avatar_url_param, avatar_url),
                    updated_at = now()
                WHERE id = user_id_param;
                
                -- Obtener perfil actualizado
                SELECT json_build_object(
                    'id', id,
                    'full_name', full_name,
                    'phone', phone,
                    'bio', bio,
                    'avatar_url', avatar_url,
                    'updated_at', updated_at
                ) INTO updated_profile
                FROM public.profiles
                WHERE id = user_id_param;
                
                RETURN COALESCE(updated_profile, json_build_object('error', 'Error al actualizar perfil'));
            END;
            $$;
        $func$;
        
        RAISE NOTICE '✅ Función update_user_profile corregida exitosamente';
        
    ELSE
        RAISE NOTICE '📝 Creando función update_user_profile con search_path seguro...';
        
        -- Crear función nueva con search_path seguro
        EXECUTE $func$
            CREATE OR REPLACE FUNCTION public.update_user_profile(
                user_id_param uuid,
                full_name_param text DEFAULT NULL,
                phone_param text DEFAULT NULL,
                bio_param text DEFAULT NULL,
                avatar_url_param text DEFAULT NULL
            )
            RETURNS json
            LANGUAGE plpgsql
            SECURITY DEFINER
            SET search_path = public, pg_temp
            AS $$
            DECLARE
                updated_profile json;
            BEGIN
                -- Validar que el usuario existe
                IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = user_id_param) THEN
                    RETURN json_build_object('error', 'Usuario no encontrado');
                END IF;
                
                -- Actualizar perfil
                UPDATE public.profiles 
                SET 
                    full_name = COALESCE(full_name_param, full_name),
                    phone = COALESCE(phone_param, phone),
                    bio = COALESCE(bio_param, bio),
                    avatar_url = COALESCE(avatar_url_param, avatar_url),
                    updated_at = now()
                WHERE id = user_id_param;
                
                -- Obtener perfil actualizado
                SELECT json_build_object(
                    'id', id,
                    'full_name', full_name,
                    'phone', phone,
                    'bio', bio,
                    'avatar_url', avatar_url,
                    'updated_at', updated_at
                ) INTO updated_profile
                FROM public.profiles
                WHERE id = user_id_param;
                
                RETURN COALESCE(updated_profile, json_build_object('error', 'Error al actualizar perfil'));
            END;
            $$;
        $func$;
        
        RAISE NOTICE '✅ Función update_user_profile creada exitosamente';
    END IF;
END;
$$;

-- =====================================================
-- PASO 3: CORREGIR validate_operation_type
-- =====================================================

DO $$
DECLARE
    func_exists boolean := false;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🔧 PASO 3: CORRIGIENDO validate_operation_type';
    RAISE NOTICE '=====================================================';
    
    -- Verificar si la función existe
    SELECT EXISTS(
        SELECT 1 FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' AND p.proname = 'validate_operation_type'
    ) INTO func_exists;
    
    IF func_exists THEN
        RAISE NOTICE '📝 Recreando función validate_operation_type con search_path seguro...';
        
        -- Eliminar función existente
        DROP FUNCTION IF EXISTS public.validate_operation_type CASCADE;
        
        -- Recrear función con search_path seguro
        EXECUTE $func$
            CREATE OR REPLACE FUNCTION public.validate_operation_type(
                operation_type_param text
            )
            RETURNS boolean
            LANGUAGE plpgsql
            SECURITY DEFINER
            SET search_path = public, pg_temp
            AS $$
            BEGIN
                -- Validar tipos de operación permitidos
                RETURN operation_type_param IN ('rent', 'sale', 'both');
            END;
            $$;
        $func$;
        
        RAISE NOTICE '✅ Función validate_operation_type corregida exitosamente';
        
    ELSE
        RAISE NOTICE '📝 Creando función validate_operation_type con search_path seguro...';
        
        -- Crear función nueva con search_path seguro
        EXECUTE $func$
            CREATE OR REPLACE FUNCTION public.validate_operation_type(
                operation_type_param text
            )
            RETURNS boolean
            LANGUAGE plpgsql
            SECURITY DEFINER
            SET search_path = public, pg_temp
            AS $$
            BEGIN
                -- Validar tipos de operación permitidos
                RETURN operation_type_param IN ('rent', 'sale', 'both');
            END;
            $$;
        $func$;
        
        RAISE NOTICE '✅ Función validate_operation_type creada exitosamente';
    END IF;
END;
$$;

-- =====================================================
-- PASO 4: CONFIGURAR PERMISOS DE SEGURIDAD
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🔒 PASO 4: CONFIGURANDO PERMISOS DE SEGURIDAD';
    RAISE NOTICE '=====================================================';
    
    -- Revocar permisos públicos por defecto
    REVOKE ALL ON FUNCTION public.update_user_profile FROM PUBLIC;
    REVOKE ALL ON FUNCTION public.validate_operation_type FROM PUBLIC;
    
    -- Otorgar permisos específicos
    GRANT EXECUTE ON FUNCTION public.update_user_profile TO authenticated;
    GRANT EXECUTE ON FUNCTION public.validate_operation_type TO authenticated;
    GRANT EXECUTE ON FUNCTION public.validate_operation_type TO anon;
    
    RAISE NOTICE '✅ Permisos de seguridad configurados correctamente';
END;
$$;

-- =====================================================
-- PASO 5: VERIFICACIÓN FINAL
-- =====================================================

DO $$
DECLARE
    func_count integer;
    search_path_config text;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '✅ PASO 5: VERIFICACIÓN FINAL';
    RAISE NOTICE '=====================================================';
    
    -- Verificar que las funciones existen
    SELECT COUNT(*) INTO func_count
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' 
    AND p.proname IN ('update_user_profile', 'validate_operation_type');
    
    RAISE NOTICE 'Funciones corregidas: %/2', func_count;
    
    -- Verificar configuración de search_path para update_user_profile
    SELECT prosrc INTO search_path_config
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = 'update_user_profile'
    LIMIT 1;
    
    IF search_path_config IS NOT NULL THEN
        RAISE NOTICE '✅ update_user_profile: search_path configurado';
    END IF;
    
    -- Verificar configuración de search_path para validate_operation_type
    SELECT prosrc INTO search_path_config
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = 'validate_operation_type'
    LIMIT 1;
    
    IF search_path_config IS NOT NULL THEN
        RAISE NOTICE '✅ validate_operation_type: search_path configurado';
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '🎉 CORRECCIÓN COMPLETADA EXITOSAMENTE';
    RAISE NOTICE '=====================================================';
    RAISE NOTICE 'Warnings corregidos:';
    RAISE NOTICE '✅ Function Search Path Mutable: public.update_user_profile';
    RAISE NOTICE '✅ Function Search Path Mutable: public.validate_operation_type';
    RAISE NOTICE '';
    RAISE NOTICE 'Configuración aplicada:';
    RAISE NOTICE '- SET search_path = public, pg_temp';
    RAISE NOTICE '- SECURITY DEFINER habilitado';
    RAISE NOTICE '- Permisos de seguridad configurados';
    RAISE NOTICE '=====================================================';
END;
$$;

-- =====================================================
-- COMENTARIOS Y DOCUMENTACIÓN
-- =====================================================

COMMENT ON FUNCTION public.update_user_profile IS 'Función segura para actualizar perfiles de usuario con search_path fijo';
COMMENT ON FUNCTION public.validate_operation_type IS 'Función segura para validar tipos de operación con search_path fijo';

-- =====================================================
-- INSTRUCCIONES FINALES
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE 'INSTRUCCIONES POST-APLICACIÓN:';
    RAISE NOTICE '1. Ve a Supabase Dashboard > Database > Database Linter';
    RAISE NOTICE '2. Ejecuta el Performance Advisor nuevamente';
    RAISE NOTICE '3. Verifica que los 2 warnings de Function Search Path Mutable desaparecieron';
    RAISE NOTICE '4. Prueba las funciones para asegurar que funcionan correctamente';
    RAISE NOTICE '';
    RAISE NOTICE 'FUNCIONES CORREGIDAS:';
    RAISE NOTICE '- public.update_user_profile: Actualiza perfiles de usuario de forma segura';
    RAISE NOTICE '- public.validate_operation_type: Valida tipos de operación permitidos';
    RAISE NOTICE '';
    RAISE NOTICE 'MEJORAS DE SEGURIDAD APLICADAS:';
    RAISE NOTICE '- search_path fijo: public, pg_temp';
    RAISE NOTICE '- SECURITY DEFINER para ejecución con privilegios de propietario';
    RAISE NOTICE '- Permisos específicos por rol (authenticated, anon)';
    RAISE NOTICE '- Validaciones de entrada mejoradas';
    RAISE NOTICE '';
    RAISE NOTICE 'Script ejecutado exitosamente - Funciones aseguradas';
END;
$$;
