-- =====================================================
-- MIGRACIÓN: Sistema de Reportes de Propiedades
-- Fecha: 2025-10-22
-- Descripción: Añade tabla property_reports y campos relacionados
-- =====================================================

-- Crear tabla property_reports
CREATE TABLE IF NOT EXISTS public.property_reports (
  id TEXT PRIMARY KEY,

  -- Relaciones
  property_id TEXT NOT NULL REFERENCES public."Property"(id) ON DELETE CASCADE,
  reporter_id TEXT NOT NULL REFERENCES public."User"(id) ON DELETE CASCADE,

  -- Información del reporte
  reason TEXT NOT NULL,
  details TEXT NOT NULL,

  -- Estado
  status TEXT NOT NULL DEFAULT 'PENDING',

  -- Revisión admin
  reviewed_by_id TEXT,
  reviewed_at TIMESTAMPTZ,
  admin_notes TEXT,
  action_taken TEXT,

  -- Auditoría
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraint: un usuario solo puede reportar una propiedad una vez
  CONSTRAINT property_reports_reporter_property_unique UNIQUE (reporter_id, property_id)
);

-- Crear índices para optimización
CREATE INDEX IF NOT EXISTS idx_property_reports_property_status
  ON public.property_reports(property_id, status);

CREATE INDEX IF NOT EXISTS idx_property_reports_reporter_created
  ON public.property_reports(reporter_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_property_reports_status_created
  ON public.property_reports(status, created_at DESC);

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.property_reports ENABLE ROW LEVEL SECURITY;

-- Política: Usuarios autenticados pueden ver sus propios reportes
CREATE POLICY "Users can view own property reports"
  ON public.property_reports
  FOR SELECT
  TO authenticated
  USING (reporter_id = auth.uid()::text);

-- Política: Usuarios autenticados pueden crear reportes
CREATE POLICY "Users can create property reports"
  ON public.property_reports
  FOR INSERT
  TO authenticated
  WITH CHECK (reporter_id = auth.uid()::text);

-- Política: Dueños de propiedad pueden ver reportes de sus propiedades
CREATE POLICY "Property owners can view reports of their properties"
  ON public.property_reports
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public."Property" p
      WHERE p.id = property_reports.property_id
      AND p."userId" = auth.uid()::text
    )
  );

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION public.handle_property_reports_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  new.updated_at = NOW();
  RETURN new;
END;
$$;

-- Trigger para updated_at
DROP TRIGGER IF EXISTS trigger_property_reports_updated_at ON public.property_reports;
CREATE TRIGGER trigger_property_reports_updated_at
  BEFORE UPDATE ON public.property_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_property_reports_updated_at();

-- Comentarios para documentación
COMMENT ON TABLE public.property_reports IS 'Reportes de propiedades realizados por usuarios';
COMMENT ON COLUMN public.property_reports.reason IS 'Categoría del reporte: scam, fake_images, unrealistic_price, wrong_location, not_available, false_info, duplicate, other';
COMMENT ON COLUMN public.property_reports.status IS 'Estado: PENDING, UNDER_REVIEW, RESOLVED, DISMISSED';
COMMENT ON COLUMN public.property_reports.action_taken IS 'Acción tomada por admin: approved, property_removed, user_warned, dismissed';
