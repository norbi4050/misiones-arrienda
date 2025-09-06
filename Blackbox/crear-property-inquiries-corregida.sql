-- =====================================================
-- CORRECCIÓN ESPECÍFICA: TABLA PROPERTY_INQUIRIES
-- =====================================================
-- Fecha: 2025-01-27
-- Problema: Errores de sintaxis y referencias incorrectas
-- Solución: Script SQL corregido específicamente
-- =====================================================

-- PASO 1: CREAR TABLA PROPERTY_INQUIRIES (CORREGIDA)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.property_inquiries (
  id TEXT PRIMARY KEY DEFAULT (gen_random_uuid())::text,
  property_id TEXT NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  inquirer_user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  message TEXT,
  contact_phone TEXT,
  contact_email TEXT,
  preferred_contact TEXT CHECK (preferred_contact IN ('phone', 'email', 'whatsapp')),
  visit_date DATE,
  visit_time TIME,
  budget_range TEXT,
  move_in_date DATE,
  family_size INTEGER,
  pets BOOLEAN DEFAULT false,
  employment_status TEXT,
  monthly_income NUMERIC,
  inquiry_references TEXT,
  additional_notes TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'contacted', 'scheduled', 'visited', 'interested', 'not_interested', 'closed')),
  agent_notes TEXT,
  follow_up_date DATE,
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  source TEXT DEFAULT 'web' CHECK (source IN ('web', 'phone', 'email', 'referral', 'social_media')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- PASO 2: CORREGIR COLUMNAS EN TABLA AGENTS
-- =====================================================
ALTER TABLE public.agents 
ADD COLUMN IF NOT EXISTS user_id TEXT REFERENCES public.users(id) ON DELETE CASCADE;

-- PASO 3: CORREGIR COLUMNAS EN TABLA CONVERSATIONS
-- =====================================================
ALTER TABLE public.conversations 
ADD COLUMN IF NOT EXISTS participant_1 TEXT REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE public.conversations 
ADD COLUMN IF NOT EXISTS participant_2 TEXT REFERENCES public.users(id) ON DELETE CASCADE;

-- PASO 4: CORREGIR COLUMNAS EN TABLA PROPERTIES
-- =====================================================
ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS area_m2 NUMERIC;

-- PASO 5: CREAR ÍNDICES PARA PROPERTY_INQUIRIES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_property_inquiries_property_id ON public.property_inquiries(property_id);
CREATE INDEX IF NOT EXISTS idx_property_inquiries_inquirer_user_id ON public.property_inquiries(inquirer_user_id);
CREATE INDEX IF NOT EXISTS idx_property_inquiries_status ON public.property_inquiries(status);
CREATE INDEX IF NOT EXISTS idx_property_inquiries_created_at ON public.property_inquiries(created_at);
CREATE INDEX IF NOT EXISTS idx_property_inquiries_priority ON public.property_inquiries(priority);

-- PASO 6: CREAR POLÍTICAS RLS PARA PROPERTY_INQUIRIES
-- =====================================================
ALTER TABLE public.property_inquiries ENABLE ROW LEVEL SECURITY;

-- Política: Los usuarios pueden ver sus propias consultas
CREATE POLICY "Users can view own inquiries" ON public.property_inquiries
FOR SELECT USING ((select auth.uid())::text = inquirer_user_id);

-- Política: Los propietarios pueden ver consultas de sus propiedades
CREATE POLICY "Property owners can view inquiries" ON public.property_inquiries
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.properties 
    WHERE properties.id = property_inquiries.property_id 
    AND properties.user_id = (select auth.uid())::text
  )
);

-- Política: Los usuarios pueden crear consultas
CREATE POLICY "Users can create inquiries" ON public.property_inquiries
FOR INSERT WITH CHECK ((select auth.uid())::text = inquirer_user_id);

-- Política: Los usuarios pueden actualizar sus propias consultas
CREATE POLICY "Users can update own inquiries" ON public.property_inquiries
FOR UPDATE USING ((select auth.uid())::text = inquirer_user_id);

-- Política: Los propietarios pueden actualizar consultas de sus propiedades
CREATE POLICY "Property owners can update inquiries" ON public.property_inquiries
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.properties 
    WHERE properties.id = property_inquiries.property_id 
    AND properties.user_id = (select auth.uid())::text
  )
);

-- PASO 7: INSERTAR DATOS DE PRUEBA PARA PROPERTY_INQUIRIES
-- =====================================================
INSERT INTO public.property_inquiries (
  property_id, inquirer_user_id, message, contact_phone, contact_email,
  preferred_contact, budget_range, family_size, status, priority
) VALUES 
(
  (SELECT id FROM public.properties LIMIT 1),
  '6403f9d2-e846-4c70-87e0-e051127d9500',
  'Estoy interesado en esta propiedad. ¿Podríamos coordinar una visita?',
  '+54 376 123-4567',
  'consulta@ejemplo.com',
  'whatsapp',
  '50000-80000',
  3,
  'pending',
  'normal'
),
(
  (SELECT id FROM public.properties LIMIT 1),
  '6403f9d2-e846-4c70-87e0-e051127d9500',
  'Me gustaría más información sobre los servicios incluidos.',
  '+54 376 987-6543',
  'info@ejemplo.com',
  'email',
  '60000-90000',
  2,
  'contacted',
  'high'
);

-- PASO 8: CREAR TRIGGER PARA UPDATED_AT
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_property_inquiries_updated_at 
BEFORE UPDATE ON public.property_inquiries 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- PASO 9: VERIFICACIÓN FINAL
-- =====================================================
SELECT 'Tabla property_inquiries creada exitosamente' as resultado;
SELECT 'Columnas agregadas a otras tablas' as resultado;
SELECT 'Índices creados correctamente' as resultado;
SELECT 'Políticas RLS configuradas' as resultado;
SELECT 'Datos de prueba insertados' as resultado;
SELECT 'Triggers configurados' as resultado;

-- Verificar que la tabla existe y tiene datos
SELECT 'Verificación final:', COUNT(*) as total_inquiries FROM public.property_inquiries;
