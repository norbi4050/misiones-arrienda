-- =====================================================
-- SCRIPT CORRECCIÓN AUTOMÁTICA SUPABASE 100%
-- =====================================================
-- Este script corrige todos los problemas detectados
-- para llevar Supabase de 35% a 100% funcional

-- 1. CREAR TABLAS PRINCIPALES
-- =====================================================

-- Tabla profiles (si no existe)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT,
    full_name TEXT,
    avatar_url TEXT,
    phone TEXT,
    user_type TEXT DEFAULT 'inquilino' CHECK (user_type IN ('inquilino', 'propietario', 'inmobiliaria')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla properties (si no existe)
CREATE TABLE IF NOT EXISTS public.properties (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'ARS',
    property_type TEXT NOT NULL,
    bedrooms INTEGER,
    bathrooms INTEGER,
    area DECIMAL(8,2),
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT DEFAULT 'Misiones',
    country TEXT DEFAULT 'Argentina',
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    images TEXT[],
    amenities TEXT[],
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'rented')),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    contact_phone TEXT,
    contact_email TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. CONFIGURAR RLS (ROW LEVEL SECURITY)
-- =====================================================

-- Habilitar RLS en profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Políticas para profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (id = auth.uid());

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (id = auth.uid());

-- Habilitar RLS en properties
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

-- Políticas para properties
DROP POLICY IF EXISTS "Anyone can view active properties" ON public.properties;
CREATE POLICY "Anyone can view active properties" ON public.properties
    FOR SELECT USING (status = 'active');

DROP POLICY IF EXISTS "Owners can manage their properties" ON public.properties;
CREATE POLICY "Owners can manage their properties" ON public.properties
    FOR ALL USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Authenticated users can create properties" ON public.properties;
CREATE POLICY "Authenticated users can create properties" ON public.properties
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- 3. CREAR FUNCIONES Y TRIGGERS
-- =====================================================

-- Función para crear perfil automáticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para crear perfil automáticamente
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
DROP TRIGGER IF EXISTS handle_updated_at ON public.profiles;
CREATE TRIGGER handle_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_updated_at ON public.properties;
CREATE TRIGGER handle_updated_at
    BEFORE UPDATE ON public.properties
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 4. CONFIGURAR STORAGE POLICIES
-- =====================================================

-- Política para property-images
DROP POLICY IF EXISTS "Anyone can view property images" ON storage.objects;
CREATE POLICY "Anyone can view property images" ON storage.objects
    FOR SELECT USING (bucket_id = 'property-images');

DROP POLICY IF EXISTS "Authenticated users can upload property images" ON storage.objects;
CREATE POLICY "Authenticated users can upload property images" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'property-images' AND auth.role() = 'authenticated');

-- Política para avatars
DROP POLICY IF EXISTS "Users can view avatars" ON storage.objects;
CREATE POLICY "Users can view avatars" ON storage.objects
    FOR SELECT USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Users can upload own avatar" ON storage.objects;
CREATE POLICY "Users can upload own avatar" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');

-- 5. CREAR ÍNDICES PARA PERFORMANCE
-- =====================================================

-- Índices para properties
CREATE INDEX IF NOT EXISTS idx_properties_city ON public.properties(city);
CREATE INDEX IF NOT EXISTS idx_properties_status ON public.properties(status);
CREATE INDEX IF NOT EXISTS idx_properties_price ON public.properties(price);
CREATE INDEX IF NOT EXISTS idx_properties_user ON public.properties(user_id);
CREATE INDEX IF NOT EXISTS idx_properties_created ON public.properties(created_at);

-- Índices para profiles
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_user_type ON public.profiles(user_type);

-- 6. INSERTAR DATOS DE EJEMPLO (OPCIONAL)
-- =====================================================

-- Solo insertar si no hay datos
INSERT INTO public.properties (
    title, description, price, property_type, bedrooms, bathrooms, 
    area, address, city, contact_phone, contact_email
)
SELECT 
    'Casa en Posadas Centro',
    'Hermosa casa de 3 dormitorios en el centro de Posadas',
    150000.00,
    'casa',
    3,
    2,
    120.00,
    'Av. Mitre 1234',
    'Posadas',
    '+54 376 123456',
    'contacto@ejemplo.com'
WHERE NOT EXISTS (SELECT 1 FROM public.properties LIMIT 1);

-- 7. VERIFICAR CONFIGURACIÓN
-- =====================================================

-- Verificar que las tablas existen
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') THEN
        RAISE EXCEPTION 'Tabla profiles no fue creada correctamente';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'properties') THEN
        RAISE EXCEPTION 'Tabla properties no fue creada correctamente';
    END IF;
    
    RAISE NOTICE 'Configuración completada exitosamente';
END $$;

-- =====================================================
-- SCRIPT COMPLETADO
-- =====================================================
-- Este script debería llevar Supabase de 35% a 100%
-- Ejecutar en el SQL Editor de Supabase Dashboard
