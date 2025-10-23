-- =====================================================
-- FIX CRÍTICO: Actualizar handle_new_user() para usar tabla User correcta
-- =====================================================
-- PROBLEMA: La función está intentando insertar en "profiles" que no existe
--           Debe insertar en "User" (con U mayúscula y comillas)
-- =====================================================

-- 1. Actualizar la función handle_new_user() con la lógica correcta
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Insertar en la tabla User (con U mayúscula)
  INSERT INTO public."User" (
    id,
    email,
    name,
    phone,
    password,
    avatar,
    verified,
    emailVerified,
    rating,
    reviewCount,
    userType,
    companyName,
    licenseNumber,
    propertyCount,
    createdAt,
    updatedAt
  )
  VALUES (
    NEW.id::text,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'name',
      NEW.raw_user_meta_data->>'full_name',
      NEW.email
    ),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    '', -- password (vacío, manejado por Supabase Auth)
    NEW.raw_user_meta_data->>'profileImage',
    false,
    (NEW.email_confirmed_at IS NOT NULL),
    0,
    0,
    COALESCE(NEW.raw_user_meta_data->>'userType', 'inquilino'),
    NEW.raw_user_meta_data->>'companyName',
    NEW.raw_user_meta_data->>'licenseNumber',
    NEW.raw_user_meta_data->>'propertyCount',
    NEW.created_at,
    NEW.created_at
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- 2. Verificar que el trigger existe y apunta a la función correcta
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 3. Verificación
SELECT
  'Función actualizada' as status,
  proname as function_name,
  prosrc as source_code
FROM pg_proc
WHERE proname = 'handle_new_user'
  AND pronamespace = 'public'::regnamespace;

-- 4. Verificar que el trigger está activo
SELECT
  trigger_name,
  event_manipulation,
  action_timing,
  'ACTIVO' as estado
FROM information_schema.triggers
WHERE event_object_schema = 'auth'
  AND event_object_table = 'users'
  AND trigger_name = 'on_auth_user_created';

-- =====================================================
-- SIGUIENTE PASO
-- =====================================================
-- Después de ejecutar este SQL:
-- 1. Intentar crear un nuevo usuario de prueba
-- 2. Debería funcionar sin error 500
-- =====================================================
