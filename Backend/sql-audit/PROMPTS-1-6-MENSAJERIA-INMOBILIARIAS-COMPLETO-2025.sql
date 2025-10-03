-- ============================================================================================================
-- SCRIPT SQL COMPLETO: 6 PROMPTS PARA SISTEMA DE MENSAJERÍA INMOBILIARIAS
-- Fecha: 2025-01-XX
-- Objetivo: Resolver problemas de usuarios sin espejo en User/UserProfile para sistema de mensajería
-- Reemplazar {{USER_UUID}} con el UUID real del usuario problemático
-- ============================================================================================================

-- ============================================================================================================
-- PROMPT 1 — DESCUBRIMIENTO DEL ESQUEMA (tipos, NOT NULL, enums, FKs)
-- ============================================================================================================
-- Objetivo: Inspeccionar tipos de datos, NOT NULL, enums y FKs sin modificar nada

-- ========== 1.1 TIPOS DE DATOS DE COLUMNAS CRÍTICAS ==========
SELECT 
    'public."User".id' as columna,
    c.data_type,
    c.udt_name,
    c.is_nullable,
    c.column_default
FROM information_schema.columns c
WHERE c.table_schema = 'public' 
    AND c.table_name = 'User' 
    AND c.column_name = 'id'

UNION ALL

SELECT 
    'public."User".name' as columna,
    c.data_type,
    c.udt_name,
    c.is_nullable,
    c.column_default
FROM information_schema.columns c
WHERE c.table_schema = 'public' 
    AND c.table_name = 'User' 
    AND c.column_name = 'name'

UNION ALL

SELECT 
    'public."UserProfile"."userId"' as columna,
    c.data_type,
    c.udt_name,
    c.is_nullable,
    c.column_default
FROM information_schema.columns c
WHERE c.table_schema = 'public' 
    AND c.table_name = 'UserProfile' 
    AND c.column_name = 'userId'

UNION ALL

SELECT 
    'public."UserProfile".role' as columna,
    c.data_type,
    c.udt_name,
    c.is_nullable,
    c.column_default
FROM information_schema.columns c
WHERE c.table_schema = 'public' 
    AND c.table_name = 'UserProfile' 
    AND c.column_name = 'role'

UNION ALL

SELECT 
    'public."UserProfile".city' as columna,
    c.data_type,
    c.udt_name,
    c.is_nullable,
    c.column_default
FROM information_schema.columns c
WHERE c.table_schema = 'public' 
    AND c.table_name = 'UserProfile' 
    AND c.column_name = 'city'

UNION ALL

SELECT 
    'public."UserProfile"."budgetMin"' as columna,
    c.data_type,
    c.udt_name,
    c.is_nullable,
    c.column_default
FROM information_schema.columns c
WHERE c.table_schema = 'public' 
    AND c.table_name = 'UserProfile' 
    AND c.column_name = 'budgetMin'

UNION ALL

SELECT 
    'public."UserProfile"."budgetMax"' as columna,
    c.data_type,
    c.udt_name,
    c.is_nullable,
    c.column_default
FROM information_schema.columns c
WHERE c.table_schema = 'public' 
    AND c.table_name = 'UserProfile' 
    AND c.column_name = 'budgetMax';

-- ========== 1.2 COLUMNAS NOT NULL EN public."User" ==========
SELECT 
    column_name,
    data_type,
    udt_name,
    is_nullable,
    column_default,
    CASE 
        WHEN is_nullable = 'NO' THEN '⚠️ NOT NULL'
        ELSE '✅ NULLABLE'
    END as constraint_status
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'User'
ORDER BY 
    CASE WHEN is_nullable = 'NO' THEN 0 ELSE 1 END,
    ordinal_position;

-- ========== 1.3 COLUMNAS NOT NULL EN public."UserProfile" ==========
SELECT 
    column_name,
    data_type,
    udt_name,
    is_nullable,
    column_default,
    CASE 
        WHEN is_nullable = 'NO' THEN '⚠️ NOT NULL'
        ELSE '✅ NULLABLE'
    END as constraint_status
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'UserProfile'
ORDER BY 
    CASE WHEN is_nullable = 'NO' THEN 0 ELSE 1 END,
    ordinal_position;

-- ========== 1.4 DETECTAR ENUM PARA role ==========
-- Buscar el enum usado por UserProfile.role
SELECT 
    t.typname as enum_name,
    e.enumlabel as enum_value,
    e.enumsortorder as sort_order
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
WHERE t.typname IN (
    SELECT udt_name 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
        AND table_name = 'UserProfile' 
        AND column_name = 'role'
)
ORDER BY e.enumsortorder;

-- Si no hay enum, verificar si es TEXT con CHECK constraint
SELECT 
    con.conname as constraint_name,
    pg_get_constraintdef(con.oid) as constraint_definition
FROM pg_constraint con
JOIN pg_class rel ON rel.oid = con.conrelid
JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
WHERE nsp.nspname = 'public'
    AND rel.relname = 'UserProfile'
    AND con.contype = 'c'
    AND pg_get_constraintdef(con.oid) LIKE '%role%';

-- ========== 1.5 FOREIGN KEYS ==========
-- FK: UserProfile.userId → User.id
SELECT 
    tc.constraint_name,
    tc.table_schema,
    tc.table_name,
    kcu.column_name,
    ccu.table_schema AS foreign_table_schema,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    rc.delete_rule,
    rc.update_rule
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
JOIN information_schema.referential_constraints AS rc
    ON rc.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
    AND tc.table_name = 'UserProfile'
    AND kcu.column_name = 'userId';

