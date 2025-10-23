-- =====================================================
-- VERIFICACIÓN DE SALUD DEL SISTEMA
-- =====================================================
-- Ejecutar este script después de aplicar todos los fixes
-- para confirmar que todo está funcionando correctamente
-- =====================================================

-- ==================== SECCIÓN 1: TABLAS ====================
\echo '==================== VERIFICACIÓN DE TABLAS ===================='

-- Verificar que todas las tablas críticas existen
SELECT
  table_name,
  CASE
    WHEN table_name IN ('User', 'Property', 'community_profiles', 'notification_preferences')
    THEN '✅ EXISTE'
    ELSE '⚠️ NO DEBERÍA EXISTIR'
  END as estado
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('User', 'users', 'Property', 'community_profiles', 'notification_preferences')
ORDER BY table_name;

-- ==================== SECCIÓN 2: TRIGGERS ====================
\echo ''
\echo '==================== VERIFICACIÓN DE TRIGGERS ===================='

-- Listar todos los triggers en auth.users
SELECT
  trigger_name,
  event_manipulation,
  action_timing,
  CASE
    WHEN trigger_name IN (
      'on_auth_user_created',
      'sync_user_metadata_trigger',
      'trg_ensure_display_name',
      'trg_init_notification_prefs'
    )
    THEN '✅ ESPERADO'
    ELSE '⚠️ TRIGGER EXTRA'
  END as estado
FROM information_schema.triggers
WHERE event_object_schema = 'auth'
  AND event_object_table = 'users'
ORDER BY trigger_name;

-- ==================== SECCIÓN 3: FOREIGN KEYS ====================
\echo ''
\echo '==================== VERIFICACIÓN DE FOREIGN KEYS ===================='

-- Verificar FK de notification_preferences
SELECT
  conname as constraint_name,
  pg_get_constraintdef(oid) as definition,
  CASE
    WHEN pg_get_constraintdef(oid) LIKE '%"User"%'
    THEN '✅ APUNTA A "User" (CORRECTO)'
    WHEN pg_get_constraintdef(oid) LIKE '%users%'
    THEN '❌ APUNTA A "users" (INCORRECTO)'
    ELSE '⚠️ DESCONOCIDO'
  END as estado
FROM pg_constraint
WHERE conrelid = 'public.notification_preferences'::regclass
  AND contype = 'f'
  AND conname = 'notification_preferences_user_id_fkey';

-- ==================== SECCIÓN 4: USUARIO ADMIN ====================
\echo ''
\echo '==================== VERIFICACIÓN USUARIO ADMIN ===================='

-- Verificar que el usuario admin está completo
WITH admin_user AS (
  SELECT id, email, "emailVerified"
  FROM public."User"
  WHERE email = 'misionesarrienda@gmail.com'
),
admin_profile AS (
  SELECT user_id, display_name, is_active
  FROM public.community_profiles
  WHERE user_id = '3755d4dc-9a02-4855-acb8-b2098c78db53'
),
admin_prefs AS (
  SELECT user_id, email_enabled
  FROM public.notification_preferences
  WHERE user_id = '3755d4dc-9a02-4855-acb8-b2098c78db53'
)
SELECT
  CASE WHEN au.id IS NOT NULL THEN '✅' ELSE '❌' END || ' Usuario en User' as check_item,
  COALESCE(au.email, 'NO ENCONTRADO') as valor
FROM admin_user au
UNION ALL
SELECT
  CASE WHEN au."emailVerified" = true THEN '✅' ELSE '❌' END || ' Email verificado',
  au."emailVerified"::text
FROM admin_user au
UNION ALL
SELECT
  CASE WHEN ap.user_id IS NOT NULL THEN '✅' ELSE '❌' END || ' Perfil de comunidad',
  COALESCE(ap.display_name, 'NO ENCONTRADO')
FROM admin_profile ap
UNION ALL
SELECT
  CASE WHEN anp.user_id IS NOT NULL THEN '✅' ELSE '❌' END || ' Preferencias de notificaciones',
  CASE WHEN anp.email_enabled THEN 'Habilitadas' ELSE 'Deshabilitadas' END
FROM admin_prefs anp;

-- ==================== SECCIÓN 5: CONTADORES ====================
\echo ''
\echo '==================== CONTADORES DEL SISTEMA ===================='

SELECT
  'Usuarios en auth.users' as tabla,
  COUNT(*)::text as total
FROM auth.users
UNION ALL
SELECT
  'Usuarios en public.User',
  COUNT(*)::text
FROM public."User"
UNION ALL
SELECT
  'Perfiles de comunidad',
  COUNT(*)::text
FROM public.community_profiles
UNION ALL
SELECT
  'Preferencias de notificaciones',
  COUNT(*)::text
FROM public.notification_preferences
UNION ALL
SELECT
  'Propiedades',
  COUNT(*)::text
FROM public."Property";

-- ==================== SECCIÓN 6: USUARIOS HUÉRFANOS ====================
\echo ''
\echo '==================== VERIFICACIÓN DE HUÉRFANOS ===================='

-- Usuarios en auth.users sin registro en User
SELECT
  'Usuarios en auth.users sin User' as tipo,
  COUNT(*)::text as total,
  CASE
    WHEN COUNT(*) = 0 THEN '✅ OK'
    ELSE '⚠️ REVISAR'
  END as estado
FROM auth.users au
WHERE NOT EXISTS (
  SELECT 1 FROM public."User" u WHERE u.id = au.id::text
)
UNION ALL
-- Usuarios sin perfil de comunidad
SELECT
  'Usuarios sin community_profile',
  COUNT(*)::text,
  CASE
    WHEN COUNT(*) = 0 THEN '✅ OK'
    ELSE '⚠️ REVISAR'
  END
FROM public."User" u
WHERE NOT EXISTS (
  SELECT 1 FROM public.community_profiles cp WHERE cp.user_id = u.id
)
UNION ALL
-- Usuarios sin preferencias de notificaciones
SELECT
  'Usuarios sin notification_preferences',
  COUNT(*)::text,
  CASE
    WHEN COUNT(*) = 0 THEN '✅ OK'
    ELSE '⚠️ REVISAR'
  END
FROM public."User" u
WHERE NOT EXISTS (
  SELECT 1 FROM public.notification_preferences np WHERE np.user_id = u.id
);

-- ==================== RESUMEN ====================
\echo ''
\echo '==================== RESUMEN ===================='
\echo 'Si todos los checks tienen ✅ el sistema está saludable'
\echo 'Si hay ❌ o ⚠️ revisar la sección correspondiente'
\echo '===================================================='
