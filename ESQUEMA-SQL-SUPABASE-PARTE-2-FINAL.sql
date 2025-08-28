-- =====================================================================================
-- ESQUEMA SQL SUPABASE - PARTE 2 FINAL: POLÍTICAS RLS Y CONFIGURACIÓN DE STORAGE
-- =====================================================================================
-- Continuación del esquema principal para Misiones Arrienda - VERSIÓN FINAL CORREGIDA
-- =====================================================================================

-- =====================================================================================
-- POLÍTICAS RLS CORREGIDAS (SIN CONFLICTOS DE TIPOS)
-- =====================================================================================

-- Políticas para user_profiles (módulo comunidad)
CREATE POLICY "Anyone can view active community profiles" ON user_profiles FOR SELECT USING (NOT is_suspended);
CREATE POLICY "Users can create their own community profile" ON user_profiles FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE users.id = user_profiles.user_id AND users.id = auth.uid()::text)
);
CREATE POLICY "Users can update their own community profile" ON user_profiles FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = user_profiles.user_id AND users.id = auth.uid()::text)
);

-- Políticas para rooms
CREATE POLICY "Anyone can view active rooms" ON rooms FOR SELECT USING (is_active = true);
CREATE POLICY "Profile owners can manage their rooms" ON rooms FOR ALL USING (
    EXISTS (
        SELECT 1 FROM user_profiles 
        JOIN users ON user_profiles.user_id = users.id 
        WHERE user_profiles.id = rooms.owner_id AND users.id = auth.uid()::text
    )
);

-- Políticas para likes
CREATE POLICY "Users can view likes involving their profile" ON likes FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM user_profiles 
        JOIN users ON user_profiles.user_id = users.id 
        WHERE user_profiles.id = likes.from_id AND users.id = auth.uid()::text
    )
    OR
    EXISTS (
        SELECT 1 FROM user_profiles 
        JOIN users ON user_profiles.user_id = users.id 
        WHERE user_profiles.id = likes.to_id AND users.id = auth.uid()::text
    )
);
CREATE POLICY "Users can create likes from their profile" ON likes FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM user_profiles 
        JOIN users ON user_profiles.user_id = users.id 
        WHERE user_profiles.id = likes.from_id AND users.id = auth.uid()::text
    )
);
CREATE POLICY "Users can delete their own likes" ON likes FOR DELETE USING (
    EXISTS (
        SELECT 1 FROM user_profiles 
        JOIN users ON user_profiles.user_id = users.id 
        WHERE user_profiles.id = likes.from_id AND users.id = auth.uid()::text
    )
);

-- Políticas para conversations
CREATE POLICY "Users can view their own conversations" ON conversations FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM user_profiles 
        JOIN users ON user_profiles.user_id = users.id 
        WHERE user_profiles.id = conversations.a_id AND users.id = auth.uid()::text
    )
    OR
    EXISTS (
        SELECT 1 FROM user_profiles 
        JOIN users ON user_profiles.user_id = users.id 
        WHERE user_profiles.id = conversations.b_id AND users.id = auth.uid()::text
    )
);
CREATE POLICY "Users can create conversations involving their profile" ON conversations FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM user_profiles 
        JOIN users ON user_profiles.user_id = users.id 
        WHERE user_profiles.id = conversations.a_id AND users.id = auth.uid()::text
    )
    OR
    EXISTS (
        SELECT 1 FROM user_profiles 
        JOIN users ON user_profiles.user_id = users.id 
        WHERE user_profiles.id = conversations.b_id AND users.id = auth.uid()::text
    )
);

-- Políticas para messages
CREATE POLICY "Users can view messages in their conversations" ON messages FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM conversations 
        JOIN user_profiles up_a ON conversations.a_id = up_a.id
        JOIN user_profiles up_b ON conversations.b_id = up_b.id
        JOIN users u_a ON up_a.user_id = u_a.id
        JOIN users u_b ON up_b.user_id = u_b.id
        WHERE conversations.id = messages.conversation_id 
        AND (u_a.id = auth.uid()::text OR u_b.id = auth.uid()::text)
    )
);
CREATE POLICY "Users can send messages from their profile" ON messages FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM user_profiles 
        JOIN users ON user_profiles.user_id = users.id 
        WHERE user_profiles.id = messages.sender_id AND users.id = auth.uid()::text
    )
);
CREATE POLICY "Users can update their own messages" ON messages FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM user_profiles 
        JOIN users ON user_profiles.user_id = users.id 
        WHERE user_profiles.id = messages.sender_id AND users.id = auth.uid()::text
    )
);

