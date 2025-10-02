-- =============================================
-- MIGRACIÓN COMPLETA PARA INMOBILIARIAS
-- Fecha: 2025-01-XX
-- Propósito: Preparar sistema para logo upload y verificación CUIT
-- =============================================

-- =============================================
-- PARTE 1: CREAR BUCKET PARA LOGOS
-- =============================================

-- 1.1 Crear bucket público para logos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'company-logos',
  'company-logos',
  true,  -- Público para lectura
  2097152,  -- 2MB en bytes
  ARRAY['image/png', 'image/jpeg', 'image/jpg']
)
ON CONFLICT (id) DO NOTHING;

-- 1.2 Política: Lectura pública
DROP POLICY IF EXISTS "Public read access for company logos" ON storage.objects;
CREATE POLICY "Public read access for company logos"
ON storage.objects FOR SELECT
USING (bucket_id = 'company-logos');

-- 1.3 Política: Solo el dueño puede subir su logo
DROP POLICY IF EXISTS "Authenticated users can upload their own company logo" ON storage.objects;
CREATE POLICY "Authenticated users can upload their own company logo"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'company-logos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
  AND (storage.extension(name) = 'png' OR storage.extension(name) = 'jpg' OR storage.extension(name) = 'jpeg')
);

-- 1.4 Política: Solo el dueño puede actualizar su logo
DROP POLICY IF EXISTS "Users can update their own company logo" ON storage.objects;
CREATE POLICY "Users can update their own company logo"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'company-logos'
  AND auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'company-logos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 1.5 Política: Solo el dueño puede eliminar su logo
DROP POLICY IF EXISTS "Users can delete their own company logo" ON storage.objects;
CREATE POLICY "Users can delete their own company logo"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'company-logos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- =============================================
-- PARTE 2: AGREGAR CAMPOS A TABLA USERS
-- =============================================

-- 2.1 Campo para URL del logo
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'logo_url'
  ) THEN
    ALTER TABLE users ADD COLUMN logo_url TEXT;
    COMMENT ON COLUMN users.logo_url IS 'URL pública del logo de la empresa';
  END IF;
END $$;

-- 2.2 Campo para CUIT
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'cuit'
  ) THEN
    ALTER TABLE users ADD COLUMN cuit VARCHAR(13);
    COMMENT ON COLUMN users.cuit IS 'CUIT de la empresa (formato: XX-XXXXXXXX-X)';
  END IF;
END $$;

-- 2.3 Campo para timestamp de verificación
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'verified_at'
  ) THEN
    ALTER TABLE users ADD COLUMN verified_at TIMESTAMP WITH TIME ZONE;
    COMMENT ON COLUMN users.verified_at IS 'Fecha y hora de verificación del CUIT';
  END IF;
END $$;

-- 2.4 Campo para dirección (si no existe)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'address'
  ) THEN
    ALTER TABLE users ADD COLUMN address TEXT;
    COMMENT ON COLUMN users.address IS 'Dirección física de la empresa';
  END IF;
END $$;

-- 2.5 Campo para sitio web
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'website'
  ) THEN
    ALTER TABLE users ADD COLUMN website TEXT;
    COMMENT ON COLUMN users.website IS 'Sitio web de la empresa';
  END IF;
END $$;

-- 2.6 Campo para Facebook
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'facebook'
  ) THEN
    ALTER TABLE users ADD COLUMN facebook TEXT;
    COMMENT ON COLUMN users.facebook IS 'Usuario de Facebook';
  END IF;
END $$;

-- 2.7 Campo para Instagram
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'instagram'
  ) THEN
    ALTER TABLE users ADD COLUMN instagram TEXT;
    COMMENT ON COLUMN users.instagram IS 'Usuario de Instagram';
  END IF;
END $$;

-- 2.8 Campo para TikTok
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'tiktok'
  ) THEN
    ALTER TABLE users ADD COLUMN tiktok TEXT;
    COMMENT ON COLUMN users.tiktok IS 'Usuario de TikTok';
  END IF;
END $$;

-- 2.9 Campo para descripción de la empresa
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'description'
  ) THEN
    ALTER TABLE users ADD COLUMN description TEXT;
    COMMENT ON COLUMN users.description IS 'Descripción de la empresa para perfil público';
  END IF;
END $$;

-- =============================================
-- PARTE 3: ÍNDICES PARA OPTIMIZACIÓN
-- =============================================

