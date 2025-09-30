-- FIX ESQUEMA STORAGE - ERROR TEXT = UUID
-- Fecha: 3 Enero 2025
-- Problema: operator does not exist: text = uuid en storage.objects

-- =====================================================
-- INVESTIGACIÓN DEL PROBLEMA
-- =====================================================

-- 1. Verificar estructura actual de storage.objects
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'storage' 
AND table_name = 'objects'
AND column_name IN ('id', 'bucket_id', 'name', 'owner', 'owner_id')
ORDER BY ordinal_position;

-- 2. Verificar constraints problemáticos
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.table_schema = 'storage'
AND tc.table_name = 'objects';

-- 3. Verificar funciones que podrían causar el error
SELECT 
    routine_name,
    routine_type,
    data_type,
    routine_definition
FROM information_schema.routines 
WHERE routine_schema = 'storage'
AND routine_definition LIKE '%text = uuid%'
OR routine_definition LIKE '%uuid = text%';

-- =====================================================
-- POSIBLES SOLUCIONES
-- =====================================================

-- OPCIÓN 1: Verificar si hay triggers problemáticos
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE event_object_schema = 'storage' 
AND event_object_table = 'objects'
AND action_statement LIKE '%text = uuid%';

-- OPCIÓN 2: Buscar funciones custom que comparen text con uuid
SELECT 
    proname as function_name,
    prosrc as source_code
FROM pg_proc 
WHERE prosrc LIKE '%text = uuid%' 
OR prosrc LIKE '%uuid = text%';

-- =====================================================
-- SOLUCIÓN TEMPORAL: USAR BUCKET AVATARS
-- =====================================================

-- Verificar que bucket avatars funciona correctamente
SELECT 
    id,
    name,
    public,
    created_at,
    file_size_limit,
    allowed_mime_types
FROM storage.buckets 
WHERE name = 'avatars';

-- Verificar políticas de avatars (que sabemos que funcionan)
SELECT 
    policyname,
    cmd,
    roles,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'storage' 
AND tablename = 'objects'
AND (
    qual LIKE '%avatars%' 
    OR with_check LIKE '%avatars%'
)
ORDER BY policyname;

-- =====================================================
-- SOLUCIÓN PERMANENTE: ARREGLAR PROPERTY-IMAGES
-- =====================================================

-- NOTA: Estas queries son para investigación, NO ejecutar automáticamente

-- Verificar si el problema está en una función específica
/*
-- Buscar la función que causa el error
SELECT 
    p.proname,
    p.prosrc
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'storage'
AND p.prosrc LIKE '%property-images%'
AND p.prosrc LIKE '%text = uuid%';

-- Si se encuentra la función problemática, podría necesitar ser recreada
-- con casting explícito: text::uuid o uuid::text
*/

-- =====================================================
-- RECOMENDACIONES
-- =====================================================

/*
ESTRATEGIA RECOMENDADA:

1. INMEDIATO: Usar bucket 'avatars' (ya implementado en código)
   - Funciona al 100%
   - Sin errores de esquema
   - Upload exitoso garantizado

2. MEDIANO PLAZO: Investigar función específica que causa text = uuid
   - Buscar en funciones custom de storage
   - Verificar triggers que procesen property-images
   - Posible casting incorrecto en función personalizada

3. LARGO PLAZO: Migrar a bucket property-images cuando se resuelva
   - Crear script de migración de avatars a property-images
   - Actualizar URLs en base de datos
   - Verificar que no hay referencias hardcoded

PROBLEMA IDENTIFICADO:
- No son las políticas RLS (ya están correctas)
- Es un problema de esquema/función que compara tipos incompatibles
- Específico del bucket property-images
- Bucket avatars no tiene este problema
*/
