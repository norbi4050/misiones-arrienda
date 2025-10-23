-- =====================================================
-- FIX FINAL: Triggers con nombres de columnas correctos
-- =====================================================
-- Problema: Las comillas dobles dentro del INSERT no funcionan
-- Solución: Usar los nombres exactos sin comillas o con formato correcto
-- =====================================================

-- Primero, verificar nombres exactos de columnas
SELECT column_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'User'
  AND column_name LIKE '%mail%'
ORDER BY column_name;

-- ==================== FUNCIÓN 1: handle_new_user (CORREGIDA) ====================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Usar identificadores con comillas escapadas correctamente
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
    NEW.created_at;

  RETURN NEW;
END;
$$;

-- ==================== FUNCIÓN 2: sync_user_metadata (CORREGIDA) ====================
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
    NEW.id::text;

  RETURN NEW;
END;
$$;

-- ==================== FUNCIÓN 3: ensure_display_name (OK) ====================
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

-- ==================== FUNCIÓN 4: init_notification_prefs (OK) ====================
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
    true, true, false,
    true, true, true, true, true, true, true, false,
    true, false, true, true, true, true, true, true,
    false, false,
    NOW(), NOW()
  )
  ON CONFLICT (user_id) DO NOTHING;

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
SELECT 'Triggers actualizados correctamente' as status;
