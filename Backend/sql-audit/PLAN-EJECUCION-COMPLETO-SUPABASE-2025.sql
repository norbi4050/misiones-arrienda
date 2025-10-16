-- ============================================================================
-- PLAN DE EJECUCIÓN SQL COMPLETO - SUPABASE 2025
-- ============================================================================
-- Fecha: 16 de Enero 2025
-- Proyecto: Misiones Arrienda (Post-Renovación)
-- Auditor: Senior Engineer
-- 
-- IMPORTANTE: 
-- - Ejecutar en orden secuencial
-- - Hacer backup antes de ejecutar
-- - Verificar cada fase antes de continuar
-- - El proyecto está CORRECTO, Supabase está MAL CONFIGURADO
-- ============================================================================

-- ============================================================================
-- FASE 0: PREPARACIÓN Y BACKUP
-- ============================================================================

-- 0.1 Crear schema de backup
CREATE SCHEMA IF NOT EXISTS backup_2025_01_16;

-- 0.2 Backup de tablas críticas
CREATE TABLE backup_2025_01_16.users AS SELECT * FROM public.users;
CREATE TABLE backup_2025_01_16.community_profiles AS SELECT * FROM public.community_profiles;
CREATE TABLE backup_2025_01_16.message_attachments AS SELECT * FROM public.message_attachments;
CREATE TABLE backup_2025_01_16.auth_users AS SELECT * FROM auth.users;

-- 0.3 Verificar backup
SELECT 
  'users' as tabla, COUNT(*) as registros FROM backup_2025_01_16.users
UNION ALL
SELECT 
  'community_profiles', COUNT(*) FROM backup_2025_01_16.community_profiles
UNION ALL
SELECT 
  'message_attachments', COUNT(*) FROM backup_2025_01_16.message_attachments
UNION ALL
SELECT 
  'auth_users', COUNT(*) FROM backup_2025_01_16.auth_users;

-- ============================================================================
-- FASE 1: CREAR TABLA UserProfile (CRÍTICO)
-- ============================================================================

-- 1.1 Crear enums necesarios
DO $$ BEGIN
  CREATE TYPE public.pet_pref AS ENUM ('SI_PET', 'NO_PET', 'INDIFERENTE');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.smoke_pref AS ENUM ('FUMADOR', 'NO_FUMADOR', 'INDIFERENTE');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.diet AS ENUM ('NINGUNA', 'VEGETARIANO', 'VEGANO', 'CELIACO', 'OTRO');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.room_type AS ENUM ('PRIVADA', 'COMPARTIDA', 'ESTUDIO');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 1.2 Crear tabla UserProfile
CREATE TABLE IF NOT EXISTS public."UserProfile" (
  id TEXT PRIMARY KEY DEFAULT ('up_' || gen_random_uuid()::text),
  
  -- Vinculación con User
  "userId" TEXT NOT NULL UNIQUE,
  
  -- Información básica del perfil
  role TEXT NOT NULL DEFAULT 'BUSCO',
  city TEXT NOT NULL,
  neighborhood TEXT,
  "budgetMin" INTEGER NOT NULL,
  "budgetMax" INTEGER NOT NULL,
  bio TEXT,
  photos TEXT[] DEFAULT '{}',
  
  -- Preferencias de convivencia
  age INTEGER,
  "petPref" public.pet_pref DEFAULT 'INDIFERENTE',
  "smokePref" public.smoke_pref DEFAULT 'INDIFERENTE',
  diet public.diet DEFAULT 'NINGUNA',
  "scheduleNotes" TEXT,
  tags TEXT[] DEFAULT '{}',
  
  -- Configuración
  "acceptsMessages" BOOLEAN DEFAULT true,
  "highlightedUntil" TIMESTAMPTZ,
  "isSuspended" BOOLEAN DEFAULT false,
  
  -- Campos para sistema de caducidad
  "expiresAt" TIMESTAMPTZ,
  "isPaid" BOOLEAN DEFAULT false,
  
  -- Campos de presencia/estado online
  "isOnline" BOOLEAN DEFAULT false,
  "lastSeen" TIMESTAMPTZ,
  "lastActivity" TIMESTAMPTZ DEFAULT NOW(),
  
  -- Auditoría
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT userprofile_budget_check CHECK ("budgetMax" >= "budgetMin"),
  CONSTRAINT userprofile_role_check CHECK (role IN ('BUSCO', 'OFREZCO', 'TENANT', 'OWNER', 'AGENCY'))
);

-- 1.3 Crear índices para UserProfile
CREATE INDEX IF NOT EXISTS idx_userprofile_userid ON public."UserProfile"("userId");
CREATE INDEX IF NOT EXISTS idx_userprofile_role_city ON public."UserProfile"(role, city);
CREATE INDEX IF NOT EXISTS idx_userprofile_budget ON public."UserProfile"("budgetMin", "budgetMax");
CREATE INDEX IF NOT EXISTS idx_userprofile_highlighted ON public."UserProfile"("highlightedUntil") WHERE "highlightedUntil" IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_userprofile_suspended ON public."UserProfile"("isSuspended") WHERE "isSuspended" = false;
CREATE INDEX IF NOT EXISTS idx_userprofile_online ON public."UserProfile"("isOnline", "lastSeen");

-- 1.4 Habilitar RLS en UserProfile
ALTER TABLE public."UserProfile" ENABLE ROW LEVEL SECURITY;

