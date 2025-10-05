-- ============================================================================
-- PROMPT 2: CENTRO DE NOTIFICACIONES Y PREFERENCIAS
-- Fecha: Enero 2025
-- Descripción: SQL para sistema de notificaciones in-app y preferencias
-- ============================================================================

-- PASO 1: Crear tabla de notificaciones
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  type text NOT NULL CHECK (type IN ('messages.new', 'messages.reply', 'community.match')),
  title text NOT NULL,
  body text,
  payload jsonb DEFAULT '{}'::jsonb,
  read_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now()
);

COMMENT ON TABLE public.notifications IS 
'Notificaciones in-app para usuarios';

COMMENT ON COLUMN public.notifications.type IS 
'Tipo de notificación: messages.new, messages.reply, community.match';

COMMENT ON COLUMN public.notifications.payload IS 
'Datos adicionales en formato JSON (conversationId, messageId, etc.)';


-- PASO 2: Crear índices para notificaciones
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_notifications_user_id 
ON public.notifications(user_id);

CREATE INDEX IF NOT EXISTS idx_notifications_created_at 
ON public.notifications(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_read_at 
ON public.notifications(read_at) WHERE read_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_notifications_type 
ON public.notifications(type);

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread 
ON public.notifications(user_id, created_at DESC) WHERE read_at IS NULL;


-- PASO 3: Crear tabla de preferencias de notificaciones
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  user_id text PRIMARY KEY,
  email_enabled boolean DEFAULT true,
  types jsonb DEFAULT '{"messages.new": true, "messages.reply": true, "community.match": false}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

COMMENT ON TABLE public.notification_preferences IS 
'Preferencias de notificaciones por usuario';

COMMENT ON COLUMN public.notification_preferences.email_enabled IS 
'Switch global para habilitar/deshabilitar emails';

COMMENT ON COLUMN public.notification_preferences.types IS 
'Preferencias por tipo de notificación en formato JSON';


-- PASO 4: Políticas RLS para notificaciones
-- ============================================================================
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Los usuarios solo pueden ver sus propias notificaciones
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
CREATE POLICY "Users can view own notifications"
  ON public.notifications
  FOR SELECT
  USING (user_id = auth.uid()::text);

-- Los usuarios solo pueden actualizar sus propias notificaciones
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
CREATE POLICY "Users can update own notifications"
  ON public.notifications
  FOR UPDATE
  USING (user_id = auth.uid()::text);

-- Los usuarios solo pueden eliminar sus propias notificaciones
DROP POLICY IF EXISTS "Users can delete own notifications" ON public.notifications;
CREATE POLICY "Users can delete own notifications"
  ON public.notifications
  FOR DELETE
  USING (user_id = auth.uid()::text);

-- Solo el sistema puede insertar notificaciones (via service role)
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;
CREATE POLICY "System can insert notifications"
  ON public.notifications
  FOR INSERT
  WITH CHECK (true);


-- PASO 5: Políticas RLS para preferencias
-- ============================================================================
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

-- Los usuarios solo pueden ver sus propias preferencias
DROP POLICY IF EXISTS "Users can view own preferences" ON public.notification_preferences;
CREATE POLICY "Users can view own preferences"
  ON public.notification_preferences
  FOR SELECT
  USING (user_id = auth.uid()::text);

-- Los usuarios solo pueden actualizar sus propias preferencias
DROP POLICY IF EXISTS "Users can update own preferences" ON public.notification_preferences;
CREATE POLICY "Users can update own preferences"
  ON public.notification_preferences
  FOR UPDATE
  USING (user_id = auth.uid()::text);

-- Los usuarios pueden insertar sus propias preferencias
DROP POLICY IF EXISTS "Users can insert own preferences" ON public.notification_preferences;
CREATE POLICY "Users can insert own preferences"
  ON public.notification_preferences
  FOR INSERT
  WITH CHECK (user_id = auth.uid()::text);


-- PASO 6: Función para auto-crear preferencias por defecto
-- ============================================================================
CREATE OR REPLACE FUNCTION public.ensure_notification_preferences()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Crear preferencias por defecto si no existen
  INSERT INTO public.notification_preferences (user_id)
  VALUES (NEW.user_id)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.ensure_notification_preferences IS 
'Trigger para auto-crear preferencias de notificaciones al crear un usuario';


-- PASO 7: Trigger para auto-crear preferencias
-- ============================================================================
DROP TRIGGER IF EXISTS ensure_notification_preferences_trigger ON public.user_profiles;
CREATE TRIGGER ensure_notification_preferences_trigger
  AFTER INSERT ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_notification_preferences();


-- PASO 8: Función para obtener contador de no leídas
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_unread_notifications_count()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id text;
  v_count integer;
BEGIN
  v_user_id := auth.uid()::text;
  
  IF v_user_id IS NULL THEN
    RETURN 0;
  END IF;
  
  SELECT COUNT(*)::integer INTO v_count
  FROM public.notifications
  WHERE user_id = v_user_id
  AND read_at IS NULL;
  
  RETURN COALESCE(v_count, 0);
END;
$$;

COMMENT ON FUNCTION public.get_unread_notifications_count IS 
'Obtiene el contador de notificaciones no leídas del usuario autenticado';


-- PASO 9: Grants de permisos
-- ============================================================================
GRANT SELECT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.notification_preferences TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_unread_notifications_count TO authenticated;


-- PASO 10: Backfill de preferencias para usuarios existentes
-- ============================================================================
DO $$
DECLARE
  v_inserted_count integer;
BEGIN
  -- Crear preferencias para usuarios que no las tienen
  INSERT INTO public.notification_preferences (user_id)
  SELECT user_id
  FROM public.user_profiles
  WHERE user_id NOT IN (
    SELECT user_id FROM public.notification_preferences
  )
  ON CONFLICT (user_id) DO NOTHING;
  
  GET DIAGNOSTICS v_inserted_count = ROW_COUNT;
  
  RAISE NOTICE '✅ Preferencias creadas para % usuarios existentes', v_inserted_count;
END $$;


-- PASO 11: Verificación de instalación
-- ============================================================================
DO $$
DECLARE
  v_notifications_table boolean;
  v_preferences_table boolean;
  v_notifications_count integer;
  v_preferences_count integer;
  v_function_exists boolean;
  v_trigger_exists boolean;
BEGIN
  -- Verificar tablas
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'notifications'
  ) INTO v_notifications_table;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'notification_preferences'
  ) INTO v_preferences_table;
  
  -- Contar registros
  SELECT COUNT(*)::integer INTO v_notifications_count FROM public.notifications;
  SELECT COUNT(*)::integer INTO v_preferences_count FROM public.notification_preferences;
  
  -- Verificar función
  SELECT EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'get_unread_notifications_count'
  ) INTO v_function_exists;
  
  -- Verificar trigger
  SELECT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'ensure_notification_preferences_trigger'
  ) INTO v_trigger_exists;
  
  -- Reporte
  RAISE NOTICE '========================================';
  RAISE NOTICE 'VERIFICACIÓN DE INSTALACIÓN - PROMPT 2';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Tabla notifications: %', CASE WHEN v_notifications_table THEN '✅' ELSE '❌' END;
  RAISE NOTICE 'Tabla notification_preferences: %', CASE WHEN v_preferences_table THEN '✅' ELSE '❌' END;
  RAISE NOTICE 'Notificaciones existentes: %', v_notifications_count;
  RAISE NOTICE 'Preferencias existentes: %', v_preferences_count;
  RAISE NOTICE 'Función get_unread_count: %', CASE WHEN v_function_exists THEN '✅' ELSE '❌' END;
  RAISE NOTICE 'Trigger auto-preferencias: %', CASE WHEN v_trigger_exists THEN '✅' ELSE '❌' END;
  RAISE NOTICE '========================================';
  
  IF v_notifications_table AND v_preferences_table AND v_function_exists AND v_trigger_exists THEN
    RAISE NOTICE '✅ INSTALACIÓN COMPLETA Y EXITOSA';
  ELSE
    RAISE WARNING '⚠️ INSTALACIÓN INCOMPLETA - Revisar errores arriba';
  END IF;
END $$;


-- ============================================================================
-- ROLLBACK (En caso de necesitar revertir cambios)
-- ============================================================================
-- DESCOMENTAR SOLO SI NECESITAS REVERTIR:

/*
-- Eliminar trigger
DROP TRIGGER IF EXISTS ensure_notification_preferences_trigger ON public.user_profiles;

-- Eliminar función
DROP FUNCTION IF EXISTS public.ensure_notification_preferences CASCADE;
DROP FUNCTION IF EXISTS public.get_unread_notifications_count CASCADE;

-- Eliminar tablas (CUIDADO: esto eliminará datos)
-- DROP TABLE IF EXISTS public.notifications CASCADE;
-- DROP TABLE IF EXISTS public.notification_preferences CASCADE;

RAISE NOTICE '⚠️ ROLLBACK COMPLETADO - Tablas y funciones eliminadas';
*/
