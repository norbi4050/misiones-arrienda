-- Parche: Agregar columna 'channels' a la tabla notifications
-- Fecha: 2025-10-21

-- Agregar columna si no existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'notifications'
        AND column_name = 'channels'
    ) THEN
        ALTER TABLE "notifications" ADD COLUMN "channels" TEXT NOT NULL DEFAULT '["in_app", "email"]';
    END IF;
END $$;

-- Actualizar comentario
COMMENT ON COLUMN "notifications"."channels" IS 'JSON array de canales: ["email", "in_app", "push"]';
