-- ========================================
-- 🗄️ SUPABASE MASTER CONFIGURATION
-- ========================================
-- Configuración maestra consolidada para Supabase
-- Proyecto: Misiones Arrienda
-- Fecha: 3 de Enero, 2025

-- ========================================
-- VARIABLES DE ENTORNO REQUERIDAS
-- ========================================
/*
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
DATABASE_URL=your_database_url
*/

-- ========================================
-- CONFIGURACIÓN DE TABLAS PRINCIPALES
-- ========================================

-- Tabla de propiedades
CREATE TABLE IF NOT EXISTS properties (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(12,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'ARS',
    property_type VARCHAR(50) NOT NULL,
    area DECIMAL(8,2),
    bedrooms INTEGER,
    bathrooms INTEGER,
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    country VARCHAR(100) DEFAULT 'Argentina',
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    images TEXT[],
    amenities TEXT[],
    contact_phone VARCHAR(20),
    contact_email VARCHAR(255),
    user_id UUID REFERENCES auth.users(id),
    status VARCHAR(20) DEFAULT 'active',
    featured BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de usuarios de comunidad
CREATE TABLE IF NOT EXISTS community_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) UNIQUE,
    full_name VARCHAR(255),
    age INTEGER,
    occupation VARCHAR(255),
    bio TEXT,
    profile_image_url TEXT,
    looking_for TEXT[],
    budget_min DECIMAL(12,2),
    budget_max DECIMAL(12,2),
    preferred_areas TEXT[],
    lifestyle_tags TEXT[],
    contact_preferences JSONB,
    verification_status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de likes/matches
CREATE TABLE IF NOT EXISTS community_likes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    liker_id UUID REFERENCES community_profiles(id),
    liked_id UUID REFERENCES community_profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(liker_id, liked_id)
);

-- Tabla de mensajes
CREATE TABLE IF NOT EXISTS community_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id UUID NOT NULL,
    sender_id UUID REFERENCES community_profiles(id),
    receiver_id UUID REFERENCES community_profiles(id),
    message TEXT NOT NULL,
    message_type VARCHAR(20) DEFAULT 'text',
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- POLÍTICAS RLS (ROW LEVEL SECURITY)
-- ========================================

-- Habilitar RLS en todas las tablas
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_messages ENABLE ROW LEVEL SECURITY;

-- Políticas para properties
CREATE POLICY "Properties are viewable by everyone" ON properties
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own properties" ON properties
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own properties" ON properties
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own properties" ON properties
    FOR DELETE USING (auth.uid() = user_id);

-- Políticas para community_profiles
CREATE POLICY "Profiles are viewable by authenticated users" ON community_profiles
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert their own profile" ON community_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON community_profiles
    FOR UPDATE USING (auth.uid() = user_id);

-- Políticas para community_likes
CREATE POLICY "Users can view likes involving them" ON community_likes
    FOR SELECT USING (
        liker_id IN (SELECT id FROM community_profiles WHERE user_id = auth.uid()) OR
        liked_id IN (SELECT id FROM community_profiles WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can insert their own likes" ON community_likes
    FOR INSERT WITH CHECK (
        liker_id IN (SELECT id FROM community_profiles WHERE user_id = auth.uid())
    );

-- Políticas para community_messages
CREATE POLICY "Users can view their own messages" ON community_messages
    FOR SELECT USING (
        sender_id IN (SELECT id FROM community_profiles WHERE user_id = auth.uid()) OR
        receiver_id IN (SELECT id FROM community_profiles WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can send messages" ON community_messages
    FOR INSERT WITH CHECK (
        sender_id IN (SELECT id FROM community_profiles WHERE user_id = auth.uid())
    );

-- ========================================
-- CONFIGURACIÓN DE STORAGE
-- ========================================

-- Crear buckets de storage
INSERT INTO storage.buckets (id, name, public) 
VALUES 
    ('property-images', 'property-images', true),
    ('profile-images', 'profile-images', true),
    ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

-- Políticas de storage para property-images
CREATE POLICY "Property images are publicly accessible" ON storage.objects
    FOR SELECT USING (bucket_id = 'property-images');

CREATE POLICY "Authenticated users can upload property images" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'property-images' AND 
        auth.role() = 'authenticated'
    );

-- Políticas de storage para profile-images
CREATE POLICY "Profile images are publicly accessible" ON storage.objects
    FOR SELECT USING (bucket_id = 'profile-images');

CREATE POLICY "Users can upload their own profile images" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'profile-images' AND 
        auth.role() = 'authenticated'
    );

-- ========================================
-- FUNCIONES Y TRIGGERS
-- ========================================

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at
CREATE TRIGGER update_properties_updated_at 
    BEFORE UPDATE ON properties 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_community_profiles_updated_at 
    BEFORE UPDATE ON community_profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Función para detectar matches
CREATE OR REPLACE FUNCTION check_mutual_like()
RETURNS TRIGGER AS $$
BEGIN
    -- Verificar si existe un like mutuo
    IF EXISTS (
        SELECT 1 FROM community_likes 
        WHERE liker_id = NEW.liked_id AND liked_id = NEW.liker_id
    ) THEN
        -- Crear notificación de match (implementar según necesidades)
        INSERT INTO community_messages (
            conversation_id,
            sender_id,
            receiver_id,
            message,
            message_type
        ) VALUES (
            gen_random_uuid(),
            NEW.liker_id,
            NEW.liked_id,
            '¡Es un match! Ahora pueden comenzar a chatear.',
            'system'
        );
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para matches
CREATE TRIGGER check_mutual_like_trigger
    AFTER INSERT ON community_likes
    FOR EACH ROW EXECUTE FUNCTION check_mutual_like();

-- ========================================
-- ÍNDICES PARA PERFORMANCE
-- ========================================

-- Índices para properties
CREATE INDEX IF NOT EXISTS idx_properties_city ON properties(city);
CREATE INDEX IF NOT EXISTS idx_properties_price ON properties(price);
CREATE INDEX IF NOT EXISTS idx_properties_property_type ON properties(property_type);
CREATE INDEX IF NOT EXISTS idx_properties_user_id ON properties(user_id);
CREATE INDEX IF NOT EXISTS idx_properties_status ON properties(status);
CREATE INDEX IF NOT EXISTS idx_properties_created_at ON properties(created_at);

-- Índices para community_profiles
CREATE INDEX IF NOT EXISTS idx_community_profiles_user_id ON community_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_community_profiles_budget ON community_profiles(budget_min, budget_max);

-- Índices para community_likes
CREATE INDEX IF NOT EXISTS idx_community_likes_liker ON community_likes(liker_id);
CREATE INDEX IF NOT EXISTS idx_community_likes_liked ON community_likes(liked_id);

-- Índices para community_messages
CREATE INDEX IF NOT EXISTS idx_community_messages_conversation ON community_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_community_messages_sender ON community_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_community_messages_receiver ON community_messages(receiver_id);

-- ========================================
-- CONFIGURACIÓN COMPLETADA
-- ========================================

-- Insertar datos de configuración
INSERT INTO properties (title, description, price, property_type, area, bedrooms, bathrooms, address, city, state, contact_phone, contact_email)
VALUES 
    ('Configuración de prueba', 'Propiedad de ejemplo para testing', 100000, 'casa', 120, 3, 2, 'Dirección de prueba 123', 'Posadas', 'Misiones', '+54911234567', 'test@example.com')
ON CONFLICT DO NOTHING;

-- Configuración completada exitosamente
SELECT 'Supabase Master Configuration completada exitosamente' as status;