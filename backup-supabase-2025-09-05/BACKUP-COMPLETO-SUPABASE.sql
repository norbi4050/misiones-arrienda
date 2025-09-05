-- =====================================================
-- BACKUP COMPLETO SUPABASE - ESQUEMAS DUPLICADOS
-- =====================================================
-- Fecha: 2025-09-05T15:29:05.422Z
-- Propósito: Backup antes de limpieza de esquemas duplicados
-- CRÍTICO: Este backup debe ejecutarse ANTES de cualquier limpieza
-- =====================================================

-- Crear esquema de backup
CREATE SCHEMA IF NOT EXISTS backup_limpieza_2025_09_05;

-- =====================================================
-- BACKUP DE TABLAS PRINCIPALES (PascalCase)
-- =====================================================

-- Backup tabla User
CREATE TABLE backup_limpieza_2025_09_05.User_backup AS 
SELECT * FROM public."User";

-- Backup tabla Property
CREATE TABLE backup_limpieza_2025_09_05.Property_backup AS 
SELECT * FROM public."Property";

-- Backup tabla Agent
CREATE TABLE backup_limpieza_2025_09_05.Agent_backup AS 
SELECT * FROM public."Agent";

-- Backup tabla Favorite
CREATE TABLE backup_limpieza_2025_09_05.Favorite_backup AS 
SELECT * FROM public."Favorite";

-- Backup tabla Conversation
CREATE TABLE backup_limpieza_2025_09_05.Conversation_backup AS 
SELECT * FROM public."Conversation";

-- Backup tabla Message
CREATE TABLE backup_limpieza_2025_09_05.Message_backup AS 
SELECT * FROM public."Message";

-- Backup tabla CommunityProfile
CREATE TABLE backup_limpieza_2025_09_05.CommunityProfile_backup AS 
SELECT * FROM public."CommunityProfile";

-- =====================================================
-- BACKUP DE TABLAS DUPLICADAS (snake_case) - SI EXISTEN
-- =====================================================

-- Backup tabla users (si existe)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users') THEN
        EXECUTE 'CREATE TABLE backup_limpieza_2025_09_05.users_backup AS SELECT * FROM public.users';
    END IF;
END $$;

-- Backup tabla properties (si existe)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'properties') THEN
        EXECUTE 'CREATE TABLE backup_limpieza_2025_09_05.properties_backup AS SELECT * FROM public.properties';
    END IF;
END $$;

-- Backup tabla agents (si existe)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'agents') THEN
        EXECUTE 'CREATE TABLE backup_limpieza_2025_09_05.agents_backup AS SELECT * FROM public.agents';
    END IF;
END $$;

-- Backup tabla favorites (si existe)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'favorites') THEN
        EXECUTE 'CREATE TABLE backup_limpieza_2025_09_05.favorites_backup AS SELECT * FROM public.favorites';
    END IF;
END $$;

-- Backup tabla conversations (si existe)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'conversations') THEN
        EXECUTE 'CREATE TABLE backup_limpieza_2025_09_05.conversations_backup AS SELECT * FROM public.conversations';
    END IF;
END $$;

-- Backup tabla messages (si existe)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'messages') THEN
        EXECUTE 'CREATE TABLE backup_limpieza_2025_09_05.messages_backup AS SELECT * FROM public.messages';
    END IF;
END $$;

-- =====================================================
-- BACKUP DE POLÍTICAS RLS
-- =====================================================

-- Crear tabla para backup de políticas
CREATE TABLE backup_limpieza_2025_09_05.policies_backup AS
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
WHERE schemaname = 'public';

-- =====================================================
-- BACKUP DE ÍNDICES
-- =====================================================

-- Crear tabla para backup de índices
CREATE TABLE backup_limpieza_2025_09_05.indexes_backup AS
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public';

-- =====================================================
-- VERIFICACIÓN DEL BACKUP
-- =====================================================

-- Contar registros en tablas principales
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

-- Verificar que el backup se creó correctamente
SELECT 
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name AND table_schema = 'backup_limpieza_2025_09_05') as columnas
FROM information_schema.tables t
WHERE table_schema = 'backup_limpieza_2025_09_05'
ORDER BY table_name;

-- =====================================================
-- MENSAJE DE CONFIRMACIÓN
-- =====================================================

SELECT 'BACKUP COMPLETO CREADO EXITOSAMENTE - 2025-09-05T15:29:05.425Z' as status;
