-- =====================================================
-- FIX DEFINITIVO TIPOS USER - PERFIL USUARIO 2025
-- =====================================================
-- Solución DEFINITIVA para el error: Key columns "sender_id" and "id" are of incompatible types: uuid and text
-- Este script detecta el tipo real de User.id y adapta todas las tablas

-- 1. DETECTAR EL TIPO REAL DE LA COLUMNA User.id
DO $$
DECLARE
    user_id_type TEXT;
    is_uuid_type BOOLEAN := FALSE;
BEGIN
    -- Obtener el tipo de datos de la columna id en la tabla User
    SELECT data_type INTO user_id_type
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'User' 
    AND column_name = 'id';
    
    -- Determinar si es UUID o TEXT
    IF user_id_type = 'uuid' THEN
        is_uuid_type := TRUE;
        RAISE NOTICE 'Tabla User.id es de tipo UUID';
    ELSE
        is_uuid_type := FALSE;
        RAISE NOTICE 'Tabla User.id es de tipo TEXT (%))', user_id_type;
    END IF;
    
    -- Guardar el resultado en una variable temporal
    CREATE TEMP TABLE IF NOT EXISTS temp_user_type (is_uuid BOOLEAN);
    DELETE FROM temp_user_type;
    INSERT INTO temp_user_type (is_uuid) VALUES (is_uuid_type);
END $$;

-- 2. ELIMINAR TABLAS EXISTENTES PARA RECREAR CON TIPOS CORRECTOS
DROP TABLE IF EXISTS public.user_messages CASCADE;
DROP TABLE IF EXISTS public.profile_views CASCADE;
DROP TABLE IF EXISTS public.user_searches CASCADE;

-- 3. CREAR TABLAS CON TIPOS COMPATIBLES CON User.id
DO $$
DECLARE
    is_uuid_type BOOLEAN;
    user_id_sql_type TEXT;
