-- ============================================================================
-- INVESTIGACIÓN COMPLETA: Prompts A-E para user_profiles.user_id
-- Fecha: 2025-01-13
-- Objetivo: Implementar los 5 prompts de investigación sistemática
-- ============================================================================

-- ============================================================================
-- PROMPT A: Listar TODAS las functions y revisar definiciones (solo lectura)
-- ============================================================================

-- PASO A1: Listado resumido de todas las functions
-- Lista nombre, args y tipo retorno
SELECT 
    n.nspname AS schema_name,
    p.proname AS function_name,
    pg_catalog.pg_get_function_arguments(p.oid) AS arguments,
    t.typname AS return_type,
    p.oid AS function_oid
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
LEFT JOIN pg_type t ON p.prorettype = t.oid
WHERE n.nspname = 'public'
ORDER BY p.proname;

-- PASO A2: Candidatas por texto (búsqueda rápida)
-- Busca functions cuyo cuerpo contenga 'user_profiles' OR 'user_id'
SELECT 
    p.oid,
    p.proname,
    n.nspname,
    CASE 
        WHEN pg_get_functiondef(p.oid) ILIKE '%user_profiles.user_id%' THEN '🔴 CRÍTICO: user_profiles.user_id'
        WHEN pg_get_functiondef(p.oid) ILIKE '%user_profiles%' THEN '🟡 REVISAR: user_profiles'
        WHEN pg_get_functiondef(p.oid) ILIKE '%user_id%' THEN '🟢 INFO: user_id'
        ELSE '⚪ OTRO'
    END AS priority
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND (
    pg_get_functiondef(p.oid) ILIKE '%user_profiles%'
    OR pg_get_functiondef(p.oid) ILIKE '%user_id%'
  )
ORDER BY 
    CASE 
        WHEN pg_get_functiondef(p.oid) ILIKE '%user_profiles.user_id%' THEN 1
        WHEN pg_get_functiondef(p.oid) ILIKE '%user_profiles%' THEN 2
        WHEN pg_get_functiondef(p.oid) ILIKE '%user_id%' THEN 3
        ELSE 4
    END,
    p.proname;

-- PASO A3: Dump de definiciones para revisión
-- INSTRUCCIONES: Ejecutar para cada OID del paso A2
-- Ejemplo: SELECT pg_get_functiondef(12345);

-- Template para inspeccionar functions individuales:
/*
SELECT pg_get_functiondef(<OID_AQUI>);
*/

-- PASO A4: Listar functions relacionadas con conversaciones/mensajes
SELECT 
    p.oid,
    p.proname AS function_name,
    pg_catalog.pg_get_function_arguments(p.oid) AS arguments
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND (
    p.proname ILIKE '%conversation%'
    OR p.proname ILIKE '%message%'
    OR p.proname ILIKE '%thread%'
    OR p.proname ILIKE '%participant%'
  )
ORDER BY p.proname;

-- ============================================================================
-- PROMPT B: Buscar en Edge Functions/Server code (preparación para grep)
-- ============================================================================

-- NOTA: Este paso se ejecuta en el código, no en SQL
-- Ver archivo: scripts/grep-user-profiles-user-id.ps1

-- Patrones a buscar en código:
-- 1. "rpc("
-- 2. "supabase.rpc("
-- 3. "user_profiles.user_id"
-- 4. ".eq('user_id'"
-- 5. "->>''user_id''"
-- 6. '"user_id"'

-- ============================================================================
-- PROMPT C: Preparación para instrumentar logs (identificar puntos críticos)
-- ============================================================================

-- Identificar todas las operations que involucran conversaciones
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    cmd,
    qual
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('conversations', 'Conversation', 'messages', 'Message', 'community_messages')
ORDER BY tablename, cmd, policyname;

-- Identificar triggers que se ejecutan en DELETE de conversaciones
SELECT 
    tgname AS trigger_name,
    tgrelid::regclass AS table_name,
    tgenabled AS is_enabled,
    pg_get_triggerdef(oid) AS trigger_definition
FROM pg_trigger
WHERE tgrelid::regclass::text IN ('conversations', 'Conversation')
  AND tgtype & 8 = 8  -- DELETE triggers
ORDER BY tgrelid::regclass, tgname;

-- ============================================================================
-- PROMPT D: Capturar query exacta (preparación para logs de Supabase)
-- ============================================================================

-- NOTA: Este paso se ejecuta en Supabase Dashboard > Logs
-- Filtros recomendados:
-- - Level: Error
-- - Code: 42703
-- - Path: CONTAINS '/api/messages/threads'
-- - Timestamp: últimos 24h