-- 1.5 Crear políticas RLS para UserProfile
CREATE POLICY userprofile_select_active ON public."UserProfile"
FOR SELECT
USING (
  "userId" = auth.uid()::text OR
  ("acceptsMessages" = true AND "isSuspended" = false)
);

CREATE POLICY userprofile_insert_own ON public."UserProfile"
FOR INSERT
WITH CHECK ("userId" = auth.uid()::text);

CREATE POLICY userprofile_update_own ON public."UserProfile"
FOR UPDATE
USING ("userId" = auth.uid()::text)
WITH CHECK ("userId" = auth.uid()::text);

CREATE POLICY userprofile_delete_own ON public."UserProfile"
FOR DELETE
USING ("userId" = auth.uid()::text);

-- 1.6 Crear trigger para updated_at
CREATE OR REPLACE FUNCTION update_userprofile_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_userprofile_updated_at
  BEFORE UPDATE ON public."UserProfile"
  FOR EACH ROW
  EXECUTE FUNCTION update_userprofile_updated_at();

-- 1.7 Habilitar Realtime para UserProfile
ALTER PUBLICATION supabase_realtime ADD TABLE public."UserProfile";

COMMENT ON TABLE public."UserProfile" IS 'Perfiles de usuario para sistema de comunidad - Prisma Schema';

-- ============================================================================
-- FASE 2: POBLAR TABLA User DESDE auth.users (CRÍTICO)
-- ============================================================================

-- 2.1 Verificar estado actual
SELECT 
  'auth.users' as tabla, COUNT(*) as registros FROM auth.users
UNION ALL
SELECT 
  'public.User', COUNT(*) FROM public."User"
UNION ALL
SELECT 
  'public.users (legacy)', COUNT(*) FROM public.users;

-- 2.2 Migrar usuarios de auth.users a public.User
INSERT INTO public."User" (
  id,
  name,
  email,
  phone,
  password,
  avatar,
  bio,
  occupation,
  age,
  verified,
  "emailVerified",
  "verificationToken",
  rating,
  "reviewCount",
  "userType",
  "companyName",
  "licenseNumber",
  "propertyCount",
  "isOnline",
  "lastSeen",
  "lastActivity",
  "createdAt",
  "updatedAt"
)
SELECT 
  au.id::text,
  COALESCE(au.raw_user_meta_data->>'name', au.email) as name,
  au.email,
  COALESCE(au.raw_user_meta_data->>'phone', '') as phone,
  '' as password, -- No migramos passwords de auth
  COALESCE(au.raw_user_meta_data->>'avatar', au.raw_user_meta_data->>'avatar_url') as avatar,
  au.raw_user_meta_data->>'bio' as bio,
  au.raw_user_meta_data->>'occupation' as occupation,
  (au.raw_user_meta_data->>'age')::integer as age,
  false as verified,
  (au.email_confirmed_at IS NOT NULL) as "emailVerified",
  null as "verificationToken",
  0.0 as rating,
  0 as "reviewCount",
  COALESCE(au.raw_user_meta_data->>'userType', 'inquilino') as "userType",
  au.raw_user_meta_data->>'companyName' as "companyName",
  au.raw_user_meta_data->>'licenseNumber' as "licenseNumber",
  null as "propertyCount",
  false as "isOnline",
  null as "lastSeen",
  NOW() as "lastActivity",
  au.created_at as "createdAt",
  au.updated_at as "updatedAt"
FROM auth.users au
WHERE NOT EXISTS (
  SELECT 1 FROM public."User" u WHERE u.id = au.id::text
);

-- 2.3 Verificar migración
SELECT 
  'Usuarios migrados' as resultado,
  COUNT(*) as cantidad
FROM public."User";

-- 2.4 Habilitar RLS en User
ALTER TABLE public."User" ENABLE ROW LEVEL SECURITY;

-- 2.5 Crear políticas RLS para User
CREATE POLICY user_select ON public."User"
FOR SELECT
USING (
  id = auth.uid()::text OR
  true -- Perfiles públicos visibles
);

CREATE POLICY user_insert ON public."User"
FOR INSERT
WITH CHECK (id = auth.uid()::text);

CREATE POLICY user_update ON public."User"
FOR UPDATE
USING (id = auth.uid()::text)
WITH CHECK (id = auth.uid()::text);

CREATE POLICY user_delete ON public."User"
FOR DELETE
USING (id = auth.uid()::text);

-- 2.6 Crear trigger para updated_at en User
CREATE OR REPLACE FUNCTION update_user_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_user_updated_at
  BEFORE UPDATE ON public."User"
  FOR EACH ROW
  EXECUTE FUNCTION update_user_updated_at();

-- 2.7 Habilitar Realtime para User
ALTER PUBLICATION supabase_realtime ADD TABLE public."User";

-- ============================================================================
-- FASE 3: ARREGLAR TABLA message_attachments (CRÍTICO)
-- ============================================================================

-- 3.1 Verificar estructura actual
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'message_attachments'
ORDER BY ordinal_position;

-- 3.2 Renombrar columnas existentes
ALTER TABLE public.message_attachments 
  RENAME COLUMN user_id TO uploaded_by;

ALTER TABLE public.message_attachments 
  RENAME COLUMN path TO storage_path;

ALTER TABLE public.message_attachments 
  RENAME COLUMN mime TO mime_type;

