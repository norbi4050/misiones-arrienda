-- =====================================================
-- CONSULTA SIMPLE: TODOS LOS CAMPOS DE PROPERTY
-- =====================================================
-- Consulta directa para ver exactamente qué campos tiene la tabla Property

-- 1. Listar TODOS los campos de la tabla Property con detalles
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default,
  ordinal_position
FROM information_schema.columns 
WHERE table_name = 'Property' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Buscar específicamente campos relacionados con caducidad/pago
SELECT 
  'CAMPOS RELACIONADOS CON CADUCIDAD/PAGO' as busqueda,
  column_name,
  data_type
FROM information_schema.columns 
WHERE table_name = 'Property' 
AND table_schema = 'public'
AND (
  column_name ILIKE '%expir%' OR 
  column_name ILIKE '%highlight%' OR 
  column_name ILIKE '%paid%' OR
  column_name ILIKE '%premium%' OR
  column_name ILIKE '%featured%' OR
  column_name ILIKE '%active%' OR
  column_name ILIKE '%status%'
)
ORDER BY column_name;

-- 3. Contar total de campos
SELECT 
  'TOTAL CAMPOS' as info,
  COUNT(*) as cantidad
FROM information_schema.columns 
WHERE table_name = 'Property' 
AND table_schema = 'public';
