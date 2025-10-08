-- Agregar campo expires_at a community_posts para sistema de expiración
-- Fecha: Enero 2025

-- 1. Agregar columna expires_at (nullable por compatibilidad con posts existentes)
ALTER TABLE community_posts 
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

-- 2. Crear índice para mejorar performance de queries de expiración
CREATE INDEX IF NOT EXISTS idx_community_posts_expires_at 
ON community_posts(expires_at) 
WHERE status = 'active';

-- 3. Comentario para documentación
COMMENT ON COLUMN community_posts.expires_at IS 'Fecha de expiración del post. Después de esta fecha, el post debe ser archivado automáticamente.';

-- Verificación
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'community_posts' 
  AND column_name = 'expires_at';
