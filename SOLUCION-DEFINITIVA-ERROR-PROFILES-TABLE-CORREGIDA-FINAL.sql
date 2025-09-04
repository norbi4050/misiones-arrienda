-- ============================================================================
-- 🎯 SOLUCIÓN DEFINITIVA ERROR PROFILES TABLE - CORREGIDA FINAL
-- ============================================================================
-- 
-- Este script corrige los errores encontrados en la implementación anterior:
-- 1. Error de tipos UUID vs TEXT
-- 2. Políticas duplicadas (usando IF NOT EXISTS)
-- 3. Triggers duplicados (usando IF NOT EXISTS)
--
-- Fecha: 2025-01-04
-- Estado: CORREGIDO Y OPTIMIZADO
-- ============================================================================

-- 🔧 PASO 1: VERIFICAR Y CREAR TABLA PROFILES SI NO EXISTE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    email TEXT,
    user_type TEXT CHECK (user_type IN ('inquilino', 'propietario', 'inmobiliaria')),
    phone TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 🔧 PASO 2: HABILITAR RLS EN TABLA PROFILES
-- ============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 🔧 PASO 3: CREAR POLÍTICAS RLS CORREGIDAS (CON IF NOT EXISTS)
-- ============================================================================

-- Eliminar políticas existentes si tienen problemas de tipos
DROP POLICY IF EXISTS "Users can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- Crear políticas con tipos correctos
CREATE POLICY "Users can view profiles" ON public.profiles
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid()::text = id::text);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid()::text = id::text);

-- 🔧 PASO 4: VERIFICAR Y CREAR TABLA PROPERTIES SI NO EXISTE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.properties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2),
    currency TEXT DEFAULT 'ARS',
    property_type TEXT,
    location TEXT,
    bedrooms INTEGER,
    bathrooms INTEGER,
    area DECIMAL(10,2),
    images TEXT[],
    contact_phone TEXT,
    contact_email TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 🔧 PASO 5: HABILITAR RLS EN TABLA PROPERTIES
-- ============================================================================
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

-- 🔧 PASO 6: CREAR POLÍTICAS RLS PARA PROPERTIES
-- ============================================================================

-- Eliminar políticas existentes si existen
DROP POLICY IF EXISTS "Anyone can view properties" ON public.properties;
DROP POLICY IF EXISTS "Authenticated users can insert properties" ON public.properties;
DROP POLICY IF EXISTS "Users can update own properties" ON public.properties;

-- Crear políticas para properties
CREATE POLICY "Anyone can view properties" ON public.properties
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert properties" ON public.properties
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update own properties" ON public.properties
    FOR UPDATE USING (auth.uid()::text = user_id::text);

-- 🔧 PASO 7: FUNCIÓN PARA CREAR PERFIL AUTOMÁTICAMENTE (CORREGIDA)
-- ============================================================================

-- Eliminar función existente si existe
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Crear función corregida
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, user_type)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'user_type', 'inquilino')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 🔧 PASO 8: TRIGGER PARA EJECUTAR LA FUNCIÓN (CORREGIDO)
-- ============================================================================

-- Eliminar trigger existente si existe
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Crear trigger corregido
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 🔧 PASO 9: VERIFICACIONES FINALES
-- ============================================================================

-- Verificar que las tablas existen
SELECT 'profiles table exists' as status WHERE EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'profiles'
);

SELECT 'properties table exists' as status WHERE EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'properties'
);

-- Verificar que RLS está habilitado
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('profiles', 'properties');

-- Verificar políticas
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('profiles', 'properties');

-- ============================================================================
-- ✅ SCRIPT COMPLETADO
-- ============================================================================
-- 
-- Este script debería ejecutarse sin errores y resolver:
-- ✅ Tabla profiles creada y accesible
-- ✅ Tabla properties creada y accesible  
-- ✅ Políticas RLS configuradas correctamente
-- ✅ Trigger de creación automática de perfiles funcionando
-- ✅ Tipos de datos UUID vs TEXT corregidos
-- 
-- Próximo paso: Ejecutar testing para verificar que todo funciona
-- ============================================================================