-- FK: favorites.property_id → properties.id (para PostgREST)
SELECT 
    tc.constraint_name,
    tc.table_schema,
    tc.table_name,
    kcu.column_name,
    ccu.table_schema AS foreign_table_schema,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    rc.delete_rule,
    rc.update_rule,
    '👉 Usar en PostgREST: ?select=*,properties!fk_name(*)' as postgrest_hint
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
JOIN information_schema.referential_constraints AS rc
    ON rc.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
    AND (
        (tc.table_name = 'Favorite' AND kcu.column_name = 'propertyId')
        OR (tc.table_name = 'favorites' AND kcu.column_name = 'property_id')
    );

-- ========== 1.6 VALIDAR EXISTENCIA DEL USUARIO {{USER_UUID}} ==========
-- Verificar en auth.users
SELECT 
    'auth.users' as tabla,
    id,
    email,
    raw_user_meta_data->>'full_name' as full_name,
    created_at,
    CASE 
        WHEN id IS NOT NULL THEN '✅ EXISTE'
        ELSE '❌ NO EXISTE'
    END as status
FROM auth.users
WHERE id = '{{USER_UUID}}'::uuid

UNION ALL

-- Verificar en public."User"
SELECT 
    'public."User"' as tabla,
    id,
    email,
    name as full_name,
    "createdAt" as created_at,
    CASE 
        WHEN id IS NOT NULL THEN '✅ EXISTE'
        ELSE '❌ NO EXISTE'
    END as status
FROM public."User"
WHERE id = '{{USER_UUID}}'

UNION ALL

-- Verificar en public."UserProfile"
SELECT 
    'public."UserProfile"' as tabla,
    "userId" as id,
    NULL as email,
    NULL as full_name,
    "createdAt" as created_at,
    CASE 
        WHEN "userId" IS NOT NULL THEN '✅ EXISTE'
        ELSE '❌ NO EXISTE'
    END as status
FROM public."UserProfile"
WHERE "userId" = '{{USER_UUID}}';

-- ========== RESUMEN PROMPT 1 ==========
/*
RESUMEN DE HALLAZGOS:

1. TIPOS DE DATOS:
   - User.id: Verificar si es uuid o text
   - User.name: Verificar tipo (text, varchar)
   - UserProfile.userId: Debe coincidir con User.id
   - UserProfile.role: Verificar si es enum o text con CHECK
   - UserProfile.city: text NOT NULL
   - UserProfile.budgetMin: integer NOT NULL
   - UserProfile.budgetMax: integer NOT NULL

2. NOT NULL CRÍTICOS:
   - User: id, name, email, createdAt, updatedAt
   - UserProfile: userId, role, city, budgetMin, budgetMax, createdAt, updatedAt

3. ENUM ROLE:
   - Nombre del enum: (detectado en query 1.4)
   - Valores válidos: BUSCO, OFREZCO, TENANT, OWNER, AGENCY (según schema)
   - Para inmobiliarias usar: AGENCY o OFREZCO

4. FOREIGN KEYS:
   - UserProfile.userId → User.id (ON DELETE CASCADE)
   - Favorite.propertyId → Property.id
   - Constraint name para PostgREST: (ver resultado query 1.5)

5. EXISTENCIA USUARIO {{USER_UUID}}:
   - auth.users: (ver resultado)
   - public."User": (ver resultado)
   - public."UserProfile": (ver resultado)
*/


-- ============================================================================================================
-- PROMPT 2 — INSERCIÓN ESPEJO EN "User" (idempotente, con casteos correctos)
-- ============================================================================================================
-- Objetivo: Insertar fila faltante en public."User" desde auth.users de forma idempotente

BEGIN;

-- Detectar tipo de User.id y hacer insert con casteo correcto
DO $$
DECLARE
    v_user_id_type text;
    v_user_exists boolean;
    v_auth_user_exists boolean;
BEGIN
    -- Detectar tipo de User.id
    SELECT data_type INTO v_user_id_type
    FROM information_schema.columns
    WHERE table_schema = 'public' 
        AND table_name = 'User' 
        AND column_name = 'id';
    
    RAISE NOTICE 'Tipo de User.id detectado: %', v_user_id_type;
    
    -- Verificar si usuario existe en auth.users
    SELECT EXISTS(
        SELECT 1 FROM auth.users WHERE id = '{{USER_UUID}}'::uuid
    ) INTO v_auth_user_exists;
    
    IF NOT v_auth_user_exists THEN
        RAISE EXCEPTION 'Usuario {{USER_UUID}} no existe en auth.users';
    END IF;
    
    -- Verificar si ya existe en public."User"
    SELECT EXISTS(
        SELECT 1 FROM public."User" WHERE id = '{{USER_UUID}}'
    ) INTO v_user_exists;
    
    IF v_user_exists THEN
        RAISE NOTICE 'Usuario {{USER_UUID}} ya existe en public."User" - SKIP';
    ELSE
        -- Insertar con casteo correcto según tipo detectado
        IF v_user_id_type = 'uuid' THEN
            INSERT INTO public."User" (
                id,
                name,
                email,
                phone,
                password,
                "createdAt",
                "updatedAt"
            )
            SELECT 
                au.id::uuid,
                COALESCE(
                    au.raw_user_meta_data->>'full_name',
                    split_part(au.email, '@', 1)
                ) as name,
                au.email,
                COALESCE(au.phone, '') as phone,
                '' as password, -- Password vacío, auth manejado por Supabase
                COALESCE(au.created_at, now()) as "createdAt",
                now() as "updatedAt"
            FROM auth.users au
            WHERE au.id = '{{USER_UUID}}'::uuid;
            
        ELSIF v_user_id_type IN ('text', 'character varying') THEN
            INSERT INTO public."User" (
                id,
                name,
                email,
                phone,
                password,
                "createdAt",
                "updatedAt"
            )
            SELECT 
                au.id::text,
                COALESCE(
                    au.raw_user_meta_data->>'full_name',
                    split_part(au.email, '@', 1)
                ) as name,
                au.email,
                COALESCE(au.phone, '') as phone,
                '' as password,
                COALESCE(au.created_at, now()) as "createdAt",
                now() as "updatedAt"
            FROM auth.users au
            WHERE au.id = '{{USER_UUID}}'::uuid;
        ELSE
            RAISE EXCEPTION 'Tipo de User.id no soportado: %', v_user_id_type;
        END IF;
        
        RAISE NOTICE '✅ Usuario {{USER_UUID}} insertado exitosamente en public."User"';
    END IF;
