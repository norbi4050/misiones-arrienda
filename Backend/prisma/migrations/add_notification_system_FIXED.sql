-- Sistema de Notificaciones Completo - VERSIÓN CORREGIDA
-- Soporta: Inquilinos e Inmobiliarias
-- Fecha: 2025-10-21
-- IMPORTANTE: Usa snake_case para todas las columnas (estándar PostgreSQL)

-- ========================================
-- Tabla: notifications
-- ========================================
CREATE TABLE IF NOT EXISTS "notifications" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "metadata" TEXT,
    "related_id" TEXT,
    "related_type" TEXT,
    "channels" TEXT NOT NULL DEFAULT '["in_app", "email"]',
    "read" BOOLEAN NOT NULL DEFAULT false,
    "sent_at" TIMESTAMPTZ,
    "read_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id")
        REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS "notifications_user_id_read_idx" ON "notifications"("user_id", "read");
CREATE INDEX IF NOT EXISTS "notifications_user_id_created_at_idx" ON "notifications"("user_id", "created_at" DESC);
CREATE INDEX IF NOT EXISTS "notifications_type_created_at_idx" ON "notifications"("type", "created_at" DESC);

-- ========================================
-- Tabla: notification_preferences
-- ========================================
CREATE TABLE IF NOT EXISTS "notification_preferences" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL UNIQUE,

    -- Canales globales
    "email_enabled" BOOLEAN NOT NULL DEFAULT true,
    "in_app_enabled" BOOLEAN NOT NULL DEFAULT true,
    "push_enabled" BOOLEAN NOT NULL DEFAULT false,

    -- Por tipo de evento
    -- Mensajería (inquilinos, inmobiliarias)
    "new_messages" BOOLEAN NOT NULL DEFAULT true,
    "message_replies" BOOLEAN NOT NULL DEFAULT true,

    -- Propiedades (inmobiliarias)
    "property_inquiries" BOOLEAN NOT NULL DEFAULT true,
    "inquiry_replies" BOOLEAN NOT NULL DEFAULT true,
    "property_status_changes" BOOLEAN NOT NULL DEFAULT true,
    "property_expiring" BOOLEAN NOT NULL DEFAULT true,

    -- Favoritos (inquilinos)
    "favorite_property_updates" BOOLEAN NOT NULL DEFAULT true,
    "new_properties_in_area" BOOLEAN NOT NULL DEFAULT false,

    -- Social (todos)
    "likes_received" BOOLEAN NOT NULL DEFAULT true,
    "new_followers" BOOLEAN NOT NULL DEFAULT false,

    -- Pagos y Suscripciones (inmobiliarias)
    "payments_completed" BOOLEAN NOT NULL DEFAULT true,
    "plan_expiring" BOOLEAN NOT NULL DEFAULT true,
    "plan_expired" BOOLEAN NOT NULL DEFAULT true,
    "invoices_ready" BOOLEAN NOT NULL DEFAULT true,

    -- Sistema (todos)
    "system_announcements" BOOLEAN NOT NULL DEFAULT true,
    "security_alerts" BOOLEAN NOT NULL DEFAULT true,

    -- Marketing (todos, opt-in)
    "promotional_emails" BOOLEAN NOT NULL DEFAULT false,
    "newsletter" BOOLEAN NOT NULL DEFAULT false,

    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_preferences_user_id_fkey" FOREIGN KEY ("user_id")
        REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- ========================================
-- Tabla: email_logs
-- ========================================
CREATE TABLE IF NOT EXISTS "email_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "recipient_id" TEXT,
    "recipient_email" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "template_used" TEXT,
    "metadata" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "sent_at" TIMESTAMPTZ,
    "error_message" TEXT,
    "provider" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Índices para email_logs
CREATE INDEX IF NOT EXISTS "email_logs_recipient_id_created_at_idx" ON "email_logs"("recipient_id", "created_at" DESC);
CREATE INDEX IF NOT EXISTS "email_logs_status_created_at_idx" ON "email_logs"("status", "created_at" DESC);
CREATE INDEX IF NOT EXISTS "email_logs_type_created_at_idx" ON "email_logs"("type", "created_at" DESC);

-- ========================================
-- Función: Crear preferencias por defecto
-- ========================================
CREATE OR REPLACE FUNCTION create_default_notification_preferences()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO "notification_preferences" ("id", "user_id", "created_at", "updated_at")
    VALUES (
        gen_random_uuid()::text,
        NEW.id,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    )
    ON CONFLICT ("user_id") DO NOTHING; -- Evitar duplicados
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Crear preferencias cuando se crea un usuario
DROP TRIGGER IF EXISTS create_notification_preferences_on_user_insert ON "users";
CREATE TRIGGER create_notification_preferences_on_user_insert
    AFTER INSERT ON "users"
    FOR EACH ROW
    EXECUTE FUNCTION create_default_notification_preferences();

-- ========================================
-- Crear preferencias para usuarios existentes
-- ========================================
-- Esto crea preferencias por defecto para todos los usuarios que ya existen
INSERT INTO "notification_preferences" ("id", "user_id", "created_at", "updated_at")
SELECT
    gen_random_uuid()::text,
    "id",
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "users"
WHERE "id" NOT IN (SELECT "user_id" FROM "notification_preferences")
ON CONFLICT ("user_id") DO NOTHING;

-- ========================================
-- Comentarios para documentación
-- ========================================
COMMENT ON TABLE "notifications" IS 'Registro de todas las notificaciones enviadas a usuarios';
COMMENT ON TABLE "notification_preferences" IS 'Preferencias de notificación por usuario';
COMMENT ON TABLE "email_logs" IS 'Log de auditoría de emails enviados';

COMMENT ON COLUMN "notifications"."type" IS 'Tipos: NEW_MESSAGE, INQUIRY_RECEIVED, PROPERTY_STATUS_CHANGED, PAYMENT_COMPLETED, LIKE_RECEIVED, PLAN_EXPIRING, etc.';
COMMENT ON COLUMN "notifications"."channels" IS 'JSON array de canales: ["email", "in_app", "push"]';
COMMENT ON COLUMN "notifications"."metadata" IS 'JSON con datos extra del contexto de la notificación';
