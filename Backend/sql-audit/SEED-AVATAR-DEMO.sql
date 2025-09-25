-- SEED Avatar Demo - Solo para entorno de desarrollo
-- Asigna un avatar demo a un usuario específico por user_id

-- ==========================================
-- CONFIGURACIÓN - CAMBIAR ESTE USER_ID
-- ==========================================
-- Reemplazar con el UUID del usuario de prueba
\set target_user_id '00000000-0000-0000-0000-000000000000'

-- ==========================================
-- DETECCIÓN AUTOMÁTICA DEL TIPO DE COLUMNA
-- ==========================================

DO $$
DECLARE
    column_type text;
    target_user_uuid uuid := :'target_user_id';
    demo_avatar_url text := 'https://picsum.photos/200?random=' || extract(epoch from now())::text;
BEGIN
    -- Detectar tipo de columna 'photos' en public.user_profiles
    SELECT data_type INTO column_type
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'user_profiles'
      AND column_name = 'photos';

    -- Verificar que el usuario existe
    IF NOT EXISTS (SELECT 1 FROM public.user_profiles WHERE id = target_user_uuid) THEN
        RAISE NOTICE 'Usuario % no encontrado en user_profiles', target_user_uuid;
        RETURN;
    END IF;

    -- Aplicar seed según el tipo de columna
    IF column_type = 'ARRAY' OR column_type = 'text[]' THEN
        -- Caso: photos es text[]
        RAISE NOTICE 'Detectado tipo ARRAY/text[] - Usando array[URL]';
        
        UPDATE public.user_profiles
        SET photos = ARRAY[demo_avatar_url],
            updated_at = now()
        WHERE id = target_user_uuid;
        
        RAISE NOTICE 'Avatar demo asignado (ARRAY): %', demo_avatar_url;
        
    ELSIF column_type = 'jsonb' OR column_type = 'json' THEN
        -- Caso: photos es jsonb
        RAISE NOTICE 'Detectado tipo JSONB/JSON - Usando jsonb array';
        
        UPDATE public.user_profiles
        SET photos = jsonb_build_array(demo_avatar_url),
            updated_at = now()
        WHERE id = target_user_uuid;
        
        RAISE NOTICE 'Avatar demo asignado (JSONB): %', demo_avatar_url;
        
    ELSE
        -- Tipo no reconocido
        RAISE NOTICE 'Tipo de columna no reconocido: %. Tipos soportados: ARRAY, text[], jsonb, json', column_type;
        RETURN;
    END IF;

    -- Verificar que se aplicó correctamente
    DECLARE
        updated_photos text;
    BEGIN
        SELECT photos::text INTO updated_photos
        FROM public.user_profiles
        WHERE id = target_user_uuid;
        
        RAISE NOTICE 'Verificación - photos actualizado: %', updated_photos;
    END;

    -- Actualizar también la vista pública si existe
    IF EXISTS (
        SELECT 1 FROM information_schema.views 
        WHERE table_schema = 'public' 
        AND table_name = 'public_user_profiles'
    ) THEN
        RAISE NOTICE 'Vista public_user_profiles detectada - verificando avatar_url';
        
        -- La vista debería reflejar automáticamente el cambio
        DECLARE
            view_avatar_url text;
        BEGIN
            SELECT avatar_url INTO view_avatar_url
            FROM public.public_user_profiles
            WHERE user_id = target_user_uuid;
            
            RAISE NOTICE 'Avatar en vista pública: %', COALESCE(view_avatar_url, 'NULL');
        END;
    END IF;

END $$;

-- ==========================================
-- VERIFICACIÓN FINAL
-- ==========================================

-- Mostrar resultado final
SELECT 
    id as user_id,
    photos,
    updated_at,
    CASE 
        WHEN photos IS NOT NULL AND array_length(photos::text[], 1) > 0 THEN '✅ AVATAR ASIGNADO'
        ELSE '❌ SIN AVATAR'
    END as status
FROM public.user_profiles
WHERE id = :'target_user_id';

-- Si existe la vista pública, mostrar también
SELECT 
    user_id,
    avatar_url,
    full_name,
    updated_at,
    CASE 
        WHEN avatar_url IS NOT NULL THEN '✅ AVATAR EN VISTA'
        ELSE '❌ SIN AVATAR EN VISTA'
    END as status
FROM public.public_user_profiles
WHERE user_id = :'target_user_id';

-- ==========================================
-- INSTRUCCIONES DE USO
-- ==========================================

/*
INSTRUCCIONES:

1. Cambiar el target_user_id al inicio del script por un UUID real
2. Ejecutar en Supabase SQL Editor o psql
3. Verificar que aparece "✅ AVATAR ASIGNADO"
4. Probar GET /api/users/avatar?userId=<uuid> debe devolver 200 con avatarUrl

EJEMPLO DE USO:
\set target_user_id 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'

TIPOS DE COLUMNA SOPORTADOS:
- text[] (array de strings)
- jsonb (array JSON)
- json (array JSON)

AVATAR DEMO:
- URL: https://picsum.photos/200?random=<timestamp>
- Tamaño: 200x200px
- Fuente: Lorem Picsum (placeholder images)
- Cache-busting: timestamp único por ejecución
*/
