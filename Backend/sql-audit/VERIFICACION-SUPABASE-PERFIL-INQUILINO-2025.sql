-- =====================================================
-- 🔍 VERIFICACIÓN SUPABASE - PERFIL DE INQUILINO
-- Fecha: 3 de Enero, 2025
-- Objetivo: Diagnosticar error 500 en /profile/inquilino
-- =====================================================

-- =====================================================
-- 1. VERIFICAR TABLAS DE USUARIOS EXISTENTES
-- =====================================================

-- Buscar todas las tablas relacionadas con usuarios
SELECT 
    table_name,
    table_schema,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND (
    table_name ILIKE '%user%' 
    OR table_name ILIKE '%profile%'
    OR table_name ILIKE '%auth%'
  )
ORDER BY table_name;

-- =====================================================
-- 2. VERIFICAR ESTRUCTURA DE TABLA 'User' (camelCase)
-- =====================================================

-- Verificar si existe tabla 'User' con camelCase
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'User'
ORDER BY ordinal_position;

-- =====================================================
-- 3. VERIFICAR ESTRUCTURA DE TABLA 'users' (snake_case)
-- =====================================================

-- Verificar si existe tabla 'users' con snake_case
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'users'
ORDER BY ordinal_position;

-- =====================================================
-- 4. VERIFICAR CAMPOS ESPECÍFICOS PROBLEMÁTICOS
-- =====================================================

-- Buscar campos con diferentes naming conventions
SELECT 
    table_name,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND (
    column_name IN ('verified', 'createdAt', 'updatedAt', 'created_at', 'updated_at')
    OR column_name ILIKE '%name%'
    OR column_name ILIKE '%email%'
    OR column_name ILIKE '%phone%'
    OR column_name ILIKE '%bio%'
    OR column_name ILIKE '%avatar%'
  )
ORDER BY table_name, column_name;

-- =====================================================
-- 5. VERIFICAR RLS POLICIES PARA USUARIOS
-- =====================================================

-- Verificar políticas RLS en tablas de usuarios
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
WHERE tablename IN ('User', 'users', 'user_profiles')
ORDER BY tablename, policyname;

-- =====================================================
-- 6. VERIFICAR TRIGGERS DE UPDATED_AT
-- =====================================================

-- Buscar triggers relacionados con updated_at
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers 
WHERE event_object_schema = 'public'
  AND (
    event_object_table IN ('User', 'users', 'user_profiles')
    OR trigger_name ILIKE '%updated%'
  )
ORDER BY event_object_table, trigger_name;

-- =====================================================
-- 7. VERIFICAR DATOS DE EJEMPLO (SI EXISTEN)
-- =====================================================

-- Verificar si hay datos en tabla 'User'
SELECT 
    COUNT(*) as total_users_User,
    COUNT(CASE WHEN email IS NOT NULL THEN 1 END) as users_with_email,
    COUNT(CASE WHEN name IS NOT NULL THEN 1 END) as users_with_name
FROM "User"
WHERE true; -- Usar comillas para camelCase

-- Verificar si hay datos en tabla 'users'
SELECT 
    COUNT(*) as total_users_users,
    COUNT(CASE WHEN email IS NOT NULL THEN 1 END) as users_with_email,
    COUNT(CASE WHEN name IS NOT NULL THEN 1 END) as users_with_name
FROM users
WHERE true;

-- =====================================================
-- 8. VERIFICAR ESTRUCTURA AUTH.USERS (SUPABASE AUTH)
-- =====================================================

-- Verificar tabla de autenticación de Supabase
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'auth' 
  AND table_name = 'users'
ORDER BY ordinal_position;

-- =====================================================
-- 9. VERIFICAR FOREIGN KEYS ENTRE AUTH Y PUBLIC
-- =====================================================

-- Buscar relaciones entre auth.users y tablas públicas
SELECT 
    tc.table_name,
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
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_schema = 'public'
  AND (
    tc.table_name IN ('User', 'users', 'user_profiles')
    OR ccu.table_name = 'users'
  );

-- =====================================================
-- 10. TEST DE CONEXIÓN BÁSICA
-- =====================================================

-- Test simple para verificar conectividad
SELECT 
    current_database() as database_name,
    current_user as current_user,
    current_timestamp as server_time,
    version() as postgres_version;

-- =====================================================
-- 11. VERIFICAR PERMISOS DEL USUARIO ACTUAL
-- =====================================================

-- Verificar permisos en tablas de usuarios
SELECT 
    table_name,
    privilege_type,
    is_grantable
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
  AND table_name IN ('User', 'users', 'user_profiles')
  AND grantee = current_user
ORDER BY table_name, privilege_type;

-- =====================================================
-- 12. VERIFICAR EXTENSIONES SUPABASE
-- =====================================================

-- Verificar extensiones instaladas
SELECT 
    extname as extension_name,
    extversion as version
FROM pg_extension 
WHERE extname IN ('uuid-ossp', 'pgcrypto', 'pgjwt')
ORDER BY extname;

-- =====================================================
-- INSTRUCCIONES DE USO:
-- =====================================================

/*
CÓMO EJECUTAR ESTAS QUERIES:

1. Ir a Supabase Dashboard → SQL Editor
2. Copiar y pegar cada sección por separado
3. Ejecutar una por una para obtener resultados específicos
4. Documentar los resultados para identificar el problema

RESULTADOS ESPERADOS:
- Debe existir tabla 'User' O 'users' (no ambas)
- Campos: id, name, email, phone, bio como mínimo
- RLS policies para UPDATE con auth.uid()
- Trigger para updated_at automático

PROBLEMAS COMUNES:
- Tabla 'User' no existe → Usar 'users'
- Campos camelCase vs snake_case
- RLS policies faltantes
- Variables de entorno incorrectas
*/
