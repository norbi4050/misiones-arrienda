-- =====================================================
-- AUDITORÍA COMPLETA DE SUPABASE - TABLA PROPERTIES
-- Ejecutar estos queries en Supabase SQL Editor
-- =====================================================

-- 1. VERIFICAR SI LA TABLA PROPERTIES EXISTE
SELECT 
    schemaname,
    tablename,
    tableowner,
    hasindexes,
    hasrules,
    hastriggers,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'properties';

-- 2. OBTENER TODAS LAS COLUMNAS DE LA TABLA PROPERTIES
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length,
    numeric_precision,
    numeric_scale,
    ordinal_position
FROM information_schema.columns 
WHERE table_name = 'properties' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. VERIFICAR CONSTRAINTS (PRIMARY KEY, FOREIGN KEY, UNIQUE, CHECK)
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
LEFT JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.table_name = 'properties' 
    AND tc.table_schema = 'public';

-- 4. VERIFICAR ÍNDICES
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'properties' 
    AND schemaname = 'public';

-- 5. VERIFICAR RLS (ROW LEVEL SECURITY)
SELECT 
    schemaname,
    tablename,
    rowsecurity,
    forcerowsecurity
FROM pg_tables 
WHERE tablename = 'properties';

-- 6. VERIFICAR POLÍTICAS RLS
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
WHERE tablename = 'properties';

-- 7. VERIFICAR TRIGGERS
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement,
    action_timing
FROM information_schema.triggers 
WHERE event_object_table = 'properties';

-- 8. VERIFICAR PERMISOS DE LA TABLA
SELECT 
    grantee,
    privilege_type,
    is_grantable
FROM information_schema.role_table_grants 
WHERE table_name = 'properties' 
    AND table_schema = 'public';

-- 9. OBTENER ESTRUCTURA COMPLETA DE LA TABLA (DDL)
SELECT 
    'CREATE TABLE ' || schemaname || '.' || tablename || ' (' ||
    string_agg(
        column_name || ' ' || 
        CASE 
            WHEN data_type = 'character varying' THEN 'varchar(' || character_maximum_length || ')'
            WHEN data_type = 'numeric' THEN 'numeric(' || numeric_precision || ',' || numeric_scale || ')'
            ELSE data_type 
        END ||
        CASE WHEN is_nullable = 'NO' THEN ' NOT NULL' ELSE '' END,
        ', '
    ) || ');' as create_statement
FROM information_schema.columns c
JOIN pg_tables t ON c.table_name = t.tablename
WHERE c.table_name = 'properties' 
    AND c.table_schema = 'public'
GROUP BY schemaname, tablename;

-- 10. VERIFICAR SI HAY DATOS EN LA TABLA
SELECT COUNT(*) as total_records FROM properties;

-- 11. OBTENER SAMPLE DE DATOS (PRIMEROS 3 REGISTROS)
SELECT * FROM properties LIMIT 3;

-- 12. VERIFICAR COLUMNAS ESPECÍFICAS QUE HAN DADO PROBLEMAS
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'properties' 
    AND table_schema = 'public'
    AND column_name IN (
        'contact_phone', 
        'contact_name', 
        'contact_email',
        'user_id',
        'userId',
        'agent_id',
        'agentId',
        'property_type',
        'propertyType',
        'postal_code',
        'postalCode',
        'is_active',
        'isActive',
        'is_paid',
        'isPaid'
    )
ORDER BY column_name;

-- 13. VERIFICAR TODAS LAS TABLAS RELACIONADAS
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_name IN ('users', 'agents', 'profiles')
ORDER BY table_name;

-- 14. VERIFICAR FOREIGN KEYS HACIA PROPERTIES
SELECT 
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND ccu.table_name = 'properties';

-- 15. VERIFICAR FOREIGN KEYS DESDE PROPERTIES
SELECT 
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name = 'properties';
