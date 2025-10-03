-- ============================================================================
-- FIX INMEDIATO: Corrección de Mezcla de Propiedades y Comunidad
-- ============================================================================
-- Fecha: 2025-01-XX
-- Objetivo: Corregir datos inconsistentes del usuario Carlos y prevenir futuros casos
-- IMPORTANTE: Ejecutar en orden, paso por paso
-- ============================================================================

-- ============================================================================
-- PASO 1: VERIFICACIÓN (Ejecutar primero para confirmar el problema)
-- ============================================================================

-- 1.1: Verificar datos en raw_user_meta_data (camelCase vs snake_case)
SELECT 
  id,
  email,
  raw_user_meta_data->>'userType' AS userType_camelCase,
  raw_user_meta_data->>'user_type' AS user_type_snake_case,
  raw_user_meta_data->>'companyName' AS companyName_camelCase,
  raw_user_meta_data->>'is_company' AS is_company_snake_case,
  raw_user_meta_data
FROM auth.users
WHERE email = 'cgonzalezarchilla@gmail.com';

-- 1.2: Verificar datos en public.users
SELECT 
  id,
  email,
  user_type,
  is_company,
  company_name,
  created_at,
  updated_at
FROM public.users
WHERE email = 'cgonzalezarchilla@gmail.com';

-- 1.3: Verificar contenido del usuario
SELECT 
  'properties' AS tipo,
  COUNT(*) AS total,
  STRING_AGG(title, ', ') AS titulos
FROM properties
WHERE user_id = '6403f9d2-e846-4c70-87e0-e051127d9500'
UNION ALL
SELECT 
  'community_posts' AS tipo,
  COUNT(*) AS total,
  STRING_AGG(title, ', ') AS titulos
FROM community_posts
WHERE user_id = '6403f9d2-e846-4c70-87e0-e051127d9500';

-- ============================================================================
-- PASO 2: CORRECCIÓN DE DATOS DEL USUARIO CARLOS
-- ============================================================================

-- 2.1: Actualizar public.users con el tipo correcto
-- NOTA: Carlos tiene userType: "inquilino" en raw_user_meta_data
UPDATE public.users
SET 
  user_type = 'inquilino',
  is_company = false,
  company_name = NULL,
  updated_at = NOW()
WHERE id = '6403f9d2-e846-4c70-87e0-e051127d9500';

-- 2.2: Verificar que se actualizó correctamente
SELECT 
  id,
  email,
  user_type,
  is_company,
  company_name,
  updated_at
FROM public.users
WHERE id = '6403f9d2-e846-4c70-87e0-e051127d9500';

-- ============================================================================
-- PASO 3: AUDITAR OTROS USUARIOS CON PROBLEMAS SIMILARES
-- ============================================================================

-- 3.1: Buscar usuarios con inconsistencias entre auth.users y public.users
SELECT 
  u.id,
  u.email,
  au.raw_user_meta_data->>'userType' AS userType_metadata,
  u.user_type AS user_type_table,
  au.raw_user_meta_data->>'companyName' AS companyName_metadata,
  u.company_name AS company_name_table,
  CASE 
    WHEN u.user_type IS NULL THEN '❌ FALTA user_type en tabla'
    WHEN au.raw_user_meta_data->>'userType' IS NULL THEN '⚠️ FALTA userType en metadata'
    WHEN au.raw_user_meta_data->>'userType' != u.user_type THEN '⚠️ INCONSISTENTE'
    ELSE '✅ OK'
  END AS status,
  (SELECT COUNT(*) FROM properties WHERE user_id = u.id) AS total_properties,
  (SELECT COUNT(*) FROM community_posts WHERE user_id = u.id::text) AS total_community_posts
FROM public.users u
INNER JOIN auth.users au ON u.id = au.id::text
WHERE 
  u.user_type IS NULL 
  OR au.raw_user_meta_data->>'userType' IS NULL
  OR au.raw_user_meta_data->>'userType' != u.user_type
ORDER BY total_properties DESC, total_community_posts DESC;

-- 3.2: Contar usuarios afectados
SELECT 
  COUNT(*) AS total_usuarios_con_problemas
FROM public.users u
INNER JOIN auth.users au ON u.id = au.id::text
WHERE 
  u.user_type IS NULL 
  OR au.raw_user_meta_data->>'userType' IS NULL
  OR au.raw_user_meta_data->>'userType' != u.user_type;

-- ============================================================================
-- PASO 4: SINCRONIZACIÓN MASIVA (Solo si hay más usuarios afectados)
-- ============================================================================

-- 4.1: Actualizar todos los usuarios que tienen userType en metadata pero no en tabla
UPDATE public.users u
SET 
  user_type = au.raw_user_meta_data->>'userType',
  is_company = CASE 
    WHEN au.raw_user_meta_data->>'companyName' IS NOT NULL 
      AND au.raw_user_meta_data->>'companyName' != '' 
    THEN true 
    ELSE false 
  END,
  company_name = NULLIF(au.raw_user_meta_data->>'companyName', ''),
  updated_at = NOW()
FROM auth.users au
WHERE 
  u.id = au.id::text
  AND u.user_type IS NULL
  AND au.raw_user_meta_data->>'userType' IS NOT NULL;

-- 4.2: Verificar resultados de la sincronización
SELECT 
  COUNT(*) AS usuarios_sincronizados
