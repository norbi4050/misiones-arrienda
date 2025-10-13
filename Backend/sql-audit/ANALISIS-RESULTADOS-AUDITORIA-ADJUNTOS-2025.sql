-- =====================================================
-- ANÁLISIS DE RESULTADOS: Auditoría de Adjuntos
-- =====================================================
-- Fecha: 2025-01-13
-- =====================================================

-- =====================================================
-- HALLAZGOS PRINCIPALES
-- =====================================================

/*
SITUACIÓN ACTUAL:

✅ CORRECTO:
1. Tabla MessageAttachment (Prisma) existe y tiene 32 registros
2. Tabla message_attachments (Supabase) existe pero está vacía (0 registros)
3. Storage bucket configurado correctamente:
   - Privado (public: false)
   - Límite: 50MB
   - MIME types permitidos: image/png, image/jpeg, image/jpg, application/pdf
4. RLS habilitado en ambas tablas
5. Políticas RLS correctas
6. Función RPC get_unread_messages_count existe

❌ PROBLEMAS IDENTIFICADOS:
1. message_attachments está VACÍA (debería tener los mismos 32 registros)
2. Hay 10 adjuntos huérfanos (messageId = NULL) en MessageAttachment
3. Inconsistencia de esquemas entre tablas:
   - MessageAttachment usa camelCase (messageId, userId, sizeBytes)
   - message_attachments usa snake_case (message_id, user_id, size_bytes)
4. message_attachments tiene columna 'bucket' que MessageAttachment no tiene

CONCLUSIÓN:
- MessageAttachment es la tabla REAL que se está usando
- message_attachments parece ser una tabla separada o vista que no se está poblando
- El código ya está corregido para buscar en MessageAttachment primero
*/

-- =====================================================
-- PARTE 1: VERIFICAR RELACIÓN ENTRE TABLAS
-- =====================================================

-- 1.1. Verificar si message_attachments es una vista
SELECT 
  table_name,
  table_type
FROM information_schema.tables
WHERE table_name IN ('MessageAttachment', 'message_attachments')
  AND table_schema = 'public';

-- Resultado esperado:
-- MessageAttachment: BASE TABLE
-- message_attachments: BASE TABLE o VIEW

-- 1.2. Si message_attachments es BASE TABLE vacía, verificar si hay trigger o función
-- que debería sincronizarla
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE event_object_table IN ('MessageAttachment', 'message_attachments')
  AND trigger_schema = 'public';

-- =====================================================
-- PARTE 2: LIMPIAR ADJUNTOS HUÉRFANOS
-- =====================================================

-- 2.1. Ver todos los adjuntos huérfanos (sin mensaje)
SELECT 
  id,
  "userId",
  path,
  mime,
  "sizeBytes",
  "createdAt",
  AGE(NOW(), "createdAt") as antiguedad
FROM "MessageAttachment"
WHERE "messageId" IS NULL
ORDER BY "createdAt" DESC;

-- 2.2. OPCIONAL: Eliminar adjuntos huérfanos más antiguos de 24 horas
-- CUIDADO: Solo ejecutar si estás seguro
/*
DELETE FROM "MessageAttachment"
WHERE "messageId" IS NULL
  AND "createdAt" < NOW() - INTERVAL '24 hours'
RETURNING id, path;
*/

-- 2.3. OPCIONAL: Eliminar archivos huérfanos de Storage
-- Esto debe hacerse desde el código, no desde SQL
-- Ver endpoint: /api/debug-attachments-tables

-- =====================================================
-- PARTE 3: SINCRONIZAR message_attachments (SI ES NECESARIO)
-- =====================================================

-- 3.1. OPCIÓN A: Si message_attachments debe ser una vista, crearla
-- EJECUTAR SOLO SI message_attachments debe ser una vista de MessageAttachment
/*
DROP TABLE IF EXISTS message_attachments CASCADE;

CREATE OR REPLACE VIEW message_attachments AS
SELECT 
  id::text as id,
  "messageId"::text as message_id,
  "userId"::text as user_id,
  'message-attachments'::text as bucket,
  path,
  mime,
  "sizeBytes" as size_bytes,
  width::smallint as width,
  height::smallint as height,
  "createdAt" as created_at
FROM "MessageAttachment";

-- Recrear políticas RLS para la vista
ALTER VIEW message_attachments OWNER TO postgres;
GRANT SELECT ON message_attachments TO authenticated;
GRANT SELECT ON message_attachments TO service_role;
*/

-- 3.2. OPCIÓN B: Si message_attachments debe ser tabla independiente, poblarla
-- EJECUTAR SOLO SI quieres copiar datos de MessageAttachment a message_attachments
/*
INSERT INTO message_attachments (
  id,
  message_id,
  user_id,
  bucket,
  path,
  mime,
  size_bytes,
  width,
  height,
  created_at
)
SELECT 
  id::text,
  "messageId"::text,
  "userId"::text,
  'message-attachments'::text,
  path,
  mime,
  "sizeBytes",
  width::smallint,
  height::smallint,
  "createdAt"
FROM "MessageAttachment"
WHERE "messageId" IS NOT NULL  -- Solo copiar adjuntos con mensaje
ON CONFLICT (id) DO NOTHING;
*/

-- =====================================================
-- PARTE 4: CREAR ÍNDICES FALTANTES
-- =====================================================

-- 4.1. Índices en MessageAttachment
CREATE INDEX IF NOT EXISTS idx_messageattachment_messageid 
  ON "MessageAttachment"("messageId");

