-- VERIFICACIÓN EXHAUSTIVA DE ESTRUCTURA REAL DE BASE DE DATOS
-- Para ejecutar en Supabase SQL Editor
-- Objetivo: Encontrar por qué el avatar no persiste

-- 1. VERIFICAR QUÉ TABLAS EXISTEN REALMENTE
SELECT table_name, table_schema 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name ILIKE '%user%' 
  OR table_name ILIKE '%profile%'
ORDER BY table_name;

-- 2. VERIFICAR ESTRUCTURA DE TABLA User (si existe)
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'User' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. VERIFICAR ESTRUCTURA DE TABLA users (minúscula, si existe)
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 4. VERIFICAR ESTRUCTURA DE TABLA profiles (si existe)
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 5. BUSCAR CUALQUIER TABLA CON CAMPOS DE AVATAR
SELECT 
  t.table_name,
  c.column_name,
  c.data_type
FROM information_schema.tables t
JOIN information_schema.columns c ON t.table_name = c.table_name
WHERE t.table_schema = 'public'
  AND (
    c.column_name ILIKE '%avatar%' 
    OR c.column_name ILIKE '%profile_image%'
    OR c.column_name ILIKE '%image%'
    OR c.column_name ILIKE '%photo%'
  )
ORDER BY t.table_name, c.column_name;

-- 6. VERIFICAR DATOS ACTUALES EN TABLA User (si existe)
-- NOTA: Cambiar 'User' por el nombre real de la tabla
SELECT 
  id, 
  name, 
  email, 
  avatar,
  profile_image,
  "updatedAt",
  "createdAt"
FROM "User" 
LIMIT 5;

-- 7. VERIFICAR RLS POLICIES QUE PUEDAN BLOQUEAR UPDATES
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
WHERE tablename ILIKE '%user%' 
  OR tablename ILIKE '%profile%'
ORDER BY tablename, policyname;

-- 8. VERIFICAR TRIGGERS QUE PUEDAN INTERFERIR
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE event_object_table ILIKE '%user%'
  OR event_object_table ILIKE '%profile%'
ORDER BY event_object_table, trigger_name;

-- 9. PROBAR UPDATE MANUAL (CAMBIAR user-id-real)
-- DESCOMENTA Y EJECUTA CON TU USER ID REAL:
-- UPDATE "User" 
-- SET avatar = 'https://test-url.com/test.jpg',
--     "updatedAt" = NOW()
-- WHERE id = 'tu-user-id-aqui';

-- 10. VERIFICAR SI EL UPDATE FUNCIONÓ
-- SELECT id, name, avatar, "updatedAt" 
-- FROM "User" 
-- WHERE id = 'tu-user-id-aqui';

-- 11. VERIFICAR PERMISOS DEL USUARIO ACTUAL
SELECT 
  auth.uid() as current_user_id,
  auth.role() as current_role;

-- 12. VERIFICAR SI HAY CONFLICTOS DE NOMBRES DE COLUMNA
SELECT 
  table_name,
  column_name,
  data_type,
  CASE 
    WHEN column_name = 'avatar' THEN '✅ CORRECTO'
    WHEN column_name = 'profile_image' THEN '⚠️ LEGACY'
    WHEN column_name ILIKE '%image%' THEN '❓ POSIBLE'
    ELSE '❌ OTRO'
  END as status
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name ILIKE '%user%'
  AND (
    column_name ILIKE '%avatar%' 
    OR column_name ILIKE '%image%'
    OR column_name ILIKE '%photo%'
  )
ORDER BY table_name, column_name;

-- INSTRUCCIONES:
-- 1. Ejecuta cada query por separado en Supabase SQL Editor
-- 2. Anota los resultados de cada query
-- 3. Identifica cuál es la tabla y campo REAL que existe
-- 4. Verifica si hay RLS policies que bloqueen updates
-- 5. Prueba el UPDATE manual con tu user ID
-- 6. Reporta los hallazgos para aplicar el fix correcto
