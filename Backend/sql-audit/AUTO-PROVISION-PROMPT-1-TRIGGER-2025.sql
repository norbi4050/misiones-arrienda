-- ============================================================================
-- PROMPT 1: Auto-Provision v1 - Diseño de trigger on auth.users
-- ============================================================================
-- Fecha: 2025-01-XX
-- Propósito: Implementar auto-provisioning cuando se inserta un registro en auth.users
-- 
-- FUNCIONALIDAD:
-- 1. Crear espejo en public."User" si no existe (uuid→text cast)
-- 2. Crear espejo en public."UserProfile" si no existe
-- 3. Inicializar campos NOT NULL mínimos
-- 4. Determinar role basado en raw_user_meta_data
-- ============================================================================

BEGIN;

-- ============================================================================
-- PASO 1: Crear función SECURITY DEFINER para auto-provisioning
-- ============================================================================

CREATE OR REPLACE FUNCTION public.auto_provision_user_on_signup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
DECLARE
  v_user_id text;
  v_name text;
  v_role text;
  v_user_type text;
BEGIN
  -- Convertir UUID a TEXT para el ID
  v_user_id := NEW.id::text;
  
  -- Determinar el nombre del usuario
  -- Prioridad: raw_user_meta_data->>'full_name', luego parte antes del @ del email
  v_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    split_part(NEW.email, '@', 1)
  );
  
  -- Extraer user_type de raw_user_meta_data
  v_user_type := NEW.raw_user_meta_data->>'user_type';
  
  -- Determinar el role para UserProfile
  -- Si user_type es 'inmobiliaria', 'agency', o 'ofrezco' → OFREZCO
  -- De lo contrario → BUSCO
  IF v_user_type IN ('inmobiliaria', 'agency', 'ofrezco') THEN
    v_role := 'OFREZCO'::"CommunityRole";
  ELSE
    v_role := 'BUSCO'::"CommunityRole";
  END IF;
  
  -- ============================================================================
  -- PASO 2: Crear espejo en public."User" si no existe
  -- ============================================================================
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
    COALESCE(NEW.phone, ''), -- phone es NOT NULL, usar string vacío si no existe
    '', -- password es NOT NULL, usar string vacío (auth maneja la autenticación)
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING; -- Idempotente: no duplicar si ya existe
  
  -- ============================================================================
  -- PASO 3: Crear espejo en public."UserProfile" si no existe
  -- ============================================================================
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
    gen_random_uuid()::text, -- Generar nuevo ID como texto
    v_user_id,
    v_role,
    'Posadas', -- Ciudad por defecto
    0, -- Presupuesto mínimo por defecto
    999999999, -- Presupuesto máximo por defecto
    NOW(),
    NOW()
  )
  ON CONFLICT ("userId") DO NOTHING; -- Idempotente: no duplicar si ya existe
  
  RETURN NEW;
END;
$$;

-- ============================================================================
-- PASO 4: Agregar comentario a la función
-- ============================================================================

COMMENT ON FUNCTION public.auto_provision_user_on_signup() IS 
'Auto-provisiona usuarios en public."User" y public."UserProfile" cuando se registran en auth.users.
- Convierte UUID a TEXT para compatibilidad con Prisma
- Inicializa campos NOT NULL mínimos
- Determina role basado en raw_user_meta_data->user_type
- Es idempotente: no duplica registros existentes';

-- ============================================================================
-- PASO 5: Crear trigger AFTER INSERT en auth.users
-- ============================================================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_provision_user_on_signup();

-- ============================================================================
-- PASO 6: Agregar comentario al trigger
-- ============================================================================

COMMENT ON TRIGGER on_auth_user_created ON auth.users IS
'Trigger que ejecuta auto-provisioning cuando se crea un nuevo usuario en auth.users';

COMMIT;

-- ============================================================================
-- VERIFICACIÓN: Consultas para verificar la implementación
-- ============================================================================

-- Verificar que la función existe
SELECT 
  p.proname as function_name,
  pg_get_functiondef(p.oid) as definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
  AND p.proname = 'auto_provision_user_on_signup';

-- Verificar que el trigger existe
SELECT 
  tgname as trigger_name,
  tgrelid::regclass as table_name,
  tgtype,
  tgenabled
FROM pg_trigger
WHERE tgname = 'on_auth_user_created';

-- ============================================================================
-- RESULTADO ESPERADO:
-- ============================================================================
-- ✅ Función public.auto_provision_user_on_signup() creada con SECURITY DEFINER
-- ✅ Trigger on_auth_user_created creado en auth.users
-- ✅ Nuevos usuarios en auth.users automáticamente crean:
--    - Registro en public."User" con id (text), name, email, timestamps
--    - Registro en public."UserProfile" con role (BUSCO/OFREZCO), city, budgets
-- ✅ Sistema es idempotente: no duplica registros existentes
-- ============================================================================

-- ============================================================================
-- EJEMPLO DE USO:
-- ============================================================================
-- Cuando un usuario se registra en Supabase con:
-- {
--   "email": "nuevo@ejemplo.com",
--   "raw_user_meta_data": {
--     "full_name": "Juan Pérez",
--     "user_type": "inmobiliaria"
--   }
-- }
--
-- El trigger automáticamente crea:
-- 1. User: id (uuid→text), name="Juan Pérez", email="nuevo@ejemplo.com"
-- 2. UserProfile: userId (FK), role="OFREZCO", city="Posadas", budgets
-- ============================================================================