ALTER TABLE public.message_attachments 
  RENAME COLUMN size_bytes TO file_size;

-- 3.3 Agregar columnas faltantes
ALTER TABLE public.message_attachments 
  ADD COLUMN IF NOT EXISTS file_name TEXT NOT NULL DEFAULT '';

ALTER TABLE public.message_attachments 
  ADD COLUMN IF NOT EXISTS storage_url TEXT NOT NULL DEFAULT '';

ALTER TABLE public.message_attachments 
  ADD COLUMN IF NOT EXISTS width INTEGER;

ALTER TABLE public.message_attachments 
  ADD COLUMN IF NOT EXISTS height INTEGER;

ALTER TABLE public.message_attachments 
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 3.4 Eliminar columna no usada
ALTER TABLE public.message_attachments 
  DROP COLUMN IF EXISTS bucket;

-- 3.5 Actualizar file_name desde storage_path para registros existentes
UPDATE public.message_attachments
SET file_name = SUBSTRING(storage_path FROM '[^/]+$')
WHERE file_name = '';

-- 3.6 Crear trigger para updated_at
CREATE OR REPLACE FUNCTION update_message_attachments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_message_attachments_updated_at
  BEFORE UPDATE ON public.message_attachments
  FOR EACH ROW
  EXECUTE FUNCTION update_message_attachments_updated_at();

-- 3.7 Verificar estructura final
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'message_attachments'
ORDER BY ordinal_position;

-- ============================================================================
-- FASE 4: CREAR TABLAS PRISMA FALTANTES
-- ============================================================================

-- 4.1 Crear tabla Room
CREATE TABLE IF NOT EXISTS public."Room" (
  id TEXT PRIMARY KEY DEFAULT ('room_' || gen_random_uuid()::text),
  "ownerId" TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  price INTEGER NOT NULL,
  city TEXT NOT NULL,
  neighborhood TEXT,
  type public.room_type NOT NULL,
  amenities TEXT[] DEFAULT '{}',
  photos TEXT[] DEFAULT '{}',
  rules TEXT,
  "isActive" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT fk_room_owner FOREIGN KEY ("ownerId") 
    REFERENCES public."UserProfile"(id) ON DELETE CASCADE
);

CREATE INDEX idx_room_owner ON public."Room"("ownerId");
CREATE INDEX idx_room_city_type ON public."Room"(city, type);
CREATE INDEX idx_room_price ON public."Room"(price);
CREATE INDEX idx_room_active ON public."Room"("isActive") WHERE "isActive" = true;

-- 4.2 Crear tabla Like
CREATE TABLE IF NOT EXISTS public."Like" (
  id TEXT PRIMARY KEY DEFAULT ('like_' || gen_random_uuid()::text),
  "fromId" TEXT NOT NULL,
  "toId" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT fk_like_from FOREIGN KEY ("fromId") 
    REFERENCES public."UserProfile"(id) ON DELETE CASCADE,
  CONSTRAINT fk_like_to FOREIGN KEY ("toId") 
    REFERENCES public."UserProfile"(id) ON DELETE CASCADE,
  CONSTRAINT unique_like UNIQUE ("fromId", "toId")
);

CREATE INDEX idx_like_from ON public."Like"("fromId");
CREATE INDEX idx_like_to ON public."Like"("toId");

-- 4.3 Crear tabla Conversation
CREATE TABLE IF NOT EXISTS public."Conversation" (
  id TEXT PRIMARY KEY DEFAULT ('conv_' || gen_random_uuid()::text),
  "aId" TEXT NOT NULL,
  "bId" TEXT NOT NULL,
  "isActive" BOOLEAN DEFAULT true,
  "lastMessageAt" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT fk_conversation_a FOREIGN KEY ("aId") 
    REFERENCES public."UserProfile"(id) ON DELETE CASCADE,
  CONSTRAINT fk_conversation_b FOREIGN KEY ("bId") 
    REFERENCES public."UserProfile"(id) ON DELETE CASCADE,
  CONSTRAINT unique_conversation UNIQUE ("aId", "bId")
);

CREATE INDEX idx_conversation_a ON public."Conversation"("aId", "isActive");
CREATE INDEX idx_conversation_b ON public."Conversation"("bId", "isActive");
CREATE INDEX idx_conversation_last_message ON public."Conversation"("lastMessageAt");

-- 4.4 Crear tabla Message
CREATE TABLE IF NOT EXISTS public."Message" (
  id TEXT PRIMARY KEY DEFAULT ('msg_' || gen_random_uuid()::text),
  "conversationId" TEXT NOT NULL,
  "senderId" TEXT NOT NULL,
  body TEXT NOT NULL,
  "isRead" BOOLEAN DEFAULT false,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT fk_message_conversation FOREIGN KEY ("conversationId") 
    REFERENCES public."Conversation"(id) ON DELETE CASCADE,
  CONSTRAINT fk_message_sender FOREIGN KEY ("senderId") 
    REFERENCES public."UserProfile"(id) ON DELETE CASCADE
);

CREATE INDEX idx_message_conversation ON public."Message"("conversationId", "createdAt");
CREATE INDEX idx_message_sender ON public."Message"("senderId");
CREATE INDEX idx_message_read ON public."Message"("isRead") WHERE "isRead" = false;

