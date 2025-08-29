-- =============================================================================
-- TODOS LOS TRIGGERS NECESARIOS PARA SUPABASE - MISIONES ARRIENDA
-- =============================================================================
-- Ejecuta este archivo completo en Supabase SQL Editor para crear todos los triggers
-- =============================================================================

-- =============================================================================
-- 1. FUNCIONES TRIGGER
-- =============================================================================

-- Función para crear usuario automáticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Crear perfil en la tabla profiles
  INSERT INTO public.profiles (id, full_name, avatar_url, created_at, updated_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.raw_user_meta_data->>'avatar_url',
    NOW(),
    NOW()
  );
  
  -- Crear usuario en la tabla User
  INSERT INTO public."User" (
    id, name, email, phone, password, avatar, bio, occupation, age, 
    verified, "emailVerified", "verificationToken", rating, "reviewCount", 
    "userType", "companyName", "licenseNumber", "propertyCount", 
    "createdAt", "updatedAt"
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    '',
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.raw_user_meta_data->>'bio',
    NEW.raw_user_meta_data->>'occupation',
    CASE 
      WHEN NEW.raw_user_meta_data->>'age' IS NOT NULL 
      THEN (NEW.raw_user_meta_data->>'age')::INTEGER 
      ELSE NULL 
    END,
    CASE WHEN NEW.email_confirmed_at IS NOT NULL THEN TRUE ELSE FALSE END,
    CASE WHEN NEW.email_confirmed_at IS NOT NULL THEN TRUE ELSE FALSE END,
    NEW.confirmation_token,
    0.0,
    0,
    NEW.raw_user_meta_data->>'userType',
    NEW.raw_user_meta_data->>'companyName',
    NEW.raw_user_meta_data->>'licenseNumber',
    NEW.raw_user_meta_data->>'propertyCount',
    NOW(),
    NOW()
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para actualizar usuario
CREATE OR REPLACE FUNCTION public.handle_user_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Actualizar perfil en la tabla profiles
  UPDATE public.profiles 
  SET 
    full_name = COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    avatar_url = NEW.raw_user_meta_data->>'avatar_url',
    updated_at = NOW()
  WHERE id = NEW.id;
  
  -- Actualizar usuario en la tabla User
  UPDATE public."User" 
  SET 
    name = COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    email = NEW.email,
    phone = COALESCE(NEW.raw_user_meta_data->>'phone', phone),
    avatar = NEW.raw_user_meta_data->>'avatar_url',
    bio = NEW.raw_user_meta_data->>'bio',
    occupation = NEW.raw_user_meta_data->>'occupation',
    age = CASE 
      WHEN NEW.raw_user_meta_data->>'age' IS NOT NULL 
      THEN (NEW.raw_user_meta_data->>'age')::INTEGER 
      ELSE age 
    END,
    "emailVerified" = CASE WHEN NEW.email_confirmed_at IS NOT NULL THEN TRUE ELSE FALSE END,
    "userType" = COALESCE(NEW.raw_user_meta_data->>'userType', "userType"),
    "companyName" = COALESCE(NEW.raw_user_meta_data->>'companyName', "companyName"),
    "licenseNumber" = COALESCE(NEW.raw_user_meta_data->>'licenseNumber', "licenseNumber"),
    "propertyCount" = COALESCE(NEW.raw_user_meta_data->>'propertyCount', "propertyCount"),
    "updatedAt" = NOW()
  WHERE id = NEW.id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para eliminar usuario
CREATE OR REPLACE FUNCTION public.handle_user_delete()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM public.profiles WHERE id = OLD.id;
  DELETE FROM public."User" WHERE id = OLD.id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para crear perfil de comunidad
CREATE OR REPLACE FUNCTION public.handle_community_profile_creation()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.raw_user_meta_data->>'createCommunityProfile' = 'true' THEN
    INSERT INTO public."UserProfile" (
      id, "userId", role, city, neighborhood, "budgetMin", "budgetMax", 
      bio, photos, age, "petPref", "smokePref", diet, "scheduleNotes", 
      tags, "acceptsMessages", "highlightedUntil", "isSuspended", 
      "expiresAt", "isPaid", "createdAt", "updatedAt"
    )
    VALUES (
      gen_random_uuid()::text,
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'communityRole', 'BUSCO')::"CommunityRole",
      COALESCE(NEW.raw_user_meta_data->>'city', 'Posadas'),
      NEW.raw_user_meta_data->>'neighborhood',
      COALESCE((NEW.raw_user_meta_data->>'budgetMin')::INTEGER, 0),
      COALESCE((NEW.raw_user_meta_data->>'budgetMax')::INTEGER, 100000),
      NEW.raw_user_meta_data->>'bio',
      COALESCE(
        CASE 
          WHEN NEW.raw_user_meta_data->>'photos' IS NOT NULL 
          THEN ARRAY[NEW.raw_user_meta_data->>'photos']
          ELSE ARRAY[]::text[]
        END,
        ARRAY[]::text[]
      ),
      CASE 
        WHEN NEW.raw_user_meta_data->>'age' IS NOT NULL 
        THEN (NEW.raw_user_meta_data->>'age')::INTEGER 
        ELSE NULL 
      END,
      COALESCE(NEW.raw_user_meta_data->>'petPref', 'INDIFERENTE')::"PetPref",
      COALESCE(NEW.raw_user_meta_data->>'smokePref', 'INDIFERENTE')::"SmokePref",
      COALESCE(NEW.raw_user_meta_data->>'diet', 'NINGUNA')::"Diet",
      NEW.raw_user_meta_data->>'scheduleNotes',
      COALESCE(
        CASE 
          WHEN NEW.raw_user_meta_data->>'tags' IS NOT NULL 
          THEN string_to_array(NEW.raw_user_meta_data->>'tags', ',')
          ELSE ARRAY[]::text[]
        END,
        ARRAY[]::text[]
      ),
      TRUE,
      NULL,
      FALSE,
      NOW() + INTERVAL '30 days',
      FALSE,
      NOW(),
      NOW()
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para manejar expiración de propiedades
CREATE OR REPLACE FUNCTION public.handle_property_expiration()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW."isPaid" = FALSE AND NEW."expiresAt" IS NULL THEN
    NEW."expiresAt" = NOW() + INTERVAL '30 days';
  END IF;
  
  IF NEW."isPaid" = TRUE AND OLD."isPaid" = FALSE THEN
    NEW."expiresAt" = NOW() + INTERVAL '90 days';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Función para actualizar timestamps
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Función para validar datos de usuario
CREATE OR REPLACE FUNCTION public.validate_user_data()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
    RAISE EXCEPTION 'Email inválido: %', NEW.email;
  END IF;
  
  IF NEW."userType" IS NOT NULL AND NEW."userType" NOT IN ('inquilino', 'dueno_directo', 'inmobiliaria') THEN
    RAISE EXCEPTION 'Tipo de usuario inválido: %', NEW."userType";
  END IF;
  
  IF NEW."userType" = 'inmobiliaria' AND (NEW."licenseNumber" IS NULL OR NEW."licenseNumber" = '') THEN
    RAISE EXCEPTION 'Las inmobiliarias deben tener número de licencia';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Función para estadísticas de pagos
CREATE OR REPLACE FUNCTION public.update_payment_analytics()
RETURNS TRIGGER AS $$
DECLARE
  analytics_date DATE;
  analytics_record RECORD;
BEGIN
  analytics_date := DATE(COALESCE(NEW."dateApproved", NEW."dateCreated"));
  
  SELECT * INTO analytics_record 
  FROM public."PaymentAnalytics" 
  WHERE date = analytics_date AND period = 'daily';
  
  IF analytics_record IS NULL THEN
    INSERT INTO public."PaymentAnalytics" (
      id, date, period, "totalPayments", "successfulPayments", 
      "failedPayments", "pendingPayments", "totalAmount", 
      "successfulAmount", "averageAmount", "createdAt", "updatedAt"
    )
    VALUES (
      gen_random_uuid()::text,
      analytics_date,
      'daily',
      1,
      CASE WHEN NEW.status = 'approved' THEN 1 ELSE 0 END,
      CASE WHEN NEW.status IN ('rejected', 'cancelled') THEN 1 ELSE 0 END,
      CASE WHEN NEW.status = 'pending' THEN 1 ELSE 0 END,
      NEW.amount,
      CASE WHEN NEW.status = 'approved' THEN NEW.amount ELSE 0 END,
      NEW.amount,
      NOW(),
      NOW()
    );
  ELSE
    UPDATE public."PaymentAnalytics"
    SET 
      "totalPayments" = "totalPayments" + 1,
      "successfulPayments" = "successfulPayments" + CASE WHEN NEW.status = 'approved' THEN 1 ELSE 0 END,
      "failedPayments" = "failedPayments" + CASE WHEN NEW.status IN ('rejected', 'cancelled') THEN 1 ELSE 0 END,
      "pendingPayments" = "pendingPayments" + CASE WHEN NEW.status = 'pending' THEN 1 ELSE 0 END,
      "totalAmount" = "totalAmount" + NEW.amount,
      "successfulAmount" = "successfulAmount" + CASE WHEN NEW.status = 'approved' THEN NEW.amount ELSE 0 END,
      "averageAmount" = ("totalAmount" + NEW.amount) / ("totalPayments" + 1),
      "updatedAt" = NOW()
    WHERE date = analytics_date AND period = 'daily';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- 2. CREAR TODOS LOS TRIGGERS
-- =============================================================================

-- Trigger para crear usuario automáticamente
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger para actualizar usuario
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_user_update();

-- Trigger para eliminar usuario
DROP TRIGGER IF EXISTS on_auth_user_deleted ON auth.users;
CREATE TRIGGER on_auth_user_deleted
  AFTER DELETE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_user_delete();

-- Trigger para crear perfil de comunidad
DROP TRIGGER IF EXISTS on_auth_user_community_profile ON auth.users;
CREATE TRIGGER on_auth_user_community_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_community_profile_creation();

-- Trigger para manejar expiración de propiedades
DROP TRIGGER IF EXISTS on_property_expiration ON public."Property";
CREATE TRIGGER on_property_expiration
  BEFORE INSERT OR UPDATE ON public."Property"
  FOR EACH ROW EXECUTE FUNCTION public.handle_property_expiration();

-- Trigger para actualizar updatedAt en Property
DROP TRIGGER IF EXISTS on_property_updated_at ON public."Property";
CREATE TRIGGER on_property_updated_at
  BEFORE UPDATE ON public."Property"
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Trigger para actualizar updatedAt en User
DROP TRIGGER IF EXISTS on_user_updated_at ON public."User";
CREATE TRIGGER on_user_updated_at
  BEFORE UPDATE ON public."User"
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Trigger para actualizar updatedAt en UserProfile
DROP TRIGGER IF EXISTS on_user_profile_updated_at ON public."UserProfile";
CREATE TRIGGER on_user_profile_updated_at
  BEFORE UPDATE ON public."UserProfile"
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Trigger para validar datos de usuario
DROP TRIGGER IF EXISTS on_user_validate ON public."User";
CREATE TRIGGER on_user_validate
  BEFORE INSERT OR UPDATE ON public."User"
  FOR EACH ROW EXECUTE FUNCTION public.validate_user_data();

-- Trigger para estadísticas de pagos
DROP TRIGGER IF EXISTS on_payment_analytics ON public."Payment";
CREATE TRIGGER on_payment_analytics
  AFTER INSERT OR UPDATE ON public."Payment"
  FOR EACH ROW EXECUTE FUNCTION public.update_payment_analytics();

-- =============================================================================
-- 3. POLÍTICAS RLS (ROW LEVEL SECURITY)
-- =============================================================================

-- Habilitar RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Property" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."UserProfile" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Payment" ENABLE ROW LEVEL SECURITY;

-- Políticas para profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Políticas para User
DROP POLICY IF EXISTS "Users can view own user record" ON public."User";
CREATE POLICY "Users can view own user record" ON public."User"
  FOR SELECT USING (auth.uid()::text = id);

DROP POLICY IF EXISTS "Users can update own user record" ON public."User";
CREATE POLICY "Users can update own user record" ON public."User"
  FOR UPDATE USING (auth.uid()::text = id);

-- Políticas para Property
DROP POLICY IF EXISTS "Anyone can view properties" ON public."Property";
CREATE POLICY "Anyone can view properties" ON public."Property"
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert own properties" ON public."Property";
CREATE POLICY "Users can insert own properties" ON public."Property"
  FOR INSERT WITH CHECK (auth.uid()::text = "userId");

DROP POLICY IF EXISTS "Users can update own properties" ON public."Property";
CREATE POLICY "Users can update own properties" ON public."Property"
  FOR UPDATE USING (auth.uid()::text = "userId");

DROP POLICY IF EXISTS "Users can delete own properties" ON public."Property";
CREATE POLICY "Users can delete own properties" ON public."Property"
  FOR DELETE USING (auth.uid()::text = "userId");

-- Políticas para UserProfile
DROP POLICY IF EXISTS "Anyone can view community profiles" ON public."UserProfile";
CREATE POLICY "Anyone can view community profiles" ON public."UserProfile"
  FOR SELECT USING (NOT "isSuspended");

DROP POLICY IF EXISTS "Users can insert own community profile" ON public."UserProfile";
CREATE POLICY "Users can insert own community profile" ON public."UserProfile"
  FOR INSERT WITH CHECK (auth.uid()::text = "userId");

DROP POLICY IF EXISTS "Users can update own community profile" ON public."UserProfile";
CREATE POLICY "Users can update own community profile" ON public."UserProfile"
  FOR UPDATE USING (auth.uid()::text = "userId");

DROP POLICY IF EXISTS "Users can delete own community profile" ON public."UserProfile";
CREATE POLICY "Users can delete own community profile" ON public."UserProfile"
  FOR DELETE USING (auth.uid()::text = "userId");

-- Políticas para Payment
DROP POLICY IF EXISTS "Users can view own payments" ON public."Payment";
CREATE POLICY "Users can view own payments" ON public."Payment"
  FOR SELECT USING (auth.uid()::text = "userId");

DROP POLICY IF EXISTS "Users can insert own payments" ON public."Payment";
CREATE POLICY "Users can insert own payments" ON public."Payment"
  FOR INSERT WITH CHECK (auth.uid()::text = "userId");

-- =============================================================================
-- 4. FUNCIONES AUXILIARES
-- =============================================================================

-- Función para obtener perfil completo del usuario actual
CREATE OR REPLACE FUNCTION public.get_current_user_profile()
RETURNS TABLE (
  id TEXT,
  name TEXT,
  email TEXT,
  phone TEXT,
  avatar TEXT,
  bio TEXT,
  user_type TEXT,
  email_verified BOOLEAN,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.name,
    u.email,
    u.phone,
    u.avatar,
    u.bio,
    u."userType",
    u."emailVerified",
    u."createdAt"
  FROM public."User" u
  WHERE u.id = auth.uid()::text;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para verificar si un usuario tiene perfil de comunidad
CREATE OR REPLACE FUNCTION public.has_community_profile(user_id TEXT DEFAULT NULL)
RETURNS BOOLEAN AS $$
DECLARE
  target_user_id TEXT;
BEGIN
  target_user_id := COALESCE(user_id, auth.uid()::text);
  
  RETURN EXISTS (
    SELECT 1 FROM public."UserProfile" 
    WHERE "userId" = target_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para obtener estadísticas del usuario
CREATE OR REPLACE FUNCTION public.get_user_stats(user_id TEXT DEFAULT NULL)
RETURNS TABLE (
  total_properties INTEGER,
  active_properties INTEGER,
  total_payments INTEGER,
  successful_payments INTEGER,
  total_spent NUMERIC
) AS $$
DECLARE
  target_user_id TEXT;
BEGIN
  target_user_id := COALESCE(user_id, auth.uid()::text);
  
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*)::INTEGER FROM public."Property" WHERE "userId" = target_user_id),
    (SELECT COUNT(*)::INTEGER FROM public."Property" WHERE "userId" = target_user_id AND status = 'AVAILABLE'),
    (SELECT COUNT(*)::INTEGER FROM public."Payment" WHERE "userId" = target_user_id),
    (SELECT COUNT(*)::INTEGER FROM public."Payment" WHERE "userId" = target_user_id AND status = 'approved'),
    (SELECT COALESCE(SUM(amount), 0) FROM public."Payment" WHERE "userId" = target_user_id AND status = 'approved');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- 5. MENSAJE DE CONFIRMACIÓN
-- =============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ TODOS LOS TRIGGERS CREADOS EXITOSAMENTE';
  RAISE NOTICE '✅ Funciones trigger: 8 creadas';
  RAISE NOTICE '✅ Triggers: 10 creados';
  RAISE NOTICE '✅ Políticas RLS: 12 creadas';
  RAISE NOTICE '✅ Funciones auxiliares: 3 creadas';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 RESULTADO: Cuando un usuario se registre en Supabase Auth:';
  RAISE NOTICE '   - Se creará automáticamente en tabla profiles';
  RAISE NOTICE '   - Se creará automáticamente en tabla User';
  RAISE NOTICE '   - Se creará perfil de comunidad si se solicita';
  RAISE NOTICE '   - Todas las políticas de seguridad estarán activas';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 EL SISTEMA ESTÁ LISTO PARA FUNCIONAR';
END $$;
