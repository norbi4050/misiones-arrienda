-- Funciones SQL para manejo de avatar con photos text[]
-- Misiones Arrienda v1

-- Función para actualizar avatar en photos[1] (índice 0 en PostgreSQL)
CREATE OR REPLACE FUNCTION update_user_avatar(user_id text, new_avatar_url text)
RETURNS TABLE(updated_at_epoch bigint) AS $$
DECLARE
    current_photos text[];
    new_updated_at timestamp with time zone;
BEGIN
    -- Obtener photos actual o inicializar array vacío
    SELECT COALESCE(photos, ARRAY[]::text[]) INTO current_photos
    FROM user_profiles 
    WHERE id = user_id;
    
    -- Si no existe el perfil, crear uno básico
    IF NOT FOUND THEN
        INSERT INTO user_profiles (id, photos, role, created_at, updated_at)
        VALUES (user_id, ARRAY[new_avatar_url]::text[], 'BUSCO', NOW(), NOW());
        
        SELECT extract(epoch from updated_at)::bigint INTO updated_at_epoch
        FROM user_profiles WHERE id = user_id;
        
        RETURN NEXT;
        RETURN;
    END IF;
    
    -- Asegurar que el array tenga al menos 1 elemento
    IF array_length(current_photos, 1) IS NULL THEN
        current_photos := ARRAY[]::text[];
    END IF;
    
    -- Actualizar photos[1] (primera posición) con nuevo avatar
    current_photos[1] := new_avatar_url;
    
    -- Actualizar perfil con nuevo timestamp
    new_updated_at := NOW();
    
    UPDATE user_profiles 
    SET photos = current_photos,
        updated_at = new_updated_at
    WHERE id = user_id;
    
    -- Retornar epoch timestamp
    SELECT extract(epoch from new_updated_at)::bigint INTO updated_at_epoch;
    
    RETURN NEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para obtener timestamp epoch del avatar
CREATE OR REPLACE FUNCTION get_user_avatar_timestamp(user_id text)
RETURNS bigint AS $$
DECLARE
    result_epoch bigint;
BEGIN
    SELECT extract(epoch from updated_at)::bigint INTO result_epoch
    FROM user_profiles 
    WHERE id = user_id;
    
    -- Si no existe, retornar timestamp actual
    IF NOT FOUND THEN
        result_epoch := extract(epoch from NOW())::bigint;
    END IF;
    
    RETURN result_epoch;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para obtener avatar URL con cache-busting
CREATE OR REPLACE FUNCTION get_user_avatar_with_cache(user_id text)
RETURNS TABLE(
    avatar_url text,
    cache_version bigint,
    full_name text
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        CASE 
            WHEN photos IS NOT NULL AND array_length(photos, 1) > 0 AND photos[1] IS NOT NULL 
            THEN photos[1] || '?v=' || extract(epoch from updated_at)::bigint::text
            ELSE NULL
        END as avatar_url,
        extract(epoch from updated_at)::bigint as cache_version,
        up.full_name
    FROM user_profiles up
    WHERE up.id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para remover avatar (poner photos[1] = NULL)
CREATE OR REPLACE FUNCTION remove_user_avatar(user_id text)
RETURNS TABLE(updated_at_epoch bigint) AS $$
DECLARE
    current_photos text[];
    new_updated_at timestamp with time zone;
BEGIN
    -- Obtener photos actual
    SELECT COALESCE(photos, ARRAY[]::text[]) INTO current_photos
    FROM user_profiles 
    WHERE id = user_id;
    
    IF NOT FOUND THEN
        -- Si no existe perfil, no hacer nada
        SELECT extract(epoch from NOW())::bigint INTO updated_at_epoch;
        RETURN NEXT;
        RETURN;
    END IF;
    
    -- Asegurar que el array tenga al menos 1 elemento
    IF array_length(current_photos, 1) IS NULL THEN
        current_photos := ARRAY[NULL]::text[];
    ELSE
        current_photos[1] := NULL;
    END IF;
    
    -- Actualizar perfil
    new_updated_at := NOW();
    
    UPDATE user_profiles 
    SET photos = current_photos,
        updated_at = new_updated_at
    WHERE id = user_id;
    
    -- Retornar epoch timestamp
    SELECT extract(epoch from new_updated_at)::bigint INTO updated_at_epoch;
    
    RETURN NEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grants para que las funciones sean accesibles
GRANT EXECUTE ON FUNCTION update_user_avatar(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_avatar_timestamp(text) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_avatar_with_cache(text) TO authenticated;
GRANT EXECUTE ON FUNCTION remove_user_avatar(text) TO authenticated;

-- Comentarios para documentación
COMMENT ON FUNCTION update_user_avatar IS 'Actualiza avatar del usuario en photos[1] usando text[] nativo';
COMMENT ON FUNCTION get_user_avatar_timestamp IS 'Obtiene timestamp epoch de updated_at para cache-busting';
COMMENT ON FUNCTION get_user_avatar_with_cache IS 'Obtiene avatar URL con cache-busting automático';
COMMENT ON FUNCTION remove_user_avatar IS 'Remueve avatar poniendo photos[1] = NULL';
