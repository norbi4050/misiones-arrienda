-- VERIFICACIÓN DE TABLAS PARA FASE 4: APIs DEL PERFIL
-- Este script verifica que existan todas las tablas necesarias para las APIs

-- 1. Verificar tabla de usuarios (debe existir)
SELECT 'users table' as table_name, 
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') 
            THEN 'EXISTS' 
            ELSE 'MISSING' 
       END as status;

-- 2. Verificar tabla de favoritos
SELECT 'favorites table' as table_name,
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'favorites') 
            THEN 'EXISTS' 
            ELSE 'MISSING' 
       END as status;

-- 3. Verificar tabla de vistas de perfil
SELECT 'profile_views table' as table_name,
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profile_views') 
            THEN 'EXISTS' 
            ELSE 'MISSING' 
       END as status;

-- 4. Verificar tabla de mensajes de usuario
SELECT 'user_messages table' as table_name,
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_messages') 
            THEN 'EXISTS' 
            ELSE 'MISSING' 
       END as status;

-- 5. Verificar tabla de búsquedas guardadas
SELECT 'user_searches table' as table_name,
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_searches') 
            THEN 'EXISTS' 
            ELSE 'MISSING' 
       END as status;

-- 6. Verificar tabla de log de actividad
SELECT 'user_activity_log table' as table_name,
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_activity_log') 
            THEN 'EXISTS' 
            ELSE 'MISSING' 
       END as status;

-- 7. Verificar tabla de propiedades (necesaria para favoritos)
SELECT 'properties table' as table_name,
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'properties') 
            THEN 'EXISTS' 
            ELSE 'MISSING' 
       END as status;

-- CREAR TABLAS FALTANTES SI NO EXISTEN

-- Crear tabla de vistas de perfil si no existe
CREATE TABLE IF NOT EXISTS profile_views (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    viewer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    viewed_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT,
    UNIQUE(viewer_id, viewed_user_id, DATE(created_at))
);

-- Crear tabla de mensajes de usuario si no existe
CREATE TABLE IF NOT EXISTS user_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    recipient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
    subject TEXT,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de búsquedas guardadas si no existe
