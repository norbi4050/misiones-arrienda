-- Verificar que el trigger updated_at funciona en user_profiles
-- Este script debe ejecutarse en Supabase Dashboard

-- 1. Verificar estructura de user_profiles
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Verificar si existe trigger para updated_at
SELECT 
    trigger_name,
    event_manipulation,
    action_statement,
    action_timing
FROM information_schema.triggers 
WHERE event_object_table = 'user_profiles'
AND event_object_schema = 'public';

-- 3. Crear trigger si no existe
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar trigger a user_profiles
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 4. Test del trigger (usar un user_id real existente)
-- NOTA: Reemplazar 'USER_ID_REAL' con un ID real de la tabla User
/*
UPDATE user_profiles 
SET photos = ARRAY['https://example.com/test-avatar.jpg']
WHERE user_id = 'USER_ID_REAL';

-- Verificar que updated_at cambió
SELECT user_id, photos, updated_at 
FROM user_profiles 
WHERE user_id = 'USER_ID_REAL';
*/

-- 5. Verificar políticas RLS en user_profiles
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
WHERE tablename = 'user_profiles';

-- 6. Crear política de lectura si no existe (para cross-user avatar viewing)
-- Permitir lectura de avatares de otros usuarios para mensajes/comunidad
CREATE POLICY IF NOT EXISTS "Users can view other user profiles for avatars" 
ON user_profiles FOR SELECT 
USING (true);

-- 7. Crear política de escritura (solo propio perfil)
CREATE POLICY IF NOT EXISTS "Users can update own profile" 
ON user_profiles FOR ALL 
USING (auth.uid() = user_id);

-- 8. Habilitar RLS si no está habilitado
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- 9. Verificar que las políticas se aplicaron
SELECT 
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'user_profiles'
ORDER BY policyname;
