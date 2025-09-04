# BLACKBOX AI - AUDITORÍA COMPLETA CONFIGURACIÓN SUPABASE
**Archivo:** 104-Auditoria-Completa-Configuracion-Supabase.md  
**Fecha:** 3/9/2025  
**Estado:** ✅ COMPLETADO

## 📊 RESUMEN EJECUTIVO

Esta auditoría detalla **TODAS** las configuraciones necesarias en Supabase para el proyecto Misiones Arrienda, basada en el análisis exhaustivo del código actual y el esquema de base de datos.

**🎯 OBJETIVO:** Proporcionar una guía completa y detallada de todo lo que debe configurarse en Supabase.

## 🔍 ANÁLISIS DEL ESTADO ACTUAL

### ✅ CONFIGURACIONES DETECTADAS EN EL CÓDIGO:
- **Prisma Schema:** Completo con 25+ modelos
- **Cliente Supabase:** Configurado con SSR
- **Autenticación:** Implementada con PKCE flow
- **Variables de Entorno:** Definidas pero requieren valores reales

### ❌ CONFIGURACIONES FALTANTES IDENTIFICADAS:
- **Tablas en Supabase:** No sincronizadas con Prisma
- **Políticas RLS:** No implementadas
- **Storage Buckets:** No configurados
- **Triggers y Functions:** No implementados
- **Índices de Performance:** No optimizados

## 🗄️ PARTE 1: CONFIGURACIÓN DE BASE DE DATOS

### 1.1 CREACIÓN DE TABLAS PRINCIPALES

**PRIORIDAD: 🔴 CRÍTICA**

```sql
-- =====================================================
-- TABLAS CORE DEL SISTEMA
-- =====================================================

-- Tabla de Perfiles (vinculada a auth.users)
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de Usuarios del Sistema
CREATE TABLE public.users (
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
    user_type TEXT, -- inquilino, dueno_directo, inmobiliaria
    company_name TEXT,
    license_number TEXT,
    property_count TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de Propiedades
CREATE TABLE public.properties (
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
    property_type TEXT NOT NULL,
    status TEXT DEFAULT 'AVAILABLE',
    images TEXT NOT NULL, -- JSON string
    virtual_tour_url TEXT,
    amenities TEXT, -- JSON string
    features TEXT, -- JSON string
    year_built INTEGER,
    floor INTEGER,
    total_floors INTEGER,
    featured BOOLEAN DEFAULT FALSE,
    contact_name TEXT,
    contact_phone TEXT NOT NULL,
    contact_email TEXT,
    expires_at TIMESTAMPTZ,
    highlighted_until TIMESTAMPTZ,
    is_paid BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    user_id TEXT NOT NULL REFERENCES users(id),
    agent_id TEXT REFERENCES agents(id)
);

-- Tabla de Agentes
CREATE TABLE public.agents (
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
```

### 1.2 TABLAS DEL SISTEMA DE PAGOS

**PRIORIDAD: 🟡 ALTA**

```sql
-- =====================================================
-- SISTEMA DE PAGOS MERCADOPAGO
-- =====================================================

-- Tabla de Pagos
CREATE TABLE public.payments (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    mercadopago_id TEXT UNIQUE NOT NULL,
    preference_id TEXT,
    external_reference TEXT NOT NULL,
    amount REAL NOT NULL,
    currency TEXT DEFAULT 'ARS',
    status TEXT NOT NULL,
    status_detail TEXT,
    payment_method_id TEXT,
    payment_type_id TEXT,
    installments INTEGER DEFAULT 1,
    date_created TIMESTAMPTZ DEFAULT NOW(),
    date_approved TIMESTAMPTZ,
    date_last_updated TIMESTAMPTZ DEFAULT NOW(),
    payer_email TEXT NOT NULL,
    payer_name TEXT,
    payer_identification TEXT,
    user_id TEXT NOT NULL REFERENCES users(id),
    property_id TEXT NOT NULL REFERENCES properties(id),
    subscription_id TEXT REFERENCES subscriptions(id),
    metadata TEXT,
    webhook_data TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de Suscripciones
CREATE TABLE public.subscriptions (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    plan_type TEXT NOT NULL,
    plan_name TEXT NOT NULL,
    plan_price REAL NOT NULL,
    plan_duration INTEGER NOT NULL,
    status TEXT DEFAULT 'ACTIVE',
    start_date TIMESTAMPTZ DEFAULT NOW(),
    end_date TIMESTAMPTZ NOT NULL,
    renewal_date TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    auto_renew BOOLEAN DEFAULT FALSE,
    renewal_attempts INTEGER DEFAULT 0,
    max_renewal_attempts INTEGER DEFAULT 3,
    user_id TEXT NOT NULL REFERENCES users(id),
    property_id TEXT NOT NULL REFERENCES properties(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de Métodos de Pago
CREATE TABLE public.payment_methods (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    type TEXT NOT NULL,
    brand TEXT,
    last_four_digits TEXT,
    expiration_month INTEGER,
    expiration_year INTEGER,
    holder_name TEXT,
    mercadopago_card_id TEXT,
    mercadopago_customer_id TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    is_default BOOLEAN DEFAULT FALSE,
    user_id TEXT NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 1.3 MÓDULO COMUNIDAD (FLATMATES)

**PRIORIDAD: 🟡 ALTA**

```sql
-- =====================================================
-- MÓDULO COMUNIDAD ESTILO FLATMATES
-- =====================================================