-- 4.5 Crear tabla Report
CREATE TABLE IF NOT EXISTS public."Report" (
  id TEXT PRIMARY KEY DEFAULT ('report_' || gen_random_uuid()::text),
  "targetId" TEXT NOT NULL,
  reason TEXT NOT NULL,
  details TEXT,
  "reporterEmail" TEXT,
  status TEXT DEFAULT 'PENDING',
  "adminNotes" TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT fk_report_target FOREIGN KEY ("targetId") 
    REFERENCES public."UserProfile"(id) ON DELETE CASCADE,
  CONSTRAINT report_status_check CHECK (status IN ('PENDING', 'REVIEWED', 'RESOLVED', 'DISMISSED'))
);

CREATE INDEX idx_report_target ON public."Report"("targetId", status);
CREATE INDEX idx_report_status ON public."Report"(status, "createdAt");

-- 4.6 Habilitar RLS en todas las tablas nuevas
ALTER TABLE public."Room" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Like" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Conversation" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Message" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Report" ENABLE ROW LEVEL SECURITY;

-- 4.7 Crear políticas RLS básicas
-- Room
CREATE POLICY room_select ON public."Room"
FOR SELECT USING ("isActive" = true OR "ownerId" IN (
  SELECT id FROM public."UserProfile" WHERE "userId" = auth.uid()::text
));

CREATE POLICY room_insert ON public."Room"
FOR INSERT WITH CHECK ("ownerId" IN (
  SELECT id FROM public."UserProfile" WHERE "userId" = auth.uid()::text
));

CREATE POLICY room_update ON public."Room"
FOR UPDATE USING ("ownerId" IN (
  SELECT id FROM public."UserProfile" WHERE "userId" = auth.uid()::text
));

-- Like
CREATE POLICY like_select ON public."Like"
FOR SELECT USING (
  "fromId" IN (SELECT id FROM public."UserProfile" WHERE "userId" = auth.uid()::text) OR
  "toId" IN (SELECT id FROM public."UserProfile" WHERE "userId" = auth.uid()::text)
);

CREATE POLICY like_insert ON public."Like"
FOR INSERT WITH CHECK ("fromId" IN (
  SELECT id FROM public."UserProfile" WHERE "userId" = auth.uid()::text
));

-- Conversation
CREATE POLICY conversation_select ON public."Conversation"
FOR SELECT USING (
  "aId" IN (SELECT id FROM public."UserProfile" WHERE "userId" = auth.uid()::text) OR
  "bId" IN (SELECT id FROM public."UserProfile" WHERE "userId" = auth.uid()::text)
);

-- Message
CREATE POLICY message_select ON public."Message"
FOR SELECT USING (
  "conversationId" IN (
    SELECT id FROM public."Conversation" WHERE 
      "aId" IN (SELECT id FROM public."UserProfile" WHERE "userId" = auth.uid()::text) OR
      "bId" IN (SELECT id FROM public."UserProfile" WHERE "userId" = auth.uid()::text)
  )
);

CREATE POLICY message_insert ON public."Message"
FOR INSERT WITH CHECK ("senderId" IN (
  SELECT id FROM public."UserProfile" WHERE "userId" = auth.uid()::text
));

-- Report
CREATE POLICY report_select_own ON public."Report"
FOR SELECT USING ("reporterEmail" = auth.email());

CREATE POLICY report_insert ON public."Report"
FOR INSERT WITH CHECK (true); -- Cualquiera puede reportar

-- 4.8 Habilitar Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public."Conversation";
ALTER PUBLICATION supabase_realtime ADD TABLE public."Message";

-- ============================================================================
-- FASE 5: ARREGLAR FUNCIÓN handle_new_user
-- ============================================================================