CREATE INDEX IF NOT EXISTS idx_messageattachment_userid 
  ON "MessageAttachment"("userId");

CREATE INDEX IF NOT EXISTS idx_messageattachment_path 
  ON "MessageAttachment"(path);

CREATE INDEX IF NOT EXISTS idx_messageattachment_createdat 
  ON "MessageAttachment"("createdAt" DESC);

-- 4.2. Índices en message_attachments (si es tabla)
CREATE INDEX IF NOT EXISTS idx_message_attachments_message_id 
  ON message_attachments(message_id);

CREATE INDEX IF NOT EXISTS idx_message_attachments_user_id 
  ON message_attachments(user_id);

-- =====================================================
-- PARTE 5: VERIFICACIÓN FINAL
-- =====================================================

-- 5.1. Resumen ejecutivo
SELECT 
  'MessageAttachment' as tabla,
  COUNT(*) as total,
  COUNT(CASE WHEN "messageId" IS NULL THEN 1 END) as sin_mensaje,
  COUNT(CASE WHEN "messageId" IS NOT NULL THEN 1 END) as con_mensaje,
  SUM("sizeBytes") as bytes_totales,
  pg_size_pretty(SUM("sizeBytes")::bigint) as tamaño_legible,
  MIN("createdAt") as primer_adjunto,
  MAX("createdAt") as ultimo_adjunto
FROM "MessageAttachment";

-- 5.2. Verificar el adjunto específico que viste en la UI
SELECT 
  id,
  "messageId",
  "userId",
  path,
  mime,
  "sizeBytes",
  "createdAt"
FROM "MessageAttachment"
WHERE id = '99e91d46-dfea-49f0-8787-f30c7efdf48f';

-- 5.3. Ver últimos 5 adjuntos CON mensaje
SELECT 
  id,
  "messageId",
  "userId",
  path,
  mime,
  pg_size_pretty("sizeBytes"::bigint) as tamaño,
  "createdAt"
FROM "MessageAttachment"
WHERE "messageId" IS NOT NULL
ORDER BY "createdAt" DESC
LIMIT 5;

-- =====================================================
-- RECOMENDACIONES
-- =====================================================

/*
RECOMENDACIÓN 1: USAR SOLO MessageAttachment
- El código ya está corregido para buscar en MessageAttachment primero
- message_attachments puede ignorarse o eliminarse si no se usa
- Esto simplifica el sistema

RECOMENDACIÓN 2: LIMPIAR ADJUNTOS HUÉRFANOS
- Hay 10 adjuntos sin mensaje asociado
- Probablemente son de pruebas o mensajes que no se enviaron
- Pueden eliminarse después de 24-48 horas

RECOMENDACIÓN 3: AGREGAR COLUMNA file_name A MessageAttachment
- Actualmente no tiene columna para guardar el nombre original del archivo
- Esto ayudaría a la descarga con nombre correcto
- SQL para agregar:

ALTER TABLE "MessageAttachment" 
ADD COLUMN IF NOT EXISTS "fileName" TEXT;

RECOMENDACIÓN 4: AGREGAR COLUMNA bucket A MessageAttachment
- Para consistencia con message_attachments
- SQL para agregar:

ALTER TABLE "MessageAttachment" 
ADD COLUMN IF NOT EXISTS bucket TEXT DEFAULT 'message-attachments';

RECOMENDACIÓN 5: CREAR TRIGGER DE LIMPIEZA AUTOMÁTICA
- Eliminar adjuntos huérfanos después de 24 horas
- Ver archivo: sql-audit/TRIGGER-LIMPIAR-ADJUNTOS-HUERFANOS-2025.sql
*/

-- =====================================================
-- ACCIONES INMEDIATAS RECOMENDADAS
-- =====================================================

-- ACCIÓN 1: Agregar columnas faltantes a MessageAttachment
ALTER TABLE "MessageAttachment" 
ADD COLUMN IF NOT EXISTS "fileName" TEXT,
ADD COLUMN IF NOT EXISTS bucket TEXT DEFAULT 'message-attachments';

-- ACCIÓN 2: Actualizar fileName para registros existentes (extraer de path)
UPDATE "MessageAttachment"
SET "fileName" = SUBSTRING(path FROM '[^/]+$')
WHERE "fileName" IS NULL;

-- ACCIÓN 3: Crear índices
CREATE INDEX IF NOT EXISTS idx_messageattachment_messageid 
  ON "MessageAttachment"("messageId");

CREATE INDEX IF NOT EXISTS idx_messageattachment_userid 
  ON "MessageAttachment"("userId");

-- ACCIÓN 4: Verificar que todo funciona
SELECT 
  id,
  "messageId",
  "fileName",
  bucket,
  path,
  mime
FROM "MessageAttachment"
WHERE id = '99e91d46-dfea-49f0-8787-f30c7efdf48f';

-- =====================================================
-- RESULTADO ESPERADO DESPUÉS DE FIXES
-- =====================================================

/*
DESPUÉS DE EJECUTAR LAS ACCIONES:
1. MessageAttachment tendrá columnas fileName y bucket
2. Todos los registros tendrán fileName poblado
3. Índices creados para mejor performance
4. El código de descarga funcionará correctamente
5. Los adjuntos se descargarán con su nombre original

PARA PROBAR:
1. Ir a la aplicación
2. Abrir una conversación con el adjunto ID: 99e91d46-dfea-49f0-8787-f30c7efdf48f
3. Click en "Descargar"
4. Verificar que se descarga (no se abre)
5. Verificar que el nombre del archivo es correcto
*/
