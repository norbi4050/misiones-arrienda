-- CREAR TABLA DE NOTIFICACIONES - 2025
-- Sistema de notificaciones en tiempo real para Misiones Arrienda

-- Crear tabla de notificaciones
CREATE TABLE IF NOT EXISTS notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('avatar_updated', 'profile_updated', 'message_received', 'property_liked', 'system')),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    data JSONB DEFAULT '{}',
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Crear índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);

-- Habilitar RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para notificaciones
CREATE POLICY "Users can view own notifications" ON notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON notifications
    FOR UPDATE USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own notifications" ON notifications
    FOR DELETE USING (auth.uid() = user_id);

-- Solo el sistema puede insertar notificaciones (a través de funciones)
CREATE POLICY "System can insert notifications" ON notifications
    FOR INSERT WITH CHECK (true);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_notifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para updated_at
DROP TRIGGER IF EXISTS update_notifications_updated_at ON notifications;
CREATE TRIGGER update_notifications_updated_at
    BEFORE UPDATE ON notifications
    FOR EACH ROW
    EXECUTE FUNCTION update_notifications_updated_at();

-- Función para crear notificación de avatar actualizado
CREATE OR REPLACE FUNCTION notify_avatar_updated()
RETURNS TRIGGER AS $$
BEGIN
    -- Solo notificar si profile_image cambió
    IF OLD.profile_image IS DISTINCT FROM NEW.profile_image THEN
        INSERT INTO notifications (user_id, type, title, message, data)
        VALUES (
            NEW.id,
            'avatar_updated',
            'Avatar actualizado',
            'Tu foto de perfil ha sido actualizada exitosamente.',
            jsonb_build_object(
                'old_avatar', OLD.profile_image,
                'new_avatar', NEW.profile_image,
                'updated_at', NEW.updated_at
            )
        );
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para notificar cambios de avatar
DROP TRIGGER IF EXISTS notify_avatar_updated ON "User";
CREATE TRIGGER notify_avatar_updated
    AFTER UPDATE ON "User"
    FOR EACH ROW
    EXECUTE FUNCTION notify_avatar_updated();

-- Función para limpiar notificaciones antiguas (más de 30 días)
CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS void AS $$
BEGIN
    DELETE FROM notifications 
    WHERE created_at < CURRENT_TIMESTAMP - INTERVAL '30 days';
END;
$$ language 'plpgsql';

-- Función para obtener estadísticas de notificaciones
CREATE OR REPLACE FUNCTION get_notification_stats(p_user_id UUID)
RETURNS TABLE (
    total_notifications BIGINT,
    unread_notifications BIGINT,
    notifications_by_type JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_notifications,
        COUNT(*) FILTER (WHERE read = FALSE) as unread_notifications,
        jsonb_object_agg(type, type_count) as notifications_by_type
    FROM (
        SELECT 
            type,
            COUNT(*) as type_count
        FROM notifications 
        WHERE user_id = p_user_id
        GROUP BY type
    ) type_counts;
END;
$$ language 'plpgsql';

-- Insertar notificaciones de ejemplo para testing
INSERT INTO notifications (user_id, type, title, message, data, read) 
SELECT 
    id,
    'system',
    'Bienvenido a Misiones Arrienda',
    'Tu cuenta ha sido creada exitosamente. ¡Comienza a explorar propiedades!',
    '{"welcome": true}',
    false
FROM "User" 
WHERE email LIKE '%@%' 
AND NOT EXISTS (
    SELECT 1 FROM notifications 
    WHERE user_id = "User".id 
    AND type = 'system' 
    AND title = 'Bienvenido a Misiones Arrienda'
)
LIMIT 5;

-- Verificar que todo se creó correctamente
SELECT 
    'TABLA CREADA' as status,
    COUNT(*) as total_notifications
FROM notifications;

SELECT 
    'POLÍTICAS RLS' as status,
    COUNT(*) as total_policies
FROM pg_policies 
WHERE tablename = 'notifications';

SELECT 
    'ÍNDICES CREADOS' as status,
    COUNT(*) as total_indexes
FROM pg_indexes 
WHERE tablename = 'notifications';

-- Mostrar estructura final
\d notifications;
