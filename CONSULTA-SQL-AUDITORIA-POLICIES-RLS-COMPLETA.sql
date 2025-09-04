-- ============================================================================
-- 🔍 AUDITORÍA COMPLETA DE POLÍTICAS RLS EN SUPABASE
-- ============================================================================
-- Ejecutar este script completo en Supabase Dashboard > SQL Editor
-- Fecha: 04 de Enero de 2025
-- Propósito: Obtener información detallada sobre políticas RLS para diagnóstico
-- ============================================================================

-- 📋 SECCIÓN 1: INFORMACIÓN GENERAL DE TABLAS Y RLS
-- ============================================================================
SELECT 
    '=== INFORMACIÓN GENERAL DE TABLAS Y RLS ===' as seccion,
    null as tabla,
    null as rls_habilitado,
    null as politicas_count,
    null as detalles;

SELECT 
    'TABLA_INFO' as seccion,
    schemaname || '.' || tablename as tabla,
    CASE WHEN rowsecurity THEN 'SÍ' ELSE 'NO' END as rls_habilitado,
    (SELECT COUNT(*) FROM pg_policies WHERE schemaname = t.schemaname AND tablename = t.tablename) as politicas_count,
    'Tabla: ' || tablename || ' | Schema: ' || schemaname as detalles
FROM pg_tables t
WHERE schemaname = 'public' 
    AND tablename IN ('users', 'profiles', 'properties', 'community_profiles')
ORDER BY tablename;

-- 📋 SECCIÓN 2: POLÍTICAS EXISTENTES DETALLADAS
-- ============================================================================
SELECT 
    '=== POLÍTICAS EXISTENTES DETALLADAS ===' as seccion,
    null as tabla,
    null as nombre_politica,
    null as comando,
    null as rol,
    null as expresion_using,
    null as expresion_check;

SELECT 
    'POLITICA_DETALLE' as seccion,
    schemaname || '.' || tablename as tabla,
    policyname as nombre_politica,
    cmd as comando,
    COALESCE(roles::text, 'public') as rol,
    COALESCE(qual, 'Sin restricción USING') as expresion_using,
    COALESCE(with_check, 'Sin restricción CHECK') as expresion_check
FROM pg_policies 
WHERE schemaname = 'public' 
    AND tablename IN ('users', 'profiles', 'properties', 'community_profiles')
ORDER BY tablename, policyname;

-- 📋 SECCIÓN 3: ANÁLISIS DE PERMISOS POR TABLA
-- ============================================================================
SELECT 
    '=== ANÁLISIS DE PERMISOS POR TABLA ===' as seccion,
    null as tabla,
    null as privilegio,
    null as otorgado_a,
    null as otorgado_por,
    null as con_grant_option;

SELECT 
    'PERMISOS_TABLA' as seccion,
    schemaname || '.' || tablename as tabla,
    privilege_type as privilegio,
    grantee as otorgado_a,
    grantor as otorgado_por,
    CASE WHEN is_grantable = 'YES' THEN 'SÍ' ELSE 'NO' END as con_grant_option
FROM information_schema.table_privileges 
WHERE table_schema = 'public' 
    AND table_name IN ('users', 'profiles', 'properties', 'community_profiles')
ORDER BY table_name, privilege_type;

-- 📋 SECCIÓN 4: ESTRUCTURA DE COLUMNAS CRÍTICAS
-- ============================================================================
SELECT 
    '=== ESTRUCTURA DE COLUMNAS CRÍTICAS ===' as seccion,
    null as tabla,
    null as columna,
    null as tipo_dato,
    null as es_nullable,
    null as valor_default;

SELECT 
    'COLUMNA_INFO' as seccion,
    table_name as tabla,
    column_name as columna,
    data_type as tipo_dato,
    is_nullable as es_nullable,
    COALESCE(column_default, 'Sin default') as valor_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name IN ('users', 'profiles', 'properties', 'community_profiles')
    AND column_name IN ('id', 'user_id', 'email', 'created_at', 'updated_at', 'auth_id')
ORDER BY table_name, ordinal_position;

-- 📋 SECCIÓN 5: FUNCIONES DE SEGURIDAD RELACIONADAS
-- ============================================================================
SELECT 
    '=== FUNCIONES DE SEGURIDAD RELACIONADAS ===' as seccion,
    null as nombre_funcion,
    null as esquema,
    null as tipo_retorno,
    null as definicion_parcial;

SELECT 
    'FUNCION_SEGURIDAD' as seccion,
    routine_name as nombre_funcion,
    routine_schema as esquema,
    data_type as tipo_retorno,
    LEFT(routine_definition, 100) || '...' as definicion_parcial
FROM information_schema.routines 
WHERE routine_schema = 'public' 
    AND (routine_name LIKE '%auth%' 
         OR routine_name LIKE '%user%' 
         OR routine_name LIKE '%security%'
         OR routine_name LIKE '%rls%')
ORDER BY routine_name;

-- 📋 SECCIÓN 6: TRIGGERS RELACIONADOS CON AUTENTICACIÓN
-- ============================================================================
SELECT 
    '=== TRIGGERS RELACIONADOS CON AUTENTICACIÓN ===' as seccion,
    null as tabla,
    null as nombre_trigger,
    null as evento,
    null as momento,
    null as funcion_trigger;

