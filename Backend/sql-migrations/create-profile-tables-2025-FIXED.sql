-- =====================================================
-- MIGRACIÓN CORREGIDA: Tablas para Perfil de Usuario Real - 2025
-- =====================================================
-- Descripción: Crear tablas para tracking real de estadísticas del perfil
-- CORRECCIÓN: Usar TEXT en lugar de UUID para compatibilidad con tabla User existente
-- Fecha: 2025-01-XX
-- Autor: Sistema de Mejoras de Perfil

-- 1. TABLA: profile_views
-- Registra cada visualización del perfil de un usuario
CREATE TABLE IF NOT EXISTS profile_views (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    profile_user_id TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    viewer_user_id TEXT REFERENCES "User"(id) ON DELETE SET NULL, -- NULL si es anónimo
    viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT,
    referrer TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. TABLA: user_messages
-- Registra conversaciones/mensajes del usuario
CREATE TABLE IF NOT EXISTS user_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sender_id TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    recipient_id TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
    subject TEXT,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    message_type VARCHAR(50) DEFAULT 'inquiry', -- inquiry, response, follow_up
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. TABLA: user_searches
-- Registra búsquedas realizadas por el usuario
CREATE TABLE IF NOT EXISTS user_searches (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    search_query TEXT,
    filters JSONB, -- Almacena filtros aplicados (precio, ubicación, etc.)
    results_count INTEGER DEFAULT 0,
    clicked_property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
    search_type VARCHAR(50) DEFAULT 'general', -- general, saved, alert
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. TABLA: user_ratings
-- Sistema de calificaciones y reseñas
CREATE TABLE IF NOT EXISTS user_ratings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    rated_user_id TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    rater_user_id TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review TEXT,
    rating_type VARCHAR(50) DEFAULT 'general', -- general, landlord, tenant, communication
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(rated_user_id, rater_user_id, property_id) -- Evita ratings duplicados
);

-- 5. TABLA: user_activity_log
-- Log general de actividades del usuario
CREATE TABLE IF NOT EXISTS user_activity_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    activity_type VARCHAR(100) NOT NULL, -- profile_view, search, favorite_add, message_sent, etc.
    activity_data JSONB, -- Datos específicos de la actividad
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- ÍNDICES PARA OPTIMIZACIÓN
-- =====================================================

-- Índices para profile_views
CREATE INDEX IF NOT EXISTS idx_profile_views_profile_user_id ON profile_views(profile_user_id);
CREATE INDEX IF NOT EXISTS idx_profile_views_viewed_at ON profile_views(viewed_at);
CREATE INDEX IF NOT EXISTS idx_profile_views_viewer_user_id ON profile_views(viewer_user_id);

-- Índices para user_messages
CREATE INDEX IF NOT EXISTS idx_user_messages_sender_id ON user_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_user_messages_recipient_id ON user_messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_user_messages_created_at ON user_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_user_messages_is_read ON user_messages(is_read);

-- Índices para user_searches
CREATE INDEX IF NOT EXISTS idx_user_searches_user_id ON user_searches(user_id);
CREATE INDEX IF NOT EXISTS idx_user_searches_created_at ON user_searches(created_at);
CREATE INDEX IF NOT EXISTS idx_user_searches_search_type ON user_searches(search_type);

-- Índices para user_ratings
CREATE INDEX IF NOT EXISTS idx_user_ratings_rated_user_id ON user_ratings(rated_user_id);
CREATE INDEX IF NOT EXISTS idx_user_ratings_rater_user_id ON user_ratings(rater_user_id);
CREATE INDEX IF NOT EXISTS idx_user_ratings_rating ON user_ratings(rating);
CREATE INDEX IF NOT EXISTS idx_user_ratings_created_at ON user_ratings(created_at);

-- Índices para user_activity_log
CREATE INDEX IF NOT EXISTS idx_user_activity_log_user_id ON user_activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_log_activity_type ON user_activity_log(activity_type);
CREATE INDEX IF NOT EXISTS idx_user_activity_log_created_at ON user_activity_log(created_at);

-- =====================================================
-- POLÍTICAS RLS (Row Level Security)
-- =====================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE profile_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity_log ENABLE ROW LEVEL SECURITY;

-- POLÍTICAS para profile_views
CREATE POLICY "Users can view their own profile views" ON profile_views
    FOR SELECT USING (profile_user_id = auth.uid());

CREATE POLICY "Users can insert profile views" ON profile_views
    FOR INSERT WITH CHECK (true); -- Cualquiera puede registrar una vista

CREATE POLICY "Users can view profile views they made" ON profile_views
    FOR SELECT USING (viewer_user_id = auth.uid());

-- POLÍTICAS para user_messages
CREATE POLICY "Users can view their own messages" ON user_messages
    FOR SELECT USING (sender_id = auth.uid() OR recipient_id = auth.uid());

CREATE POLICY "Users can send messages" ON user_messages
    FOR INSERT WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Users can update their received messages" ON user_messages
    FOR UPDATE USING (recipient_id = auth.uid());

-- POLÍTICAS para user_searches
CREATE POLICY "Users can view their own searches" ON user_searches
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own searches" ON user_searches
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- POLÍTICAS para user_ratings
CREATE POLICY "Users can view ratings about them" ON user_ratings
    FOR SELECT USING (rated_user_id = auth.uid() OR rater_user_id = auth.uid());

CREATE POLICY "Users can create ratings" ON user_ratings
    FOR INSERT WITH CHECK (rater_user_id = auth.uid());

CREATE POLICY "Users can update their own ratings" ON user_ratings
    FOR UPDATE USING (rater_user_id = auth.uid());

-- POLÍTICAS para user_activity_log
CREATE POLICY "Users can view their own activity" ON user_activity_log
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own activity" ON user_activity_log
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- =====================================================
-- FUNCIONES AUXILIARES
-- =====================================================

-- Función para obtener estadísticas del perfil (CORREGIDA para TEXT)
CREATE OR REPLACE FUNCTION get_user_profile_stats(target_user_id TEXT)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'profile_views', (
            SELECT COUNT(*) FROM profile_views 
            WHERE profile_user_id = target_user_id
        ),
        'total_messages', (
            SELECT COUNT(*) FROM user_messages 
            WHERE sender_id = target_user_id OR recipient_id = target_user_id
        ),
        'sent_messages', (
            SELECT COUNT(*) FROM user_messages 
            WHERE sender_id = target_user_id
        ),
        'received_messages', (
            SELECT COUNT(*) FROM user_messages 
            WHERE recipient_id = target_user_id
        ),
        'unread_messages', (
            SELECT COUNT(*) FROM user_messages 
            WHERE recipient_id = target_user_id AND is_read = FALSE
        ),
        'total_searches', (
            SELECT COUNT(*) FROM user_searches 
            WHERE user_id = target_user_id
        ),
        'average_rating', (
            SELECT COALESCE(AVG(rating), 0) FROM user_ratings 
            WHERE rated_user_id = target_user_id
        ),
        'total_ratings', (
            SELECT COUNT(*) FROM user_ratings 
            WHERE rated_user_id = target_user_id
        ),
        'favorite_count', (
            SELECT COUNT(*) FROM favorites 
            WHERE user_id = target_user_id
        )
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para registrar actividad del usuario (CORREGIDA para TEXT)
CREATE OR REPLACE FUNCTION log_user_activity(
    p_user_id TEXT,
    p_activity_type VARCHAR(100),
    p_activity_data JSONB DEFAULT NULL,
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    activity_id UUID;
BEGIN
    INSERT INTO user_activity_log (
        user_id, 
        activity_type, 
        activity_data, 
        ip_address, 
        user_agent
    ) VALUES (
        p_user_id, 
        p_activity_type, 
        p_activity_data, 
        p_ip_address, 
        p_user_agent
    ) RETURNING id INTO activity_id;
    
    RETURN activity_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- TRIGGERS PARA ACTUALIZACIÓN AUTOMÁTICA
-- =====================================================

-- Trigger para actualizar updated_at en user_messages
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_messages_updated_at
    BEFORE UPDATE ON user_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_ratings_updated_at
    BEFORE UPDATE ON user_ratings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- COMENTARIOS EN TABLAS
-- =====================================================

COMMENT ON TABLE profile_views IS 'Registra visualizaciones del perfil de usuarios';
COMMENT ON TABLE user_messages IS 'Sistema de mensajería entre usuarios';
COMMENT ON TABLE user_searches IS 'Historial de búsquedas de usuarios';
COMMENT ON TABLE user_ratings IS 'Sistema de calificaciones y reseñas';
COMMENT ON TABLE user_activity_log IS 'Log general de actividades del usuario';

-- =====================================================
-- VERIFICACIÓN DE INSTALACIÓN
-- =====================================================

-- Verificar que todas las tablas se crearon correctamente
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profile_views') AND
       EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_messages') AND
       EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_searches') AND
       EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_ratings') AND
       EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_activity_log') THEN
        RAISE NOTICE 'ÉXITO: Todas las tablas del perfil se crearon correctamente con tipos TEXT compatibles';
    ELSE
        RAISE EXCEPTION 'ERROR: Algunas tablas no se crearon correctamente';
    END IF;
END $$;
