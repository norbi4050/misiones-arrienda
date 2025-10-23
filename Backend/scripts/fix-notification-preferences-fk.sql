-- =====================================================
-- FIX: Corregir Foreign Key de notification_preferences
-- =====================================================
-- PROBLEMA: notification_preferences.user_id apunta a "users" (no existe)
--           Debe apuntar a "User" (existe)
-- =====================================================

-- 1. Eliminar el constraint incorrecto
ALTER TABLE public.notification_preferences
DROP CONSTRAINT IF EXISTS notification_preferences_user_id_fkey;

-- 2. Crear el constraint correcto apuntando a "User"
ALTER TABLE public.notification_preferences
ADD CONSTRAINT notification_preferences_user_id_fkey
FOREIGN KEY (user_id) REFERENCES public."User"(id)
ON UPDATE CASCADE ON DELETE CASCADE;

-- =====================================================
-- VERIFICACIÓN
-- =====================================================

-- Confirmar que el constraint se actualizó correctamente
SELECT
  conname as constraint_name,
  pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'public.notification_preferences'::regclass
  AND contype = 'f';  -- Foreign keys

-- =====================================================
-- SIGUIENTE PASO
-- =====================================================
-- Después de ejecutar este SQL exitosamente:
-- 1. Ejecutar fix-admin-user-complete.sql
-- 2. Re-habilitar los triggers desactivados
-- =====================================================