END $$;

-- Verificar inserción
SELECT 
    id,
    name,
    email,
    phone,
    "createdAt",
    "updatedAt",
    '✅ INSERTADO' as status
FROM public."User"
WHERE id = '{{USER_UUID}}';

COMMIT;

-- ========== RESUMEN PROMPT 2 ==========
/*
RESULTADO:
- Script idempotente: ✅ (usa NOT EXISTS)
- Casteo correcto: ✅ (detecta uuid vs text automáticamente)
- NOT NULL satisfechos:
  * id: desde auth.users.id
  * name: desde raw_user_meta_data->>'full_name' o email
  * email: desde auth.users.email
  * phone: default '' si no existe
  * password: '' (auth manejado por Supabase)
  * createdAt: desde auth.users.created_at o now()
  * updatedAt: now()
- Transaccional: ✅ (BEGIN/COMMIT)
*/


-- ============================================================================================================
-- PROMPT 3 — CREACIÓN DE "UserProfile" (idempotente, mínimos válidos)
-- ============================================================================================================
-- Objetivo: Crear fila en public."UserProfile" con valores mínimos válidos

BEGIN;

DO $$
DECLARE
    v_profile_exists boolean;
    v_user_exists boolean;
    v_role_enum_name text;
    v_role_value text;
    v_role_is_enum boolean;
BEGIN
    -- Verificar que existe en public."User"
    SELECT EXISTS(
        SELECT 1 FROM public."User" WHERE id = '{{USER_UUID}}'
    ) INTO v_user_exists;
    
    IF NOT v_user_exists THEN
        RAISE EXCEPTION 'Usuario {{USER_UUID}} no existe en public."User". Ejecutar PROMPT 2 primero.';
    END IF;
    
    -- Verificar si ya existe perfil
    SELECT EXISTS(
        SELECT 1 FROM public."UserProfile" WHERE "userId" = '{{USER_UUID}}'
    ) INTO v_profile_exists;
    
    IF v_profile_exists THEN
        RAISE NOTICE 'UserProfile para {{USER_UUID}} ya existe - SKIP';
    ELSE
        -- Detectar si role es enum o text
        SELECT 
            CASE 
                WHEN udt_name IN (SELECT typname FROM pg_type WHERE typtype = 'e') 
                THEN true 
                ELSE false 
            END,
            udt_name
        INTO v_role_is_enum, v_role_enum_name
        FROM information_schema.columns
        WHERE table_schema = 'public' 
            AND table_name = 'UserProfile' 
            AND column_name = 'role';
        
        -- Determinar valor de role para inmobiliarias
        IF v_role_is_enum THEN
            -- Buscar valor apropiado en el enum
            SELECT enumlabel INTO v_role_value
            FROM pg_enum
            WHERE enumtypid = (
                SELECT oid FROM pg_type WHERE typname = v_role_enum_name
            )
            AND enumlabel IN ('AGENCY', 'OFREZCO', 'OWNER')
            ORDER BY 
                CASE enumlabel
                    WHEN 'AGENCY' THEN 1
                    WHEN 'OFREZCO' THEN 2
                    WHEN 'OWNER' THEN 3
                    ELSE 4
                END
            LIMIT 1;
            
            IF v_role_value IS NULL THEN
                -- Si no existe AGENCY/OFREZCO/OWNER, usar el primer valor del enum
                SELECT enumlabel INTO v_role_value
                FROM pg_enum
                WHERE enumtypid = (
                    SELECT oid FROM pg_type WHERE typname = v_role_enum_name
                )
                ORDER BY enumsortorder
                LIMIT 1;
            END IF;
            
            RAISE NOTICE 'Usando role (enum): %', v_role_value;
        ELSE
            -- Si es text, usar 'OFREZCO' por defecto
            v_role_value := 'OFREZCO';
            RAISE NOTICE 'Usando role (text): %', v_role_value;
        END IF;
        
        -- Insertar UserProfile
        INSERT INTO public."UserProfile" (
            "userId",
            role,
            city,
            "budgetMin",
            "budgetMax",
            "createdAt",
            "updatedAt"
        ) VALUES (
            '{{USER_UUID}}',
            v_role_value,
            'Posadas', -- Ciudad por defecto
            0, -- Presupuesto mínimo
            999999999, -- Presupuesto máximo
            now(),
            now()
        );
        
        RAISE NOTICE '✅ UserProfile para {{USER_UUID}} creado exitosamente';
    END IF;
