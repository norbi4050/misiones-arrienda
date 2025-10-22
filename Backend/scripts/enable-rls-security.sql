-- Script para habilitar RLS en tablas públicas sin protección
-- Fecha: 2025-01-21
-- Objetivo: Corregir errores de seguridad detectados por Supabase Linter

-- ============================================================================
-- 1. TABLA: notifications
-- ============================================================================

-- Habilitar RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Política: Los usuarios solo pueden ver sus propias notificaciones
CREATE POLICY "Users can view their own notifications"
ON public.notifications
FOR SELECT
USING (auth.uid() = user_id);

-- Política: Los usuarios solo pueden actualizar sus propias notificaciones (marcar como leído)
CREATE POLICY "Users can update their own notifications"
ON public.notifications
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Política: El sistema puede crear notificaciones (via service role)
-- Nota: Esta política no aplica restricciones, permitiendo que el backend cree notificaciones
CREATE POLICY "System can create notifications"
ON public.notifications
FOR INSERT
WITH CHECK (true);

-- Política: Los usuarios pueden eliminar sus propias notificaciones
CREATE POLICY "Users can delete their own notifications"
ON public.notifications
FOR DELETE
USING (auth.uid() = user_id);


-- ============================================================================
-- 2. TABLA: notification_preferences
-- ============================================================================

-- Habilitar RLS
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

-- Política: Los usuarios solo pueden ver sus propias preferencias
CREATE POLICY "Users can view their own preferences"
ON public.notification_preferences
FOR SELECT
USING (auth.uid() = user_id);

-- Política: Los usuarios pueden actualizar sus propias preferencias
CREATE POLICY "Users can update their own preferences"
ON public.notification_preferences
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Política: Los usuarios pueden insertar sus propias preferencias
CREATE POLICY "Users can insert their own preferences"
ON public.notification_preferences
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Política: Los usuarios pueden eliminar sus propias preferencias
CREATE POLICY "Users can delete their own preferences"
ON public.notification_preferences
FOR DELETE
USING (auth.uid() = user_id);


-- ============================================================================
-- 3. TABLA: email_logs
-- ============================================================================

-- Habilitar RLS
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

-- Política: Solo el sistema puede leer logs (service role)
-- Los usuarios normales NO deberían ver logs de emails
CREATE POLICY "Only service role can read email logs"
ON public.email_logs
FOR SELECT
USING (false); -- Nadie puede leer via RLS, solo service role bypass

-- Política: Solo el sistema puede crear logs
CREATE POLICY "Only service role can create email logs"
ON public.email_logs
FOR INSERT
WITH CHECK (false); -- Solo service role puede insertar

-- Política: Solo el sistema puede actualizar logs
CREATE POLICY "Only service role can update email logs"
ON public.email_logs
FOR UPDATE
USING (false)
WITH CHECK (false);

-- Política: Solo el sistema puede eliminar logs
CREATE POLICY "Only service role can delete email logs"
ON public.email_logs
FOR DELETE
USING (false);


-- ============================================================================
-- 4. TABLA: UserProfile_backup_20250118 (tabla de backup)
-- ============================================================================

-- Habilitar RLS
ALTER TABLE public."UserProfile_backup_20250118" ENABLE ROW LEVEL SECURITY;

-- Para tablas de backup, generalmente no queremos acceso público
-- Solo service role debería poder acceder

CREATE POLICY "Only service role can access backup table"
ON public."UserProfile_backup_20250118"
FOR ALL
USING (false)
WITH CHECK (false);


-- ============================================================================
-- VERIFICACIÓN
-- ============================================================================

-- Query para verificar que RLS está habilitado
SELECT
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'notifications',
    'notification_preferences',
    'email_logs',
    'UserProfile_backup_20250118'
  )
ORDER BY tablename;

-- Query para ver las políticas creadas
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'notifications',
    'notification_preferences',
    'email_logs',
    'UserProfile_backup_20250118'
  )
ORDER BY tablename, policyname;
