-- ========================================
-- 🗄️ SUPABASE SETUP COMPLETO
-- ========================================
-- Configuración principal de Supabase para Misiones Arrienda
-- Este archivo debe ejecutarse en el SQL Editor de Supabase

-- ========================================
-- HABILITAR EXTENSIONES
-- ========================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ========================================
-- CREAR TABLAS PRINCIPALES
-- ========================================

-- Tabla de propiedades
CREATE TABLE IF NOT EXISTS public.properties (
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

-- Tabla de perfiles de comunidad
CREATE TABLE IF NOT EXISTS public.community_profiles (
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
CREATE TABLE IF NOT EXISTS public.community_likes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    liker_id UUID REFERENCES community_profiles(id),
    liked_id UUID REFERENCES community_profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(liker_id, liked_id)
);

-- Tabla de mensajes
CREATE TABLE IF NOT EXISTS public.community_messages (
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
-- HABILITAR ROW LEVEL SECURITY
-- ========================================

ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_messages ENABLE ROW LEVEL SECURITY;

-- ========================================
-- CREAR POLÍTICAS RLS
-- ========================================

-- Políticas para properties
CREATE POLICY "Properties are viewable by everyone" ON public.properties
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own properties" ON public.properties
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own properties" ON public.properties
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own properties" ON public.properties
    FOR DELETE USING (auth.uid() = user_id);

-- Políticas para community_profiles
CREATE POLICY "Profiles are viewable by authenticated users" ON public.community_profiles
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert their own profile" ON public.community_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON public.community_profiles
    FOR UPDATE USING (auth.uid() = user_id);

-- Políticas para community_likes
CREATE POLICY "Users can view likes involving them" ON public.community_likes
    FOR SELECT USING (
        liker_id IN (SELECT id FROM community_profiles WHERE user_id = auth.uid()) OR
        liked_id IN (SELECT id FROM community_profiles WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can insert their own likes" ON public.community_likes
    FOR INSERT WITH CHECK (
        liker_id IN (SELECT id FROM community_profiles WHERE user_id = auth.uid())
    );

-- Políticas para community_messages
CREATE POLICY "Users can view their own messages" ON public.community_messages
    FOR SELECT USING (
        sender_id IN (SELECT id FROM community_profiles WHERE user_id = auth.uid()) OR
        receiver_id IN (SELECT id FROM community_profiles WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can send messages" ON public.community_messages
    FOR INSERT WITH CHECK (
        sender_id IN (SELECT id FROM community_profiles WHERE user_id = auth.uid())
    );

-- ========================================
-- CONFIGURAR STORAGE
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
-- CREAR ÍNDICES PARA PERFORMANCE
-- ========================================

CREATE INDEX IF NOT EXISTS idx_properties_city ON public.properties(city);
CREATE INDEX IF NOT EXISTS idx_properties_price ON public.properties(price);
CREATE INDEX IF NOT EXISTS idx_properties_property_type ON public.properties(property_type);
CREATE INDEX IF NOT EXISTS idx_properties_user_id ON public.properties(user_id);
CREATE INDEX IF NOT EXISTS idx_properties_status ON public.properties(status);

CREATE INDEX IF NOT EXISTS idx_community_profiles_user_id ON public.community_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_community_likes_liker ON public.community_likes(liker_id);
CREATE INDEX IF NOT EXISTS idx_community_likes_liked ON public.community_likes(liked_id);

-- ========================================
-- CONFIGURACIÓN COMPLETADA
-- ========================================

-- Insertar datos de prueba (opcional)
INSERT INTO public.properties (title, description, price, property_type, area, bedrooms, bathrooms, address, city, state, contact_phone, contact_email)
VALUES 
    ('Casa de prueba', 'Propiedad de ejemplo para testing', 100000, 'casa', 120, 3, 2, 'Dirección de prueba 123', 'Posadas', 'Misiones', '+54911234567', 'test@example.com')
ON CONFLICT DO NOTHING;

SELECT 'Supabase setup completado exitosamente' as status;