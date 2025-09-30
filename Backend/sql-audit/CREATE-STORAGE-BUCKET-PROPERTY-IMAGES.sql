-- =====================================================
-- CONFIGURACIÓN STORAGE BUCKET PROPERTY-IMAGES
-- Fecha: 3 de Enero 2025
-- Propósito: Crear bucket y configurar permisos para upload de imágenes
-- =====================================================

-- 1. CREAR BUCKET (si no existe)
-- Ejecutar en Supabase Dashboard > Storage
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'property-images',
  'property-images', 
  true,  -- bucket público para URLs directas
  2097152,  -- 2MB límite
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
ON CONFLICT (id) DO NOTHING;

-- 2. POLÍTICAS RLS PARA STORAGE
-- Permitir lectura pública de imágenes
CREATE POLICY "Public read access for property images" ON storage.objects
FOR SELECT USING (bucket_id = 'property-images');

-- Permitir upload solo a usuarios autenticados (para sus propias propiedades)
CREATE POLICY "Authenticated users can upload property images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'property-images' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Permitir actualización solo al propietario
CREATE POLICY "Users can update their own property images" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'property-images' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Permitir eliminación solo al propietario
CREATE POLICY "Users can delete their own property images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'property-images' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 3. PERMISOS PARA SERVICE ROLE
-- El Service Role bypasea RLS automáticamente, pero verificamos que tenga acceso
-- Esto se configura en Supabase Dashboard > Settings > API

-- 4. VERIFICACIÓN DE CONFIGURACIÓN
-- Verificar que el bucket existe
SELECT 
  id, 
  name, 
  public, 
  file_size_limit,
  allowed_mime_types
FROM storage.buckets 
WHERE id = 'property-images';

-- Verificar políticas
SELECT 
  schemaname,
  tablename, 
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'objects' 
AND policyname LIKE '%property%';

-- 5. TEST DE FUNCIONALIDAD
-- Verificar que Service Role puede listar buckets
-- (Ejecutar desde aplicación con Service Role)
-- SELECT * FROM storage.buckets;

-- =====================================================
-- NOTAS IMPORTANTES:
-- =====================================================

/*
ESTRUCTURA DE PATHS:
- Formato: {ownerId}/{propertyId}/{filename}
- Ejemplo: 6403f9d2-e846-4c70-87e0-e051127d9500/b38590eb-12a7-45e2-a9d7-236b2abbb747/1704312345678-casa.jpg

PERMISOS:
- Lectura: Pública (cualquiera puede ver imágenes)
- Escritura: Solo propietario autenticado
- Service Role: Bypasea todas las políticas (para endpoints server-side)

VARIABLES DE ENTORNO REQUERIDAS:
- NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
- SUPABASE_SERVICE_ROLE=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
- NEXT_PUBLIC_PROPERTY_IMAGES_BUCKET=property-images

ENDPOINTS QUE USAN ESTE BUCKET:
- POST /api/properties/[id]/images/upload (Service Role)
- GET /api/properties/[id]/images/list (Service Role)
*/

-- =====================================================
-- COMANDOS DE VERIFICACIÓN POST-SETUP:
-- =====================================================

-- Verificar bucket creado:
-- curl http://localhost:3000/api/debug-upload-config

-- Test upload (requiere auth):
-- curl -X POST -F "file=@test.jpg" -F "ownerId=USER_ID" \
--   http://localhost:3000/api/properties/PROPERTY_ID/images/upload

-- Test list:
-- curl "http://localhost:3000/api/properties/PROPERTY_ID/images/list?ownerId=USER_ID"
