-- =====================================================
-- FIX: Crear usuario admin bypaseando trigger problemático
-- Fecha: 2025-10-22
-- =====================================================

-- PASO 1: Deshabilitar el trigger temporalmente
ALTER TABLE auth.users DISABLE TRIGGER on_auth_user_created;

-- PASO 2: Verificar si la tabla profiles existe, si no, crearla
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- PASO 3: Habilitar RLS en profiles si no está habilitado
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- PASO 4: Crear políticas RLS si no existen
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'profiles' AND policyname = 'Users can view own profile'
  ) THEN
    CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT TO authenticated
    USING (auth.uid() = id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'profiles' AND policyname = 'Users can insert own profile'
  ) THEN
    CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'profiles' AND policyname = 'Users can update own profile'
  ) THEN
    CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE TO authenticated
    USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
  END IF;
END $$;

-- PASO 5: Verificar/crear la función handle_new_user (mejorada para evitar errores)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- Insertar en profiles con manejo de errores
  BEGIN
    INSERT INTO public.profiles (id, full_name, avatar_url)
    VALUES (
      new.id,
      COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', new.email),
      new.raw_user_meta_data->>'avatar_url'
    )
    ON CONFLICT (id) DO NOTHING;
  EXCEPTION
    WHEN OTHERS THEN
      -- Log el error pero no fallar la creación del usuario
      RAISE WARNING 'Error creating profile for user %: %', new.id, SQLERRM;
  END;

  RETURN new;
END;
$$;

-- PASO 6: Re-habilitar el trigger (ahora con función mejorada)
ALTER TABLE auth.users ENABLE TRIGGER on_auth_user_created;

-- PASO 7: Recrear el trigger para asegurar que use la función actualizada
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- INFORMACIÓN
-- =====================================================
-- Después de ejecutar este SQL:
-- 1. Intenta crear el usuario admin desde el Dashboard de Supabase
-- 2. Email: misionesarrienda@gmail.com
-- 3. Password: (la que elijas)
-- 4. Marca "Auto Confirm User"
-- 5. Si sigue fallando, ejecuta el siguiente bloque comentado:

/*
-- PLAN B: Deshabilitar completamente el trigger
ALTER TABLE auth.users DISABLE TRIGGER on_auth_user_created;

-- Ahora crea el usuario desde el Dashboard
-- Después, ejecuta esto para crear el perfil manualmente (reemplaza el UUID):

INSERT INTO public.profiles (id, full_name, created_at, updated_at)
VALUES (
  'REEMPLAZAR-CON-UUID-DEL-USUARIO',
  'Admin Misiones Arrienda',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- Y re-habilita el trigger para futuros usuarios:
ALTER TABLE auth.users ENABLE TRIGGER on_auth_user_created;
*/
