-- ============================================================================
-- PROMPT 4: Tests de humo - Verificación integral
-- ============================================================================
-- Fecha: 2025-01-XX
-- Propósito: SELECTs de verificación rápida sin mutar datos
-- 
-- FUNCIONALIDAD:
-- 1. Verificar estructura de tablas y tipos
-- 2. Verificar labels del enum CommunityRole
-- 3. Verificar existencia de espejos para un usuario específico
-- 4. Verificar políticas RLS (si aplican)
-- 5. Verificar metadatos de mensajes
-- 6. Verificar relaciones de favoritos
-- ============================================================================

-- ============================================================================
-- BLOQUE 1: Verificar estructura de tablas y tipos
-- ============================================================================

-- Verificar columnas y tipos de public."User"
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'User'
  AND column_name IN ('id', 'name', 'email', 'phone', 'password', 'createdAt', 'updatedAt')
ORDER BY ordinal_position;

-- Verificar columnas y tipos de public."UserProfile"
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'UserProfile'
  AND column_name IN ('id', 'userId', 'role', 'city', 'budgetMin', 'budgetMax', 'createdAt', 'updatedAt')
ORDER BY ordinal_position;

-- ============================================================================
-- BLOQUE 2: Verificar labels del enum CommunityRole
-- ============================================================================

-- Listar todos los valores válidos del enum CommunityRole
SELECT 
  t.typname AS enum_name,
  e.enumlabel AS enum_value,
  e.enumsortorder AS sort_order
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
JOIN pg_namespace n ON t.typnamespace = n.oid
WHERE n.nspname = 'public'
  AND t.typname = 'CommunityRole'
ORDER BY e.enumsortorder;

-- ============================================================================
-- BLOQUE 3: Verificar existencia de espejos para un usuario específico
-- ============================================================================
-- INSTRUCCIONES: Reemplazar {{USER_UUID}} con el UUID del usuario a verificar
-- Ejemplo: '6403f9d2-e846-4c70-87e0-e051127d9500'
-- ============================================================================

-- Verificar usuario en auth.users
SELECT 
  'auth.users' AS tabla,
  id::text AS user_id,
  email,
  created_at,
  raw_user_meta_data->>'full_name' AS full_name,
  raw_user_meta_data->>'user_type' AS user_type
FROM auth.users
WHERE id::text = '{{USER_UUID}}';

-- Verificar usuario en public."User"
SELECT 
  'public.User' AS tabla,
  id AS user_id,
  name,
  email,
  "createdAt",
  "updatedAt"
FROM public."User"
WHERE id = '{{USER_UUID}}';

-- Verificar perfil en public."UserProfile"
SELECT 
  'public.UserProfile' AS tabla,
  id AS profile_id,
  "userId" AS user_id,
  role,
  city,
  "budgetMin",
  "budgetMax",
  "createdAt",
  "updatedAt"
FROM public."UserProfile"
WHERE "userId" = '{{USER_UUID}}';

-- ============================================================================
-- BLOQUE 4: Verificar políticas RLS en conversations y messages
-- ============================================================================

-- Listar políticas de public."Conversation"
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'Conversation'
ORDER BY policyname;

-- Listar políticas de public."Message"
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'Message'
ORDER BY policyname;

-- ============================================================================
-- BLOQUE 5: Verificar metadatos de mensajes en conversations
-- ============================================================================

-- Verificar que existen las columnas de metadatos en Conversation
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'Conversation'
  AND column_name IN ('lastMessageAt', 'isActive', 'createdAt', 'updatedAt')
ORDER BY ordinal_position;

-- Ejemplo de conversaciones con metadatos (últimas 5)
SELECT 
  id,
  "aId",
  "bId",
  "lastMessageAt",
  "isActive",
  "createdAt",
  "updatedAt"
FROM public."Conversation"
ORDER BY "createdAt" DESC
LIMIT 5;

-- ============================================================================
-- BLOQUE 6: Verificar relaciones favorites → properties
-- ============================================================================

-- Listar constraints de foreign key en public."Favorite"
SELECT 
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
  AND tc.table_name = 'Favorite'
