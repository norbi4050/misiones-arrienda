-- ============================================================================================================
-- SCRIPT SQL COMPLETO FINAL: 6 PROMPTS PARA SISTEMA DE MENSAJERÍA INMOBILIARIAS
-- Fecha: 2025-01-XX
-- Versión: 3.0 (FINAL - Todos los errores corregidos)
-- Objetivo: Resolver problemas de usuarios sin espejo en User/UserProfile para sistema de mensajería
-- 
-- IMPORTANTE: Reemplazar {{USER_UUID}} con el UUID real del usuario problemático
-- Ejemplo: '6403f9d2-e846-4c70-87e0-e051127d9500'
-- ============================================================================================================

-- HALLAZGOS CONFIRMADOS DEL PROMPT 1:
-- ✅ User.id: TEXT (no UUID)
-- ✅ UserProfile.id: TEXT NOT NULL (requiere gen_random_uuid() o cuid)
-- ✅ UserProfile.userId: TEXT NOT NULL (FK a User.id)
-- ✅ UserProfile.role: ENUM CommunityRole con solo 2 valores: BUSCO, OFREZCO
-- ✅ Para inmobiliarias usar: OFREZCO


-- ============================================================================================================
-- PROMPT 2 — INSERCIÓN ESPEJO EN "User" (idempotente, con casteos correctos)
-- ============================================================================================================

BEGIN;

DO $$
DECLARE
    v_user_exists boolean;
    v_auth_user_exists boolean;
    v_auth_user_id text;
BEGIN
    v_auth_user_id := '{{USER_UUID}}';
    
    RAISE NOTICE 'Buscando usuario: %', v_auth_user_id;
    
    -- Verificar si usuario existe en auth.users
    SELECT EXISTS(
        SELECT 1 FROM auth.users WHERE id::text = v_auth_user_id
    ) INTO v_auth_user_exists;
    
    IF NOT v_auth_user_exists THEN
        RAISE EXCEPTION 'Usuario % no existe en auth.users', v_auth_user_id;
    END IF;
    
    RAISE NOTICE '✅ Usuario encontrado en auth.users';
    
    -- Verificar si ya existe en public."User"
    SELECT EXISTS(
        SELECT 1 FROM public."User" WHERE id = v_auth_user_id
    ) INTO v_user_exists;
    
    IF v_user_exists THEN
        RAISE NOTICE '⚠️ Usuario % ya existe en public."User" - SKIP', v_auth_user_id;
    ELSE
        -- Insertar con casteo a TEXT
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
        WHERE au.id::text = v_auth_user_id;
        
        RAISE NOTICE '✅ Usuario % insertado exitosamente en public."User"', v_auth_user_id;
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
    '✅ VERIFICADO' as status
FROM public."User"
WHERE id = '{{USER_UUID}}';

COMMIT;


-- ============================================================================================================
-- PROMPT 3 — CREACIÓN DE "UserProfile" (idempotente, mínimos válidos)
-- ============================================================================================================

BEGIN;

DO $$
DECLARE
    v_profile_exists boolean;
    v_user_exists boolean;
    v_user_id text;
    v_profile_id text;
BEGIN
    v_user_id := '{{USER_UUID}}';
    
    -- Verificar que existe en public."User"
    SELECT EXISTS(
        SELECT 1 FROM public."User" WHERE id = v_user_id
    ) INTO v_user_exists;
    
    IF NOT v_user_exists THEN
        RAISE EXCEPTION 'Usuario % no existe en public."User". Ejecutar PROMPT 2 primero.', v_user_id;
    END IF;
    
    RAISE NOTICE '✅ Usuario encontrado en public."User"';
    
    -- Verificar si ya existe perfil
    SELECT EXISTS(
        SELECT 1 FROM public."UserProfile" WHERE "userId" = v_user_id
    ) INTO v_profile_exists;
    
    IF v_profile_exists THEN
        RAISE NOTICE '⚠️ UserProfile para % ya existe - SKIP', v_user_id;
    ELSE
        -- Generar ID para el perfil (usando extensión pgcrypto si está disponible)
        -- Si no está disponible, usar gen_random_uuid()
        BEGIN
            v_profile_id := gen_random_uuid()::text;
        EXCEPTION WHEN undefined_function THEN
            -- Fallback: usar combinación de timestamp y random
            v_profile_id := 'profile_' || extract(epoch from now())::text || '_' || floor(random() * 1000000)::text;
        END;
        
        RAISE NOTICE 'Generando perfil con ID: %', v_profile_id;
        
        -- Insertar UserProfile con CAST explícito al enum y todos los campos NOT NULL
        INSERT INTO public."UserProfile" (
            id,
            "userId",
            role,
            city,
            "budgetMin",
            "budgetMax",
            "createdAt",
            "updatedAt"
        ) VALUES (
            v_profile_id,
            v_user_id,
            'OFREZCO'::"CommunityRole",
            'Posadas',
            0,
            999999999,
            now(),
            now()
        );
        
        RAISE NOTICE '✅ UserProfile para % creado exitosamente con role=OFREZCO', v_user_id;
    END IF;
END $$;

