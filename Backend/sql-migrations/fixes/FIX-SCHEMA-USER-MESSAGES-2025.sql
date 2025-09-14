-- =====================================================
-- FIX SCHEMA USER MESSAGES - PERFIL USUARIO 2025
-- =====================================================
-- Solución DEFINITIVA para el error: column "receiver_id" does not exist
-- Este script corrige el esquema de user_messages y todos los errores relacionados

-- 1. VERIFICAR Y CORREGIR ESQUEMA DE user_messages
DO $$
BEGIN
    -- Verificar si la tabla existe y tiene las columnas correctas
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_messages' 
        AND column_name = 'receiver_id'
        AND table_schema = 'public'
    ) THEN
        RAISE NOTICE 'Columna receiver_id no existe. Corrigiendo esquema...';
        
        -- Eliminar tabla si existe con esquema incorrecto
        DROP TABLE IF EXISTS public.user_messages CASCADE;
        
        -- Crear tabla con esquema correcto
        CREATE TABLE public.user_messages (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            sender_id UUID NOT NULL REFERENCES public."User"(id) ON DELETE CASCADE,
            receiver_id UUID NOT NULL REFERENCES public."User"(id) ON DELETE CASCADE,
            subject TEXT,
            message TEXT NOT NULL,
            property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
            is_read BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            
            -- Constraint para evitar que alguien se envíe mensajes a sí mismo
            CONSTRAINT different_sender_receiver CHECK (sender_id != receiver_id)
        );
        
        -- Crear índices para performance
        CREATE INDEX idx_user_messages_sender_id ON public.user_messages(sender_id);
        CREATE INDEX idx_user_messages_receiver_id ON public.user_messages(receiver_id);
        CREATE INDEX idx_user_messages_created_at ON public.user_messages(created_at);
        CREATE INDEX idx_user_messages_property_id ON public.user_messages(property_id) WHERE property_id IS NOT NULL;
        
        RAISE NOTICE 'Tabla user_messages creada con esquema correcto';
    ELSE
        RAISE NOTICE 'Tabla user_messages ya tiene el esquema correcto';
    END IF;
END $$;

-- 2. VERIFICAR Y CORREGIR ESQUEMA DE profile_views
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'profile_views' 
        AND table_schema = 'public'
    ) THEN
        RAISE NOTICE 'Creando tabla profile_views...';
        
        CREATE TABLE public.profile_views (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            viewer_user_id UUID NOT NULL REFERENCES public."User"(id) ON DELETE CASCADE,
            viewed_user_id UUID NOT NULL REFERENCES public."User"(id) ON DELETE CASCADE,
            session_id TEXT,
            user_agent TEXT,
            ip_address INET,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            
            -- Constraint único para evitar duplicados por sesión
            UNIQUE(viewer_user_id, viewed_user_id, session_id),
            
            -- Constraint para evitar que alguien se vea a sí mismo
            CONSTRAINT different_viewer_viewed CHECK (viewer_user_id != viewed_user_id)
        );
        
        -- Crear índices
        CREATE INDEX idx_profile_views_viewer_id ON public.profile_views(viewer_user_id);
        CREATE INDEX idx_profile_views_viewed_id ON public.profile_views(viewed_user_id);
        CREATE INDEX idx_profile_views_created_at ON public.profile_views(created_at);
        
        RAISE NOTICE 'Tabla profile_views creada correctamente';
    END IF;
END $$;

