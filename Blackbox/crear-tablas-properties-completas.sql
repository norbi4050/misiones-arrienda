-- =====================================================
-- SOLUCIÓN ERROR 400 PROPERTIES - CREAR TABLAS FALTANTES
-- =====================================================
-- Fecha: 2025-01-27
-- Problema: Tabla properties no existe, causando error 400
-- Solución: Crear estructura completa de tablas del proyecto
-- =====================================================

-- PASO 1: CREAR TABLA PROPERTIES
-- =====================================================
CREATE TABLE IF NOT EXISTS public.properties (
  id TEXT PRIMARY KEY DEFAULT (gen_random_uuid())::text,
  title TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL,
  currency TEXT DEFAULT 'ARS',
  property_type TEXT NOT NULL CHECK (property_type IN ('casa', 'departamento', 'local', 'oficina', 'terreno')),
  bedrooms INTEGER DEFAULT 0,
  bathrooms INTEGER DEFAULT 0,
  area_m2 NUMERIC,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  province TEXT DEFAULT 'Misiones',
  country TEXT DEFAULT 'Argentina',
  latitude NUMERIC,
  longitude NUMERIC,
  user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'rented', 'sold')),
  featured BOOLEAN DEFAULT false,
  images TEXT[],
  amenities TEXT[],
  contact_phone TEXT,
  contact_email TEXT,
  available_from DATE,
  lease_duration INTEGER, -- meses
  deposit_amount NUMERIC,
  utilities_included BOOLEAN DEFAULT false,
  pets_allowed BOOLEAN DEFAULT false,
  furnished BOOLEAN DEFAULT false,
  parking_spaces INTEGER DEFAULT 0,
  floor_number INTEGER,
  total_floors INTEGER,
  year_built INTEGER,
  condition TEXT CHECK (condition IN ('excellent', 'good', 'fair', 'needs_renovation')),
  orientation TEXT,
  balcony BOOLEAN DEFAULT false,
  garden BOOLEAN DEFAULT false,
  pool BOOLEAN DEFAULT false,
  security BOOLEAN DEFAULT false,
  elevator BOOLEAN DEFAULT false,
  air_conditioning BOOLEAN DEFAULT false,
  heating BOOLEAN DEFAULT false,
  internet BOOLEAN DEFAULT false,
  cable_tv BOOLEAN DEFAULT false,
  laundry BOOLEAN DEFAULT false,
  gym BOOLEAN DEFAULT false,
  views TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- PASO 2: CREAR TABLA PROPERTY_INQUIRIES
-- =====================================================
CREATE TABLE IF NOT EXISTS public.property_inquiries (
  id TEXT PRIMARY KEY DEFAULT (gen_random_uuid())::text,
  property_id TEXT NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
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
  references TEXT,
  additional_notes TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'contacted', 'scheduled', 'visited', 'interested', 'not_interested', 'closed')),
  agent_notes TEXT,
  follow_up_date DATE,
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  source TEXT DEFAULT 'web' CHECK (source IN ('web', 'phone', 'email', 'referral', 'social_media')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- PASO 3: CREAR TABLA FAVORITES
-- =====================================================
CREATE TABLE IF NOT EXISTS public.favorites (
  id TEXT PRIMARY KEY DEFAULT (gen_random_uuid())::text,
  user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  property_id TEXT NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, property_id)
);

-- PASO 4: CREAR TABLA AGENTS (para inmobiliarias)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.agents (
  id TEXT PRIMARY KEY DEFAULT (gen_random_uuid())::text,
  user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  company_name TEXT,
  license_number TEXT,
  specialization TEXT[],
  areas_served TEXT[],
  languages TEXT[],
  experience_years INTEGER,
  rating REAL DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  commission_rate NUMERIC,
  bio TEXT,
  website TEXT,
  social_media JSONB,
  certifications TEXT[],
  awards TEXT[],
  active BOOLEAN DEFAULT true,
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- PASO 5: CREAR TABLA CONVERSATIONS (para chat)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.conversations (
  id TEXT PRIMARY KEY DEFAULT (gen_random_uuid())::text,
  property_id TEXT REFERENCES public.properties(id) ON DELETE CASCADE,
  inquiry_id TEXT REFERENCES public.property_inquiries(id) ON DELETE CASCADE,
  participant_1 TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  participant_2 TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'blocked')),
  last_message_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(participant_1, participant_2, property_id)
);

