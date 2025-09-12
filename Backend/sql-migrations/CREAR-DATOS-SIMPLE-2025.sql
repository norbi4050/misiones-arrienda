-- =====================================================
-- CREAR DATOS SIMPLES PARA PERFIL - 2025
-- =====================================================
-- Script corregido que se adapta a la estructura real de tu base de datos

-- 1. PRIMERO VERIFICAR LA ESTRUCTURA DE LA TABLA PROPERTIES
DO $$
BEGIN
    RAISE NOTICE '=== VERIFICANDO ESTRUCTURA DE TABLA PROPERTIES ===';
END $$;

-- Mostrar columnas de la tabla properties
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'properties'
ORDER BY ordinal_position;

-- 2. CREAR PROPIEDADES CON ESTRUCTURA CORRECTA
-- Usamos solo las columnas que sabemos que existen
INSERT INTO properties (id, title, description, price, location)
VALUES 
  ('prop-centro-simple', 'Apartamento Centro', 'Apartamento moderno en el centro', 1200000, 'Centro, Bogotá'),
  ('prop-norte-simple', 'Casa Norte', 'Casa familiar en el norte', 2500000, 'Norte, Bogotá'),
  ('prop-sur-simple', 'Estudio Sur', 'Estudio acogedor', 800000, 'Sur, Bogotá')
ON CONFLICT (id) DO NOTHING;

-- 3. AGREGAR MÁS VISTAS DE PERFIL (esto sí sabemos que funciona)
DO $$
DECLARE
    user_ids TEXT[];
    user_id TEXT;
    viewer_id TEXT;
    i INTEGER;
    j INTEGER;
BEGIN
    -- Obtener usuarios reales
    SELECT ARRAY(SELECT id FROM "User" LIMIT 5) INTO user_ids;
    
    -- Crear vistas cruzadas entre usuarios
    FOR i IN 1..array_length(user_ids, 1) LOOP
        user_id := user_ids[i];
        
        FOR j IN 1..array_length(user_ids, 1) LOOP
            viewer_id := user_ids[j];
            
            -- No puede verse a sí mismo
            IF user_id != viewer_id THEN
                -- Crear 2 vistas por par de usuarios
                FOR k IN 1..2 LOOP
                    INSERT INTO profile_views (id, viewed_user_id, viewer_id, created_at)
                    VALUES (
                        gen_random_uuid(),
                        user_id,
                        viewer_id,
                        NOW() - (random() * interval '30 days')
                    );
                END LOOP;
            END IF;
        END LOOP;
    END LOOP;
    
    RAISE NOTICE 'Vistas de perfil agregadas exitosamente';
END $$;

-- 4. AGREGAR MÁS MENSAJES
DO $$
DECLARE
    user_ids TEXT[];
    user_id TEXT;
    receiver_id TEXT;
    i INTEGER;
    j INTEGER;
BEGIN
    -- Obtener usuarios reales
    SELECT ARRAY(SELECT id FROM "User" LIMIT 5) INTO user_ids;
    
    -- Crear mensajes entre usuarios
    FOR i IN 1..array_length(user_ids, 1) LOOP
        user_id := user_ids[i];
        
        FOR j IN 1..array_length(user_ids, 1) LOOP
            receiver_id := user_ids[j];
            
            -- No puede enviarse mensajes a sí mismo
            IF user_id != receiver_id THEN
                -- Crear 1 mensaje por par
                INSERT INTO user_messages (id, sender_id, receiver_id, subject, message, created_at, is_read)
                VALUES (
                    gen_random_uuid(),
                    user_id,
                    receiver_id,
                    'Consulta sobre propiedad',
                    'Hola, me interesa conocer más detalles.',
                    NOW() - (random() * interval '15 days'),
                    random() > 0.3
                );
            END IF;
        END LOOP;
    END LOOP;
    
    RAISE NOTICE 'Mensajes agregados exitosamente';
END $$;

