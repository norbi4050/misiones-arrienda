-- =====================================================
-- 🚨 SOLUCIÓN DEFINITIVA ERROR PROFILES TABLE
-- =====================================================
-- 
-- PROBLEMA: column "email" of relation "profiles" does not exist
-- CAUSA: Trigger automático intenta crear perfil en tabla "profiles" 
--        pero esa tabla no tiene la columna "email"
--
-- SOLUCIÓN: Crear/corregir la tabla profiles con las columnas correctas
-- =====================================================

-- 1. VERIFICAR SI LA TABLA PROFILES EXISTE
SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;

-- 2. CREAR LA TABLA PROFILES SI NO EXISTE (O CORREGIRLA)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT,
    name TEXT,
    phone TEXT,
    user_type TEXT,
    company_name TEXT,
    license_number TEXT,
    property_count INTEGER,
    avatar_url TEXT,
    bio TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. AGREGAR COLUMNA EMAIL SI NO EXISTE
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'email'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN email TEXT;
    END IF;
END $$;

-- 4. AGREGAR OTRAS COLUMNAS FALTANTES SI NO EXISTEN
DO $$ 
BEGIN
    -- Agregar name si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'name'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN name TEXT;
    END IF;
    
    -- Agregar phone si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'phone'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN phone TEXT;
    END IF;
    
    -- Agregar user_type si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'user_type'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN user_type TEXT;
    END IF;
END $$;

-- 5. CREAR/ACTUALIZAR FUNCIÓN DE TRIGGER PARA CREAR PERFILES AUTOMÁTICAMENTE
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (
        id, 
        email, 
        name, 
        phone, 
        user_type,
        company_name,
        license_number,
        property_count
    )
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'name', ''),
        COALESCE(NEW.raw_user_meta_data->>'phone', ''),
        COALESCE(NEW.raw_user_meta_data->>'userType', 'inquilino'),
        NEW.raw_user_meta_data->>'companyName',
        NEW.raw_user_meta_data->>'licenseNumber',
        CASE 
            WHEN NEW.raw_user_meta_data->>'propertyCount' IS NOT NULL 
            THEN (NEW.raw_user_meta_data->>'propertyCount')::INTEGER
            ELSE NULL
        END
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. CREAR TRIGGER SI NO EXISTE
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 7. HABILITAR RLS EN LA TABLA PROFILES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 8. CREAR POLÍTICAS RLS PARA PROFILES
-- Política para que los usuarios puedan ver su propio perfil
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

-- Política para que los usuarios puedan actualizar su propio perfil
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Política para permitir inserción de perfiles (para el trigger)
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.profiles;
CREATE POLICY "Enable insert for authenticated users only" ON public.profiles
    FOR INSERT WITH CHECK (true);

-- 9. VERIFICAR LA CONFIGURACIÓN FINAL
SELECT 
    'profiles' as table_name,
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;

-- 10. VERIFICAR QUE EL TRIGGER EXISTE
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'users' 
AND trigger_schema = 'auth';