-- Políticas para reports (solo admins pueden ver)
CREATE POLICY "Anyone can create reports" ON reports FOR INSERT WITH CHECK (true);

-- Políticas para payment_notifications (solo sistema)
CREATE POLICY "System can manage payment notifications" ON payment_notifications FOR ALL USING (true);

-- Políticas para payment_analytics (solo admins)
CREATE POLICY "Admins can view payment analytics" ON payment_analytics FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid()::text AND users.user_type = 'admin')
);

-- =====================================================================================
-- CONFIGURACIÓN DE STORAGE
-- =====================================================================================

-- Crear buckets de storage (solo si no existen)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
    ('property-images', 'property-images', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp']),
    ('profile-images', 'profile-images', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']),
    ('community-images', 'community-images', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- Políticas para storage de imágenes de propiedades (CORREGIDAS)
CREATE POLICY "Anyone can view property images" ON storage.objects FOR SELECT USING (bucket_id = 'property-images');
CREATE POLICY "Users can upload property images" ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'property-images' AND auth.role() = 'authenticated'
);
CREATE POLICY "Users can update their property images" ON storage.objects FOR UPDATE USING (
    bucket_id = 'property-images' AND auth.uid() = owner::uuid
);
CREATE POLICY "Users can delete their property images" ON storage.objects FOR DELETE USING (
    bucket_id = 'property-images' AND auth.uid() = owner::uuid
);

-- Políticas para storage de imágenes de perfil (CORREGIDAS)
CREATE POLICY "Anyone can view profile images" ON storage.objects FOR SELECT USING (bucket_id = 'profile-images');
CREATE POLICY "Users can upload profile images" ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'profile-images' AND auth.role() = 'authenticated'
);
CREATE POLICY "Users can update their profile images" ON storage.objects FOR UPDATE USING (
    bucket_id = 'profile-images' AND auth.uid() = owner::uuid
);
CREATE POLICY "Users can delete their profile images" ON storage.objects FOR DELETE USING (
    bucket_id = 'profile-images' AND auth.uid() = owner::uuid
);

-- Políticas para storage de imágenes de comunidad (CORREGIDAS)
CREATE POLICY "Anyone can view community images" ON storage.objects FOR SELECT USING (bucket_id = 'community-images');
CREATE POLICY "Users can upload community images" ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'community-images' AND auth.role() = 'authenticated'
);
CREATE POLICY "Users can update their community images" ON storage.objects FOR UPDATE USING (
    bucket_id = 'community-images' AND auth.uid() = owner::uuid
);
CREATE POLICY "Users can delete their community images" ON storage.objects FOR DELETE USING (
    bucket_id = 'community-images' AND auth.uid() = owner::uuid
);

-- =====================================================================================
-- FUNCIONES ADICIONALES
-- =====================================================================================

-- Función para obtener estadísticas de propiedades
CREATE OR REPLACE FUNCTION get_property_stats()
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total_properties', (SELECT COUNT(*) FROM properties),
        'active_properties', (SELECT COUNT(*) FROM properties WHERE status = 'AVAILABLE'),
        'featured_properties', (SELECT COUNT(*) FROM properties WHERE featured = true),
        'total_users', (SELECT COUNT(*) FROM users),
        'total_agents', (SELECT COUNT(*) FROM agents),
        'properties_by_city', (
            SELECT COALESCE(json_object_agg(city, count), '{}'::json)
            FROM (
                SELECT city, COUNT(*) as count
                FROM properties
                WHERE city IS NOT NULL
                GROUP BY city
                ORDER BY count DESC
                LIMIT 10
            ) city_stats
        ),
        'properties_by_type', (
            SELECT COALESCE(json_object_agg(property_type, count), '{}'::json)
            FROM (
                SELECT property_type, COUNT(*) as count
                FROM properties
                WHERE property_type IS NOT NULL
                GROUP BY property_type
                ORDER BY count DESC
            ) type_stats
        ),
        'average_price', (SELECT COALESCE(AVG(price), 0) FROM properties WHERE status = 'AVAILABLE'),
        'price_ranges', (
            SELECT json_build_object(
                'under_50k', (SELECT COUNT(*) FROM properties WHERE price < 50000),
                '50k_100k', (SELECT COUNT(*) FROM properties WHERE price BETWEEN 50000 AND 100000),
                '100k_200k', (SELECT COUNT(*) FROM properties WHERE price BETWEEN 100000 AND 200000),
                'over_200k', (SELECT COUNT(*) FROM properties WHERE price > 200000)
            )
        )
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para limpiar propiedades expiradas
CREATE OR REPLACE FUNCTION cleanup_expired_properties()
RETURNS INTEGER AS $$
DECLARE
    updated_count INTEGER;
