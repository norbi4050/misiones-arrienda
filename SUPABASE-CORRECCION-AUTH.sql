-- CORRECCIÓN 2: Configuración de Autenticación
-- Habilitar y configurar Auth en Supabase

-- 1. Verificar que Auth esté habilitado
SELECT 
    schemaname,
    tablename 
FROM pg_tables 
WHERE schemaname = 'auth' 
ORDER BY tablename;

-- 2. Configurar políticas RLS para usuarios
-- Política para permitir que usuarios vean su propio perfil
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = user_id);

-- Política para permitir que usuarios actualicen su propio perfil
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = user_id);

-- Política para permitir inserción de nuevos perfiles
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 3. Configurar políticas para propiedades
-- Permitir lectura pública de propiedades
DROP POLICY IF EXISTS "Public can view properties" ON properties;
CREATE POLICY "Public can view properties" ON properties
    FOR SELECT USING (true);

-- Solo usuarios autenticados pueden crear propiedades
DROP POLICY IF EXISTS "Authenticated users can create properties" ON properties;
CREATE POLICY "Authenticated users can create properties" ON properties
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Solo el propietario puede actualizar sus propiedades
DROP POLICY IF EXISTS "Users can update own properties" ON properties;
CREATE POLICY "Users can update own properties" ON properties
    FOR UPDATE USING (auth.uid() = user_id);

-- 4. Habilitar RLS en todas las tablas
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

-- 5. Crear función para manejar nuevos usuarios
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, name)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'name');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Crear trigger para nuevos usuarios
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Verificar configuración
SELECT 
    tablename,
    rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('profiles', 'properties');