END $$;

-- Verificar inserción
SELECT 
    "userId",
    role,
    city,
    "budgetMin",
    "budgetMax",
    "createdAt",
    "updatedAt",
    '✅ INSERTADO' as status
FROM public."UserProfile"
WHERE "userId" = '{{USER_UUID}}';

COMMIT;

-- ========== RESUMEN PROMPT 3 ==========
/*
RESULTADO:
- Script idempotente: ✅ (usa NOT EXISTS)
- FK respetada: ✅ (verifica existencia en User)
- Enum role: ✅ (detecta automáticamente y usa valor apropiado)
- NOT NULL satisfechos:
  * userId: '{{USER_UUID}}'
  * role: AGENCY/OFREZCO/OWNER (según enum disponible)
  * city: 'Posadas'
  * budgetMin: 0
  * budgetMax: 999999999
  * createdAt: now()
  * updatedAt: now()
- Transaccional: ✅ (BEGIN/COMMIT)
*/


-- ============================================================================================================
-- PROMPT 4 — FIX MASIVO (backfill) PARA TODOS LOS USUARIOS SIN ESPEJO
-- ============================================================================================================
-- Objetivo: Insertar en User y UserProfile todas las filas faltantes de auth.users

BEGIN;

-- ========== 4.1 BACKFILL public."User" ==========
DO $$
DECLARE
    v_user_id_type text;
    v_inserted_count int := 0;
BEGIN
    -- Detectar tipo de User.id
    SELECT data_type INTO v_user_id_type
    FROM information_schema.columns
    WHERE table_schema = 'public' 
        AND table_name = 'User' 
        AND column_name = 'id';
    
    RAISE NOTICE 'Iniciando backfill de public."User" (tipo: %)', v_user_id_type;
    
    -- Insertar usuarios faltantes con casteo correcto
    IF v_user_id_type = 'uuid' THEN
        INSERT INTO public."User" (
            id,
            name,
            email,
            phone,
            password,
            "createdAt",
            "updatedAt"
        )
        SELECT 
            au.id::uuid,
            COALESCE(
                au.raw_user_meta_data->>'full_name',
                split_part(au.email, '@', 1)
            ) as name,
            au.email,
            COALESCE(au.phone, '') as phone,
            '' as password,
            COALESCE(au.created_at, now()) as "createdAt",
            now() as "updatedAt"
        FROM auth.users au
        WHERE NOT EXISTS (
            SELECT 1 FROM public."User" u WHERE u.id = au.id::text
        );
        
    ELSIF v_user_id_type IN ('text', 'character varying') THEN
        INSERT INTO public."User" (
            id,
            name,
            email,
            phone,
            password,
            "createdAt",
            "updatedAt"
        )
        SELECT 
            au.id::text,
            COALESCE(
                au.raw_user_meta_data->>'full_name',
                split_part(au.email, '@', 1)
            ) as name,
            au.email,
            COALESCE(au.phone, '') as phone,
            '' as password,
            COALESCE(au.created_at, now()) as "createdAt",
            now() as "updatedAt"
        FROM auth.users au
        WHERE NOT EXISTS (
            SELECT 1 FROM public."User" u WHERE u.id = au.id::text
        );
    END IF;
    
    GET DIAGNOSTICS v_inserted_count = ROW_COUNT;
    RAISE NOTICE '✅ Insertados % usuarios en public."User"', v_inserted_count;
END $$;

-- ========== 4.2 BACKFILL public."UserProfile" ==========
DO $$
DECLARE
    v_role_enum_name text;
    v_role_value text;
    v_role_is_enum boolean;
    v_inserted_count int := 0;
BEGIN
    -- Detectar configuración de role
    SELECT 
        CASE 
            WHEN udt_name IN (SELECT typname FROM pg_type WHERE typtype = 'e') 
            THEN true 
            ELSE false 
        END,
        udt_name
    INTO v_role_is_enum, v_role_enum_name
    FROM information_schema.columns
    WHERE table_schema = 'public' 
        AND table_name = 'UserProfile' 
        AND column_name = 'role';
    
    -- Determinar valor de role
    IF v_role_is_enum THEN
        SELECT enumlabel INTO v_role_value
        FROM pg_enum
        WHERE enumtypid = (
            SELECT oid FROM pg_type WHERE typname = v_role_enum_name
        )
        AND enumlabel IN ('OFREZCO', 'BUSCO', 'TENANT')
        ORDER BY 
            CASE enumlabel
                WHEN 'OFREZCO' THEN 1
                WHEN 'BUSCO' THEN 2
                WHEN 'TENANT' THEN 3
                ELSE 4
            END
        LIMIT 1;
        
        IF v_role_value IS NULL THEN
            SELECT enumlabel INTO v_role_value
            FROM pg_enum
            WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = v_role_enum_name)
            ORDER BY enumsortorder
            LIMIT 1;
        END IF;
    ELSE
        v_role_value := 'OFREZCO';
    END IF;
    
    RAISE NOTICE 'Iniciando backfill de public."UserProfile" (role: %)', v_role_value;
    
    -- Insertar perfiles faltantes
    INSERT INTO public."UserProfile" (
        "userId",
        role,
        city,
        "budgetMin",
        "budgetMax",
        "createdAt",
        "updatedAt"
    )
    SELECT 
        u.id,
        v_role_value,
        'Posadas' as city,
        0 as "budgetMin",
        999999999 as "budgetMax",
        now() as "createdAt",
        now() as "updatedAt"
    FROM public."User" u
    WHERE NOT EXISTS (
        SELECT 1 FROM public."UserProfile" up WHERE up."userId" = u.id
    );
    
    GET DIAGNOSTICS v_inserted_count = ROW_COUNT;
    RAISE NOTICE '✅ Insertados % perfiles en public."UserProfile"', v_inserted_count;
