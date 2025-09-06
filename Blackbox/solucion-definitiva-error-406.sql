-- =====================================================
-- SOLUCIÓN DEFINITIVA ERROR 406 - TABLA USERS
-- =====================================================

-- 1. CREAR TABLA USERS SI NO EXISTE
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT,
    email TEXT UNIQUE,
    phone TEXT,
    password TEXT,
    avatar TEXT,
    bio TEXT,
    occupation TEXT,
    age INTEGER,
    user_type TEXT,
    company_name TEXT,
    license_number TEXT,
    property_count TEXT,
    full_name TEXT,
    location TEXT,
    search_type TEXT,
    budget_range TEXT,
    profile_image TEXT,
    preferred_areas TEXT,
    family_size INTEGER,
    pet_friendly BOOLEAN,
    move_in_date DATE,
    employment_status TEXT,
    monthly_income NUMERIC,
    verified BOOLEAN DEFAULT false,
    email_verified BOOLEAN DEFAULT false,
    verification_token TEXT,
    rating NUMERIC DEFAULT 0,
    review_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. HABILITAR ROW LEVEL SECURITY
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 3. CREAR POLÍTICAS RLS
-- Política para que usuarios puedan ver su propio perfil
CREATE POLICY IF NOT EXISTS "Users can view own profile" ON public.users
FOR SELECT USING (auth.uid() = id);

-- Política para que usuarios puedan actualizar su propio perfil
CREATE POLICY IF NOT EXISTS "Users can update own profile" ON public.users
FOR UPDATE USING (auth.uid() = id);

-- Política para que usuarios puedan insertar su propio perfil
CREATE POLICY IF NOT EXISTS "Users can insert own profile" ON public.users
FOR INSERT WITH CHECK (auth.uid() = id);

-- 4. CREAR FUNCIÓN PARA SINCRONIZAR CON AUTH.USERS
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, created_at, updated_at)
  VALUES (NEW.id, NEW.email, NEW.created_at, NEW.updated_at);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. CREAR TRIGGER PARA AUTO-CREAR USUARIO EN TABLA USERS
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. INSERTAR USUARIO DE PRUEBA ESPECÍFICO DEL ERROR
INSERT INTO public.users (
    id, 
    name, 
    email, 
    phone, 
    user_type, 
    created_at, 
    updated_at
)
VALUES (
    '6403f9d2-e846-4c70-87e0-e051127d9500',
    'Usuario Test',
    'test@misionesarrienda.com',
    '+54 376 123456',
    'inquilino',
    now(),
    now()
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    user_type = EXCLUDED.user_type,
    updated_at = now();

-- 7. VERIFICAR QUE TODO FUNCIONA
SELECT 
    'Tabla users creada exitosamente' as status,
    COUNT(*) as total_users
FROM public.users;

-- 8. VERIFICAR POLÍTICAS RLS
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd,
    roles
FROM pg_policies 
WHERE tablename = 'users' AND schemaname = 'public';

-- =====================================================
-- EJECUTAR ESTE SCRIPT EN SUPABASE SQL EDITOR
-- =====================================================
