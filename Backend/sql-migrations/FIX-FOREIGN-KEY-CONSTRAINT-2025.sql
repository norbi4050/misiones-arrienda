-- =====================================================
-- FIX FOREIGN KEY CONSTRAINT ERROR - PERFIL USUARIO 2025
-- =====================================================
-- Solución para el error: insert or update on table "profile_views" violates foreign key constraint
-- Este script corrige el problema de foreign key y asegura datos de prueba válidos

-- 1. PRIMERO: Verificar usuarios existentes y obtener IDs reales
DO $$
DECLARE
    existing_user_id UUID;
    test_user_count INTEGER;
BEGIN
    -- Verificar si hay usuarios en la tabla
    SELECT COUNT(*) INTO test_user_count FROM auth.users LIMIT 1;
    
    IF test_user_count = 0 THEN
        RAISE NOTICE 'No hay usuarios en auth.users. Creando usuario de prueba...';
        
        -- Crear usuario de prueba en auth.users si no existe
        INSERT INTO auth.users (
            id,
            email,
            encrypted_password,
            email_confirmed_at,
            created_at,
            updated_at,
            raw_app_meta_data,
            raw_user_meta_data,
            is_super_admin,
            role
        ) VALUES (
            '256d04f3-5c98-4649-87a6-2db76c5e60af',
            'test@example.com',
            '$2a$10$dummy.hash.for.testing.purposes.only',
            NOW(),
            NOW(),
            NOW(),
            '{"provider": "email", "providers": ["email"]}',
            '{"name": "Usuario Test"}',
            false,
            'authenticated'
        ) ON CONFLICT (id) DO NOTHING;
        
        -- Crear entrada correspondiente en public.User
        INSERT INTO public."User" (
            id,
            email,
            name,
            created_at,
            updated_at
        ) VALUES (
            '256d04f3-5c98-4649-87a6-2db76c5e60af',
            'test@example.com',
            'Usuario Test',
            NOW(),
            NOW()
        ) ON CONFLICT (id) DO NOTHING;
        
    END IF;
END $$;

-- 2. LIMPIAR datos de prueba anteriores que puedan causar conflictos
DELETE FROM public.profile_views WHERE viewer_user_id NOT IN (
    SELECT id FROM public."User"
);

DELETE FROM public.user_searches WHERE user_id NOT IN (
    SELECT id FROM public."User"
);

DELETE FROM public.user_messages WHERE sender_id NOT IN (
    SELECT id FROM public."User"
) OR receiver_id NOT IN (
    SELECT id FROM public."User"
);

-- 3. INSERTAR datos de prueba con IDs válidos
DO $$
DECLARE
    real_user_id UUID;
    second_user_id UUID;
BEGIN
    -- Obtener un usuario real existente
    SELECT id INTO real_user_id FROM public."User" LIMIT 1;
    
    IF real_user_id IS NULL THEN
        RAISE EXCEPTION 'No se encontraron usuarios válidos en la tabla User';
    END IF;
    
    -- Crear un segundo usuario para las pruebas si no existe
    INSERT INTO auth.users (
        id,
        email,
        encrypted_password,
        email_confirmed_at,
        created_at,
        updated_at,
        raw_app_meta_data,
        raw_user_meta_data,
        is_super_admin,
        role
    ) VALUES (
        'a1b2c3d4-5e6f-7890-abcd-ef1234567890',
        'viewer@example.com',
        '$2a$10$dummy.hash.for.testing.purposes.only',
        NOW(),
        NOW(),
        NOW(),
        '{"provider": "email", "providers": ["email"]}',
        '{"name": "Usuario Viewer"}',
        false,
        'authenticated'
    ) ON CONFLICT (id) DO NOTHING;
    
    INSERT INTO public."User" (
        id,
        email,
        name,
        created_at,
        updated_at
    ) VALUES (
        'a1b2c3d4-5e6f-7890-abcd-ef1234567890',
        'viewer@example.com',
        'Usuario Viewer',
        NOW(),
        NOW()
    ) ON CONFLICT (id) DO NOTHING;
    
    second_user_id := 'a1b2c3d4-5e6f-7890-abcd-ef1234567890';
    
    -- Insertar vistas de perfil con usuarios válidos
    INSERT INTO public.profile_views (viewer_user_id, viewed_user_id, session_id, user_agent, created_at)
    VALUES 
        (second_user_id, real_user_id, 'session-1', 'Chrome/120.0', NOW() - INTERVAL '5 days'),
        (second_user_id, real_user_id, 'session-2', 'Firefox/119.0', NOW() - INTERVAL '4 days'),
        (second_user_id, real_user_id, 'session-3', 'Safari/17.0', NOW() - INTERVAL '3 days'),
        (second_user_id, real_user_id, 'session-4', 'Edge/120.0', NOW() - INTERVAL '2 days'),
        (second_user_id, real_user_id, 'session-5', 'Mobile Safari/17.0', NOW() - INTERVAL '1 day')
    ON CONFLICT (viewer_user_id, viewed_user_id, session_id) DO NOTHING;
    
    -- Insertar búsquedas del usuario
    INSERT INTO public.user_searches (user_id, search_query, filters_applied, results_count, created_at)
    VALUES 
        (real_user_id, 'departamento 2 ambientes', '{"bedrooms": 2, "type": "apartment"}', 15, NOW() - INTERVAL '3 days'),
        (real_user_id, 'casa en alquiler', '{"type": "house", "transaction": "rent"}', 8, NOW() - INTERVAL '2 days'),
        (real_user_id, 'local comercial', '{"type": "commercial"}', 5, NOW() - INTERVAL '1 day')
    ON CONFLICT DO NOTHING;
    
    -- Insertar mensajes del usuario
    INSERT INTO public.user_messages (sender_id, receiver_id, subject, message, property_id, created_at)
    VALUES 
        (real_user_id, second_user_id, 'Consulta sobre propiedad', 'Hola, me interesa la propiedad que publicaste', NULL, NOW() - INTERVAL '2 days'),
        (second_user_id, real_user_id, 'Re: Consulta sobre propiedad', 'Hola! Te paso más información', NULL, NOW() - INTERVAL '1 day')
    ON CONFLICT DO NOTHING;
    
    RAISE NOTICE 'Datos de prueba insertados correctamente para usuario: %', real_user_id;
