-- =====================================================
-- 🔍 AUDITORÍA COMPLETA DE SUPABASE - MISIONES ARRIENDA
-- =====================================================
-- Ejecuta estas consultas una por una en tu SQL Editor de Supabase
-- Copia y pega los resultados para que pueda analizar tu configuración actual

-- =====================================================
-- 1️⃣ VERIFICAR TABLAS EXISTENTES
-- =====================================================
-- Esta consulta muestra todas las tablas en tu base de datos
SELECT 
    schemaname,
    tablename,
    tableowner,
    hasindexes,
    hasrules,
    hastriggers
FROM pg_tables 
WHERE schemaname IN ('public', 'auth') 
ORDER BY schemaname, tablename;

-- =====================================================
-- 2️⃣ VERIFICAR ESTRUCTURA DE TABLA USERS
-- =====================================================
-- Verifica si existe la tabla users y su estructura
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'users'
ORDER BY ordinal_position;

-- =====================================================
-- 3️⃣ VERIFICAR ESTRUCTURA DE TABLA PROPERTIES
-- =====================================================
-- Verifica la estructura de la tabla properties
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'properties'
ORDER BY ordinal_position;

-- =====================================================
-- 4️⃣ VERIFICAR POLÍTICAS RLS (ROW LEVEL SECURITY)
-- =====================================================
-- Muestra todas las políticas de seguridad configuradas
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
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- =====================================================
-- 5️⃣ VERIFICAR ESTADO RLS EN TABLAS
-- =====================================================
-- Verifica si RLS está habilitado en las tablas principales
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('users', 'properties', 'profiles')
ORDER BY tablename;

-- =====================================================
-- 6️⃣ VERIFICAR TRIGGERS Y FUNCIONES
-- =====================================================
-- Muestra todos los triggers configurados
SELECT 
    trigger_schema,
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement,
    action_timing
FROM information_schema.triggers 
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- =====================================================
-- 7️⃣ VERIFICAR FUNCIONES PERSONALIZADAS
-- =====================================================
-- Muestra las funciones que hemos creado
SELECT 
    routine_name,
    routine_type,
    data_type,
    routine_definition
FROM information_schema.routines 
WHERE routine_schema = 'public'
AND routine_name LIKE '%user%' OR routine_name LIKE '%handle%'
ORDER BY routine_name;

-- =====================================================
-- 8️⃣ VERIFICAR BUCKETS DE STORAGE
-- =====================================================
-- Verifica los buckets de almacenamiento configurados
SELECT 
    id,
    name,
    owner,
    created_at,
    updated_at,
    public
FROM storage.buckets
ORDER BY name;

-- =====================================================
-- 9️⃣ VERIFICAR POLÍTICAS DE STORAGE
-- =====================================================
-- Muestra las políticas de storage configuradas
SELECT 
    id,
    name,
    bucket_id,
    definition
FROM storage.policies
ORDER BY bucket_id, name;

-- =====================================================
-- 🔟 VERIFICAR DATOS DE EJEMPLO EN USERS
-- =====================================================
-- Muestra algunos registros de la tabla users (sin datos sensibles)
SELECT 
    id,
    name,
    email,
    user_type,
    company_name,
    email_verified,
    created_at
FROM users 
LIMIT 5;

-- =====================================================
-- 1️⃣1️⃣ VERIFICAR DATOS DE EJEMPLO EN PROPERTIES
-- =====================================================
-- Muestra algunos registros de la tabla properties
SELECT 
    id,
    title,
    property_type,
    price,
    currency,
    location,
    user_id,
    created_at
FROM properties 
LIMIT 5;

-- =====================================================
-- 1️⃣2️⃣ VERIFICAR ÍNDICES EXISTENTES
-- =====================================================
-- Muestra los índices configurados en las tablas principales
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public'
AND tablename IN ('users', 'properties', 'profiles')
ORDER BY tablename, indexname;

-- =====================================================
-- 1️⃣3️⃣ VERIFICAR CONSTRAINTS (RESTRICCIONES)
-- =====================================================
-- Muestra las restricciones de las tablas
SELECT 
    table_schema,
    table_name,
    constraint_name,
    constraint_type
FROM information_schema.table_constraints 
WHERE table_schema = 'public'
AND table_name IN ('users', 'properties', 'profiles')
ORDER BY table_name, constraint_type;

-- =====================================================
-- 1️⃣4️⃣ VERIFICAR RELACIONES ENTRE TABLAS
-- =====================================================
-- Muestra las foreign keys configuradas
SELECT 
    tc.table_schema,
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_schema AS foreign_table_schema,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_schema = 'public'
ORDER BY tc.table_name;

-- =====================================================
-- 1️⃣5️⃣ VERIFICAR CONFIGURACIÓN DE AUTENTICACIÓN
-- =====================================================
-- Muestra algunos usuarios de auth (sin datos sensibles)
SELECT 
    id,
    email,
    email_confirmed_at,
    created_at,
    updated_at,
    last_sign_in_at
FROM auth.users 
LIMIT 5;

-- =====================================================
-- 📋 INSTRUCCIONES DE USO:
-- =====================================================
/*
1. Ve a tu proyecto Supabase: https://qfeyhaaxyemmnohqdele.supabase.co
2. Abre "SQL Editor"
3. Crea "New Query"
4. Ejecuta cada consulta UNA POR UNA
5. Copia y pega TODOS los resultados aquí en el chat
6. Si alguna consulta da error, copia también el mensaje de error

IMPORTANTE: 
- NO compartas datos personales reales de usuarios
- Si hay emails reales, reemplázalos por "usuario@ejemplo.com"
- Solo necesito la estructura, no los datos sensibles

Con estos resultados podré:
✅ Identificar qué está configurado correctamente
✅ Detectar qué falta por configurar
✅ Crear la solución exacta para tu proyecto
✅ Resolver el error "Database error saving new user"
*/
