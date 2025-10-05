-- ============================================================================
-- PROMPT D2: Función de re-sincronización para SUPABASE
-- ============================================================================
-- Adaptado de PROMPT-D2-RESYNC-FUNCTION-2025.sql para usar schema Supabase
-- 
-- Objetivo: Herramienta operativa para corregir un usuario puntual
--
-- Esta función permite:
--   - Recalcular displayName mínimo para un usuario específico
--   - Si name es NULL/vacío/UUID → setea name = local-part del email
--   - Opcional: limpia avatar si es inválido
--
-- Fecha: 2025-01-XX
-- Autor: Sistema de Auditoría DisplayName/Avatar
-- Schema: Supabase (users table, snake_case)
-- ============================================================================

-- ============================================================================
-- FUNCIÓN: resync_user_displayname
-- ============================================================================

CREATE OR REPLACE FUNCTION resync_user_displayname(
  p_user_id UUID,
  p_clean_avatar BOOLEAN DEFAULT TRUE
)
RETURNS TABLE (
  status TEXT,
  old_name TEXT,
  new_name TEXT,
  old_avatar TEXT,
  new_avatar TEXT,
  message TEXT
) AS $$
DECLARE
  v_old_name TEXT;
  v_new_name TEXT;
  v_old_avatar TEXT;
  v_new_avatar TEXT;
  v_email TEXT;
  v_company_name TEXT;
BEGIN
  -- ========================================
  -- Obtener datos actuales (SUPABASE SCHEMA)
  -- ========================================
  SELECT 
    u.name, 
    u.avatar, 
    u.email, 
    u.company_name
  INTO 
    v_old_name, 
    v_old_avatar, 
    v_email, 
    v_company_name
  FROM public.users u  -- ✅ Cambio: "User" → users (Supabase)
  WHERE u.id = p_user_id;

  -- Si no existe el usuario, retornar error
  IF v_email IS NULL THEN
    RETURN QUERY SELECT 
      'ERROR'::TEXT,
      NULL::TEXT,
      NULL::TEXT,
      NULL::TEXT,
      NULL::TEXT,
      'Usuario no encontrado'::TEXT;
    RETURN;
  END IF;

  -- ========================================
  -- Calcular nuevo name si es necesario
  -- ========================================
  -- Regla: Si name es NULL, vacío, o UUID → usar localPart del email
  IF v_old_name IS NULL 
     OR TRIM(v_old_name) = ''
     OR v_old_name ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
    
    -- Si no hay company_name válido, usar localPart del email
    IF v_company_name IS NULL OR TRIM(v_company_name) = '' THEN
      v_new_name := SPLIT_PART(v_email, '@', 1);
    ELSE
      -- Si hay company_name, mantener el name actual (puede ser NULL)
      v_new_name := v_old_name;
    END IF;
  ELSE
    -- Name es válido, mantenerlo
    v_new_name := v_old_name;
  END IF;

  -- ========================================
  -- Limpiar avatar si es inválido (OPCIONAL)
  -- ========================================
  v_new_avatar := v_old_avatar;
  
  IF p_clean_avatar AND v_old_avatar IS NOT NULL THEN
    -- Patrones inválidos de avatar
    IF TRIM(v_old_avatar) = ''
       OR v_old_avatar LIKE 'data:,%'
       OR v_old_avatar LIKE 'data:;%'
       OR v_old_avatar LIKE '%404%'
       OR v_old_avatar LIKE '%not-found%'
       OR v_old_avatar LIKE '%localhost%'
       OR v_old_avatar LIKE '%127.0.0.1%'
       OR v_old_avatar ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
      v_new_avatar := NULL;
    END IF;
  END IF;

  -- ========================================
  -- Actualizar si hay cambios
  -- ========================================
  IF v_new_name IS DISTINCT FROM v_old_name OR v_new_avatar IS DISTINCT FROM v_old_avatar THEN
    UPDATE public.users  -- ✅ Cambio: "User" → users (Supabase)
    SET 
      name = v_new_name,
      avatar = v_new_avatar,
      updated_at = NOW()
    WHERE id = p_user_id;
    
    RETURN QUERY SELECT 
      'SUCCESS'::TEXT,
      v_old_name,
      v_new_name,
      v_old_avatar,
      v_new_avatar,
      'Usuario actualizado correctamente'::TEXT;
  ELSE
    RETURN QUERY SELECT 
      'NO_CHANGES'::TEXT,
      v_old_name,
      v_new_name,
      v_old_avatar,
      v_new_avatar,
      'No se requieren cambios'::TEXT;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- INSTRUCCIONES DE USO
