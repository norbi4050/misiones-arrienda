-- ============================================================================
-- MIGRACIÓN: PERFILES PÚBLICOS DE INMOBILIARIAS - SCHEMA COMPLETO
-- Fecha: Enero 2025
-- Versión: 1.0
-- Descripción: Agrega todas las tablas y campos necesarios para el sistema
--              completo de perfiles públicos de inmobiliarias
-- ============================================================================

-- ============================================================================
-- PARTE 1: TABLA DE EQUIPO (agency_team_members)
-- ============================================================================

-- Crear tabla para miembros del equipo de la inmobiliaria
CREATE TABLE IF NOT EXISTS agency_team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
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
  USING (auth.uid() = agency_id);

-- ============================================================================
-- PARTE 3: CAMPOS NUEVOS EN TABLA users
-- ============================================================================

-- Teléfono comercial (diferente al teléfono personal)
ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS commercial_phone TEXT;

COMMENT ON COLUMN users.commercial_phone IS 'Teléfono comercial de la inmobiliaria (visible en perfil público)';

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

COMMENT ON COLUMN users.business_hours IS 'Horarios de atención de la inmobiliaria (JSON con 7 días)';

-- Zona horaria
ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'America/Argentina/Buenos_Aires';

COMMENT ON COLUMN users.timezone IS 'Zona horaria para calcular "Abierto ahora" correctamente';

-- Coordenadas geográficas para el mapa
ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION;

ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;

COMMENT ON COLUMN users.latitude IS 'Latitud de la ubicación de la oficina';
COMMENT ON COLUMN users.longitude IS 'Longitud de la ubicación de la oficina';

-- ============================================================================
-- PARTE 4: CONFIGURACIÓN DE PRIVACIDAD (Nuevos campos)
-- ============================================================================

-- Mostrar equipo públicamente
ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS show_team_public BOOLEAN DEFAULT true;

COMMENT ON COLUMN users.show_team_public IS 'Si se muestra la sección de equipo en el perfil público';

-- Mostrar horarios públicamente
ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS show_hours_public BOOLEAN DEFAULT true;

COMMENT ON COLUMN users.show_hours_public IS 'Si se muestran los horarios de atención en el perfil público';

-- Mostrar mapa públicamente
ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS show_map_public BOOLEAN DEFAULT true;

COMMENT ON COLUMN users.show_map_public IS 'Si se muestra el mapa de ubicación en el perfil público';

-- Mostrar estadísticas públicamente
ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS show_stats_public BOOLEAN DEFAULT true;

COMMENT ON COLUMN users.show_stats_public IS 'Si se muestran las estadísticas en el perfil público';

-- ============================================================================
-- PARTE 5: ÍNDICES ADICIONALES PARA PERFORMANCE
-- ============================================================================

-- Índice para búsquedas geográficas (si se implementa búsqueda por ubicación)
CREATE INDEX IF NOT EXISTS idx_users_location 
  ON users(latitude, longitude) 
  WHERE user_type = 'inmobiliaria' AND latitude IS NOT NULL AND longitude IS NOT NULL;

-- Índice para filtrar inmobiliarias activas
CREATE INDEX IF NOT EXISTS idx_users_inmobiliarias_active 
  ON users(user_type, verified, created_at) 
  WHERE user_type = 'inmobiliaria';

-- ============================================================================
-- PARTE 6: FUNCIÓN HELPER PARA VALIDAR LÍMITE DE EQUIPO
-- ============================================================================

-- Función para verificar que no se excedan los 2 miembros por agencia
CREATE OR REPLACE FUNCTION check_team_member_limit()
RETURNS TRIGGER AS $$
DECLARE
  current_count INTEGER;
BEGIN
  -- Contar miembros activos actuales
  SELECT COUNT(*) INTO current_count
  FROM agency_team_members
  WHERE agency_id = NEW.agency_id 
    AND is_active = true
    AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid);
  
  -- Si ya hay 2 miembros activos, rechazar
  IF current_count >= 2 AND NEW.is_active = true THEN
    RAISE EXCEPTION 'Una inmobiliaria solo puede tener máximo 2 miembros activos en su equipo';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para validar límite antes de INSERT o UPDATE
DROP TRIGGER IF EXISTS enforce_team_member_limit ON agency_team_members;
CREATE TRIGGER enforce_team_member_limit
  BEFORE INSERT OR UPDATE ON agency_team_members
  FOR EACH ROW
  EXECUTE FUNCTION check_team_member_limit();

-- ============================================================================
-- PARTE 7: FUNCIÓN PARA ACTUALIZAR updated_at AUTOMÁTICAMENTE
-- ============================================================================

-- Función genérica para actualizar timestamp
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
-- PARTE 8: VISTA PARA ESTADÍSTICAS PÚBLICAS (Opcional - para performance)
-- ============================================================================

