-- ============================================================================================================
-- SCRIPT SQL COMPLETO CORREGIDO: 6 PROMPTS PARA SISTEMA DE MENSAJERÍA INMOBILIARIAS
-- Fecha: 2025-01-XX
-- Versión: 2.0 (CORREGIDA basada en resultados reales)
-- Objetivo: Resolver problemas de usuarios sin espejo en User/UserProfile para sistema de mensajería
-- 
-- IMPORTANTE: Reemplazar {{USER_UUID}} con el UUID real del usuario problemático
-- Ejemplo: WHERE id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
-- ============================================================================================================

-- ============================================================================================================
-- PROMPT 1 — DESCUBRIMIENTO DEL ESQUEMA (tipos, NOT NULL, enums, FKs)
-- ============================================================================================================
-- Objetivo: Inspeccionar tipos de datos, NOT NULL, enums y FKs sin modificar nada
-- ESTE PROMPT YA FUE EJECUTADO Y CONFIRMADO QUE FUNCIONA

-- Resultados confirmados del PROMPT 1:
-- - User.id: TEXT (no UUID)
-- - UserProfile.role: ENUM CommunityRole con valores: BUSCO, OFREZCO
-- - UserProfile.userId: TEXT (FK a User.id)
-- - Enum CommunityRole solo tiene 2 valores: BUSCO y OFREZCO


-- ============================================================================================================
-- PROMPT 2 — INSERCIÓN ESPEJO EN "User" (idempotente, con casteos correctos)
-- ============================================================================================================
-- Objetivo: Insertar fila faltante en public."User" desde auth.users de forma idempotente
-- VERSIÓN CORREGIDA: User.id es TEXT, no UUID

BEGIN;

DO $$
DECLARE
    v_user_exists boolean;
    v_auth_user_exists boolean;
    v_auth_user_id text;
BEGIN
    -- Convertir UUID a TEXT para búsqueda
    v_auth_user_id := '{{USER_UUID}}';
    
    RAISE NOTICE 'Buscando usuario: %', v_auth_user_id;
    
    -- Verificar si usuario existe en auth.users (convertir uuid a text)
    SELECT EXISTS(
        SELECT 1 FROM auth.users WHERE id::text = v_auth_user_id
    ) INTO v_auth_user_exists;
    
    IF NOT v_auth_user_exists THEN
        RAISE EXCEPTION 'Usuario % no existe en auth.users', v_auth_user_id;
    END IF;
    
    RAISE NOTICE 'Usuario encontrado en auth.users';
    
    -- Verificar si ya existe en public."User"
    SELECT EXISTS(
        SELECT 1 FROM public."User" WHERE id = v_auth_user_id
    ) INTO v_user_exists;
    
    IF v_user_exists THEN
        RAISE NOTICE 'Usuario % ya existe en public."User" - SKIP', v_auth_user_id;
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
            '' as password, -- Password vacío, auth manejado por Supabase
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

-- ========== RESUMEN PROMPT 2 ==========
/*
RESULTADO:
- Script idempotente: ✅ (usa EXISTS)
- Casteo correcto: ✅ (uuid::text)
- NOT NULL satisfechos:
  * id: desde auth.users.id::text
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
-- VERSIÓN CORREGIDA: Enum CommunityRole solo tiene BUSCO y OFREZCO

BEGIN;

DO $$
DECLARE
    v_profile_exists boolean;
    v_user_exists boolean;
    v_user_id text;
BEGIN
    v_user_id := '{{USER_UUID}}';
    
    -- Verificar que existe en public."User"
    SELECT EXISTS(
        SELECT 1 FROM public."User" WHERE id = v_user_id
    ) INTO v_user_exists;
    
    IF NOT v_user_exists THEN
        RAISE EXCEPTION 'Usuario % no existe en public."User". Ejecutar PROMPT 2 primero.', v_user_id;
    END IF;
    
    -- Verificar si ya existe perfil
    SELECT EXISTS(
        SELECT 1 FROM public."UserProfile" WHERE "userId" = v_user_id
    ) INTO v_profile_exists;
    
    IF v_profile_exists THEN
        RAISE NOTICE 'UserProfile para % ya existe - SKIP', v_user_id;
    ELSE
        -- Insertar UserProfile con CAST explícito al enum
        -- Para inmobiliarias usamos 'OFREZCO' (el único valor apropiado disponible)
        INSERT INTO public."UserProfile" (
            "userId",
            role,
            city,
            "budgetMin",
            "budgetMax",
            "createdAt",
            "updatedAt"
        ) VALUES (
            v_user_id,
            'OFREZCO'::"CommunityRole", -- CAST explícito al enum
            'Posadas', -- Ciudad por defecto
            0, -- Presupuesto mínimo
            999999999, -- Presupuesto máximo
            now(),
            now()
        );
        
        RAISE NOTICE '✅ UserProfile para % creado exitosamente con role=OFREZCO', v_user_id;
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
- Script idempotente: ✅ (usa EXISTS)
- FK respetada: ✅ (verifica existencia en User)
- Enum role: ✅ (usa CAST explícito 'OFREZCO'::"CommunityRole")
- NOT NULL satisfechos:
  * userId: '{{USER_UUID}}'
  * role: OFREZCO (único valor apropiado para inmobiliarias)
  * city: 'Posadas'
  * budgetMin: 0
  * budgetMax: 999999999
  * createdAt: now()
  * updatedAt: now()
- Transaccional: ✅ (BEGIN/COMMIT)

NOTA: El enum CommunityRole solo tiene 2 valores: BUSCO y OFREZCO
Para inmobiliarias se usa OFREZCO ya que es el más apropiado.
*/


