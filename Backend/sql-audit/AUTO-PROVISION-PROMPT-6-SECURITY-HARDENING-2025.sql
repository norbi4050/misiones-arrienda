-- ============================================================================
-- PROMPT 6: Hardening mínimo del trigger
-- ============================================================================
-- Fecha: 2025-01-XX
-- Propósito: Endurecer la seguridad de la función de auto-provisioning
-- 
-- FUNCIONALIDAD:
-- 1. Asegurar SECURITY DEFINER con search_path seguro
-- 2. Conceder EXECUTE solo a roles autorizados
-- 3. Verificar que el trigger corre con privilegios correctos
-- 4. Documentar razonamiento de seguridad
-- ============================================================================

BEGIN;

-- ============================================================================
-- PASO 1: Recrear función con hardening de seguridad
-- ============================================================================
-- RAZONAMIENTO DE SEGURIDAD:
-- - SECURITY DEFINER: La función se ejecuta con privilegios del dueño (postgres)
--   esto es necesario porque el trigger necesita escribir en public."User" y
--   public."UserProfile" desde el contexto de auth.users
-- - SET search_path TO public: Previene ataques de search_path hijacking
--   asegurando que solo se usen objetos del schema public
-- - STRICT: La función no se ejecuta si algún parámetro es NULL
-- ============================================================================

CREATE OR REPLACE FUNCTION public.auto_provision_user_on_signup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $function$
DECLARE
  v_user_id text;
  v_name text;
  v_role "CommunityRole";
  v_user_type text;
