-- ============================================================================
-- FIX: Renombrar tabla UserProfile a user_profiles
-- Fecha: 2025-01-18
-- Problema: Inconsistencia entre código (user_profiles) y Supabase (UserProfile)
-- ============================================================================

-- PASO 1: VERIFICACIÓN INICIAL
-- ============================================================================

-- Verificar nombre actual de la tabla
SELECT 
    table_name,
    table_schema
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name ILIKE '%profile%'
ORDER BY table_name;

-- Verificar estructura de la tabla UserProfile
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'UserProfile'
ORDER BY ordinal_position;

-- Verificar índices existentes
SELECT
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename = 'UserProfile';

-- Verificar constraints
SELECT
    conname AS constraint_name,
    contype AS constraint_type
FROM pg_constraint
WHERE conrelid = 'public."UserProfile"'::regclass;

-- PASO 2: CREAR BACKUP
-- ============================================================================

-- Crear tabla de backup (por seguridad)
CREATE TABLE IF NOT EXISTS "UserProfile_backup_20250118" AS 
SELECT * FROM "UserProfile";

-- Verificar que el backup se creó correctamente
SELECT COUNT(*) as total_records_backup 
FROM "UserProfile_backup_20250118";

-- PASO 3: RENOMBRAR TABLA
-- ============================================================================

-- Renombrar la tabla principal
ALTER TABLE "UserProfile" RENAME TO "user_profiles";

-- PASO 4: VERIFICACIÓN POST-RENAME
-- ============================================================================

-- Verificar que la tabla fue renombrada
SELECT 
    table_name,
    table_schema
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'user_profiles';

-- Verificar que los datos están intactos
SELECT COUNT(*) as total_records 
FROM user_profiles;

-- Verificar estructura de la tabla renombrada
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'user_profiles'
ORDER BY ordinal_position;

-- PASO 5: ACTUALIZAR ÍNDICES (si es necesario)
-- ============================================================================

-- Los índices se renombran automáticamente, pero verificamos:
SELECT
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename = 'user_profiles';

-- PASO 6: VERIFICAR FOREIGN KEYS
-- ============================================================================

-- Verificar que las foreign keys siguen funcionando
SELECT
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
AND (tc.table_name = 'user_profiles' OR ccu.table_name = 'user_profiles');

-- PASO 7: TESTING
-- ============================================================================

-- Test 1: Verificar que podemos leer de la tabla
SELECT 
    id,
    "userId",
    role,
    city,
    created_at
FROM user_profiles
LIMIT 5;

-- Test 2: Verificar que podemos insertar (simulación)
-- NO EJECUTAR EN PRODUCCIÓN SIN CONFIRMAR
-- INSERT INTO user_profiles (id, "userId", role, city, budget_min, budget_max)
-- VALUES ('test-id', 'test-user-id', 'BUSCO', 'Posadas', 10000, 50000);

-- Test 3: Verificar que podemos actualizar (simulación)
-- NO EJECUTAR EN PRODUCCIÓN SIN CONFIRMAR
-- UPDATE user_profiles SET city = 'Posadas' WHERE id = 'test-id';

-- PASO 8: VERIFICAR RLS POLICIES
-- ============================================================================

-- Verificar que las políticas RLS siguen activas
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
WHERE schemaname = 'public'
AND tablename = 'user_profiles';

-- PASO 9: REPORTE FINAL
-- ============================================================================

-- Resumen de la migración
SELECT 
    'Tabla renombrada exitosamente' as status,
    (SELECT COUNT(*) FROM user_profiles) as total_records,
    (SELECT COUNT(*) FROM "UserProfile_backup_20250118") as backup_records,
    CASE 
        WHEN (SELECT COUNT(*) FROM user_profiles) = (SELECT COUNT(*) FROM "UserProfile_backup_20250118")
        THEN 'OK - Datos intactos'
        ELSE 'ERROR - Verificar datos'
    END as data_integrity;

-- ============================================================================
-- ROLLBACK (Solo si algo sale mal)
-- ============================================================================

-- SI NECESITAS REVERTIR LOS CAMBIOS:
-- ALTER TABLE user_profiles RENAME TO "UserProfile";
-- DROP TABLE IF EXISTS "UserProfile_backup_20250118";

-- ============================================================================
-- NOTAS IMPORTANTES
-- ============================================================================

/*
1. Este script renombra la tabla "UserProfile" a "user_profiles"
2. Se crea un backup automático antes del rename
3. Los índices y constraints se actualizan automáticamente
4. Las foreign keys se mantienen intactas
5. Las RLS policies se mantienen activas

DESPUÉS DE EJECUTAR ESTE SCRIPT:
- Actualizar prisma/schema.prisma agregando @@map("user_profiles")
- Ejecutar: npx prisma generate
- Reiniciar la aplicación
- Verificar que el login funciona correctamente
- Monitorear logs por errores 404

VERIFICACIÓN EN CÓDIGO:
Todos los archivos que usan .from('user_profiles') ahora funcionarán correctamente.
*/
