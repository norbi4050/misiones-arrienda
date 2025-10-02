-- =====================================================
-- B6 - FIX ATTACHMENT POLICIES
-- Fecha: Enero 2025
-- Propósito: Corregir nombres de columnas en policies
-- =====================================================

-- Primero, eliminar las policies con error
DROP POLICY IF EXISTS "Users can read attachments from their threads" ON public.message_attachments;
DROP POLICY IF EXISTS "Thread participants can read attachments" ON storage.objects;

-- =====================================================
-- RECREAR POLICIES CON NOMBRES DE COLUMNAS CORRECTOS
-- =====================================================

-- Policy 1: Lectura en tabla - Solo participantes del thread
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

-- Policy 2: Lectura en storage - Solo participantes del thread
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
-- VERIFICACIÓN
-- =====================================================

-- Verificar políticas de tabla
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'message_attachments'
ORDER BY policyname;

-- Verificar políticas de storage
SELECT 
  policyname,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'objects' 
AND policyname LIKE '%attachment%'
ORDER BY policyname;

-- =====================================================
-- LOG
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '==============================================';
  RAISE NOTICE 'B6 - ATTACHMENT POLICIES FIXED';
  RAISE NOTICE 'Columnas corregidas: participant_1, participant_2';
  RAISE NOTICE 'Ejecutado: %', NOW();
  RAISE NOTICE '==============================================';
END $$;