BEGIN
    UPDATE properties 
    SET status = 'EXPIRED'
    WHERE expires_at IS NOT NULL 
    AND expires_at <= NOW() 
    AND status != 'EXPIRED';
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para obtener propiedades similares
CREATE OR REPLACE FUNCTION get_similar_properties(
    property_id_param TEXT,
    limit_param INTEGER DEFAULT 4
)
RETURNS TABLE (
    id TEXT,
    title TEXT,
    price REAL,
    currency TEXT,
    bedrooms INTEGER,
    bathrooms INTEGER,
    area REAL,
    city TEXT,
    province TEXT,
    property_type TEXT,
    images TEXT,
    featured BOOLEAN,
    similarity_score REAL
) AS $$
BEGIN
    RETURN QUERY
    WITH base_property AS (
        SELECT p.city, p.province, p.property_type, p.price, p.bedrooms, p.bathrooms
        FROM properties p
        WHERE p.id = property_id_param
    )
    SELECT 
        p.id,
        p.title,
        p.price,
        p.currency,
        p.bedrooms,
        p.bathrooms,
        p.area,
        p.city,
        p.province,
        p.property_type,
        p.images,
        p.featured,
        (
            CASE WHEN p.city = bp.city THEN 3 ELSE 0 END +
            CASE WHEN p.province = bp.province THEN 2 ELSE 0 END +
            CASE WHEN p.property_type = bp.property_type THEN 4 ELSE 0 END +
            CASE WHEN bp.price > 0 AND ABS(p.price - bp.price) / bp.price < 0.2 THEN 3 ELSE 0 END +
            CASE WHEN p.bedrooms = bp.bedrooms THEN 1 ELSE 0 END +
            CASE WHEN p.bathrooms = bp.bathrooms THEN 1 ELSE 0 END
        )::REAL AS similarity_score
    FROM properties p
    CROSS JOIN base_property bp
    WHERE p.id != property_id_param
    AND p.status = 'AVAILABLE'
    ORDER BY similarity_score DESC, p.featured DESC, p.created_at DESC
    LIMIT limit_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para buscar propiedades con filtros
