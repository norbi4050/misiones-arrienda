-- =====================================================
-- FIX COMPLETO: Actualizar TODOS los triggers
-- =====================================================
-- Arreglar todas las funciones trigger para usar las tablas correctas
-- =====================================================

-- ==================== FUNCIÓN 1: handle_new_user ====================
-- Crea el usuario en la tabla "User"
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public."User" (
    id,
    email,
    name,
    phone,
    password,
    avatar,
    verified,
    "emailVerified",
    rating,
    "reviewCount",
    "userType",
    "companyName",
    "licenseNumber",
    "propertyCount",
    "createdAt",
    "updatedAt"
  )
  VALUES (
    NEW.id::text,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'name',
      NEW.raw_user_meta_data->>'full_name',
      NEW.email
    ),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    '',
    NEW.raw_user_meta_data->>'profileImage',
    false,
    (NEW.email_confirmed_at IS NOT NULL),
    0,
    0,
    COALESCE(NEW.raw_user_meta_data->>'userType', 'inquilino'),
    NEW.raw_user_meta_data->>'companyName',
    NEW.raw_user_meta_data->>'licenseNumber',
    NEW.raw_user_meta_data->>'propertyCount',
    NEW.created_at,
    NEW.created_at
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- ==================== FUNCIÓN 2: sync_user_metadata_to_public_users ====================
-- Sincroniza metadata de auth.users a public."User"
CREATE OR REPLACE FUNCTION public.sync_user_metadata_to_public_users()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
$$;

-- ==================== FUNCIÓN 3: ensure_display_name ====================
-- Crea el perfil de comunidad en community_profiles
CREATE OR REPLACE FUNCTION public.ensure_display_name()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
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
    NEW.id::text,
    COALESCE(
      NEW.raw_user_meta_data->>'name',
      NEW.raw_user_meta_data->>'full_name',
      NEW.email
    ),
    true,
    NOW(),
    NOW()
  )
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- ==================== FUNCIÓN 4: init_notification_prefs ====================
-- Inicializa las preferencias de notificaciones
CREATE OR REPLACE FUNCTION public.init_notification_prefs()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.notification_preferences (
    id,
    user_id,
    email_enabled,
    in_app_enabled,
    push_enabled,
    new_messages,
    message_replies,
    property_inquiries,
    inquiry_replies,
    property_status_changes,
    property_expiring,
    favorite_property_updates,
    new_properties_in_area,
    likes_received,
    new_followers,
    payments_completed,
    plan_expiring,
    plan_expired,
    invoices_ready,
    system_announcements,
    security_alerts,
    promotional_emails,
    newsletter,
    created_at,
    updated_at
  )
  VALUES (
    gen_random_uuid(),
    NEW.id::text,
    true,  -- email_enabled
    true,  -- in_app_enabled
    false, -- push_enabled
    true,  -- new_messages
    true,  -- message_replies
    true,  -- property_inquiries
    true,  -- inquiry_replies
    true,  -- property_status_changes
    true,  -- property_expiring
    true,  -- favorite_property_updates
    false, -- new_properties_in_area
    true,  -- likes_received
    false, -- new_followers
    true,  -- payments_completed
    true,  -- plan_expiring
    true,  -- plan_expired
    true,  -- invoices_ready
    true,  -- system_announcements
    true,  -- security_alerts
    false, -- promotional_emails
    false, -- newsletter
    NOW(),
    NOW()
  )
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- ==================== RECREAR TRIGGERS ====================

-- Trigger 1: Crear usuario en User
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Trigger 2: Sincronizar metadata
DROP TRIGGER IF EXISTS sync_user_metadata_trigger ON auth.users;
CREATE TRIGGER sync_user_metadata_trigger
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_user_metadata_to_public_users();

-- Trigger 3: Crear perfil de comunidad
DROP TRIGGER IF EXISTS trg_ensure_display_name ON auth.users;
CREATE TRIGGER trg_ensure_display_name
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_display_name();

-- Trigger 4: Inicializar preferencias de notificaciones
DROP TRIGGER IF EXISTS trg_init_notification_prefs ON auth.users;
CREATE TRIGGER trg_init_notification_prefs
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.init_notification_prefs();

-- ==================== VERIFICACIÓN ====================

-- Ver todos los triggers activos
SELECT
  trigger_name,
  event_manipulation,
  action_timing,
  'ACTIVO' as estado
FROM information_schema.triggers
WHERE event_object_schema = 'auth'
  AND event_object_table = 'users'
ORDER BY trigger_name;

-- Contar funciones actualizadas
SELECT
  'Total funciones trigger actualizadas: ' || COUNT(*) as resumen
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname IN (
    'handle_new_user',
    'sync_user_metadata_to_public_users',
    'ensure_display_name',
    'init_notification_prefs'
  );

-- =====================================================
-- RESULTADO ESPERADO
-- =====================================================
-- ✅ 4 funciones actualizadas
-- ✅ 4 triggers activos (on_auth_user_created, sync_user_metadata_trigger,
--                        trg_ensure_display_name, trg_init_notification_prefs)
-- ✅ Listo para crear usuarios
-- =====================================================
