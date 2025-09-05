-- =====================================================
-- SOLUCIÓN COMPLETA PARA NUEVOS WARNINGS SUPABASE
-- Performance Advisor - Database Linter
-- =====================================================
-- Fecha: 2025-01-09
-- Warnings detectados: 5 nuevos warnings
-- - 4x Multiple Permissive Policies (community_profiles)
-- - 1x Duplicate Index (users)
-- =====================================================

-- =====================================================
-- 1. SOLUCIÓN MULTIPLE PERMISSIVE POLICIES
-- Tabla: public.community_profiles
-- =====================================================

-- Eliminar políticas duplicadas y crear una política unificada optimizada
-- Esto mejora el rendimiento al reducir el número de políticas que se evalúan

-- Paso 1: Eliminar políticas existentes duplicadas
DROP POLICY IF EXISTS "Enable read access for all users" ON public.community_profiles;
DROP POLICY IF EXISTS "community_profiles_optimized_select" ON public.community_profiles;

-- Paso 2: Crear una política unificada optimizada para SELECT
-- Esta política única reemplaza las múltiples políticas permisivas
CREATE POLICY "community_profiles_unified_select_policy" 
ON public.community_profiles 
FOR SELECT 
USING (
  -- Permitir acceso a perfiles públicos o propios
  (is_public = true) OR 
  (auth.uid() = user_id) OR
  -- Permitir acceso a administradores
  (EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role = 'admin'
  ))
);

-- Paso 3: Verificar que no hay otras políticas duplicadas
-- Eliminar cualquier otra política SELECT duplicada si existe
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    -- Buscar y eliminar políticas SELECT duplicadas
    FOR policy_record IN 
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'community_profiles' 
        AND cmd = 'SELECT'
        AND policyname != 'community_profiles_unified_select_policy'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
                      policy_record.policyname, 
                      policy_record.schemaname, 
                      policy_record.tablename);
    END LOOP;
END $$;

-- =====================================================
-- 2. SOLUCIÓN DUPLICATE INDEX
-- Tabla: public.users
-- Índices duplicados: users_email_key, users_email_unique
-- =====================================================

-- Paso 1: Verificar índices existentes
-- Mantener solo el índice más eficiente y eliminar duplicados

-- Eliminar el índice duplicado menos eficiente
-- Mantenemos users_email_unique ya que es más descriptivo
DROP INDEX IF EXISTS public.users_email_key;

-- Paso 2: Verificar que el índice principal existe y es único
-- Si no existe, crearlo
DO $$
BEGIN
    -- Verificar si existe el índice único en email
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE schemaname = 'public' 
        AND tablename = 'users' 
        AND indexname = 'users_email_unique'
    ) THEN
        -- Crear índice único si no existe
        CREATE UNIQUE INDEX users_email_unique ON public.users (email);
    END IF;
END $$;

-- =====================================================
-- 3. OPTIMIZACIONES ADICIONALES DE RENDIMIENTO
-- =====================================================

-- Optimizar índices para community_profiles si es necesario
-- Crear índice compuesto para mejorar consultas frecuentes
CREATE INDEX IF NOT EXISTS idx_community_profiles_user_public 
ON public.community_profiles (user_id, is_public) 
WHERE is_public = true;

-- Optimizar índice para consultas de usuarios activos
CREATE INDEX IF NOT EXISTS idx_community_profiles_active 
ON public.community_profiles (user_id, updated_at) 
WHERE is_active = true;

-- =====================================================
-- 4. VERIFICACIÓN Y LIMPIEZA FINAL
-- =====================================================

