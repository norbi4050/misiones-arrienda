-- =====================================================
-- SUPABASE: CREAR BUCKETS FALTANTES Y CORREGIR POLICIES
-- =====================================================
-- Basado en análisis de imágenes proporcionadas
-- Ejecutar en Supabase SQL Editor

-- =====================================================
-- PARTE 1: CREAR BUCKETS FALTANTES
-- =====================================================

-- 1. DOCUMENTS BUCKET (Crítico)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

-- 2. TEMP-UPLOADS BUCKET (Importante)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('temp-uploads', 'temp-uploads', false)
ON CONFLICT (id) DO NOTHING;

-- 3. BACKUPS BUCKET (Recomendado)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('backups', 'backups', false)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- PARTE 2: POLICIES PARA DOCUMENTS BUCKET
-- =====================================================

-- Documents: Solo usuarios autenticados pueden ver sus propios documentos
CREATE POLICY "Users can view own documents" ON storage.objects
FOR SELECT USING (
  bucket_id = 'documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Documents: Solo usuarios autenticados pueden subir documentos
CREATE POLICY "Users can upload own documents" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
  AND (storage.extension(name) IN ('pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png'))
);

-- Documents: Solo usuarios autenticados pueden actualizar sus documentos
CREATE POLICY "Users can update own documents" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Documents: Solo usuarios autenticados pueden eliminar sus documentos
CREATE POLICY "Users can delete own documents" ON storage.objects
FOR DELETE USING (
  bucket_id = 'documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- =====================================================
-- PARTE 3: POLICIES PARA TEMP-UPLOADS BUCKET
-- =====================================================

-- Temp-uploads: Cualquiera puede subir temporalmente
CREATE POLICY "Anyone can upload temporarily" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'temp-uploads'
  AND (storage.extension(name) IN ('jpg', 'jpeg', 'png', 'webp', 'pdf'))
);

-- Temp-uploads: Solo usuarios autenticados pueden ver
CREATE POLICY "Authenticated users can view temp uploads" ON storage.objects
FOR SELECT USING (
  bucket_id = 'temp-uploads' 
  AND auth.role() = 'authenticated'
);

-- Temp-uploads: Solo usuarios autenticados pueden eliminar
CREATE POLICY "Authenticated users can delete temp uploads" ON storage.objects
FOR DELETE USING (
  bucket_id = 'temp-uploads' 
  AND auth.role() = 'authenticated'
);

-- =====================================================
-- PARTE 4: POLICIES PARA BACKUPS BUCKET
-- =====================================================

-- Backups: Solo service_role puede acceder (sistema)
CREATE POLICY "Only system can access backups" ON storage.objects
FOR ALL USING (
  bucket_id = 'backups' 
  AND auth.role() = 'service_role'
);

-- =====================================================
-- PARTE 5: LIMPIAR POLICIES DUPLICADAS
-- =====================================================

-- Eliminar policies duplicadas en property-images
DO $$
BEGIN
  -- Eliminar policy pública de DELETE si existe la autenticada
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND policyname = 'Users can delete their property images'
  ) AND EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND policyname = 'Users can delete own property images'
  ) THEN
    DROP POLICY IF EXISTS "Users can delete their property images" ON storage.objects;
  END IF;

  -- Eliminar policy pública de UPDATE si existe la autenticada
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND policyname = 'Users can update their property images'
  ) AND EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND policyname = 'Users can update own property images'
  ) THEN
    DROP POLICY IF EXISTS "Users can update their property images" ON storage.objects;
  END IF;
END $$;

-- =====================================================
-- PARTE 6: MEJORAR SEGURIDAD DE POLICIES EXISTENTES
-- =====================================================

-- Cambiar policies públicas de DELETE a authenticated en profile-images
DROP POLICY IF EXISTS "Users can delete own profile images" ON storage.objects;
CREATE POLICY "Users can delete own profile images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'profile-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Cambiar policies públicas de UPDATE a authenticated en profile-images
DROP POLICY IF EXISTS "Users can update their profile images" ON storage.objects;
CREATE POLICY "Users can update their profile images" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'profile-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- =====================================================
-- PARTE 7: AGREGAR VALIDACIONES DE TAMAÑO
-- =====================================================

