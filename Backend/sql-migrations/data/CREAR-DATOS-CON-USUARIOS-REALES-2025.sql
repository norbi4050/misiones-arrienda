-- =====================================================
-- CREAR DATOS CON USUARIOS REALES - 2025
-- =====================================================
-- Script final que usa la estructura real detectada

-- INFORMACIÓN DETECTADA:
-- - Tabla "User" (mayúscula): 5 usuarios ✅
-- - Tabla "users" (minúscula): 1 usuario ✅  
-- - Properties apunta a "users" (minúscula) y "agents"
-- - profile_views NO tiene columna "viewer_id"

-- 1. VERIFICAR ESTRUCTURA REAL DE profile_views
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'profile_views'
ORDER BY ordinal_position;

-- 2. AGREGAR MÁS VISTAS DE PERFIL (CON ESTRUCTURA CORRECTA)
DO $$
DECLARE
    user_ids TEXT[];
    user_id TEXT;
    i INTEGER;
BEGIN
    -- Usar tabla "User" (mayúscula) que tiene 5 usuarios
    SELECT ARRAY(SELECT id FROM "User" LIMIT 5) INTO user_ids;
    
    RAISE NOTICE 'Usuarios encontrados en tabla "User": %', array_length(user_ids, 1);
    
    -- Crear vistas de perfil (sin columna viewer_id que no existe)
    FOR i IN 1..array_length(user_ids, 1) LOOP
        user_id := user_ids[i];
        
        -- Crear 3-5 vistas por usuario
        FOR j IN 1..(3 + i % 3) LOOP
            INSERT INTO profile_views (id, viewed_user_id, created_at)
            VALUES (
                gen_random_uuid(),
                user_id,
                NOW() - (random() * interval '30 days')
            );
        END LOOP;
    END LOOP;
    
    RAISE NOTICE 'Vistas de perfil agregadas exitosamente';
END $$;

-- 3. AGREGAR MÁS MENSAJES
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
                INSERT INTO user_messages (id, sender_id, receiver_id, subject, message, created_at, is_read)
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

-- 4. AGREGAR MÁS BÚSQUEDAS
DO $$
DECLARE
    user_ids TEXT[];
    user_id TEXT;
    search_queries TEXT[] := ARRAY[
        'apartamento centro bogotá',
        'casa familiar norte',
        'estudio zona rosa',
        'apartamento 2 habitaciones',
        'casa con jardín',
        'estudio amoblado',
        'apartamento moderno',
        'casa tradicional'
    ];
    search_filters JSONB[] := ARRAY[
        '{"price_max": 1500000, "bedrooms": 2, "location": "centro"}',
        '{"price_max": 3000000, "bedrooms": 3, "location": "norte"}',
        '{"price_max": 1000000, "bedrooms": 1, "location": "zona rosa"}',
        '{"bedrooms": 2, "bathrooms": 1}',
        '{"features": ["jardín"], "bedrooms": 3}',
        '{"furnished": true, "bedrooms": 1}',
        '{"style": "moderno", "price_max": 2000000}',
        '{"style": "tradicional", "bedrooms": 3}'
    ];
    i INTEGER;
    j INTEGER;
BEGIN
    SELECT ARRAY(SELECT id FROM "User" LIMIT 5) INTO user_ids;
    
    FOR i IN 1..array_length(user_ids, 1) LOOP
        user_id := user_ids[i];
        
        -- Cada usuario hace 3-4 búsquedas
        FOR j IN 1..(3 + i % 2) LOOP
            INSERT INTO user_searches (id, user_id, search_query, filters, created_at)
            VALUES (
                gen_random_uuid(),
                user_id,
                search_queries[(i + j) % array_length(search_queries, 1) + 1],
                search_filters[(i + j) % array_length(search_filters, 1) + 1],
                NOW() - (random() * interval '7 days')
            );
        END LOOP;
    END LOOP;
    
    RAISE NOTICE 'Búsquedas agregadas exitosamente';
END $$;

-- 5. VERIFICAR RESULTADOS FINALES
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
    RAISE NOTICE 'DATOS CREADOS CON USUARIOS REALES - EXITOSO';
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
    RAISE NOTICE 'Las estadísticas ahora muestran números reales';
    RAISE NOTICE '=====================================================';
END $$;

-- 6. MOSTRAR ESTADÍSTICAS FINALES POR USUARIO
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

-- 7. PROBAR FUNCIÓN get_user_stats CON USUARIO REAL
DO $$
DECLARE
    sample_user_id TEXT;
    stats_result JSON;
BEGIN
    -- Obtener un usuario de muestra
    SELECT id INTO sample_user_id FROM "User" LIMIT 1;
    
    IF sample_user_id IS NOT NULL THEN
        -- Probar función get_user_stats
        BEGIN
            SELECT get_user_stats(sample_user_id) INTO stats_result;
            RAISE NOTICE 'Función get_user_stats funciona correctamente';
            RAISE NOTICE 'Estadísticas de muestra: %', stats_result;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Función get_user_stats no disponible o con error: %', SQLERRM;
        END;
    END IF;
END $$;