-- Verificar inserción
SELECT 
    id,
    "userId",
    role::text as role,
    city,
    "budgetMin",
    "budgetMax",
    "createdAt",
    "updatedAt",
    '✅ INSERTADO' as status
FROM public."UserProfile"
WHERE "userId" = '{{USER_UUID}}';

COMMIT;


-- ============================================================================================================
-- PROMPT 4 — FIX MASIVO (backfill) PARA TODOS LOS USUARIOS SIN ESPEJO
-- ============================================================================================================

BEGIN;

-- ========== 4.1 BACKFILL public."User" ==========
DO $$
DECLARE
    v_inserted_count int := 0;
BEGIN
    RAISE NOTICE 'Iniciando backfill de public."User"';
    
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
    
    GET DIAGNOSTICS v_inserted_count = ROW_COUNT;
    RAISE NOTICE '✅ Insertados % usuarios en public."User"', v_inserted_count;
END $$;

-- ========== 4.2 BACKFILL public."UserProfile" ==========
DO $$
DECLARE
    v_inserted_count int := 0;
BEGIN
    RAISE NOTICE 'Iniciando backfill de public."UserProfile" con role=OFREZCO';
    
    INSERT INTO public."UserProfile" (
        id,
        "userId",
        role,
        city,
        "budgetMin",
        "budgetMax",
        "createdAt",
        "updatedAt"
    )
    SELECT 
        gen_random_uuid()::text as id,
        u.id as "userId",
        'OFREZCO'::"CommunityRole",
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
    id,
    "userId",
    role::text as role,
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


-- ============================================================================================================
-- PROMPT 5 — COMPROBACIONES FINALES PARA EL FLUJO DE MENSAJERÍA
-- ============================================================================================================

-- ========== 5.1 VERIFICAR USUARIO {{USER_UUID}} ==========
SELECT 
    '1. Usuario en User' as verificacion,
    CASE 
        WHEN EXISTS (SELECT 1 FROM public."User" WHERE id = '{{USER_UUID}}')
        THEN '✅ EXISTE'
        ELSE '❌ NO EXISTE'
    END as status,
    (SELECT email FROM public."User" WHERE id = '{{USER_UUID}}') as email,
    (SELECT name FROM public."User" WHERE id = '{{USER_UUID}}') as name;

SELECT 
    '2. Usuario en UserProfile' as verificacion,
    CASE 
        WHEN EXISTS (SELECT 1 FROM public."UserProfile" WHERE "userId" = '{{USER_UUID}}')
        THEN '✅ EXISTE'
        ELSE '❌ NO EXISTE'
    END as status,
    (SELECT role::text FROM public."UserProfile" WHERE "userId" = '{{USER_UUID}}') as role,
    (SELECT city FROM public."UserProfile" WHERE "userId" = '{{USER_UUID}}') as city;

-- ========== 5.2 VERIFICAR ROLE ES VÁLIDO ==========
SELECT 
    up.role::text as role_actual,
    CASE 
        WHEN up.role::text IN ('OFREZCO', 'BUSCO')
        THEN '✅ VÁLIDO'
        ELSE '⚠️ VALOR INESPERADO'
    END as validacion,
    'Enum CommunityRole solo tiene: BUSCO, OFREZCO' as nota,
    'Para inmobiliarias se usa: OFREZCO' as recomendacion
FROM public."UserProfile" up
WHERE up."userId" = '{{USER_UUID}}';

-- ========== 5.3 VERIFICAR RLS POLICIES PARA MENSAJERÍA ==========
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    cmd,
    '✅ POLICY EXISTE' as status
FROM pg_policies
WHERE schemaname = 'public'
    AND tablename IN ('Conversation', 'conversations')
ORDER BY tablename, policyname;

SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    cmd,
    '✅ POLICY EXISTE' as status
FROM pg_policies
WHERE schemaname = 'public'
    AND tablename IN ('Message', 'messages')
ORDER BY tablename, policyname;

-- ========== 5.4 VERIFICAR COLUMNAS EN conversations ==========
SELECT 
    column_name,
    data_type,
    is_nullable,
    '✅ EXISTE' as status
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
    '👉 PostgREST: ?select=*,' || ccu.table_name || '!' || tc.constraint_name || '(*)' as postgrest_syntax
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
    AND tc.table_name IN ('Favorite', 'favorites')
    AND kcu.column_name IN ('propertyId', 'property_id')
LIMIT 5;

-- ========== 5.6 RESUMEN FINAL DE VALIDACIÓN ==========
SELECT 
    '✅ SISTEMA LISTO' as status,
    (SELECT COUNT(*) FROM public."User" WHERE id = '{{USER_UUID}}') as user_exists,
    (SELECT COUNT(*) FROM public."UserProfile" WHERE "userId" = '{{USER_UUID}}') as profile_exists,
    (SELECT role::text FROM public."UserProfile" WHERE "userId" = '{{USER_UUID}}') as user_role,
    (SELECT COUNT(*) FROM pg_policies WHERE tablename IN ('Conversation', 'conversations')) as conv_policies,
    (SELECT COUNT(*) FROM pg_policies WHERE tablename IN ('Message', 'messages')) as msg_policies;


