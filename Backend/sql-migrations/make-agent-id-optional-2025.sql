-- Migración para hacer agent_id opcional en la tabla properties
-- Fecha: 18 de Enero 2025
-- Problema: agent_id es NOT NULL pero debería ser opcional según Prisma

-- 1. Hacer agent_id opcional (permitir NULL)
ALTER TABLE properties 
ALTER COLUMN agent_id DROP NOT NULL;

-- 2. Verificar el cambio
SELECT 
    column_name, 
    is_nullable, 
    data_type,
    column_default
FROM information_schema.columns 
WHERE table_name = 'properties' 
AND column_name = 'agent_id';

-- 3. Comentario para documentar el cambio
COMMENT ON COLUMN properties.agent_id IS 'ID del agente - OPCIONAL. Puede ser NULL si la propiedad no tiene agente asignado.';
