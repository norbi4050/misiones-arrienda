-- =====================================================
-- FIX: Actualizar función count_user_daily_attachments
-- Problema: La función usa 'user_id' pero la columna es 'uploaded_by'
-- Fecha: 2025-10-24
-- =====================================================

-- Eliminar función vieja si existe
DROP FUNCTION IF EXISTS count_user_daily_attachments(TEXT);
DROP FUNCTION IF EXISTS count_user_daily_attachments(UUID);

-- Crear función corregida
CREATE OR REPLACE FUNCTION count_user_daily_attachments(user_uuid TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  daily_count INTEGER;
BEGIN
  -- Usar uploaded_by en lugar de user_id (columna correcta)
  SELECT COUNT(*)::INT
  INTO daily_count
  FROM public.message_attachments
  WHERE uploaded_by = user_uuid
  AND created_at >= CURRENT_DATE
  AND created_at < CURRENT_DATE + INTERVAL '1 day';

  RETURN COALESCE(daily_count, 0);
END;
$$;

-- Comentario para documentación
COMMENT ON FUNCTION count_user_daily_attachments(TEXT) IS
'Cuenta cuántos adjuntos ha subido un usuario en el día actual. Usa uploaded_by (no user_id).';
