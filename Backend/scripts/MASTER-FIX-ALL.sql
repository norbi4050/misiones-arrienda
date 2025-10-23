-- =====================================================
-- MASTER FIX: Ejecutar todos los arreglos en orden
-- =====================================================
-- Este script ejecuta todos los fixes necesarios para:
-- 1. Arreglar el sistema de registro de usuarios
-- 2. Completar el setup del usuario admin
-- 3. Re-habilitar los triggers necesarios
-- =====================================================

-- ==================== PASO 1 ====================
-- Arreglar el trigger de sincronización de metadata
-- (Ya debería estar arreglado, pero lo ejecutamos por si acaso)
-- ================================================

CREATE OR REPLACE FUNCTION public.sync_user_metadata_to_public_users()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  UPDATE public."User"
  SET
    "userType" = NEW.raw_user_meta_data->>'userType',
    "companyName" = NULLIF(NEW.raw_user_meta_data->>'companyName', ''),
    "licenseNumber" = NEW.raw_user_meta_data->>'licenseNumber',
    "propertyCount" = NEW.raw_user_meta_data->>'propertyCount',
    "updatedAt" = NOW()
  WHERE id = NEW.id::text;

  RETURN NEW;
END;
$function$;

-- ==================== PASO 2 ====================
-- Arreglar Foreign Key de notification_preferences
-- ================================================

-- Eliminar el constraint incorrecto
ALTER TABLE public.notification_preferences
DROP CONSTRAINT IF EXISTS notification_preferences_user_id_fkey;

-- Crear el constraint correcto apuntando a "User"
ALTER TABLE public.notification_preferences
ADD CONSTRAINT notification_preferences_user_id_fkey
FOREIGN KEY (user_id) REFERENCES public."User"(id)
ON UPDATE CASCADE ON DELETE CASCADE;

-- ==================== PASO 3 ====================
-- Completar usuario admin
-- ================================================

-- 3.1. Actualizar emailVerified a true para el admin
UPDATE public."User"
SET "emailVerified" = true
WHERE email = 'misionesarrienda@gmail.com';

-- 3.2. Crear perfil de comunidad si no existe
INSERT INTO public.community_profiles (
  id,
  user_id,
  display_name,
  is_active,
  created_at,
  updated_at
)
VALUES (
  gen_random_uuid(),
  '3755d4dc-9a02-4855-acb8-b2098c78db53',
  'Carlos Admin',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (user_id) DO NOTHING;

-- 3.3. Crear preferencias de notificaciones
INSERT INTO public.notification_preferences (
  user_id,
  email_enabled,
  in_app_enabled,
  push_enabled,
  new_messages,
  property_updates,
  booking_updates,
  marketing_emails,
  security_alerts,
  created_at,
  updated_at
)
VALUES (
  '3755d4dc-9a02-4855-acb8-b2098c78db53',
  true,
  true,
  false,
  true,
  true,
  true,
  false,
  true,
  NOW(),
  NOW()
)
ON CONFLICT (user_id) DO NOTHING;

-- ==================== PASO 4 ====================
-- Re-habilitar triggers (YA ARREGLADOS)
-- ================================================

-- Trigger 1: Sincronizar metadata (ya arreglado en PASO 1)
DROP TRIGGER IF EXISTS sync_user_metadata_trigger ON auth.users;
CREATE TRIGGER sync_user_metadata_trigger
AFTER INSERT OR UPDATE ON auth.users
FOR EACH ROW
EXECUTE FUNCTION sync_user_metadata_to_public_users();

-- Trigger 2: Crear perfil de comunidad
DROP TRIGGER IF EXISTS trg_ensure_display_name ON auth.users;
CREATE TRIGGER trg_ensure_display_name
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION ensure_display_name();

-- Trigger 3: Inicializar preferencias de notificaciones (FK ya arreglado en PASO 2)
DROP TRIGGER IF EXISTS trg_init_notification_prefs ON auth.users;
CREATE TRIGGER trg_init_notification_prefs
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION init_notification_prefs();

-- ==================== VERIFICACIÓN ====================

-- Verificar usuario admin completo
SELECT
  'Usuario en User' as tabla,
  email,
  "emailVerified"::text as verificado
FROM public."User"
WHERE email = 'misionesarrienda@gmail.com'
UNION ALL
SELECT
  'Perfil de comunidad',
  cp.display_name,
  is_active::text
FROM public.community_profiles cp
WHERE user_id = '3755d4dc-9a02-4855-acb8-b2098c78db53'
UNION ALL
SELECT
  'Preferencias notificaciones',
  user_id,
  email_enabled::text
FROM public.notification_preferences
WHERE user_id = '3755d4dc-9a02-4855-acb8-b2098c78db53';

-- Verificar triggers activos
SELECT
  trigger_name,
  event_manipulation,
  'ACTIVO' as estado
FROM information_schema.triggers
WHERE event_object_schema = 'auth'
  AND event_object_table = 'users'
ORDER BY trigger_name;

-- Verificar FK constraint corregido
SELECT
  conname as constraint_name,
  pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'public.notification_preferences'::regclass
  AND contype = 'f'
  AND conname = 'notification_preferences_user_id_fkey';

-- =====================================================
-- RESULTADO ESPERADO
-- =====================================================
-- ✅ Usuario admin con emailVerified = true
-- ✅ Perfil de comunidad creado
-- ✅ Preferencias de notificaciones creadas
-- ✅ Todos los triggers activos
-- ✅ FK constraint apuntando a "User" correctamente
-- =====================================================

-- ==================== PRÓXIMOS PASOS ====================
-- 1. Refrescar la página web donde está logueado el admin
-- 2. Verificar que aparezca el dropdown de perfil
-- 3. Probar crear un nuevo usuario de prueba
-- 4. Verificar que el nuevo usuario tenga todos los registros
-- ========================================================