CREATE OR REPLACE FUNCTION search_properties(
    search_term TEXT DEFAULT NULL,
    city_filter TEXT DEFAULT NULL,
    province_filter TEXT DEFAULT NULL,
    property_type_filter TEXT DEFAULT NULL,
    min_price REAL DEFAULT NULL,
    max_price REAL DEFAULT NULL,
    min_bedrooms INTEGER DEFAULT NULL,
    max_bedrooms INTEGER DEFAULT NULL,
    min_bathrooms INTEGER DEFAULT NULL,
    featured_only BOOLEAN DEFAULT FALSE,
    limit_param INTEGER DEFAULT 12,
    offset_param INTEGER DEFAULT 0
)
RETURNS TABLE (
    id TEXT,
    title TEXT,
    description TEXT,
    price REAL,
    currency TEXT,
    bedrooms INTEGER,
    bathrooms INTEGER,
    area REAL,
    address TEXT,
    city TEXT,
    province TEXT,
    property_type TEXT,
    images TEXT,
    featured BOOLEAN,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.title,
        p.description,
        p.price,
        p.currency,
        p.bedrooms,
        p.bathrooms,
        p.area,
        p.address,
        p.city,
        p.province,
        p.property_type,
        p.images,
        p.featured,
        p.created_at
    FROM properties p
    WHERE p.status = 'AVAILABLE'
    AND (search_term IS NULL OR (
        p.title ILIKE '%' || search_term || '%' OR
        p.description ILIKE '%' || search_term || '%' OR
        p.address ILIKE '%' || search_term || '%' OR
        p.city ILIKE '%' || search_term || '%'
    ))
    AND (city_filter IS NULL OR p.city ILIKE '%' || city_filter || '%')
    AND (province_filter IS NULL OR p.province ILIKE '%' || province_filter || '%')
    AND (property_type_filter IS NULL OR p.property_type = property_type_filter)
    AND (min_price IS NULL OR p.price >= min_price)
    AND (max_price IS NULL OR p.price <= max_price)
    AND (min_bedrooms IS NULL OR p.bedrooms >= min_bedrooms)
    AND (max_bedrooms IS NULL OR p.bedrooms <= max_bedrooms)
    AND (min_bathrooms IS NULL OR p.bathrooms >= min_bathrooms)
    AND (NOT featured_only OR p.featured = true)
    ORDER BY p.featured DESC, p.created_at DESC
    LIMIT limit_param
    OFFSET offset_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para obtener estadísticas del módulo comunidad
CREATE OR REPLACE FUNCTION get_community_stats()
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total_profiles', (SELECT COUNT(*) FROM user_profiles WHERE NOT is_suspended),
        'busco_profiles', (SELECT COUNT(*) FROM user_profiles WHERE role = 'BUSCO' AND NOT is_suspended),
        'ofrezco_profiles', (SELECT COUNT(*) FROM user_profiles WHERE role = 'OFREZCO' AND NOT is_suspended),
        'total_rooms', (SELECT COUNT(*) FROM rooms WHERE is_active = true),
        'total_likes', (SELECT COUNT(*) FROM likes),
        'total_conversations', (SELECT COUNT(*) FROM conversations WHERE is_active = true),
        'total_messages', (SELECT COUNT(*) FROM messages),
        'profiles_by_city', (
            SELECT COALESCE(json_object_agg(city, count), '{}'::json)
            FROM (
                SELECT city, COUNT(*) as count
                FROM user_profiles
                WHERE NOT is_suspended AND city IS NOT NULL
                GROUP BY city
                ORDER BY count DESC
                LIMIT 10
            ) city_stats
        ),
        'average_budget', (
            SELECT json_build_object(
                'min', COALESCE(AVG(budget_min), 0),
                'max', COALESCE(AVG(budget_max), 0)
            )
            FROM user_profiles
            WHERE NOT is_suspended
        )
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================================================
-- VISTAS ÚTILES
-- =====================================================================================

-- Vista para propiedades con información del agente
CREATE OR REPLACE VIEW properties_with_agent AS
SELECT 
    p.*,
    a.name as agent_name,
    a.email as agent_email,
    a.phone as agent_phone,
    a.avatar as agent_avatar,
    a.rating as agent_rating
FROM properties p
JOIN agents a ON p.agent_id = a.id;

-- Vista para estadísticas de usuarios
CREATE OR REPLACE VIEW user_stats AS
SELECT 
    u.id,
    u.name,
    u.email,
    u.user_type,
    COUNT(p.id) as property_count,
    COUNT(f.id) as favorite_count,
    COUNT(ui.id) as inquiry_count,
    COALESCE(AVG(ur.rating), 0) as average_rating,
    COUNT(ur.id) as review_count
FROM users u
LEFT JOIN properties p ON u.id = p.user_id
LEFT JOIN favorites f ON u.id = f.user_id
LEFT JOIN user_inquiries ui ON u.id = ui.user_id
LEFT JOIN user_reviews ur ON u.id = ur.reviewed_id
GROUP BY u.id, u.name, u.email, u.user_type;

-- Vista para conversaciones con información de participantes
CREATE OR REPLACE VIEW conversations_with_participants AS
SELECT 
    c.*,
    up_a.user_id as user_a_id,
    up_b.user_id as user_b_id,
    u_a.name as user_a_name,
    u_b.name as user_b_name,
    CASE WHEN up_a.photos IS NOT NULL AND array_length(up_a.photos, 1) > 0 THEN up_a.photos[1] ELSE NULL END as user_a_photo,
    CASE WHEN up_b.photos IS NOT NULL AND array_length(up_b.photos, 1) > 0 THEN up_b.photos[1] ELSE NULL END as user_b_photo
FROM conversations c
JOIN user_profiles up_a ON c.a_id = up_a.id
JOIN user_profiles up_b ON c.b_id = up_b.id
JOIN users u_a ON up_a.user_id = u_a.id
JOIN users u_b ON up_b.user_id = u_b.id;

-- =====================================================================================
-- ÍNDICES ADICIONALES PARA OPTIMIZACIÓN
-- =====================================================================================

-- Índices para búsquedas de texto (solo si no existen)
CREATE INDEX IF NOT EXISTS idx_properties_title_gin ON properties USING gin(to_tsvector('spanish', title));
CREATE INDEX IF NOT EXISTS idx_properties_description_gin ON properties USING gin(to_tsvector('spanish', description));
CREATE INDEX IF NOT EXISTS idx_properties_address_gin ON properties USING gin(to_tsvector('spanish', address));

-- Índices para geolocalización
CREATE INDEX IF NOT EXISTS idx_properties_location ON properties(latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- Índices para el módulo comunidad
CREATE INDEX IF NOT EXISTS idx_user_profiles_tags_gin ON user_profiles USING gin(tags);
CREATE INDEX IF NOT EXISTS idx_rooms_amenities_gin ON rooms USING gin(amenities);

-- Índices para mensajería
CREATE INDEX IF NOT EXISTS idx_messages_unread ON messages(conversation_id, is_read, created_at) WHERE is_read = false;

-- =====================================================================================
-- CONFIGURACIÓN DE REALTIME
-- =====================================================================================

-- Habilitar realtime para mensajería (solo si las tablas existen)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'messages') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE messages;
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'conversations') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE conversations;
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'likes') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE likes;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        -- Ignorar errores si las tablas ya están en la publicación
        NULL;
