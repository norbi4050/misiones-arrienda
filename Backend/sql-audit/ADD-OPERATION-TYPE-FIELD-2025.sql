-- Migración: Agregar campo operation_type a tabla properties
-- Fecha: 2025-01-XX
-- Objetivo: Permitir filtrar propiedades por tipo de operación (RENT, SALE, BOTH)

-- 1. Agregar columna con valor por defecto
ALTER TABLE "Property" 
ADD COLUMN IF NOT EXISTS "operationType" TEXT NOT NULL DEFAULT 'BOTH';

-- 2. Comentario para documentación
COMMENT ON COLUMN "Property"."operationType" IS 'Tipo de operación: RENT (alquiler), SALE (venta), BOTH (ambos)';

-- 3. Crear índice para mejorar performance de filtros
CREATE INDEX IF NOT EXISTS "Property_operationType_idx" ON "Property"("operationType");

-- 4. Validar que solo acepta valores permitidos (constraint check)
ALTER TABLE "Property"
ADD CONSTRAINT "Property_operationType_check" 
CHECK ("operationType" IN ('RENT', 'SALE', 'BOTH'));

-- 5. Actualizar propiedades existentes (opcional - todas quedan como BOTH por defecto)
-- Si quieres clasificar las existentes basándote en alguna lógica:
-- UPDATE "Property" SET "operationType" = 'RENT' WHERE ...;
-- UPDATE "Property" SET "operationType" = 'SALE' WHERE ...;

-- Verificación
SELECT 
  "operationType",
  COUNT(*) as count
FROM "Property"
GROUP BY "operationType";