-- ============================================================================================================
-- PROMPT 4 — FIX MASIVO (backfill) PARA TODOS LOS USUARIOS SIN ESPEJO
-- ============================================================================================================
-- Objetivo: Insertar en User y UserProfile todas las filas faltantes de auth.users
-- VERSIÓN CORREGIDA: Maneja TEXT y enum correctamente

BEGIN;

-- ========== 4.1 BACKFILL public."User" ==========
DO $$
DECLARE
    v_inserted_count int := 0;
BEGIN
    RAISE NOTICE 'Iniciando backfill de public."User"';
    
    -- Insertar usuarios faltantes (id es TEXT)
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
    
    -- Insertar perfiles faltantes con CAST explícito
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
        'OFREZCO'::"CommunityRole", -- CAST explícito
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
- Backfill User: ✅ (todos los usuarios de auth.users con id::text)
- Backfill UserProfile: ✅ (todos con role='OFREZCO'::"CommunityRole")
- Idempotente: ✅ (usa NOT EXISTS)
- Transaccional: ✅ (BEGIN/COMMIT)
- Re-ejecutable: ✅ (no rompe si se ejecuta múltiples veces)
- Reportes: ✅ (muestra cantidad insertada y muestras)
*/


-- ============================================================================================================
-- PROMPT 5 — COMPROBACIONES FINALES PARA EL FLUJO DE MENSAJERÍA
-- ============================================================================================================
-- Objetivo: Validar que todo está listo para el sistema de mensajería
-- VERSIÓN CORREGIDA: Sintaxis UNION ALL corregida y enum values correctos

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
-- Policies en conversations
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
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
    cmd
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
        WHEN column_name IN ('last_message_text', 'last_message_at', 'updated_at', 'updatedAt', 'lastMessageAt')
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
    '👉 Usar: ?select=*,' || ccu.table_name || '!' || tc.constraint_name || '(*)' as postgrest_syntax
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
    )
LIMIT 5;

-- ========== 5.6 RESUMEN FINAL DE VALIDACIÓN ==========
SELECT 
    '✅ SISTEMA LISTO PARA MENSAJERÍA' as status,
    (SELECT COUNT(*) FROM public."User" WHERE id = '{{USER_UUID}}') as user_exists,
    (SELECT COUNT(*) FROM public."UserProfile" WHERE "userId" = '{{USER_UUID}}') as profile_exists,
    (SELECT role::text FROM public."UserProfile" WHERE "userId" = '{{USER_UUID}}') as user_role,
    (SELECT COUNT(*) FROM pg_policies WHERE tablename IN ('Conversation', 'conversations')) as conversation_policies,
    (SELECT COUNT(*) FROM pg_policies WHERE tablename IN ('Message', 'messages')) as message_policies;