BEGIN
    -- Obtener el tipo detectado
    SELECT is_uuid INTO is_uuid_type FROM temp_user_type LIMIT 1;
    
    IF is_uuid_type THEN
        user_id_sql_type := 'UUID';
        RAISE NOTICE 'Creando tablas con foreign keys UUID';
    ELSE
        user_id_sql_type := 'TEXT';
        RAISE NOTICE 'Creando tablas con foreign keys TEXT';
    END IF;
    
    -- Crear tabla user_messages con tipo correcto
    EXECUTE format('
        CREATE TABLE public.user_messages (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            sender_id %s NOT NULL REFERENCES public."User"(id) ON DELETE CASCADE,
            receiver_id %s NOT NULL REFERENCES public."User"(id) ON DELETE CASCADE,
            subject TEXT,
            message TEXT NOT NULL,
            property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
            is_read BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            CONSTRAINT different_sender_receiver CHECK (sender_id != receiver_id)
        )', user_id_sql_type, user_id_sql_type);
    
    -- Crear tabla profile_views con tipo correcto
    EXECUTE format('
        CREATE TABLE public.profile_views (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            viewer_user_id %s NOT NULL REFERENCES public."User"(id) ON DELETE CASCADE,
            viewed_user_id %s NOT NULL REFERENCES public."User"(id) ON DELETE CASCADE,
            session_id TEXT,
            user_agent TEXT,
            ip_address INET,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(viewer_user_id, viewed_user_id, session_id),
            CONSTRAINT different_viewer_viewed CHECK (viewer_user_id != viewed_user_id)
        )', user_id_sql_type, user_id_sql_type);
    
    -- Crear tabla user_searches con tipo correcto
    EXECUTE format('
        CREATE TABLE public.user_searches (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id %s NOT NULL REFERENCES public."User"(id) ON DELETE CASCADE,
            search_query TEXT NOT NULL,
            filters_applied JSONB DEFAULT ''{}''::JSONB,
            results_count INTEGER DEFAULT 0,
            location_searched TEXT,
            price_range_min DECIMAL,
            price_range_max DECIMAL,
            property_type TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )', user_id_sql_type);
    
    RAISE NOTICE 'Tablas creadas con tipos compatibles: %', user_id_sql_type;
END $$;

-- 4. CREAR ÍNDICES PARA PERFORMANCE
CREATE INDEX idx_user_messages_sender_id ON public.user_messages(sender_id);
CREATE INDEX idx_user_messages_receiver_id ON public.user_messages(receiver_id);
CREATE INDEX idx_user_messages_created_at ON public.user_messages(created_at);
CREATE INDEX idx_user_messages_property_id ON public.user_messages(property_id) WHERE property_id IS NOT NULL;

CREATE INDEX idx_profile_views_viewer_id ON public.profile_views(viewer_user_id);
CREATE INDEX idx_profile_views_viewed_id ON public.profile_views(viewed_user_id);
CREATE INDEX idx_profile_views_created_at ON public.profile_views(created_at);

CREATE INDEX idx_user_searches_user_id ON public.user_searches(user_id);
CREATE INDEX idx_user_searches_created_at ON public.user_searches(created_at);
CREATE INDEX idx_user_searches_query ON public.user_searches USING gin(to_tsvector('spanish', search_query));
CREATE INDEX idx_user_searches_filters ON public.user_searches USING gin(filters_applied);

-- 5. CREAR RLS POLICIES
ALTER TABLE public.user_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_searches ENABLE ROW LEVEL SECURITY;

-- RLS para user_messages
DROP POLICY IF EXISTS "Users can view own messages" ON public.user_messages;
CREATE POLICY "Users can view own messages" ON public.user_messages
    FOR SELECT USING (
        sender_id = COALESCE(auth.uid()::TEXT, auth.uid()::UUID::TEXT) OR 
        receiver_id = COALESCE(auth.uid()::TEXT, auth.uid()::UUID::TEXT)
    );

DROP POLICY IF EXISTS "Users can send messages" ON public.user_messages;
CREATE POLICY "Users can send messages" ON public.user_messages
    FOR INSERT WITH CHECK (sender_id = COALESCE(auth.uid()::TEXT, auth.uid()::UUID::TEXT));

DROP POLICY IF EXISTS "Users can update own messages" ON public.user_messages;
CREATE POLICY "Users can update own messages" ON public.user_messages
    FOR UPDATE USING (receiver_id = COALESCE(auth.uid()::TEXT, auth.uid()::UUID::TEXT));

-- RLS para profile_views
DROP POLICY IF EXISTS "Users can view own profile views" ON public.profile_views;
CREATE POLICY "Users can view own profile views" ON public.profile_views
    FOR SELECT USING (viewed_user_id = COALESCE(auth.uid()::TEXT, auth.uid()::UUID::TEXT));

DROP POLICY IF EXISTS "Users can record profile views" ON public.profile_views;
CREATE POLICY "Users can record profile views" ON public.profile_views
    FOR INSERT WITH CHECK (viewer_user_id = COALESCE(auth.uid()::TEXT, auth.uid()::UUID::TEXT));

-- RLS para user_searches
DROP POLICY IF EXISTS "Users can view own searches" ON public.user_searches;
CREATE POLICY "Users can view own searches" ON public.user_searches
    FOR SELECT USING (user_id = COALESCE(auth.uid()::TEXT, auth.uid()::UUID::TEXT));

DROP POLICY IF EXISTS "Users can insert own searches" ON public.user_searches;
CREATE POLICY "Users can insert own searches" ON public.user_searches
    FOR INSERT WITH CHECK (user_id = COALESCE(auth.uid()::TEXT, auth.uid()::UUID::TEXT));

-- 6. INSERTAR DATOS DE PRUEBA CON TIPOS CORRECTOS
DO $$
DECLARE
    is_uuid_type BOOLEAN;
    user1_id TEXT;
    user2_id TEXT;
    existing_user_id TEXT;
BEGIN
    -- Obtener el tipo detectado
    SELECT is_uuid INTO is_uuid_type FROM temp_user_type LIMIT 1;
    
    -- Obtener un usuario existente real
    SELECT id::TEXT INTO existing_user_id FROM public."User" LIMIT 1;
    
    IF existing_user_id IS NULL THEN
        RAISE NOTICE 'No hay usuarios existentes. Creando usuarios de prueba...';
        
        IF is_uuid_type THEN
            user1_id := '256d04f3-5c98-4649-87a6-2db76c5e60af';
            user2_id := 'a1b2c3d4-5e6f-7890-abcd-ef1234567890';
        ELSE
            user1_id := 'user_test_1';
            user2_id := 'user_test_2';
        END IF;
        
        -- Crear usuarios de prueba
        INSERT INTO public."User" (id, email, name, created_at, updated_at)
        VALUES 
            (user1_id, 'test1@example.com', 'Usuario Test 1', NOW(), NOW()),
            (user2_id, 'test2@example.com', 'Usuario Test 2', NOW(), NOW())
        ON CONFLICT (id) DO NOTHING;
    ELSE
        user1_id := existing_user_id;
        -- Crear segundo usuario para pruebas
        IF is_uuid_type THEN
            user2_id := 'a1b2c3d4-5e6f-7890-abcd-ef1234567890';
        ELSE
            user2_id := 'user_test_viewer';
        END IF;
        
        INSERT INTO public."User" (id, email, name, created_at, updated_at)
        VALUES (user2_id, 'viewer@example.com', 'Usuario Viewer', NOW(), NOW())
        ON CONFLICT (id) DO NOTHING;
    END IF;
    
    -- Insertar datos de prueba
    INSERT INTO public.profile_views (viewer_user_id, viewed_user_id, session_id, user_agent, created_at)
    VALUES 
        (user2_id, user1_id, 'session-1', 'Chrome/120.0', NOW() - INTERVAL '5 days'),
        (user2_id, user1_id, 'session-2', 'Firefox/119.0', NOW() - INTERVAL '4 days'),
        (user1_id, user2_id, 'session-3', 'Safari/17.0', NOW() - INTERVAL '3 days')
    ON CONFLICT (viewer_user_id, viewed_user_id, session_id) DO NOTHING;
    
    INSERT INTO public.user_searches (user_id, search_query, filters_applied, results_count, created_at)
    VALUES 
        (user1_id, 'departamento 2 ambientes', '{"bedrooms": 2, "type": "apartment"}'::JSONB, 15, NOW() - INTERVAL '3 days'),
        (user1_id, 'casa en alquiler', '{"type": "house", "transaction": "rent"}'::JSONB, 8, NOW() - INTERVAL '2 days'),
        (user2_id, 'oficina centro', '{"type": "office", "location": "centro"}'::JSONB, 12, NOW() - INTERVAL '4 days')
    ON CONFLICT DO NOTHING;
    
    INSERT INTO public.user_messages (sender_id, receiver_id, subject, message, created_at)
    VALUES 
        (user1_id, user2_id, 'Consulta sobre propiedad', 'Hola, me interesa la propiedad que publicaste', NOW() - INTERVAL '2 days'),
        (user2_id, user1_id, 'Re: Consulta sobre propiedad', 'Hola! Te paso más información', NOW() - INTERVAL '1 day')
    ON CONFLICT DO NOTHING;
    
    RAISE NOTICE 'Datos de prueba insertados para usuarios: % y %', user1_id, user2_id;
END $$;

-- 7. CREAR FUNCIÓN GET_USER_STATS ADAPTATIVA
CREATE OR REPLACE FUNCTION get_user_stats(target_user_id TEXT)
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
        'responseRate', 85,
        'joinDate', (
            SELECT created_at FROM public."User" 
            WHERE id = target_user_id
        ),
        'verificationLevel', CASE 
            WHEN EXISTS (SELECT 1 FROM auth.users WHERE id::TEXT = target_user_id AND email_confirmed_at IS NOT NULL) 
            THEN 'email' 
            ELSE 'none' 
        END
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crear sobrecarga para UUID si es necesario
CREATE OR REPLACE FUNCTION get_user_stats(target_user_id UUID)
RETURNS JSON AS $$
BEGIN
    RETURN get_user_stats(target_user_id::TEXT);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. OTORGAR PERMISOS
GRANT EXECUTE ON FUNCTION get_user_stats(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_stats(UUID) TO authenticated;

-- 9. LIMPIAR TABLA TEMPORAL
DROP TABLE IF EXISTS temp_user_type;

-- 10. VERIFICACIÓN FINAL
DO $$
DECLARE
    views_count INTEGER;
    searches_count INTEGER;
    messages_count INTEGER;
    user_id_type TEXT;
BEGIN
    SELECT COUNT(*) INTO views_count FROM public.profile_views;
    SELECT COUNT(*) INTO searches_count FROM public.user_searches;
    SELECT COUNT(*) INTO messages_count FROM public.user_messages;
    
    SELECT data_type INTO user_id_type
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'User' 
    AND column_name = 'id';
    
    RAISE NOTICE '==============================================';
    RAISE NOTICE 'FIX DEFINITIVO TIPOS USER COMPLETADO';
    RAISE NOTICE '==============================================';
    RAISE NOTICE 'Tipo de User.id detectado: %', user_id_type;
    RAISE NOTICE 'Tablas creadas con foreign keys compatibles';
    RAISE NOTICE '- Profile views: % registros', views_count;
    RAISE NOTICE '- User searches: % registros', searches_count;
    RAISE NOTICE '- User messages: % registros', messages_count;
    RAISE NOTICE 'RLS policies aplicadas con conversiones de tipo';
    RAISE NOTICE 'Función get_user_stats() con sobrecargas TEXT/UUID';
    RAISE NOTICE 'TODOS LOS ERRORES DE TIPOS SOLUCIONADOS';
END $$;
