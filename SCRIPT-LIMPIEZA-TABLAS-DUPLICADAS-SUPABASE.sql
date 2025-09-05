-- =====================================================
-- SCRIPT DE LIMPIEZA DE TABLAS DUPLICADAS EN SUPABASE
-- =====================================================
-- 
-- IMPORTANTE: Este script elimina tablas duplicadas identificadas
-- en la auditoría. EJECUTAR SOLO DESPUÉS DE:
-- 1. Crear backup completo de la base de datos
-- 2. Verificar datos únicos con SCRIPT-VERIFICACION-DATOS-UNICOS-SUPABASE.js
-- 3. Migrar cualquier dato único identificado
-- 4. Confirmar que el código usa solo tablas PascalCase (Prisma)
--
-- Fecha: 2025-01-06
-- Versión: 1.0
-- Estado: LISTO PARA EJECUCIÓN (después de verificaciones)

-- =====================================================
-- FASE 1: CREAR BACKUPS DE SEGURIDAD
-- =====================================================

-- Crear esquema de backup si no existe
CREATE SCHEMA IF NOT EXISTS backup_limpieza_2025;

-- Backup de tablas críticas antes de eliminar
DO $$
BEGIN
    -- Backup usuarios snake_case si tiene datos
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users' AND table_schema = 'public') THEN
        EXECUTE 'CREATE TABLE backup_limpieza_2025.users_backup AS SELECT * FROM public.users';
        RAISE NOTICE 'Backup creado: backup_limpieza_2025.users_backup';
    END IF;
    
    -- Backup propiedades snake_case si tiene datos
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'properties' AND table_schema = 'public') THEN
        EXECUTE 'CREATE TABLE backup_limpieza_2025.properties_backup AS SELECT * FROM public.properties';
        RAISE NOTICE 'Backup creado: backup_limpieza_2025.properties_backup';
    END IF;
    
    -- Backup agentes snake_case si tiene datos
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'agents' AND table_schema = 'public') THEN
        EXECUTE 'CREATE TABLE backup_limpieza_2025.agents_backup AS SELECT * FROM public.agents';
        RAISE NOTICE 'Backup creado: backup_limpieza_2025.agents_backup';
    END IF;
END $$;

-- =====================================================
-- FASE 2: VERIFICACIONES DE SEGURIDAD
-- =====================================================

-- Verificar que existen las tablas principales (PascalCase)
DO $$
BEGIN
    -- Verificar tabla User principal
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'User' AND table_schema = 'public') THEN
        RAISE EXCEPTION 'CRÍTICO: Tabla principal "User" no existe. Abortando limpieza.';
    END IF;
    
    -- Verificar tabla Property principal
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'Property' AND table_schema = 'public') THEN
        RAISE EXCEPTION 'CRÍTICO: Tabla principal "Property" no existe. Abortando limpieza.';
    END IF;
    
    -- Verificar tabla Agent principal
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'Agent' AND table_schema = 'public') THEN
        RAISE EXCEPTION 'CRÍTICO: Tabla principal "Agent" no existe. Abortando limpieza.';
    END IF;
    
    RAISE NOTICE 'Verificación exitosa: Todas las tablas principales existen';
END $$;

-- =====================================================
-- FASE 3: ELIMINAR TABLAS DUPLICADAS (SNAKE_CASE)
-- =====================================================

-- Eliminar en orden correcto para evitar errores de FK
RAISE NOTICE 'Iniciando eliminación de tablas duplicadas...';

-- 3.1 Eliminar tablas dependientes primero
DROP TABLE IF EXISTS public.user_reviews CASCADE;
DROP TABLE IF EXISTS public.user_inquiries CASCADE;
DROP TABLE IF EXISTS public.rental_history CASCADE;
DROP TABLE IF EXISTS public.search_history CASCADE;

-- 3.2 Eliminar tablas de pagos snake_case
DROP TABLE IF EXISTS public.payment_notifications CASCADE;
DROP TABLE IF EXISTS public.payment_methods CASCADE;
DROP TABLE IF EXISTS public.payment_analytics CASCADE;
DROP TABLE IF EXISTS public.payments CASCADE;
DROP TABLE IF EXISTS public.subscriptions CASCADE;

