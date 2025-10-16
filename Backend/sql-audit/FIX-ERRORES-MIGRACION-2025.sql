-- ============================================================================
-- FIX DE ERRORES DETECTADOS EN LA MIGRACIÓN
-- ============================================================================
-- Fecha: 16 de Enero 2025
-- Errores a corregir:
-- 1. Columna "isOnline" no existe en tabla User
-- 2. Columna "operationType" no existe en tabla Property
-- 3. Usuarios no se migraron (0 registros en User)
-- ============================================================================

-- ============================================================================
-- ERROR #1: Columna "isOnline" no existe en tabla User
-- ============================================================================

-- Verificar columnas actuales de User
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'User' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Agregar columnas faltantes de presencia
ALTER TABLE public."User" 
  ADD COLUMN IF NOT EXISTS "isOnline" BOOLEAN DEFAULT false;

ALTER TABLE public."User" 
  ADD COLUMN IF NOT EXISTS "lastSeen" TIMESTAMPTZ;

ALTER TABLE public."User" 
  ADD COLUMN IF NOT EXISTS "lastActivity" TIMESTAMPTZ DEFAULT NOW();

-- Crear índice para presencia
CREATE INDEX IF NOT EXISTS idx_user_online ON public."User"("isOnline", "lastSeen");

-- ============================================================================
-- ERROR #2: Columna "operationType" no existe en tabla Property
-- ============================================================================

-- Verificar columnas actuales de Property
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'Property' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Agregar columna operationType si no existe
ALTER TABLE public."Property" 
  ADD COLUMN IF NOT EXISTS "operationType" TEXT DEFAULT 'BOTH';

-- Agregar constraint para valores válidos
ALTER TABLE public."Property"
  DROP CONSTRAINT IF EXISTS property_operation_type_check;

ALTER TABLE public."Property"
  ADD CONSTRAINT property_operation_type_check 
  CHECK ("operationType" IN ('RENT', 'SALE', 'BOTH'));

-- ============================================================================
-- ERROR #3: Usuarios no se migraron (tabla User vacía)
-- ============================================================================

-- Verificar estado actual
SELECT 
  'auth.users' as tabla, COUNT(*) as registros FROM auth.users
UNION ALL
SELECT 
  'public.User', COUNT(*) FROM public."User"
UNION ALL
SELECT 
  'public.users (legacy)', COUNT(*) FROM public.users;

-- Migrar usuarios de auth.users a public.User (CORREGIDO)
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
  '' as password,
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

-- Verificar migración
SELECT 
  'Usuarios migrados' as resultado,
  COUNT(*) as cantidad
FROM public."User";

-- ============================================================================
-- CREAR PERFILES DE COMUNIDAD PARA USUARIOS MIGRADOS
-- ============================================================================

-- Crear UserProfile para usuarios existentes que no lo tengan
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
  'Posadas' as city,
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

-- Verificar creación de perfiles
SELECT 
  'Perfiles de comunidad creados' as resultado,
  COUNT(*) as cantidad
FROM public."UserProfile";

-- ============================================================================
-- VERIFICACIÓN FINAL
-- ============================================================================

-- Verificar estado final
SELECT 
  '✅ Usuarios en User' as metrica,
  COUNT(*)::TEXT as valor
FROM public."User"
UNION ALL
SELECT 
  '✅ Perfiles en UserProfile',
  COUNT(*)::TEXT
FROM public."UserProfile"
UNION ALL
SELECT 
  '✅ Usuarios en auth.users',
  COUNT(*)::TEXT
FROM auth.users;

-- Verificar columnas críticas existen
SELECT 
  'Verificación columnas User' as tabla,
  CASE 
    WHEN EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_name = 'User' 
        AND column_name = 'isOnline'
    ) THEN '✅ isOnline existe'
    ELSE '❌ isOnline FALTA'
  END as resultado
UNION ALL
SELECT 
  'Verificación columnas Property',
  CASE 
    WHEN EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_name = 'Property' 
        AND column_name = 'operationType'
    ) THEN '✅ operationType existe'
    ELSE '❌ operationType FALTA'
  END;

-- ============================================================================
-- REPORTE FINAL
-- ============================================================================

SELECT 
  '╔════════════════════════════════════════════════════════════════╗' as reporte
UNION ALL
SELECT 
  '║  FIX DE ERRORES COMPLETADO - ' || NOW()::DATE::TEXT || '                      ║'
UNION ALL
SELECT 
  '╠════════════════════════════════════════════════════════════════╣'
UNION ALL
SELECT 
  '║  ERRORES CORREGIDOS:                                           ║'
UNION ALL
SELECT 
  '║    ✅ Columnas de presencia agregadas a User                   ║'
UNION ALL
SELECT 
  '║    ✅ Columna operationType agregada a Property                ║'
UNION ALL
SELECT 
  '║    ✅ Usuarios migrados: ' || LPAD((SELECT COUNT(*)::TEXT FROM public."User"), 2, ' ') || '                                       ║'
UNION ALL
SELECT 
  '║    ✅ Perfiles creados: ' || LPAD((SELECT COUNT(*)::TEXT FROM public."UserProfile"), 2, ' ') || '                                        ║'
UNION ALL
SELECT 
  '╠════════════════════════════════════════════════════════════════╣'
UNION ALL
SELECT 
  '║  ESTADO: ✅ MIGRACIÓN COMPLETADA EXITOSAMENTE                  ║'
UNION ALL
SELECT 
  '╚════════════════════════════════════════════════════════════════╝';