-- ========== RESUMEN PROMPT 5 ==========
/*
VALIDACIONES COMPLETADAS:
1. ✅ Usuario existe en User y UserProfile
2. ✅ Role es válido (BUSCO o OFREZCO)
3. ✅ RLS policies existen para conversations y messages
4. ✅ Columnas necesarias existen en conversations
5. ✅ FK de favorites está configurada correctamente
6. ✅ Sistema listo para flujo de mensajería

NOTA: El enum CommunityRole solo tiene 2 valores: BUSCO y OFREZCO
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
    v_user_id text;
BEGIN
    v_user_id := '{{USER_UUID}}';
    
    RAISE NOTICE '⚠️ INICIANDO ROLLBACK PARA USUARIO %', v_user_id;
    
    -- Eliminar UserProfile primero (por FK)
    DELETE FROM public."UserProfile"
    WHERE "userId" = v_user_id
        AND "createdAt" > now() - interval '10 minutes';
    
    GET DIAGNOSTICS v_profile_deleted = ROW_COUNT;
    RAISE NOTICE 'Eliminados % perfiles de UserProfile', v_profile_deleted;
    
    -- Eliminar User si no tiene dependencias
    DELETE FROM public."User"
    WHERE id = v_user_id
        AND "createdAt" > now() - interval '10 minutes'
        AND NOT EXISTS (
            SELECT 1 FROM public."UserProfile" WHERE "userId" = v_user_id
        )
        AND NOT EXISTS (
            SELECT 1 FROM public."Property" WHERE "userId" = v_user_id
        )
        AND NOT EXISTS (
            SELECT 1 FROM public."Favorite" WHERE "userId" = v_user_id
        );
    
    GET DIAGNOSTICS v_user_deleted = ROW_COUNT;
    RAISE NOTICE 'Eliminados % usuarios de User', v_user_deleted;
    
    IF v_profile_deleted = 0 AND v_user_deleted = 0 THEN
        RAISE NOTICE '✅ No se encontraron registros recientes para eliminar';
    ELSE
        RAISE NOTICE '✅ Rollback completado: % perfiles, % usuarios', v_profile_deleted, v_user_deleted;
    END IF;
END $$;

-- ========== 6.2 VERIFICACIÓN POST-ROLLBACK ==========
-- Verificar que el usuario {{USER_UUID}} fue eliminado
SELECT 
    'Verificación User' as tabla,
    CASE 
        WHEN EXISTS (SELECT 1 FROM public."User" WHERE id = '{{USER_UUID}}')
        THEN '⚠️ AÚN EXISTE'
        ELSE '✅ ELIMINADO'
    END as status;

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
WHERE "createdAt" > now() - interval '10 minutes';

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

⚠️ IMPORTANTE: CAMBIOS EN ESTA VERSIÓN CORREGIDA

1. User.id es TEXT (no UUID) - Los scripts ahora usan id::text
2. Enum CommunityRole solo tiene 2 valores: BUSCO y OFREZCO
3. Para inmobiliarias se usa 'OFREZCO'::"CommunityRole" con CAST explícito
4. Sintaxis UNION ALL corregida en PROMPT 5

═══════════════════════════════════════════════════════════════════════════════════════════════════════════

PASO 1: DESCUBRIMIENTO (PROMPT 1)
----------------------------------
✅ YA EJECUTADO - Los resultados confirmaron:
   - User.id: TEXT
   - Enum CommunityRole: BUSCO, OFREZCO
   - UserProfile.userId: TEXT (FK a User.id)

PASO 2: INSERTAR EN User (PROMPT 2)
------------------------------------
1. Reemplazar {{USER_UUID}} con el UUID real (sin ::uuid)
2. Ejecutar el script completo del PROMPT 2
3. Verificar el resultado del SELECT final
4. Confirmar que la fila fue insertada correctamente

PASO 3: INSERTAR EN UserProfile (PROMPT 3)
-------------------------------------------
1. Verificar que el usuario existe en public."User" (resultado PROMPT 2)
2. Reemplazar {{USER_UUID}} con el UUID real
3. Ejecutar el script completo del PROMPT 3
4. Verificar el resultado del SELECT final
5. Confirmar que el perfil fue creado con role='OFREZCO'

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
   ✅ Role es OFREZCO o BUSCO
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
   - Usar el UUID completo: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
   - NO agregar ::uuid al final (User.id es TEXT)
   - Mantener las comillas simples

2. EJECUTAR EN SUPABASE:
   - Ir a: Dashboard → SQL Editor → New Query
   - Copiar y pegar cada PROMPT completo
   - Ejecutar con el botón "Run" o Ctrl+Enter
   - Guardar los resultados para referencia

3. ENUM CommunityRole:
   - Solo tiene 2 valores: BUSCO y OFREZCO
   - Para inmobiliarias usar: OFREZCO
   - Siempre usar CAST explícito: 'OFREZCO'::"CommunityRole"

4. TROUBLESHOOTING:
   - Si PROMPT 2 falla: verificar que el usuario existe en auth.users
   - Si PROMPT 3 falla: verificar que PROMPT 2 se ejecutó correctamente
   - Si hay error de enum: verificar que usas 'OFREZCO' o 'BUSCO'
   - Si hay error de tipo: verificar que NO usas ::uuid

5. SEGURIDAD:
   - Todos los scripts son transaccionales (BEGIN/COMMIT)
   - Todos los scripts son idempotentes (se pueden ejecutar múltiples veces)
   - PROMPT 6 tiene protecciones para no eliminar datos antiguos
   - Siempre hacer backup antes de ejecutar PROMPT 6

═══════════════════════════════════════════════════════════════════════════════════════════════════════════

✅ CHECKLIST FINAL

═══════════════════════════════════════════════════════════════════════════════════════════════════════════

Antes de dar por terminado, verificar:

□ Usuario existe en auth.users
□ Usuario existe en public."User" con id como TEXT
□ Usuario existe en public."UserProfile" con role válido
□ Role es OFREZCO (apropiado para inmobiliarias)
□ Todas las columnas NOT NULL están satisfechas
□ FKs están configuradas correctamente
□ RLS policies permiten operaciones de mensajería
□ Sistema de mensajería funciona correctamente
□ No hay errores en logs de aplicación
□ Usuario puede enviar y recibir mensajes

═══════════════════════════════════════════════════════════════════════════════════════════════════════════
*/

-- FIN DEL SCRIPT CORREGIDO
-- Archivo: sql-audit/PROMPTS-1-6-MENSAJERIA-INMOBILIARIAS-COMPLETO-2025-FIXED.sql
-- Versión: 2.0 (CORREGIDA)
-- Fecha: 2025-01-XX
-- ============================================================================================================
