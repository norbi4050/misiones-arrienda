-- ============================================================================
-- BUSCAR ORIGEN DEL ERROR: user_profiles.user_id does not exist
-- Fecha: 2025-01-13
-- ============================================================================

-- PASO 1: Buscar en VIEWs que referencien user_profiles
SELECT 
    schemaname,
    viewname,
    definition
FROM pg_views
WHERE schemaname = 'public'
  AND definition LIKE '%user_profiles%'
ORDER BY viewname;

-- PASO 2: Buscar específicamente referencias a user_id en VIEWs
SELECT 
    schemaname,
    viewname,
    definition
FROM pg_views
WHERE schemaname = 'public'
  AND definition ILIKE '%user_profiles%user_id%'
ORDER BY viewname;

-- PASO 3: Buscar en FUNCTIONs que referencien user_profiles
SELECT 
    n.nspname as schema_name,
    p.proname as function_name,
    pg_get_functiondef(p.oid) as function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND pg_get_functiondef(p.oid) ILIKE '%user_profiles%'
ORDER BY p.proname;

-- PASO 4: Buscar TRIGGERs en tablas relacionadas con conversaciones
SELECT 
    event_object_schema AS schema_name,
    event_object_table AS table_name,
    trigger_name,
    event_manipulation AS trigger_event,
    action_statement AS trigger_action
FROM information_schema.triggers
WHERE event_object_schema = 'public'
  AND (event_object_table LIKE '%conversation%' 
       OR event_object_table LIKE '%message%'
       OR event_object_table = 'user_profiles')
ORDER BY event_object_table, trigger_name;

-- PASO 5: Ver definición completa de TRIGGERs
SELECT 
    tgname AS trigger_name,
    tgrelid::regclass AS table_name,
    pg_get_triggerdef(oid) AS trigger_definition
FROM pg_trigger
WHERE tgrelid IN (
    SELECT oid 
    FROM pg_class 
    WHERE relname IN ('conversations', 'Conversation', 'messages', 'Message', 'user_profiles', 'UserProfile')
      AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
)
ORDER BY tgrelid::regclass, tgname;

-- PASO 6: Buscar FOREIGN KEYs que apunten a user_profiles
SELECT
    tc.constraint_name,
    tc.table_schema,
    tc.table_name,
    kcu.column_name,
    ccu.table_schema AS foreign_table_schema,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    rc.update_rule,
    rc.delete_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
JOIN information_schema.referential_constraints AS rc
  ON tc.constraint_name = rc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND (ccu.table_name = 'user_profiles' OR tc.table_name = 'user_profiles')
  AND tc.table_schema = 'public'
ORDER BY tc.table_name, tc.constraint_name;

-- PASO 7: Verificar si hay alguna columna user_id en tablas relacionadas
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND column_name ILIKE '%user_id%'
  AND table_name IN ('conversations', 'Conversation', 'messages', 'Message', 'user_profiles', 'UserProfile')
ORDER BY table_name, column_name;

-- PASO 8: Buscar en el modelo Prisma (tablas que Prisma creó)
SELECT 
    table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN (
    SELECT tablename 
    FROM pg_tables 
    WHERE schemaname = 'public'
      AND tablename LIKE '%Profile%'
  )
ORDER BY table_name, ordinal_position;

-- PASO 9: Ver si hay alguna MATERIALIZED VIEW
SELECT 
    schemaname,
    matviewname,
    definition
FROM pg_matviews
WHERE schemaname = 'public'
  AND definition LIKE '%user_profiles%'
ORDER BY matviewname;

-- PASO 10: Buscar en RLS policies que puedan tener subqueries
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
  AND (qual LIKE '%user_profiles%' OR with_check LIKE '%user_profiles%')
ORDER BY tablename, policyname;

-- ============================================================================
-- QUERIES ADICIONALES PARA DEBUGGING
-- ============================================================================

-- Ver todas las tablas que tienen relación con user_profiles
SELECT DISTINCT
    tc.table_name AS source_table,
    kcu.column_name AS source_column,
    ccu.table_name AS target_table,
    ccu.column_name AS target_column
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu
  ON tc.constraint_name = ccu.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND (tc.table_name = 'user_profiles' OR ccu.table_name = 'user_profiles')
  AND tc.table_schema = 'public';

-- Ver el schema completo de conversations
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('conversations', 'Conversation')
ORDER BY table_name, ordinal_position;

-- ============================================================================
-- INSTRUCCIONES
-- ============================================================================

/*
CÓMO USAR ESTE SCRIPT:

1. Ejecutar en Supabase SQL Editor
2. Revisar cada resultado buscando referencias a "user_id"
3. Prestar especial atención a:
   - VIEWs que hagan JOIN con user_profiles
   - FUNCTIONs que accedan a user_profiles.user_id
   - TRIGGERs que se ejecuten en operaciones de conversaciones
   - FOREIGN KEYs mal configuradas

4. Una vez identificada la fuente, ejecutar el fix correspondiente

POSIBLES SOLUCIONES:

A) Si es una VIEW:
   DROP VIEW nombre_view;
   CREATE VIEW nombre_view AS ...  (usando 'id' en lugar de 'user_id')

B) Si es una FUNCTION:
   CREATE OR REPLACE FUNCTION ...  (corregir referencias a user_id)

C) Si es un FOREIGN KEY:
   ALTER TABLE ... DROP CONSTRAINT ...;
   ALTER TABLE ... ADD CONSTRAINT ... (con la columna correcta)

D) Si es un TRIGGER:
   DROP TRIGGER ...;
   CREATE TRIGGER ...  (con la lógica corregida)
*/
