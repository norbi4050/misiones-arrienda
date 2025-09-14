-- =====================================================
-- CREAR DATOS FINALES CORREGIDOS - 2025
-- =====================================================
-- Script que respeta TODOS los campos obligatorios de properties

-- 1. CREAR PROPIEDADES CON TODOS LOS CAMPOS OBLIGATORIOS
INSERT INTO properties (
    id, 
    title, 
    description, 
    price, 
    bedrooms,           -- NOT NULL
    bathrooms,          -- NOT NULL  
    area,               -- NOT NULL
    address,            -- NOT NULL
    city,               -- NOT NULL
    province,           -- NOT NULL
    postal_code,        -- NOT NULL
    property_type,      -- NOT NULL
    images,             -- NOT NULL
    amenities,          -- NOT NULL
    features,           -- NOT NULL
    user_id,            -- NOT NULL
    agent_id,           -- NOT NULL
    -- Campos opcionales con valores por defecto
    currency,
    garages,
    status,
    location,
    is_active,
    operation_type,
    created_at,
    updated_at
)
SELECT 
    'prop-centro-' || u.id as id,
    'Apartamento Centro ' || ROW_NUMBER() OVER() as title,
    'Hermoso apartamento en el centro de la ciudad con excelente ubicación' as description,
    1200000 as price,
    2 as bedrooms,
    1 as bathrooms,
    65.5 as area,
    'Calle 10 #15-' || (ROW_NUMBER() OVER() + 20) as address,
    'Bogotá' as city,
    'Cundinamarca' as province,
    '110111' as postal_code,
    'apartment' as property_type,
    'https://example.com/image1.jpg,https://example.com/image2.jpg' as images,
    'Ascensor, Portería, Parqueadero' as amenities,
    'Balcón, Cocina integral, Closets' as features,
    u.id as user_id,
    u.id as agent_id,
    -- Campos opcionales
    'COP' as currency,
    1 as garages,
    'AVAILABLE' as status,
    'Centro, Bogotá' as location,
    true as is_active,
    'rent' as operation_type,
    NOW() as created_at,
    NOW() as updated_at
FROM (SELECT id FROM "User" LIMIT 3) u
ON CONFLICT (id) DO NOTHING;

-- 2. CREAR MÁS PROPIEDADES CON VARIEDAD
INSERT INTO properties (
    id, title, description, price, bedrooms, bathrooms, area, 
    address, city, province, postal_code, property_type, 
    images, amenities, features, user_id, agent_id,
    currency, garages, status, location, is_active, operation_type,
    created_at, updated_at
)
SELECT 
    'prop-norte-' || u.id as id,
    'Casa Norte ' || ROW_NUMBER() OVER() as title,
    'Espaciosa casa familiar en zona residencial tranquila' as description,
    2500000 as price,
    3 as bedrooms,
    2 as bathrooms,
    120.0 as area,
    'Carrera 15 #80-' || (ROW_NUMBER() OVER() + 10) as address,
    'Bogotá' as city,
    'Cundinamarca' as province,
    '110221' as postal_code,
    'house' as property_type,
    'https://example.com/house1.jpg,https://example.com/house2.jpg' as images,
    'Jardín, Garaje, Zona BBQ' as amenities,
    'Patio, Cocina amplia, Estudio' as features,
    u.id as user_id,
    u.id as agent_id,
    'COP' as currency,
    2 as garages,
    'AVAILABLE' as status,
    'Norte, Bogotá' as location,
    true as is_active,
    'rent' as operation_type,
    NOW() as created_at,
    NOW() as updated_at
FROM (SELECT id FROM "User" OFFSET 1 LIMIT 2) u
ON CONFLICT (id) DO NOTHING;

-- 3. AGREGAR MÁS VISTAS DE PERFIL
DO $$
DECLARE
    user_ids TEXT[];
    user_id TEXT;
    viewer_id TEXT;
    i INTEGER;
    j INTEGER;
BEGIN
    SELECT ARRAY(SELECT id FROM "User" LIMIT 5) INTO user_ids;
    
    FOR i IN 1..array_length(user_ids, 1) LOOP
        user_id := user_ids[i];
        
        FOR j IN 1..array_length(user_ids, 1) LOOP
            viewer_id := user_ids[j];
            
            IF user_id != viewer_id THEN
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
                    'Hola, me interesa conocer más detalles sobre la propiedad.',
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
    i INTEGER;
    j INTEGER;
BEGIN
    SELECT ARRAY(SELECT id FROM "User" LIMIT 5) INTO user_ids;
    
    FOR i IN 1..array_length(user_ids, 1) LOOP
        user_id := user_ids[i];
        
        FOR j IN 1..3 LOOP
            INSERT INTO user_searches (id, user_id, search_query, filters, created_at)
            VALUES (
                gen_random_uuid(),
                user_id,
                CASE j 
                    WHEN 1 THEN 'apartamento centro'
                    WHEN 2 THEN 'casa norte'
                    ELSE 'estudio moderno'
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

-- 6. CREAR FAVORITOS CON PROPIEDADES REALES
DO $$
DECLARE
    user_ids TEXT[];
    prop_ids TEXT[];
    user_id TEXT;
    prop_id TEXT;
    i INTEGER;
    j INTEGER;
BEGIN
    SELECT ARRAY(SELECT id FROM "User" LIMIT 5) INTO user_ids;
    SELECT ARRAY(SELECT id FROM properties LIMIT 5) INTO prop_ids;
    
    IF array_length(prop_ids, 1) > 0 THEN
        FOR i IN 1..array_length(user_ids, 1) LOOP
            user_id := user_ids[i];
            
            FOR j IN 1..(1 + i % 2) LOOP
                IF j <= array_length(prop_ids, 1) THEN
                    prop_id := prop_ids[j];
                    
                    INSERT INTO favorites (id, "userId", "propertyId", "createdAt")
                    VALUES (
                        'fav-final-' || user_id || '-' || prop_id,
                        user_id,
                        prop_id,
                        NOW() - (random() * interval '20 days')
                    )
                    ON CONFLICT (id) DO NOTHING;
                END IF;
            END LOOP;
        END LOOP;
        
        RAISE NOTICE 'Favoritos creados exitosamente';
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
    RAISE NOTICE 'DATOS FINALES CREADOS EXITOSAMENTE';
    RAISE NOTICE '=====================================================';
    RAISE NOTICE 'Profile Views: % registros', profile_views_count;
    RAISE NOTICE 'User Messages: % registros', user_messages_count;
    RAISE NOTICE 'User Searches: % registros', user_searches_count;
    RAISE NOTICE 'Properties: % registros', properties_count;
    RAISE NOTICE 'Favorites: % registros', favorites_count;
    RAISE NOTICE '=====================================================';
    RAISE NOTICE 'PERFIL LISTO PARA TESTING CON DATOS REALES';
    RAISE NOTICE 'Usuario de prueba: cgonzalezarchilla@gmail.com';
    RAISE NOTICE '=====================================================';
END $$;

-- 8. MOSTRAR ESTADÍSTICAS FINALES POR USUARIO
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
