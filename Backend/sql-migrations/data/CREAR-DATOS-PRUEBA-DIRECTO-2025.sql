-- =====================================================
-- CREAR DATOS DE PRUEBA DIRECTO - 2025
-- =====================================================
-- Script simplificado que funciona con usuarios existentes

-- 1. OBTENER USUARIOS EXISTENTES Y CREAR DATOS
DO $$
DECLARE
    user_ids TEXT[];
    user1_id TEXT;
    user2_id TEXT;
BEGIN
    -- Obtener todos los IDs de usuarios existentes
    SELECT ARRAY(SELECT id FROM users ORDER BY created_at LIMIT 5) INTO user_ids;
    
    IF array_length(user_ids, 1) >= 1 THEN
        user1_id := user_ids[1];
        
        -- Si hay al menos 2 usuarios, usar el segundo, sino usar el mismo
        IF array_length(user_ids, 1) >= 2 THEN
            user2_id := user_ids[2];
        ELSE
            user2_id := user1_id;
        END IF;
        
        RAISE NOTICE 'Creando datos para usuarios: % y %', user1_id, user2_id;
        
        -- 2. CREAR VISTAS DE PERFIL
        INSERT INTO profile_views (viewer_user_id, viewed_user_id, session_id, user_agent, created_at)
        VALUES 
            (user1_id, user2_id, 'session-1', 'Chrome/120.0', NOW() - INTERVAL '5 days'),
            (user2_id, user1_id, 'session-2', 'Firefox/119.0', NOW() - INTERVAL '4 days'),
            (user1_id, user2_id, 'session-3', 'Safari/17.0', NOW() - INTERVAL '3 days'),
            (user2_id, user1_id, 'session-4', 'Edge/120.0', NOW() - INTERVAL '2 days'),
            (user1_id, user2_id, 'session-5', 'Chrome/121.0', NOW() - INTERVAL '1 day')
        ON CONFLICT (viewer_user_id, viewed_user_id, session_id) DO NOTHING;
        
        -- 3. CREAR BÚSQUEDAS
        INSERT INTO user_searches (user_id, search_query, filters_applied, results_count, created_at)
        VALUES 
            (user1_id, 'departamento 2 ambientes', '{"bedrooms": 2}'::jsonb, 15, NOW() - INTERVAL '3 days'),
            (user1_id, 'casa en alquiler', '{"type": "house"}'::jsonb, 8, NOW() - INTERVAL '2 days'),
            (user1_id, 'oficina centro', '{"type": "office"}'::jsonb, 12, NOW() - INTERVAL '1 day'),
            (user2_id, 'monoambiente', '{"bedrooms": 1}'::jsonb, 25, NOW() - INTERVAL '4 days'),
            (user2_id, 'casa con jardín', '{"features": ["garden"]}'::jsonb, 6, NOW() - INTERVAL '2 days')
        ON CONFLICT DO NOTHING;
        
        -- 4. CREAR MENSAJES
        INSERT INTO user_messages (sender_id, receiver_id, subject, message, created_at)
        VALUES 
            (user1_id, user2_id, 'Consulta propiedad', 'Hola, me interesa la propiedad', NOW() - INTERVAL '2 days'),
            (user2_id, user1_id, 'Re: Consulta', 'Te paso más información', NOW() - INTERVAL '1 day'),
            (user1_id, user2_id, 'Disponibilidad visita', '¿Podemos coordinar una visita?', NOW() - INTERVAL '12 hours'),
            (user2_id, user1_id, 'Re: Visita', 'Perfecto, te confirmo horario', NOW() - INTERVAL '6 hours')
        ON CONFLICT DO NOTHING;
        
        -- 5. CREAR ACTIVIDAD
        INSERT INTO user_activity_log (user_id, activity_type, activity_data, created_at)
        VALUES 
            (user1_id, 'profile_view', '{"viewed": "profile"}'::jsonb, NOW() - INTERVAL '3 days'),
            (user1_id, 'search_performed', '{"query": "departamento"}'::jsonb, NOW() - INTERVAL '2 days'),
            (user1_id, 'message_sent', '{"action": "message"}'::jsonb, NOW() - INTERVAL '1 day'),
            (user2_id, 'profile_updated', '{"fields": ["bio"]}'::jsonb, NOW() - INTERVAL '4 days'),
            (user2_id, 'message_sent', '{"action": "reply"}'::jsonb, NOW() - INTERVAL '12 hours')
        ON CONFLICT DO NOTHING;
        
        -- 6. CREAR RATINGS
        INSERT INTO user_ratings (rated_user_id, rater_user_id, rating, comment, is_public, created_at)
        VALUES 
            (user1_id, user2_id, 4.5, 'Muy buen usuario', true, NOW() - INTERVAL '1 week'),
            (user2_id, user1_id, 4.8, 'Excelente comunicación', true, NOW() - INTERVAL '5 days')
        ON CONFLICT (rated_user_id, rater_user_id, property_id) DO NOTHING;
        
        RAISE NOTICE 'Datos de prueba creados exitosamente';
        
    ELSE
        RAISE NOTICE 'No se encontraron usuarios. Creando usuario de prueba...';
        
        -- Crear usuario de prueba si no existe ninguno
        INSERT INTO users (id, email, full_name, created_at, updated_at)
        VALUES ('test-user-1', 'test@example.com', 'Usuario de Prueba', NOW(), NOW())
        ON CONFLICT (id) DO NOTHING;
        
        -- Crear datos para el usuario de prueba
        INSERT INTO profile_views (viewer_user_id, viewed_user_id, session_id, created_at)
        VALUES ('test-user-1', 'test-user-1', 'self-view', NOW() - INTERVAL '1 day')
        ON CONFLICT DO NOTHING;
        
        INSERT INTO user_searches (user_id, search_query, results_count, created_at)
        VALUES ('test-user-1', 'búsqueda de prueba', 10, NOW() - INTERVAL '1 day')
        ON CONFLICT DO NOTHING;
        
        RAISE NOTICE 'Usuario y datos de prueba creados';
    END IF;
END $$;

-- 2. VERIFICACIÓN INMEDIATA
SELECT 
    'DATOS CREADOS' as status,
    (SELECT COUNT(*) FROM profile_views) as vistas_perfil,
    (SELECT COUNT(*) FROM user_searches) as busquedas,
    (SELECT COUNT(*) FROM user_messages) as mensajes,
    (SELECT COUNT(*) FROM user_activity_log) as actividad,
    (SELECT COUNT(*) FROM user_ratings) as ratings;

-- 3. PROBAR FUNCIÓN get_user_stats
DO $$
DECLARE
    test_user_id TEXT;
    test_stats JSON;
BEGIN
    -- Obtener un usuario para probar
    SELECT id INTO test_user_id FROM users LIMIT 1;
    
    IF test_user_id IS NOT NULL THEN
        -- Probar la función
        SELECT get_user_stats(test_user_id) INTO test_stats;
        RAISE NOTICE 'Función get_user_stats funciona: %', test_stats;
    ELSE
        RAISE NOTICE 'No hay usuarios para probar la función';
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error probando función: %', SQLERRM;
END $$;

RAISE NOTICE '=== SCRIPT COMPLETADO ===';
RAISE NOTICE 'Ahora ejecuta: cd Backend && npm run dev';
RAISE NOTICE 'Luego: node Backend/test-perfil-datos-reales-2025.js';
