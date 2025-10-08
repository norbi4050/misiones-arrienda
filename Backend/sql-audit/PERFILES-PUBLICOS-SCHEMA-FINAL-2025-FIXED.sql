-- ============================================================================
-- MIGRACIÓN CORREGIDA: PERFILES PÚBLICOS DE INMOBILIARIAS
-- Fecha: Enero 2025
-- Versión: 1.1 (FIXED para users.id tipo TEXT)
-- 
-- IMPORTANTE: Esta versión usa TEXT para agency_id porque users.id es TEXT
-- ============================================================================

-- ============================================================================
-- PARTE 1: TABLA DE EQUIPO (agency_team_members)
-- ============================================================================

-- Crear tabla para miembros del equipo de la inmobiliaria
CREATE TABLE IF NOT EXISTS agency_team_members (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  agency_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  photo_url TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comentarios para documentación
COMMENT ON TABLE agency_team_members IS 'Miembros del equipo de trabajo de cada inmobiliaria (máximo 2 por agencia)';
COMMENT ON COLUMN agency_team_members.agency_id IS 'ID de la inmobiliaria dueña del equipo';
COMMENT ON COLUMN agency_team_members.name IS 'Nombre completo del miembro del equipo';
COMMENT ON COLUMN agency_team_members.photo_url IS 'URL de la foto del miembro (80x80px recomendado)';
COMMENT ON COLUMN agency_team_members.display_order IS 'Orden de visualización (0 = primero)';
COMMENT ON COLUMN agency_team_members.is_active IS 'Si el miembro está activo y visible públicamente';

-- Índices para optimizar queries
CREATE INDEX IF NOT EXISTS idx_team_agency 
  ON agency_team_members(agency_id, is_active);

CREATE INDEX IF NOT EXISTS idx_team_order 
  ON agency_team_members(agency_id, display_order);

-- ============================================================================
-- PARTE 2: ROW LEVEL SECURITY (RLS) PARA EQUIPO
-- ============================================================================

-- Habilitar RLS
ALTER TABLE agency_team_members ENABLE ROW LEVEL SECURITY;

-- Policy: Lectura pública (solo miembros activos)
DROP POLICY IF EXISTS "Team members are viewable by everyone" ON agency_team_members;
CREATE POLICY "Team members are viewable by everyone"
  ON agency_team_members FOR SELECT
  USING (is_active = true);

-- Policy: La inmobiliaria puede gestionar su propio equipo
DROP POLICY IF EXISTS "Agency can manage their team" ON agency_team_members;
CREATE POLICY "Agency can manage their team"
  ON agency_team_members FOR ALL
  USING (auth.uid()::text = agency_id);

-- ============================================================================
-- PARTE 3: CAMPOS NUEVOS EN TABLA users
-- ============================================================================

-- Teléfono comercial
ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS commercial_phone TEXT;

-- Horarios de atención (JSON con estructura de 7 días)
ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS business_hours JSONB DEFAULT '{
    "monday": {"open": "09:00", "close": "18:00", "closed": false},
    "tuesday": {"open": "09:00", "close": "18:00", "closed": false},
    "wednesday": {"open": "09:00", "close": "18:00", "closed": false},
    "thursday": {"open": "09:00", "close": "18:00", "closed": false},
    "friday": {"open": "09:00", "close": "18:00", "closed": false},
    "saturday": {"open": "09:00", "close": "13:00", "closed": false},
    "sunday": {"open": "00:00", "close": "00:00", "closed": true}
  }'::jsonb;

-- Zona horaria
ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'America/Argentina/Buenos_Aires';

-- Coordenadas geográficas
ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION;

ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;

-- ============================================================================
-- PARTE 4: CONFIGURACIÓN DE PRIVACIDAD
-- ============================================================================

ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS show_team_public BOOLEAN DEFAULT true;

ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS show_hours_public BOOLEAN DEFAULT true;

ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS show_map_public BOOLEAN DEFAULT true;

ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS show_stats_public BOOLEAN DEFAULT true;

-- ============================================================================
-- PARTE 5: ÍNDICES ADICIONALES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_users_location 
  ON users(latitude, longitude) 
  WHERE user_type = 'inmobiliaria' AND latitude IS NOT NULL AND longitude IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_users_inmobiliarias_active 
  ON users(user_type, verified, created_at) 
  WHERE user_type = 'inmobiliaria';

-- ============================================================================
-- PARTE 6: FUNCIÓN PARA VALIDAR LÍMITE DE EQUIPO
-- ============================================================================

