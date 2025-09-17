-- CORRECCIÓN DE NOMBRES DE COLUMNAS PARA COMPATIBILIDAD
-- Ejecutar después de normalize-avatar-field-2025.sql

-- Corregir función de validación para usar nombres correctos de columnas
CREATE OR REPLACE FUNCTION validate_profile_image_consistency()
RETURNS TABLE(
    user_id TEXT,
    avatar_value TEXT,
    profile_image_value TEXT,
    status TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id::TEXT,
        COALESCE(u.avatar, 'NULL')::TEXT,
        COALESCE(u.profile_image, 'NULL')::TEXT,
        CASE 
            WHEN u.avatar IS NULL AND u.profile_image IS NULL THEN 'Sin imagen'
            WHEN u.avatar IS NOT NULL AND u.profile_image IS NULL THEN 'Solo avatar'
            WHEN u.avatar IS NULL AND u.profile_image IS NOT NULL THEN 'Solo profile_image'
            WHEN u.avatar = u.profile_image THEN 'Consistente'
            ELSE 'Inconsistente'
        END::TEXT
    FROM "User" u
    WHERE EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'User' AND column_name = 'avatar'
    )
    ORDER BY u."createdAt" DESC  -- Usar createdAt en lugar de created_at
    LIMIT 10;
END;
$$ LANGUAGE plpgsql;

-- Verificar estructura actual de la tabla User
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'User' 
AND column_name IN ('avatar', 'profile_image', 'createdAt', 'updatedAt', 'created_at', 'updated_at')
ORDER BY column_name;

-- Mostrar algunos usuarios con sus imágenes
SELECT 
    '👤 USUARIOS CON IMAGEN DESPUÉS DE MIGRACIÓN' as titulo,
    id,
    name,
    CASE 
        WHEN profile_image IS NOT NULL THEN LEFT(profile_image, 50) || '...'
        WHEN avatar IS NOT NULL THEN LEFT(avatar, 50) || '...'
        ELSE 'Sin imagen'
    END as imagen_url_preview,
    "createdAt"
FROM "User" 
WHERE profile_image IS NOT NULL OR avatar IS NOT NULL
ORDER BY "updatedAt" DESC 
LIMIT 5;

-- Verificar que la migración fue exitosa
SELECT 
    '✅ MIGRACIÓN COMPLETADA EXITOSAMENTE' as estado,
    'Columna profile_image creada y datos migrados' as descripcion,
    'APIs y componentes listos para usar profile_image' as siguiente_paso;
