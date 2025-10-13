-- ============================================================================
-- FIX: user_profiles.user_id Column Name Issue
-- Fecha: 2025-01-13
-- Problema: RLS policies y queries buscan "user_id" pero la columna es "userId"
-- ============================================================================

-- PASO 1: Verificar el schema actual de user_profiles
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'user_profiles'
ORDER BY ordinal_position;

-- PASO 2: Verificar si existe la columna userId (camelCase)
SELECT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'user_profiles' 
      AND column_name = 'userId'
) AS "tiene_userId";

-- PASO 3: Verificar si existe la columna user_id (snake_case)
SELECT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'user_profiles' 
      AND column_name = 'user_id'
) AS "tiene_user_id";

-- PASO 4: Ver todas las RLS policies en user_profiles
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

-- PASO 5: Ver las foreign keys que referencian user_profiles
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

-- ============================================================================
-- SOLUCIÓN: Renombrar columna de userId a user_id
-- ============================================================================

-- IMPORTANTE: Esto debe ejecutarse con cuidado en producción
-- Primero hacer backup de la tabla

-- PASO 6: Renombrar la columna si existe como userId
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'user_profiles' 
          AND column_name = 'userId'
    ) THEN
        -- Renombrar columna
        ALTER TABLE public.user_profiles 
        RENAME COLUMN "userId" TO user_id;
        
        RAISE NOTICE 'Columna userId renombrada a user_id exitosamente';
    ELSE
        RAISE NOTICE 'La columna userId no existe, probablemente ya está como user_id';
    END IF;
END $$;

-- PASO 7: Verificar que el cambio se aplicó correctamente
SELECT 
    column_name,
    data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'user_profiles'
  AND column_name IN ('userId', 'user_id');

-- PASO 8: Actualizar RLS policies si es necesario
-- (Las policies deberían funcionar automáticamente después del rename)

-- PASO 9: Verificar que las queries funcionan
SELECT 
    id,
    user_id,
    role,
    city
FROM public.user_profiles
LIMIT 5;

-- ============================================================================
-- VERIFICACIÓN FINAL
-- ============================================================================

-- Verificar que no hay errores en las relaciones
SELECT 
    c.conname AS constraint_name,
    c.contype AS constraint_type,
    sch.nspname AS schema_name,
    tbl.relname AS table_name,
    ARRAY_AGG(col.attname ORDER BY u.attposition) AS columns,
    f_sch.nspname AS foreign_schema_name,
    f_tbl.relname AS foreign_table_name,
    ARRAY_AGG(f_col.attname ORDER BY f_u.attposition) AS foreign_columns
FROM pg_constraint c
LEFT JOIN LATERAL UNNEST(c.conkey) WITH ORDINALITY AS u(attnum, attposition) ON TRUE
LEFT JOIN LATERAL UNNEST(c.confkey) WITH ORDINALITY AS f_u(attnum, attposition) ON TRUE
JOIN pg_namespace sch ON sch.oid = c.connamespace
JOIN pg_class tbl ON tbl.oid = c.conrelid
LEFT JOIN pg_attribute col ON (col.attrelid = tbl.oid AND col.attnum = u.attnum)
LEFT JOIN pg_class f_tbl ON f_tbl.oid = c.confrelid
LEFT JOIN pg_namespace f_sch ON f_sch.oid = f_tbl.relnamespace
LEFT JOIN pg_attribute f_col ON (f_col.attrelid = f_tbl.oid AND f_col.attnum = f_u.attnum)
WHERE tbl.relname = 'user_profiles'
  AND sch.nspname = 'public'
GROUP BY constraint_name, constraint_type, schema_name, table_name, foreign_schema_name, foreign_table_name;

-- ============================================================================
-- NOTAS IMPORTANTES
-- ============================================================================

/*
CAUSA DEL PROBLEMA:
- Prisma usa camelCase (userId) por defecto
- Supabase/PostgREST espera snake_case (user_id)
- Las RLS policies se generaron con user_id pero la columna era userId

SOLUCIÓN APLICADA:
1. Renombrar columna de userId a user_id en la base de datos
2. Actualizar Prisma schema para usar @map("user_id")
3. Las RLS policies funcionarán automáticamente

ALTERNATIVA (si no se puede renombrar):
- Actualizar todas las RLS policies para usar "userId" en lugar de "user_id"
- Pero esto es más propenso a errores

DESPUÉS DE EJECUTAR ESTE SCRIPT:
1. Actualizar prisma/schema.prisma:
   userId String @unique @map("user_id")
2. Regenerar Prisma Client: npx prisma generate
3. Probar las queries de eliminación de conversaciones
*/
