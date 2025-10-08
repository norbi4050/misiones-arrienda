-- =====================================================
-- HOTFIX: B6 - CORREGIR NOMBRES DE COLUMNAS EN POLICIES
-- Fecha: Enero 2025
-- Problema: participant1_id y participant2_id no existen
-- Correcto: participant_1 y participant_2
-- =====================================================

-- =====================================================
-- PASO 1: ELIMINAR POLÍTICAS INCORRECTAS
-- =====================================================

-- Eliminar política de lectura incorrecta (tabla)
DROP POLICY IF EXISTS "Users can read attachments from their threads" 
  ON public.message_attachments;

-- Eliminar política de lectura incorrecta (storage)
DROP POLICY IF EXISTS "Thread participants can read attachments" 
  ON storage.objects;

-- =====================================================
-- PASO 2: RECREAR POLÍTICAS CON NOMBRES CORRECTOS
-- =====================================================

-- Policy 1: Lectura - Solo participantes del thread (TABLA)
-- CORREGIDO: participant_1 y participant_2 (con guión bajo)
CREATE POLICY "Users can read attachments from their threads" 
  ON public.message_attachments
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 
      FROM public.messages m
      INNER JOIN public.conversations c ON m.conversation_id = c.id
      WHERE m.id = message_attachments.message_id
      AND (c.participant_1 = auth.uid()::text OR c.participant_2 = auth.uid()::text)
    )
  );

-- Policy 2: Lectura - Solo participantes del thread (STORAGE)
-- CORREGIDO: participant_1 y participant_2 (con guión bajo)
CREATE POLICY "Thread participants can read attachments" 
  ON storage.objects
  FOR SELECT 
  USING (
    bucket_id = 'message-attachments'
    AND (
      -- Permitir al service role
      auth.jwt()->>'role' = 'service_role'
      OR
      -- Permitir a participantes del thread
      EXISTS (
        SELECT 1 
        FROM public.message_attachments ma
        INNER JOIN public.messages m ON ma.message_id = m.id
        INNER JOIN public.conversations c ON m.conversation_id = c.id
        WHERE ma.path = storage.objects.name
        AND (c.participant_1 = auth.uid()::text OR c.participant_2 = auth.uid()::text)
      )
    )
  );

-- =====================================================
-- PASO 3: VERIFICACIÓN
-- =====================================================

-- Verificar políticas de tabla message_attachments
SELECT 
  schemaname,
  tablename, 
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'message_attachments'
ORDER BY policyname;

-- Verificar políticas de Storage
SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'objects' 
AND policyname LIKE '%attachment%'
ORDER BY policyname;

-- =====================================================
-- PASO 4: TEST DE VALIDACIÓN
-- =====================================================

-- Verificar que las columnas existen en conversations
SELECT 
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'conversations'
AND column_name IN ('participant_1', 'participant_2', 'participant1_id', 'participant2_id')
ORDER BY column_name;

-- =====================================================
-- NOTAS IMPORTANTES
-- =====================================================

/*
PROBLEMA IDENTIFICADO:
- Las políticas usaban: participant1_id y participant2_id
- Las columnas reales son: participant_1 y participant_2
- Esto causaba que las políticas fallaran silenciosamente

IMPACTO:
- Los adjuntos NO podían ser leídos por los participantes
- Solo el service role podía acceder
- Generaba errores PGRST205 en el frontend

SOLUCIÓN:
- Cambiar participant1_id → participant_1
- Cambiar participant2_id → participant_2

VERIFICACIÓN POST-FIX:
1. Las políticas deben aparecer sin errores
2. Los usuarios deben poder leer adjuntos de sus threads
3. El error PGRST205 debe desaparecer de los logs
*/

-- =====================================================
-- FIN DEL HOTFIX
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '==============================================';
  RAISE NOTICE 'HOTFIX: B6 - Políticas de Adjuntos Corregidas';
  RAISE NOTICE 'Ejecutado: %', NOW();
  RAISE NOTICE '==============================================';
END $$;
