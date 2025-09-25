-- RESTAURAR AVATAR DEL USUARIO DE PRUEBA Y VALIDAR END-TO-END
-- Usuario de prueba: 6403f9d2-e846-4c70-87e0-e051127d9500

-- ==========================================
-- PASO 1: Verificar estado actual
-- ==========================================

SELECT 
    'ESTADO ACTUAL' as paso,
    user_id, 
    photos, 
    array_length(photos,1) as n_photos, 
    updated_at,
    CASE 
        WHEN photos IS NOT NULL AND array_length(photos,1) > 0 AND photos[1] IS NOT NULL 
        THEN '✅ TIENE AVATAR' 
        ELSE '❌ SIN AVATAR' 
    END as status
FROM public.user_profiles
WHERE user_id = '6403f9d2-e846-4c70-87e0-e051127d9500';

-- ==========================================
-- PASO 2: Verificar vista pública
-- ==========================================

SELECT 
    'VISTA PUBLICA' as paso,
    user_id,
    avatar_url,
    full_name,
    updated_at,
    CASE 
        WHEN avatar_url IS NOT NULL 
        THEN '✅ AVATAR EN VISTA' 
        ELSE '❌ SIN AVATAR EN VISTA' 
    END as status
FROM public.public_user_profiles
WHERE user_id = '6403f9d2-e846-4c70-87e0-e051127d9500';

-- ==========================================
-- PASO 3: Restaurar avatar si no existe
-- ==========================================

DO $$
DECLARE
    current_photos text[];
    test_user_id uuid := '6403f9d2-e846-4c70-87e0-e051127d9500';
    demo_avatar_url text := 'https://picsum.photos/200?random=' || extract(epoch from now())::text;
BEGIN
    -- Obtener photos actuales
    SELECT photos INTO current_photos
    FROM public.user_profiles
    WHERE user_id = test_user_id;

    -- Verificar si necesita avatar
    IF current_photos IS NULL OR array_length(current_photos, 1) IS NULL OR current_photos[1] IS NULL THEN
        RAISE NOTICE '🔄 Restaurando avatar para usuario de prueba...';
        
        -- Actualizar con avatar de prueba
        UPDATE public.user_profiles
        SET photos = ARRAY[demo_avatar_url]::text[], 
            updated_at = now()
        WHERE user_id = test_user_id;
        
        RAISE NOTICE '✅ Avatar restaurado: %', demo_avatar_url;
    ELSE
        RAISE NOTICE '✅ Usuario ya tiene avatar: %', current_photos[1];
    END IF;
END $$;

-- ==========================================
-- PASO 4: Verificación final
-- ==========================================

SELECT 
    'VERIFICACION FINAL - TABLA' as paso,
    user_id, 
    photos[1] as avatar_url,
    array_length(photos,1) as n_photos, 
    updated_at,
    CASE 
        WHEN photos IS NOT NULL AND array_length(photos,1) > 0 AND photos[1] IS NOT NULL 
        THEN '✅ AVATAR RESTAURADO' 
        ELSE '❌ FALLO RESTAURACION' 
    END as status
FROM public.user_profiles
WHERE user_id = '6403f9d2-e846-4c70-87e0-e051127d9500';

SELECT 
    'VERIFICACION FINAL - VISTA' as paso,
    user_id,
    avatar_url,
    full_name,
    updated_at,
    CASE 
        WHEN avatar_url IS NOT NULL 
        THEN '✅ AVATAR EN VISTA OK' 
        ELSE '❌ VISTA NO ACTUALIZADA' 
    END as status
FROM public.public_user_profiles
WHERE user_id = '6403f9d2-e846-4c70-87e0-e051127d9500';

-- ==========================================
-- PASO 5: Información para testing API
-- ==========================================

SELECT 
    'INFO PARA API TEST' as paso,
    'GET http://localhost:3000/api/users/avatar?userId=' || user_id as api_url,
    'Esperado: JSON con avatarUrl no nulo' as expected_result
FROM public.user_profiles
WHERE user_id = '6403f9d2-e846-4c70-87e0-e051127d9500';

-- ==========================================
-- INSTRUCCIONES DE VALIDACIÓN
-- ==========================================

/*
PRÓXIMOS PASOS PARA VALIDACIÓN COMPLETA:

1. EJECUTAR ESTE SCRIPT EN SUPABASE
   - Debe mostrar "✅ AVATAR RESTAURADO" y "✅ AVATAR EN VISTA OK"

2. VALIDAR API:
   GET http://localhost:3000/api/users/avatar?userId=6403f9d2-e846-4c70-87e0-e051127d9500
   - Esperado: Status 200
   - JSON: { "avatarUrl": "https://picsum.photos/200?random=...", "source": "supabase", ... }

3. VALIDAR UI:
   - /comunidad: Debe mostrar avatar en lugar de iniciales
   - /profile/inquilino: Debe mostrar avatar del usuario
   - Navbar: Avatar en dropdown si está logueado como este usuario

4. SI FALLA:
   - Verificar que public_user_profiles.avatar_url derive correctamente de user_profiles.photos[1]
   - Confirmar que la vista está actualizada
   - Revisar logs de consola en browser
*/