FROM public.users u
INNER JOIN auth.users au ON u.id = au.id::text
WHERE 
  u.user_type = au.raw_user_meta_data->>'userType'
  AND u.updated_at > NOW() - INTERVAL '5 minutes';

-- ============================================================================
-- PASO 5: CREAR TRIGGER DE SINCRONIZACIÓN AUTOMÁTICA (PREVENCIÓN)
-- ============================================================================

-- 5.1: Crear función de sincronización
CREATE OR REPLACE FUNCTION sync_user_metadata_to_public_users()
RETURNS TRIGGER AS $$
BEGIN
  -- Sincronizar desde auth.users.raw_user_meta_data a public.users
  UPDATE public.users
  SET 
    user_type = NEW.raw_user_meta_data->>'userType',
    is_company = CASE 
      WHEN NEW.raw_user_meta_data->>'companyName' IS NOT NULL 
        AND NEW.raw_user_meta_data->>'companyName' != '' 
      THEN true 
      ELSE false 
    END,
    company_name = NULLIF(NEW.raw_user_meta_data->>'companyName', ''),
    updated_at = NOW()
  WHERE id = NEW.id::text;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5.2: Crear trigger
DROP TRIGGER IF EXISTS sync_user_metadata_trigger ON auth.users;

CREATE TRIGGER sync_user_metadata_trigger
  AFTER INSERT OR UPDATE OF raw_user_meta_data ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION sync_user_metadata_to_public_users();

-- 5.3: Verificar que el trigger se creó correctamente
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'sync_user_metadata_trigger';

-- ============================================================================
-- PASO 6: VALIDACIÓN FINAL
-- ============================================================================

-- 6.1: Verificar que no hay usuarios con user_type NULL
SELECT 
  COUNT(*) AS usuarios_sin_user_type
FROM public.users
WHERE user_type IS NULL;

-- 6.2: Verificar que no hay inconsistencias
SELECT 
  COUNT(*) AS usuarios_inconsistentes
FROM public.users u
INNER JOIN auth.users au ON u.id = au.id::text
WHERE 
  au.raw_user_meta_data->>'userType' IS NOT NULL
  AND u.user_type != au.raw_user_meta_data->>'userType';

-- 6.3: Resumen final
SELECT 
  'Total usuarios' AS metrica,
  COUNT(*) AS valor
FROM public.users
UNION ALL
SELECT 
  'Usuarios con user_type' AS metrica,
  COUNT(*) AS valor
FROM public.users
WHERE user_type IS NOT NULL
UNION ALL
SELECT 
  'Usuarios inquilinos' AS metrica,
  COUNT(*) AS valor
FROM public.users
WHERE user_type = 'inquilino'
UNION ALL
SELECT 
  'Usuarios inmobiliarias' AS metrica,
  COUNT(*) AS valor
FROM public.users
WHERE user_type = 'inmobiliaria'
UNION ALL
SELECT 
  'Usuarios con propiedades' AS metrica,
  COUNT(DISTINCT user_id) AS valor
FROM properties
UNION ALL
SELECT 
  'Usuarios con posts comunidad' AS metrica,
  COUNT(DISTINCT user_id) AS valor
FROM community_posts;

-- ============================================================================
-- PASO 7: VERIFICACIÓN DE POSTS DE COMUNIDAD DE INMOBILIARIAS (NO DEBERÍA HABER)
-- ============================================================================

-- 7.1: Buscar posts de comunidad creados por inmobiliarias
SELECT 
  cp.id,
  cp.title,
  cp.user_id,
  u.email,
  u.user_type,
  u.is_company,
  cp.created_at
FROM community_posts cp
INNER JOIN public.users u ON cp.user_id = u.id
WHERE 
  u.user_type = 'inmobiliaria'
  OR u.is_company = true;

-- 7.2: Si hay posts de inmobiliarias, listarlos para revisión manual
-- NOTA: NO eliminar automáticamente, revisar primero con el usuario

-- ============================================================================
-- INSTRUCCIONES DE USO
-- ============================================================================
-- 1. Ejecutar PASO 1 completo para verificar el problema
-- 2. Ejecutar PASO 2 para corregir el usuario Carlos
-- 3. Ejecutar PASO 3 para auditar otros usuarios
-- 4. Si hay más usuarios afectados, ejecutar PASO 4
-- 5. Ejecutar PASO 5 para crear el trigger de prevención
-- 6. Ejecutar PASO 6 para validación final
-- 7. Ejecutar PASO 7 para verificar posts de comunidad de inmobiliarias
-- 8. Reportar resultados
-- ============================================================================

-- ============================================================================
-- ROLLBACK (Solo si algo sale mal)
-- ============================================================================

-- Para deshacer el trigger:
-- DROP TRIGGER IF EXISTS sync_user_metadata_trigger ON auth.users;
-- DROP FUNCTION IF EXISTS sync_user_metadata_to_public_users();

-- Para restaurar datos del usuario Carlos (si es necesario):
-- UPDATE public.users
-- SET 
--   user_type = NULL,
--   is_company = NULL,
--   company_name = NULL,
--   updated_at = NOW()
-- WHERE id = '6403f9d2-e846-4c70-87e0-e051127d9500';

-- ============================================================================
-- NOTAS IMPORTANTES
-- ============================================================================
-- - Este script es seguro de ejecutar en producción
-- - Cada paso tiene verificaciones antes y después
-- - El trigger previene futuros problemas
-- - Los datos se sincronizan automáticamente desde auth.users a public.users
-- - NO se eliminan datos, solo se actualizan
-- ============================================================================