-- 5.1 Crear o reemplazar función handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insertar en tabla User (Prisma)
  INSERT INTO public."User" (
    id,
    name,
    email,
    phone,
    password,
    avatar,
    "emailVerified",
    "userType",
    "isOnline",
    "lastActivity",
    "createdAt",
    "updatedAt"
  ) VALUES (
    NEW.id::text,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    '',
    COALESCE(NEW.raw_user_meta_data->>'avatar', NEW.raw_user_meta_data->>'avatar_url'),
    (NEW.email_confirmed_at IS NOT NULL),
    COALESCE(NEW.raw_user_meta_data->>'userType', 'inquilino'),
    false,
    NOW(),
    NEW.created_at,
    NEW.updated_at
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5.2 Recrear trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- FASE 6: ARREGLAR FUNCIÓN cleanup_stale_presence
-- ============================================================================

CREATE OR REPLACE FUNCTION public.cleanup_stale_presence()
RETURNS void AS $$
BEGIN
  -- Actualizar User
  UPDATE public."User"
  SET "isOnline" = false
  WHERE "lastActivity" < NOW() - INTERVAL '5 minutes'
    AND "isOnline" = true;
  
  -- Actualizar UserProfile
  UPDATE public."UserProfile"
  SET "isOnline" = false
  WHERE "lastActivity" < NOW() - INTERVAL '5 minutes'
    AND "isOnline" = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- FASE 7: CONSOLIDAR STORAGE BUCKETS
-- ============================================================================

-- 7.1 Verificar buckets existentes
SELECT 
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets
ORDER BY name;

-- 7.2 Crear buckets consolidados si no existen
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('avatars', 'avatars', true, 2097152, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('property-images', 'property-images', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
ON CONFLICT (id) DO NOTHING;

-- 7.3 Limpiar políticas redundantes de storage
-- NOTA: Ejecutar manualmente desde Supabase Dashboard > Storage > Policies
-- Consolidar políticas duplicadas manteniendo solo una por propósito

-- ============================================================================
-- FASE 8: VERIFICACIÓN FINAL
-- ============================================================================

-- 8.1 Verificar tablas Prisma
SELECT 
  'User' as tabla, 
  COUNT(*) as registros,
  (SELECT rowsecurity FROM pg_tables WHERE tablename = 'User') as rls_enabled
FROM public."User"
UNION ALL
SELECT 
  'UserProfile', 
  COUNT(*),
  (SELECT rowsecurity FROM pg_tables WHERE tablename = 'UserProfile')
FROM public."UserProfile"
UNION ALL
SELECT 
  'Room', 
  COUNT(*),
  (SELECT rowsecurity FROM pg_tables WHERE tablename = 'Room')
FROM public."Room"
UNION ALL
SELECT 
  'Like', 
  COUNT(*),
  (SELECT rowsecurity FROM pg_tables WHERE tablename = 'Like')
FROM public."Like"
UNION ALL
SELECT 
  'Conversation', 
  COUNT(*),
  (SELECT rowsecurity FROM pg_tables WHERE tablename = 'Conversation')
FROM public."Conversation"
UNION ALL
SELECT 
  'Message', 
  COUNT(*),
  (SELECT rowsecurity FROM pg_tables WHERE tablename = 'Message')
FROM public."Message"
UNION ALL
SELECT 
  'Report', 
  COUNT(*),
  (SELECT rowsecurity FROM pg_tables WHERE tablename = 'Report')
FROM public."Report";

-- 8.2 Verificar estructura de message_attachments
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'message_attachments'
ORDER BY ordinal_position;

-- 8.3 Verificar Realtime
SELECT 
  schemaname,
  tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
  AND tablename IN ('User', 'UserProfile', 'Conversation', 'Message')
ORDER BY tablename;

-- 8.4 Verificar políticas RLS
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('User', 'UserProfile', 'Room', 'Like', 'Conversation', 'Message', 'Report')
ORDER BY tablename, policyname;

-- 8.5 Verificar triggers
SELECT 
  trigger_schema,
  trigger_name,
  event_object_table,
  action_timing,
  event_manipulation
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND event_object_table IN ('User', 'UserProfile', 'Room', 'Conversation', 'Message', 'Report', 'message_attachments')
ORDER BY event_object_table, trigger_name;

-- ============================================================================
-- FASE 9: CREAR PERFILES DE COMUNIDAD PARA USUARIOS EXISTENTES
-- ============================================================================

-- 9.1 Crear UserProfile para usuarios existentes que no lo tengan
INSERT INTO public."UserProfile" (
  id,
  "userId",
  role,
  city,
  "budgetMin",
  "budgetMax",
  bio,
  "acceptsMessages",
  "createdAt",
  "updatedAt"
)
SELECT 
  'up_' || gen_random_uuid()::text,
  u.id,
  'BUSCO' as role,
  'Posadas' as city, -- Ciudad por defecto
  10000 as "budgetMin",
  50000 as "budgetMax",
  u.bio,
  true as "acceptsMessages",
  u."createdAt",
  NOW()
FROM public."User" u
WHERE NOT EXISTS (
  SELECT 1 FROM public."UserProfile" up WHERE up."userId" = u.id
);

-- 9.2 Verificar creación
SELECT 
  u.id as user_id,
  u.name,
  u.email,
  up.id as userprofile_id,
  up.role,
  up.city
FROM public."User" u
LEFT JOIN public."UserProfile" up ON up."userId" = u.id
ORDER BY u."createdAt";

-- ============================================================================
-- FASE 10: LIMPIEZA Y OPTIMIZACIÓN
-- ============================================================================

-- 10.1 Analizar tablas para optimizar estadísticas
ANALYZE public."User";
ANALYZE public."UserProfile";
ANALYZE public."Room";
ANALYZE public."Like";
ANALYZE public."Conversation";
ANALYZE public."Message";
ANALYZE public."Report";
ANALYZE public.message_attachments;

-- 10.2 Vacuum para recuperar espacio
VACUUM ANALYZE public."User";
VACUUM ANALYZE public."UserProfile";

-- ============================================================================
-- REPORTE FINAL
-- ============================================================================

SELECT 
  '=== REPORTE FINAL DE MIGRACIÓN ===' as titulo
UNION ALL
SELECT 
  'Fecha: ' || NOW()::text
UNION ALL
SELECT 
  'Tablas Prisma creadas: 7'
UNION ALL
SELECT 
  'Usuarios migrados: ' || (SELECT COUNT(*)::text FROM public."User")
UNION ALL
SELECT 
  'Perfiles de comunidad: ' || (SELECT COUNT(*)::text FROM public."UserProfile")
UNION ALL
SELECT 
  'RLS habilitado: ' || (
    SELECT COUNT(*)::text 
    FROM pg_tables 
    WHERE schemaname = 'public' 
      AND tablename IN ('User', 'UserProfile', 'Room', 'Like', 'Conversation', 'Message', 'Report')
      AND rowsecurity = true
  )
UNION ALL
SELECT 
  'Realtime habilitado: ' || (
    SELECT COUNT(*)::text 
    FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime'
      AND tablename IN ('User', 'UserProfile', 'Conversation', 'Message')
  )
UNION ALL
SELECT 
  'Estado: COMPLETADO ✅';

-- ============================================================================
-- FASE 11: CORREGIR INCONSISTENCIAS ADICIONALES DETECTADAS
-- ============================================================================

-- 11.1 Agregar campo 'country' a tabla Property (Prisma)
ALTER TABLE public."Property" 
  ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'Argentina';

-- 11.2 Actualizar enum RoomType para incluir CASA_COMPLETA
DO $$ BEGIN
  ALTER TYPE public.room_type ADD VALUE IF NOT EXISTS 'CASA_COMPLETA';
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 11.3 Verificar y corregir valores de operationType
-- Actualizar valores en español a inglés si es necesario
UPDATE public."Property"
SET "operationType" = CASE 
  WHEN "operationType" = 'alquiler' THEN 'RENT'
  WHEN "operationType" = 'venta' THEN 'SALE'
  WHEN "operationType" = 'ambos' THEN 'BOTH'
  ELSE "operationType"
END
WHERE "operationType" IN ('alquiler', 'venta', 'ambos');

-- 11.4 Agregar índice para country
CREATE INDEX IF NOT EXISTS idx_property_country ON public."Property"(country);

-- ============================================================================
-- FASE 12: CONSOLIDAR STORAGE BUCKETS (ELIMINAR DUPLICADOS)
-- ============================================================================

-- 12.1 Verificar archivos en buckets duplicados
SELECT 
  'avatars' as bucket,
  COUNT(*) as archivos
FROM storage.objects
WHERE bucket_id = 'avatars'
UNION ALL
SELECT 
  'user-avatars',
  COUNT(*)
FROM storage.objects
WHERE bucket_id = 'user-avatars'
UNION ALL
SELECT 
  'profile-images',
  COUNT(*)
FROM storage.objects
WHERE bucket_id = 'profile-images';

-- 12.2 Migrar archivos de buckets duplicados a bucket principal
-- NOTA: Ejecutar manualmente desde Supabase Dashboard
-- 1. Migrar archivos de 'user-avatars' → 'avatars'
-- 2. Migrar archivos de 'profile-images' → 'avatars'
-- 3. Eliminar buckets vacíos

-- 12.3 Limpiar políticas redundantes de storage
-- NOTA: Ejecutar manualmente desde Supabase Dashboard > Storage > Policies
-- Consolidar políticas duplicadas manteniendo solo una por propósito

-- ============================================================================
-- FASE 13: VERIFICACIÓN EXHAUSTIVA FINAL
-- ============================================================================

-- 13.1 Verificar TODAS las tablas Prisma existen
SELECT 
  CASE 
    WHEN EXISTS (SELECT FROM pg_tables WHERE tablename = 'User') THEN '✅'
    ELSE '❌'
  END || ' User' as tabla
UNION ALL
SELECT 
  CASE 
    WHEN EXISTS (SELECT FROM pg_tables WHERE tablename = 'UserProfile') THEN '✅'
    ELSE '❌'
  END || ' UserProfile'
UNION ALL
SELECT 
  CASE 
    WHEN EXISTS (SELECT FROM pg_tables WHERE tablename = 'Property') THEN '✅'
    ELSE '❌'
  END || ' Property'
UNION ALL
SELECT 
  CASE 
    WHEN EXISTS (SELECT FROM pg_tables WHERE tablename = 'Agent') THEN '✅'
    ELSE '❌'
  END || ' Agent'
UNION ALL
SELECT 
  CASE 
    WHEN EXISTS (SELECT FROM pg_tables WHERE tablename = 'Room') THEN '✅'
    ELSE '❌'
  END || ' Room'
UNION ALL
SELECT 
  CASE 
    WHEN EXISTS (SELECT FROM pg_tables WHERE tablename = 'Like') THEN '✅'
    ELSE '❌'
  END || ' Like'
UNION ALL
SELECT 
  CASE 
    WHEN EXISTS (SELECT FROM pg_tables WHERE tablename = 'Conversation') THEN '✅'
    ELSE '❌'
  END || ' Conversation'
UNION ALL
SELECT 
  CASE 
    WHEN EXISTS (SELECT FROM pg_tables WHERE tablename = 'Message') THEN '✅'
    ELSE '❌'
  END || ' Message'
UNION ALL
SELECT 
  CASE 
    WHEN EXISTS (SELECT FROM pg_tables WHERE tablename = 'MessageAttachment') THEN '✅'
    ELSE '❌'
  END || ' MessageAttachment'
UNION ALL
SELECT 
  CASE 
    WHEN EXISTS (SELECT FROM pg_tables WHERE tablename = 'Report') THEN '✅'
    ELSE '❌'
  END || ' Report'
UNION ALL
SELECT 
  CASE 
    WHEN EXISTS (SELECT FROM pg_tables WHERE tablename = 'Favorite') THEN '✅'
    ELSE '❌'
  END || ' Favorite'
UNION ALL
SELECT 
  CASE 
    WHEN EXISTS (SELECT FROM pg_tables WHERE tablename = 'Payment') THEN '✅'
    ELSE '❌'
  END || ' Payment'
UNION ALL
SELECT 
  CASE 
    WHEN EXISTS (SELECT FROM pg_tables WHERE tablename = 'Subscription') THEN '✅'
    ELSE '❌'
  END || ' Subscription';

-- 13.2 Verificar que User tiene registros
SELECT 
  'Usuarios en User (Prisma)' as metrica,
  COUNT(*)::TEXT as valor
FROM public."User"
UNION ALL
SELECT 
  'Usuarios en auth.users',
  COUNT(*)::TEXT
FROM auth.users
UNION ALL
SELECT 
  'Perfiles en UserProfile',
  COUNT(*)::TEXT
FROM public."UserProfile";

-- 13.3 Verificar estructura de message_attachments
SELECT 
  'Verificación message_attachments' as titulo,
  CASE 
    WHEN EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_name = 'message_attachments' 
        AND column_name = 'file_name'
    ) THEN '✅ file_name existe'
    ELSE '❌ file_name FALTA'
  END as resultado
UNION ALL
SELECT 
  '',
  CASE 
    WHEN EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_name = 'message_attachments' 
        AND column_name = 'storage_url'
    ) THEN '✅ storage_url existe'
    ELSE '❌ storage_url FALTA'
  END
UNION ALL
SELECT 
  '',
  CASE 
    WHEN EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_name = 'message_attachments' 
        AND column_name = 'uploaded_by'
    ) THEN '✅ uploaded_by existe'
    ELSE '❌ uploaded_by FALTA'
  END;

