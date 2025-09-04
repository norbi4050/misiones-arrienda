-- =====================================================
-- SUPABASE - SOLUCIÓN SEGURA SIN DEADLOCK
-- Proyecto: Misiones Arrienda
-- Ejecutar paso a paso para evitar conflictos
-- =====================================================

-- PASO 1: CREAR TABLAS BÁSICAS (ejecutar primero)
-- =====================================================

-- Tabla profiles (la más importante)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    user_type TEXT CHECK (user_type IN ('inquilino', 'propietario', 'inmobiliaria')) DEFAULT 'inquilino',
    phone TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla properties
CREATE TABLE IF NOT EXISTS public.properties (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    price DECIMAL(12,2) NOT NULL,
    location TEXT NOT NULL,
    property_type TEXT NOT NULL,
    operation_type TEXT NOT NULL,
    bedrooms INTEGER,
    bathrooms INTEGER,
    area DECIMAL(10,2),
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    images TEXT[],
    amenities TEXT[],
    contact_phone TEXT,
    contact_email TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- PARAR AQUÍ - Ejecutar este bloque primero, luego continuar
