-- =====================================================
-- 🔧 SOLUCIÓN DEFINITIVA ERROR PROFILES TABLE COMPLETA
-- =====================================================
-- 
-- Este script corrige TODOS los errores de columnas faltantes
-- en la tabla profiles basado en los logs de error reales
-- =====================================================

-- Verificar estructura actual de la tabla profiles
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- =====================================================
-- AGREGAR TODAS LAS COLUMNAS FALTANTES
-- =====================================================

-- 1. Agregar columna company_name (error detectado en logs)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'company_name'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN company_name TEXT;
        RAISE NOTICE 'Columna company_name agregada exitosamente';
    ELSE
        RAISE NOTICE 'Columna company_name ya existe';
    END IF;
END $$;

-- 2. Agregar columna email (si no existe)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'email'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN email TEXT;
        RAISE NOTICE 'Columna email agregada exitosamente';
    ELSE
        RAISE NOTICE 'Columna email ya existe';
    END IF;
END $$;

-- 3. Agregar columna name (si no existe)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'name'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN name TEXT;
        RAISE NOTICE 'Columna name agregada exitosamente';
    ELSE
        RAISE NOTICE 'Columna name ya existe';
    END IF;
END $$;

-- 4. Agregar columna phone (si no existe)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'phone'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN phone TEXT;
        RAISE NOTICE 'Columna phone agregada exitosamente';
    ELSE
        RAISE NOTICE 'Columna phone ya existe';
    END IF;
END $$;

-- 5. Agregar columna user_type (si no existe)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'user_type'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN user_type TEXT;
        RAISE NOTICE 'Columna user_type agregada exitosamente';
    ELSE
        RAISE NOTICE 'Columna user_type ya existe';
    END IF;
END $$;

-- 6. Agregar columna business_type (para inmobiliarias)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'business_type'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN business_type TEXT;
        RAISE NOTICE 'Columna business_type agregada exitosamente';
    ELSE
        RAISE NOTICE 'Columna business_type ya existe';
    END IF;
END $$;

-- 7. Agregar columna address (dirección de la empresa)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'address'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN address TEXT;
        RAISE NOTICE 'Columna address agregada exitosamente';
    ELSE
        RAISE NOTICE 'Columna address ya existe';
    END IF;
END $$;

-- 8. Agregar columna website (sitio web de la empresa)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'website'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN website TEXT;
        RAISE NOTICE 'Columna website agregada exitosamente';
    ELSE
        RAISE NOTICE 'Columna website ya existe';
    END IF;
END $$;

-- 9. Agregar columna description (descripción del perfil)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'description'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN description TEXT;
        RAISE NOTICE 'Columna description agregada exitosamente';
    ELSE
        RAISE NOTICE 'Columna description ya existe';
    END IF;
END $$;

-- 10. Agregar columna avatar_url (foto de perfil)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'avatar_url'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN avatar_url TEXT;
        RAISE NOTICE 'Columna avatar_url agregada exitosamente';
    ELSE
        RAISE NOTICE 'Columna avatar_url ya existe';
    END IF;
END $$;

-- =====================================================
-- ACTUALIZAR/CREAR TRIGGER FUNCTION COMPLETA
-- =====================================================

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
    business_type,
    address,
    website,
    description,
    avatar_url,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    COALESCE(NEW.raw_user_meta_data->>'userType', 'inquilino'),
    COALESCE(NEW.raw_user_meta_data->>'company_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'business_type', ''),
    COALESCE(NEW.raw_user_meta_data->>'address', ''),
    COALESCE(NEW.raw_user_meta_data->>'website', ''),
    COALESCE(NEW.raw_user_meta_data->>'description', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', ''),
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- RECREAR TRIGGER
-- =====================================================

-- Eliminar trigger existente si existe
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Crear nuevo trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- VERIFICACIÓN FINAL
-- =====================================================

-- Mostrar estructura final de la tabla
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Verificar que el trigger existe
SELECT 
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- =====================================================
-- MENSAJE DE CONFIRMACIÓN
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '✅ SOLUCIÓN COMPLETA APLICADA EXITOSAMENTE';
    RAISE NOTICE '📋 Todas las columnas necesarias han sido agregadas a la tabla profiles';
    RAISE NOTICE '🔧 Trigger function actualizada con todas las columnas';
    RAISE NOTICE '⚡ Trigger recreado y activo';
    RAISE NOTICE '🎯 El error "column company_name does not exist" está solucionado';
    RAISE NOTICE '🚀 El sistema de registro debería funcionar correctamente ahora';
END $$;
