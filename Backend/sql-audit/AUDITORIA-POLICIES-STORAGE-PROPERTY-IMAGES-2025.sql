-- AUDITORÍA COMPLETA - POLÍTICAS STORAGE BUCKET PROPERTY-IMAGES
-- Fecha: 3 Enero 2025
-- Propósito: Identificar políticas RLS que bloquean upload

-- =====================================================
-- 1. VERIFICAR BUCKET PROPERTY-IMAGES
-- =====================================================

-- Verificar que el bucket existe y su configuración
SELECT 
    id,
    name,
    public,
    created_at,
    updated_at,
    file_size_limit,
    allowed_mime_types
FROM storage.buckets 
WHERE name = 'property-images';

-- =====================================================
-- 2. AUDITAR POLÍTICAS RLS DEL BUCKET
-- =====================================================

-- Listar todas las políticas para storage.objects
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'storage' 
AND tablename = 'objects'
ORDER BY policyname;

-- =====================================================
-- 3. VERIFICAR POLÍTICAS ESPECÍFICAS PARA PROPERTY-IMAGES
-- =====================================================

-- Buscar políticas que mencionen property-images
SELECT 
    policyname,
    cmd,
    qual,
    with_check,
    roles
FROM pg_policies 
WHERE schemaname = 'storage' 
AND tablename = 'objects'
AND (
    qual LIKE '%property-images%' 
    OR with_check LIKE '%property-images%'
    OR policyname LIKE '%property%'
);

-- =====================================================
-- 4. VERIFICAR PERMISOS DEL SERVICE ROLE
-- =====================================================

-- Verificar si service_role tiene permisos en storage
SELECT 
    grantee,
    privilege_type,
    is_grantable
FROM information_schema.role_table_grants 
WHERE table_schema = 'storage' 
AND table_name = 'objects'
AND grantee = 'service_role';

-- =====================================================
-- 5. VERIFICAR POLÍTICAS DE INSERCIÓN
-- =====================================================

-- Políticas que afectan INSERT (upload)
SELECT 
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'storage' 
AND tablename = 'objects'
AND cmd = 'INSERT'
ORDER BY policyname;

-- =====================================================
-- 6. VERIFICAR POLÍTICAS DE LECTURA
-- =====================================================

-- Políticas que afectan SELECT (list)
SELECT 
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'storage' 
AND tablename = 'objects'
AND cmd = 'SELECT'
ORDER BY policyname;

-- =====================================================
-- 7. VERIFICAR ESTRUCTURA DE STORAGE.OBJECTS
-- =====================================================

-- Verificar columnas de storage.objects
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'storage' 
AND table_name = 'objects'
ORDER BY ordinal_position;

-- =====================================================
-- 8. VERIFICAR CONSTRAINTS Y TRIGGERS
-- =====================================================

-- Verificar constraints que podrían causar el error text = uuid
SELECT 
    constraint_name,
    constraint_type,
    table_name,
    column_name
FROM information_schema.constraint_column_usage 
WHERE table_schema = 'storage' 
AND table_name = 'objects';

-- =====================================================
-- 9. VERIFICAR FUNCIONES Y TRIGGERS
-- =====================================================

-- Verificar triggers en storage.objects
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE event_object_schema = 'storage' 
AND event_object_table = 'objects';

-- =====================================================
-- 10. TEST DE INSERCIÓN MANUAL
-- =====================================================

-- NOTA: NO EJECUTAR - Solo para referencia
-- Este sería el tipo de INSERT que falla:
/*
INSERT INTO storage.objects (
    bucket_id, 
    name, 
    metadata
) VALUES (
    'property-images',
    'test-file.jpg',
    '{}'::jsonb
);
*/

-- =====================================================
-- INSTRUCCIONES DE EJECUCIÓN
-- =====================================================

/*
CÓMO USAR ESTE SCRIPT:

1. Conectarse a Supabase SQL Editor
2. Ejecutar cada sección por separado
3. Copiar resultados de cada query
4. Buscar especialmente:
   - Políticas que bloqueen INSERT
   - Constraints con problemas de tipos
   - Triggers que causen errores
   - Permisos faltantes para service_role

PROBLEMAS COMUNES A BUSCAR:
- Políticas RLS muy restrictivas
- Constraints de tipo uuid vs text
- Triggers que validen ownership
- Permisos faltantes en storage schema
*/