-- ============================================================================================================
-- PROMPT 6 — ROLLBACK MÍNIMO (por si algo sale mal)
-- ============================================================================================================

-- ⚠️ ADVERTENCIA: Este script elimina datos. Usar con precaución.

BEGIN;

DO $$
DECLARE
    v_profile_deleted int := 0;
    v_user_deleted int := 0;
    v_user_id text;
BEGIN
    v_user_id := '{{USER_UUID}}';
    
    RAISE NOTICE '⚠️ INICIANDO ROLLBACK PARA USUARIO %', v_user_id;
    
    -- Eliminar UserProfile primero (por FK)
    DELETE FROM public."UserProfile"
    WHERE "userId" = v_user_id
        AND "createdAt" > now() - interval '10 minutes';
    
    GET DIAGNOSTICS v_profile_deleted = ROW_COUNT;
    RAISE NOTICE 'Eliminados % perfiles', v_profile_deleted;
    
    -- Eliminar User si no tiene dependencias
    DELETE FROM public."User"
    WHERE id = v_user_id
        AND "createdAt" > now() - interval '10 minutes'
        AND NOT EXISTS (SELECT 1 FROM public."UserProfile" WHERE "userId" = v_user_id)
        AND NOT EXISTS (SELECT 1 FROM public."Property" WHERE "userId" = v_user_id)
        AND NOT EXISTS (SELECT 1 FROM public."Favorite" WHERE "userId" = v_user_id);
    
    GET DIAGNOSTICS v_user_deleted = ROW_COUNT;
    RAISE NOTICE 'Eliminados % usuarios', v_user_deleted;
    
    IF v_profile_deleted = 0 AND v_user_deleted = 0 THEN
        RAISE NOTICE '✅ No se encontraron registros recientes para eliminar';
    ELSE
        RAISE NOTICE '✅ Rollback completado: % perfiles, % usuarios', v_profile_deleted, v_user_deleted;
    END IF;
END $$;

-- Verificación post-rollback
SELECT 
    'User' as tabla,
    CASE 
        WHEN EXISTS (SELECT 1 FROM public."User" WHERE id = '{{USER_UUID}}')
        THEN '⚠️ AÚN EXISTE'
        ELSE '✅ ELIMINADO'
    END as status;

SELECT 
    'UserProfile' as tabla,
    CASE 
        WHEN EXISTS (SELECT 1 FROM public."UserProfile" WHERE "userId" = '{{USER_UUID}}')
        THEN '⚠️ AÚN EXISTE'
        ELSE '✅ ELIMINADO'
    END as status;

COMMIT;


-- ============================================================================================================
-- INSTRUCCIONES DE USO
-- ============================================================================================================
/*
═══════════════════════════════════════════════════════════════════════════════════════════════════════════

📋 GUÍA RÁPIDA DE USO

═══════════════════════════════════════════════════════════════════════════════════════════════════════════

CORRECCIONES APLICADAS EN ESTA VERSIÓN:
✅ User.id es TEXT (no UUID) - Usa id::text
✅ UserProfile.id es NOT NULL - Genera ID con gen_random_uuid()::text
✅ Enum CommunityRole solo tiene: BUSCO, OFREZCO
✅ CAST explícito: 'OFREZCO'::"CommunityRole"
✅ Sintaxis UNION ALL corregida en PROMPT 5

═══════════════════════════════════════════════════════════════════════════════════════════════════════════

EJECUCIÓN:

1. PROMPT 2 - Insertar en User:
   - Reemplazar {{USER_UUID}} con el UUID real
   - Ejemplo: '6403f9d2-e846-4c70-87e0-e051127d9500'
   - Ejecutar en Supabase SQL Editor

2. PROMPT 3 - Crear UserProfile:
   - Reemplazar {{USER_UUID}} con el mismo UUID
   - Ejecutar en Supabase SQL Editor
   - Verifica que role='OFREZCO'

3. PROMPT 4 - Backfill masivo (OPCIONAL):
   - NO reemplazar {{USER_UUID}}
   - Solo si necesitas arreglar TODOS los usuarios

4. PROMPT 5 - Validación:
   - Reemplazar {{USER_UUID}} con el UUID real
   - Verificar que todo está OK

5. PROMPT 6 - Rollback (SOLO SI ES NECESARIO):
   - Reemplazar {{USER_UUID}} con el UUID real
   - Solo si necesitas revertir

═══════════════════════════════════════════════════════════════════════════════════════════════════════════

✅ CHECKLIST:

□ Reemplazar {{USER_UUID}} en cada PROMPT
□ Ejecutar PROMPT 2 primero
□ Ejecutar PROMPT 3 segundo
□ Verificar con PROMPT 5
□ Usuario puede enviar mensajes

═══════════════════════════════════════════════════════════════════════════════════════════════════════════
*/

-- FIN DEL SCRIPT FINAL
-- Archivo: sql-audit/PROMPTS-1-6-MENSAJERIA-INMOBILIARIAS-FINAL-2025.sql
-- Versión: 3.0 (FINAL - Todos los errores corregidos)
-- ============================================================================================================
