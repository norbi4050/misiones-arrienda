-- =====================================================
-- CREAR DATOS DE PRUEBA PARA PERFIL DE USUARIO 2025
-- =====================================================
-- Script optimizado basado en auditoría real
-- Tu base de datos YA TIENE las tablas, solo agregamos datos

-- 1. CREAR PROPIEDADES DE EJEMPLO
INSERT INTO properties (id, title, description, price, location, "isPublished", "createdAt", "updatedAt")
VALUES 
  ('prop-centro-1', 'Apartamento Moderno Centro', 'Hermoso apartamento de 2 habitaciones en el centro de la ciudad con acabados de lujo', 1200000, 'Centro, Bogotá', true, NOW(), NOW()),
  ('prop-chapinero-1', 'Casa Familiar Chapinero', 'Casa espaciosa de 4 habitaciones perfecta para familias, con jardín y garaje', 2500000, 'Chapinero, Bogotá', true, NOW(), NOW()),
  ('prop-zona-rosa-1', 'Estudio Zona Rosa', 'Acogedor estudio completamente amoblado en la Zona Rosa, ideal para profesionales', 800000, 'Zona Rosa, Bogotá', true, NOW(), NOW()),
  ('prop-norte-1', 'Apartamento Norte', 'Moderno apartamento de 3 habitaciones en el norte de la ciudad', 1800000, 'Norte, Bogotá', true, NOW(), NOW()),
  ('prop-sur-1', 'Casa Sur Bogotá', 'Casa tradicional de 3 habitaciones en zona residencial tranquila', 1500000, 'Sur, Bogotá', true, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 2. CREAR FAVORITOS USANDO USUARIOS REALES
-- Primero obtenemos los IDs de usuarios reales
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
    
    -- Obtener propiedades
    SELECT ARRAY(SELECT id FROM properties LIMIT 5) INTO prop_ids;
    
    -- Crear favoritos para cada usuario con algunas propiedades
    FOR i IN 1..array_length(user_ids, 1) LOOP
        user_id := user_ids[i];
        
        -- Cada usuario tiene 2-3 favoritos
        FOR j IN 1..(2 + (i % 2)) LOOP
            IF j <= array_length(prop_ids, 1) THEN
                prop_id := prop_ids[j];
                
                INSERT INTO favorites (id, "userId", "propertyId", "createdAt")
                VALUES (
                    'fav-' || user_id || '-' || prop_id,
                    user_id,
                    prop_id,
                    NOW() - (random() * interval '30 days')
                )
                ON CONFLICT (id) DO NOTHING;
            END IF;
        END LOOP;
    END LOOP;
    
    RAISE NOTICE 'Favoritos creados para % usuarios', array_length(user_ids, 1);
END $$;

-- 3. AGREGAR MÁS VISTAS DE PERFIL
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
                -- Crear 1-3 vistas por par de usuarios
                FOR k IN 1..(1 + (i + j) % 3) LOOP
                    INSERT INTO profile_views (id, viewed_user_id, viewer_id, created_at)
                    VALUES (
                        gen_random_uuid(),
                        user_id,
                        viewer_id,
                        NOW() - (random() * interval '60 days')
                    );
                END LOOP;
            END IF;
        END LOOP;
    END LOOP;
    
    RAISE NOTICE 'Vistas de perfil agregadas';
END $$;

-- 4. AGREGAR MÁS MENSAJES
DO $$
DECLARE
    user_ids TEXT[];
    user_id TEXT;
    receiver_id TEXT;
    subjects TEXT[] := ARRAY[
        'Consulta sobre propiedad',
        'Información adicional',
        'Disponibilidad de inmueble',
        'Solicitud de visita',
        'Negociación de precio',
        'Condiciones de arrendamiento'
    ];
    messages TEXT[] := ARRAY[
        'Hola, me interesa conocer más detalles sobre la propiedad que tienes publicada.',
        'Buenos días, quisiera saber si la propiedad aún está disponible.',
        '¿Sería posible agendar una visita para ver el inmueble?',
        'Me gustaría conocer las condiciones de arrendamiento.',
        '¿Hay flexibilidad en el precio de arriendo?',
        'Excelente propiedad, me interesa mucho. ¿Podemos hablar?'
    ];
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
                -- Crear 1-2 mensajes por par
                FOR k IN 1..(1 + i % 2) LOOP
                    INSERT INTO user_messages (id, sender_id, receiver_id, subject, message, created_at, is_read)
                    VALUES (
                        gen_random_uuid(),
                        user_id,
                        receiver_id,
                        subjects[(i + j + k) % array_length(subjects, 1) + 1],
                        messages[(i + j + k) % array_length(messages, 1) + 1],
                        NOW() - (random() * interval '30 days'),
                        random() > 0.3  -- 70% de mensajes leídos
                    );
                END LOOP;
            END IF;
        END LOOP;
    END LOOP;
    
    RAISE NOTICE 'Mensajes agregados';
END $$;

-- 5. AGREGAR MÁS BÚSQUEDAS
DO $$
DECLARE
    user_ids TEXT[];
    user_id TEXT;
    search_queries TEXT[] := ARRAY[
        'apartamento centro',
        'casa familiar',
        'estudio zona rosa',
        'apartamento norte',
        'casa sur bogotá',
        'apartamento 2 habitaciones',
        'casa con jardín',
        'estudio amoblado',
        'apartamento moderno',
        'casa tradicional'
    ];
    search_filters JSONB[] := ARRAY[
        '{"price_max": 1500000, "location": "centro"}',
        '{"rooms_min": 3, "type": "casa"}',
        '{"price_max": 1000000, "location": "zona rosa"}',
        '{"price_min": 1000000, "price_max": 2000000}',
        '{"type": "casa", "location": "sur"}',
        '{"rooms": 2, "type": "apartamento"}',
        '{"features": ["jardín", "garaje"]}',
        '{"furnished": true, "type": "estudio"}',
        '{"style": "moderno", "price_max": 2000000}',
        '{"style": "tradicional", "rooms_min": 3}'
    ];
    i INTEGER;
    j INTEGER;
BEGIN
    -- Obtener usuarios reales
    SELECT ARRAY(SELECT id FROM "User" LIMIT 5) INTO user_ids;
    
    -- Crear búsquedas para cada usuario
    FOR i IN 1..array_length(user_ids, 1) LOOP
        user_id := user_ids[i];
        
        -- Cada usuario hace 3-5 búsquedas
        FOR j IN 1..(3 + i % 3) LOOP
            INSERT INTO user_searches (id, user_id, search_query, filters, created_at)
            VALUES (
                gen_random_uuid(),
                user_id,
                search_queries[(i + j) % array_length(search_queries, 1) + 1],
                search_filters[(i + j) % array_length(search_filters, 1) + 1],
                NOW() - (random() * interval '14 days')
            );
        END LOOP;
    END LOOP;
    
    RAISE NOTICE 'Búsquedas agregadas';
END $$;

-- 6. VERIFICAR RESULTADOS
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
    RAISE NOTICE 'DATOS DE PRUEBA CREADOS EXITOSAMENTE';
    RAISE NOTICE '=====================================================';
    RAISE NOTICE 'Profile Views: % registros', profile_views_count;
    RAISE NOTICE 'User Messages: % registros', user_messages_count;
    RAISE NOTICE 'User Searches: % registros', user_searches_count;
    RAISE NOTICE 'Properties: % registros', properties_count;
    RAISE NOTICE 'Favorites: % registros', favorites_count;
    RAISE NOTICE '=====================================================';
    RAISE NOTICE 'LISTO PARA TESTING CON DATOS REALES';
    RAISE NOTICE 'Usuario de prueba: cgonzalezarchilla@gmail.com';
    RAISE NOTICE '=====================================================';
END $$;

-- 7. MOSTRAR ESTADÍSTICAS POR USUARIO
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
