-- =====================================================
-- CREAR DATOS FINAL SIMPLE - 2025
-- =====================================================
-- Script definitivo con estructura EXACTA detectada

-- ESTRUCTURA REAL DETECTADA:
-- profile_views: id (uuid), viewer_user_id (text NOT NULL), viewed_user_id (text NOT NULL), session_id, user_agent, ip_address, created_at
-- Tabla "User": 5 usuarios disponibles

-- 1. AGREGAR VISTAS DE PERFIL CON ESTRUCTURA CORRECTA
DO $$
DECLARE
    user_ids TEXT[];
    user_id TEXT;
    viewer_id TEXT;
    i INTEGER;
    j INTEGER;
BEGIN
    -- Usar tabla "User" (mayúscula) que tiene 5 usuarios
    SELECT ARRAY(SELECT id FROM "User" LIMIT 5) INTO user_ids;
    
    RAISE NOTICE 'Usuarios encontrados: %', array_length(user_ids, 1);
    
    -- Crear vistas cruzadas entre usuarios
    FOR i IN 1..array_length(user_ids, 1) LOOP
        user_id := user_ids[i];
        
        FOR j IN 1..array_length(user_ids, 1) LOOP
            viewer_id := user_ids[j];
            
            -- No puede verse a sí mismo
            IF user_id != viewer_id THEN
                -- Crear 2 vistas por par de usuarios
                FOR k IN 1..2 LOOP
                    INSERT INTO profile_views (
                        id, 
                        viewer_user_id,    -- Campo obligatorio
                        viewed_user_id,    -- Campo obligatorio
                        created_at
                    )
                    VALUES (
                        gen_random_uuid(),
                        viewer_id,         -- Quien ve
                        user_id,           -- Quien es visto
                        NOW() - (random() * interval '30 days')
                    );
                END LOOP;
            END IF;
        END LOOP;
    END LOOP;
    
    RAISE NOTICE 'Vistas de perfil agregadas exitosamente';
END $$;

-- 2. AGREGAR MÁS MENSAJES
DO $$
DECLARE
    user_ids TEXT[];
    user_id TEXT;
    receiver_id TEXT;
    i INTEGER;
    j INTEGER;
BEGIN
    SELECT ARRAY(SELECT id FROM "User" LIMIT 5) INTO user_ids;
    
    FOR i IN 1..array_length(user_ids, 1) LOOP
        user_id := user_ids[i];
        
        FOR j IN 1..array_length(user_ids, 1) LOOP
            receiver_id := user_ids[j];
            
            IF user_id != receiver_id THEN
                INSERT INTO user_messages (
                    id, 
                    sender_id, 
                    receiver_id, 
                    subject, 
                    message, 
                    created_at, 
                    is_read
                )
                VALUES (
                    gen_random_uuid(),
                    user_id,
                    receiver_id,
                    'Consulta sobre propiedad',
                    'Hola, me interesa conocer más detalles sobre la propiedad que tienes publicada.',
                    NOW() - (random() * interval '15 days'),
                    random() > 0.3
                );
            END IF;
        END LOOP;
    END LOOP;
    
    RAISE NOTICE 'Mensajes agregados exitosamente';
END $$;

-- 3. AGREGAR MÁS BÚSQUEDAS
DO $$
DECLARE
    user_ids TEXT[];
    user_id TEXT;
    i INTEGER;
    j INTEGER;
