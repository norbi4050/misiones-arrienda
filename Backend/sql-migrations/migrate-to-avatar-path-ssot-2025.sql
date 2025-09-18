-- Migración a avatar_path como Single Source of Truth
-- Agregar columna avatar_path a user_profiles si no existe

-- 1. Agregar columna avatar_path a user_profiles
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS avatar_path TEXT;

-- 2. Migrar datos existentes de profile_image a avatar_path
-- Extraer solo el path del storage de las URLs existentes
UPDATE user_profiles 
SET avatar_path = CASE 
  WHEN profile_image IS NOT NULL AND profile_image LIKE '%/avatars/%' THEN
    SUBSTRING(profile_image FROM '/avatars/(.+)$')
  ELSE NULL
END
WHERE profile_image IS NOT NULL;

-- 3. Crear índice para avatar_path
CREATE INDEX IF NOT EXISTS idx_user_profiles_avatar_path 
ON user_profiles(avatar_path) 
WHERE avatar_path IS NOT NULL;

-- 4. Agregar comentario para documentación
COMMENT ON COLUMN user_profiles.avatar_path IS 'Path del archivo de avatar en bucket avatars (ej: userId/avatar-timestamp.jpg)';

-- 5. Verificar migración
SELECT 
  id,
  profile_image,
  avatar_path,
  updated_at
FROM user_profiles 
WHERE profile_image IS NOT NULL OR avatar_path IS NOT NULL
LIMIT 5;
