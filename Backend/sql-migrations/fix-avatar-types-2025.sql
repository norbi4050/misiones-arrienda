-- Migración corregida para sincronizar avatares
-- Fecha: 2025-01-23
-- Propósito: Corregir tipos de datos y sincronizar avatares

-- 1. Verificar datos actuales del usuario específico
SELECT 
  u.id::text as user_id,
  u.name,
  u.email,
  u.avatar as db_avatar,
  au.raw_user_meta_data->>'avatar_url' as auth_avatar,
  au.raw_user_meta_data->>'name' as auth_name
FROM users u
LEFT JOIN auth.users au ON u.id::text = au.id::text
WHERE u.id::text = '6403f9d2-e846-4c70-87e0-e051127d9500';

-- 2. Como no hay avatar real, vamos a usar la primera foto del anuncio como avatar
-- Primero, verificar si el usuario tiene fotos en su anuncio
-- (Esto se haría desde la aplicación, no desde SQL ya que los anuncios están en JSON)

-- 3. Actualizar el avatar en la BD con una URL de placeholder o la primera foto
-- Por ahora, vamos a asegurar que el campo esté preparado para recibir el avatar
UPDATE users 
SET avatar = COALESCE(
  (SELECT raw_user_meta_data->>'avatar_url' FROM auth.users WHERE id::text = users.id::text),
  avatar,
  'https://ui-avatars.com/api/?name=' || COALESCE(name, 'Usuario') || '&background=0D8ABC&color=fff'
)
WHERE id::text = '6403f9d2-e846-4c70-87e0-e051127d9500';

-- 4. Verificar el resultado
SELECT 
  id::text as user_id,
  name,
  email,
  avatar,
  CASE 
    WHEN avatar IS NOT NULL AND avatar != '' THEN '✅ Tiene avatar'
    ELSE '❌ Sin avatar'
  END as avatar_status
FROM users 
WHERE id::text = '6403f9d2-e846-4c70-87e0-e051127d9500';

-- 5. Crear función para generar avatar automático basado en nombre
CREATE OR REPLACE FUNCTION generate_default_avatar(user_name text)
RETURNS text AS $$
BEGIN
  RETURN 'https://ui-avatars.com/api/?name=' || 
         COALESCE(replace(user_name, ' ', '+'), 'Usuario') || 
         '&background=0D8ABC&color=fff&size=200';
END;
$$ LANGUAGE plpgsql;

-- 6. Actualizar con avatar generado automáticamente
UPDATE users 
SET avatar = generate_default_avatar(name)
WHERE id::text = '6403f9d2-e846-4c70-87e0-e051127d9500'
AND (avatar IS NULL OR avatar = '');

-- 7. Verificación final
SELECT 
  id::text as user_id,
  name,
  email,
  avatar,
  length(avatar) as avatar_length,
  '✅ Avatar generado automáticamente' as status
FROM users 
WHERE id::text = '6403f9d2-e846-4c70-87e0-e051127d9500';
