-- =====================================================
-- SCRIPT DE RESTAURACIÓN - BACKUP SUPABASE
-- =====================================================
-- Fecha: 2025-09-05T15:29:05.435Z
-- Propósito: Restaurar backup en caso de emergencia
-- CRÍTICO: Solo usar en caso de problemas durante la limpieza
-- =====================================================

-- ADVERTENCIA CRÍTICA
SELECT 'ADVERTENCIA: Este script restaurará el backup completo. ¿Estás seguro?' as warning;

-- Verificar que el esquema de backup existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'backup_limpieza_2025_09_05') THEN
        RAISE EXCEPTION 'ERROR CRÍTICO: El esquema de backup no existe. No se puede restaurar.';
    END IF;
END $$;

-- =====================================================
-- RESTAURACIÓN DE TABLAS PRINCIPALES
-- =====================================================

-- Restaurar tabla User
TRUNCATE public."User" CASCADE;
INSERT INTO public."User" SELECT * FROM backup_limpieza_2025_09_05.User_backup;

-- Restaurar tabla Property
TRUNCATE public."Property" CASCADE;
INSERT INTO public."Property" SELECT * FROM backup_limpieza_2025_09_05.Property_backup;

-- Restaurar tabla Agent
TRUNCATE public."Agent" CASCADE;
INSERT INTO public."Agent" SELECT * FROM backup_limpieza_2025_09_05.Agent_backup;

-- Restaurar tabla Favorite
TRUNCATE public."Favorite" CASCADE;
INSERT INTO public."Favorite" SELECT * FROM backup_limpieza_2025_09_05.Favorite_backup;

-- Restaurar tabla Conversation
TRUNCATE public."Conversation" CASCADE;
INSERT INTO public."Conversation" SELECT * FROM backup_limpieza_2025_09_05.Conversation_backup;

-- Restaurar tabla Message
TRUNCATE public."Message" CASCADE;
INSERT INTO public."Message" SELECT * FROM backup_limpieza_2025_09_05.Message_backup;

-- Restaurar tabla CommunityProfile
TRUNCATE public."CommunityProfile" CASCADE;
INSERT INTO public."CommunityProfile" SELECT * FROM backup_limpieza_2025_09_05.CommunityProfile_backup;

-- =====================================================
-- RESTAURACIÓN DE TABLAS DUPLICADAS (SI EXISTÍAN)
-- =====================================================

-- Restaurar users (si existía)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'backup_limpieza_2025_09_05' AND table_name = 'users_backup') THEN
        DROP TABLE IF EXISTS public.users CASCADE;
        EXECUTE 'CREATE TABLE public.users AS SELECT * FROM backup_limpieza_2025_09_05.users_backup';
    END IF;
END $$;

-- Restaurar properties (si existía)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'backup_limpieza_2025_09_05' AND table_name = 'properties_backup') THEN
        DROP TABLE IF EXISTS public.properties CASCADE;
        EXECUTE 'CREATE TABLE public.properties AS SELECT * FROM backup_limpieza_2025_09_05.properties_backup';
    END IF;
END $$;

-- Restaurar agents (si existía)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'backup_limpieza_2025_09_05' AND table_name = 'agents_backup') THEN
        DROP TABLE IF EXISTS public.agents CASCADE;
        EXECUTE 'CREATE TABLE public.agents AS SELECT * FROM backup_limpieza_2025_09_05.agents_backup';
    END IF;
END $$;

-- =====================================================
-- VERIFICACIÓN DE RESTAURACIÓN
-- =====================================================

-- Contar registros restaurados
SELECT 'User' as tabla, COUNT(*) as registros FROM public."User"
UNION ALL
SELECT 'Property' as tabla, COUNT(*) as registros FROM public."Property"
UNION ALL
SELECT 'Agent' as tabla, COUNT(*) as registros FROM public."Agent"
UNION ALL
SELECT 'Favorite' as tabla, COUNT(*) as registros FROM public."Favorite"
UNION ALL
SELECT 'Conversation' as tabla, COUNT(*) as registros FROM public."Conversation"
UNION ALL
SELECT 'Message' as tabla, COUNT(*) as registros FROM public."Message";

-- =====================================================
-- MENSAJE DE CONFIRMACIÓN
-- =====================================================

SELECT 'RESTAURACIÓN COMPLETADA EXITOSAMENTE - 2025-09-05T15:29:05.435Z' as status;