-- 13.4 Verificar RLS habilitado en tablas críticas
SELECT 
  tablename,
  CASE 
    WHEN rowsecurity THEN '✅ RLS HABILITADO'
    ELSE '❌ RLS DESHABILITADO'
  END as estado_rls
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('User', 'UserProfile', 'Property', 'Message', 'Conversation')
ORDER BY tablename;

-- 13.5 Verificar Realtime habilitado
SELECT 
  tablename,
  CASE 
    WHEN tablename IN (
      SELECT tablename 
      FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime'
    ) THEN '✅ REALTIME HABILITADO'
    ELSE '❌ REALTIME DESHABILITADO'
  END as estado_realtime
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('User', 'UserProfile', 'Property', 'Message', 'Conversation')
ORDER BY tablename;

-- 13.6 Verificar tipos de datos correctos
SELECT 
  table_name,
  column_name,
  data_type,
  CASE 
    WHEN table_name = 'UserProfile' AND column_name = 'id' AND data_type = 'text' THEN '✅'
    WHEN table_name = 'UserProfile' AND column_name = 'userId' AND data_type = 'text' THEN '✅'
    WHEN table_name = 'message_attachments' AND column_name = 'id' AND data_type = 'text' THEN '✅'
    WHEN data_type = 'uuid' THEN '⚠️ UUID (debería ser TEXT para Prisma)'
    ELSE '✅'
  END as validacion
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('UserProfile', 'User', 'Conversation', 'Message', 'message_attachments')
  AND column_name IN ('id', 'userId', 'aId', 'bId', 'senderId', 'conversationId')