-- 3.3 Eliminar tablas de interacciones snake_case
DROP TABLE IF EXISTS public.inquiries CASCADE;
DROP TABLE IF EXISTS public.favorites CASCADE;
DROP TABLE IF EXISTS public.messages CASCADE;
DROP TABLE IF EXISTS public.conversations CASCADE;
DROP TABLE IF EXISTS public.likes CASCADE;
DROP TABLE IF EXISTS public.reports CASCADE;
DROP TABLE IF EXISTS public.rooms CASCADE;
DROP TABLE IF EXISTS public.user_profiles CASCADE;

-- 3.4 Eliminar tablas principales snake_case
DROP TABLE IF EXISTS public.properties CASCADE;
DROP TABLE IF EXISTS public.agents CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

RAISE NOTICE 'Tablas snake_case eliminadas exitosamente';

-- =====================================================
-- FASE 4: ELIMINAR TABLAS OBSOLETAS/REDUNDANTES
-- =====================================================

-- 4.1 Eliminar tablas de perfiles redundantes
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.community_profiles CASCADE;

-- 4.2 Eliminar vistas/tablas generadas obsoletas
DROP VIEW IF EXISTS public.analytics_dashboard CASCADE;
DROP VIEW IF EXISTS public.conversations_with_participants CASCADE;
DROP VIEW IF EXISTS public.properties_with_agent CASCADE;
DROP VIEW IF EXISTS public.property_stats CASCADE;
DROP VIEW IF EXISTS public.user_stats CASCADE;

-- 4.3 Eliminar tablas de estadísticas obsoletas si existen como tablas
DROP TABLE IF EXISTS public.analytics_dashboard CASCADE;
DROP TABLE IF EXISTS public.conversations_with_participants CASCADE;
DROP TABLE IF EXISTS public.properties_with_agent CASCADE;
DROP TABLE IF EXISTS public.property_stats CASCADE;
DROP TABLE IF EXISTS public.user_stats CASCADE;

RAISE NOTICE 'Tablas obsoletas eliminadas exitosamente';

-- =====================================================
-- FASE 5: LIMPIAR ÍNDICES HUÉRFANOS
-- =====================================================

-- Eliminar índices que puedan haber quedado huérfanos
DO $$
DECLARE
    idx_record RECORD;
BEGIN
    -- Buscar índices que referencien tablas eliminadas
    FOR idx_record IN 
        SELECT indexname, tablename 
        FROM pg_indexes 
        WHERE schemaname = 'public' 
        AND tablename IN (
            'users', 'properties', 'agents', 'favorites', 'conversations',
            'messages', 'likes', 'reports', 'rooms', 'user_profiles',
            'user_inquiries', 'user_reviews', 'search_history', 'rental_history',
            'subscriptions', 'payments', 'payment_methods', 'payment_notifications',
            'payment_analytics', 'inquiries', 'profiles', 'community_profiles'
        )
    LOOP
        BEGIN
            EXECUTE 'DROP INDEX IF EXISTS public.' || idx_record.indexname || ' CASCADE';
            RAISE NOTICE 'Índice eliminado: %', idx_record.indexname;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'No se pudo eliminar índice: % (puede no existir)', idx_record.indexname;
        END;
    END LOOP;
END $$;

-- =====================================================
-- FASE 6: LIMPIAR FUNCIONES Y TRIGGERS HUÉRFANOS
-- =====================================================

-- Eliminar triggers que puedan referenciar tablas eliminadas
DO $$
DECLARE
    trigger_record RECORD;
BEGIN
    FOR trigger_record IN 
        SELECT trigger_name, event_object_table
        FROM information_schema.triggers 
        WHERE event_object_schema = 'public'
        AND event_object_table IN (
            'users', 'properties', 'agents', 'favorites', 'conversations',
            'messages', 'likes', 'reports', 'rooms', 'user_profiles',
            'profiles', 'community_profiles'
        )
    LOOP
        BEGIN
            EXECUTE 'DROP TRIGGER IF EXISTS ' || trigger_record.trigger_name || 
                   ' ON public.' || trigger_record.event_object_table || ' CASCADE';
            RAISE NOTICE 'Trigger eliminado: % en tabla %', 
                        trigger_record.trigger_name, trigger_record.event_object_table;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'No se pudo eliminar trigger: % (puede no existir)', 
                        trigger_record.trigger_name;
        END;
    END LOOP;
END $$;

-- =====================================================
-- FASE 7: VERIFICAR INTEGRIDAD POST-LIMPIEZA
-- =====================================================