-- 5. AGREGAR MÁS BÚSQUEDAS
DO $$
DECLARE
    user_ids TEXT[];
    user_id TEXT;
    search_queries TEXT[] := ARRAY[
        'apartamento centro',
        'casa familiar',
        'estudio moderno',
        'apartamento norte',
        'casa sur'
    ];
    search_filters JSONB[] := ARRAY[
        '{"price_max": 1500000}',
        '{"rooms_min": 3}',
        '{"price_max": 1000000}',
        '{"location": "norte"}',
        '{"location": "sur"}'
    ];
    i INTEGER;
    j INTEGER;
BEGIN
    -- Obtener usuarios reales
    SELECT ARRAY(SELECT id FROM "User" LIMIT 5) INTO user_ids;
    
    -- Crear búsquedas para cada usuario
    FOR i IN 1..array_length(user_ids, 1) LOOP
        user_id := user_ids[i];
        
        -- Cada usuario hace 2-3 búsquedas
        FOR j IN 1..(2 + i % 2) LOOP
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

-- 6. CREAR FAVORITOS USANDO PROPIEDADES EXISTENTES
DO $$
DECLARE
    user_ids TEXT[];
    prop_ids TEXT[];
    user_id TEXT;
    prop_id TEXT;
    i INTEGER;
    j INTEGER;
BEGIN
    -- Obtener usuarios reales
    SELECT ARRAY(SELECT id FROM "User" LIMIT 5) INTO user_ids;
    
    -- Obtener propiedades (las que acabamos de crear + las existentes)
    SELECT ARRAY(SELECT id FROM properties LIMIT 5) INTO prop_ids;
    
    -- Solo crear favoritos si hay propiedades
    IF array_length(prop_ids, 1) > 0 THEN
        -- Crear favoritos para cada usuario
        FOR i IN 1..array_length(user_ids, 1) LOOP
            user_id := user_ids[i];
            
            -- Cada usuario tiene 1-2 favoritos
            FOR j IN 1..(1 + i % 2) LOOP
                IF j <= array_length(prop_ids, 1) THEN
                    prop_id := prop_ids[j];
                    
                    INSERT INTO favorites (id, "userId", "propertyId", "createdAt")
                    VALUES (
                        'fav-simple-' || user_id || '-' || prop_id,
                        user_id,
                        prop_id,
                        NOW() - (random() * interval '20 days')
                    )
                    ON CONFLICT (id) DO NOTHING;
                END IF;
            END LOOP;
        END LOOP;
        
        RAISE NOTICE 'Favoritos creados exitosamente';
    ELSE
        RAISE NOTICE 'No hay propiedades disponibles para crear favoritos';
    END IF;
END $$;

-- 7. VERIFICAR RESULTADOS FINALES
DO $$
DECLARE
    profile_views_count INTEGER;
    user_messages_count INTEGER;
    user_searches_count INTEGER;
    properties_count INTEGER;
    favorites_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO profile_views_count FROM profile_views;
    SELECT COUNT(*) INTO user_messages_count FROM user_messages;
    SELECT COUNT(*) INTO user_searches_count FROM user_searches;
    SELECT COUNT(*) INTO properties_count FROM properties;
    SELECT COUNT(*) INTO favorites_count FROM favorites;
    
    RAISE NOTICE '=====================================================';
    RAISE NOTICE 'DATOS SIMPLES CREADOS EXITOSAMENTE';
    RAISE NOTICE '=====================================================';
    RAISE NOTICE 'Profile Views: % registros', profile_views_count;
    RAISE NOTICE 'User Messages: % registros', user_messages_count;
    RAISE NOTICE 'User Searches: % registros', user_searches_count;
    RAISE NOTICE 'Properties: % registros', properties_count;
    RAISE NOTICE 'Favorites: % registros', favorites_count;
    RAISE NOTICE '=====================================================';
    RAISE NOTICE 'LISTO PARA TESTING - ESTRUCTURA ADAPTADA';
    RAISE NOTICE '=====================================================';
END $$;

-- 8. MOSTRAR ESTADÍSTICAS POR USUARIO
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
