-- =====================================================
-- FIX: Agregar columna fileName a MessageAttachment
-- =====================================================
-- Fecha: 2025-01-13
-- Propósito: Permitir descargas con nombre de archivo correcto
-- =====================================================

-- PASO 1: Agregar columna fileName
ALTER TABLE "MessageAttachment" 
ADD COLUMN IF NOT EXISTS "fileName" TEXT;

-- PASO 2: Poblar fileName extrayendo del path para registros existentes
UPDATE "MessageAttachment"
SET "fileName" = SUBSTRING(path FROM '[^/]+$')
WHERE "fileName" IS NULL;

-- PASO 3: Verificar que se aplicó correctamente
SELECT 
  id,
  path,
  "fileName",
  "createdAt"
FROM "MessageAttachment"
ORDER BY "createdAt" DESC
LIMIT 5;

-- PASO 4: (OPCIONAL) Agregar columna bucket para consistencia
ALTER TABLE "MessageAttachment" 
ADD COLUMN IF NOT EXISTS bucket TEXT DEFAULT 'message-attachments';

-- PASO 5: Crear índices para mejor performance
CREATE INDEX IF NOT EXISTS idx_messageattachment_messageid 
  ON "MessageAttachment"("messageId");

CREATE INDEX IF NOT EXISTS idx_messageattachment_userid 
  ON "MessageAttachment"("userId");

CREATE INDEX IF NOT EXISTS idx_messageattachment_createdat 
  ON "MessageAttachment"("createdAt" DESC);

-- PASO 6: Verificación final
SELECT 
  COUNT(*) as total,
  COUNT("fileName") as con_filename,
  COUNT(*) - COUNT("fileName") as sin_filename
FROM "MessageAttachment";

-- Resultado esperado:
-- total: 32+
-- con_filename: 32+
-- sin_filename: 0
