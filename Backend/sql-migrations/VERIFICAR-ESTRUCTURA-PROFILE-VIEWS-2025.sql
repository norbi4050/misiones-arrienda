-- =====================================================
-- VERIFICAR ESTRUCTURA Y CREAR DATOS CON USUARIOS REALES
-- =====================================================
-- Script que verifica qué tabla de usuarios usar y crea datos seguros

-- 1. VERIFICAR QUÉ TABLA DE USUARIOS EXISTE
DO $$
BEGIN
    RAISE NOTICE '=== VERIFICANDO TABLAS DE USUARIOS ===';
END $$;

-- Verificar tabla "User" (con mayúscula)
SELECT 
    'User (mayúscula)' as tabla,
    COUNT(*) as usuarios
FROM "User"
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'User');

-- Verificar tabla "users" (minúscula)  
SELECT 
    'users (minúscula)' as tabla,
    COUNT(*) as usuarios
FROM users
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users');

-- 2. VERIFICAR FOREIGN KEY CONSTRAINTS DE PROPERTIES
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name = 'properties'
    AND kcu.column_name IN ('user_id', 'agent_id');

-- 3. SOLO AGREGAR DATOS DEL PERFIL (SIN PROPIEDADES POR AHORA)
-- Esto es lo que sabemos que funciona

-- Agregar más vistas de perfil
DO $$
DECLARE
    user_ids TEXT[];
    user_id TEXT;
    viewer_id TEXT;
    i INTEGER;
    j INTEGER;
    user_table_name TEXT;
BEGIN
    -- Determinar qué tabla de usuarios usar
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'User') THEN
        user_table_name := '"User"';
        EXECUTE 'SELECT ARRAY(SELECT id FROM "User" LIMIT 5)' INTO user_ids;
    ELSIF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
        user_table_name := 'users';
        EXECUTE 'SELECT ARRAY(SELECT id FROM users LIMIT 5)' INTO user_ids;
    ELSE
        RAISE EXCEPTION 'No se encontró tabla de usuarios';
    END IF;
    
    RAISE NOTICE 'Usando tabla de usuarios: %', user_table_name;
    RAISE NOTICE 'Usuarios encontrados: %', array_length(user_ids, 1);
    
    -- Crear vistas cruzadas entre usuarios
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
    -- Usar la misma lógica para obtener usuarios
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'User') THEN
        SELECT ARRAY(SELECT id FROM "User" LIMIT 5) INTO user_ids;
    ELSE
        SELECT ARRAY(SELECT id FROM users LIMIT 5) INTO user_ids;
    END IF;
    
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
    -- Usar la misma lógica para obtener usuarios
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'User') THEN
        SELECT ARRAY(SELECT id FROM "User" LIMIT 5) INTO user_ids;
    ELSE
        SELECT ARRAY(SELECT id FROM users LIMIT 5) INTO user_ids;
    END IF;
    
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
    RAISE NOTICE 'DATOS DEL PERFIL AGREGADOS EXITOSAMENTE';
    RAISE NOTICE '=====================================================';
    RAISE NOTICE 'Profile Views: % registros', profile_views_count;
    RAISE NOTICE 'User Messages: % registros', user_messages_count;
    RAISE NOTICE 'User Searches: % registros', user_searches_count;
    RAISE NOTICE 'Properties: % registros (sin modificar)', properties_count;
    RAISE NOTICE 'Favorites: % registros (sin modificar)', favorites_count;
    RAISE NOTICE '=====================================================';
    RAISE NOTICE 'PERFIL LISTO PARA TESTING - SIN CREAR PROPIEDADES';
    RAISE NOTICE 'Las estadísticas del perfil ya tienen datos reales';
    RAISE NOTICE '=====================================================';
END $$;

-- 7. MOSTRAR ESTADÍSTICAS POR USUARIO
DO $$
DECLARE
    query_text TEXT;
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'User') THEN
        query_text := '
        SELECT 
            u.id as user_id,
            u.email,
            (SELECT COUNT(*) FROM profile_views pv WHERE pv.viewed_user_id = u.id) as profile_views,
            (SELECT COUNT(*) FROM favorites f WHERE f."userId" = u.id) as favorites,
            (SELECT COUNT(*) FROM user_messages um WHERE um.sender_id = u.id OR um.receiver_id = u.id) as messages,
            (SELECT COUNT(*) FROM user_searches us WHERE us.user_id = u.id) as searches
        FROM "User" u
        ORDER BY u.email
        LIMIT 5';
    ELSE
        query_text := '
        SELECT 
            u.id as user_id,
            u.email,
            (SELECT COUNT(*) FROM profile_views pv WHERE pv.viewed_user_id = u.id) as profile_views,
            (SELECT COUNT(*) FROM favorites f WHERE f."userId" = u.id) as favorites,
            (SELECT COUNT(*) FROM user_messages um WHERE um.sender_id = u.id OR um.receiver_id = u.id) as messages,
            (SELECT COUNT(*) FROM user_searches us WHERE us.user_id = u.id) as searches
        FROM users u
        ORDER BY u.email
        LIMIT 5';
    END IF;
    
    EXECUTE query_text;
END $$;