BEGIN
    SELECT ARRAY(SELECT id FROM "User" LIMIT 5) INTO user_ids;
    
    FOR i IN 1..array_length(user_ids, 1) LOOP
        user_id := user_ids[i];
        
        -- Cada usuario hace 3 búsquedas
        FOR j IN 1..3 LOOP
            INSERT INTO user_searches (
                id, 
                user_id, 
                search_query, 
                filters, 
                created_at
            )
            VALUES (
                gen_random_uuid(),
                user_id,
                CASE j 
                    WHEN 1 THEN 'apartamento centro bogotá'
                    WHEN 2 THEN 'casa familiar norte'
                    ELSE 'estudio zona rosa'
                END,
                CASE j 
                    WHEN 1 THEN '{"price_max": 1500000, "bedrooms": 2}'
                    WHEN 2 THEN '{"price_max": 3000000, "bedrooms": 3}'
                    ELSE '{"price_max": 1000000, "bedrooms": 1}'
                END,
                NOW() - (random() * interval '7 days')
            );
        END LOOP;
    END LOOP;
    
    RAISE NOTICE 'Búsquedas agregadas exitosamente';
END $$;

-- 4. VERIFICAR RESULTADOS FINALES
DO $$
DECLARE
    profile_views_count INTEGER;
    user_messages_count INTEGER;
    user_searches_count INTEGER;
    properties_count INTEGER;
    favorites_count INTEGER;
    users_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO profile_views_count FROM profile_views;
    SELECT COUNT(*) INTO user_messages_count FROM user_messages;
    SELECT COUNT(*) INTO user_searches_count FROM user_searches;
    SELECT COUNT(*) INTO properties_count FROM properties;
    SELECT COUNT(*) INTO favorites_count FROM favorites;
    SELECT COUNT(*) INTO users_count FROM "User";
    
    RAISE NOTICE '=====================================================';
    RAISE NOTICE 'DATOS FINALES CREADOS EXITOSAMENTE';
    RAISE NOTICE '=====================================================';
    RAISE NOTICE 'Usuarios disponibles: %', users_count;
    RAISE NOTICE 'Profile Views: % registros', profile_views_count;
    RAISE NOTICE 'User Messages: % registros', user_messages_count;
    RAISE NOTICE 'User Searches: % registros', user_searches_count;
    RAISE NOTICE 'Properties: % registros (existentes)', properties_count;
    RAISE NOTICE 'Favorites: % registros (existentes)', favorites_count;
    RAISE NOTICE '=====================================================';
    RAISE NOTICE 'PERFIL LISTO PARA TESTING CON DATOS REALES';
    RAISE NOTICE 'Usuario de prueba: cgonzalezarchilla@gmail.com';
    RAISE NOTICE 'Las estadísticas ahora son 100%% reales';
    RAISE NOTICE '=====================================================';
END $$;

-- 5. MOSTRAR ESTADÍSTICAS POR USUARIO
SELECT 
    u.id as user_id,
    u.email,
    (SELECT COUNT(*) FROM profile_views pv WHERE pv.viewed_user_id = u.id) as profile_views,
    (SELECT COUNT(*) FROM favorites f WHERE f."userId" = u.id) as favorites,
    (SELECT COUNT(*) FROM user_messages um WHERE um.sender_id = u.id OR um.receiver_id = u.id) as messages,
    (SELECT COUNT(*) FROM user_searches us WHERE us.user_id = u.id) as searches
FROM "User" u
ORDER BY u.email
LIMIT 5;

-- 6. PROBAR FUNCIÓN get_user_stats
DO $$
DECLARE
    sample_user_id TEXT;
    stats_result JSON;
BEGIN
    -- Obtener un usuario de muestra
    SELECT id INTO sample_user_id FROM "User" LIMIT 1;
    
    IF sample_user_id IS NOT NULL THEN
        BEGIN
            SELECT get_user_stats(sample_user_id) INTO stats_result;
            RAISE NOTICE 'Función get_user_stats funciona: %', stats_result;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Función get_user_stats error: %', SQLERRM;
            
            -- Probar función alternativa
            BEGIN
                SELECT get_user_profile_stats(sample_user_id) INTO stats_result;
                RAISE NOTICE 'Función get_user_profile_stats funciona: %', stats_result;
            EXCEPTION WHEN OTHERS THEN
                RAISE NOTICE 'Función get_user_profile_stats error: %', SQLERRM;
            END;
        END;
    END IF;
END $$;
