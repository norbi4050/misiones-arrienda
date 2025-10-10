-- =====================================================
-- CREAR RLS POLICIES PARA MessageAttachment
-- =====================================================

-- 1. Habilitar RLS en la tabla (si no está habilitado)
ALTER TABLE "MessageAttachment" ENABLE ROW LEVEL SECURITY;

-- 2. Policy para LEER adjuntos
-- Permitir leer adjuntos de mensajes en conversaciones donde el usuario es participante
CREATE POLICY "Users can read attachments from their conversations"
ON "MessageAttachment"
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM "Message" m
    INNER JOIN "Conversation" c ON c.id = m."conversationId"
    INNER JOIN "UserProfile" up ON up."userId" = auth.uid()
    WHERE m.id = "MessageAttachment"."messageId"
    AND c."isActive" = true
    AND (c."aId" = up.id OR c."bId" = up.id)
  )
);

-- 3. Policy para INSERTAR adjuntos
-- Permitir crear adjuntos solo si el usuario es el dueño
CREATE POLICY "Users can insert their own attachments"
ON "MessageAttachment"
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM "UserProfile" up
    WHERE up."userId" = auth.uid()
    AND up.id = "MessageAttachment"."userId"
  )
);

-- 4. Policy para ACTUALIZAR adjuntos
-- Permitir actualizar solo sus propios adjuntos
CREATE POLICY "Users can update their own attachments"
ON "MessageAttachment"
FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM "UserProfile" up
    WHERE up."userId" = auth.uid()
    AND up.id = "MessageAttachment"."userId"
  )
);

-- 5. Policy para ELIMINAR adjuntos
-- Permitir eliminar solo sus propios adjuntos
CREATE POLICY "Users can delete their own attachments"
ON "MessageAttachment"
FOR DELETE
USING (
  EXISTS (
    SELECT 1
    FROM "UserProfile" up
    WHERE up."userId" = auth.uid()
    AND up.id = "MessageAttachment"."userId"
  )
);

-- Verificar policies creadas
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'MessageAttachment';
