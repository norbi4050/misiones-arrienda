-- INVESTIGACIÓN VIEWS SECURITY DEFINER - ERRORES DE SEGURIDAD
-- Fecha: 2025-01-03
-- Objetivo: Examinar views problemáticas identificadas por linter

-- =====================================================
-- SECCIÓN 1: EXAMINAR DEFINICIONES DE VIEWS
-- =====================================================

-- 1.1 Examinar view property_with_owner
SELECT 
  'PROPERTY_WITH_OWNER_VIEW' as investigation_section,
  schemaname,
  viewname,
  viewowner,
  definition
FROM pg_views 
WHERE viewname = 'property_with_owner';

-- 1.2 Examinar view user_profile_views  
SELECT 
  'USER_PROFILE_VIEWS_VIEW' as investigation_section,
  schemaname,
  viewname,
  viewowner,
  definition
FROM pg_views 
WHERE viewname = 'user_profile_views';

-- 1.3 Examinar view user_searches
SELECT 
  'USER_SEARCHES_VIEW' as investigation_section,
  schemaname,
  viewname,
  viewowner,
  definition
FROM pg_views 
WHERE viewname = 'user_searches';

-- 1.4 Examinar view system_stats
SELECT 
  'SYSTEM_STATS_VIEW' as investigation_section,
  schemaname,
  viewname,
  viewowner,
  definition
FROM pg_views 
WHERE viewname = 'system_stats';

-- =====================================================
-- SECCIÓN 2: VERIFICAR PERMISOS Y PROPIETARIOS
-- =====================================================

-- 2.1 Verificar propietarios de las views
SELECT 
  'VIEW_OWNERS' as investigation_section,
  viewname,
  viewowner,
  schemaname
FROM pg_views 
WHERE viewname IN (
  'property_with_owner',
  'user_profile_views',
  'user_searches', 
  'system_stats'
)
ORDER BY viewname;

-- 2.2 Verificar permisos otorgados en las views
SELECT 
  'VIEW_PERMISSIONS' as investigation_section,
  schemaname,
  tablename as viewname,
  grantor,
  grantee,
  privilege_type,
  is_grantable
FROM information_schema.table_privileges 
WHERE table_name IN (
  'property_with_owner',
  'user_profile_views',
  'user_searches',
  'system_stats'
)
ORDER BY table_name, privilege_type;

-- =====================================================
-- SECCIÓN 3: VERIFICAR USO EN APLICACIÓN
-- =====================================================

-- 3.1 Verificar si las views tienen datos
SELECT 
  'PROPERTY_WITH_OWNER_DATA' as investigation_section,
  COUNT(*) as total_rows
FROM property_with_owner;

SELECT 
  'USER_PROFILE_VIEWS_DATA' as investigation_section,
  COUNT(*) as total_rows
FROM user_profile_views;

SELECT 
  'USER_SEARCHES_DATA' as investigation_section,
  COUNT(*) as total_rows
FROM user_searches;

SELECT 
  'SYSTEM_STATS_DATA' as investigation_section,
  COUNT(*) as total_rows
FROM system_stats;

-- =====================================================
-- SECCIÓN 4: EXAMINAR TABLAS SIN RLS
-- =====================================================

-- 4.1 Verificar tabla backup_policies_before_optimization
SELECT 
  'BACKUP_POLICIES_TABLE' as investigation_section,
  COUNT(*) as total_rows,
  MIN(created_at) as oldest_record,
  MAX(created_at) as newest_record
FROM backup_policies_before_optimization;

-- 4.2 Verificar tabla optimization_log
SELECT 
  'OPTIMIZATION_LOG_TABLE' as investigation_section,
  COUNT(*) as total_rows,
  MIN(created_at) as oldest_record,
  MAX(created_at) as newest_record
FROM optimization_log;

-- 4.3 Examinar estructura de backup_policies_before_optimization
SELECT 
  'BACKUP_POLICIES_SCHEMA' as investigation_section,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'backup_policies_before_optimization'
ORDER BY ordinal_position;

-- 4.4 Examinar estructura de optimization_log
SELECT 
  'OPTIMIZATION_LOG_SCHEMA' as investigation_section,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'optimization_log'
ORDER BY ordinal_position;

-- =====================================================
-- SECCIÓN 5: VERIFICAR DEPENDENCIAS
-- =====================================================

-- 5.1 Verificar qué tablas usan las views problemáticas
SELECT 
  'VIEW_DEPENDENCIES' as investigation_section,
  view_schema,
  view_name,
  table_schema,
  table_name
FROM information_schema.view_table_usage 
WHERE view_name IN (
  'property_with_owner',
  'user_profile_views',
  'user_searches',
  'system_stats'
)
ORDER BY view_name, table_name;

-- =====================================================
-- SECCIÓN 6: RECOMENDACIONES BASADAS EN HALLAZGOS
-- =====================================================

-- 6.1 Resumen de riesgos por view
SELECT 
  'RISK_ASSESSMENT' as investigation_section,
  'property_with_owner' as view_name,
  CASE WHEN EXISTS(SELECT 1 FROM property_with_owner LIMIT 1) 
       THEN 'HAS_DATA' ELSE 'EMPTY' END as data_status,
  'HIGH_RISK' as risk_level,
  'Exposes property owner data' as risk_description;

SELECT 
  'RISK_ASSESSMENT' as investigation_section,
  'user_profile_views' as view_name,
  CASE WHEN EXISTS(SELECT 1 FROM user_profile_views LIMIT 1) 
       THEN 'HAS_DATA' ELSE 'EMPTY' END as data_status,
  'HIGH_RISK' as risk_level,
  'Exposes user profile access data' as risk_description;

SELECT 
  'RISK_ASSESSMENT' as investigation_section,
  'user_searches' as view_name,
  CASE WHEN EXISTS(SELECT 1 FROM user_searches LIMIT 1) 
       THEN 'HAS_DATA' ELSE 'EMPTY' END as data_status,
  'MEDIUM_RISK' as risk_level,
  'Exposes user search history' as risk_description;

SELECT 
  'RISK_ASSESSMENT' as investigation_section,
  'system_stats' as view_name,
  CASE WHEN EXISTS(SELECT 1 FROM system_stats LIMIT 1) 
       THEN 'HAS_DATA' ELSE 'EMPTY' END as data_status,
  'MEDIUM_RISK' as risk_level,
  'Exposes system metrics' as risk_description;