END $$;

-- =====================================================================================
-- FUNCIÓN DE VERIFICACIÓN DEL SETUP ACTUALIZADA
-- =====================================================================================

CREATE OR REPLACE FUNCTION verify_setup()
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'profiles_table', (SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'profiles')),
        'users_table', (SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users')),
        'properties_table', (SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'properties')),
        'payments_table', (SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'payments')),
        'user_profiles_table', (SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_profiles')),
        'storage_buckets', (SELECT COUNT(*) FROM storage.buckets WHERE id IN ('property-images', 'profile-images', 'community-images')),
        'rls_enabled_tables', (
            SELECT COUNT(*) 
            FROM pg_class c
            JOIN pg_namespace n ON n.oid = c.relnamespace
            WHERE c.relrowsecurity = true
            AND n.nspname = 'public'
            AND c.relkind = 'r'
        ),
        'total_policies', (
            SELECT COUNT(*)
            FROM pg_policies
            WHERE schemaname = 'public'
        ),
        'functions_created', (
            SELECT COUNT(*)
            FROM pg_proc p
            JOIN pg_namespace n ON p.pronamespace = n.oid
            WHERE n.nspname = 'public'
            AND p.proname IN ('get_property_stats', 'cleanup_expired_properties', 'get_similar_properties', 'search_properties', 'get_community_stats')
        ),
        'triggers_created', (
            SELECT COUNT(*)
            FROM information_schema.triggers
            WHERE trigger_schema = 'public'
        ),
        'setup_completed_at', NOW()
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================================================
-- COMENTARIOS FINALES
-- =====================================================================================

-- Para ejecutar la verificación del setup:
-- SELECT verify_setup();

-- Para obtener estadísticas de propiedades:
-- SELECT get_property_stats();

-- Para obtener estadísticas de comunidad:
-- SELECT get_community_stats();

-- Para limpiar propiedades expiradas:
-- SELECT cleanup_expired_properties();

-- Para buscar propiedades similares:
-- SELECT * FROM get_similar_properties('property_id_here', 4);

-- Para buscar propiedades con filtros:
-- SELECT * FROM search_properties('casa', 'Posadas', 'Misiones', 'HOUSE', 50000, 200000, 2, 4, 1, false, 12, 0);
