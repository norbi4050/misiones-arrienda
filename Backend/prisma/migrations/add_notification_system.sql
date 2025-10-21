-- Sistema de Notificaciones Completo
-- Soporta: Inquilinos e Inmobiliarias
-- Fecha: 2025-10-21

-- ========================================
-- Tabla: notifications
-- ========================================
CREATE TABLE IF NOT EXISTS "notifications" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "metadata" TEXT,
    "relatedId" TEXT,
    "relatedType" TEXT,
    "channels" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "sentAt" TIMESTAMPTZ,
    "readAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId")
        REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Índices para performance
CREATE INDEX "notifications_userId_read_idx" ON "notifications"("userId", "read");
CREATE INDEX "notifications_userId_createdAt_idx" ON "notifications"("userId", "createdAt" DESC);
CREATE INDEX "notifications_type_createdAt_idx" ON "notifications"("type", "createdAt" DESC);

-- ========================================
-- Tabla: notification_preferences
-- ========================================
CREATE TABLE IF NOT EXISTS "notification_preferences" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL UNIQUE,

    -- Canales globales
    "emailEnabled" BOOLEAN NOT NULL DEFAULT true,
    "inAppEnabled" BOOLEAN NOT NULL DEFAULT true,
    "pushEnabled" BOOLEAN NOT NULL DEFAULT false,

    -- Por tipo de evento
    -- Mensajería (inquilinos, inmobiliarias)
    "newMessages" BOOLEAN NOT NULL DEFAULT true,
    "messageReplies" BOOLEAN NOT NULL DEFAULT true,

    -- Propiedades (inmobiliarias)
    "propertyInquiries" BOOLEAN NOT NULL DEFAULT true,
    "propertyStatusChange" BOOLEAN NOT NULL DEFAULT true,
    "propertyExpiring" BOOLEAN NOT NULL DEFAULT true,

    -- Favoritos (inquilinos)
    "favoritesUpdates" BOOLEAN NOT NULL DEFAULT true,
    "newPropertiesInArea" BOOLEAN NOT NULL DEFAULT false,

    -- Social (todos)
    "likesReceived" BOOLEAN NOT NULL DEFAULT true,
    "newFollowers" BOOLEAN NOT NULL DEFAULT false,

    -- Pagos y Suscripciones (inmobiliarias)
    "paymentCompleted" BOOLEAN NOT NULL DEFAULT true,
    "planExpiring" BOOLEAN NOT NULL DEFAULT true,
    "invoiceReady" BOOLEAN NOT NULL DEFAULT true,

    -- Sistema (todos)
    "systemAnnouncements" BOOLEAN NOT NULL DEFAULT true,
    "securityAlerts" BOOLEAN NOT NULL DEFAULT true,

    -- Marketing (todos, opt-in)
    "promotionalEmails" BOOLEAN NOT NULL DEFAULT false,
    "newsletter" BOOLEAN NOT NULL DEFAULT false,

    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_preferences_userId_fkey" FOREIGN KEY ("userId")
        REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- ========================================
-- Tabla: email_logs
-- ========================================
CREATE TABLE IF NOT EXISTS "email_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "recipientId" TEXT,
    "recipientEmail" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "templateUsed" TEXT,
    "metadata" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "sentAt" TIMESTAMPTZ,
    "errorMessage" TEXT,
    "provider" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Índices para email_logs
CREATE INDEX "email_logs_recipientId_createdAt_idx" ON "email_logs"("recipientId", "createdAt" DESC);
CREATE INDEX "email_logs_status_createdAt_idx" ON "email_logs"("status", "createdAt" DESC);
CREATE INDEX "email_logs_type_createdAt_idx" ON "email_logs"("type", "createdAt" DESC);

-- ========================================
-- Función: Crear preferencias por defecto
-- ========================================
CREATE OR REPLACE FUNCTION create_default_notification_preferences()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO "notification_preferences" ("id", "userId", "createdAt", "updatedAt")
    VALUES (
        gen_random_uuid()::text,
        NEW.id,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    );
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
-- Comentarios para documentación
-- ========================================
COMMENT ON TABLE "notifications" IS 'Registro de todas las notificaciones enviadas a usuarios';
COMMENT ON TABLE "notification_preferences" IS 'Preferencias de notificación por usuario';
COMMENT ON TABLE "email_logs" IS 'Log de auditoría de emails enviados';

COMMENT ON COLUMN "notifications"."type" IS 'Tipos: NEW_MESSAGE, INQUIRY_RECEIVED, PROPERTY_STATUS_CHANGED, PAYMENT_COMPLETED, LIKE_RECEIVED, PLAN_EXPIRING, NEW_FOUNDER';
COMMENT ON COLUMN "notifications"."channels" IS 'JSON array de canales: ["email", "in_app", "push"]';
COMMENT ON COLUMN "notifications"."metadata" IS 'JSON con datos extra del contexto de la notificación';