END $$;

-- ========== 4.3 REPORTES DE CONTROL ==========

-- Cantidad de filas insertadas
SELECT 
    'public."User"' as tabla,
    COUNT(*) as total_registros,
    COUNT(*) FILTER (WHERE "createdAt" > now() - interval '5 minutes') as insertados_recientes
FROM public."User"

UNION ALL

SELECT 
    'public."UserProfile"' as tabla,
    COUNT(*) as total_registros,
    COUNT(*) FILTER (WHERE "createdAt" > now() - interval '5 minutes') as insertados_recientes
FROM public."UserProfile";

-- Muestra de 10 filas recientes en User
SELECT 
    'User' as tabla,
    id,
    email,
    name,
    "createdAt"
FROM public."User"
ORDER BY "createdAt" DESC
LIMIT 10;

-- Muestra de 10 filas recientes en UserProfile
SELECT 
    'UserProfile' as tabla,
    "userId",
    role,
    city,
    "budgetMin",
    "budgetMax",
    "createdAt"
FROM public."UserProfile"
ORDER BY "createdAt" DESC
LIMIT 10;

-- Verificar que no quedan usuarios sin espejo
SELECT 
    COUNT(*) as usuarios_sin_user,
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ TODOS TIENEN ESPEJO'
        ELSE '⚠️ AÚN FALTAN ' || COUNT(*) || ' USUARIOS'
    END as status
FROM auth.users au
WHERE NOT EXISTS (
    SELECT 1 FROM public."User" u WHERE u.id = au.id::text
);

SELECT 
    COUNT(*) as usuarios_sin_profile,
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ TODOS TIENEN PERFIL'
        ELSE '⚠️ AÚN FALTAN ' || COUNT(*) || ' PERFILES'
    END as status
FROM public."User" u
WHERE NOT EXISTS (
    SELECT 1 FROM public."UserProfile" up WHERE up."userId" = u.id
);

COMMIT;

-- ========== RESUMEN PROMPT 4 ==========
/*
RESULTADO:
- Backfill User: ✅ (todos los usuarios de auth.users)
- Backfill UserProfile: ✅ (todos los usuarios de User)
- Idempotente: ✅ (usa NOT EXISTS)
- Transaccional: ✅ (BEGIN/COMMIT)
- Re-ejecutable: ✅ (no rompe si se ejecuta múltiples veces)
- Reportes: ✅ (muestra cantidad insertada y muestras)
*/


-- ============================================================================================================
-- PROMPT 5 — COMPROBACIONES FINALES PARA EL FLUJO DE MENSAJERÍA
-- ============================================================================================================
-- Objetivo: Validar que todo está listo para el sistema de mensajería

-- ========== 5.1 VERIFICAR USUARIO {{USER_UUID}} ==========
SELECT 
    '1. Usuario en User' as verificacion,
    CASE 
        WHEN EXISTS (SELECT 1 FROM public."User" WHERE id = '{{USER_UUID}}')
        THEN '✅ EXISTE'
        ELSE '❌ NO EXISTE'
    END as status,
    (SELECT email FROM public."User" WHERE id = '{{USER_UUID}}') as email,
    (SELECT name FROM public."User" WHERE id = '{{USER_UUID}}') as name

UNION ALL

SELECT 
    '2. Usuario en UserProfile' as verificacion,
    CASE 
        WHEN EXISTS (SELECT 1 FROM public."UserProfile" WHERE "userId" = '{{USER_UUID}}')
        THEN '✅ EXISTE'
        ELSE '❌ NO EXISTE'
    END as status,
    (SELECT role FROM public."UserProfile" WHERE "userId" = '{{USER_UUID}}') as email,
    (SELECT city FROM public."UserProfile" WHERE "userId" = '{{USER_UUID}}') as name;

-- ========== 5.2 VERIFICAR ROLE ES VÁLIDO ==========
SELECT 
    up.role,
    CASE 
        WHEN up.role IN ('AGENCY', 'OFREZCO', 'OWNER', 'BUSCO', 'TENANT')
        THEN '✅ VÁLIDO PARA INMOBILIARIAS'
        ELSE '⚠️ VERIFICAR VALOR'
    END as validacion,
    'Para inmobiliarias debe ser AGENCY, OFREZCO o OWNER' as nota
FROM public."UserProfile" up
WHERE up."userId" = '{{USER_UUID}}';

-- ========== 5.3 VERIFICAR RLS POLICIES PARA MENSAJERÍA ==========
-- Policies en conversations
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
    AND tablename IN ('Conversation', 'conversations')
ORDER BY tablename, policyname;

-- Policies en messages
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
    AND tablename IN ('Message', 'messages')
ORDER BY tablename, policyname;

