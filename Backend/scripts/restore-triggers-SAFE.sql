-- =====================================================
-- RESTAURAR TRIGGERS DE FORMA SEGURA
-- =====================================================
-- Los 3 triggers desactivados son necesarios para:
-- 1. Sincronizar metadatos del usuario
-- 2. Crear perfil de comunidad
-- 3. Crear preferencias de notificaciones
-- =====================================================

-- TRIGGER 1: Sincronizar metadata (YA ARREGLADO)
-- Este ya lo arreglamos para usar public."User" en lugar de public.users
CREATE TRIGGER sync_user_metadata_trigger
AFTER INSERT OR UPDATE ON auth.users
FOR EACH ROW
EXECUTE FUNCTION sync_user_metadata_to_public_users();

-- TRIGGER 2: Crear perfil de comunidad
-- Este debería funcionar ya que la tabla existe
CREATE TRIGGER trg_ensure_display_name
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION ensure_display_name();

-- TRIGGER 3: Inicializar preferencias de notificaciones
-- Este debería funcionar ya que la tabla existe
CREATE TRIGGER trg_init_notification_prefs
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION init_notification_prefs();

-- =====================================================
-- VERIFICACIÓN
-- =====================================================

-- Ver todos los triggers activos
SELECT
  trigger_name,
  event_manipulation,
  action_timing,
  'ACTIVO' as estado
FROM information_schema.triggers
WHERE event_object_schema = 'auth'
  AND event_object_table = 'users'
ORDER BY trigger_name;

-- =====================================================
-- INSTRUCCIONES DE PRUEBA
-- =====================================================
-- Después de ejecutar este SQL:
-- 1. Intenta crear un usuario de prueba
-- 2. Verifica que se creen estos 3 registros:
--    - public."User"
--    - public.community_profiles
--    - public.notification_preferences
-- 3. Si funciona, ¡listo!
-- 4. Si falla, veremos el error específico y lo arreglamos
-- =====================================================
