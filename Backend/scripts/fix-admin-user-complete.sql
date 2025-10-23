-- =====================================================
-- FIX: Completar usuario admin y verificar datos
-- =====================================================

-- 1. Actualizar emailVerified a true para el admin
UPDATE public."User"
SET "emailVerified" = true
WHERE email = 'misionesarrienda@gmail.com';

-- 2. Crear perfil de comunidad si no existe
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

-- 3. Crear preferencias de notificaciones
-- NOTA: Asegúrate de ejecutar fix-notification-preferences-fk.sql PRIMERO
-- para arreglar el foreign key constraint
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

-- VERIFICACIÓN (arreglado tipos de datos)
SELECT
  'Usuario en User' as tabla,
  email,
  "emailVerified"::text as verificado
FROM public."User"
WHERE email = 'misionesarrienda@gmail.com'
UNION ALL
SELECT
  'Perfil de comunidad',
  COALESCE(email, 'N/A'),
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