SELECT 
    'TRIGGER_INFO' as seccion,
    event_object_table as tabla,
    trigger_name as nombre_trigger,
    event_manipulation as evento,
    action_timing as momento,
    action_statement as funcion_trigger
FROM information_schema.triggers 
WHERE event_object_schema = 'public' 
    AND event_object_table IN ('users', 'profiles', 'properties', 'community_profiles')
ORDER BY event_object_table, trigger_name;

-- 📋 SECCIÓN 7: ROLES Y PERMISOS DEL SISTEMA
-- ============================================================================
SELECT 
    '=== ROLES Y PERMISOS DEL SISTEMA ===' as seccion,
    null as nombre_rol,
    null as puede_login,
    null as es_superuser,
    null as puede_crear_db,
    null as puede_crear_rol;

SELECT 
    'ROL_INFO' as seccion,
    rolname as nombre_rol,
    CASE WHEN rolcanlogin THEN 'SÍ' ELSE 'NO' END as puede_login,
    CASE WHEN rolsuper THEN 'SÍ' ELSE 'NO' END as es_superuser,
    CASE WHEN rolcreatedb THEN 'SÍ' ELSE 'NO' END as puede_crear_db,
    CASE WHEN rolcreaterole THEN 'SÍ' ELSE 'NO' END as puede_crear_rol
FROM pg_roles 
WHERE rolname IN ('postgres', 'authenticated', 'anon', 'service_role', 'supabase_auth_admin')
ORDER BY rolname;

-- 📋 SECCIÓN 8: CONFIGURACIÓN DE AUTENTICACIÓN SUPABASE
-- ============================================================================
SELECT 
    '=== CONFIGURACIÓN DE AUTENTICACIÓN SUPABASE ===' as seccion,
    null as esquema,
    null as tabla,
    null as existe,
    null as comentario;

-- Verificar existencia de tablas de auth
SELECT 
    'AUTH_TABLA' as seccion,
    'auth' as esquema,
    'users' as tabla,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') 
         THEN 'SÍ' ELSE 'NO' END as existe,
    'Tabla principal de usuarios de Supabase Auth' as comentario
UNION ALL
SELECT 
    'AUTH_TABLA' as seccion,
    'auth' as esquema,
    'identities' as tabla,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'identities') 
         THEN 'SÍ' ELSE 'NO' END as existe,
    'Tabla de identidades de autenticación' as comentario;

-- 📋 SECCIÓN 9: POLÍTICAS ESPECÍFICAS PARA REGISTRO DE USUARIOS
-- ============================================================================
SELECT 
    '=== POLÍTICAS ESPECÍFICAS PARA REGISTRO ===' as seccion,
    null as tabla,
    null as operacion,
    null as politica_existe,
    null as descripcion;

-- Verificar políticas específicas para INSERT en users
SELECT 
    'POLITICA_REGISTRO' as seccion,
    'users' as tabla,
    'INSERT' as operacion,
    CASE WHEN EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
            AND tablename = 'users' 
            AND cmd = 'INSERT'
    ) THEN 'SÍ' ELSE 'NO' END as politica_existe,
    'Política para permitir registro de nuevos usuarios' as descripcion
UNION ALL
SELECT 
    'POLITICA_REGISTRO' as seccion,
    'profiles' as tabla,
    'INSERT' as operacion,
    CASE WHEN EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
            AND tablename = 'profiles' 
            AND cmd = 'INSERT'
    ) THEN 'SÍ' ELSE 'NO' END as politica_existe,
    'Política para permitir creación de perfiles' as descripcion;

-- 📋 SECCIÓN 10: RESUMEN EJECUTIVO
-- ============================================================================
SELECT 
    '=== RESUMEN EJECUTIVO ===' as seccion,
    null as aspecto,
    null as estado,
    null as recomendacion;

SELECT 
    'RESUMEN' as seccion,
    'RLS Habilitado en Tablas Críticas' as aspecto,
    CASE 
        WHEN (SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public' 
              AND tablename IN ('users', 'profiles', 'properties', 'community_profiles') 
              AND rowsecurity = true) = 4 
        THEN 'CORRECTO' 
        ELSE 'REQUIERE ATENCIÓN' 
    END as estado,
    'Verificar que todas las tablas críticas tengan RLS habilitado' as recomendacion
UNION ALL
SELECT 
    'RESUMEN' as seccion,
    'Políticas de Registro Configuradas' as aspecto,
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'users' AND cmd = 'INSERT')
        THEN 'CONFIGURADO' 
        ELSE 'FALTANTE' 
    END as estado,
    'Configurar políticas para permitir registro de usuarios' as recomendacion;

-- ============================================================================
-- 🎯 FIN DE LA AUDITORÍA
-- ============================================================================
SELECT 
    '=== AUDITORÍA COMPLETADA ===' as mensaje,
    NOW() as timestamp_ejecucion,
    'Copiar todos los resultados y enviar para análisis' as siguiente_paso;