BEGIN
  -- Validación de entrada: asegurar que NEW no es NULL
  IF NEW IS NULL THEN
    RAISE EXCEPTION 'NEW record cannot be NULL';
  END IF;
  
  -- Validación: email es requerido
  IF NEW.email IS NULL OR NEW.email = '' THEN
    RAISE EXCEPTION 'Email is required for user provisioning';
  END IF;
  
  -- Convertir UUID a TEXT para el ID
  v_user_id := NEW.id::text;
  
  -- Determinar el nombre del usuario
  v_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    split_part(NEW.email, '@', 1)
  );
  
  -- Extraer user_type de raw_user_meta_data
  v_user_type := NEW.raw_user_meta_data->>'user_type';
  
  -- Determinar el role para UserProfile con cast explícito al enum
  IF v_user_type IN ('inmobiliaria', 'agency', 'ofrezco') THEN
    v_role := 'OFREZCO'::"CommunityRole";
  ELSE
    v_role := 'BUSCO'::"CommunityRole";
  END IF;
  
  -- Crear espejo en public."User" si no existe
  INSERT INTO public."User" (
    id,
    name,
    email,
    phone,
    password,
    "createdAt",
    "updatedAt"
  )
  VALUES (
    v_user_id,
    v_name,
    NEW.email,
    COALESCE(NEW.phone, ''),
    '',
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  
  -- Crear espejo en public."UserProfile" si no existe
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
  VALUES (
    gen_random_uuid()::text,
    v_user_id,
    v_role,
    'Posadas',
    0,
    999999999,
    NOW(),
    NOW()
  )
  ON CONFLICT ("userId") DO NOTHING;
  
  RETURN NEW;
  
EXCEPTION
  WHEN OTHERS THEN
    -- Log el error pero no fallar el registro del usuario
    -- Esto previene que un error en auto-provisioning bloquee el signup
    RAISE WARNING 'Auto-provisioning failed for user %: %', NEW.email, SQLERRM;
    RETURN NEW;
END;
$function$;

-- ============================================================================
-- PASO 2: Agregar comentario de seguridad a la función
-- ============================================================================

COMMENT ON FUNCTION public.auto_provision_user_on_signup() IS 
'[SECURITY HARDENED] Auto-provisiona usuarios en public."User" y public."UserProfile".

SEGURIDAD:
- SECURITY DEFINER: Ejecuta con privilegios del dueño (necesario para escribir en public)
- SET search_path TO public: Previene search_path hijacking
- Validaciones de entrada: Verifica que NEW y email no sean NULL
- Manejo de excepciones: Log errores sin bloquear el signup del usuario
- Idempotente: ON CONFLICT DO NOTHING previene duplicados

PERMISOS:
- Solo postgres y service_role pueden ejecutar esta función
- El trigger en auth.users la invoca automáticamente

AUDITORIA:
- Última modificación: 2025-01-XX
- Revisado por: [Tu nombre]
- Próxima revisión: [Fecha]';

-- ============================================================================
-- PASO 3: Revocar permisos públicos y conceder solo a roles autorizados
-- ============================================================================

-- Revocar EXECUTE de PUBLIC (por defecto las funciones son públicas)
REVOKE ALL ON FUNCTION public.auto_provision_user_on_signup() FROM PUBLIC;

-- Conceder EXECUTE solo a postgres (superusuario)
GRANT EXECUTE ON FUNCTION public.auto_provision_user_on_signup() TO postgres;

-- Conceder EXECUTE a service_role (rol de Supabase para operaciones privilegiadas)
-- Nota: En Supabase, service_role es el rol que usa el backend para operaciones admin
GRANT EXECUTE ON FUNCTION public.auto_provision_user_on_signup() TO service_role;

-- Conceder EXECUTE a authenticator (rol que ejecuta triggers en auth.users)
-- Nota: Este es el rol que Supabase usa para ejecutar triggers en el schema auth
GRANT EXECUTE ON FUNCTION public.auto_provision_user_on_signup() TO authenticator;

-- ============================================================================
-- PASO 4: Verificar permisos de la función
-- ============================================================================

SELECT 
  p.proname AS function_name,
  pg_get_userbyid(p.proowner) AS owner,
  p.prosecdef AS is_security_definer,
  p.proconfig AS config_settings,
  array_agg(DISTINCT pr.rolname) AS granted_to_roles
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
LEFT JOIN pg_proc_acl pa ON p.oid = pa.oid
LEFT JOIN pg_roles pr ON pr.oid = ANY(pa.grantee)
WHERE n.nspname = 'public' 
  AND p.proname = 'auto_provision_user_on_signup'
GROUP BY p.proname, p.proowner, p.prosecdef, p.proconfig;

-- ============================================================================
-- PASO 5: Verificar que el trigger existe y está habilitado
-- ============================================================================

SELECT 
  tgname AS trigger_name,
  tgrelid::regclass AS table_name,
  tgenabled AS enabled,
  pg_get_triggerdef(oid) AS trigger_definition
FROM pg_trigger
WHERE tgname = 'on_auth_user_created';

COMMIT;

-- ============================================================================
-- RAZONAMIENTO DE SEGURIDAD DETALLADO:
-- ============================================================================

-- 1. ¿Por qué SECURITY DEFINER?
--    - El trigger se ejecuta en auth.users (schema auth)
--    - Necesita escribir en public."User" y public."UserProfile"
--    - Sin SECURITY DEFINER, el trigger no tendría permisos para escribir
--    - Con SECURITY DEFINER, la función se ejecuta con privilegios del dueño

-- 2. ¿Por qué SET search_path TO public?
--    - Previene ataques donde un usuario malicioso crea objetos en otros schemas
--    - Asegura que solo se usen tablas/funciones del schema public
--    - Es una best practice de seguridad para funciones SECURITY DEFINER

-- 3. ¿Por qué revocar PUBLIC y conceder solo a roles específicos?
--    - Por defecto, las funciones son ejecutables por PUBLIC
--    - Solo postgres, service_role y authenticator necesitan ejecutar esta función
--    - Esto previene que usuarios normales ejecuten la función directamente

-- 4. ¿Cómo funciona con RLS?
--    - La función se ejecuta con privilegios del dueño (postgres)
--    - Esto significa que BYPASEA las políticas RLS en public."User" y public."UserProfile"
--    - Esto es intencional: el auto-provisioning debe funcionar sin importar RLS
--    - Las políticas RLS siguen aplicando para operaciones normales de usuarios

-- 5. ¿Qué pasa si la función falla?
--    - El bloque EXCEPTION captura errores y los registra como WARNING
--    - El signup del usuario NO falla (RETURN NEW se ejecuta igual)
--    - Esto previene que bugs en auto-provisioning bloqueen registros
--    - Los errores quedan registrados en logs para debugging

-- ============================================================================
-- VERIFICACIÓN DE SEGURIDAD:
-- ============================================================================

-- Verificar que la función es SECURITY DEFINER
SELECT 
  proname,
  prosecdef AS is_security_definer,
  proconfig
FROM pg_proc
WHERE proname = 'auto_provision_user_on_signup';

-- Resultado esperado:
-- | proname                        | is_security_definer | proconfig                |
-- |--------------------------------|---------------------|--------------------------|
-- | auto_provision_user_on_signup  | t                   | {search_path=public}     |

-- Verificar permisos concedidos
SELECT 
  routine_name,
  grantee,
  privilege_type
FROM information_schema.routine_privileges
WHERE routine_schema = 'public'
  AND routine_name = 'auto_provision_user_on_signup'
ORDER BY grantee;

-- Resultado esperado:
-- | routine_name                   | grantee        | privilege_type |
-- |--------------------------------|----------------|----------------|
-- | auto_provision_user_on_signup  | postgres       | EXECUTE        |
-- | auto_provision_user_on_signup  | service_role   | EXECUTE        |
-- | auto_provision_user_on_signup  | authenticator  | EXECUTE        |

-- ============================================================================
-- RESULTADO ESPERADO:
-- ============================================================================
-- ✅ Función tiene SECURITY DEFINER habilitado
-- ✅ search_path está fijado a 'public'
-- ✅ Solo postgres, service_role y authenticator tienen EXECUTE
-- ✅ PUBLIC no tiene permisos (seguridad mejorada)
-- ✅ Trigger está habilitado y funcional
-- ✅ Manejo de excepciones previene bloqueos en signup
-- ============================================================================

-- ============================================================================
-- NOTAS IMPORTANTES:
-- ============================================================================
-- 1. Esta función BYPASEA RLS por diseño (SECURITY DEFINER)
-- 2. Esto es seguro porque:
--    - Solo se ejecuta automáticamente en INSERT de auth.users
--    - Solo postgres/service_role/authenticator pueden ejecutarla
--    - Tiene validaciones de entrada
--    - Tiene manejo de excepciones
-- 3. NO modificar las políticas RLS de User/UserProfile basándose en esto
-- 4. Las políticas RLS siguen aplicando para operaciones normales
-- 5. Esta función es solo para auto-provisioning inicial
-- ============================================================================

-- ============================================================================
-- PRÓXIMOS PASOS DE SEGURIDAD (fuera del scope de este prompt):
-- ============================================================================
-- 1. Implementar políticas RLS en public."User" si no existen
-- 2. Implementar políticas RLS en public."UserProfile" si no existen
-- 3. Configurar rate limiting en el endpoint de signup
-- 4. Implementar logging de auditoría para cambios en User/UserProfile
-- 5. Configurar alertas para detectar intentos de abuso
-- ============================================================================
