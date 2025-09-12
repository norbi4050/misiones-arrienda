-- =====================================================
-- DIAGNÓSTICO Y CORRECCIÓN - AUTH USUARIO 2025
-- =====================================================
-- Fecha: Enero 2025
-- Propósito: Diagnosticar y corregir problemas de autenticación
-- Problema: auth.uid() retorna NULL o usuario no existe

-- =====================================================
-- 1. DIAGNÓSTICO COMPLETO
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '=== DIAGNÓSTICO DE AUTENTICACIÓN ===';
    RAISE NOTICE 'Fecha: %', NOW();
    RAISE NOTICE '';
END $$;

-- Verificar usuario actual
SELECT 
    'USUARIO ACTUAL' as categoria,
    CASE 
        WHEN auth.uid() IS NULL THEN 'NO AUTENTICADO'
        ELSE 'AUTENTICADO: ' || auth.uid()::TEXT
    END as estado;

-- Verificar usuarios en auth.users
SELECT 
    'USUARIOS EN AUTH' as categoria,
    COUNT(*) as total_usuarios,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ HAY USUARIOS'
        ELSE '❌ NO HAY USUARIOS'
    END as estado
FROM auth.users;

-- Mostrar algunos usuarios (sin datos sensibles)
SELECT 
    'USUARIOS DISPONIBLES' as categoria,
    id,
    email,
    created_at,
    email_confirmed_at IS NOT NULL as email_confirmado
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 5;

-- =====================================================
-- 2. FUNCIÓN DE PRUEBA CON USUARIO ESPECÍFICO
-- =====================================================