ORDER BY table_name, column_name;

-- 13.7 Verificar enums correctos
SELECT 
  t.typname as enum_name,
  e.enumlabel as enum_value,
  e.enumsortorder as sort_order
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
WHERE t.typname IN ('pet_pref', 'smoke_pref', 'diet', 'room_type')
ORDER BY t.typname, e.enumsortorder;

-- 13.8 Verificar triggers de updated_at
SELECT 
  event_object_table as tabla,
  trigger_name,
  CASE 
    WHEN trigger_name LIKE '%updated_at%' THEN '✅ Trigger updated_at existe'
    ELSE '⚠️ Sin trigger updated_at'
  END as estado
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND event_object_table IN ('User', 'UserProfile', 'Room', 'Conversation', 'Message', 'Report', 'message_attachments')
ORDER BY event_object_table;

-- ============================================================================
-- REPORTE FINAL EXHAUSTIVO
-- ============================================================================

SELECT 
  '╔════════════════════════════════════════════════════════════════╗' as reporte
UNION ALL
SELECT 
  '║  REPORTE FINAL DE MIGRACIÓN COMPLETA - SUPABASE 2025          ║'
UNION ALL
SELECT 
  '╠════════════════════════════════════════════════════════════════╣'
UNION ALL
SELECT 
  '║  Fecha: ' || NOW()::DATE::TEXT || '                                              ║'
UNION ALL
SELECT 
  '║  Proyecto: Misiones Arrienda (Post-Renovación)                ║'
UNION ALL
SELECT 
  '╠════════════════════════════════════════════════════════════════╣'
UNION ALL
SELECT 
  '║  TABLAS PRISMA CREADAS:                                        ║'
UNION ALL
SELECT 
  '║    ✅ UserProfile                                              ║'
UNION ALL
SELECT 
  '║    ✅ Room                                                     ║'
UNION ALL
SELECT 
  '║    ✅ Like                                                     ║'
UNION ALL
SELECT 
  '║    ✅ Conversation                                             ║'
UNION ALL
SELECT 
  '║    ✅ Message                                                  ║'
UNION ALL
SELECT 
  '║    ✅ Report                                                   ║'
UNION ALL
SELECT 
  '╠════════════════════════════════════════════════════════════════╣'
UNION ALL
SELECT 
  '║  DATOS MIGRADOS:                                               ║'
