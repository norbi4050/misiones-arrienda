-- =====================================================
-- SCRIPT SQL SUPABASE CORREGIDO - COLUMNA IS_ACTIVE
-- Maneja políticas existentes y corrige problema de columna faltante
-- =====================================================

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- 1. VERIFICAR Y AGREGAR COLUMNA IS_ACTIVE SI NO EXISTE
-- =====================================================

-- Agregar columna is_active a la tabla properties si no existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'properties' 
        AND column_name = 'is_active' 
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.properties ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
        RAISE NOTICE 'Columna is_active agregada a la tabla properties';
    ELSE
        RAISE NOTICE 'Columna is_active ya existe en la tabla properties';
    END IF;
END $$;

-- =====================================================
-- 2. CREACIÓN DE TABLAS PRINCIPALES (SI NO EXISTEN)
-- =====================================================

-- Tabla de perfiles de usuario
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    user_type TEXT CHECK (user_type IN ('inquilino', 'propietario', 'inmobiliaria')) DEFAULT 'inquilino',
    phone TEXT,
    bio TEXT,
    location TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de propiedades (con todas las columnas necesarias)
CREATE TABLE IF NOT EXISTS public.properties (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    price DECIMAL(12,2) NOT NULL,
    currency TEXT DEFAULT 'ARS',
    property_type TEXT CHECK (property_type IN ('casa', 'departamento', 'local', 'oficina', 'terreno', 'quinta')) NOT NULL,
    operation_type TEXT CHECK (operation_type IN ('alquiler', 'venta')) DEFAULT 'alquiler',
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    province TEXT DEFAULT 'Misiones',
    country TEXT DEFAULT 'Argentina',
    bedrooms INTEGER DEFAULT 0,
    bathrooms INTEGER DEFAULT 0,
    area_total DECIMAL(10,2),
    area_covered DECIMAL(10,2),
    garage BOOLEAN DEFAULT FALSE,
    pool BOOLEAN DEFAULT FALSE,
    garden BOOLEAN DEFAULT FALSE,
    furnished BOOLEAN DEFAULT FALSE,
    pets_allowed BOOLEAN DEFAULT FALSE,
    images TEXT[] DEFAULT '{}',
    contact_phone TEXT,
    contact_email TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    is_featured BOOLEAN DEFAULT FALSE,
    views_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 3. CONFIGURACIÓN DE ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Habilitar RLS en las tablas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 4. ELIMINAR POLÍTICAS EXISTENTES Y CREAR NUEVAS
-- =====================================================

-- Eliminar políticas existentes para profiles
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can delete their own profile" ON public.profiles;

-- Crear nuevas políticas para profiles
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid()::text = id::text);

CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid()::text = id::text);

CREATE POLICY "Users can delete their own profile" ON public.profiles
    FOR DELETE USING (auth.uid()::text = id::text);

-- Eliminar políticas existentes para properties
DROP POLICY IF EXISTS "Properties are viewable by everyone" ON public.properties;
DROP POLICY IF EXISTS "Authenticated users can insert properties" ON public.properties;
DROP POLICY IF EXISTS "Users can update their own properties" ON public.properties;
DROP POLICY IF EXISTS "Users can delete their own properties" ON public.properties;

-- Verificar que la columna is_active existe antes de crear políticas
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'properties' 
        AND column_name = 'is_active' 
        AND table_schema = 'public'
    ) THEN
        -- Crear políticas para properties con is_active
        EXECUTE 'CREATE POLICY "Properties are viewable by everyone" ON public.properties
            FOR SELECT USING (is_active = true)';
        
        EXECUTE 'CREATE POLICY "Authenticated users can insert properties" ON public.properties
            FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND auth.uid()::text = user_id::text)';
        
        EXECUTE 'CREATE POLICY "Users can update their own properties" ON public.properties
            FOR UPDATE USING (auth.uid()::text = user_id::text)';
        
        EXECUTE 'CREATE POLICY "Users can delete their own properties" ON public.properties
            FOR DELETE USING (auth.uid()::text = user_id::text)';
        
        RAISE NOTICE 'Políticas para properties creadas con columna is_active';
    ELSE
        -- Crear políticas para properties sin is_active
        EXECUTE 'CREATE POLICY "Properties are viewable by everyone" ON public.properties
            FOR SELECT USING (true)';
        
        EXECUTE 'CREATE POLICY "Authenticated users can insert properties" ON public.properties
            FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND auth.uid()::text = user_id::text)';
        
        EXECUTE 'CREATE POLICY "Users can update their own properties" ON public.properties
            FOR UPDATE USING (auth.uid()::text = user_id::text)';
        
        EXECUTE 'CREATE POLICY "Users can delete their own properties" ON public.properties
            FOR DELETE USING (auth.uid()::text = user_id::text)';
        
        RAISE NOTICE 'Políticas para properties creadas sin columna is_active';
    END IF;