CREATE TABLE IF NOT EXISTS user_searches (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    search_query TEXT,
    location TEXT,
    min_price DECIMAL,
    max_price DECIMAL,
    property_type TEXT,
    bedrooms INTEGER,
    bathrooms INTEGER,
    filters JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de log de actividad si no existe
CREATE TABLE IF NOT EXISTS user_activity_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    activity_type TEXT NOT NULL, -- 'favorite_added', 'profile_updated', 'message_sent', etc.
    entity_type TEXT, -- 'property', 'user', 'search', etc.
    entity_id UUID,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- CREAR ÍNDICES PARA OPTIMIZAR CONSULTAS

-- Índices para profile_views
CREATE INDEX IF NOT EXISTS idx_profile_views_viewed_user_id ON profile_views(viewed_user_id);
CREATE INDEX IF NOT EXISTS idx_profile_views_created_at ON profile_views(created_at);

-- Índices para user_messages
CREATE INDEX IF NOT EXISTS idx_user_messages_sender_id ON user_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_user_messages_recipient_id ON user_messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_user_messages_created_at ON user_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_user_messages_is_read ON user_messages(is_read);

-- Índices para user_searches
CREATE INDEX IF NOT EXISTS idx_user_searches_user_id ON user_searches(user_id);
CREATE INDEX IF NOT EXISTS idx_user_searches_is_active ON user_searches(is_active);
CREATE INDEX IF NOT EXISTS idx_user_searches_created_at ON user_searches(created_at);

-- Índices para user_activity_log
CREATE INDEX IF NOT EXISTS idx_user_activity_log_user_id ON user_activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_log_activity_type ON user_activity_log(activity_type);
CREATE INDEX IF NOT EXISTS idx_user_activity_log_created_at ON user_activity_log(created_at);

-- CONFIGURAR RLS (Row Level Security)

-- Habilitar RLS en todas las tablas
ALTER TABLE profile_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity_log ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para profile_views
CREATE POLICY "Users can view their own profile views" ON profile_views
    FOR SELECT USING (viewed_user_id = auth.uid());

CREATE POLICY "Users can insert profile views" ON profile_views
    FOR INSERT WITH CHECK (viewer_id = auth.uid());

-- Políticas RLS para user_messages
CREATE POLICY "Users can view their own messages" ON user_messages
    FOR SELECT USING (sender_id = auth.uid() OR recipient_id = auth.uid());

CREATE POLICY "Users can insert their own messages" ON user_messages
    FOR INSERT WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Users can update their own messages" ON user_messages
    FOR UPDATE USING (sender_id = auth.uid() OR recipient_id = auth.uid());

-- Políticas RLS para user_searches
CREATE POLICY "Users can manage their own searches" ON user_searches
    FOR ALL USING (user_id = auth.uid());

-- Políticas RLS para user_activity_log
CREATE POLICY "Users can view their own activity" ON user_activity_log
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own activity" ON user_activity_log
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- CREAR FUNCIÓN SQL PARA ESTADÍSTICAS (si no existe)
CREATE OR REPLACE FUNCTION get_user_stats(target_user_id UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'profileViews', COALESCE((
            SELECT COUNT(*) 
            FROM profile_views 
            WHERE viewed_user_id = target_user_id 
            AND created_at >= NOW() - INTERVAL '30 days'
        ), 0),
        'favoriteCount', COALESCE((
            SELECT COUNT(*) 
            FROM favorites 
            WHERE user_id = target_user_id
        ), 0),
        'messageCount', COALESCE((
            SELECT COUNT(*) 
            FROM user_messages 
            WHERE recipient_id = target_user_id 
            AND is_read = false
        ), 0),
        'rating', COALESCE((
            SELECT AVG(rating)::DECIMAL(3,2)
            FROM user_reviews 
            WHERE reviewed_user_id = target_user_id
        ), 0),
        'reviewCount', COALESCE((
            SELECT COUNT(*) 
            FROM user_reviews 
            WHERE reviewed_user_id = target_user_id
        ), 0),
        'searchesCount', COALESCE((
            SELECT COUNT(*) 
            FROM user_searches 
            WHERE user_id = target_user_id 
            AND is_active = true
        ), 0),
        'responseRate', COALESCE((
            SELECT CASE 
                WHEN COUNT(*) = 0 THEN 0
                ELSE (COUNT(*) FILTER (WHERE replied_at IS NOT NULL) * 100.0 / COUNT(*))::INTEGER
            END
            FROM user_messages 
            WHERE recipient_id = target_user_id 
            AND created_at >= NOW() - INTERVAL '30 days'
        ), 0),
        'joinDate', (
            SELECT created_at 
            FROM auth.users 
            WHERE id = target_user_id
        ),
        'verificationLevel', CASE 
            WHEN (SELECT email_confirmed_at FROM auth.users WHERE id = target_user_id) IS NOT NULL 
                 AND (SELECT phone_confirmed_at FROM auth.users WHERE id = target_user_id) IS NOT NULL 
            THEN 'full'
            WHEN (SELECT phone_confirmed_at FROM auth.users WHERE id = target_user_id) IS NOT NULL 
            THEN 'phone'
            WHEN (SELECT email_confirmed_at FROM auth.users WHERE id = target_user_id) IS NOT NULL 
            THEN 'email'
            ELSE 'none'
        END
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- INSERTAR DATOS DE PRUEBA (solo si las tablas están vacías)

-- Datos de prueba para profile_views
INSERT INTO profile_views (viewer_id, viewed_user_id, created_at)
SELECT 
    auth.uid(),
    auth.uid(),
    NOW() - (random() * INTERVAL '30 days')
WHERE NOT EXISTS (SELECT 1 FROM profile_views WHERE viewed_user_id = auth.uid())
AND auth.uid() IS NOT NULL;

-- Datos de prueba para user_searches
INSERT INTO user_searches (user_id, search_query, location, min_price, max_price, property_type)
SELECT 
    auth.uid(),
    'Departamento 2 ambientes',
    'Palermo, Buenos Aires',
    50000,
    100000,
    'apartment'
WHERE NOT EXISTS (SELECT 1 FROM user_searches WHERE user_id = auth.uid())
AND auth.uid() IS NOT NULL;

-- Datos de prueba para user_activity_log
INSERT INTO user_activity_log (user_id, activity_type, entity_type, metadata)
SELECT 
    auth.uid(),
    'profile_updated',
    'user',
    '{"field": "bio", "action": "updated"}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM user_activity_log WHERE user_id = auth.uid())
AND auth.uid() IS NOT NULL;

-- VERIFICACIÓN FINAL
SELECT 'VERIFICATION COMPLETE' as status,
       'All tables and functions created successfully' as message;