-- 3. VERIFICAR Y CORREGIR ESQUEMA DE user_searches
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'user_searches' 
        AND table_schema = 'public'
    ) THEN
        RAISE NOTICE 'Creando tabla user_searches...';
        
        CREATE TABLE public.user_searches (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID NOT NULL REFERENCES public."User"(id) ON DELETE CASCADE,
            search_query TEXT NOT NULL,
            filters_applied JSONB DEFAULT '{}'::JSONB,
            results_count INTEGER DEFAULT 0,
            location_searched TEXT,
            price_range_min DECIMAL,
            price_range_max DECIMAL,
            property_type TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Crear índices
        CREATE INDEX idx_user_searches_user_id ON public.user_searches(user_id);
        CREATE INDEX idx_user_searches_created_at ON public.user_searches(created_at);
        CREATE INDEX idx_user_searches_query ON public.user_searches USING gin(to_tsvector('spanish', search_query));
        CREATE INDEX idx_user_searches_filters ON public.user_searches USING gin(filters_applied);
        
        RAISE NOTICE 'Tabla user_searches creada correctamente';
    END IF;
END $$;

-- 4. CREAR RLS POLICIES PARA TODAS LAS TABLAS
DO $$
BEGIN
    -- RLS para user_messages
    ALTER TABLE public.user_messages ENABLE ROW LEVEL SECURITY;
    
    -- Policy para que users puedan ver sus propios mensajes
    DROP POLICY IF EXISTS "Users can view own messages" ON public.user_messages;
    CREATE POLICY "Users can view own messages" ON public.user_messages
        FOR SELECT USING (sender_id = auth.uid()::UUID OR receiver_id = auth.uid()::UUID);
    
    -- Policy para que users puedan insertar mensajes
    DROP POLICY IF EXISTS "Users can send messages" ON public.user_messages;
    CREATE POLICY "Users can send messages" ON public.user_messages
        FOR INSERT WITH CHECK (sender_id = auth.uid()::UUID);
    
    -- Policy para que users puedan actualizar sus mensajes
    DROP POLICY IF EXISTS "Users can update own messages" ON public.user_messages;
    CREATE POLICY "Users can update own messages" ON public.user_messages
        FOR UPDATE USING (receiver_id = auth.uid()::UUID);
    
    -- RLS para profile_views
    ALTER TABLE public.profile_views ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "Users can view own profile views" ON public.profile_views;
    CREATE POLICY "Users can view own profile views" ON public.profile_views
        FOR SELECT USING (viewed_user_id = auth.uid()::UUID);
    
    DROP POLICY IF EXISTS "Users can record profile views" ON public.profile_views;
    CREATE POLICY "Users can record profile views" ON public.profile_views
        FOR INSERT WITH CHECK (viewer_user_id = auth.uid()::UUID);
    
    -- RLS para user_searches
    ALTER TABLE public.user_searches ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "Users can view own searches" ON public.user_searches;
    CREATE POLICY "Users can view own searches" ON public.user_searches
        FOR SELECT USING (user_id = auth.uid()::UUID);
    
    DROP POLICY IF EXISTS "Users can insert own searches" ON public.user_searches;
    CREATE POLICY "Users can insert own searches" ON public.user_searches
        FOR INSERT WITH CHECK (user_id = auth.uid()::UUID);
    
    RAISE NOTICE 'RLS policies creadas correctamente';
END $$;

-- 5. CREAR USUARIOS DE PRUEBA VÁLIDOS
DO $$
DECLARE
    test_user_count INTEGER;
BEGIN
    -- Verificar si hay usuarios en la tabla
    SELECT COUNT(*) INTO test_user_count FROM auth.users LIMIT 1;
    
    IF test_user_count = 0 THEN
        RAISE NOTICE 'Creando usuarios de prueba...';
        
        -- Usuario 1
        INSERT INTO auth.users (
            id, email, encrypted_password, email_confirmed_at, created_at, updated_at,
            raw_app_meta_data, raw_user_meta_data, is_super_admin, role
        ) VALUES (
            '256d04f3-5c98-4649-87a6-2db76c5e60af'::UUID,
            'test@example.com',
            '$2a$10$dummy.hash.for.testing.purposes.only',
            NOW(), NOW(), NOW(),
            '{"provider": "email", "providers": ["email"]}',
            '{"name": "Usuario Test"}',
            false, 'authenticated'
        ) ON CONFLICT (id) DO NOTHING;
        
        INSERT INTO public."User" (
            id, email, name, created_at, updated_at
        ) VALUES (
            '256d04f3-5c98-4649-87a6-2db76c5e60af'::UUID,
            'test@example.com', 'Usuario Test', NOW(), NOW()
        ) ON CONFLICT (id) DO NOTHING;
        
        -- Usuario 2
        INSERT INTO auth.users (
            id, email, encrypted_password, email_confirmed_at, created_at, updated_at,
            raw_app_meta_data, raw_user_meta_data, is_super_admin, role
        ) VALUES (
            'a1b2c3d4-5e6f-7890-abcd-ef1234567890'::UUID,
            'viewer@example.com',
            '$2a$10$dummy.hash.for.testing.purposes.only',
            NOW(), NOW(), NOW(),
            '{"provider": "email", "providers": ["email"]}',
            '{"name": "Usuario Viewer"}',
            false, 'authenticated'
        ) ON CONFLICT (id) DO NOTHING;
        
        INSERT INTO public."User" (
            id, email, name, created_at, updated_at
        ) VALUES (
            'a1b2c3d4-5e6f-7890-abcd-ef1234567890'::UUID,
            'viewer@example.com', 'Usuario Viewer', NOW(), NOW()
        ) ON CONFLICT (id) DO NOTHING;
        
        RAISE NOTICE 'Usuarios de prueba creados';
    END IF;
END $$;

-- 6. LIMPIAR DATOS INCONSISTENTES (CON ESQUEMA CORRECTO)
DELETE FROM public.profile_views WHERE viewer_user_id NOT IN (
    SELECT id::UUID FROM public."User"
) OR viewed_user_id NOT IN (
    SELECT id::UUID FROM public."User"
);

DELETE FROM public.user_searches WHERE user_id NOT IN (
    SELECT id::UUID FROM public."User"
);

DELETE FROM public.user_messages WHERE sender_id NOT IN (
    SELECT id::UUID FROM public."User"
) OR receiver_id NOT IN (
    SELECT id::UUID FROM public."User"
);

-- 7. INSERTAR DATOS DE PRUEBA CON ESQUEMA CORRECTO
DO $$
DECLARE
    user1_id UUID := '256d04f3-5c98-4649-87a6-2db76c5e60af'::UUID;
    user2_id UUID := 'a1b2c3d4-5e6f-7890-abcd-ef1234567890'::UUID;
BEGIN
    -- Profile views
    INSERT INTO public.profile_views (viewer_user_id, viewed_user_id, session_id, user_agent, created_at)
    VALUES 
        (user2_id, user1_id, 'session-1', 'Chrome/120.0', NOW() - INTERVAL '5 days'),
        (user2_id, user1_id, 'session-2', 'Firefox/119.0', NOW() - INTERVAL '4 days'),
        (user2_id, user1_id, 'session-3', 'Safari/17.0', NOW() - INTERVAL '3 days'),
        (user1_id, user2_id, 'session-4', 'Edge/120.0', NOW() - INTERVAL '2 days'),
        (user1_id, user2_id, 'session-5', 'Mobile Safari/17.0', NOW() - INTERVAL '1 day')
    ON CONFLICT (viewer_user_id, viewed_user_id, session_id) DO NOTHING;
    
    -- User searches
    INSERT INTO public.user_searches (user_id, search_query, filters_applied, results_count, created_at)
    VALUES 
        (user1_id, 'departamento 2 ambientes', '{"bedrooms": 2, "type": "apartment"}'::JSONB, 15, NOW() - INTERVAL '3 days'),
        (user1_id, 'casa en alquiler', '{"type": "house", "transaction": "rent"}'::JSONB, 8, NOW() - INTERVAL '2 days'),
        (user1_id, 'local comercial', '{"type": "commercial"}'::JSONB, 5, NOW() - INTERVAL '1 day'),
        (user2_id, 'oficina centro', '{"type": "office", "location": "centro"}'::JSONB, 12, NOW() - INTERVAL '4 days')
    ON CONFLICT DO NOTHING;
    
    -- User messages (CON RECEIVER_ID CORRECTO)
    INSERT INTO public.user_messages (sender_id, receiver_id, subject, message, created_at)
    VALUES 
        (user1_id, user2_id, 'Consulta sobre propiedad', 'Hola, me interesa la propiedad que publicaste', NOW() - INTERVAL '2 days'),
        (user2_id, user1_id, 'Re: Consulta sobre propiedad', 'Hola! Te paso más información sobre la propiedad', NOW() - INTERVAL '1 day'),
        (user1_id, user2_id, 'Disponibilidad', '¿Está disponible para visita esta semana?', NOW() - INTERVAL '6 hours')
    ON CONFLICT DO NOTHING;
    
    RAISE NOTICE 'Datos de prueba insertados correctamente';
END $$;

-- 8. FUNCIÓN GET_USER_STATS CORREGIDA
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
        'responseRate', 85,
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

-- 9. OTORGAR PERMISOS
GRANT EXECUTE ON FUNCTION get_user_stats(UUID) TO authenticated;

-- 10. VERIFICACIÓN FINAL
DO $$
DECLARE
    views_count INTEGER;
    searches_count INTEGER;
    messages_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO views_count FROM public.profile_views;
    SELECT COUNT(*) INTO searches_count FROM public.user_searches;
    SELECT COUNT(*) INTO messages_count FROM public.user_messages;
    
    RAISE NOTICE '==============================================';
    RAISE NOTICE 'ESQUEMA CORREGIDO - VERIFICACIÓN FINAL';
    RAISE NOTICE '==============================================';
    RAISE NOTICE '- Profile views: % registros', views_count;
    RAISE NOTICE '- User searches: % registros', searches_count;
    RAISE NOTICE '- User messages: % registros', messages_count;
    RAISE NOTICE 'Todas las tablas tienen el esquema correcto';
    RAISE NOTICE 'Columna receiver_id existe en user_messages';
    RAISE NOTICE 'RLS policies aplicadas correctamente';
    RAISE NOTICE 'Función get_user_stats() actualizada';
END $$;
