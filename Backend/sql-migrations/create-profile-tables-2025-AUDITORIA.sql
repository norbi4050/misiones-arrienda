-- =====================================================
-- MIGRACIÓN COMPLETA PERFIL USUARIO - AUDITORÍA 2025
-- =====================================================
-- Fecha: Enero 2025
-- Propósito: Crear tablas para estadísticas reales del perfil
-- Reemplaza: Datos simulados con Math.random()

-- 1. TABLA PARA VISTAS DE PERFIL
-- =====================================================
CREATE TABLE IF NOT EXISTS profile_views (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    viewer_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    viewed_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT,
    referrer TEXT,
    session_id TEXT,
    
    -- Índices para performance
    CONSTRAINT unique_view_per_session UNIQUE(viewed_user_id, session_id, DATE(viewed_at))
);

-- Índices optimizados
CREATE INDEX IF NOT EXISTS idx_profile_views_viewed_user ON profile_views(viewed_user_id, viewed_at DESC);
CREATE INDEX IF NOT EXISTS idx_profile_views_viewer_user ON profile_views(viewer_user_id, viewed_at DESC);
CREATE INDEX IF NOT EXISTS idx_profile_views_date ON profile_views(DATE(viewed_at));

-- 2. TABLA PARA MENSAJES/CONVERSACIONES
-- =====================================================
CREATE TABLE IF NOT EXISTS user_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
    subject TEXT,
    message TEXT NOT NULL,
    message_type VARCHAR(50) DEFAULT 'inquiry', -- inquiry, response, follow_up
    is_read BOOLEAN DEFAULT FALSE,
    is_archived BOOLEAN DEFAULT FALSE,
    parent_message_id UUID REFERENCES user_messages(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Validaciones
    CONSTRAINT valid_message_length CHECK (LENGTH(message) >= 10 AND LENGTH(message) <= 5000),
    CONSTRAINT different_users CHECK (sender_id != recipient_id)
);