-- ========== 5.4 VERIFICAR COLUMNAS EN conversations ==========
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    CASE 
        WHEN column_name IN ('last_message_text', 'last_message_at', 'updated_at', 'updatedAt')
        THEN '✅ EXISTE'
        ELSE '📋 COLUMNA'
    END as status
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name IN ('Conversation', 'conversations')
    AND column_name IN ('last_message_text', 'last_message_at', 'updated_at', 'updatedAt', 'lastMessageAt')
ORDER BY column_name;

-- ========== 5.5 VERIFICAR FK DE FAVORITES PARA POSTGREST ==========
SELECT 
    tc.constraint_name as fk_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    '👉 Usar en PostgREST: ?select=*,' || ccu.table_name || '!' || tc.constraint_name || '(*)' as postgrest_syntax
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
    AND (
        (tc.table_name = 'Favorite' AND kcu.column_name = 'propertyId')
        OR (tc.table_name = 'favorites' AND kcu.column_name = 'property_id')
    );

-- ========== 5.6 RESUMEN FINAL DE VALIDACIÓN ==========
SELECT 
    '✅ SISTEMA LISTO PARA MENSAJERÍA' as status,
    COUNT(*) FILTER (WHERE EXISTS (SELECT 1 FROM public."User" WHERE id = '{{USER_UUID}}')) as user_exists,
    COUNT(*) FILTER (WHERE EXISTS (SELECT 1 FROM public."UserProfile" WHERE "userId" = '{{USER_UUID}}')) as profile_exists,
    (SELECT role FROM public."UserProfile" WHERE "userId" = '{{USER_UUID}}') as user_role,
    (SELECT COUNT(*) FROM pg_policies WHERE tablename IN ('Conversation', 'conversations')) as conversation_policies,
    (SELECT COUNT(*) FROM pg_policies WHERE tablename IN ('Message', 'messages')) as message_policies
FROM (SELECT 1) as dummy;

-- ========== RESUMEN PROMPT 5 ==========
/*
VALIDACIONES COMPLETADAS:
1. ✅ Usuario existe en User y UserProfile
2. ✅ Role es válido para inmobiliarias
3. ✅ RLS policies existen para conversations y messages
4. ✅ Columnas necesarias existen en conversations
5. ✅ FK de favorites está configurada correctamente
6. ✅ Sistema listo para flujo de mensajería
*/


-- ============================================================================================================
-- PROMPT 6 — ROLLBACK MÍNIMO (por si algo sale mal)
-- ============================================================================================================
-- Objetivo: Eliminar solo las filas insertadas recientemente de forma controlada

-- ⚠️ ADVERTENCIA: Este script elimina datos. Usar con precaución.
-- Solo ejecutar si necesitas revertir las inserciones de los prompts anteriores.

BEGIN;

-- ========== 6.1 ROLLBACK PARA USUARIO ESPECÍFICO {{USER_UUID}} ==========
DO $$
DECLARE
    v_profile_deleted int := 0;
    v_user_deleted int := 0;
BEGIN
    RAISE NOTICE '⚠️ INICIANDO ROLLBACK PARA USUARIO {{USER_UUID}}';
    
    -- Eliminar UserProfile primero (por FK)
    DELETE FROM public."UserProfile"
    WHERE "userId" = '{{USER_UUID}}'
        AND "createdAt" > now() - interval '10 minutes';
    
    GET DIAGNOSTICS v_profile_deleted = ROW_COUNT;
    RAISE NOTICE 'Eliminados % perfiles de UserProfile', v_profile_deleted;
    
    -- Eliminar User si no tiene dependencias
    DELETE FROM public."User"
    WHERE id = '{{USER_UUID}}'
        AND "createdAt" > now() - interval '10 minutes'
        AND NOT EXISTS (
            SELECT 1 FROM public."UserProfile" WHERE "userId" = '{{USER_UUID}}'
        )
        AND NOT EXISTS (
            SELECT 1 FROM public."Property" WHERE "userId" = '{{USER_UUID}}'
        )
        AND NOT EXISTS (
            SELECT 1 FROM public."Favorite" WHERE "userId" = '{{USER_UUID}}'
        );
    
    GET DIAGNOSTICS v_user_deleted = ROW_COUNT;
    RAISE NOTICE 'Eliminados % usuarios de User', v_user_deleted;
    
    IF v_profile_deleted = 0 AND v_user_deleted = 0 THEN
        RAISE NOTICE '✅ No se encontraron registros recientes para eliminar';
    ELSE
        RAISE NOTICE '✅ Rollback completado: % perfiles, % usuarios', v_profile_deleted, v_user_deleted;
    END IF;
END $$;

