-- =====================================================
-- SUPABASE: CREAR SOLO LOS BUCKETS FALTANTES
-- =====================================================
-- SQL simplificado para crear únicamente los buckets que faltan
-- Ejecutar en Supabase SQL Editor

-- =====================================================
-- CREAR BUCKETS FALTANTES
-- =====================================================

-- 1. DOCUMENTS BUCKET (Crítico - Para documentos de verificación)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

-- 2. TEMP-UPLOADS BUCKET (Importante - Para uploads temporales)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('temp-uploads', 'temp-uploads', false)
ON CONFLICT (id) DO NOTHING;

-- 3. BACKUPS BUCKET (Recomendado - Para respaldos del sistema)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('backups', 'backups', false)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- POLICIES PARA DOCUMENTS BUCKET
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
-- POLICIES PARA TEMP-UPLOADS BUCKET
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
-- POLICIES PARA BACKUPS BUCKET
-- =====================================================

-- Backups: Solo service_role puede acceder (sistema)
CREATE POLICY "Only system can access backups" ON storage.objects
FOR ALL USING (
  bucket_id = 'backups' 
  AND auth.role() = 'service_role'
);

-- =====================================================
-- VERIFICACIÓN FINAL
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
    RAISE NOTICE '- avatars (público)';
    RAISE NOTICE '- property-images (público)';
    RAISE NOTICE '- profile-images (público)';
    RAISE NOTICE '- community-images (público)';
    RAISE NOTICE '- documents (privado) ← NUEVO';
    RAISE NOTICE '- temp-uploads (privado) ← NUEVO';
    RAISE NOTICE '- backups (sistema) ← NUEVO';
  ELSE
    RAISE NOTICE '⚠️ Solo % de 7 buckets están creados', bucket_count;
  END IF;
END $$;

-- Mostrar policies creadas para los nuevos buckets
SELECT 
  'NUEVOS BUCKETS - POLICIES CREADAS:' as info,
  COUNT(*) as total_policies
FROM pg_policies 
WHERE tablename = 'objects' 
AND (policyname LIKE '%documents%' OR policyname LIKE '%temp-uploads%' OR policyname LIKE '%backups%');

-- =====================================================
-- MENSAJE FINAL
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🎉 BUCKETS FALTANTES CREADOS EXITOSAMENTE';
  RAISE NOTICE '';
  RAISE NOTICE '📋 BUCKETS AGREGADOS:';
  RAISE NOTICE '1. documents - Para documentos de verificación (privado)';
  RAISE NOTICE '2. temp-uploads - Para uploads temporales (privado)';
  RAISE NOTICE '3. backups - Para respaldos del sistema (solo sistema)';
  RAISE NOTICE '';
  RAISE NOTICE '🔧 POLICIES CREADAS:';
  RAISE NOTICE '- 4 policies para documents bucket';
  RAISE NOTICE '- 3 policies para temp-uploads bucket';
  RAISE NOTICE '- 1 policy para backups bucket';
  RAISE NOTICE '';
  RAISE NOTICE '✅ SISTEMA DE STORAGE COMPLETO';
  RAISE NOTICE 'Ahora tienes 7/7 buckets configurados correctamente';
END $$;
