-- Script de verificación del backup
SELECT 
    'backup_limpieza_2025_09_05' as esquema_backup,
    COUNT(*) as tablas_backup
FROM information_schema.tables 
WHERE table_schema = 'backup_limpieza_2025_09_05';

-- Verificar integridad de datos
SELECT 
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name AND table_schema = 'backup_limpieza_2025_09_05') as columnas
FROM information_schema.tables t
WHERE table_schema = 'backup_limpieza_2025_09_05'
ORDER BY table_name;