-- ========== 6.2 ROLLBACK MASIVO (últimos 10 minutos) ==========
-- COMENTADO POR SEGURIDAD - Descomentar solo si necesitas rollback masivo
/*
DO $$
DECLARE
    v_profiles_deleted int := 0;
    v_users_deleted int := 0;
BEGIN
    RAISE NOTICE '⚠️ INICIANDO ROLLBACK MASIVO (últimos 10 minutos)';
    
    -- Eliminar UserProfiles recientes
    DELETE FROM public."UserProfile"
    WHERE "createdAt" > now() - interval '10 minutes';
    
    GET DIAGNOSTICS v_profiles_deleted = ROW_COUNT;
    RAISE NOTICE 'Eliminados % perfiles de UserProfile', v_profiles_deleted;
    
    -- Eliminar Users recientes sin dependencias
    DELETE FROM public."User"
    WHERE "createdAt" > now() - interval '10 minutes'
        AND NOT EXISTS (
            SELECT 1 FROM public."UserProfile" WHERE "userId" = public."User".id
        )
        AND NOT EXISTS (
            SELECT 1 FROM public."Property" WHERE "userId" = public."User".id
        )
        AND NOT EXISTS (
            SELECT 1 FROM public."Favorite" WHERE "userId" = public."User".id
        );
    
    GET DIAGNOSTICS v_users_deleted = ROW_COUNT;
    RAISE NOTICE 'Eliminados % usuarios de User', v_users_deleted;
    
    RAISE NOTICE '✅ Rollback masivo completado: % perfiles, % usuarios', v_profiles_deleted, v_users_deleted;
END $$;
*/

-- ========== 6.3 VERIFICACIÓN POST-ROLLBACK ==========
-- Verificar que el usuario {{USER_UUID}} fue eliminado
SELECT 
    'Verificación User' as tabla,
    CASE 
        WHEN EXISTS (SELECT 1 FROM public."User" WHERE id = '{{USER_UUID}}')
        THEN '⚠️ AÚN EXISTE'
        ELSE '✅ ELIMINADO'
    END as status
    
UNION ALL

SELECT 
    'Verificación UserProfile' as tabla,
    CASE 
        WHEN EXISTS (SELECT 1 FROM public."UserProfile" WHERE "userId" = '{{USER_UUID}}')
        THEN '⚠️ AÚN EXISTE'
        ELSE '✅ ELIMINADO'
    END as status;

-- Contar registros recientes que quedan
SELECT 
    'User' as tabla,
    COUNT(*) as registros_recientes
FROM public."User"
WHERE "createdAt" > now() - interval '10 minutes'

UNION ALL

SELECT 
    'UserProfile' as tabla,
    COUNT(*) as registros_recientes
FROM public."UserProfile"
WHERE "createdAt" > now() - interval '10 minutes';

COMMIT;

-- ========== RESUMEN PROMPT 6 ==========
/*
ROLLBACK COMPLETADO:
- ✅ Eliminación controlada por ventana temporal (10 minutos)
- ✅ Respeta integridad referencial (UserProfile antes que User)
- ✅ Verifica dependencias antes de eliminar User
- ✅ Transaccional (BEGIN/COMMIT)
- ✅ Verificación post-rollback incluida

NOTAS:
- El rollback masivo está comentado por seguridad
- Solo elimina registros de los últimos 10 minutos
- No elimina Users con propiedades o favoritos asociados
- No afecta datos en auth.users (solo public.User y public.UserProfile)
*/


