-- =====================================================
-- OPCIÓN B - SEGURA: Crear tabla MessageAttachment (PRISMA)
-- Fecha: 09 Octubre 2025
-- Objetivo: Tabla de adjuntos compatible con Message (PRISMA)
-- =====================================================

-- PASO 1: Crear nueva tabla MessageAttachment (PRISMA naming)
CREATE TABLE IF NOT EXISTS "MessageAttachment" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "messageId" TEXT NOT NULL,  -- FK a Message.id
    "userId" TEXT NOT NULL,      -- Usuario que subió
    path TEXT NOT NULL,          -- Ruta en Storage
    mime TEXT NOT NULL,          -- Tipo MIME
    "sizeBytes" INTEGER NOT NULL, -- Tamaño en bytes
    width INTEGER,               -- Ancho (si es imagen)
    height INTEGER,              -- Alto (si es imagen)
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- Foreign Key a tabla Message (PRISMA)
    CONSTRAINT "MessageAttachment_messageId_fkey" 
        FOREIGN KEY ("messageId") 
        REFERENCES "Message"(id) 
        ON DELETE CASCADE
);

-- PASO 2: Crear índices para performance
CREATE INDEX IF NOT EXISTS "MessageAttachment_messageId_idx" 
    ON "MessageAttachment"("messageId");

CREATE INDEX IF NOT EXISTS "MessageAttachment_userId_idx" 
    ON "MessageAttachment"("userId");

CREATE INDEX IF NOT EXISTS "MessageAttachment_createdAt_idx" 
    ON "MessageAttachment"("createdAt" DESC);

-- PASO 3: Habilitar RLS (Row Level Security)
ALTER TABLE "MessageAttachment" ENABLE ROW LEVEL SECURITY;

-- PASO 4: Políticas RLS - Los usuarios solo ven adjuntos de sus conversaciones
CREATE POLICY "Users can view attachments in their conversations"
    ON "MessageAttachment"
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM "Message" m
            JOIN "Conversation" c ON m."conversationId" = c.id
            JOIN "UserProfile" up ON up."userId" = auth.uid()
            WHERE m.id = "MessageAttachment"."messageId"
            AND (c."aId" = up.id OR c."bId" = up.id)
        )
    );

CREATE POLICY "Users can insert attachments in their conversations"
    ON "MessageAttachment"
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM "Message" m
            JOIN "Conversation" c ON m."conversationId" = c.id
            JOIN "UserProfile" up ON up."userId" = auth.uid()
            WHERE m.id = "MessageAttachment"."messageId"
            AND (c."aId" = up.id OR c."bId" = up.id)
        )
    );

CREATE POLICY "Users can delete their own attachments"
    ON "MessageAttachment"
    FOR DELETE
    USING ("userId" = (auth.uid())::TEXT);

-- PASO 5: Verificar que la tabla se creó correctamente
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'MessageAttachment'
AND table_schema = 'public'
ORDER BY ordinal_position;

-- PASO 6: Verificar políticas RLS
SELECT 
    policyname,
    cmd,
    qual
FROM pg_policies
WHERE tablename = 'MessageAttachment';

-- PASO 7: Habilitar adjuntos para plan FREE
UPDATE plan_limits_config
SET allow_attachments = true
WHERE plan_tier = 'free';

-- PASO 8: Verificar configuración final
SELECT * FROM plan_limits_config WHERE plan_tier = 'free';