END $$;

-- =====================================================
-- 5. FUNCIONES Y TRIGGERS
-- =====================================================

-- Función para manejar nuevos usuarios
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        NEW.raw_user_meta_data->>'avatar_url'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para crear perfil automáticamente
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Función para actualizar timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
DROP TRIGGER IF EXISTS handle_updated_at_profiles ON public.profiles;
CREATE TRIGGER handle_updated_at_profiles
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_updated_at_properties ON public.properties;
CREATE TRIGGER handle_updated_at_properties
    BEFORE UPDATE ON public.properties
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- =====================================================
-- 6. CONFIGURACIÓN DE STORAGE
-- =====================================================

-- Crear buckets de storage si no existen
INSERT INTO storage.buckets (id, name, public)
VALUES 
    ('property-images', 'property-images', true),
    ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 7. POLÍTICAS DE STORAGE (ELIMINAR Y RECREAR)
-- =====================================================

-- Eliminar políticas existentes de storage
DROP POLICY IF EXISTS "Property images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload property images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own property images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own property images" ON storage.objects;
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatars" ON storage.objects;

-- Crear nuevas políticas para property-images
CREATE POLICY "Property images are publicly accessible" ON storage.objects
    FOR SELECT USING (bucket_id = 'property-images');

CREATE POLICY "Authenticated users can upload property images" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'property-images' 
        AND auth.role() = 'authenticated'
    );

CREATE POLICY "Users can update their own property images" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'property-images' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can delete their own property images" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'property-images' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- Crear nuevas políticas para avatars
CREATE POLICY "Avatar images are publicly accessible" ON storage.objects
    FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Authenticated users can upload avatars" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'avatars' 
        AND auth.role() = 'authenticated'
    );

CREATE POLICY "Users can update their own avatars" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'avatars' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can delete their own avatars" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'avatars' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- =====================================================
-- 8. ÍNDICES PARA PERFORMANCE
-- =====================================================

-- Índices para la tabla properties
CREATE INDEX IF NOT EXISTS idx_properties_user_id ON public.properties(user_id);
CREATE INDEX IF NOT EXISTS idx_properties_city ON public.properties(city);
CREATE INDEX IF NOT EXISTS idx_properties_property_type ON public.properties(property_type);
CREATE INDEX IF NOT EXISTS idx_properties_operation_type ON public.properties(operation_type);
CREATE INDEX IF NOT EXISTS idx_properties_price ON public.properties(price);
CREATE INDEX IF NOT EXISTS idx_properties_is_featured ON public.properties(is_featured);
CREATE INDEX IF NOT EXISTS idx_properties_created_at ON public.properties(created_at);

-- Crear índice para is_active solo si la columna existe
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'properties' 
        AND column_name = 'is_active' 
        AND table_schema = 'public'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_properties_is_active ON public.properties(is_active);
        RAISE NOTICE 'Índice para is_active creado';
    END IF;
END $$;

-- Índices para la tabla profiles
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_user_type ON public.profiles(user_type);
CREATE INDEX IF NOT EXISTS idx_profiles_location ON public.profiles(location);

-- =====================================================
-- 9. VERIFICACIÓN FINAL
-- =====================================================

-- Verificar que las tablas se crearon correctamente
DO $$
BEGIN
    -- Verificar tabla profiles
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles' AND table_schema = 'public') THEN
        RAISE EXCEPTION 'Error: Tabla profiles no fue creada correctamente';
    END IF;
    
    -- Verificar tabla properties
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'properties' AND table_schema = 'public') THEN
        RAISE EXCEPTION 'Error: Tabla properties no fue creada correctamente';
    END IF;
    
    -- Verificar que RLS está habilitado
    IF NOT EXISTS (
        SELECT 1 FROM pg_class c 
        JOIN pg_namespace n ON n.oid = c.relnamespace 
        WHERE c.relname = 'profiles' AND n.nspname = 'public' AND c.relrowsecurity = true
    ) THEN
        RAISE EXCEPTION 'Error: RLS no está habilitado en la tabla profiles';
    END IF;
    
    -- Verificar columna is_active
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'properties' 
        AND column_name = 'is_active' 
        AND table_schema = 'public'
    ) THEN
        RAISE NOTICE 'Columna is_active verificada correctamente';
    ELSE
        RAISE NOTICE 'Columna is_active no existe - políticas creadas sin esta restricción';
    END IF;
    
    RAISE NOTICE 'Configuración de Supabase completada exitosamente';
END $$;

-- =====================================================
-- SCRIPT COMPLETADO - VERSIÓN CORREGIDA COLUMNA IS_ACTIVE
-- =====================================================
