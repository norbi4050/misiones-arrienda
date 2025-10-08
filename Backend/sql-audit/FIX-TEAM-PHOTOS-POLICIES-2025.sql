-- ============================================
-- FIX: Políticas Team Photos (Corrección de tipos)
-- ============================================
-- Fecha: 2025-01-XX
-- Problema: Error "operator does not exist: text = uuid"
-- Solución: Convertir auth.uid() a text explícitamente
-- ============================================

-- PASO 1: Eliminar políticas con error (si existen)
-- ============================================
DROP POLICY IF EXISTS "Inmobiliarias pueden subir fotos de equipo" ON storage.objects;
DROP POLICY IF EXISTS "Inmobiliarias pueden actualizar sus fotos de equipo" ON storage.objects;
DROP POLICY IF EXISTS "Inmobiliarias pueden eliminar sus fotos de equipo" ON storage.objects;

-- PASO 2: Crear política INSERT (corregida)
-- ============================================
CREATE POLICY "Inmobiliarias pueden subir fotos de equipo"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'team-photos' AND
  -- FIX: Convertir auth.uid() a text
  (storage.foldername(name))[1] = auth.uid()::text AND
  -- Solo usuarios tipo inmobiliaria
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id::text = auth.uid()::text
    AND user_type = 'inmobiliaria'
  )
);

-- PASO 3: Crear política UPDATE (corregida)
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

-- PASO 4: Crear política DELETE (corregida)
-- ============================================
CREATE POLICY "Inmobiliarias pueden eliminar sus fotos de equipo"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'team-photos' AND
  (storage.foldername(name))[1] = auth.uid()::text AND
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id::text = auth.uid()::text
    AND user_type = 'inmobiliaria'
  )
);

-- ============================================
-- VERIFICACIÓN
-- ============================================

-- Verificar políticas creadas
SELECT 
  policyname,
  cmd as operacion,
  CASE 
    WHEN cmd = 'INSERT' THEN 'Subir'
    WHEN cmd = 'SELECT' THEN 'Ver'
    WHEN cmd = 'UPDATE' THEN 'Actualizar'
    WHEN cmd = 'DELETE' THEN 'Eliminar'
  END as accion
FROM pg_policies
WHERE schemaname = 'storage'
AND tablename = 'objects'
AND policyname LIKE '%team%'
ORDER BY cmd;

-- Debería mostrar 4 políticas:
-- 1. INSERT - Inmobiliarias pueden subir fotos de equipo
-- 2. SELECT - Fotos de equipo son públicas
-- 3. UPDATE - Inmobiliarias pueden actualizar sus fotos de equipo
-- 4. DELETE - Inmobiliarias pueden eliminar sus fotos de equipo

-- ============================================
-- TESTING MANUAL
-- ============================================

/*
Para probar que funciona:

1. Loguéate como inmobiliaria
2. Ve a /mi-empresa
3. En la sección "Equipo", haz clic en "Subir foto"
4. Selecciona una imagen (máx 2MB, formato JPG/PNG/WEBP)
5. Verifica que se suba correctamente
6. Verifica que aparezca en el perfil público

Si hay errores, revisa:
- Que el usuario sea tipo 'inmobiliaria'
- Que el archivo sea menor a 2MB
- Que el formato sea válido
- Los logs del servidor
*/
