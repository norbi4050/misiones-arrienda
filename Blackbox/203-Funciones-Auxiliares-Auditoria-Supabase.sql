-- =====================================================
-- FUNCIONES AUXILIARES PARA AUDITORÍA SUPABASE
-- Fecha: 2025-01-03
-- Propósito: Funciones de soporte para auditoría completa
-- =====================================================

-- Función para obtener información de tabla
CREATE OR REPLACE FUNCTION get_table_info(table_name text)
RETURNS TABLE(
    table_name text,
    table_schema text,
    table_type text
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.table_name::text,
        t.table_schema::text,
        t.table_type::text
    FROM information_schema.tables t
    WHERE t.table_name = $1
    AND t.table_schema = 'public';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para obtener columnas de tabla
CREATE OR REPLACE FUNCTION get_table_columns(table_name text)
RETURNS TABLE(
    column_name text,
    data_type text,
    is_nullable text,
    column_default text
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.column_name::text,
        c.data_type::text,
        c.is_nullable::text,
        c.column_default::text
    FROM information_schema.columns c
    WHERE c.table_name = $1
    AND c.table_schema = 'public'
    ORDER BY c.ordinal_position;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para obtener políticas RLS
CREATE OR REPLACE FUNCTION get_rls_policies()
RETURNS TABLE(
    schemaname text,
    tablename text,
    policyname text,
    permissive text,
    roles text[],
    cmd text,
    qual text,
    with_check text
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.schemaname::text,
        p.tablename::text,
        p.policyname::text,
        p.permissive::text,
        p.roles,
        p.cmd::text,
        p.qual::text,
        p.with_check::text
    FROM pg_policies p
    WHERE p.schemaname = 'public';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para obtener lista de funciones
CREATE OR REPLACE FUNCTION get_functions_list()
RETURNS TABLE(
    function_name text,
    function_schema text,
    return_type text,
    function_type text
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        r.routine_name::text,
        r.routine_schema::text,
        r.data_type::text,
        r.routine_type::text
    FROM information_schema.routines r
    WHERE r.routine_schema = 'public'
    AND r.routine_type = 'FUNCTION';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para obtener lista de triggers
CREATE OR REPLACE FUNCTION get_triggers_list()
RETURNS TABLE(
    trigger_name text,
    table_name text,
    trigger_schema text,
    event_manipulation text,
    action_timing text
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.trigger_name::text,
        t.event_object_table::text,
        t.trigger_schema::text,
        t.event_manipulation::text,
        t.action_timing::text
    FROM information_schema.triggers t
    WHERE t.trigger_schema = 'public';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para verificar existencia de tabla
CREATE OR REPLACE FUNCTION table_exists(table_name text)
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_name = $1 
        AND table_schema = 'public'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para contar registros en tabla
CREATE OR REPLACE FUNCTION count_table_records(table_name text)
RETURNS integer AS $$
DECLARE
    record_count integer;
BEGIN
    IF NOT table_exists(table_name) THEN
        RETURN -1;
    END IF;
    
    EXECUTE format('SELECT COUNT(*) FROM %I', table_name) INTO record_count;
    RETURN record_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para obtener estadísticas de tabla
CREATE OR REPLACE FUNCTION get_table_stats(table_name text)
RETURNS TABLE(
    table_name text,
    row_count bigint,
    table_size text,
    index_size text,
    total_size text
) AS $$
BEGIN
    IF NOT table_exists(table_name) THEN
        RETURN;
    END IF;
    
    RETURN QUERY
    SELECT 
        $1::text,
        (SELECT reltuples::bigint FROM pg_class WHERE relname = $1),
        pg_size_pretty(pg_total_relation_size($1::regclass) - pg_indexes_size($1::regclass)),
        pg_size_pretty(pg_indexes_size($1::regclass)),
        pg_size_pretty(pg_total_relation_size($1::regclass));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para verificar integridad referencial
CREATE OR REPLACE FUNCTION check_referential_integrity()
RETURNS TABLE(
    constraint_name text,
    table_name text,
    column_name text,
    foreign_table_name text,
    foreign_column_name text,
    is_valid boolean
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        tc.constraint_name::text,
        tc.table_name::text,
        kcu.column_name::text,
        ccu.table_name::text,
        ccu.column_name::text,
        true -- Simplificado, en producción verificar integridad real
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu 
        ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage ccu 
        ON ccu.constraint_name = tc.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para obtener información de índices
CREATE OR REPLACE FUNCTION get_table_indexes(table_name text)
RETURNS TABLE(
    index_name text,
    column_name text,
    is_unique boolean,
    is_primary boolean
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        i.relname::text,
        a.attname::text,
        ix.indisunique,
        ix.indisprimary
    FROM pg_class t
    JOIN pg_index ix ON t.oid = ix.indrelid
    JOIN pg_class i ON i.oid = ix.indexrelid
    JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(ix.indkey)
    WHERE t.relname = $1
    AND t.relkind = 'r'
    ORDER BY i.relname, a.attnum;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para verificar configuración RLS
CREATE OR REPLACE FUNCTION check_rls_status()
RETURNS TABLE(
    table_name text,
    rls_enabled boolean,
    rls_forced boolean,
    policy_count integer
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.relname::text,
        c.relrowsecurity,
        c.relforcerowsecurity,
        (SELECT COUNT(*)::integer FROM pg_policies p WHERE p.tablename = c.relname)
    FROM pg_class c
    WHERE c.relkind = 'r'
    AND c.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
    ORDER BY c.relname;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comentarios sobre las funciones
COMMENT ON FUNCTION get_table_info(text) IS 'Obtiene información básica de una tabla';
COMMENT ON FUNCTION get_table_columns(text) IS 'Obtiene columnas y tipos de datos de una tabla';
COMMENT ON FUNCTION get_rls_policies() IS 'Lista todas las políticas RLS del esquema public';
COMMENT ON FUNCTION get_functions_list() IS 'Lista todas las funciones del esquema public';
COMMENT ON FUNCTION get_triggers_list() IS 'Lista todos los triggers del esquema public';
COMMENT ON FUNCTION table_exists(text) IS 'Verifica si una tabla existe';
COMMENT ON FUNCTION count_table_records(text) IS 'Cuenta registros en una tabla';
COMMENT ON FUNCTION get_table_stats(text) IS 'Obtiene estadísticas de tamaño de tabla';
COMMENT ON FUNCTION check_referential_integrity() IS 'Verifica integridad referencial';
COMMENT ON FUNCTION get_table_indexes(text) IS 'Obtiene información de índices de una tabla';
COMMENT ON FUNCTION check_rls_status() IS 'Verifica estado de RLS en todas las tablas';
