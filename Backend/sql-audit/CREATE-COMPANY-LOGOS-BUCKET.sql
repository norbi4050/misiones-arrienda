-- =============================================
-- CREAR BUCKET PARA LOGOS DE EMPRESAS
-- Fecha: 2025-01-XX
-- Propósito: Almacenar logos de inmobiliarias
-- =============================================

-- 1. Crear bucket público para logos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'company-logos',
  'company-logos',
  true,  -- Público para lectura
  2097152,  -- 2MB en bytes
  ARRAY['image/png', 'image/jpeg', 'image/jpg']
)
ON CONFLICT (id) DO NOTHING;

-- 2. Política: Lectura pública
CREATE POLICY "Public read access for company logos"
ON storage.objects FOR SELECT
USING (bucket_id = 'company-logos');

-- 3. Política: Solo el dueño puede subir su logo
CREATE POLICY "Authenticated users can upload their own company logo"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'company-logos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
  AND (storage.extension(name) = 'png' OR storage.extension(name) = 'jpg' OR storage.extension(name) = 'jpeg')
);

-- 4. Política: Solo el dueño puede actualizar su logo
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

-- 5. Política: Solo el dueño puede eliminar su logo
CREATE POLICY "Users can delete their own company logo"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'company-logos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 6. Agregar campo logo_url a la tabla users (si no existe)
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

-- 7. Verificación
SELECT 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets
WHERE id = 'company-logos';

-- Verificar políticas
SELECT 
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'objects'
AND policyname LIKE '%company logo%';

-- Verificar campo logo_url
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'users' AND column_name = 'logo_url';

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
-- =============================================
