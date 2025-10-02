-- =====================================================
-- B5 PROMPT 5: Short-links Table Migration
-- =====================================================
-- Fecha: 2025-01-XX
-- Objetivo: Tabla para almacenar short-links (PRO/BUSINESS feature)

-- Crear tabla short_links
CREATE TABLE IF NOT EXISTS short_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug VARCHAR(10) UNIQUE NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entity_type VARCHAR(20) NOT NULL CHECK (entity_type IN ('property', 'agency')),
  entity_id VARCHAR(50) NOT NULL,
  full_url TEXT NOT NULL,
  campaign VARCHAR(100) DEFAULT 'default',
  clicks INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT short_links_slug_length CHECK (char_length(slug) >= 4 AND char_length(slug) <= 10)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_short_links_slug ON short_links(slug);
CREATE INDEX IF NOT EXISTS idx_short_links_user_id ON short_links(user_id);
CREATE INDEX IF NOT EXISTS idx_short_links_entity ON short_links(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_short_links_created_at ON short_links(created_at DESC);

-- Comentarios
COMMENT ON TABLE short_links IS 'B5: Short-links para compartir (PRO/BUSINESS feature)';
COMMENT ON COLUMN short_links.slug IS 'Slug único para el short-link (ej: aB3xY9)';
COMMENT ON COLUMN short_links.entity_type IS 'Tipo de entidad: property o agency';
COMMENT ON COLUMN short_links.entity_id IS 'ID de la entidad (property.id o inmobiliaria.id)';
COMMENT ON COLUMN short_links.full_url IS 'URL completa con UTM params';
COMMENT ON COLUMN short_links.campaign IS 'Nombre de la campaña (preset seleccionado)';
COMMENT ON COLUMN short_links.clicks IS 'Contador de clicks/resoluciones';

-- =====================================================
-- RLS (Row Level Security) Policies
-- =====================================================

ALTER TABLE short_links ENABLE ROW LEVEL SECURITY;

-- Policy 1: Users can view their own short links
CREATE POLICY "Users can view their own short links"
  ON short_links FOR SELECT
  USING (auth.uid() = user_id);

-- Policy 2: Users can create short links (con verificación de plan en app)
CREATE POLICY "Users can create short links"
  ON short_links FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy 3: Users can update their own short links (solo clicks)
CREATE POLICY "Users can update their own short links"
  ON short_links FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy 4: Public can resolve short links (para /go/{slug})
-- Nota: Esta policy permite SELECT público solo para resolución
CREATE POLICY "Public can resolve short links"
  ON short_links FOR SELECT
  USING (true);

-- Policy 5: Users can delete their own short links
CREATE POLICY "Users can delete their own short links"
  ON short_links FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- Trigger para updated_at
-- =====================================================

CREATE OR REPLACE FUNCTION update_short_links_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_short_links_updated_at
  BEFORE UPDATE ON short_links
  FOR EACH ROW
  EXECUTE FUNCTION update_short_links_updated_at();

-- =====================================================
-- Función helper para generar slug único
-- =====================================================

CREATE OR REPLACE FUNCTION generate_unique_slug()
RETURNS VARCHAR(10) AS $$
DECLARE
  chars TEXT := 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result VARCHAR(10) := '';
  i INTEGER;
  slug_exists BOOLEAN;
BEGIN
  LOOP
    result := '';
    
    -- Generar slug de 6 caracteres
    FOR i IN 1..6 LOOP
      result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
    END LOOP;
    
    -- Verificar si ya existe
    SELECT EXISTS(SELECT 1 FROM short_links WHERE slug = result) INTO slug_exists;
    
    -- Si no existe, retornar
    IF NOT slug_exists THEN
      RETURN result;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Vista para analytics de short-links
-- =====================================================

CREATE OR REPLACE VIEW short_links_analytics AS
SELECT 
  sl.user_id,
  sl.entity_type,
  sl.campaign,
  COUNT(*) as total_links,
  SUM(sl.clicks) as total_clicks,
  AVG(sl.clicks) as avg_clicks_per_link,
  MAX(sl.clicks) as max_clicks,
  MIN(sl.created_at) as first_link_created,
  MAX(sl.created_at) as last_link_created
FROM short_links sl
GROUP BY sl.user_id, sl.entity_type, sl.campaign;

COMMENT ON VIEW short_links_analytics IS 'B5: Analytics agregados de short-links por usuario';

-- =====================================================
-- Grants (si es necesario)
-- =====================================================

-- Permitir a usuarios autenticados usar la función
GRANT EXECUTE ON FUNCTION generate_unique_slug() TO authenticated;
GRANT EXECUTE ON FUNCTION update_short_links_updated_at() TO authenticated;

-- =====================================================
-- Función para incrementar clicks de manera atómica
-- =====================================================

CREATE OR REPLACE FUNCTION increment_short_link_clicks(link_slug VARCHAR)
RETURNS VOID AS $$
BEGIN
  UPDATE short_links
  SET clicks = clicks + 1,
      updated_at = NOW()
  WHERE slug = link_slug;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION increment_short_link_clicks IS 'B5: Incrementa el contador de clicks de un short-link de manera atómica';

-- Grant para usuarios autenticados y anónimos (para /go/{slug} público)
GRANT EXECUTE ON FUNCTION increment_short_link_clicks(VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_short_link_clicks(VARCHAR) TO anon;

-- =====================================================
-- Verificación
-- =====================================================

-- Verificar que la tabla se creó correctamente
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'short_links') THEN
    RAISE NOTICE '✅ Tabla short_links creada exitosamente';
  ELSE
    RAISE EXCEPTION '❌ Error: Tabla short_links no se creó';
  END IF;
END $$;

-- Verificar índices
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_short_links_slug') THEN
    RAISE NOTICE '✅ Índice idx_short_links_slug creado';
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_short_links_user_id') THEN
    RAISE NOTICE '✅ Índice idx_short_links_user_id creado';
  END IF;
END $$;

-- Verificar RLS habilitado
DO $$
BEGIN
  IF (SELECT relrowsecurity FROM pg_class WHERE relname = 'short_links') THEN
    RAISE NOTICE '✅ RLS habilitado en short_links';
  ELSE
    RAISE WARNING '⚠️ RLS NO habilitado en short_links';
  END IF;
END $$;

-- =====================================================
-- Rollback (si es necesario)
-- =====================================================

/*
-- Para revertir esta migración:

DROP VIEW IF EXISTS short_links_analytics;
DROP TRIGGER IF EXISTS trigger_short_links_updated_at ON short_links;
DROP FUNCTION IF EXISTS update_short_links_updated_at();
DROP FUNCTION IF EXISTS generate_unique_slug();
DROP TABLE IF EXISTS short_links CASCADE;

*/