-- 3.1 Índice para búsqueda por CUIT
CREATE INDEX IF NOT EXISTS idx_users_cuit ON users(cuit) WHERE cuit IS NOT NULL;

-- 3.2 Índice para inmobiliarias verificadas
CREATE INDEX IF NOT EXISTS idx_users_verified_inmobiliarias 
ON users(user_type, is_verified) 
WHERE user_type = 'inmobiliaria' AND is_verified = true;

-- =============================================
-- PARTE 4: VERIFICACIÓN
-- =============================================

-- 4.1 Verificar bucket creado
SELECT 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets
WHERE id = 'company-logos';

-- 4.2 Verificar políticas del bucket
SELECT 
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'objects'
AND policyname LIKE '%company logo%';

-- 4.3 Verificar campos agregados a users
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'users' 
AND column_name IN (
  'logo_url', 'cuit', 'verified_at', 'address', 
  'website', 'facebook', 'instagram', 'tiktok', 'description'
)
ORDER BY column_name;

-- 4.4 Verificar índices creados
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'users'
AND indexname IN ('idx_users_cuit', 'idx_users_verified_inmobiliarias');

-- 4.5 Contar inmobiliarias existentes
SELECT 
  COUNT(*) as total_inmobiliarias,
  COUNT(logo_url) as con_logo,
  COUNT(cuit) as con_cuit,
  COUNT(CASE WHEN is_verified = true THEN 1 END) as verificadas
FROM users
WHERE user_type = 'inmobiliaria';

-- =============================================
-- PARTE 5: DATOS DE PRUEBA (OPCIONAL)
-- =============================================

-- Solo para desarrollo/testing
-- Descomentar si necesitas datos de prueba

/*
-- Actualizar una inmobiliaria de prueba
UPDATE users
SET 
  company_name = 'Inmobiliaria Test Premium',
  address = 'Av. Corrientes 1234, Posadas, Misiones',
  website = 'https://www.inmobiliariatest.com',
  facebook = '@inmobiliariatest',
  instagram = '@inmobiliariatest',
  description = 'Inmobiliaria líder en Misiones con más de 20 años de experiencia en el mercado inmobiliario.'
WHERE user_type = 'inmobiliaria'
AND email = 'test@inmobiliaria.com';
*/

-- =============================================
-- NOTAS DE IMPLEMENTACIÓN
-- =============================================
-- 
-- Estructura de archivos en storage:
-- company-logos/
--   {userId}/
--     logo.png (o logo.jpg)
--
-- URL pública resultante:
-- https://{project}.supabase.co/storage/v1/object/public/company-logos/{userId}/logo.png
--
-- Límites:
-- - Tamaño máximo: 2MB
-- - Formatos: PNG, JPG, JPEG
-- - Un logo por empresa
--
-- Seguridad:
-- - Solo el dueño puede subir/modificar/eliminar
-- - Lectura pública para mostrar en perfil
-- - Validación de tipo MIME en políticas
--
-- Verificación CUIT:
-- - Campo cuit almacena formato: XX-XXXXXXXX-X
-- - is_verified se setea a true si CUIT es válido
-- - verified_at guarda timestamp de verificación
-- - Si CUIT se borra o es inválido, is_verified = false
--
-- =============================================

-- =============================================
-- ROLLBACK (Si es necesario deshacer cambios)
-- =============================================

/*
-- Eliminar bucket
DELETE FROM storage.buckets WHERE id = 'company-logos';

-- Eliminar campos
ALTER TABLE users DROP COLUMN IF EXISTS logo_url;
ALTER TABLE users DROP COLUMN IF EXISTS cuit;
ALTER TABLE users DROP COLUMN IF EXISTS verified_at;
ALTER TABLE users DROP COLUMN IF EXISTS address;
ALTER TABLE users DROP COLUMN IF EXISTS website;
ALTER TABLE users DROP COLUMN IF EXISTS facebook;
ALTER TABLE users DROP COLUMN IF EXISTS instagram;
ALTER TABLE users DROP COLUMN IF EXISTS tiktok;
ALTER TABLE users DROP COLUMN IF EXISTS description;

-- Eliminar índices
DROP INDEX IF EXISTS idx_users_cuit;
DROP INDEX IF EXISTS idx_users_verified_inmobiliarias;
*/
