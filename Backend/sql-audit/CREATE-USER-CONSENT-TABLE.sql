-- Crear tabla user_consent para logging de consentimiento legal
-- PostgreSQL (Supabase)

CREATE TABLE IF NOT EXISTS public.user_consent (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  policy_version TEXT NOT NULL,
  accepted_terms BOOLEAN NOT NULL,
  accepted_privacy BOOLEAN NOT NULL,
  ip TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Crear índice para consultas por user_id
CREATE INDEX IF NOT EXISTS idx_user_consent_user_id ON public.user_consent(user_id);

-- Crear índice para consultas por fecha
CREATE INDEX IF NOT EXISTS idx_user_consent_created_at ON public.user_consent(created_at);

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.user_consent ENABLE ROW LEVEL SECURITY;

-- Política RLS: Los usuarios solo pueden ver sus propios registros de consentimiento
CREATE POLICY "Users can view own consent records" ON public.user_consent
  FOR SELECT USING (auth.uid()::uuid = user_id);

-- Política RLS: Los usuarios pueden insertar sus propios registros de consentimiento
CREATE POLICY "Users can insert own consent records" ON public.user_consent
  FOR INSERT WITH CHECK (auth.uid()::uuid = user_id);

-- Política RLS: Solo admins pueden ver todos los registros (opcional)
-- CREATE POLICY "Admins can view all consent records" ON public.user_consent
--   FOR ALL USING (
--     EXISTS (
--       SELECT 1 FROM auth.users 
--       WHERE auth.users.id = auth.uid() 
--       AND auth.users.raw_app_meta_data->>'role' = 'admin'
--     )
--   );

-- Comentarios para documentación
COMMENT ON TABLE public.user_consent IS 'Registro de consentimiento legal de usuarios para Términos y Privacidad';
COMMENT ON COLUMN public.user_consent.user_id IS 'ID del usuario que otorgó el consentimiento';
COMMENT ON COLUMN public.user_consent.policy_version IS 'Versión de la política aceptada (ej: 2025-01-01)';
COMMENT ON COLUMN public.user_consent.accepted_terms IS 'Si el usuario aceptó los Términos y Condiciones';
COMMENT ON COLUMN public.user_consent.accepted_privacy IS 'Si el usuario aceptó la Política de Privacidad';
COMMENT ON COLUMN public.user_consent.ip IS 'Dirección IP del usuario al momento del consentimiento';
COMMENT ON COLUMN public.user_consent.user_agent IS 'User Agent del navegador del usuario';
COMMENT ON COLUMN public.user_consent.created_at IS 'Timestamp del consentimiento';
