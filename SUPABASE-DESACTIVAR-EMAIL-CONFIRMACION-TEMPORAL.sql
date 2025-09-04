-- 🚨 SCRIPT TEMPORAL - DESACTIVAR CONFIRMACIÓN EMAIL
-- =====================================================
-- ADVERTENCIA: SOLO PARA DESARROLLO
-- NO USAR EN PRODUCCIÓN
-- =====================================================

-- Desactivar confirmación de email para permitir registro inmediato
UPDATE auth.config 
SET email_confirm_required = false 
WHERE id = 1;

-- Verificar configuración actual
SELECT 
    email_confirm_required,
    email_change_confirm_required,
    sms_confirm_required
FROM auth.config;

-- NOTA: Para reactivar confirmación de email:
-- UPDATE auth.config SET email_confirm_required = true WHERE id = 1;