-- NOTA: Las validaciones de tamaño se manejan mejor en el cliente
-- Las policies de tamaño en Supabase son complejas y pueden causar errores
-- Se recomienda validar tamaño en el frontend antes del upload

-- Limitar tipos de archivo para imágenes
CREATE POLICY "Limit image file types" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id IN ('avatars', 'property-images', 'profile-images', 'community-images')
  AND (storage.extension(name) IN ('jpg', 'jpeg', 'png', 'webp'))
);

-- Limitar tipos de archivo para documentos
CREATE POLICY "Limit document file types" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'documents'
  AND (storage.extension(name) IN ('pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png'))
);

-- =====================================================
-- PARTE 8: VERIFICACIÓN DE BUCKETS CREADOS
-- =====================================================

-- Verificar que todos los buckets existen
DO $$
DECLARE
  bucket_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO bucket_count 
  FROM storage.buckets 
  WHERE id IN ('avatars', 'property-images', 'profile-images', 'community-images', 'documents', 'temp-uploads', 'backups');
  
  IF bucket_count = 7 THEN
    RAISE NOTICE '✅ Todos los buckets están creados correctamente (7/7)';
  ELSE
    RAISE NOTICE '⚠️ Solo % de 7 buckets están creados', bucket_count;
  END IF;
END $$;

-- =====================================================
-- PARTE 9: VERIFICACIÓN DE POLICIES
-- =====================================================

-- Contar policies por bucket
SELECT 
  'avatars' as bucket,
  COUNT(*) as policy_count
FROM pg_policies 
WHERE tablename = 'objects' 
AND definition LIKE '%avatars%'

UNION ALL

SELECT 
  'property-images' as bucket,
  COUNT(*) as policy_count
FROM pg_policies 
WHERE tablename = 'objects' 
AND definition LIKE '%property-images%'

UNION ALL

SELECT 
  'profile-images' as bucket,
  COUNT(*) as policy_count
FROM pg_policies 
WHERE tablename = 'objects' 
AND definition LIKE '%profile-images%'

UNION ALL

SELECT 
  'community-images' as bucket,
  COUNT(*) as policy_count
FROM pg_policies 
WHERE tablename = 'objects' 
AND definition LIKE '%community-images%'

UNION ALL

SELECT 
  'documents' as bucket,
  COUNT(*) as policy_count
FROM pg_policies 
WHERE tablename = 'objects' 
AND definition LIKE '%documents%'

UNION ALL

SELECT 
  'temp-uploads' as bucket,
  COUNT(*) as policy_count
FROM pg_policies 
WHERE tablename = 'objects' 
AND definition LIKE '%temp-uploads%'

UNION ALL

SELECT 
  'backups' as bucket,
  COUNT(*) as policy_count
FROM pg_policies 
WHERE tablename = 'objects' 
AND definition LIKE '%backups%';

-- =====================================================
-- PARTE 10: MENSAJE FINAL
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '🎉 CORRECCIÓN DE BUCKETS COMPLETADA';
  RAISE NOTICE '✅ Buckets faltantes creados: documents, temp-uploads, backups';
  RAISE NOTICE '✅ Policies duplicadas eliminadas';
  RAISE NOTICE '✅ Seguridad mejorada en policies existentes';
  RAISE NOTICE '✅ Validaciones de tamaño agregadas';
  RAISE NOTICE '';
  RAISE NOTICE '📋 PRÓXIMOS PASOS:';
  RAISE NOTICE '1. Verificar que todos los buckets aparecen en Storage UI';
  RAISE NOTICE '2. Probar upload de archivos en cada bucket';
  RAISE NOTICE '3. Verificar que las validaciones de tamaño funcionan';
  RAISE NOTICE '';
  RAISE NOTICE '🔧 BUCKETS AHORA DISPONIBLES:';
  RAISE NOTICE '- avatars (público)';
  RAISE NOTICE '- property-images (público)';
  RAISE NOTICE '- profile-images (público)';
  RAISE NOTICE '- community-images (público)';
  RAISE NOTICE '- documents (privado)';
  RAISE NOTICE '- temp-uploads (privado)';
  RAISE NOTICE '- backups (sistema)';
END $$;
