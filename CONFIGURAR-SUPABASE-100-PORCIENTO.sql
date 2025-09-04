-- SCRIPT COMPLETO PARA OBTENER 100/100 EN SUPABASE
-- Ejecuta este script en Supabase Dashboard > SQL Editor

-- 1. CREAR TABLA PROFILES
CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    phone TEXT,
    user_type TEXT DEFAULT 'inquilino' CHECK (user_type IN ('inquilino', 'propietario', 'inmobiliaria')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. CREAR TABLA PROPERTIES
CREATE TABLE IF NOT EXISTS properties (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'ARS',
    property_type TEXT NOT NULL,
    operation_type TEXT NOT NULL,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    province TEXT NOT NULL,
    bedrooms INTEGER,
    bathrooms INTEGER,
    area DECIMAL(8,2),
    images TEXT[],
    contact_phone TEXT,
    contact_email TEXT,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'rented', 'sold')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. HABILITAR RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

-- 4. POLÍTICAS PARA PROFILES
CREATE POLICY "Usuarios pueden ver su propio perfil" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Usuarios pueden actualizar su propio perfil" ON profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Usuarios pueden insertar su propio perfil" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- 5. POLÍTICAS PARA PROPERTIES
CREATE POLICY "Cualquiera puede ver propiedades activas" ON properties
    FOR SELECT USING (status = 'active');

CREATE POLICY "Usuarios pueden crear sus propias propiedades" ON properties
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden actualizar sus propias propiedades" ON properties
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden eliminar sus propias propiedades" ON properties
    FOR DELETE USING (auth.uid() = user_id);

-- 6. POLÍTICAS DE STORAGE (si no existen)
CREATE POLICY "Cualquiera puede ver imágenes de propiedades" ON storage.objects
    FOR SELECT USING (bucket_id = 'property-images');

CREATE POLICY "Usuarios autenticados pueden subir imágenes" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'property-images' AND auth.role() = 'authenticated');

-- 7. FUNCIÓN PARA CREAR PERFIL AUTOMÁTICAMENTE
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. TRIGGER PARA CREAR PERFIL AUTOMÁTICAMENTE
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ¡LISTO! Ahora ejecuta el testing para obtener 100/100