CREATE OR REPLACE FUNCTION check_team_member_limit()
RETURNS TRIGGER AS $$
DECLARE
  current_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO current_count
  FROM agency_team_members
  WHERE agency_id = NEW.agency_id 
    AND is_active = true
    AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000');
  
  IF current_count >= 2 AND NEW.is_active = true THEN
    RAISE EXCEPTION 'Una inmobiliaria solo puede tener máximo 2 miembros activos en su equipo';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para validar límite
DROP TRIGGER IF EXISTS enforce_team_member_limit ON agency_team_members;
CREATE TRIGGER enforce_team_member_limit
  BEFORE INSERT OR UPDATE ON agency_team_members
  FOR EACH ROW
  EXECUTE FUNCTION check_team_member_limit();

-- ============================================================================
-- PARTE 7: FUNCIÓN PARA ACTUALIZAR updated_at
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para agency_team_members
DROP TRIGGER IF EXISTS update_team_members_updated_at ON agency_team_members;
CREATE TRIGGER update_team_members_updated_at
  BEFORE UPDATE ON agency_team_members
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- PARTE 8: DATOS POR DEFECTO
-- ============================================================================

-- Insertar horarios por defecto para inmobiliarias existentes
UPDATE users
SET business_hours = '{
  "monday": {"open": "09:00", "close": "18:00", "closed": false},
  "tuesday": {"open": "09:00", "close": "18:00", "closed": false},
  "wednesday": {"open": "09:00", "close": "18:00", "closed": false},
  "thursday": {"open": "09:00", "close": "18:00", "closed": false},
  "friday": {"open": "09:00", "close": "18:00", "closed": false},
  "saturday": {"open": "09:00", "close": "13:00", "closed": false},
  "sunday": {"open": "00:00", "close": "00:00", "closed": true}
}'::jsonb
WHERE user_type = 'inmobiliaria' 
  AND business_hours IS NULL;

-- ============================================================================
-- VERIFICACIÓN FINAL
-- ============================================================================

DO $$
DECLARE
  missing_columns TEXT[];
BEGIN
  -- Verificar columnas en users
  SELECT ARRAY_AGG(column_name)
  INTO missing_columns
  FROM (
    SELECT unnest(ARRAY[
      'commercial_phone',
      'business_hours',
      'timezone',
      'latitude',
      'longitude',
      'show_team_public',
      'show_hours_public',
      'show_map_public',
      'show_stats_public'
    ]) as column_name
  ) expected
  WHERE NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'users' 
      AND column_name = expected.column_name
  );
  
  IF array_length(missing_columns, 1) > 0 THEN
    RAISE EXCEPTION 'Faltan columnas en tabla users: %', array_to_string(missing_columns, ', ');
  ELSE
    RAISE NOTICE '✅ Todas las columnas de users fueron creadas correctamente';
  END IF;
  
  -- Verificar tabla
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_name = 'agency_team_members'
  ) THEN
    RAISE EXCEPTION 'Tabla agency_team_members no fue creada';
  ELSE
    RAISE NOTICE '✅ Tabla agency_team_members creada correctamente';
  END IF;
END $$;

-- ============================================================================
-- RESUMEN DE CAMBIOS
-- ============================================================================

/*
CAMBIOS APLICADOS:

TABLAS NUEVAS:
  ✅ agency_team_members - Equipo de la inmobiliaria (máx 2 miembros)
     - Usa TEXT para id y agency_id (compatible con users.id)

CAMPOS NUEVOS EN users:
  ✅ commercial_phone - Teléfono comercial
  ✅ business_hours - Horarios de atención (JSONB)
  ✅ timezone - Zona horaria
  ✅ latitude - Latitud para mapa
  ✅ longitude - Longitud para mapa
  ✅ show_team_public - Mostrar equipo públicamente
  ✅ show_hours_public - Mostrar horarios públicamente
  ✅ show_map_public - Mostrar mapa públicamente
  ✅ show_stats_public - Mostrar estadísticas públicamente

ÍNDICES:
  ✅ idx_team_agency
  ✅ idx_team_order
  ✅ idx_users_location
  ✅ idx_users_inmobiliarias_active

RLS POLICIES:
  ✅ Lectura pública de miembros activos
  ✅ Gestión completa solo por la inmobiliaria dueña

FUNCIONES Y TRIGGERS:
  ✅ check_team_member_limit() - Valida máximo 2 miembros
  ✅ update_updated_at_column() - Actualiza timestamp
  ✅ enforce_team_member_limit - Trigger de validación
  ✅ update_team_members_updated_at - Trigger de timestamp

NOTA: Se removió la vista materializada para simplificar.
      Las estadísticas se calcularán en tiempo real desde las APIs.
*/