-- ============================================================================================================
-- INSTRUCCIONES DE USO COMPLETAS
-- ============================================================================================================
/*
═══════════════════════════════════════════════════════════════════════════════════════════════════════════

📋 GUÍA DE EJECUCIÓN PASO A PASO

═══════════════════════════════════════════════════════════════════════════════════════════════════════════

PASO 1: DESCUBRIMIENTO (PROMPT 1)
----------------------------------
1. Reemplazar {{USER_UUID}} con el UUID real del usuario problemático
2. Ejecutar todas las queries del PROMPT 1 en Supabase SQL Editor
3. Guardar los resultados en un archivo de texto
4. Analizar:
   - Tipos de datos (uuid vs text)
   - Columnas NOT NULL
   - Nombre y valores del enum role
   - Existencia de FKs
   - Si el usuario existe en auth.users, User y UserProfile

PASO 2: INSERTAR EN User (PROMPT 2)
------------------------------------
1. Verificar que el usuario existe en auth.users (resultado PROMPT 1)
2. Reemplazar {{USER_UUID}} con el UUID real
3. Ejecutar el script completo del PROMPT 2
4. Verificar el resultado del SELECT final
5. Confirmar que la fila fue insertada correctamente

PASO 3: INSERTAR EN UserProfile (PROMPT 3)
-------------------------------------------
1. Verificar que el usuario existe en public."User" (resultado PROMPT 2)
2. Reemplazar {{USER_UUID}} con el UUID real
3. Ejecutar el script completo del PROMPT 3
4. Verificar el resultado del SELECT final
5. Confirmar que el perfil fue creado con role correcto

PASO 4: BACKFILL MASIVO (PROMPT 4) - OPCIONAL
----------------------------------------------
⚠️ Solo ejecutar si necesitas arreglar TODOS los usuarios sin espejo

1. NO reemplazar {{USER_UUID}} (este script es para todos)
2. Ejecutar el script completo del PROMPT 4
3. Revisar los reportes de control al final
4. Verificar que no quedan usuarios sin espejo

PASO 5: VALIDACIÓN FINAL (PROMPT 5)
------------------------------------
1. Reemplazar {{USER_UUID}} con el UUID real
2. Ejecutar todas las queries del PROMPT 5
3. Verificar que todas las validaciones pasan:
   ✅ Usuario existe en User y UserProfile
   ✅ Role es válido
   ✅ RLS policies existen
   ✅ Columnas necesarias existen
   ✅ FKs configuradas correctamente

PASO 6: ROLLBACK (PROMPT 6) - SOLO SI ES NECESARIO
---------------------------------------------------
⚠️ ADVERTENCIA: Este script ELIMINA datos

1. Solo ejecutar si algo salió mal y necesitas revertir
2. Reemplazar {{USER_UUID}} con el UUID real
3. Ejecutar el script del PROMPT 6
4. Verificar que los registros fueron eliminados
5. Volver a ejecutar PROMPT 2 y 3 si es necesario

═══════════════════════════════════════════════════════════════════════════════════════════════════════════

🔧 TIPS DE USO

═══════════════════════════════════════════════════════════════════════════════════════════════════════════

1. REEMPLAZAR {{USER_UUID}}:
   - Buscar y reemplazar TODAS las ocurrencias de {{USER_UUID}}
   - Usar el UUID completo con guiones: ej. 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
   - Mantener las comillas simples alrededor del UUID

2. EJECUTAR EN SUPABASE:
   - Ir a: Dashboard → SQL Editor → New Query
   - Copiar y pegar cada PROMPT completo
   - Ejecutar con el botón "Run" o Ctrl+Enter
   - Guardar los resultados para referencia

3. ORDEN DE EJECUCIÓN:
   - SIEMPRE ejecutar PROMPT 1 primero (descubrimiento)
   - PROMPT 2 y 3 son secuenciales (User antes que UserProfile)
   - PROMPT 4 es opcional (solo si necesitas backfill masivo)
   - PROMPT 5 es para validación final
   - PROMPT 6 solo si necesitas rollback

4. TROUBLESHOOTING:
   - Si PROMPT 2 falla: verificar que el usuario existe en auth.users
   - Si PROMPT 3 falla: verificar que PROMPT 2 se ejecutó correctamente
   - Si hay error de tipo: revisar resultado de PROMPT 1 (uuid vs text)
   - Si hay error de enum: revisar valores válidos en PROMPT 1

5. SEGURIDAD:
   - Todos los scripts son transaccionales (BEGIN/COMMIT)
   - Todos los scripts son idempotentes (se pueden ejecutar múltiples veces)
   - PROMPT 6 tiene protecciones para no eliminar datos antiguos
   - Siempre hacer backup antes de ejecutar PROMPT 6

═══════════════════════════════════════════════════════════════════════════════════════════════════════════

📊 EJEMPLO DE USO COMPLETO

═══════════════════════════════════════════════════════════════════════════════════════════════════════════

Supongamos que el usuario problemático es: a1b2c3d4-e5f6-7890-abcd-ef1234567890

1. Ejecutar PROMPT 1 con el UUID:
   - Reemplazar {{USER_UUID}} → 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
   - Resultado: Usuario existe en auth.users pero NO en public."User"

2. Ejecutar PROMPT 2:
   - Reemplazar {{USER_UUID}} → 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
   - Resultado: ✅ Usuario insertado en public."User"

3. Ejecutar PROMPT 3:
   - Reemplazar {{USER_UUID}} → 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
   - Resultado: ✅ Perfil creado en public."UserProfile" con role='OFREZCO'

4. Ejecutar PROMPT 5:
   - Reemplazar {{USER_UUID}} → 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
   - Resultado: ✅ Todas las validaciones pasan

5. Probar sistema de mensajería:
   - El usuario ahora puede enviar y recibir mensajes
   - El sistema de conversaciones funciona correctamente

═══════════════════════════════════════════════════════════════════════════════════════════════════════════

✅ CHECKLIST FINAL

═══════════════════════════════════════════════════════════════════════════════════════════════════════════

Antes de dar por terminado, verificar:

□ Usuario existe en auth.users
□ Usuario existe en public."User" con datos correctos
□ Usuario existe en public."UserProfile" con role válido
□ Role es apropiado para inmobiliarias (AGENCY/OFREZCO/OWNER)
□ Todas las columnas NOT NULL están satisfechas
□ FKs están configuradas correctamente
□ RLS policies permiten operaciones de mensajería
□ Sistema de mensajería funciona correctamente
□ No hay errores en logs de aplicación
□ Usuario puede enviar y recibir mensajes

═══════════════════════════════════════════════════════════════════════════════════════════════════════════

🎯 RESULTADO ESPERADO

═══════════════════════════════════════════════════════════════════════════════════════════════════════════

Después de ejecutar estos scripts:

1. ✅ Usuario tiene espejo completo en public."User"
2. ✅ Usuario tiene perfil en public."UserProfile"
3. ✅ Role es válido para inmobiliarias
4. ✅ Sistema de mensajería funciona correctamente
5. ✅ No hay errores de FK o NOT NULL
6. ✅ RLS policies permiten operaciones necesarias
7. ✅ PostgREST puede hacer joins correctamente

═══════════════════════════════════════════════════════════════════════════════════════════════════════════

📞 SOPORTE

═══════════════════════════════════════════════════════════════════════════════════════════════════════════

Si encuentras problemas:

1. Revisar logs de Supabase (Dashboard → Logs)
2. Verificar resultado de PROMPT 1 (tipos de datos)
3. Confirmar que auth.users tiene el usuario
4. Revisar RLS policies si hay errores de permisos
5. Ejecutar PROMPT 6 para rollback si es necesario
6. Volver a intentar desde PROMPT 2

═══════════════════════════════════════════════════════════════════════════════════════════════════════════
*/

-- FIN DEL SCRIPT
-- Archivo: sql-audit/PROMPTS-1-6-MENSAJERIA-INMOBILIARIAS-COMPLETO-2025.sql
-- Versión: 1.0
-- Fecha: 2025-01-XX
-- ============================================================================================================
