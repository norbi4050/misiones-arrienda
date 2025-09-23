-- Migración para sincronizar avatares entre perfil principal y anuncios de comunidad
-- Fecha: 2025-01-23
-- Propósito: Asegurar que el avatar del anuncio coincida con el avatar del perfil principal

-- 1. Verificar estructura actual de la tabla users
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN ('id', 'avatar', 'name', 'email');

-- 2. Verificar si hay avatares en la tabla users
SELECT id, name, email, avatar, 
       CASE 
         WHEN avatar IS NOT NULL THEN 'Tiene avatar'
         ELSE 'Sin avatar'
       END as avatar_status
FROM users 
WHERE id = '6403f9d2-e846-4c70-87e0-e051127d9500';

-- 3. Verificar datos de autenticación en auth.users
SELECT id, email, 
       raw_user_meta_data->>'avatar_url' as auth_avatar,
       raw_user_meta_data->>'name' as auth_name,
       raw_user_meta_data as full_metadata
FROM auth.users 
WHERE id = '6403f9d2-e846-4c70-87e0-e051127d9500';

-- 4. Actualizar avatar en tabla users con el avatar de autenticación
UPDATE users 
SET avatar = (
  SELECT raw_user_meta_data->>'avatar_url'
  FROM auth.users 
  WHERE auth.users.id = users.id
)
WHERE id = '6403f9d2-e846-4c70-87e0-e051127d9500'
AND (avatar IS NULL OR avatar = '');

-- 5. Verificar la actualización
SELECT id, name, email, avatar,
       CASE 
         WHEN avatar IS NOT NULL AND avatar != '' THEN 'Avatar actualizado'
         ELSE 'Sin avatar'
       END as status
FROM users 
WHERE id = '6403f9d2-e846-4c70-87e0-e051127d9500';

-- 6. Crear función para mantener avatares sincronizados automáticamente
CREATE OR REPLACE FUNCTION sync_user_avatar()
RETURNS TRIGGER AS $$
BEGIN
  -- Si el avatar está vacío en users, usar el de auth
  IF NEW.avatar IS NULL OR NEW.avatar = '' THEN
    NEW.avatar := (
      SELECT raw_user_meta_data->>'avatar_url'
      FROM auth.users 
      WHERE id = NEW.id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Crear trigger para sincronización automática
DROP TRIGGER IF EXISTS trigger_sync_user_avatar ON users;
CREATE TRIGGER trigger_sync_user_avatar
  BEFORE INSERT OR UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION sync_user_avatar();

-- 8. Ejecutar sincronización masiva para todos los usuarios sin avatar
UPDATE users 
SET avatar = auth_users.avatar_url
FROM (
  SELECT id, raw_user_meta_data->>'avatar_url' as avatar_url
  FROM auth.users
  WHERE raw_user_meta_data->>'avatar_url' IS NOT NULL
) as auth_users
WHERE users.id = auth_users.id
AND (users.avatar IS NULL OR users.avatar = '')
AND auth_users.avatar_url IS NOT NULL;

-- 9. Verificar resultados finales
SELECT 
  u.id,
  u.name,
  u.email,
  u.avatar as db_avatar,
  au.raw_user_meta_data->>'avatar_url' as auth_avatar,
  CASE 
    WHEN u.avatar = au.raw_user_meta_data->>'avatar_url' THEN '✅ Sincronizado'
    WHEN u.avatar IS NOT NULL AND u.avatar != '' THEN '⚠️ Diferente'
    ELSE '❌ Sin avatar'
  END as sync_status
FROM users u
LEFT JOIN auth.users au ON u.id = au.id
WHERE u.id = '6403f9d2-e846-4c70-87e0-e051127d9500';
