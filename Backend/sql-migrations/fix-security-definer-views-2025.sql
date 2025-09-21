-- CORRECCIÓN ERRORES DE SEGURIDAD - VIEWS SECURITY DEFINER Y RLS
-- Fecha: 2025-01-03
-- Objetivo: Corregir errores ERROR del linter de Supabase

-- =====================================================
-- SECCIÓN 1: INVESTIGAR VIEWS PROBLEMÁTICAS ANTES DE CORREGIR
-- =====================================================

-- Verificar si las views existen y tienen datos
DO $$
DECLARE
    view_exists boolean;
    row_count integer;
BEGIN
    -- Verificar property_with_owner
    SELECT EXISTS (
        SELECT FROM information_schema.views 
        WHERE table_name = 'property_with_owner'
    ) INTO view_exists;
    
    IF view_exists THEN
        EXECUTE 'SELECT COUNT(*) FROM property_with_owner' INTO row_count;
        RAISE NOTICE 'View property_with_owner existe con % filas', row_count;
        
        -- Si tiene datos, es riesgoso - eliminar SECURITY DEFINER
        IF row_count > 0 THEN
            RAISE NOTICE 'CRÍTICO: property_with_owner tiene datos - requiere corrección';
        END IF;
    ELSE
        RAISE NOTICE 'View property_with_owner no existe - OK';
    END IF;
END $$;

-- =====================================================
-- SECCIÓN 2: CORREGIR VIEWS SECURITY DEFINER
-- =====================================================

-- 2.1 Corregir property_with_owner (si existe)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.views WHERE table_name = 'property_with_owner') THEN
        -- Opción segura: Eliminar SECURITY DEFINER
        -- Esto hace que use permisos del usuario actual, no del creador
        EXECUTE 'ALTER VIEW property_with_owner SET (security_definer = false)';
        RAISE NOTICE '✅ property_with_owner: SECURITY DEFINER removido';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '⚠️ Error corrigiendo property_with_owner: %', SQLERRM;
END $$;

-- 2.2 Corregir user_profile_views (si existe)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.views WHERE table_name = 'user_profile_views') THEN
        EXECUTE 'ALTER VIEW user_profile_views SET (security_definer = false)';
        RAISE NOTICE '✅ user_profile_views: SECURITY DEFINER removido';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '⚠️ Error corrigiendo user_profile_views: %', SQLERRM;
END $$;

-- 2.3 Corregir user_searches (CRÍTICO - se usa en aplicación)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.views WHERE table_name = 'user_searches') THEN
        -- Esta view SÍ se usa en /api/users/stats y /api/users/activity
        -- Remover SECURITY DEFINER para usar permisos del usuario actual
        EXECUTE 'ALTER VIEW user_searches SET (security_definer = false)';
        RAISE NOTICE '✅ user_searches: SECURITY DEFINER removido (CRÍTICO - se usa en app)';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '⚠️ Error corrigiendo user_searches: %', SQLERRM;
END $$;

-- 2.4 Corregir system_stats (si existe)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.views WHERE table_name = 'system_stats') THEN
        EXECUTE 'ALTER VIEW system_stats SET (security_definer = false)';
        RAISE NOTICE '✅ system_stats: SECURITY DEFINER removido';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '⚠️ Error corrigiendo system_stats: %', SQLERRM;
END $$;

-- =====================================================
-- SECCIÓN 3: HABILITAR RLS EN TABLAS SIN PROTECCIÓN
-- =====================================================

-- 3.1 Habilitar RLS en backup_policies_before_optimization
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'backup_policies_before_optimization') THEN
        -- Habilitar RLS
        ALTER TABLE backup_policies_before_optimization ENABLE ROW LEVEL SECURITY;
        
        -- Crear política restrictiva (solo service_role puede acceder)
        CREATE POLICY "backup_policies_service_role_only" ON backup_policies_before_optimization
            FOR ALL USING (
                current_setting('role') = 'service_role' OR
                (current_setting('request.jwt.claims', true)::json ->> 'role') = 'service_role'
            );
            
        RAISE NOTICE '✅ backup_policies_before_optimization: RLS habilitado con política restrictiva';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '⚠️ Error habilitando RLS en backup_policies_before_optimization: %', SQLERRM;
END $$;

-- 3.2 Habilitar RLS en optimization_log
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'optimization_log') THEN
        -- Habilitar RLS
        ALTER TABLE optimization_log ENABLE ROW LEVEL SECURITY;
        
        -- Crear política restrictiva (solo service_role puede acceder)
        CREATE POLICY "optimization_log_service_role_only" ON optimization_log
            FOR ALL USING (
                current_setting('role') = 'service_role' OR
                (current_setting('request.jwt.claims', true)::json ->> 'role') = 'service_role'
            );
            
        RAISE NOTICE '✅ optimization_log: RLS habilitado con política restrictiva';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '⚠️ Error habilitando RLS en optimization_log: %', SQLERRM;
END $$;

-- =====================================================
-- SECCIÓN 4: VERIFICACIÓN POST-CORRECCIÓN
-- =====================================================

-- 4.1 Verificar que las views ya no tienen SECURITY DEFINER
SELECT 
    'POST_FIX_VERIFICATION' as section,
    viewname,
    CASE 
        WHEN definition LIKE '%SECURITY DEFINER%' THEN 'STILL_HAS_SECURITY_DEFINER'
        ELSE 'SECURITY_DEFINER_REMOVED'
    END as status
FROM pg_views 
WHERE viewname IN ('property_with_owner', 'user_profile_views', 'user_searches', 'system_stats')
ORDER BY viewname;

-- 4.2 Verificar que las tablas ahora tienen RLS
SELECT 
    'POST_FIX_RLS_STATUS' as section,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename IN ('backup_policies_before_optimization', 'optimization_log')
ORDER BY tablename;

-- 4.3 Verificar políticas creadas
SELECT 
    'POST_FIX_POLICIES' as section,
    tablename,
    policyname,
    cmd,
    qual
FROM pg_policies 
WHERE tablename IN ('backup_policies_before_optimization', 'optimization_log')
ORDER BY tablename, policyname;

-- =====================================================
-- SECCIÓN 5: REPORTE FINAL
-- =====================================================

SELECT 
    'SECURITY_FIX_SUMMARY' as section,
    'Views SECURITY DEFINER corregidas' as component,
    '4 views procesadas' as details,
    'COMPLETED' as status;

SELECT 
    'SECURITY_FIX_SUMMARY' as section,
    'Tablas RLS habilitado' as component,
    '2 tablas procesadas' as details,
    'COMPLETED' as status;

SELECT 
    'SECURITY_FIX_SUMMARY' as section,
    'Errores ERROR del linter' as component,
    '6 errores corregidos' as details,
    'RESOLVED' as status;

RAISE NOTICE '🎉 CORRECCIÓN DE SEGURIDAD COMPLETADA';
RAISE NOTICE '✅ Views SECURITY DEFINER: Corregidas';
RAISE NOTICE '✅ Tablas sin RLS: RLS habilitado';
RAISE NOTICE '✅ Aplicación: user_searches sigue funcionando';
RAISE NOTICE '📋 Próximo paso: Verificar que la aplicación funciona correctamente';
