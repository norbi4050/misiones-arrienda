-- =====================================================================================
-- ESQUEMA SQL COMPLETO PARA SUPABASE - MISIONES ARRIENDA
-- =====================================================================================
-- Proyecto: Misiones Arrienda - Plataforma de Alquileres
-- Fecha: Enero 2025
-- Descripción: Schema completo basado en Prisma con optimizaciones para Supabase
-- =====================================================================================

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================================================
-- 1. ENUMS Y TIPOS PERSONALIZADOS
-- =====================================================================================

-- Enums para el módulo Comunidad
CREATE TYPE community_role AS ENUM ('BUSCO', 'OFREZCO');
CREATE TYPE pet_pref AS ENUM ('SI_PET', 'NO_PET', 'INDIFERENTE');
CREATE TYPE smoke_pref AS ENUM ('FUMADOR', 'NO_FUMADOR', 'INDIFERENTE');
CREATE TYPE diet AS ENUM ('NINGUNA', 'VEGETARIANO', 'VEGANO', 'CELIACO', 'OTRO');
CREATE TYPE room_type AS ENUM ('PRIVADA', 'COMPARTIDA', 'ESTUDIO');

-- =====================================================================================
-- 2. TABLA PROFILES (INTEGRACIÓN CON SUPABASE AUTH)
-- =====================================================================================

CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================================================
-- 3. TABLA USERS (USUARIOS DE LA APLICACIÓN)
-- =====================================================================================

