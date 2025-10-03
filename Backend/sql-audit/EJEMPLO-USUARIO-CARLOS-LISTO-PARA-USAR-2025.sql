-- ============================================================================================================
-- SCRIPT LISTO PARA USAR - USUARIO CARLOS GONZÁLEZ
-- UUID: 6403f9d2-e846-4c70-87e0-e051127d9500
-- Email: cgonzalezarchilla@gmail.com
-- ============================================================================================================
-- ESTE SCRIPT YA TIENE EL UUID REEMPLAZADO - SOLO COPIAR Y PEGAR EN SUPABASE
-- ============================================================================================================

-- ============================================================================================================
-- PROMPT 2 — INSERTAR EN public."User"
-- ============================================================================================================

BEGIN;

DO $$
DECLARE
    v_user_exists boolean;
    v_auth_user_exists boolean;
    v_auth_user_id text;
BEGIN
    v_auth_user_id := '6403f9d2-e846-4c70-87e0-e051127d9500';
    
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
                split_part(au.email, '@', 1),
                'Carlos González'
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
WHERE id = '6403f9d2-e846-4c70-87e0-e051127d9500';

COMMIT;


-- ============================================================================================================
-- PROMPT 3 — CREAR public."UserProfile"
-- ============================================================================================================

BEGIN;

DO $$
DECLARE
    v_profile_exists boolean;
    v_user_exists boolean;
    v_user_id text;
    v_profile_id text;
BEGIN
    v_user_id := '6403f9d2-e846-4c70-87e0-e051127d9500';
    
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
        -- Generar ID para el perfil
        v_profile_id := gen_random_uuid()::text;
        
        RAISE NOTICE 'Generando perfil con ID: %', v_profile_id;
        
        -- Insertar UserProfile con CAST explícito al enum
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
WHERE "userId" = '6403f9d2-e846-4c70-87e0-e051127d9500';

COMMIT;


-- ============================================================================================================
-- PROMPT 5 — VALIDACIÓN FINAL
-- ============================================================================================================

-- Verificar Usuario en User
SELECT 
    '1. Usuario en User' as verificacion,
    CASE 
        WHEN EXISTS (SELECT 1 FROM public."User" WHERE id = '6403f9d2-e846-4c70-87e0-e051127d9500')
        THEN '✅ EXISTE'
        ELSE '❌ NO EXISTE'
    END as status,
    (SELECT email FROM public."User" WHERE id = '6403f9d2-e846-4c70-87e0-e051127d9500') as email,
    (SELECT name FROM public."User" WHERE id = '6403f9d2-e846-4c70-87e0-e051127d9500') as name;

-- Verificar Usuario en UserProfile
SELECT 
    '2. Usuario en UserProfile' as verificacion,
    CASE 
        WHEN EXISTS (SELECT 1 FROM public."UserProfile" WHERE "userId" = '6403f9d2-e846-4c70-87e0-e051127d9500')
        THEN '✅ EXISTE'
        ELSE '❌ NO EXISTE'
    END as status,
    (SELECT role::text FROM public."UserProfile" WHERE "userId" = '6403f9d2-e846-4c70-87e0-e051127d9500') as role,
    (SELECT city FROM public."UserProfile" WHERE "userId" = '6403f9d2-e846-4c70-87e0-e051127d9500') as city;

-- Verificar role
SELECT 
    up.role::text as role_actual,
    CASE 
        WHEN up.role::text IN ('OFREZCO', 'BUSCO')
        THEN '✅ VÁLIDO'
        ELSE '⚠️ VALOR INESPERADO'
    END as validacion,
    'Para inmobiliarias se usa: OFREZCO' as nota
FROM public."UserProfile" up
WHERE up."userId" = '6403f9d2-e846-4c70-87e0-e051127d9500';

-- Resumen final
SELECT 
    '✅ SISTEMA LISTO' as status,
    (SELECT COUNT(*) FROM public."User" WHERE id = '6403f9d2-e846-4c70-87e0-e051127d9500') as user_exists,
    (SELECT COUNT(*) FROM public."UserProfile" WHERE "userId" = '6403f9d2-e846-4c70-87e0-e051127d9500') as profile_exists,
    (SELECT role::text FROM public."UserProfile" WHERE "userId" = '6403f9d2-e846-4c70-87e0-e051127d9500') as user_role;


-- ============================================================================================================
-- INSTRUCCIONES DE USO
-- ============================================================================================================
/*
ESTE SCRIPT ESTÁ LISTO PARA USAR - NO NECESITAS REEMPLAZAR NADA

1. Copiar PROMPT 2 completo (desde BEGIN hasta COMMIT)
2. Pegar en Supabase SQL Editor
3. Ejecutar
4. Verificar que dice "✅ Usuario insertado"

5. Copiar PROMPT 3 completo (desde BEGIN hasta COMMIT)
6. Pegar en Supabase SQL Editor
7. Ejecutar
8. Verificar que dice "✅ UserProfile creado"

9. Copiar PROMPT 5 completo (todas las queries)
10. Pegar en Supabase SQL Editor
11. Ejecutar
12. Verificar que todo dice "✅ EXISTE"

RESULTADO ESPERADO:
- Usuario Carlos González en public."User"
- Perfil en public."UserProfile" con role='OFREZCO'
- Sistema de mensajería funcionando
*/

-- FIN DEL SCRIPT
-- ============================================================================================================
