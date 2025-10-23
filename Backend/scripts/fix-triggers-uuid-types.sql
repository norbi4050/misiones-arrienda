-- =====================================================
-- FIX: Corregir tipos UUID en triggers
-- =====================================================
-- Problema: community_profiles.user_id y notification_preferences.user_id
--           son UUID, pero estamos pasando TEXT
-- Solución: Usar NEW.id directamente (es UUID) sin convertir a text
-- =====================================================

-- ==================== FUNCIÓN 1: handle_new_user ====================
-- User.id es TEXT, así que usamos ::text
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE format('
    INSERT INTO public."User" (
      id,
      email,
      name,
      phone,
      password,
      avatar,
      verified,
      %I,
      rating,
      %I,
      %I,
      %I,
      %I,
      %I,
      %I,
      %I
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
    ON CONFLICT (id) DO NOTHING
  ',
    'emailVerified',
    'reviewCount',
    'userType',
    'companyName',
    'licenseNumber',
    'propertyCount',
    'createdAt',
    'updatedAt'
  )
  USING
    NEW.id::text,  -- User.id es TEXT
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
    NEW.created_at;

  RETURN NEW;
END;
$$;

-- ==================== FUNCIÓN 2: sync_user_metadata ====================
CREATE OR REPLACE FUNCTION public.sync_user_metadata_to_public_users()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE format('
    UPDATE public."User"
    SET
      %I = $1,
      %I = NULLIF($2, ''''),
      %I = $3,
      %I = $4,
      %I = NOW()
    WHERE id = $5
  ',
    'userType',
    'companyName',
    'licenseNumber',
    'propertyCount',
    'updatedAt'
  )
  USING
    NEW.raw_user_meta_data->>'userType',
    NEW.raw_user_meta_data->>'companyName',
    NEW.raw_user_meta_data->>'licenseNumber',
    NEW.raw_user_meta_data->>'propertyCount',
    NEW.id::text;  -- User.id es TEXT

  RETURN NEW;
END;
$$;

-- ==================== FUNCIÓN 3: ensure_display_name ====================
-- community_profiles.user_id puede ser UUID o TEXT, verificamos
CREATE OR REPLACE FUNCTION public.ensure_display_name()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_id_type text;
BEGIN
  -- Detectar si user_id es UUID o TEXT
  SELECT data_type INTO user_id_type
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'community_profiles'
    AND column_name = 'user_id';

  -- Si es UUID, usar NEW.id directamente; si es TEXT, convertir
  IF user_id_type = 'uuid' THEN
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
      NEW.id,  -- UUID directo
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
  ELSE
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
      NEW.id::text,  -- TEXT convertido
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
  END IF;

  RETURN NEW;
END;
$$;

-- ==================== FUNCIÓN 4: init_notification_prefs ====================
CREATE OR REPLACE FUNCTION public.init_notification_prefs()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_id_type text;
BEGIN
  -- Detectar si user_id es UUID o TEXT
  SELECT data_type INTO user_id_type
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'notification_preferences'
    AND column_name = 'user_id';

  -- Si es UUID, usar NEW.id directamente; si es TEXT, convertir
  IF user_id_type = 'uuid' THEN
    INSERT INTO public.notification_preferences (
      id,
      user_id,
      email_enabled, in_app_enabled, push_enabled,
      new_messages, message_replies, property_inquiries, inquiry_replies,
      property_status_changes, property_expiring, favorite_property_updates,
      new_properties_in_area, likes_received, new_followers,
      payments_completed, plan_expiring, plan_expired, invoices_ready,
      system_announcements, security_alerts, promotional_emails, newsletter,
      created_at, updated_at
    )
    VALUES (
      gen_random_uuid(),
      NEW.id,  -- UUID directo
      true, true, false,
      true, true, true, true, true, true, true, false,
      true, false, true, true, true, true, true, true,
      false, false,
      NOW(), NOW()
    )
    ON CONFLICT (user_id) DO NOTHING;
  ELSE
    INSERT INTO public.notification_preferences (
      id,
      user_id,
      email_enabled, in_app_enabled, push_enabled,
      new_messages, message_replies, property_inquiries, inquiry_replies,
      property_status_changes, property_expiring, favorite_property_updates,
      new_properties_in_area, likes_received, new_followers,
      payments_completed, plan_expiring, plan_expired, invoices_ready,
      system_announcements, security_alerts, promotional_emails, newsletter,
      created_at, updated_at
    )
    VALUES (
      gen_random_uuid(),
      NEW.id::text,  -- TEXT convertido
      true, true, false,
      true, true, true, true, true, true, true, false,
      true, false, true, true, true, true, true, true,
      false, false,
      NOW(), NOW()
    )
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

-- ==================== RECREAR TRIGGERS ====================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

DROP TRIGGER IF EXISTS sync_user_metadata_trigger ON auth.users;
CREATE TRIGGER sync_user_metadata_trigger
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_user_metadata_to_public_users();

DROP TRIGGER IF EXISTS trg_ensure_display_name ON auth.users;
CREATE TRIGGER trg_ensure_display_name
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_display_name();

DROP TRIGGER IF EXISTS trg_init_notification_prefs ON auth.users;
CREATE TRIGGER trg_init_notification_prefs
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.init_notification_prefs();

-- Verificar
SELECT 'Triggers con manejo UUID/TEXT actualizados' as status;
