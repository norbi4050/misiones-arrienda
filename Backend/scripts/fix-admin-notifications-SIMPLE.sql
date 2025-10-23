-- =====================================================
-- FIX SIMPLE: Crear notification_preferences para admin
-- =====================================================
-- Este script SOLO crea las preferencias de notificaciones
-- para el usuario admin usando las columnas CORRECTAS
-- =====================================================

-- Insertar preferencias con las columnas que REALMENTE existen
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
  gen_random_uuid(),  -- id (autogenerado)
  '3755d4dc-9a02-4855-acb8-b2098c78db53',  -- user_id del admin
  true,   -- email_enabled
  true,   -- in_app_enabled
  false,  -- push_enabled
  true,   -- new_messages
  true,   -- message_replies
  true,   -- property_inquiries
  true,   -- inquiry_replies
  true,   -- property_status_changes
  true,   -- property_expiring
  true,   -- favorite_property_updates
  false,  -- new_properties_in_area
  true,   -- likes_received
  false,  -- new_followers
  true,   -- payments_completed
  true,   -- plan_expiring
  true,   -- plan_expired
  true,   -- invoices_ready
  true,   -- system_announcements
  true,   -- security_alerts
  false,  -- promotional_emails
  false,  -- newsletter
  NOW(),  -- created_at
  NOW()   -- updated_at
)
ON CONFLICT (user_id) DO UPDATE SET
  updated_at = NOW();

-- Verificar que se creó correctamente
SELECT
  'notification_preferences creado' as status,
  user_id,
  email_enabled,
  in_app_enabled,
  created_at
FROM public.notification_preferences
WHERE user_id = '3755d4dc-9a02-4855-acb8-b2098c78db53';