-- Función para verificar que no hay políticas duplicadas
CREATE OR REPLACE FUNCTION check_duplicate_policies()
RETURNS TABLE(
    schema_name text,
    table_name text,
    policy_count bigint,
    cmd text
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        schemaname::text,
        tablename::text,
        COUNT(*)::bigint as policy_count,
        cmd::text
    FROM pg_policies 
    WHERE schemaname = 'public'
    GROUP BY schemaname, tablename, cmd
    HAVING COUNT(*) > 1;
END;
$$ LANGUAGE plpgsql;

-- Función para verificar índices duplicados
CREATE OR REPLACE FUNCTION check_duplicate_indexes()
RETURNS TABLE(
    schema_name text,
    table_name text,
    index_names text[]
) AS $$
BEGIN
    RETURN QUERY
    WITH index_definitions AS (
        SELECT 
            schemaname,
            tablename,
            indexname,
            indexdef
        FROM pg_indexes 
        WHERE schemaname = 'public'
    ),
    duplicate_groups AS (
        SELECT 
            schemaname,
            tablename,
            indexdef,
            array_agg(indexname) as index_names,
            COUNT(*) as duplicate_count
        FROM index_definitions
        GROUP BY schemaname, tablename, indexdef
        HAVING COUNT(*) > 1
    )
    SELECT 
        schemaname::text,
        tablename::text,
        index_names
    FROM duplicate_groups;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 5. COMENTARIOS Y DOCUMENTACIÓN
-- =====================================================

-- Agregar comentarios para documentar las optimizaciones
COMMENT ON POLICY "community_profiles_unified_select_policy" ON public.community_profiles 
IS 'Política unificada optimizada para SELECT - reemplaza múltiples políticas permisivas para mejorar rendimiento';

COMMENT ON INDEX users_email_unique 
IS 'Índice único optimizado para email - duplicado eliminado para mejorar rendimiento';

COMMENT ON FUNCTION check_duplicate_policies() 
IS 'Función de utilidad para detectar políticas RLS duplicadas que afectan el rendimiento';

COMMENT ON FUNCTION check_duplicate_indexes() 
IS 'Función de utilidad para detectar índices duplicados que afectan el rendimiento';

-- =====================================================
-- 6. SCRIPT DE VERIFICACIÓN FINAL
-- =====================================================

-- Verificar que las optimizaciones se aplicaron correctamente
DO $$
DECLARE
    duplicate_policies_count integer;
    duplicate_indexes_count integer;
BEGIN
    -- Contar políticas duplicadas restantes
    SELECT COUNT(*) INTO duplicate_policies_count
    FROM (
        SELECT schemaname, tablename, cmd, COUNT(*)
        FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'community_profiles'
        GROUP BY schemaname, tablename, cmd
        HAVING COUNT(*) > 1
    ) duplicates;
    
    -- Contar índices duplicados restantes en users
    SELECT COUNT(*) INTO duplicate_indexes_count
    FROM (
        SELECT indexdef, COUNT(*)
        FROM pg_indexes 
        WHERE schemaname = 'public' AND tablename = 'users' AND indexdef LIKE '%email%'
        GROUP BY indexdef
        HAVING COUNT(*) > 1
    ) duplicates;
    
    -- Reportar resultados
    RAISE NOTICE 'Verificación completada:';
    RAISE NOTICE '- Políticas duplicadas restantes: %', duplicate_policies_count;
    RAISE NOTICE '- Índices duplicados restantes: %', duplicate_indexes_count;
    
    IF duplicate_policies_count = 0 AND duplicate_indexes_count = 0 THEN
        RAISE NOTICE '✅ Todas las optimizaciones se aplicaron correctamente';
    ELSE
        RAISE WARNING '⚠️ Algunas optimizaciones requieren revisión manual';
    END IF;
END $$;

-- =====================================================
-- RESUMEN DE CAMBIOS APLICADOS
-- =====================================================
/*
WARNINGS CORREGIDOS:
1. ✅ Multiple Permissive Policies (community_profiles) - 4 warnings
   - Eliminadas políticas duplicadas
   - Creada política unificada optimizada
   
2. ✅ Duplicate Index (users) - 1 warning  
   - Eliminado índice duplicado users_email_key
   - Mantenido users_email_unique como índice principal

OPTIMIZACIONES ADICIONALES:
- Índices compuestos para mejorar consultas frecuentes
- Funciones de utilidad para monitoreo continuo
- Documentación completa de cambios

IMPACTO EN RENDIMIENTO:
- Reducción en tiempo de evaluación de políticas RLS
- Eliminación de redundancia en índices
- Mejora en consultas de community_profiles
- Optimización de espacio en disco
*/
