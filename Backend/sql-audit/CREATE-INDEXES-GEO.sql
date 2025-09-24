-- Índices geográficos para optimizar consultas con BBOX
-- Sprint F - Mapa en Listado + BBOX + Filtros sincronizados

-- Índice compuesto para consultas geográficas
CREATE INDEX IF NOT EXISTS idx_properties_geo_coords 
ON public.properties (lat, lng) 
WHERE status = 'AVAILABLE';

-- Índice para consultas combinadas geo + precio
CREATE INDEX IF NOT EXISTS idx_properties_geo_price 
ON public.properties (lat, lng, price) 
WHERE status = 'AVAILABLE';

-- Índice para consultas geo + tipo de propiedad
CREATE INDEX IF NOT EXISTS idx_properties_geo_type 
ON public.properties (lat, lng, property_type) 
WHERE status = 'AVAILABLE';

-- Índice para consultas geo + featured
CREATE INDEX IF NOT EXISTS idx_properties_geo_featured 
ON public.properties (lat, lng, featured) 
WHERE status = 'AVAILABLE' AND featured = true;

-- Índice para consultas geo + ciudad (para fallback)
CREATE INDEX IF NOT EXISTS idx_properties_geo_city 
ON public.properties (city, lat, lng) 
WHERE status = 'AVAILABLE';

-- Comentarios sobre optimización
COMMENT ON INDEX idx_properties_geo_coords IS 'Índice principal para consultas BBOX en mapa de propiedades';
COMMENT ON INDEX idx_properties_geo_price IS 'Optimiza filtros combinados: ubicación + rango de precios';
COMMENT ON INDEX idx_properties_geo_type IS 'Optimiza filtros combinados: ubicación + tipo de propiedad';
COMMENT ON INDEX idx_properties_geo_featured IS 'Optimiza consultas de propiedades destacadas en mapa';
COMMENT ON INDEX idx_properties_geo_city IS 'Fallback para consultas por ciudad con coordenadas';

-- Verificar que las columnas lat/lng existen
-- Si no existen, agregarlas:
DO $$
BEGIN
    -- Agregar columna lat si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'properties' AND column_name = 'lat'
    ) THEN
        ALTER TABLE public.properties ADD COLUMN lat DECIMAL(10, 8);
        COMMENT ON COLUMN public.properties.lat IS 'Latitud para geolocalización en mapa';
    END IF;

    -- Agregar columna lng si no existe  
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'properties' AND column_name = 'lng'
    ) THEN
        ALTER TABLE public.properties ADD COLUMN lng DECIMAL(11, 8);
        COMMENT ON COLUMN public.properties.lng IS 'Longitud para geolocalización en mapa';
    END IF;

    -- Agregar columna featured si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'properties' AND column_name = 'featured'
    ) THEN
        ALTER TABLE public.properties ADD COLUMN featured BOOLEAN DEFAULT false;
        COMMENT ON COLUMN public.properties.featured IS 'Indica si la propiedad está destacada';
    END IF;
END $$;

-- Datos de ejemplo para coordenadas de ciudades de Misiones
-- (Solo si las columnas están vacías)
UPDATE public.properties 
SET 
    lat = CASE 
        WHEN city ILIKE '%posadas%' THEN -27.3676
        WHEN city ILIKE '%puerto iguazu%' OR city ILIKE '%iguazu%' THEN -25.5947
        WHEN city ILIKE '%obera%' THEN -27.4878
        WHEN city ILIKE '%eldorado%' THEN -26.4009
        WHEN city ILIKE '%alem%' THEN -27.6011
        ELSE -27.0000 -- Coordenada por defecto para Misiones
    END,
    lng = CASE 
        WHEN city ILIKE '%posadas%' THEN -55.8961
        WHEN city ILIKE '%puerto iguazu%' OR city ILIKE '%iguazu%' THEN -54.5734
        WHEN city ILIKE '%obera%' THEN -55.1199
        WHEN city ILIKE '%eldorado%' THEN -54.6156
        WHEN city ILIKE '%alem%' THEN -55.3206
        ELSE -55.0000 -- Coordenada por defecto para Misiones
    END
WHERE lat IS NULL OR lng IS NULL;

-- Estadísticas para el optimizador
ANALYZE public.properties;

-- Verificación de índices creados
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'properties' 
  AND indexname LIKE 'idx_properties_geo%'
ORDER BY indexname;
