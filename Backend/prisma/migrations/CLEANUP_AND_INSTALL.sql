-- ========================================
-- PASO 1: LIMPIAR TODO (ejecutar primero)
-- ========================================

-- Eliminar triggers primero
DROP TRIGGER IF EXISTS create_notification_preferences_on_user_insert ON users;
DROP TRIGGER IF EXISTS create_notification_preferences_on_user_insert ON "users";

-- Eliminar funciones
DROP FUNCTION IF EXISTS create_default_notification_preferences() CASCADE;

-- Eliminar tablas (con y sin comillas, por si acaso)
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS "notifications" CASCADE;
DROP TABLE IF EXISTS notification_preferences CASCADE;
DROP TABLE IF EXISTS "notification_preferences" CASCADE;
DROP TABLE IF EXISTS email_logs CASCADE;
DROP TABLE IF EXISTS "email_logs" CASCADE;

-- ========================================
-- PASO 2: CREAR TABLAS NUEVAS
-- ========================================

-- Tabla: notifications (SIN comillas)
CREATE TABLE notifications (
    id TEXT NOT NULL PRIMARY KEY,
    user_id TEXT NOT NULL,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    metadata TEXT,
    related_id TEXT,
    related_type TEXT,
    channels TEXT NOT NULL DEFAULT '["in_app", "email"]',
    read BOOLEAN NOT NULL DEFAULT false,
    sent_at TIMESTAMPTZ,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id)
        REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- Índices para notifications
CREATE INDEX notifications_user_id_read_idx ON notifications(user_id, read);
CREATE INDEX notifications_user_id_created_at_idx ON notifications(user_id, created_at DESC);
CREATE INDEX notifications_type_created_at_idx ON notifications(type, created_at DESC);

-- Tabla: notification_preferences
CREATE TABLE notification_preferences (
    id TEXT NOT NULL PRIMARY KEY,
    user_id TEXT NOT NULL UNIQUE,

    -- Canales globales
    email_enabled BOOLEAN NOT NULL DEFAULT true,
    in_app_enabled BOOLEAN NOT NULL DEFAULT true,
    push_enabled BOOLEAN NOT NULL DEFAULT false,

    -- Mensajería
    new_messages BOOLEAN NOT NULL DEFAULT true,
    message_replies BOOLEAN NOT NULL DEFAULT true,

    -- Propiedades
    property_inquiries BOOLEAN NOT NULL DEFAULT true,
    inquiry_replies BOOLEAN NOT NULL DEFAULT true,
    property_status_changes BOOLEAN NOT NULL DEFAULT true,
    property_expiring BOOLEAN NOT NULL DEFAULT true,

    -- Favoritos
    favorite_property_updates BOOLEAN NOT NULL DEFAULT true,
    new_properties_in_area BOOLEAN NOT NULL DEFAULT false,

    -- Social
    likes_received BOOLEAN NOT NULL DEFAULT true,
    new_followers BOOLEAN NOT NULL DEFAULT false,

    -- Pagos
    payments_completed BOOLEAN NOT NULL DEFAULT true,
    plan_expiring BOOLEAN NOT NULL DEFAULT true,
    plan_expired BOOLEAN NOT NULL DEFAULT true,
    invoices_ready BOOLEAN NOT NULL DEFAULT true,

    -- Sistema
    system_announcements BOOLEAN NOT NULL DEFAULT true,
    security_alerts BOOLEAN NOT NULL DEFAULT true,

    -- Marketing
    promotional_emails BOOLEAN NOT NULL DEFAULT false,
    newsletter BOOLEAN NOT NULL DEFAULT false,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT notification_preferences_user_id_fkey FOREIGN KEY (user_id)
        REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- Tabla: email_logs
CREATE TABLE email_logs (
    id TEXT NOT NULL PRIMARY KEY,
    recipient_id TEXT,
    recipient_email TEXT NOT NULL,
    type TEXT NOT NULL,
    subject TEXT NOT NULL,
    body TEXT NOT NULL,
    template_used TEXT,
    metadata TEXT,
    status TEXT NOT NULL DEFAULT 'PENDING',
    sent_at TIMESTAMPTZ,
    error_message TEXT,
    provider TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Índices para email_logs
CREATE INDEX email_logs_recipient_id_created_at_idx ON email_logs(recipient_id, created_at DESC);
CREATE INDEX email_logs_status_created_at_idx ON email_logs(status, created_at DESC);
CREATE INDEX email_logs_type_created_at_idx ON email_logs(type, created_at DESC);

-- ========================================
-- PASO 3: FUNCIÓN Y TRIGGER
-- ========================================

CREATE OR REPLACE FUNCTION create_default_notification_preferences()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO notification_preferences (id, user_id, created_at, updated_at)
    VALUES (
        gen_random_uuid()::text,
        NEW.id,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    )
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER create_notification_preferences_on_user_insert
    AFTER INSERT ON users
    FOR EACH ROW
    EXECUTE FUNCTION create_default_notification_preferences();

-- ========================================
-- PASO 4: CREAR PREFERENCIAS PARA USUARIOS EXISTENTES
-- ========================================

INSERT INTO notification_preferences (id, user_id, created_at, updated_at)
SELECT
    gen_random_uuid()::text,
    id,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM users
WHERE id NOT IN (SELECT user_id FROM notification_preferences)
ON CONFLICT (user_id) DO NOTHING;

-- ========================================
-- PASO 5: COMENTARIOS
-- ========================================

COMMENT ON TABLE notifications IS 'Registro de todas las notificaciones enviadas a usuarios';
COMMENT ON TABLE notification_preferences IS 'Preferencias de notificación por usuario';
COMMENT ON TABLE email_logs IS 'Log de auditoría de emails enviados';

-- ========================================
-- ¡LISTO! Ahora ejecuta: node test-notifications-simple.mjs
-- ========================================
