-- =====================================================
-- PASO 1: CREAR TABLAS BÁSICAS - PERFIL USUARIO 2025
-- =====================================================
-- Ejecutar SOLO este archivo primero

-- 1. TABLA PARA VISTAS DE PERFIL
CREATE TABLE IF NOT EXISTS public.profile_views (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    viewer_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    viewed_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT,
    referrer TEXT,
    session_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. TABLA PARA MENSAJES/CONVERSACIONES
CREATE TABLE IF NOT EXISTS public.user_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    property_id UUID,
    subject TEXT,
    message TEXT NOT NULL,
    message_type VARCHAR(50) DEFAULT 'inquiry',
    is_read BOOLEAN DEFAULT FALSE,
    is_archived BOOLEAN DEFAULT FALSE,
    parent_message_id UUID REFERENCES public.user_messages(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. TABLA PARA BÚSQUEDAS GUARDADAS
CREATE TABLE IF NOT EXISTS public.user_searches (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    search_name VARCHAR(100),
    search_criteria JSONB NOT NULL DEFAULT '{}',
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
    alert_frequency VARCHAR(20) DEFAULT 'daily',
    last_alert_sent TIMESTAMP WITH TIME ZONE,
    results_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. TABLA PARA CALIFICACIONES Y REVIEWS
CREATE TABLE IF NOT EXISTS public.user_ratings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    rater_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    rated_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    property_id UUID,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review_title VARCHAR(200),
    review_text TEXT,
    interaction_type VARCHAR(50) DEFAULT 'rental',
    is_verified BOOLEAN DEFAULT FALSE,
    is_public BOOLEAN DEFAULT TRUE,
    helpful_votes INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. TABLA PARA LOG DE ACTIVIDAD GENERAL
CREATE TABLE IF NOT EXISTS public.user_activity_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    activity_type VARCHAR(50) NOT NULL,
    activity_description TEXT,
    entity_type VARCHAR(50),
    entity_id UUID,
    metadata JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
