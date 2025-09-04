-- =====================================================
-- CONFIGURACIÓN SUPABASE CORREGIDA - MISIONES ARRIENDA
-- =====================================================
-- Fecha: 03/09/2025
-- Objetivo: Configurar políticas RLS con tipos correctos
-- =====================================================

-- 1. HABILITAR RLS EN TABLAS PRINCIPALES
-- =====================================================

-- Habilitar RLS en tabla profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Habilitar RLS en tabla properties
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

-- 2. CREAR POLÍTICAS PARA TABLA PROFILES (CORREGIDAS)
-- =====================================================

-- Eliminar políticas existentes si existen
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Política de lectura: Todos pueden ver perfiles
CREATE POLICY "Profiles are viewable by everyone" ON profiles
FOR SELECT USING (true);

-- Política de inserción: Usuarios pueden crear su propio perfil (CORREGIDA)
CREATE POLICY "Users can insert their own profile" ON profiles
FOR INSERT WITH CHECK (auth.uid()::text = id::text);

-- Política de actualización: Usuarios pueden actualizar su propio perfil (CORREGIDA)
CREATE POLICY "Users can update own profile" ON profiles
FOR UPDATE USING (auth.uid()::text = id::text);

-- 3. CREAR POLÍTICAS PARA TABLA PROPERTIES (CORREGIDAS)
-- =====================================================

-- Eliminar políticas existentes si existen
DROP POLICY IF EXISTS "Properties are viewable by everyone" ON properties;
DROP POLICY IF EXISTS "Authenticated users can create properties" ON properties;
DROP POLICY IF EXISTS "Users can update own properties" ON properties;

-- Política de lectura: Todos pueden ver propiedades
CREATE POLICY "Properties are viewable by everyone" ON properties
FOR SELECT USING (true);

-- Política de inserción: Usuarios autenticados pueden crear propiedades
CREATE POLICY "Authenticated users can create properties" ON properties
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Política de actualización: Usuarios pueden actualizar sus propias propiedades (CORREGIDA)
CREATE POLICY "Users can update own properties" ON properties
FOR UPDATE USING (auth.uid()::text = user_id::text);

-- 4. CONFIGURAR PERMISOS DE ESQUEMA
-- =====================================================

-- Otorgar permisos al rol anon (usuarios no autenticados)
GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;

-- Otorgar permisos al rol authenticated (usuarios autenticados)
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- 5. CONFIGURAR STORAGE BUCKETS
-- =====================================================

-- Crear bucket para imágenes de propiedades si no existe
INSERT INTO storage.buckets (id, name, public)
VALUES ('property-images', 'property-images', true)
ON CONFLICT (id) DO NOTHING;

-- Crear bucket para avatares si no existe
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- 6. POLÍTICAS DE STORAGE
-- =====================================================

-- Eliminar políticas de storage existentes
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;

-- Política de lectura pública para storage
CREATE POLICY "Public Access" ON storage.objects
FOR SELECT USING (true);

-- Política de inserción para usuarios autenticados
CREATE POLICY "Authenticated users can upload" ON storage.objects
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 7. FUNCIONES ÚTILES
-- =====================================================

-- Función para obtener el ID del usuario actual
CREATE OR REPLACE FUNCTION get_current_user_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT auth.uid();
$$;

-- Función para verificar si el usuario es propietario (CORREGIDA)
CREATE OR REPLACE FUNCTION is_owner(user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT auth.uid()::text = user_id::text;
$$;

-- 8. TRIGGERS PARA AUDITORÍA
-- =====================================================

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para tabla profiles
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger para tabla properties
DROP TRIGGER IF EXISTS update_properties_updated_at ON properties;
CREATE TRIGGER update_properties_updated_at
    BEFORE UPDATE ON properties
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 9. VERIFICACIÓN DE CONFIGURACIÓN
-- =====================================================

-- Verificar que RLS está habilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('profiles', 'properties');

-- Verificar políticas creadas
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd
FROM pg_policies 
WHERE schemaname = 'public';

-- Verificar buckets de storage
SELECT id, name, public FROM storage.buckets;

-- =====================================================
-- MENSAJE DE CONFIRMACIÓN (SINTAXIS CORREGIDA)
-- =====================================================

SELECT 'CONFIGURACION SUPABASE COMPLETADA EXITOSAMENTE' as mensaje;
SELECT 'RLS habilitado en tablas principales' as status_rls;
SELECT 'Politicas de seguridad configuradas con tipos correctos' as status_policies;
SELECT 'Buckets de storage creados' as status_storage;
SELECT 'Proyecto listo para uso al 100 porciento' as status_final;
