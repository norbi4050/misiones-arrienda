-- Migration: Add founder fields to users table
-- Date: 2025-10-21
-- Description: Agregar campos para el sistema de fundadores (oferta 12 meses gratis)

-- Add founder fields to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS is_founder BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS founder_discount DECIMAL(5,2) DEFAULT 50.00,
ADD COLUMN IF NOT EXISTS plan_tier VARCHAR(20) DEFAULT 'free',
ADD COLUMN IF NOT EXISTS plan_start_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS plan_end_date TIMESTAMPTZ;

-- Add index for founder queries
CREATE INDEX IF NOT EXISTS idx_users_is_founder ON users(is_founder);
CREATE INDEX IF NOT EXISTS idx_users_plan_tier ON users(plan_tier);
CREATE INDEX IF NOT EXISTS idx_users_plan_end_date ON users(plan_end_date) WHERE plan_end_date IS NOT NULL;

-- Add comment to columns
COMMENT ON COLUMN users.is_founder IS 'Indica si el usuario es miembro fundador (primeras 15 inmobiliarias)';
COMMENT ON COLUMN users.founder_discount IS 'Porcentaje de descuento permanente para fundadores (default 50%)';
COMMENT ON COLUMN users.plan_tier IS 'Tier del plan actual: free, professional, premium';
COMMENT ON COLUMN users.plan_start_date IS 'Fecha de inicio del plan actual';
COMMENT ON COLUMN users.plan_end_date IS 'Fecha de fin del plan (NULL = gratis permanente o plan free)';
