-- ============================================
-- CREAR BUCKET Y POLÍTICAS: Fotos del Equipo
-- ============================================
-- Fecha: 2025-01-XX
-- Propósito: Permitir a inmobiliarias subir fotos de sus miembros del equipo
-- Relacionado: Problema 2 - Upload fotos del personal
-- ============================================

-- PASO 1: Crear bucket público para fotos del equipo
-- ============================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'team-photos',
  'team-photos',
  true,  -- Público para que se puedan ver en perfiles
  2097152,  -- 2MB máximo
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- PASO 2: Política - Inmobiliarias pueden subir fotos de su equipo
-- ============================================
CREATE POLICY "Inmobiliarias pueden subir fotos de equipo"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'team-photos' AND
  -- Solo pueden subir en su propia carpeta (user_id)
  (storage.foldername(name))[1] = auth.uid()::text AND
  -- Solo usuarios tipo inmobiliaria
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND user_type = 'inmobiliaria'
  )
);

-- PASO 3: Política - Fotos de equipo son públicas (lectura)
-- ============================================
CREATE POLICY "Fotos de equipo son públicas"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'team-photos');

-- PASO 4: Política - Inmobiliarias pueden actualizar sus fotos
-- ============================================
CREATE POLICY "Inmobiliarias pueden actualizar sus fotos de equipo"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'team-photos' AND
  (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'team-photos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- PASO 5: Política - Inmobiliarias pueden eliminar sus fotos
-- ============================================
CREATE POLICY "Inmobiliarias pueden eliminar sus fotos de equipo"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'team-photos' AND
  (storage.foldername(name))[1] = auth.uid()::text AND
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND user_type = 'inmobiliaria'
  )
);

-- ============================================
-- VERIFICACIÓN
-- ============================================

-- Verificar que el bucket se creó correctamente
SELECT 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types,
  created_at
FROM storage.buckets
WHERE id = 'team-photos';

-- Verificar políticas creadas
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'storage'
AND tablename = 'objects'
AND policyname LIKE '%team%';

-- ============================================
-- NOTAS DE IMPLEMENTACIÓN
-- ============================================

/*
ESTRUCTURA DE ARCHIVOS:
- Ruta: team-photos/{user_id}/{timestamp}.{ext}
- Ejemplo: team-photos/abc-123-def/1704067200000.jpg

LÍMITES:
- Tamaño máximo: 2MB por archivo
- Formatos permitidos: JPEG, JPG, PNG, WEBP
- Solo inmobiliarias pueden subir
- Cada inmobiliaria solo puede acceder a su carpeta

SEGURIDAD:
- ✅ RLS habilitado
- ✅ Validación de user_type
- ✅ Aislamiento por user_id
- ✅ Límite de tamaño
- ✅ Validación de MIME types

USO:
1. Inmobiliaria sube foto desde /mi-empresa
2. Archivo se guarda en team-photos/{user_id}/
3. URL pública se guarda en agency_team_members.photo_url
4. Foto se muestra en perfil público si show_team_public = true
*/