-- ============================================================================

/*
EJEMPLO 1: Re-sincronizar un usuario específico (con limpieza de avatar)
---------------------------------------------------------------------------
SELECT * FROM resync_user_displayname('user-uuid-here', TRUE);

Resultado esperado:
┌─────────┬──────────┬──────────┬─────────────┬─────────────┬──────────────────────────────┐
│ status  │ old_name │ new_name │ old_avatar  │ new_avatar  │ message                      │
├─────────┼──────────┼──────────┼─────────────┼─────────────┼──────────────────────────────┤
│ SUCCESS │ NULL     │ usuario  │ data:,      │ NULL        │ Usuario actualizado...       │
└─────────┴──────────┴──────────┴─────────────┴─────────────┴──────────────────────────────┘


EJEMPLO 2: Re-sincronizar sin limpiar avatar
---------------------------------------------------------------------------
SELECT * FROM resync_user_displayname('user-uuid-here', FALSE);


EJEMPLO 3: Re-sincronizar múltiples usuarios (batch)
---------------------------------------------------------------------------
SELECT 
  u.id,
  u.email,
  r.*
FROM public.users u
CROSS JOIN LATERAL resync_user_displayname(u.id, TRUE) r
WHERE u.name IS NULL
   OR TRIM(u.name) = ''
   OR u.name ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
LIMIT 10;


EJEMPLO 4: Re-sincronizar todos los usuarios sin nombre (CUIDADO)
---------------------------------------------------------------------------
-- ADVERTENCIA: Esto puede afectar muchos usuarios
-- Ejecutar solo después de verificar en staging

DO $$
DECLARE
  v_user_record RECORD;
  v_count INTEGER := 0;
BEGIN
  FOR v_user_record IN 
    SELECT id 
    FROM public.users 
    WHERE name IS NULL
       OR TRIM(name) = ''
       OR name ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  LOOP
    PERFORM resync_user_displayname(v_user_record.id, TRUE);
    v_count := v_count + 1;
  END LOOP;
  
  RAISE NOTICE 'Re-sincronizados % usuarios', v_count;
END $$;
*/

-- ============================================================================
-- QUERY DE VERIFICACIÓN ANTES/DESPUÉS
-- ============================================================================

/*
PASO 1: Ver estado actual del usuario
---------------------------------------------------------------------------
SELECT 
  u.id,
  u.email,
  u.name,
  u.company_name,
  u.avatar,
  CASE
    WHEN u.name IS NOT NULL AND TRIM(u.name) != '' AND u.name !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN 'User.name'
    WHEN u.company_name IS NOT NULL AND TRIM(u.company_name) != '' THEN 'User.company_name'
    WHEN u.email IS NOT NULL THEN 'emailLocal'
    ELSE 'NO_DATA'
  END AS displayName_source,
  CASE
    WHEN u.avatar IS NULL THEN 'NULL'
    WHEN TRIM(u.avatar) = '' THEN 'VACIO'
    WHEN u.avatar LIKE 'https://%' OR u.avatar LIKE 'http://%' THEN 'OK'
    ELSE 'INVALIDO'
  END AS avatar_status
FROM public.users u
WHERE u.id = 'user-uuid-here';


PASO 2: Ejecutar re-sincronización
---------------------------------------------------------------------------
SELECT * FROM resync_user_displayname('user-uuid-here', TRUE);


PASO 3: Verificar cambios
---------------------------------------------------------------------------
SELECT 
  u.id,
  u.email,
  u.name,
  u.company_name,
  u.avatar,
  u.updated_at,
  CASE
    WHEN u.name IS NOT NULL AND TRIM(u.name) != '' AND u.name !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN 'User.name'
    WHEN u.company_name IS NOT NULL AND TRIM(u.company_name) != '' THEN 'User.company_name'
    WHEN u.email IS NOT NULL THEN 'emailLocal'
    ELSE 'NO_DATA'
  END AS displayName_source,
  CASE
    WHEN u.avatar IS NULL THEN 'NULL'
    WHEN TRIM(u.avatar) = '' THEN 'VACIO'
    WHEN u.avatar LIKE 'https://%' OR u.avatar LIKE 'http://%' THEN 'OK'
    ELSE 'INVALIDO'
  END AS avatar_status
FROM public.users u
WHERE u.id = 'user-uuid-here';
*/