-- Query para verificar si hay errores recientes en logs (si disponible)
-- Esta query solo funciona si tienes acceso a pg_stat_statements
/*
SELECT 
    query,
    calls,
    total_exec_time,
    mean_exec_time,
    rows
FROM pg_stat_statements
WHERE query ILIKE '%user_profiles%'
  AND query ILIKE '%user_id%'
ORDER BY calls DESC
LIMIT 20;
*/

-- ============================================================================
-- PROMPT E: Plantilla de FIX mínimo (SOLO EJECUTAR SI SE ENCUENTRA LA FUNCIÓN)
-- ============================================================================

-- PASO E1: BACKUP de la función (EJECUTAR PRIMERO)
-- Template:
/*
-- BACKUP de función antes de modificar
-- Fecha: 2025-01-13
-- Función: <NOMBRE_FUNCION>

SELECT pg_get_functiondef('<SCHEMA>.<NOMBRE_FUNCION>(<ARG_TYPES>)'::regprocedure);

-- Guardar el resultado en un archivo antes de continuar
*/

-- PASO E2: FIX (SOLO si se confirma que la función usa user_profiles.user_id)
-- Template:
/*
CREATE OR REPLACE FUNCTION public.<NOMBRE_FUNCION>(<ARG_LIST>)
RETURNS <RETURN_TYPE> 
LANGUAGE plpgsql 
AS $$
BEGIN
  -- Cuerpo de la función con user_profiles.user_id reemplazado por user_profiles.id
  -- IMPORTANTE: Revisar cada línea cuidadosamente
END;
$$;
*/

-- PASO E3: VERIFICACIÓN post-fix
-- Template:
/*
-- Verificar que ya no existe la referencia incorrecta
SELECT 
    pg_get_functiondef('<SCHEMA>.<NOMBRE_FUNCION>(<ARG_TYPES>)'::regprocedure) ILIKE '%user_profiles.user_id%' AS still_has_error;

-- Debe devolver: false
*/

-- ============================================================================
-- QUERIES ADICIONALES DE DIAGNÓSTICO
-- ============================================================================

-- Verificar schema de user_profiles
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'user_profiles'
ORDER BY ordinal_position;

-- Verificar todas las referencias a user_profiles en constraints
SELECT
    tc.constraint_name,
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
  AND (tc.table_name = 'user_profiles' OR ccu.table_name = 'user_profiles')
  AND tc.table_schema = 'public'
ORDER BY tc.table_name;

-- Buscar en materialized views
SELECT 
    schemaname,
    matviewname,
    definition
FROM pg_matviews
WHERE schemaname = 'public'
  AND (
    definition ILIKE '%user_profiles%'
    OR definition ILIKE '%user_id%'
  );

-- Buscar en views regulares
SELECT 
    schemaname,
    viewname,
    definition
FROM pg_views
WHERE schemaname = 'public'
  AND (
    definition ILIKE '%user_profiles%'
    OR definition ILIKE '%user_id%'
  );

-- ============================================================================
-- INSTRUCCIONES DE USO
-- ============================================================================

/*
ORDEN DE EJECUCIÓN:

1. PROMPT A - Ejecutar en Supabase SQL Editor:
   - Ejecutar PASO A1 para listar todas las functions
   - Ejecutar PASO A2 para identificar candidatas
   - Para cada OID sospechoso, ejecutar: SELECT pg_get_functiondef(<OID>);
   - Documentar resultados en tabla

2. PROMPT B - Ejecutar en terminal local:
   - Ejecutar script: scripts/grep-user-profiles-user-id.ps1
   - Documentar coincidencias encontradas

3. PROMPT C - Modificar código (NO ROMPE NADA):
   - Agregar logs en src/app/api/messages/threads/[id]/delete/route.ts
   - Agregar logs en cliente (MessagesContext / page.tsx)
   - Crear PR solo con logs

4. PROMPT D - Revisar Supabase Dashboard:
   - Ir a Supabase > Logs
   - Filtrar por error 42703
   - Capturar SQL exacto y call stack
   - Documentar en archivo

5. PROMPT E - SOLO SI SE ENCUENTRA LA FUNCIÓN:
   - Ejecutar PASO E1 (BACKUP)
   - Ejecutar PASO E2 (FIX)
   - Ejecutar PASO E3 (VERIFICACIÓN)
   - Probar eliminación de conversación

IMPORTANTE:
- NO ejecutar PROMPT E sin confirmar la función exacta
- Siempre hacer BACKUP antes de modificar
- Documentar cada paso en archivos markdown
*/
