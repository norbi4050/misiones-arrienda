-- =====================================================
-- FIX SEGURO: Arreglar trigger de registro de usuarios
-- =====================================================
-- PROBLEMA: sync_user_metadata_to_public_users() intenta
--           UPDATE en public.users (no existe)
--           Debe usar public."User" (existe con 2 registros)
--
-- RIESGO: BAJO - Solo modifica la función del trigger
--         NO toca datos existentes
--         Los 2 usuarios existentes NO se afectan
-- =====================================================

-- Arreglar la función para usar la tabla correcta
CREATE OR REPLACE FUNCTION public.sync_user_metadata_to_public_users()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  -- Sincronizar desde auth.users.raw_user_meta_data a public."User"
  -- ✅ CAMBIO: "users" → "User" (con mayúscula y comillas)
  UPDATE public."User"
  SET
    "userType" = NEW.raw_user_meta_data->>'userType',
    "companyName" = NULLIF(NEW.raw_user_meta_data->>'companyName', ''),
    "licenseNumber" = NEW.raw_user_meta_data->>'licenseNumber',
    "propertyCount" = NEW.raw_user_meta_data->>'propertyCount',
    "updatedAt" = NOW()
  WHERE id = NEW.id::text;

  RETURN NEW;
END;
$function$;

-- =====================================================
-- VERIFICACIÓN (Solo lectura - no modifica nada)
-- =====================================================

-- Confirmar que la función se actualizó
SELECT
  'Función actualizada correctamente' as mensaje,
  p.proname as nombre_funcion,
  pg_get_functiondef(p.oid) LIKE '%public."User"%' as usa_tabla_correcta
FROM pg_proc p
WHERE p.proname = 'sync_user_metadata_to_public_users';

-- Confirmar que los triggers siguen activos
SELECT
  trigger_name,
  event_manipulation,
  'Trigger activo' as estado
FROM information_schema.triggers
WHERE event_object_schema = 'auth'
  AND event_object_table = 'users'
ORDER BY trigger_name;

-- =====================================================
-- SIGUIENTE PASO DESPUÉS DE EJECUTAR ESTE SQL:
-- =====================================================
-- 1. Verificar que el SQL se ejecutó sin errores
-- 2. Intentar crear un usuario de prueba desde:
--    - Dashboard de Supabase (Authentication → Users)
--    - O desde la app web (/register)
-- 3. Si funciona, crear el usuario admin
-- =====================================================