-- PASO 6: CREAR TABLA MESSAGES (para chat)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.messages (
  id TEXT PRIMARY KEY DEFAULT (gen_random_uuid())::text,
  conversation_id TEXT NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'location', 'contact')),
  file_url TEXT,
  file_name TEXT,
  file_size INTEGER,
  read_at TIMESTAMPTZ,
  edited_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  reply_to TEXT REFERENCES public.messages(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- PASO 7: CREAR ÍNDICES PARA PERFORMANCE
-- =====================================================

-- Índices para properties
CREATE INDEX IF NOT EXISTS idx_properties_user_id ON public.properties(user_id);
CREATE INDEX IF NOT EXISTS idx_properties_city ON public.properties(city);
CREATE INDEX IF NOT EXISTS idx_properties_property_type ON public.properties(property_type);
CREATE INDEX IF NOT EXISTS idx_properties_price ON public.properties(price);
CREATE INDEX IF NOT EXISTS idx_properties_status ON public.properties(status);
CREATE INDEX IF NOT EXISTS idx_properties_featured ON public.properties(featured);
CREATE INDEX IF NOT EXISTS idx_properties_created_at ON public.properties(created_at);
CREATE INDEX IF NOT EXISTS idx_properties_location ON public.properties(latitude, longitude);

-- Índices para property_inquiries
CREATE INDEX IF NOT EXISTS idx_property_inquiries_property_id ON public.property_inquiries(property_id);
CREATE INDEX IF NOT EXISTS idx_property_inquiries_user_id ON public.property_inquiries(user_id);
CREATE INDEX IF NOT EXISTS idx_property_inquiries_status ON public.property_inquiries(status);
CREATE INDEX IF NOT EXISTS idx_property_inquiries_created_at ON public.property_inquiries(created_at);

-- Índices para favorites
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON public.favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_property_id ON public.favorites(property_id);

-- Índices para agents
CREATE INDEX IF NOT EXISTS idx_agents_user_id ON public.agents(user_id);
CREATE INDEX IF NOT EXISTS idx_agents_active ON public.agents(active);
CREATE INDEX IF NOT EXISTS idx_agents_verified ON public.agents(verified);

-- Índices para conversations
CREATE INDEX IF NOT EXISTS idx_conversations_participant_1 ON public.conversations(participant_1);
CREATE INDEX IF NOT EXISTS idx_conversations_participant_2 ON public.conversations(participant_2);
CREATE INDEX IF NOT EXISTS idx_conversations_property_id ON public.conversations(property_id);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message_at ON public.conversations(last_message_at);

-- Índices para messages
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at);

-- PASO 8: CREAR TRIGGERS PARA UPDATED_AT
-- =====================================================

-- Trigger para properties
CREATE TRIGGER set_updated_at_properties
    BEFORE UPDATE ON public.properties
    FOR EACH ROW
    EXECUTE FUNCTION handle_updated_at();

-- Trigger para property_inquiries
CREATE TRIGGER set_updated_at_property_inquiries
    BEFORE UPDATE ON public.property_inquiries
    FOR EACH ROW
    EXECUTE FUNCTION handle_updated_at();

-- Trigger para agents
CREATE TRIGGER set_updated_at_agents
    BEFORE UPDATE ON public.agents
    FOR EACH ROW
    EXECUTE FUNCTION handle_updated_at();

-- Trigger para conversations
CREATE TRIGGER set_updated_at_conversations
    BEFORE UPDATE ON public.conversations
    FOR EACH ROW
    EXECUTE FUNCTION handle_updated_at();

-- PASO 9: HABILITAR RLS EN TODAS LAS TABLAS
-- =====================================================

ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- PASO 10: CREAR POLÍTICAS RLS BÁSICAS
-- =====================================================

-- Políticas para properties
CREATE POLICY "Properties are viewable by everyone" ON public.properties
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own properties" ON public.properties
    FOR INSERT WITH CHECK ((select auth.uid())::text = user_id);

CREATE POLICY "Users can update their own properties" ON public.properties
    FOR UPDATE USING ((select auth.uid())::text = user_id);

CREATE POLICY "Users can delete their own properties" ON public.properties
    FOR DELETE USING ((select auth.uid())::text = user_id);