-- Verificar que las tablas principales siguen existiendo
DO $$
DECLARE
    tabla_count INTEGER;
BEGIN
    -- Contar tablas principales que deben existir
    SELECT COUNT(*) INTO tabla_count
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name IN ('User', 'Property', 'Agent', 'Favorite', 'Conversation', 'Message');
    
    IF tabla_count < 6 THEN
        RAISE WARNING 'ADVERTENCIA: Algunas tablas principales pueden haber sido afectadas. Verificar manualmente.';
    ELSE
        RAISE NOTICE 'Verificación exitosa: Tablas principales intactas';
    END IF;
END $$;

-- =====================================================
-- FASE 8: ESTADÍSTICAS FINALES
-- =====================================================

-- Mostrar estadísticas de tablas restantes
DO $$
DECLARE
    tabla_record RECORD;
    total_tablas INTEGER := 0;
BEGIN
    RAISE NOTICE '=== ESTADÍSTICAS POST-LIMPIEZA ===';
    
    FOR tabla_record IN 
        SELECT table_name, 
               (SELECT COUNT(*) FROM information_schema.columns 
                WHERE table_name = t.table_name AND table_schema = 'public') as column_count
        FROM information_schema.tables t
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
        ORDER BY table_name
    LOOP
        total_tablas := total_tablas + 1;
        RAISE NOTICE 'Tabla: % (% columnas)', tabla_record.table_name, tabla_record.column_count;
    END LOOP;
    
    RAISE NOTICE 'Total de tablas restantes: %', total_tablas;
    RAISE NOTICE '=== FIN ESTADÍSTICAS ===';
END $$;

-- =====================================================
-- FASE 9: OPTIMIZACIÓN POST-LIMPIEZA
-- =====================================================

-- Actualizar estadísticas de la base de datos
ANALYZE;

-- Limpiar espacio no utilizado
VACUUM;

-- =====================================================
-- FASE 10: MENSAJE FINAL
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'LIMPIEZA DE TABLAS DUPLICADAS COMPLETADA';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Fecha: %', NOW();
    RAISE NOTICE 'Backups creados en: backup_limpieza_2025';
    RAISE NOTICE 'Próximos pasos:';
    RAISE NOTICE '1. Verificar funcionamiento de APIs';
    RAISE NOTICE '2. Ejecutar tests exhaustivos';
    RAISE NOTICE '3. Monitorear logs de errores';
    RAISE NOTICE '4. Confirmar performance mejorada';
    RAISE NOTICE '========================================';
END $$;

-- =====================================================
-- FUNCIONES DE ROLLBACK (EMERGENCIA)
-- =====================================================

-- Crear función de rollback en caso de emergencia
CREATE OR REPLACE FUNCTION rollback_limpieza_tablas()
RETURNS TEXT AS $$
DECLARE
    resultado TEXT := 'Rollback iniciado...' || CHR(10);
BEGIN
    -- Restaurar desde backups si existen
    IF EXISTS (SELECT 1 FROM information_schema.tables 
               WHERE table_name = 'users_backup' AND table_schema = 'backup_limpieza_2025') THEN
        CREATE TABLE public.users AS SELECT * FROM backup_limpieza_2025.users_backup;
        resultado := resultado || 'Tabla users restaurada' || CHR(10);
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables 
               WHERE table_name = 'properties_backup' AND table_schema = 'backup_limpieza_2025') THEN
        CREATE TABLE public.properties AS SELECT * FROM backup_limpieza_2025.properties_backup;
        resultado := resultado || 'Tabla properties restaurada' || CHR(10);
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables 
               WHERE table_name = 'agents_backup' AND table_schema = 'backup_limpieza_2025') THEN
        CREATE TABLE public.agents AS SELECT * FROM backup_limpieza_2025.agents_backup;
        resultado := resultado || 'Tabla agents restaurada' || CHR(10);
    END IF;
    
    resultado := resultado || 'Rollback completado. Verificar manualmente.';
    RETURN resultado;
END;
$$ LANGUAGE plpgsql;

-- Comentario final
COMMENT ON FUNCTION rollback_limpieza_tablas() IS 
'Función de emergencia para restaurar tablas desde backups. Usar solo si hay problemas críticos.';

-- =====================================================
-- FIN DEL SCRIPT
-- =====================================================
