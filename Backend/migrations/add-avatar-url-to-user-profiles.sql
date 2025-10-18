-- Agregar columna avatar_url a la tabla user_profiles
-- Esta columna almacena el avatar configurado desde el perfil del usuario

ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Agregar comentario a la columna
COMMENT ON COLUMN public.user_profiles.avatar_url IS 'Avatar URL configurado desde el perfil del usuario (/perfil)';

-- Verificar que la columna se agregó correctamente
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'user_profiles'
  AND column_name = 'avatar_url';
