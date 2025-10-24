-- Migration: Add visual customization fields for inmobiliaria public pages
-- Created: 2024-10-23
-- Description: Adds fields for hero section customization, branding colors, and enhanced profile info

-- Add new columns to users table for visual customization
ALTER TABLE users ADD COLUMN IF NOT EXISTS header_image_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS tagline VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS primary_color VARCHAR(7);
ALTER TABLE users ADD COLUMN IF NOT EXISTS secondary_color VARCHAR(7);
ALTER TABLE users ADD COLUMN IF NOT EXISTS founded_year INTEGER;
ALTER TABLE users ADD COLUMN IF NOT EXISTS values JSONB;

-- Add comments to columns for documentation
COMMENT ON COLUMN users.header_image_url IS 'URL of the hero section background image for public profile';
COMMENT ON COLUMN users.tagline IS 'Short descriptive tagline displayed in hero section (max 100 chars)';
COMMENT ON COLUMN users.primary_color IS 'Primary brand color in hex format (e.g., #2563EB)';
COMMENT ON COLUMN users.secondary_color IS 'Secondary brand color in hex format (e.g., #F59E0B)';
COMMENT ON COLUMN users.founded_year IS 'Year the real estate agency was founded';
COMMENT ON COLUMN users.values IS 'Array of company values (max 5 items, 30 chars each)';

-- Add check constraint for color format (hex colors)
ALTER TABLE users ADD CONSTRAINT check_primary_color_format
  CHECK (primary_color IS NULL OR primary_color ~ '^#[0-9A-Fa-f]{6}$');

ALTER TABLE users ADD CONSTRAINT check_secondary_color_format
  CHECK (secondary_color IS NULL OR secondary_color ~ '^#[0-9A-Fa-f]{6}$');

-- Add check constraint for founded_year (reasonable range)
ALTER TABLE users ADD CONSTRAINT check_founded_year_range
  CHECK (founded_year IS NULL OR (founded_year >= 1900 AND founded_year <= EXTRACT(YEAR FROM CURRENT_DATE)));

-- Set default colors for existing inmobiliarias
UPDATE users
SET
  primary_color = '#2563EB',
  secondary_color = '#F59E0B'
WHERE user_type = 'inmobiliaria'
  AND (primary_color IS NULL OR secondary_color IS NULL);

-- Create index for faster queries on inmobiliarias with custom branding
CREATE INDEX IF NOT EXISTS idx_users_custom_branding
  ON users(user_type, primary_color)
  WHERE user_type = 'inmobiliaria' AND primary_color IS NOT NULL;

-- Validate values JSONB structure (max 5 items, each max 30 chars)
-- This is enforced at application level, but we document it here for reference
-- Example valid values: ["Transparencia", "Atención Personalizada", "Experiencia Local"]
