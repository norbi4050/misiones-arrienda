-- 📋 TABLA AUDIT_LOGS PARA SISTEMA DE ELIMINACIÓN DE USUARIOS
-- Registro completo de todas las acciones administrativas

-- Crear tabla audit_logs si no existe
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Información de la acción
    action VARCHAR(50) NOT NULL, -- 'delete_user', 'update_role', 'create_user', etc.
    table_name VARCHAR(50), -- Tabla afectada
    record_id UUID, -- ID del registro afectado
    
    -- Información del usuario que ejecuta la acción
    performed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    performed_by_email VARCHAR(255),
    performed_by_role VARCHAR(50),
    
    -- Información del usuario afectado (para acciones de usuarios)
    affected_user_id UUID,
    affected_user_email VARCHAR(255),
    
    -- Detalles de la acción
    old_values JSONB, -- Valores anteriores
    new_values JSONB, -- Valores nuevos
    changes JSONB, -- Resumen de cambios
    
    -- Metadatos
    ip_address INET,
    user_agent TEXT,
    request_id VARCHAR(100),
    
    -- Información adicional
    reason TEXT, -- Razón de la acción
    notes TEXT, -- Notas adicionales
    severity VARCHAR(20) DEFAULT 'info', -- 'info', 'warning', 'error', 'critical'
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Índices para búsquedas rápidas
    CONSTRAINT valid_action CHECK (action IN (
        'delete_user', 'update_user', 'create_user', 'login', 'logout',
        'update_role', 'reset_password', 'verify_email', 'suspend_user',
        'unsuspend_user', 'delete_property', 'update_property'
    )),
    CONSTRAINT valid_severity CHECK (severity IN ('info', 'warning', 'error', 'critical'))
);

-- Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_performed_by ON public.audit_logs(performed_by);
CREATE INDEX IF NOT EXISTS idx_audit_logs_affected_user ON public.audit_logs(affected_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_record ON public.audit_logs(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_severity ON public.audit_logs(severity);

-- Función para limpiar logs antiguos (opcional, ejecutar manualmente)
CREATE OR REPLACE FUNCTION clean_old_audit_logs(days_to_keep INTEGER DEFAULT 90)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM public.audit_logs 
    WHERE created_at < NOW() - INTERVAL '1 day' * days_to_keep
    AND severity NOT IN ('error', 'critical'); -- Mantener logs críticos
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función trigger para auto-logging (opcional)
CREATE OR REPLACE FUNCTION log_user_changes()
RETURNS TRIGGER AS $$
BEGIN
    -- Log para eliminaciones de usuarios
    IF TG_OP = 'DELETE' THEN
        INSERT INTO public.audit_logs (
            action, table_name, record_id, affected_user_id, 
            affected_user_email, old_values, severity
        ) VALUES (
            'delete_user', TG_TABLE_NAME, OLD.id, OLD.id,
            OLD.email, row_to_json(OLD), 'warning'
        );
        RETURN OLD;
    END IF;
    
    -- Log para actualizaciones de usuarios
    IF TG_OP = 'UPDATE' THEN
        INSERT INTO public.audit_logs (
            action, table_name, record_id, affected_user_id,
            affected_user_email, old_values, new_values, severity
        ) VALUES (
            'update_user', TG_TABLE_NAME, NEW.id, NEW.id,
            NEW.email, row_to_json(OLD), row_to_json(NEW), 'info'
        );
        RETURN NEW;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comentarios para documentación
COMMENT ON TABLE public.audit_logs IS 
'Registro de auditoría para todas las acciones administrativas del sistema';

COMMENT ON COLUMN public.audit_logs.action IS 
'Tipo de acción realizada (delete_user, update_role, etc.)';

COMMENT ON COLUMN public.audit_logs.performed_by IS 
'Usuario que realizó la acción';

COMMENT ON COLUMN public.audit_logs.affected_user_id IS 
'Usuario afectado por la acción (para acciones relacionadas con usuarios)';

COMMENT ON COLUMN public.audit_logs.old_values IS 
'Valores anteriores del registro (formato JSON)';

COMMENT ON COLUMN public.audit_logs.new_values IS 
'Valores nuevos del registro (formato JSON)';

COMMENT ON COLUMN public.audit_logs.severity IS 
'Nivel de importancia: info, warning, error, critical';

-- Insertar log de ejemplo
INSERT INTO public.audit_logs (
    action, table_name, performed_by_email, performed_by_role,
    reason, severity, notes
) VALUES (
    'create_user', 'audit_logs', 'system@misionesarrienda.com', 'system',
    'Tabla de auditoría creada exitosamente', 'info',
    'Sistema de auditoría inicializado correctamente'
);
