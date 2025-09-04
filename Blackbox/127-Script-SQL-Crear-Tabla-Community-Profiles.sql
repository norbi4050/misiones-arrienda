-- ========================================
-- BLACKBOX AI - SCRIPT SQL CREAR TABLA COMMUNITY_PROFILES
-- Fecha: 3 de Enero 2025
-- Objetivo: Crear tabla community_profiles faltante con estructura completa
-- ========================================

-- 1. CREAR TABLA COMMUNITY_PROFILES
CREATE TABLE IF NOT EXISTS public.community_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT NOT NULL,
    bio TEXT,
    interests TEXT[],
    location TEXT,
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Campos adicionales para funcionalidad completa
    age INTEGER,
    gender TEXT,
    occupation TEXT,
    phone TEXT,
    email TEXT,
    social_links JSONB DEFAULT '{}',
    preferences JSONB DEFAULT '{}',
    verification_status TEXT DEFAULT 'pending',
    last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Índices únicos
    UNIQUE(user_id)
);

-- 2. CREAR ÍNDICES PARA OPTIMIZACIÓN
CREATE INDEX IF NOT EXISTS idx_community_profiles_user_id ON public.community_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_community_profiles_is_active ON public.community_profiles(is_active);
CREATE INDEX IF NOT EXISTS idx_community_profiles_location ON public.community_profiles(location);
CREATE INDEX IF NOT EXISTS idx_community_profiles_created_at ON public.community_profiles(created_at);

-- 3. CREAR TRIGGER PARA UPDATED_AT
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_community_profiles_updated_at 
    BEFORE UPDATE ON public.community_profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 4. CONFIGURAR ROW LEVEL SECURITY (RLS)
ALTER TABLE public.community_profiles ENABLE ROW LEVEL SECURITY;

-- 5. CREAR POLÍTICAS DE SEGURIDAD
-- Política para que los usuarios puedan ver todos los perfiles activos
CREATE POLICY "Allow users to view active community profiles" ON public.community_profiles
    FOR SELECT USING (is_active = true);

-- Política para que los usuarios puedan crear su propio perfil
CREATE POLICY "Allow users to create their own community profile" ON public.community_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Política para que los usuarios puedan actualizar su propio perfil
CREATE POLICY "Allow users to update their own community profile" ON public.community_profiles
    FOR UPDATE USING (auth.uid() = user_id);

-- Política para que los usuarios puedan eliminar su propio perfil
CREATE POLICY "Allow users to delete their own community profile" ON public.community_profiles
    FOR DELETE USING (auth.uid() = user_id);

-- 6. INSERTAR DATOS DE EJEMPLO (OPCIONAL)
INSERT INTO public.community_profiles (
    user_id, 
    display_name, 
    bio, 
    interests, 
    location, 
    age, 
    gender, 
    occupation
) VALUES 
(
    (SELECT id FROM auth.users LIMIT 1),
    'Usuario Demo',
    'Perfil de demostración para la comunidad',
    ARRAY['tecnología', 'inmuebles', 'networking'],
    'Posadas, Misiones',
    30,
    'No especificado',
    'Desarrollador'
) ON CONFLICT (user_id) DO NOTHING;

-- 7. VERIFICAR CREACIÓN
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'community_profiles' 
ORDER BY ordinal_position;

-- 8. VERIFICAR POLÍTICAS
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'community_profiles';

-- Mensaje de confirmación
SELECT 'Tabla community_profiles creada exitosamente con todas las políticas de seguridad' as resultado;
