-- =====================================================
-- FIX CRÍTICO: Crear tabla User para permitir registros
-- =====================================================
-- PROBLEMA: El trigger handle_new_user() intenta insertar en
-- public."User" pero esa tabla no existe, causando error 500
-- =====================================================

-- Crear la tabla User si no existe
CREATE TABLE IF NOT EXISTS public."User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "password" TEXT NOT NULL DEFAULT '',
    "avatar" TEXT,
    "bio" TEXT,
    "occupation" TEXT,
    "age" INTEGER,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "verificationToken" TEXT,
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "userType" TEXT,
    "companyName" TEXT,
    "licenseNumber" TEXT,
    "propertyCount" TEXT,
    "isOnline" BOOLEAN NOT NULL DEFAULT false,
    "lastSeen" TIMESTAMPTZ(6),
    "lastActivity" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isFounder" BOOLEAN NOT NULL DEFAULT false,
    "founderDiscount" DOUBLE PRECISION DEFAULT 50,
    "planTier" TEXT DEFAULT 'free',
    "planStartDate" TIMESTAMPTZ(6),
    "planEndDate" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- Crear índice único para email
CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON public."User"("email");

-- Crear índices para mejorar performance
CREATE INDEX IF NOT EXISTS "User_isOnline_lastSeen_idx" ON public."User"("isOnline", "lastSeen");

-- Habilitar RLS
ALTER TABLE public."User" ENABLE ROW LEVEL SECURITY;

-- Política: Los usuarios pueden ver su propio perfil
CREATE POLICY IF NOT EXISTS "Users can view own profile" ON public."User"
FOR SELECT TO authenticated
USING (id = auth.uid()::text);

-- Política: Los usuarios pueden actualizar su propio perfil
CREATE POLICY IF NOT EXISTS "Users can update own profile" ON public."User"
FOR UPDATE TO authenticated
USING (id = auth.uid()::text)
WITH CHECK (id = auth.uid()::text);

-- Política: Permitir INSERT desde service_role (para el trigger)
CREATE POLICY IF NOT EXISTS "Service role can insert users" ON public."User"
FOR INSERT TO service_role
WITH CHECK (true);

-- Política: Usuarios autenticados pueden ver otros usuarios (para comunidad)
CREATE POLICY IF NOT EXISTS "Authenticated users can view other users" ON public."User"
FOR SELECT TO authenticated
USING (true);

-- =====================================================
-- VERIFICACIÓN
-- =====================================================

-- Verificar que la tabla se creó correctamente
SELECT
  'Tabla User creada correctamente' as mensaje,
  COUNT(*) as total_columns
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'User';

-- Verificar que el trigger existe
SELECT
  trigger_name,
  event_manipulation,
  'Trigger activo en auth.users' as mensaje
FROM information_schema.triggers
WHERE event_object_schema = 'auth'
  AND event_object_table = 'users'
  AND trigger_name = 'on_auth_user_created';