CREATE TABLE users (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT NOT NULL,
    password TEXT NOT NULL,
    avatar TEXT,
    bio TEXT,
    occupation TEXT,
    age INTEGER,
    verified BOOLEAN DEFAULT FALSE,
    email_verified BOOLEAN DEFAULT FALSE,
    verification_token TEXT,
    rating REAL DEFAULT 0,
    review_count INTEGER DEFAULT 0,
    
    -- Campos para tipos de usuario
    user_type TEXT, -- inquilino, dueno_directo, inmobiliaria
    company_name TEXT, -- Solo para inmobiliarias
    license_number TEXT, -- Solo para inmobiliarias
    property_count TEXT, -- Solo para dueños directos
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================================================
-- 4. TABLA AGENTS (AGENTES INMOBILIARIOS)
-- =====================================================================================

CREATE TABLE agents (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT NOT NULL,
    avatar TEXT,
    bio TEXT,
    license TEXT UNIQUE NOT NULL,
    rating REAL DEFAULT 0,
    review_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================================================
-- 5. TABLA PROPERTIES (PROPIEDADES)
-- =====================================================================================

CREATE TABLE properties (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    price REAL NOT NULL,
    currency TEXT DEFAULT 'ARS',
    old_price REAL,
    bedrooms INTEGER NOT NULL,
    bathrooms INTEGER NOT NULL,
    garages INTEGER DEFAULT 0,
    area REAL NOT NULL,
    lot_area REAL,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    province TEXT NOT NULL,
    postal_code TEXT NOT NULL,
    latitude REAL,
    longitude REAL,
    property_type TEXT NOT NULL, -- APARTMENT, HOUSE, COMMERCIAL, LAND, OFFICE, WAREHOUSE, PH, STUDIO
    status TEXT DEFAULT 'AVAILABLE', -- AVAILABLE, RENTED, SOLD, MAINTENANCE, RESERVED, EXPIRED
    images TEXT NOT NULL, -- JSON string of array
    virtual_tour_url TEXT,
    amenities TEXT NOT NULL, -- JSON string of array
    features TEXT NOT NULL, -- JSON string of array
    year_built INTEGER,
    floor INTEGER,
    total_floors INTEGER,
    featured BOOLEAN DEFAULT FALSE,
    
    -- Campos para sistema de caducidad
    expires_at TIMESTAMPTZ,
    highlighted_until TIMESTAMPTZ,
    is_paid BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Relaciones
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    agent_id TEXT NOT NULL REFERENCES agents(id) ON DELETE CASCADE
);

-- Índices para optimizar consultas
CREATE INDEX idx_properties_city_province ON properties(city, province);
CREATE INDEX idx_properties_price ON properties(price);
CREATE INDEX idx_properties_property_type ON properties(property_type);
CREATE INDEX idx_properties_status ON properties(status);
CREATE INDEX idx_properties_featured ON properties(featured);
CREATE INDEX idx_properties_user_id ON properties(user_id);
CREATE INDEX idx_properties_expires_at ON properties(expires_at);

-- =====================================================================================
-- 6. TABLA INQUIRIES (CONSULTAS GENERALES)
-- =====================================================================================

CREATE TABLE inquiries (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL, -- GENERAL, VISIT, FINANCING, OFFER
    visit_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    property_id TEXT NOT NULL REFERENCES properties(id) ON DELETE CASCADE
);

-- =====================================================================================
-- 7. TABLA USER_INQUIRIES (CONSULTAS DE USUARIOS REGISTRADOS)
-- =====================================================================================

CREATE TABLE user_inquiries (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    message TEXT NOT NULL,
    type TEXT NOT NULL, -- GENERAL, VISIT, FINANCING, OFFER
    visit_date TIMESTAMPTZ,
    status TEXT DEFAULT 'PENDING', -- PENDING, RESPONDED, CLOSED
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    property_id TEXT NOT NULL REFERENCES properties(id) ON DELETE CASCADE
);

-- =====================================================================================
-- 8. TABLA FAVORITES (FAVORITOS)
-- =====================================================================================

CREATE TABLE favorites (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    property_id TEXT NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, property_id)
);

-- =====================================================================================
-- 9. TABLA SEARCH_HISTORY (HISTORIAL DE BÚSQUEDAS)
-- =====================================================================================

CREATE TABLE search_history (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    search_term TEXT NOT NULL,
    filters TEXT, -- JSON string con filtros aplicados
    results_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_search_history_user_created ON search_history(user_id, created_at);

-- =====================================================================================
-- 10. TABLA USER_REVIEWS (RESEÑAS DE USUARIOS)
-- =====================================================================================

CREATE TABLE user_reviews (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT NOT NULL,
    category TEXT NOT NULL, -- TENANT, LANDLORD
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    reviewer_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reviewed_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rental_id TEXT -- Referencia opcional a rental_history
);

-- =====================================================================================
-- 11. TABLA RENTAL_HISTORY (HISTORIAL DE ALQUILERES)
-- =====================================================================================

CREATE TABLE rental_history (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ,
    monthly_rent REAL NOT NULL,
    deposit REAL,
    status TEXT DEFAULT 'ACTIVE', -- ACTIVE, COMPLETED, TERMINATED
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    tenant_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    property_id TEXT NOT NULL REFERENCES properties(id) ON DELETE CASCADE
);

-- Agregar la referencia faltante en user_reviews
ALTER TABLE user_reviews ADD CONSTRAINT fk_user_reviews_rental 
    FOREIGN KEY (rental_id) REFERENCES rental_history(id) ON DELETE SET NULL;

-- =====================================================================================
-- 12. SISTEMA DE PAGOS - TABLA PAYMENTS
-- =====================================================================================

CREATE TABLE payments (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    
    -- Identificadores de MercadoPago
    mercadopago_id TEXT UNIQUE NOT NULL,
    preference_id TEXT,
    external_reference TEXT NOT NULL,
    
    -- Información del pago
    amount REAL NOT NULL,
    currency TEXT DEFAULT 'ARS',
    status TEXT NOT NULL, -- pending, approved, rejected, cancelled, refunded
    status_detail TEXT,
    payment_method_id TEXT, -- visa, mastercard, efectivo
    payment_type_id TEXT, -- credit_card, debit_card, ticket
    installments INTEGER DEFAULT 1,
    
    -- Fechas importantes
    date_created TIMESTAMPTZ DEFAULT NOW(),
    date_approved TIMESTAMPTZ,
    date_last_updated TIMESTAMPTZ DEFAULT NOW(),
    
    -- Información del pagador
    payer_email TEXT NOT NULL,
    payer_name TEXT,
    payer_identification TEXT, -- JSON con tipo y número
    
    -- Relaciones
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    property_id TEXT NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    subscription_id TEXT, -- Referencia a subscriptions
    
    -- Metadata adicional
    metadata TEXT, -- JSON con información adicional
    webhook_data TEXT, -- JSON con datos del webhook
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_payments_mercadopago_id ON payments(mercadopago_id);
CREATE INDEX idx_payments_user_status ON payments(user_id, status);
CREATE INDEX idx_payments_property_id ON payments(property_id);
CREATE INDEX idx_payments_status_date ON payments(status, date_created);

-- =====================================================================================
-- 13. TABLA SUBSCRIPTIONS (SUSCRIPCIONES)
-- =====================================================================================

CREATE TABLE subscriptions (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    
    -- Información del plan
    plan_type TEXT NOT NULL, -- basic, featured, premium
    plan_name TEXT NOT NULL,
    plan_price REAL NOT NULL,
    plan_duration INTEGER NOT NULL, -- días
    
    -- Estado de la suscripción
    status TEXT DEFAULT 'ACTIVE', -- ACTIVE, EXPIRED, CANCELLED, SUSPENDED
    
    -- Fechas
    start_date TIMESTAMPTZ DEFAULT NOW(),
    end_date TIMESTAMPTZ NOT NULL,
    renewal_date TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    
    -- Configuración
    auto_renew BOOLEAN DEFAULT FALSE,
    renewal_attempts INTEGER DEFAULT 0,
    max_renewal_attempts INTEGER DEFAULT 3,
    
    -- Relaciones
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    property_id TEXT NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Agregar la referencia faltante en payments
ALTER TABLE payments ADD CONSTRAINT fk_payments_subscription 
    FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE SET NULL;

CREATE INDEX idx_subscriptions_user_status ON subscriptions(user_id, status);
CREATE INDEX idx_subscriptions_property_status ON subscriptions(property_id, status);
CREATE INDEX idx_subscriptions_end_date ON subscriptions(end_date, status);
CREATE INDEX idx_subscriptions_renewal_date ON subscriptions(renewal_date);

-- =====================================================================================
-- 14. TABLA PAYMENT_METHODS (MÉTODOS DE PAGO)
-- =====================================================================================

CREATE TABLE payment_methods (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    
    -- Información del método de pago
    type TEXT NOT NULL, -- credit_card, debit_card, bank_transfer
    brand TEXT, -- visa, mastercard, amex
    last_four_digits TEXT,
    expiration_month INTEGER,
    expiration_year INTEGER,
    holder_name TEXT,
    
    -- Identificadores de MercadoPago
    mercadopago_card_id TEXT,
    mercadopago_customer_id TEXT,
    
    -- Estado
    is_active BOOLEAN DEFAULT TRUE,
    is_default BOOLEAN DEFAULT FALSE,
    
    -- Relaciones
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_payment_methods_user_active ON payment_methods(user_id, is_active);

-- =====================================================================================
-- 15. TABLA PAYMENT_NOTIFICATIONS (NOTIFICACIONES DE WEBHOOK)
-- =====================================================================================

CREATE TABLE payment_notifications (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    
    -- Información del webhook
    mercadopago_id TEXT NOT NULL,
    topic TEXT NOT NULL, -- payment, merchant_order
    type TEXT NOT NULL,
    
    -- Estado del procesamiento
    status TEXT DEFAULT 'PENDING', -- PENDING, PROCESSED, FAILED
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    
    -- Datos del webhook
    webhook_data TEXT NOT NULL, -- JSON completo del webhook
    error_message TEXT,
    
    -- Relación con el pago (opcional)
    payment_id TEXT REFERENCES payments(id) ON DELETE SET NULL,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ
);

CREATE INDEX idx_payment_notifications_mercadopago ON payment_notifications(mercadopago_id);
CREATE INDEX idx_payment_notifications_status ON payment_notifications(status, attempts);
CREATE INDEX idx_payment_notifications_created ON payment_notifications(created_at);

-- =====================================================================================
-- 16. TABLA PAYMENT_ANALYTICS (ANALÍTICAS DE PAGOS)
-- =====================================================================================

CREATE TABLE payment_analytics (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    
    -- Período de análisis
    date TIMESTAMPTZ NOT NULL,
    period TEXT NOT NULL, -- daily, weekly, monthly
    
    -- Métricas de pagos
    total_payments INTEGER DEFAULT 0,
    successful_payments INTEGER DEFAULT 0,
    failed_payments INTEGER DEFAULT 0,
    pending_payments INTEGER DEFAULT 0,
    
    -- Métricas financieras
    total_amount REAL DEFAULT 0,
    successful_amount REAL DEFAULT 0,
    average_amount REAL DEFAULT 0,
    
    -- Métricas por método de pago
    credit_card_payments INTEGER DEFAULT 0,
    debit_card_payments INTEGER DEFAULT 0,
    bank_transfer_payments INTEGER DEFAULT 0,
    cash_payments INTEGER DEFAULT 0,
    
    -- Métricas por plan
    basic_plan_payments INTEGER DEFAULT 0,
    featured_plan_payments INTEGER DEFAULT 0,
    premium_plan_payments INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(date, period)
);

CREATE INDEX idx_payment_analytics_date ON payment_analytics(date);
CREATE INDEX idx_payment_analytics_period ON payment_analytics(period);

-- =====================================================================================
-- 17. MÓDULO COMUNIDAD - TABLA USER_PROFILES
-- =====================================================================================

CREATE TABLE user_profiles (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    
    -- Vinculación con User existente
    user_id TEXT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Información básica del perfil
    role community_role NOT NULL,
    city TEXT NOT NULL,
    neighborhood TEXT,
    budget_min INTEGER NOT NULL, -- Presupuesto mínimo en ARS
    budget_max INTEGER NOT NULL, -- Presupuesto máximo en ARS
    bio TEXT,
    photos TEXT[], -- Array de URLs de fotos
    
    -- Preferencias de convivencia
    age INTEGER,
    pet_pref pet_pref DEFAULT 'INDIFERENTE',
    smoke_pref smoke_pref DEFAULT 'INDIFERENTE',
    diet diet DEFAULT 'NINGUNA',
    schedule_notes TEXT, -- horarios de trabajo/estudio
    tags TEXT[], -- limpio, sociable, gym, gamer
    
    -- Configuración
    accepts_messages BOOLEAN DEFAULT TRUE,
    highlighted_until TIMESTAMPTZ,
    is_suspended BOOLEAN DEFAULT FALSE,
    
    -- Campos para sistema de caducidad
    expires_at TIMESTAMPTZ,
    is_paid BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_user_profiles_role_city ON user_profiles(role, city);
CREATE INDEX idx_user_profiles_budget ON user_profiles(budget_min, budget_max);
CREATE INDEX idx_user_profiles_highlighted ON user_profiles(highlighted_until);
CREATE INDEX idx_user_profiles_suspended ON user_profiles(is_suspended);

-- =====================================================================================
-- 18. TABLA ROOMS (HABITACIONES)
-- =====================================================================================

CREATE TABLE rooms (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    
    -- Relación con el perfil propietario
    owner_id TEXT NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    
    -- Información de la habitación
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    price INTEGER NOT NULL, -- Precio mensual en ARS
    city TEXT NOT NULL,
    neighborhood TEXT,
    type room_type NOT NULL,
    amenities TEXT[], -- wifi, cochera, patio
    photos TEXT[], -- Array de URLs de fotos
    rules TEXT, -- no fiestas, etc.
    
    -- Estado
    is_active BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_rooms_city_type ON rooms(city, type);
CREATE INDEX idx_rooms_price ON rooms(price);
CREATE INDEX idx_rooms_active ON rooms(is_active);

-- =====================================================================================
-- 19. TABLA LIKES (LIKES ENTRE USUARIOS)
-- =====================================================================================

CREATE TABLE likes (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    
    -- Relaciones
    from_id TEXT NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    to_id TEXT NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(from_id, to_id)
);

CREATE INDEX idx_likes_from ON likes(from_id);
CREATE INDEX idx_likes_to ON likes(to_id);

-- =====================================================================================
-- 20. TABLA CONVERSATIONS (CONVERSACIONES)
-- =====================================================================================

CREATE TABLE conversations (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    
    -- Participantes (siempre 2 en MVP)
    a_id TEXT NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    b_id TEXT NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    
    -- Estado
    is_active BOOLEAN DEFAULT TRUE,
    last_message_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(a_id, b_id)
);

CREATE INDEX idx_conversations_a_active ON conversations(a_id, is_active);
CREATE INDEX idx_conversations_b_active ON conversations(b_id, is_active);
CREATE INDEX idx_conversations_last_message ON conversations(last_message_at);

-- =====================================================================================
-- 21. TABLA MESSAGES (MENSAJES)
-- =====================================================================================

CREATE TABLE messages (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    
    -- Relaciones
    conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id TEXT NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    
    -- Contenido
    body TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_messages_conversation_created ON messages(conversation_id, created_at);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_read ON messages(is_read);

-- =====================================================================================
-- 22. TABLA REPORTS (REPORTES)
-- =====================================================================================

CREATE TABLE reports (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    
    -- Relación con el perfil reportado
    target_id TEXT NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    
    -- Información del reporte
    reason TEXT NOT NULL, -- spam, contenido_inapropiado, acoso
    details TEXT,
    reporter_email TEXT, -- Email del reportador (puede ser anónimo)
    
    -- Estado
    status TEXT DEFAULT 'PENDING', -- PENDING, REVIEWED, RESOLVED, DISMISSED
    admin_notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_reports_target_status ON reports(target_id, status);
CREATE INDEX idx_reports_status_created ON reports(status, created_at);

-- =====================================================================================
-- 23. FUNCIONES Y TRIGGERS
-- =====================================================================================

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar trigger a todas las tablas que tienen updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_agents_updated_at BEFORE UPDATE ON agents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_properties_updated_at BEFORE UPDATE ON properties FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payment_methods_updated_at BEFORE UPDATE ON payment_methods FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payment_notifications_updated_at BEFORE UPDATE ON payment_notifications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payment_analytics_updated_at BEFORE UPDATE ON payment_analytics FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_rooms_updated_at BEFORE UPDATE ON rooms FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_reports_updated_at BEFORE UPDATE ON reports FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Función para crear perfil automáticamente cuando se registra un usuario
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'avatar_url');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para crear perfil automáticamente
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Función para actualizar last_message_at en conversaciones
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE conversations 
    SET last_message_at = NEW.created_at 
    WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_conversation_last_message_trigger
    AFTER INSERT ON messages
    FOR EACH ROW EXECUTE FUNCTION update_conversation_last_message();

-- =====================================================================================
-- 24. CONFIGURACIÓN DE ROW LEVEL SECURITY (RLS)
-- =====================================================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE rental_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- =====================================================================================
-- 25. POLÍTICAS RLS
-- =====================================================================================

-- Políticas para profiles
CREATE POLICY "Users can view their own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Políticas para users
CREATE POLICY "Users can view their own user data" ON users FOR SELECT USING (auth.uid()::text = id);
CREATE POLICY "Users can update their own user data" ON users FOR UPDATE USING (auth.uid()::text = id);
CREATE POLICY "Anyone can create user" ON users FOR INSERT WITH CHECK (true);

-- Políticas para agents (públicos)
CREATE POLICY "Anyone can view agents" ON agents FOR SELECT USING (true);

-- Políticas para properties
CREATE POLICY "Anyone can view properties" ON properties FOR SELECT USING (true);
CREATE POLICY "Users can create their own properties" ON properties FOR INSERT WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY "Users can update their own properties" ON properties FOR UPDATE USING (auth.uid()::text = user_id);
CREATE POLICY "Users can delete their own properties" ON properties FOR DELETE USING (auth.uid()::text = user_id);

-- Políticas para inquiries (públicas para permitir consultas anónimas)
CREATE POLICY "Anyone can create inquiries" ON inquiries FOR INSERT WITH CHECK (true);
CREATE POLICY "Property owners can view inquiries for their properties" ON inquiries FOR SELECT USING (
    EXISTS (SELECT 1 FROM properties WHERE properties.id = inquiries.property_id AND properties.user_id = auth.uid()::text)
);

-- Políticas para user_inquiries
CREATE POLICY "Users can view their own inquiries" ON user_inquiries FOR SELECT USING (auth.uid()::text = user_id);
CREATE POLICY "Users can create their own inquiries" ON user_inquiries FOR INSERT WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY "Property owners can view inquiries for their properties" ON user_inquiries FOR SELECT USING (
    EXISTS (SELECT 1 FROM properties WHERE properties.id = user_inquiries.property_id AND properties.user_id = auth.uid()::text)
);

-- Políticas para favorites
CREATE POLICY "Users can view their own favorites" ON favorites FOR SELECT USING (auth.uid()::text = user_id);
CREATE POLICY "Users can create their own favorites" ON favorites FOR INSERT WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY "Users can delete their own favorites" ON favorites FOR DELETE USING (auth.uid()::text = user_id);

-- Políticas para search_history
CREATE POLICY "Users can view their own search history" ON search_history FOR SELECT USING (auth.uid()::text = user_id);
CREATE POLICY "Users can create their own search history" ON search_history FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- Políticas para user_reviews
CREATE POLICY "Anyone can view reviews" ON user_reviews FOR SELECT USING (true);
CREATE POLICY "Users can create reviews" ON user_reviews FOR INSERT WITH CHECK (auth.uid()::text = reviewer_id);
CREATE POLICY "Users can update their own reviews" ON user_reviews FOR UPDATE USING (auth.uid()::text = reviewer_id);

-- Políticas para rental_history
CREATE POLICY "Users can view their own rental history" ON rental_history FOR SELECT USING (auth.uid()::text = tenant_id);
CREATE POLICY "Property owners can view rental history for their properties" ON rental_history FOR SELECT USING (
    EXISTS (SELECT 1 FROM properties WHERE properties.id = rental_history.property_id AND properties.user_id = auth.uid()::text)
);

-- Políticas para payments
CREATE POLICY "Users can view their own payments" ON payments FOR SELECT USING (auth.uid()::text = user_id);
CREATE POLICY "Users can create their own payments" ON payments FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- Políticas para subscriptions
CREATE POLICY "Users can view their own subscriptions" ON subscriptions FOR SELECT USING (auth.uid()::text = user_id);
CREATE POLICY "Users can create their own subscriptions" ON subscriptions FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- Políticas para payment_methods
CREATE POLICY "Users can view their own payment methods" ON payment_methods FOR SELECT USING (auth.uid()::text = user_id);
CREATE POLICY "Users can manage their own payment methods" ON payment_methods FOR ALL USING (auth.uid()::text = user_id);

-- Políticas para user_profiles (módulo comunidad)
CREATE POLICY "Anyone can view active community profiles" ON user_profiles FOR SELECT USING (NOT is_suspended);
CREATE POLICY "Users can create their own community profile" ON user_profiles FOR INSERT WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY "Users can update their own community profile" ON user_profiles FOR UPDATE USING (auth.uid()::text = user_id);