-- Vista materializada para estadísticas de inmobiliarias
-- Esto mejora el performance al no tener que calcular en cada request
CREATE MATERIALIZED VIEW IF NOT EXISTS agency_public_stats AS
SELECT 
  u.id as agency_id,
  u.company_name,
  COUNT(p.id) as total_properties,
  COUNT(CASE WHEN p.is_active = true THEN 1 END) as active_properties,
  ROUND(AVG(p.price)::numeric, 2) as average_price,
  COUNT(CASE WHEN p.created_at >= DATE_TRUNC('month', CURRENT_DATE) THEN 1 END) as properties_this_month,
  MAX(p.created_at) as last_property_date
FROM users u
LEFT JOIN properties p ON p.user_id = u.id
WHERE u.user_type = 'inmobiliaria'
GROUP BY u.id, u.company_name;

-- Índice único en la vista materializada
CREATE UNIQUE INDEX IF NOT EXISTS idx_agency_stats_agency_id 
  ON agency_public_stats(agency_id);

-- Comentario
COMMENT ON MATERIALIZED VIEW agency_public_stats IS 
  'Estadísticas pre-calculadas de inmobiliarias para mejorar performance del perfil público. 
   Refrescar cada hora con: REFRESH MATERIALIZED VIEW CONCURRENTLY agency_public_stats;';

-- ============================================================================
-- PARTE 9: FUNCIÓN PARA REFRESCAR ESTADÍSTICAS
-- ============================================================================

-- Función para refrescar la vista materializada
CREATE OR REPLACE FUNCTION refresh_agency_stats()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY agency_public_stats;
END;
$$ LANGUAGE plpgsql;

-- Comentario
COMMENT ON FUNCTION refresh_agency_stats() IS 
  'Refresca las estadísticas de inmobiliarias. 
   Ejecutar cada hora via cron job o manualmente cuando sea necesario.';

-- ============================================================================
-- PARTE 10: DATOS DE EJEMPLO (Solo para desarrollo)
-- ============================================================================

-- Insertar horarios por defecto para inmobiliarias existentes que no los tengan
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

-- Verificar que todos los campos existen
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
  
  -- Verificar que la tabla agency_team_members existe
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_name = 'agency_team_members'
  ) THEN
    RAISE EXCEPTION 'Tabla agency_team_members no fue creada';
  ELSE
    RAISE NOTICE '✅ Tabla agency_team_members creada correctamente';
  END IF;
  
  -- Verificar que la vista materializada existe
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_matviews 
    WHERE matviewname = 'agency_public_stats'
  ) THEN
    RAISE WARNING '⚠️  Vista materializada agency_public_stats no fue creada (opcional)';
  ELSE
    RAISE NOTICE '✅ Vista materializada agency_public_stats creada correctamente';
  END IF;
END $$;

-- ============================================================================
-- RESUMEN DE CAMBIOS
-- ============================================================================

/*
TABLAS NUEVAS:
  ✅ agency_team_members - Equipo de la inmobiliaria (máx 2 miembros)

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

ÍNDICES CREADOS:
  ✅ idx_team_agency - Para queries de equipo por agencia
  ✅ idx_team_order - Para ordenamiento de equipo
  ✅ idx_users_location - Para búsquedas geográficas
  ✅ idx_users_inmobiliarias_active - Para listados de inmobiliarias

RLS POLICIES:
  ✅ Lectura pública de miembros activos
  ✅ Gestión completa solo por la inmobiliaria dueña

FUNCIONES:
  ✅ check_team_member_limit() - Valida máximo 2 miembros
  ✅ update_updated_at_column() - Actualiza timestamp automáticamente
  ✅ refresh_agency_stats() - Refresca estadísticas

VISTAS MATERIALIZADAS:
  ✅ agency_public_stats - Estadísticas pre-calculadas (opcional)

TRIGGERS:
  ✅ enforce_team_member_limit - Valida límite de equipo
  ✅ update_team_members_updated_at - Actualiza timestamp

TOTAL DE CAMBIOS: 9 campos + 1 tabla + 4 índices + 2 policies + 3 funciones + 2 triggers + 1 vista
*/

-- ============================================================================
-- INSTRUCCIONES DE USO
-- ============================================================================

/*
1. EJECUTAR ESTA MIGRACIÓN:
   - Copiar todo el contenido de este archivo
   - Ir a Supabase Dashboard → SQL Editor
   - Pegar y ejecutar
   - Verificar que no haya errores

2. REFRESCAR ESTADÍSTICAS (Opcional):
   - Ejecutar manualmente: SELECT refresh_agency_stats();
   - O configurar cron job para ejecutar cada hora

3. VERIFICAR MIGRACIÓN:
   - Ejecutar: SELECT column_name FROM information_schema.columns WHERE table_name = 'users';
   - Verificar que existan todos los campos nuevos

4. TESTING:
   - Insertar un miembro de equipo de prueba
   - Verificar que no se puedan insertar más de 2 activos
   - Verificar que las policies RLS funcionen correctamente
*/

-- ============================================================================
-- FIN DE LA MIGRACIÓN
-- ============================================================================