CREATE OR REPLACE FUNCTION public.test_profile_stats_with_user(test_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    stats_result JSON;
    profile_views_count INTEGER := 0;
    messages_count INTEGER := 0;
    searches_count INTEGER := 0;
    favorite_count INTEGER := 0;
    join_date TIMESTAMP WITH TIME ZONE;
    verification_level TEXT := 'none';
BEGIN
    RAISE NOTICE 'Probando con usuario: %', test_user_id;
    
    -- Verificar que el usuario existe
    SELECT created_at INTO join_date
    FROM auth.users 
    WHERE id = test_user_id;
    
    IF join_date IS NULL THEN
        RETURN json_build_object('error', 'User not found', 'user_id', test_user_id);
    END IF;
    
    RAISE NOTICE 'Usuario encontrado, fecha de creación: %', join_date;
    
    -- Contar vistas de perfil (últimos 30 días)
    SELECT COUNT(*) INTO profile_views_count
    FROM public.profile_views 
    WHERE viewed_user_id = test_user_id 
    AND viewed_at >= CURRENT_TIMESTAMP - INTERVAL '30 days';
    
    RAISE NOTICE 'Vistas de perfil: %', profile_views_count;
    
    -- Contar mensajes (enviados + recibidos, últimos 30 días)
    SELECT COUNT(*) INTO messages_count
    FROM public.user_messages 
    WHERE (sender_id = test_user_id OR recipient_id = test_user_id)
    AND created_at >= CURRENT_TIMESTAMP - INTERVAL '30 days';
    
    RAISE NOTICE 'Mensajes: %', messages_count;
    
    -- Contar búsquedas activas
    SELECT COUNT(*) INTO searches_count
    FROM public.user_searches 
    WHERE user_id = test_user_id 
    AND is_active = TRUE;
    
    RAISE NOTICE 'Búsquedas: %', searches_count;
    
    -- Contar favoritos (intentar con diferentes nombres de tabla)
    BEGIN
        SELECT COUNT(*) INTO favorite_count
        FROM public.favorites 
        WHERE user_id = test_user_id;
        RAISE NOTICE 'Favoritos (tabla favorites): %', favorite_count;
    EXCEPTION WHEN undefined_table THEN
        BEGIN
            SELECT COUNT(*) INTO favorite_count
            FROM public.Favorite 
            WHERE userId = test_user_id;
            RAISE NOTICE 'Favoritos (tabla Favorite): %', favorite_count;
        EXCEPTION WHEN undefined_table THEN
            favorite_count := 0;
            RAISE NOTICE 'No se encontró tabla de favoritos, usando 0';
        END;
    END;
    
    -- Determinar nivel de verificación
    SELECT 
        CASE 
            WHEN email_confirmed_at IS NOT NULL AND phone_confirmed_at IS NOT NULL THEN 'full'
            WHEN phone_confirmed_at IS NOT NULL THEN 'phone'
            WHEN email_confirmed_at IS NOT NULL THEN 'email'
            ELSE 'none'
        END INTO verification_level
    FROM auth.users 
    WHERE id = test_user_id;
    
    RAISE NOTICE 'Nivel de verificación: %', verification_level;
    
    -- Construir JSON resultado
    stats_result := json_build_object(
        'profileViews', profile_views_count,
        'messageCount', messages_count,
        'searchesCount', searches_count,
        'rating', 0,
        'reviewCount', 0,
        'favoriteCount', favorite_count,
        'joinDate', join_date,
        'verificationLevel', verification_level,
        'responseRate', CASE WHEN messages_count > 0 THEN 85 ELSE 0 END,
        'user_id', test_user_id
    );
    
    RETURN stats_result;
END;
$$;

-- =====================================================
-- 3. FUNCIÓN PARA CREAR DATOS DE PRUEBA
-- =====================================================

CREATE OR REPLACE FUNCTION public.create_test_data_for_user(test_user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result_message TEXT := '';
BEGIN
    -- Verificar que el usuario existe
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = test_user_id) THEN
        RETURN 'ERROR: Usuario no existe en auth.users';
    END IF;
    
    -- Crear algunas vistas de perfil de prueba
    INSERT INTO public.profile_views (viewer_user_id, viewed_user_id, session_id, user_agent)
    VALUES 
        (test_user_id, test_user_id, 'test-session-1', 'Test Browser 1'),
        (test_user_id, test_user_id, 'test-session-2', 'Test Browser 2'),
        (test_user_id, test_user_id, 'test-session-3', 'Test Browser 3');
    
    result_message := result_message || '✅ 3 vistas de perfil creadas. ';
    
    -- Crear algunos mensajes de prueba
    INSERT INTO public.user_messages (sender_id, recipient_id, message)
    VALUES 
        (test_user_id, test_user_id, 'Mensaje de prueba 1'),
        (test_user_id, test_user_id, 'Mensaje de prueba 2');
    
    result_message := result_message || '✅ 2 mensajes creados. ';
    
    -- Crear algunas búsquedas de prueba
    INSERT INTO public.user_searches (user_id, search_name, search_criteria)
    VALUES 
        (test_user_id, 'Búsqueda Casa', '{"type": "house", "price_max": 100000}'),
        (test_user_id, 'Búsqueda Depto', '{"type": "apartment", "bedrooms": 2}');
    
    result_message := result_message || '✅ 2 búsquedas creadas. ';
    
    RETURN result_message || '🎉 Datos de prueba creados exitosamente!';
    
EXCEPTION WHEN OTHERS THEN
    RETURN 'ERROR: ' || SQLERRM;
END;
$$;

-- =====================================================
-- 4. EJECUTAR DIAGNÓSTICO AUTOMÁTICO
-- =====================================================

DO $$
DECLARE
    first_user_id UUID;
    test_result JSON;
    create_result TEXT;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '4. EJECUTANDO DIAGNÓSTICO AUTOMÁTICO...';
    
    -- Obtener el primer usuario disponible
    SELECT id INTO first_user_id 
    FROM auth.users 
    ORDER BY created_at DESC 
    LIMIT 1;
    
    IF first_user_id IS NOT NULL THEN
        RAISE NOTICE 'Usuario de prueba encontrado: %', first_user_id;
        
        -- Probar función con usuario específico
        SELECT public.test_profile_stats_with_user(first_user_id) INTO test_result;
        RAISE NOTICE 'Resultado de prueba: %', test_result;
        
        -- Crear datos de prueba
        SELECT public.create_test_data_for_user(first_user_id) INTO create_result;
        RAISE NOTICE '%', create_result;
        
        -- Probar función nuevamente después de crear datos
        SELECT public.test_profile_stats_with_user(first_user_id) INTO test_result;
        RAISE NOTICE 'Resultado después de crear datos: %', test_result;
        
    ELSE
        RAISE NOTICE '❌ No se encontraron usuarios en auth.users';
        RAISE NOTICE 'Necesitas estar autenticado o tener usuarios en la base de datos';
    END IF;
END $$;

-- =====================================================
-- 5. INSTRUCCIONES PARA EL USUARIO
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== INSTRUCCIONES PARA USAR ===';
    RAISE NOTICE '';
    RAISE NOTICE '1. Si ves "Usuario de prueba encontrado", todo está bien';
    RAISE NOTICE '2. Si ves "No se encontraron usuarios", necesitas:';
    RAISE NOTICE '   - Estar autenticado en Supabase Dashboard';
    RAISE NOTICE '   - O tener usuarios registrados en tu app';
    RAISE NOTICE '';
    RAISE NOTICE '3. Para probar con un usuario específico:';
    RAISE NOTICE '   SELECT public.test_profile_stats_with_user(''tu-user-id''::UUID);';
    RAISE NOTICE '';
    RAISE NOTICE '4. Para crear datos de prueba:';
    RAISE NOTICE '   SELECT public.create_test_data_for_user(''tu-user-id''::UUID);';
    RAISE NOTICE '';
    RAISE NOTICE '5. Para usar desde tu app (después de login):';
    RAISE NOTICE '   SELECT public.get_user_profile_stats(auth.uid()::UUID);';
    RAISE NOTICE '';
    RAISE NOTICE '=== FIN DEL DIAGNÓSTICO ===';
END $$;
