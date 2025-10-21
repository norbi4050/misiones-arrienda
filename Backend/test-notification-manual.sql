-- Script para crear una notificación de prueba manualmente
-- Reemplaza 'TU_USER_ID' con tu ID real de usuario

INSERT INTO notifications (
  id,
  user_id,
  type,
  title,
  message,
  metadata,
  channels,
  read,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid()::text,
  'TU_USER_ID',  -- REEMPLAZAR CON TU USER ID
  'NEW_MESSAGE',
  '🧪 Test: Notificación de Prueba',
  'Esta es una notificación de prueba del sistema. Si ves esto, el sistema de notificaciones in-app está funcionando correctamente.',
  '{"ctaUrl": "/comunidad", "ctaText": "Ver Comunidad"}',
  '["in_app"]',
  false,
  NOW(),
  NOW()
);