ORDER BY tc.constraint_name;

-- Verificar integridad de favoritos (sin huérfanos)
SELECT 
  'Favoritos con propertyId inválido' AS tipo,
  COUNT(*) AS total
FROM public."Favorite" f
LEFT JOIN public."Property" p ON p.id = f."propertyId"
WHERE p.id IS NULL

UNION ALL

SELECT 
  'Favoritos con userId inválido' AS tipo,
  COUNT(*) AS total
FROM public."Favorite" f
LEFT JOIN public."User" u ON u.id = f."userId"
WHERE u.id IS NULL;

-- ============================================================================
-- INTERPRETACIÓN DE RESULTADOS:
-- ============================================================================

-- BLOQUE 1 - Estructura de tablas:
-- ✅ Verificar que id es 'text' en ambas tablas
-- ✅ Verificar que name, email, phone, password son NOT NULL en User
-- ✅ Verificar que userId, role, city, budgetMin, budgetMax son NOT NULL en UserProfile
-- ✅ Verificar que createdAt y updatedAt existen con tipo timestamp

-- BLOQUE 2 - Enum CommunityRole:
-- ✅ Debe mostrar los valores: BUSCO, OFREZCO (y posiblemente TENANT, OWNER, AGENCY)
-- ✅ Verificar que el enum existe y tiene los valores esperados

-- BLOQUE 3 - Espejos de usuario:
-- ✅ El usuario debe existir en las 3 tablas: auth.users, User, UserProfile
-- ✅ Los IDs deben coincidir (uuid en auth.users, text en User/UserProfile)
-- ✅ El role debe ser BUSCO u OFREZCO según user_type

-- BLOQUE 4 - Políticas RLS:
-- ✅ Verificar que existen políticas para SELECT, INSERT, UPDATE, DELETE
-- ✅ Verificar que las políticas usan los roles correctos
-- ⚠️  Si no hay políticas, considerar si es necesario implementarlas

-- BLOQUE 5 - Metadatos de conversaciones:
-- ✅ Verificar que lastMessageAt, isActive existen
-- ✅ Verificar que las conversaciones tienen timestamps correctos

-- BLOQUE 6 - Relaciones de favoritos:
-- ✅ Debe mostrar FK constraints: Favorite.propertyId → Property.id
-- ✅ Debe mostrar FK constraints: Favorite.userId → User.id
-- ✅ No debe haber favoritos huérfanos (total = 0 en ambos casos)

-- ============================================================================
-- EJEMPLO DE SALIDA ESPERADA:
-- ============================================================================

-- BLOQUE 1 - User columns:
-- | column_name | data_type                   | is_nullable | column_default |
-- |-------------|----------------------------|-------------|----------------|
-- | id          | text                       | NO          | NULL           |
-- | name        | text                       | NO          | NULL           |
-- | email       | text                       | NO          | NULL           |
-- | phone       | text                       | NO          | NULL           |
-- | password    | text                       | NO          | NULL           |
-- | createdAt   | timestamp with time zone   | NO          | now()          |
-- | updatedAt   | timestamp with time zone   | NO          | now()          |

-- BLOQUE 2 - Enum values:
-- | enum_name      | enum_value | sort_order |
-- |----------------|------------|------------|
-- | CommunityRole  | BUSCO      | 1          |
-- | CommunityRole  | OFREZCO    | 2          |

-- BLOQUE 3 - Usuario específico:
-- Debe aparecer en las 3 tablas con datos consistentes

-- BLOQUE 6 - Favoritos huérfanos:
-- | tipo                              | total |
-- |-----------------------------------|-------|
-- | Favoritos con propertyId inválido | 0     |
-- | Favoritos con userId inválido     | 0     |

-- ============================================================================
-- NOTAS DE USO:
-- ============================================================================
-- 1. Ejecutar estos SELECTs periódicamente para verificar integridad
-- 2. Reemplazar {{USER_UUID}} con un UUID real para pruebas específicas
-- 3. Si alguna verificación falla, revisar los scripts de PROMPT 1-3
-- 4. Estos queries NO modifican datos, son seguros para producción
-- ============================================================================