-- Políticas para property_inquiries
CREATE POLICY "Users can view inquiries for their properties" ON public.property_inquiries
    FOR SELECT USING (
        (select auth.uid())::text = user_id OR 
        (select auth.uid())::text IN (SELECT user_id FROM public.properties WHERE id = property_id)
    );

CREATE POLICY "Users can create inquiries" ON public.property_inquiries
    FOR INSERT WITH CHECK ((select auth.uid())::text = user_id);

CREATE POLICY "Users can update their own inquiries" ON public.property_inquiries
    FOR UPDATE USING ((select auth.uid())::text = user_id);

-- Políticas para favorites
CREATE POLICY "Users can manage their own favorites" ON public.favorites
    FOR ALL USING ((select auth.uid())::text = user_id);

-- Políticas para agents
CREATE POLICY "Agents are viewable by everyone" ON public.agents
    FOR SELECT USING (true);

CREATE POLICY "Users can manage their own agent profile" ON public.agents
    FOR ALL USING ((select auth.uid())::text = user_id);

-- Políticas para conversations
CREATE POLICY "Users can view their own conversations" ON public.conversations
    FOR SELECT USING (
        (select auth.uid())::text = participant_1 OR 
        (select auth.uid())::text = participant_2
    );

CREATE POLICY "Users can create conversations" ON public.conversations
    FOR INSERT WITH CHECK (
        (select auth.uid())::text = participant_1 OR 
        (select auth.uid())::text = participant_2
    );

-- Políticas para messages
CREATE POLICY "Users can view messages in their conversations" ON public.messages
    FOR SELECT USING (
        conversation_id IN (
            SELECT id FROM public.conversations 
            WHERE (select auth.uid())::text = participant_1 OR (select auth.uid())::text = participant_2
        )
    );

CREATE POLICY "Users can send messages in their conversations" ON public.messages
    FOR INSERT WITH CHECK (
        (select auth.uid())::text = sender_id AND
        conversation_id IN (
            SELECT id FROM public.conversations 
            WHERE (select auth.uid())::text = participant_1 OR (select auth.uid())::text = participant_2
        )
    );

-- PASO 11: INSERTAR DATOS DE PRUEBA
-- =====================================================

-- Insertar propiedades de prueba
INSERT INTO public.properties (
    id, title, description, price, property_type, bedrooms, bathrooms, 
    area_m2, address, city, user_id, status, contact_phone, contact_email
) VALUES 
(
    'prop-test-001',
    'Casa 3 dormitorios en Posadas Centro',
    'Hermosa casa familiar en el centro de Posadas, cerca de todos los servicios.',
    150000,
    'casa',
    3,
    2,
    120.5,
    'Av. Mitre 1234',
    'Posadas',
    '6403f9d2-e846-4c70-87e0-e051127d9500',
    'active',
    '+54 376 123456',
    'test@misionesarrienda.com'
),
(
    'prop-test-002',
    'Departamento 2 ambientes Oberá',
    'Moderno departamento en Oberá, ideal para pareja joven.',
    80000,
    'departamento',
    2,
    1,
    65.0,
    'Calle San Martín 567',
    'Oberá',
    '6403f9d2-e846-4c70-87e0-e051127d9500',
    'active',
    '+54 376 123456',
    'test@misionesarrienda.com'
)
ON CONFLICT (id) DO NOTHING;

-- Insertar consultas de prueba
INSERT INTO public.property_inquiries (
    id, property_id, user_id, message, contact_phone, contact_email, status
) VALUES 
(
    'inq-test-001',
    'prop-test-001',
    '6403f9d2-e846-4c70-87e0-e051127d9500',
    'Me interesa esta propiedad, ¿podríamos coordinar una visita?',
    '+54 376 987654',
    'inquilino@test.com',
    'pending'
)
ON CONFLICT (id) DO NOTHING;

-- VERIFICACIÓN FINAL
-- =====================================================
SELECT 'Tablas creadas exitosamente' as status;

-- Verificar que las tablas existen
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('properties', 'property_inquiries', 'favorites', 'agents', 'conversations', 'messages')
ORDER BY table_name;

-- Verificar datos de prueba
SELECT 'Propiedades de prueba:', COUNT(*) FROM public.properties;
SELECT 'Consultas de prueba:', COUNT(*) FROM public.property_inquiries;