-- ============================================================================
-- CASOS DE USO COMUNES
-- ============================================================================

/*
CASO 1: Usuario reporta "aparezco como UUID"
---------------------------------------------------------------------------
1. Obtener el user_id del usuario (desde logs o base de datos)
2. Ejecutar: SELECT * FROM resync_user_displayname('user-uuid', TRUE);
3. Verificar que status = 'SUCCESS'
4. Pedir al usuario que haga "Empty Cache and Hard Reload"


CASO 2: Usuario reporta "mi avatar no aparece"
---------------------------------------------------------------------------
1. Verificar estado actual del avatar
2. Si es inválido, ejecutar: SELECT * FROM resync_user_displayname('user-uuid', TRUE);
3. Si es válido pero no carga, revisar permisos de storage


CASO 3: Después de un backfill masivo, algunos usuarios no se actualizaron
---------------------------------------------------------------------------
1. Identificar usuarios afectados:
   SELECT id, email, name FROM public.users WHERE name IS NULL LIMIT 10;
2. Re-sincronizar en batch (ver EJEMPLO 3 arriba)


CASO 4: Usuario cambió su email y quiere actualizar su displayName
---------------------------------------------------------------------------
1. Actualizar el email en la tabla users
2. Ejecutar: SELECT * FROM resync_user_displayname('user-uuid', FALSE);
   (FALSE para no tocar el avatar)
*/

-- ============================================================================
-- MONITOREO Y MÉTRICAS
-- ============================================================================

/*
Query para monitorear usuarios que necesitan re-sincronización:
---------------------------------------------------------------------------
SELECT 
  COUNT(*) AS total_usuarios_sin_nombre,
  COUNT(*) FILTER (WHERE avatar IS NULL OR TRIM(avatar) = '') AS con_avatar_invalido
FROM public.users
WHERE name IS NULL
   OR TRIM(name) = ''
   OR name ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';


Query para ver últimas re-sincronizaciones:
---------------------------------------------------------------------------
SELECT 
  id,
  email,
  name,
  avatar,
  updated_at
FROM public.users
WHERE updated_at > NOW() - INTERVAL '1 hour'
  AND name = SPLIT_PART(email, '@', 1)
ORDER BY updated_at DESC
LIMIT 20;
*/

-- ============================================================================
-- ELIMINAR LA FUNCIÓN (SI ES NECESARIO)
-- ============================================================================

/*
Para eliminar la función:
---------------------------------------------------------------------------
DROP FUNCTION IF EXISTS resync_user_displayname(UUID, BOOLEAN);
*/

-- ============================================================================
-- NOTAS IMPORTANTES
-- ============================================================================

/*
1. Esta función es SEGURA de ejecutar múltiples veces sobre el mismo usuario
   (es idempotente)

2. Solo actualiza usuarios que realmente necesitan cambios

3. NO afecta usuarios que ya tienen name válido (no UUID, no vacío)

4. La limpieza de avatar es OPCIONAL (parámetro p_clean_avatar)

5. Retorna información detallada del antes/después para auditoría

6. Puede usarse en batch para re-sincronizar múltiples usuarios

7. SIEMPRE probar en staging antes de usar en producción

8. Monitorear logs después de ejecutar en batch

9. La función usa el contexto de seguridad del usuario que la ejecuta

10. Compatible con RLS (Row Level Security) de Supabase

11. NO modifica company_name ni otros campos de UserProfile

12. Transaccional: si falla, no se aplican cambios parciales
*/

-- ============================================================================
-- DIFERENCIAS CON VERSIÓN PRISMA
-- ============================================================================

/*
Cambios aplicados para compatibilidad con Supabase:

1. Tabla: public."User" → public.users
2. Campo: "companyName" → company_name (snake_case)
3. Schema: Prisma camelCase → Supabase snake_case
4. Mantiene toda la lógica de detección UUID
5. Mantiene toda la lógica de limpieza de avatar
6. Idempotente y transaccional
*/