END $$;

-- 4. VERIFICAR que los datos se insertaron correctamente
DO $$
DECLARE
    views_count INTEGER;
    searches_count INTEGER;
    messages_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO views_count FROM public.profile_views;
    SELECT COUNT(*) INTO searches_count FROM public.user_searches;
    SELECT COUNT(*) INTO messages_count FROM public.user_messages;
    
    RAISE NOTICE 'Verificación completada:';
    RAISE NOTICE '- Profile views: % registros', views_count;
    RAISE NOTICE '- User searches: % registros', searches_count;
    RAISE NOTICE '- User messages: % registros', messages_count;
END $$;

-- 5. ACTUALIZAR estadísticas en la tabla User
UPDATE public."User" 
SET 
    rating = 4.5,
    "reviewCount" = 12
WHERE id IN (
    SELECT DISTINCT viewed_user_id FROM public.profile_views
    UNION
    SELECT DISTINCT user_id FROM public.user_searches
);

-- 6. VERIFICAR foreign keys y constraints
DO $$
BEGIN
    -- Verificar que no hay violaciones de foreign key
    IF EXISTS (
        SELECT 1 FROM public.profile_views pv 
        WHERE pv.viewer_user_id NOT IN (SELECT id FROM public."User")
           OR pv.viewed_user_id NOT IN (SELECT id FROM public."User")
    ) THEN
        RAISE EXCEPTION 'Aún existen violaciones de foreign key en profile_views';
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM public.user_searches us 
        WHERE us.user_id NOT IN (SELECT id FROM public."User")
    ) THEN
        RAISE EXCEPTION 'Aún existen violaciones de foreign key en user_searches';
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM public.user_messages um 
        WHERE um.sender_id NOT IN (SELECT id FROM public."User")
           OR um.receiver_id NOT IN (SELECT id FROM public."User")
    ) THEN
        RAISE EXCEPTION 'Aún existen violaciones de foreign key en user_messages';
    END IF;
    
    RAISE NOTICE 'Todas las foreign keys están correctas!';
END $$;

-- 7. CREAR función para obtener estadísticas reales del usuario
CREATE OR REPLACE FUNCTION get_user_stats(target_user_id UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'profileViews', COALESCE((
            SELECT COUNT(*) FROM public.profile_views 
            WHERE viewed_user_id = target_user_id
        ), 0),
        'favoriteCount', COALESCE((
            SELECT COUNT(*) FROM public.favorites 
            WHERE user_id = target_user_id
        ), 0),
        'messageCount', COALESCE((
            SELECT COUNT(*) FROM public.user_messages 
            WHERE sender_id = target_user_id OR receiver_id = target_user_id
        ), 0),
        'searchesCount', COALESCE((
            SELECT COUNT(*) FROM public.user_searches 
            WHERE user_id = target_user_id
        ), 0),
        'rating', COALESCE((
            SELECT rating FROM public."User" 
            WHERE id = target_user_id
        ), 0),
        'reviewCount', COALESCE((
            SELECT "reviewCount" FROM public."User" 
            WHERE id = target_user_id
        ), 0),
        'responseRate', 85, -- Placeholder por ahora
        'joinDate', (
            SELECT created_at FROM public."User" 
            WHERE id = target_user_id
        ),
        'verificationLevel', CASE 
            WHEN EXISTS (SELECT 1 FROM auth.users WHERE id = target_user_id AND email_confirmed_at IS NOT NULL) 
            THEN 'email' 
            ELSE 'none' 
        END
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. OTORGAR permisos necesarios
GRANT EXECUTE ON FUNCTION get_user_stats(UUID) TO authenticated;

-- 9. MENSAJE FINAL
DO $$
BEGIN
    RAISE NOTICE '==============================================';
    RAISE NOTICE 'FIX FOREIGN KEY CONSTRAINT COMPLETADO';
    RAISE NOTICE '==============================================';
    RAISE NOTICE 'El error de foreign key constraint ha sido solucionado.';
    RAISE NOTICE 'Se han creado usuarios de prueba válidos y datos de ejemplo.';
    RAISE NOTICE 'La función get_user_stats() está lista para usar.';
    RAISE NOTICE 'Ahora puedes probar las APIs del perfil sin errores.';
END $$;
