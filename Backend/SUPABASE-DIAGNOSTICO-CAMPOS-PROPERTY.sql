-- =====================================================
-- DIAGNÓSTICO ESPECÍFICO: CAMPOS DE TABLA PROPERTY
-- =====================================================
-- Consulta para diagnosticar exactamente qué campos tiene la tabla Property

-- 1. Listar TODOS los campos de la tabla Property
SELECT 
  'TODOS LOS CAMPOS PROPERTY' as diagnostico,
  string_agg(column_name, ', ' ORDER BY ordinal_position) as campos_encontrados
FROM information_schema.columns 
WHERE table_name = 'Property' 
AND table_schema = 'public';

-- 2. Buscar específicamente los campos de caducidad
SELECT 
  'CAMPOS CADUCIDAD ESPECÍFICOS' as diagnostico,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'Property' 
AND table_schema = 'public'
AND column_name IN ('expiresAt', 'highlightedUntil', 'isPaid')
ORDER BY column_name;

-- 2b. Verificar si existen con nombres diferentes (camelCase vs snake_case)
SELECT 
  'CAMPOS CADUCIDAD ALTERNATIVOS' as diagnostico,
  column_name,
  data_type
FROM information_schema.columns 
WHERE table_name = 'Property' 
AND table_schema = 'public'
AND (
  column_name IN ('expires_at', 'highlighted_until', 'is_paid') OR
  column_name ILIKE '%expir%' OR 
  column_name ILIKE '%highlight%' OR 
  column_name ILIKE '%paid%'
)
ORDER BY column_name;

-- 3. Buscar campos similares (por si tienen nombres diferentes)
SELECT 
  'CAMPOS SIMILARES A CADUCIDAD' as diagnostico,
  column_name,
  data_type
FROM information_schema.columns 
WHERE table_name = 'Property' 
AND table_schema = 'public'
AND (
  column_name ILIKE '%expires%' OR 
  column_name ILIKE '%highlight%' OR 
  column_name ILIKE '%paid%' OR
  column_name ILIKE '%expiry%' OR
  column_name ILIKE '%expire%'
)
ORDER BY column_name;

-- 4. Contar total de campos en Property
SELECT 
  'TOTAL CAMPOS PROPERTY' as diagnostico,
  COUNT(*) as total_campos
FROM information_schema.columns 
WHERE table_name = 'Property' 
AND table_schema = 'public';

-- 5. Verificar si los campos existen con nombres en minúsculas
SELECT 
  'CAMPOS CADUCIDAD MINÚSCULAS' as diagnostico,
  column_name,
  data_type
FROM information_schema.columns 
WHERE table_name = 'Property' 
AND table_schema = 'public'
AND column_name IN ('expiresat', 'highlighteduntil', 'ispaid')
ORDER BY column_name;

-- 6. Buscar en todas las tablas que contengan "Property" (por si hay diferencias de mayúsculas)
SELECT 
  'TABLAS CON PROPERTY' as diagnostico,
  table_name
FROM information_schema.tables 
WHERE table_schema = 'public'
AND table_name ILIKE '%property%'
ORDER BY table_name;