-- Índices para mensajes
CREATE INDEX IF NOT EXISTS idx_user_messages_recipient ON user_messages(recipient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_messages_sender ON user_messages(sender_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_messages_property ON user_messages(property_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_messages_unread ON user_messages(recipient_id, is_read, created_at DESC);

-- 3. TABLA PARA BÚSQUEDAS GUARDADAS
-- =====================================================
CREATE TABLE IF NOT EXISTS user_searches (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    search_name VARCHAR(100),
    search_criteria JSONB NOT NULL,
    location TEXT,
    min_price DECIMAL(12,2),
    max_price DECIMAL(12,2),
    property_type VARCHAR(50),
    bedrooms INTEGER,
    bathrooms INTEGER,
    min_area DECIMAL(8,2),
    max_area DECIMAL(8,2),
    amenities TEXT[],
    is_active BOOLEAN DEFAULT TRUE,
    alert_frequency VARCHAR(20) DEFAULT 'daily', -- immediate, daily, weekly, monthly
    last_alert_sent TIMESTAMP WITH TIME ZONE,
    results_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Validaciones
    CONSTRAINT valid_price_range CHECK (min_price IS NULL OR max_price IS NULL OR min_price <= max_price),
    CONSTRAINT valid_area_range CHECK (min_area IS NULL OR max_area IS NULL OR min_area <= max_area),
    CONSTRAINT valid_bedrooms CHECK (bedrooms IS NULL OR bedrooms >= 0),
    CONSTRAINT valid_bathrooms CHECK (bathrooms IS NULL OR bathrooms >= 0)
);

-- Índices para búsquedas
CREATE INDEX IF NOT EXISTS idx_user_searches_user ON user_searches(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_searches_active ON user_searches(user_id, is_active, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_searches_location ON user_searches(location) WHERE location IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_user_searches_criteria ON user_searches USING GIN(search_criteria);

-- 4. TABLA PARA CALIFICACIONES Y REVIEWS
-- =====================================================
CREATE TABLE IF NOT EXISTS user_ratings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    rater_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    rated_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review_title VARCHAR(200),
    review_text TEXT,
    interaction_type VARCHAR(50) DEFAULT 'rental', -- rental, sale, inquiry, general
    is_verified BOOLEAN DEFAULT FALSE,
    is_public BOOLEAN DEFAULT TRUE,
    helpful_votes INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Validaciones
    CONSTRAINT different_rating_users CHECK (rater_user_id != rated_user_id),
    CONSTRAINT valid_review_length CHECK (review_text IS NULL OR LENGTH(review_text) <= 2000),
    CONSTRAINT unique_rating_per_interaction UNIQUE(rater_user_id, rated_user_id, property_id, interaction_type)
);

-- Índices para ratings
CREATE INDEX IF NOT EXISTS idx_user_ratings_rated_user ON user_ratings(rated_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_ratings_rater_user ON user_ratings(rater_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_ratings_property ON user_ratings(property_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_ratings_public ON user_ratings(rated_user_id, is_public, rating DESC);

-- 5. TABLA PARA LOG DE ACTIVIDAD GENERAL
-- =====================================================
CREATE TABLE IF NOT EXISTS user_activity_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    activity_type VARCHAR(50) NOT NULL, -- login, profile_update, search, favorite, message, etc.
    activity_description TEXT,
    entity_type VARCHAR(50), -- property, user, search, etc.
    entity_id UUID,
    metadata JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Particionado por fecha para performance
    CONSTRAINT valid_activity_type CHECK (activity_type IN (
        'login', 'logout', 'profile_update', 'profile_view', 'search', 
        'favorite_add', 'favorite_remove', 'message_send', 'message_read',
        'property_view', 'property_contact', 'rating_give', 'rating_receive'
    ))
) PARTITION BY RANGE (created_at);

-- Crear particiones por mes (últimos 12 meses + futuro)
CREATE TABLE IF NOT EXISTS user_activity_log_2024_12 PARTITION OF user_activity_log
    FOR VALUES FROM ('2024-12-01') TO ('2025-01-01');
CREATE TABLE IF NOT EXISTS user_activity_log_2025_01 PARTITION OF user_activity_log
    FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');
CREATE TABLE IF NOT EXISTS user_activity_log_2025_02 PARTITION OF user_activity_log
    FOR VALUES FROM ('2025-02-01') TO ('2025-03-01');

-- Índices para activity log
CREATE INDEX IF NOT EXISTS idx_user_activity_log_user ON user_activity_log(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_activity_log_type ON user_activity_log(activity_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_activity_log_entity ON user_activity_log(entity_type, entity_id, created_at DESC);

-- 6. FUNCIÓN PARA OBTENER ESTADÍSTICAS REALES
-- =====================================================
CREATE OR REPLACE FUNCTION get_user_profile_stats(target_user_id UUID)
RETURNS JSON AS $$
DECLARE
    stats_result JSON;
    profile_views_count INTEGER;
    messages_count INTEGER;
    searches_count INTEGER;
    avg_rating DECIMAL(3,2);
    rating_count INTEGER;
    favorite_count INTEGER;
    activity_count INTEGER;
    join_date TIMESTAMP WITH TIME ZONE;
    verification_level TEXT;
BEGIN
    -- Obtener fecha de registro
    SELECT created_at INTO join_date
    FROM auth.users 
    WHERE id = target_user_id;
    
    -- Contar vistas de perfil (últimos 30 días)
    SELECT COUNT(*) INTO profile_views_count
    FROM profile_views 
    WHERE viewed_user_id = target_user_id 
    AND viewed_at >= NOW() - INTERVAL '30 days';
    
    -- Contar mensajes (enviados + recibidos, últimos 30 días)
    SELECT COUNT(*) INTO messages_count
    FROM user_messages 
    WHERE (sender_id = target_user_id OR recipient_id = target_user_id)
    AND created_at >= NOW() - INTERVAL '30 days';
    
    -- Contar búsquedas activas
    SELECT COUNT(*) INTO searches_count
    FROM user_searches 
    WHERE user_id = target_user_id 
    AND is_active = TRUE;
    
    -- Calcular rating promedio y cantidad
    SELECT 
        COALESCE(AVG(rating), 0)::DECIMAL(3,2),
        COUNT(*)
    INTO avg_rating, rating_count
    FROM user_ratings 
    WHERE rated_user_id = target_user_id 
    AND is_public = TRUE;
    
    -- Contar favoritos
    SELECT COUNT(*) INTO favorite_count
    FROM favorites 
    WHERE user_id = target_user_id;
    
    -- Contar actividad total (últimos 30 días)
    SELECT COUNT(*) INTO activity_count
    FROM user_activity_log 
    WHERE user_id = target_user_id 
    AND created_at >= NOW() - INTERVAL '30 days';
    
    -- Determinar nivel de verificación
    SELECT 
        CASE 
            WHEN email_confirmed_at IS NOT NULL AND phone_confirmed_at IS NOT NULL THEN 'full'
            WHEN phone_confirmed_at IS NOT NULL THEN 'phone'
            WHEN email_confirmed_at IS NOT NULL THEN 'email'
            ELSE 'none'
        END INTO verification_level
    FROM auth.users 
    WHERE id = target_user_id;
    
    -- Construir JSON resultado
    stats_result := json_build_object(
        'profileViews', profile_views_count,
        'messageCount', messages_count,
        'searchesCount', searches_count,
        'rating', avg_rating,
        'reviewCount', rating_count,
        'favoriteCount', favorite_count,
        'activityCount', activity_count,
        'joinDate', join_date,
        'verificationLevel', verification_level,
        'responseRate', CASE 
            WHEN messages_count > 0 THEN LEAST(95, 70 + (activity_count * 2))
            ELSE 0 
        END
    );
    
    RETURN stats_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. FUNCIÓN PARA REGISTRAR VISTA DE PERFIL
-- =====================================================
CREATE OR REPLACE FUNCTION log_profile_view(
    p_viewer_user_id UUID,
    p_viewed_user_id UUID,
    p_session_id TEXT DEFAULT NULL,
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
    -- No registrar auto-vistas
    IF p_viewer_user_id = p_viewed_user_id THEN
        RETURN FALSE;
    END IF;
    
    -- Insertar vista (ON CONFLICT para evitar duplicados por sesión/día)
    INSERT INTO profile_views (
        viewer_user_id, 
        viewed_user_id, 
        session_id, 
        ip_address, 
        user_agent
    ) VALUES (
        p_viewer_user_id, 
        p_viewed_user_id, 
        p_session_id, 
        p_ip_address, 
        p_user_agent
    ) ON CONFLICT (viewed_user_id, session_id, DATE(viewed_at)) DO NOTHING;
    
    -- Registrar en activity log
    INSERT INTO user_activity_log (
        user_id, 
        activity_type, 
        activity_description,
        entity_type,
        entity_id,
        ip_address,
        user_agent
    ) VALUES (
        p_viewer_user_id,
        'profile_view',
        'Viewed user profile',
        'user',
        p_viewed_user_id,
        p_ip_address,
        p_user_agent
    );
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. RLS (ROW LEVEL SECURITY) POLICIES
-- =====================================================

-- Profile Views
ALTER TABLE profile_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile views" ON profile_views
    FOR SELECT USING (viewed_user_id = auth.uid());

CREATE POLICY "Users can insert profile views" ON profile_views
    FOR INSERT WITH CHECK (viewer_user_id = auth.uid());

-- User Messages
ALTER TABLE user_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own messages" ON user_messages
    FOR SELECT USING (sender_id = auth.uid() OR recipient_id = auth.uid());

CREATE POLICY "Users can send messages" ON user_messages
    FOR INSERT WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Users can update their own messages" ON user_messages
    FOR UPDATE USING (sender_id = auth.uid() OR recipient_id = auth.uid());

-- User Searches
ALTER TABLE user_searches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own searches" ON user_searches
    FOR ALL USING (user_id = auth.uid());

-- User Ratings
ALTER TABLE user_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view public ratings" ON user_ratings
    FOR SELECT USING (is_public = TRUE OR rater_user_id = auth.uid() OR rated_user_id = auth.uid());

CREATE POLICY "Users can create ratings" ON user_ratings
    FOR INSERT WITH CHECK (rater_user_id = auth.uid());

CREATE POLICY "Users can update their own ratings" ON user_ratings
    FOR UPDATE USING (rater_user_id = auth.uid());

-- User Activity Log
ALTER TABLE user_activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own activity" ON user_activity_log
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "System can insert activity logs" ON user_activity_log
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- 9. TRIGGERS PARA MANTENER DATOS ACTUALIZADOS
-- =====================================================

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger a tablas relevantes
CREATE TRIGGER update_user_messages_updated_at 
    BEFORE UPDATE ON user_messages 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_searches_updated_at 
    BEFORE UPDATE ON user_searches 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_ratings_updated_at 
    BEFORE UPDATE ON user_ratings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 10. DATOS DE PRUEBA (OPCIONAL)
-- =====================================================

-- Insertar algunas vistas de perfil de ejemplo
-- (Solo ejecutar en desarrollo)
/*
INSERT INTO profile_views (viewer_user_id, viewed_user_id, session_id) 
SELECT 
    (SELECT id FROM auth.users LIMIT 1 OFFSET 0),
    (SELECT id FROM auth.users LIMIT 1 OFFSET 1),
    'session_' || generate_random_uuid()
FROM generate_series(1, 10);
*/

-- =====================================================
-- FIN DE MIGRACIÓN
-- =====================================================

-- Verificar que todo se creó correctamente
DO $$
BEGIN
    RAISE NOTICE 'Migración completada exitosamente!';
    RAISE NOTICE 'Tablas creadas: profile_views, user_messages, user_searches, user_ratings, user_activity_log';
    RAISE NOTICE 'Funciones creadas: get_user_profile_stats(), log_profile_view()';
    RAISE NOTICE 'RLS policies aplicadas correctamente';
    RAISE NOTICE 'Triggers configurados para updated_at';
END $$;