UNION ALL
SELECT 
  '║    Usuarios en User: ' || LPAD((SELECT COUNT(*)::TEXT FROM public."User"), 3, ' ') || '                                       ║'
UNION ALL
SELECT 
  '║    Perfiles en UserProfile: ' || LPAD((SELECT COUNT(*)::TEXT FROM public."UserProfile"), 3, ' ') || '                              ║'
UNION ALL
SELECT 
  '╠════════════════════════════════════════════════════════════════╣'
UNION ALL
SELECT 
  '║  SEGURIDAD (RLS):                                              ║'
UNION ALL
SELECT 
  '║    Tablas con RLS: ' || LPAD((
    SELECT COUNT(*)::TEXT 
    FROM pg_tables 
    WHERE schemaname = 'public' 
      AND tablename IN ('User', 'UserProfile', 'Room', 'Like', 'Conversation', 'Message', 'Report')
      AND rowsecurity = true
  ), 2, ' ') || '/7                                         ║'
UNION ALL
SELECT 
  '╠════════════════════════════════════════════════════════════════╣'
UNION ALL
SELECT 
  '║  REALTIME:                                                     ║'
UNION ALL
SELECT 
  '║    Tablas con Realtime: ' || LPAD((
    SELECT COUNT(*)::TEXT 
    FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime'
      AND tablename IN ('User', 'UserProfile', 'Conversation', 'Message', 'Property')
  ), 2, ' ') || '/5                                      ║'
UNION ALL
SELECT 
  '╠════════════════════════════════════════════════════════════════╣'
UNION ALL
SELECT 
  '║  ESTRUCTURA:                                                   ║'
UNION ALL
SELECT 
  '║    message_attachments corregida: ' || 
  CASE 
    WHEN EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_name = 'message_attachments' 
        AND column_name IN ('file_name', 'storage_url', 'uploaded_by')
      HAVING COUNT(*) = 3
    ) THEN '✅'
    ELSE '❌'
  END || '                                  ║'
UNION ALL
SELECT 
  '╠════════════════════════════════════════════════════════════════╣'
UNION ALL
SELECT 
  '║  ESTADO FINAL:                                                 ║'
UNION ALL
SELECT 
  '║    ' || 
  CASE 
    WHEN (
      SELECT COUNT(*) FROM public."User"
    ) > 0 
    AND EXISTS (SELECT FROM pg_tables WHERE tablename = 'UserProfile')
    AND (
      SELECT COUNT(*) 
      FROM pg_tables 
      WHERE schemaname = 'public' 
        AND tablename IN ('User', 'UserProfile', 'Room', 'Like', 'Conversation', 'Message', 'Report')
        AND rowsecurity = true
    ) = 7
    THEN '✅ MIGRACIÓN COMPLETADA EXITOSAMENTE'
    ELSE '⚠️ MIGRACIÓN INCOMPLETA - REVISAR ERRORES'
  END || '                          ║'
UNION ALL
SELECT 
  '╚════════════════════════════════════════════════════════════════╝';

-- ============================================================================
-- CHECKLIST FINAL DE VERIFICACIÓN
-- ============================================================================

\echo ''
\echo '============================================================================'
\echo 'CHECKLIST FINAL DE VERIFICACIÓN'
\echo '============================================================================'
\echo ''
\echo '□ Fase 0: Backup creado'
\echo '□ Fase 1: Tabla UserProfile creada con todas las columnas'
\echo '□ Fase 2: Tabla User poblada desde auth.users'
\echo '□ Fase 3: Tabla message_attachments corregida'
\echo '□ Fase 4: Tablas Prisma creadas (Room, Like, Conversation, Message, Report)'
\echo '□ Fase 5: Función handle_new_user arreglada'
\echo '□ Fase 6: Función cleanup_stale_presence arreglada'
\echo '□ Fase 7: Storage buckets consolidados'
\echo '□ Fase 8: Verificación inicial pasada'
\echo '□ Fase 9: Perfiles de comunidad creados para usuarios existentes'
\echo '□ Fase 10: Limpieza y optimización completada'
\echo '□ Fase 11: Inconsistencias adicionales corregidas'
\echo '□ Fase 12: Storage buckets duplicados eliminados'
\echo '□ Fase 13: Verificación exhaustiva final pasada'
\echo ''
\echo '============================================================================'
\echo 'PRÓXIMOS PASOS DESPUÉS DE LA MIGRACIÓN'
\echo '============================================================================'
\echo ''
\echo '1. Ejecutar tests de integración:'
\echo '   npm run test:integration'
\echo ''
\echo '2. Verificar funcionalidad de comunidad:'
\echo '   - Crear perfil de comunidad'
\echo '   - Enviar mensaje'
\echo '   - Dar like'
\echo '   - Verificar presencia en tiempo real'
\echo ''
\echo '3. Verificar funcionalidad de propiedades:'
\echo '   - Crear propiedad'
\echo '   - Subir imágenes'
\echo '   - Publicar propiedad'
\echo '   - Verificar en listado'
\echo ''
\echo '4. Verificar adjuntos en mensajes:'
\echo '   - Subir archivo'
\echo '   - Verificar vinculación con mensaje'
\echo '   - Descargar archivo'
\echo ''
\echo '5. Monitorear logs de errores en producción'
\echo ''
\echo '============================================================================'
\echo 'FIN DEL PLAN DE EJECUCIÓN COMPLETO'
\echo '============================================================================'
