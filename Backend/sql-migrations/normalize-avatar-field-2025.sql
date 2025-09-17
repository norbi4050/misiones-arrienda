-- MIGRACIÓN: NORMALIZACIÓN DEL CAMPO DE IMAGEN DE PERFIL
-- Objetivo: Unificar el campo de imagen de perfil para consistencia
-- Fecha: 2025

-- 1. VERIFICAR ESTADO ACTUAL DE LA TABLA User
SELECT 
    'Estado actual de campos de imagen' as info,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'avatar') 
        THEN '✅ Campo avatar existe' 
        ELSE '❌ Campo avatar no existe' 
    END as avatar_status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'profile_image') 
        THEN '✅ Campo profile_image existe' 
        ELSE '❌ Campo profile_image no existe' 
    END as profile_image_status;

-- 2. CREAR CAMPO profile_image SI NO EXISTE
DO $$ 
BEGIN
    -- Agregar columna profile_image si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'User' AND column_name = 'profile_image'
    ) THEN
        ALTER TABLE "User" ADD COLUMN profile_image TEXT;
        RAISE NOTICE 'Campo profile_image creado exitosamente';
    ELSE
        RAISE NOTICE 'Campo profile_image ya existe';
    END IF;
END $$;

-- 3. MIGRAR DATOS DE avatar A profile_image (SI EXISTE CAMPO avatar)
DO $$ 
BEGIN
    -- Solo migrar si existe el campo avatar
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'User' AND column_name = 'avatar'
    ) THEN
        -- Migrar datos no nulos de avatar a profile_image
        UPDATE "User" 
        SET profile_image = avatar 
        WHERE avatar IS NOT NULL 
        AND (profile_image IS NULL OR profile_image = '');
        
        -- Obtener estadísticas de migración
        DECLARE
            migrated_count INTEGER;
        BEGIN
            SELECT COUNT(*) INTO migrated_count 
            FROM "User" 
            WHERE avatar IS NOT NULL AND profile_image IS NOT NULL;
            
            RAISE NOTICE 'Migrados % registros de avatar a profile_image', migrated_count;
        END;
    ELSE
        RAISE NOTICE 'Campo avatar no existe, no hay datos que migrar';
    END IF;
END $$;

-- 4. CREAR ÍNDICE PARA MEJORAR RENDIMIENTO
CREATE INDEX IF NOT EXISTS idx_user_profile_image ON "User"(profile_image) 
WHERE profile_image IS NOT NULL;

-- 5. ACTUALIZAR POLÍTICAS RLS SI EXISTEN
-- Verificar si existen políticas que referencien el campo avatar
DO $$
DECLARE
    policy_exists BOOLEAN;
BEGIN
    -- Verificar políticas existentes
    SELECT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'User' 
        AND policyname LIKE '%avatar%'
    ) INTO policy_exists;
    
    IF policy_exists THEN
        RAISE NOTICE 'Se encontraron políticas RLS relacionadas con avatar - revisar manualmente';
    ELSE
        RAISE NOTICE 'No se encontraron políticas RLS relacionadas con avatar';
    END IF;
END $$;

-- 6. FUNCIÓN PARA MANTENER SINCRONIZACIÓN (TEMPORAL)
-- Esta función mantiene sincronizados ambos campos durante la transición
CREATE OR REPLACE FUNCTION sync_avatar_fields()
RETURNS TRIGGER AS $$
BEGIN
    -- Si se actualiza profile_image, sincronizar con avatar (si existe)
    IF TG_OP = 'UPDATE' AND NEW.profile_image IS DISTINCT FROM OLD.profile_image THEN
        -- Solo si existe el campo avatar
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'User' AND column_name = 'avatar'
        ) THEN
            NEW.avatar := NEW.profile_image;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger temporal para sincronización
DROP TRIGGER IF EXISTS sync_avatar_fields_trigger ON "User";
CREATE TRIGGER sync_avatar_fields_trigger
    BEFORE UPDATE ON "User"
    FOR EACH ROW
    EXECUTE FUNCTION sync_avatar_fields();

-- 7. VERIFICACIÓN FINAL
SELECT 
    '🔍 VERIFICACIÓN FINAL' as titulo,
    COUNT(*) as total_usuarios,
    COUNT(profile_image) as usuarios_con_imagen,
    ROUND(
        (COUNT(profile_image)::DECIMAL / NULLIF(COUNT(*), 0)) * 100, 2
    ) as porcentaje_con_imagen
FROM "User";

-- Mostrar algunos ejemplos de URLs de imagen
SELECT 
    '📸 EJEMPLOS DE IMÁGENES' as titulo,
    id,
    CASE 
        WHEN profile_image IS NOT NULL 
        THEN LEFT(profile_image, 50) || '...' 
        ELSE 'Sin imagen' 
    END as imagen_preview
FROM "User" 
WHERE profile_image IS NOT NULL 
LIMIT 5;

-- 8. INSTRUCCIONES PARA ELIMINAR CAMPO avatar (OPCIONAL)
-- IMPORTANTE: Solo ejecutar después de verificar que todo funciona correctamente
/*
-- PASO OPCIONAL: Eliminar campo avatar después de verificar que todo funciona
-- ⚠️  SOLO EJECUTAR DESPUÉS DE CONFIRMAR QUE LA MIGRACIÓN ES EXITOSA

-- Eliminar trigger temporal
DROP TRIGGER IF EXISTS sync_avatar_fields_trigger ON "User";
DROP FUNCTION IF EXISTS sync_avatar_fields();

-- Eliminar campo avatar
ALTER TABLE "User" DROP COLUMN IF EXISTS avatar;

-- Verificación final
SELECT 'Campo avatar eliminado exitosamente' as resultado;
*/

-- 9. MENSAJE FINAL
SELECT 
    '✅ MIGRACIÓN COMPLETADA' as estado,
    'Campo profile_image normalizado correctamente' as mensaje,
    'Revisar aplicación para confirmar funcionamiento' as siguiente_paso;

-- NOTAS IMPORTANTES:
-- 1. Esta migración es segura y no elimina datos
-- 2. Mantiene compatibilidad temporal con el campo avatar
-- 3. Crear backup antes de ejecutar en producción
-- 4. Verificar que la aplicación funcione antes de eliminar el campo avatar
-- 5. El trigger temporal se puede eliminar después de confirmar que todo funciona