-- Enums para el módulo comunidad
CREATE TYPE community_role AS ENUM ('BUSCO', 'OFREZCO');
CREATE TYPE pet_pref AS ENUM ('SI_PET', 'NO_PET', 'INDIFERENTE');
CREATE TYPE smoke_pref AS ENUM ('FUMADOR', 'NO_FUMADOR', 'INDIFERENTE');
CREATE TYPE diet AS ENUM ('NINGUNA', 'VEGETARIANO', 'VEGANO', 'CELIACO', 'OTRO');
CREATE TYPE room_type AS ENUM ('PRIVADA', 'COMPARTIDA', 'ESTUDIO');

-- Tabla de Perfiles de Usuario Comunidad
CREATE TABLE public.user_profiles (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    user_id TEXT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role community_role NOT NULL,
    city TEXT NOT NULL,
    neighborhood TEXT,
    budget_min INTEGER NOT NULL,
    budget_max INTEGER NOT NULL,
    bio TEXT,
    photos TEXT[], -- Array de URLs
    age INTEGER,
    pet_pref pet_pref DEFAULT 'INDIFERENTE',
    smoke_pref smoke_pref DEFAULT 'INDIFERENTE',
    diet diet DEFAULT 'NINGUNA',
    schedule_notes TEXT,
    tags TEXT[], -- Array de tags
    accepts_messages BOOLEAN DEFAULT TRUE,
    highlighted_until TIMESTAMPTZ,
    is_suspended BOOLEAN DEFAULT FALSE,
    expires_at TIMESTAMPTZ,
    is_paid BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de Habitaciones
CREATE TABLE public.rooms (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    owner_id TEXT NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    price INTEGER NOT NULL,
    city TEXT NOT NULL,
    neighborhood TEXT,
    type room_type NOT NULL,
    amenities TEXT[], -- Array de amenities
    photos TEXT[], -- Array de URLs
    rules TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de Likes
CREATE TABLE public.likes (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    from_id TEXT NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    to_id TEXT NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(from_id, to_id)
);

-- Tabla de Conversaciones
CREATE TABLE public.conversations (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    a_id TEXT NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    b_id TEXT NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT TRUE,
    last_message_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(a_id, b_id)
);

-- Tabla de Mensajes
CREATE TABLE public.messages (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id TEXT NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    body TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 1.4 TABLAS COMPLEMENTARIAS

**PRIORIDAD: 🟢 MEDIA**

```sql
-- =====================================================
-- TABLAS COMPLEMENTARIAS
-- =====================================================

-- Tabla de Favoritos
CREATE TABLE public.favorites (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    user_id TEXT NOT NULL REFERENCES users(id),
    property_id TEXT NOT NULL REFERENCES properties(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, property_id)
);

-- Tabla de Consultas
CREATE TABLE public.inquiries (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL,
    visit_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    property_id TEXT NOT NULL REFERENCES properties(id)
);

-- Tabla de Historial de Búsquedas
CREATE TABLE public.search_history (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    search_term TEXT NOT NULL,
    filters TEXT, -- JSON string
    results_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    user_id TEXT NOT NULL REFERENCES users(id)
);

-- Tabla de Reviews de Usuarios
CREATE TABLE public.user_reviews (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT NOT NULL,
    category TEXT NOT NULL,
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    reviewer_id TEXT NOT NULL REFERENCES users(id),
    reviewed_id TEXT NOT NULL REFERENCES users(id),
    rental_id TEXT REFERENCES rental_history(id)
);

-- Tabla de Historial de Alquileres
CREATE TABLE public.rental_history (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ,
    monthly_rent REAL NOT NULL,
    deposit REAL,
    status TEXT DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    tenant_id TEXT NOT NULL REFERENCES users(id),
    property_id TEXT NOT NULL REFERENCES properties(id)
);
```

## 🔐 PARTE 2: CONFIGURACIÓN DE SEGURIDAD (RLS)

### 2.1 POLÍTICAS DE SEGURIDAD BÁSICAS

**PRIORIDAD: 🔴 CRÍTICA**

```sql
-- =====================================================
-- HABILITAR RLS EN TODAS LAS TABLAS
-- =====================================================

-- Habilitar RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.search_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rental_history ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- POLÍTICAS PARA TABLA PROFILES
-- =====================================================

-- Los usuarios pueden ver todos los perfiles públicos
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles
    FOR SELECT USING (true);

-- Los usuarios pueden actualizar su propio perfil
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid()::text = id);

-- Los usuarios pueden insertar su propio perfil
CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid()::text = id);

-- =====================================================
-- POLÍTICAS PARA TABLA USERS
-- =====================================================

-- Los usuarios pueden ver todos los usuarios (para funcionalidades sociales)
CREATE POLICY "Users are viewable by everyone" ON public.users
    FOR SELECT USING (true);

-- Los usuarios pueden actualizar su propia información
CREATE POLICY "Users can update own data" ON public.users
    FOR UPDATE USING (auth.uid()::text = id);

-- Los usuarios pueden insertar su propia información
CREATE POLICY "Users can insert own data" ON public.users
    FOR INSERT WITH CHECK (auth.uid()::text = id);

-- =====================================================
-- POLÍTICAS PARA TABLA PROPERTIES
-- =====================================================

-- Todas las propiedades son visibles para todos
CREATE POLICY "Properties are viewable by everyone" ON public.properties
    FOR SELECT USING (true);

-- Los usuarios pueden insertar sus propias propiedades
CREATE POLICY "Users can insert own properties" ON public.properties
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- Los usuarios pueden actualizar sus propias propiedades
CREATE POLICY "Users can update own properties" ON public.properties
    FOR UPDATE USING (auth.uid()::text = user_id);

-- Los usuarios pueden eliminar sus propias propiedades
CREATE POLICY "Users can delete own properties" ON public.properties
    FOR DELETE USING (auth.uid()::text = user_id);
```

### 2.2 POLÍTICAS PARA MÓDULO COMUNIDAD

**PRIORIDAD: 🟡 ALTA**

```sql
-- =====================================================
-- POLÍTICAS PARA MÓDULO COMUNIDAD
-- =====================================================

-- USER_PROFILES: Visibles para todos, editables por el propietario
CREATE POLICY "User profiles are viewable by everyone" ON public.user_profiles
    FOR SELECT USING (true);

CREATE POLICY "Users can manage own profile" ON public.user_profiles
    FOR ALL USING (auth.uid()::text = user_id);

-- ROOMS: Visibles para todos, editables por el propietario
CREATE POLICY "Rooms are viewable by everyone" ON public.rooms
    FOR SELECT USING (true);

CREATE POLICY "Users can manage own rooms" ON public.rooms
    FOR ALL USING (
        auth.uid()::text IN (
            SELECT user_id FROM user_profiles WHERE id = owner_id
        )
    );

-- LIKES: Los usuarios pueden ver y gestionar sus propios likes
CREATE POLICY "Users can view likes" ON public.likes
    FOR SELECT USING (
        auth.uid()::text IN (
            SELECT user_id FROM user_profiles WHERE id IN (from_id, to_id)
        )
    );

CREATE POLICY "Users can manage own likes" ON public.likes
    FOR ALL USING (
        auth.uid()::text IN (
            SELECT user_id FROM user_profiles WHERE id = from_id
        )
    );

-- CONVERSATIONS: Solo los participantes pueden ver sus conversaciones
CREATE POLICY "Users can view own conversations" ON public.conversations
    FOR SELECT USING (
        auth.uid()::text IN (
            SELECT user_id FROM user_profiles WHERE id IN (a_id, b_id)
        )
    );

-- MESSAGES: Solo los participantes de la conversación pueden ver los mensajes
CREATE POLICY "Users can view messages in own conversations" ON public.messages
    FOR SELECT USING (
        conversation_id IN (
            SELECT id FROM conversations WHERE 
            auth.uid()::text IN (
                SELECT user_id FROM user_profiles WHERE id IN (a_id, b_id)
            )
        )
    );

CREATE POLICY "Users can send messages in own conversations" ON public.messages
    FOR INSERT WITH CHECK (
        conversation_id IN (
            SELECT id FROM conversations WHERE 
            auth.uid()::text IN (
                SELECT user_id FROM user_profiles WHERE id IN (a_id, b_id)
            )
        ) AND
        auth.uid()::text IN (
            SELECT user_id FROM user_profiles WHERE id = sender_id
        )
    );
```

### 2.3 POLÍTICAS PARA SISTEMA DE PAGOS

**PRIORIDAD: 🟡 ALTA**

```sql
-- =====================================================
-- POLÍTICAS PARA SISTEMA DE PAGOS
-- =====================================================

-- PAYMENTS: Solo el usuario propietario puede ver sus pagos
CREATE POLICY "Users can view own payments" ON public.payments
    FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own payments" ON public.payments
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- SUBSCRIPTIONS: Solo el usuario propietario puede ver sus suscripciones
CREATE POLICY "Users can view own subscriptions" ON public.subscriptions
    FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can manage own subscriptions" ON public.subscriptions
    FOR ALL USING (auth.uid()::text = user_id);

-- PAYMENT_METHODS: Solo el usuario propietario puede ver sus métodos de pago
CREATE POLICY "Users can view own payment methods" ON public.payment_methods
    FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can manage own payment methods" ON public.payment_methods
    FOR ALL USING (auth.uid()::text = user_id);
```

## 📁 PARTE 3: CONFIGURACIÓN DE STORAGE

### 3.1 BUCKETS NECESARIOS

**PRIORIDAD: 🔴 CRÍTICA**

```sql
-- =====================================================
-- CREAR BUCKETS DE STORAGE
-- =====================================================

-- Bucket para imágenes de propiedades
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'property-images',
    'property-images',
    true,
    10485760, -- 10MB
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
);

-- Bucket para avatares de usuarios
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'avatars',
    'avatars',
    true,
    2097152, -- 2MB
    ARRAY['image/jpeg', 'image/png', 'image/webp']
);

-- Bucket para imágenes del módulo comunidad
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'community-photos',
    'community-photos',
    true,
    5242880, -- 5MB
    ARRAY['image/jpeg', 'image/png', 'image/webp']
);

-- Bucket para documentos (contratos, etc.)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'documents',
    'documents',
    false,
    52428800, -- 50MB
    ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
);
```

### 3.2 POLÍTICAS DE STORAGE

**PRIORIDAD: 🔴 CRÍTICA**

```sql
-- =====================================================
-- POLÍTICAS PARA STORAGE BUCKETS
-- =====================================================

-- PROPERTY-IMAGES: Lectura pública, escritura para propietarios
CREATE POLICY "Property images are publicly accessible" ON storage.objects
    FOR SELECT USING (bucket_id = 'property-images');

CREATE POLICY "Users can upload property images" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'property-images' AND
        auth.role() = 'authenticated'
    );

CREATE POLICY "Users can update own property images" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'property-images' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can delete own property images" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'property-images' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- AVATARS: Lectura pública, escritura para el propietario
CREATE POLICY "Avatars are publicly accessible" ON storage.objects
    FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload own avatar" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'avatars' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can update own avatar" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'avatars' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can delete own avatar" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'avatars' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- COMMUNITY-PHOTOS: Lectura pública, escritura para el propietario
CREATE POLICY "Community photos are publicly accessible" ON storage.objects
    FOR SELECT USING (bucket_id = 'community-photos');

CREATE POLICY "Users can upload community photos" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'community-photos' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can manage own community photos" ON storage.objects
    FOR ALL USING (
        bucket_id = 'community-photos' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- DOCUMENTS: Privado, solo para el propietario
CREATE POLICY "Users can access own documents" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'documents' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can manage own documents" ON storage.objects
    FOR ALL USING (
        bucket_id = 'documents' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );
```

## ⚡ PARTE 4: FUNCIONES Y TRIGGERS

### 4.1 FUNCIONES DE UTILIDAD

**PRIORIDAD: 🟡 ALTA**

```sql
-- =====================================================
-- FUNCIONES DE UTILIDAD
-- =====================================================

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Función para crear perfil automáticamente al registrarse
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, avatar_url)
    VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'avatar_url');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para limpiar datos relacionados al eliminar usuario
CREATE OR REPLACE FUNCTION public.handle_user_delete()
RETURNS TRIGGER AS $$
BEGIN
    -- Eliminar todas las propiedades del usuario
    DELETE FROM public.properties WHERE user_id = OLD.id::text;
    
    -- Eliminar perfil de comunidad si existe
    DELETE FROM public.user_profiles WHERE user_id = OLD.id::text;
    
    -- Eliminar otros datos relacionados
    DELETE FROM public.favorites WHERE user_id = OLD.id::text;
    DELETE FROM public.search_history WHERE user_id = OLD.id::text;
    DELETE FROM public.payments WHERE user_id = OLD.id::text;
    DELETE FROM public.subscriptions WHERE user_id = OLD.id::text;
    DELETE FROM public.payment_methods WHERE user_id = OLD.id::text;
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para calcular distancia entre coordenadas
CREATE OR REPLACE FUNCTION calculate_distance(
    lat1 REAL, lon1 REAL, lat2 REAL, lon2 REAL
) RETURNS REAL AS $$
BEGIN
    RETURN (
        6371 * acos(
            cos(radians(lat1)) * cos(radians(lat2)) * 
            cos(radians(lon2) - radians(lon1)) + 
            sin(radians(lat1)) * sin(radians(lat2))
        )
    );
END;
$$ LANGUAGE plpgsql;

-- Función para buscar propiedades por proximidad
CREATE OR REPLACE FUNCTION search_properties_by_location(
    search_lat REAL,
    search_lon REAL,
    radius_km REAL DEFAULT 10
) RETURNS TABLE (
    id TEXT,
    title TEXT,
    price REAL,
    distance REAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.title,
        p.price,
        calculate_distance(search_lat, search_lon, p.latitude, p.longitude) as distance
    FROM properties p
    WHERE p.latitude IS NOT NULL 
      AND p.longitude IS NOT NULL
      AND calculate_distance(search_lat, search_lon, p.latitude, p.longitude) <= radius_km
    ORDER BY distance;
END;
$$ LANGUAGE plpgsql;
```

### 4.2 TRIGGERS AUTOMÁTICOS

**PRIORIDAD: 🟡 ALTA**

```sql
-- =====================================================
-- TRIGGERS AUTOMÁTICOS
-- =====================================================

-- Trigger para updated_at en todas las tablas principales
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_properties_updated_at
    BEFORE UPDATE ON public.properties
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agents_updated_at
    BEFORE UPDATE ON public.agents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rooms_updated_at
    BEFORE UPDATE ON public.rooms
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at
    BEFORE UPDATE ON public.conversations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at
    BEFORE UPDATE ON public.subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_methods_updated_at
    BEFORE UPDATE ON public.payment_methods
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger para crear perfil automáticamente
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger para limpiar datos al eliminar usuario
CREATE TRIGGER on_auth_user_deleted
    AFTER DELETE ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_user_delete();
```

## 🚀 PARTE 5: OPTIMIZACIÓN Y PERFORMANCE

### 5.1 ÍNDICES DE PERFORMANCE

**PRIORIDAD: 🟡 ALTA**

```sql
-- =====================================================
-- ÍNDICES PARA OPTIMIZACIÓN
-- =====================================================

-- Índices para tabla properties (búsquedas más comunes)
CREATE INDEX idx_properties_city_province ON public.properties(city, province);
CREATE INDEX idx_properties_price ON public.properties(price);
CREATE INDEX idx_properties_property_type ON public.properties(property_type);
CREATE INDEX idx_properties_status ON public.properties(status);
CREATE INDEX idx_properties_featured ON public.properties(featured);
CREATE INDEX idx_properties_user_id ON public.properties(user_id);
CREATE INDEX idx_properties_
