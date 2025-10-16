-- ============================================================================
-- SCRIPT DE RECONSTRUCCIÓN COMPLETA DE SUPABASE
-- Proyecto: Misiones Arrienda
-- Fecha: 15 de Enero 2025
-- Versión: 1.0
-- ============================================================================
-- 
-- ADVERTENCIA: Este script reconstruye COMPLETAMENTE la estructura de usuarios
-- Ejecutar SOLO después de hacer backup completo de la base de datos
--
-- PASOS PREVIOS OBLIGATORIOS:
-- 1. Hacer backup completo: pg_dump -h [host] -U postgres -d postgres > backup_$(date +%Y%m%d).sql
-- 2. Exportar datos actuales de user_profiles a CSV
-- 3. Confirmar con el equipo que se puede proceder
--
-- ============================================================================

-- ============================================================================
-- PARTE 1: LIMPIEZA Y PREPARACIÓN
-- ============================================================================

-- Deshabilitar triggers temporalmente
SET session_replication_role = 'replica';

-- Eliminar tablas existentes en orden correcto (respetando FKs)
DROP TABLE IF EXISTS public."Report" CASCADE;
DROP TABLE IF EXISTS public."MessageAttachment" CASCADE;
DROP TABLE IF EXISTS public."Message" CASCADE;
DROP TABLE IF EXISTS public."Conversation" CASCADE;
DROP TABLE IF EXISTS public."Like" CASCADE;
DROP TABLE IF EXISTS public."Room" CASCADE;
DROP TABLE IF EXISTS public."UserProfile" CASCADE;
DROP TABLE IF EXISTS public."User" CASCADE;

-- Eliminar tabla incorrecta
DROP TABLE IF EXISTS public.user_profiles CASCADE;

-- Habilitar triggers nuevamente
SET session_replication_role = 'origin';

-- ============================================================================
-- PARTE 2: CREAR TABLA USER (Sincronizada con auth.users)
-- ============================================================================

CREATE TABLE public."User" (
    id TEXT PRIMARY KEY,  -- Sincronizado con auth.users.id
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT NOT NULL,
    password TEXT NOT NULL,  -- Hash, manejado por Supabase Auth
    avatar TEXT,
    bio TEXT,
    occupation TEXT,
    age INTEGER,
    verified BOOLEAN DEFAULT FALSE,
    "emailVerified" BOOLEAN DEFAULT FALSE,
    "verificationToken" TEXT,
    rating FLOAT DEFAULT 0,
    "reviewCount" INTEGER DEFAULT 0,
    
    -- Campos de tipo de usuario
    "userType" TEXT,  -- 'inquilino', 'dueno_directo', 'inmobiliaria'
    "companyName" TEXT,  -- Solo para inmobiliarias
    "licenseNumber" TEXT,  -- Solo para inmobiliarias
    "propertyCount" TEXT,  -- Solo para dueños directos
    
    -- Campos de presencia/estado online
    is_online BOOLEAN DEFAULT FALSE,
    last_seen TIMESTAMPTZ,
    last_activity TIMESTAMPTZ DEFAULT NOW(),
    
    -- Auditoría
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para User
CREATE INDEX idx_user_is_online ON public."User"(is_online, last_seen);
CREATE INDEX idx_user_email ON public."User"(email);
CREATE INDEX idx_user_type ON public."User"("userType");

-- Comentarios
COMMENT ON TABLE public."User" IS 'Tabla principal de usuarios, sincronizada con auth.users';
COMMENT ON COLUMN public."User".id IS 'UUID del usuario de auth.users';
COMMENT ON COLUMN public."User"."userType" IS 'Tipo: inquilino, dueno_directo, inmobiliaria';

-- ============================================================================
-- PARTE 3: CREAR TABLA USERPROFILE (Módulo Comunidad)
-- ============================================================================

CREATE TABLE public."UserProfile" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    
    -- Vinculación con User (FK a auth.users)
    "userId" TEXT UNIQUE NOT NULL,
    
    -- Información básica del perfil
    role TEXT DEFAULT 'BUSCO' NOT NULL,  -- 'BUSCO', 'OFREZCO', 'TENANT', 'OWNER', 'AGENCY'
    city TEXT NOT NULL,
    neighborhood TEXT,
    "budgetMin" INTEGER NOT NULL,  -- Presupuesto mínimo en ARS
    "budgetMax" INTEGER NOT NULL,  -- Presupuesto máximo en ARS
    bio TEXT,
    photos TEXT[] DEFAULT ARRAY[]::TEXT[],  -- Array de URLs de fotos
    
    -- Preferencias de convivencia
    age INTEGER,
    "petPref" TEXT DEFAULT 'INDIFERENTE',  -- 'SI_PET', 'NO_PET', 'INDIFERENTE'
    "smokePref" TEXT DEFAULT 'INDIFERENTE',  -- 'FUMADOR', 'NO_FUMADOR', 'INDIFERENTE'
    diet TEXT DEFAULT 'NINGUNA',  -- 'NINGUNA', 'VEGETARIANO', 'VEGANO', 'CELIACO', 'OTRO'
    "scheduleNotes" TEXT,  -- horarios de trabajo/estudio
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],  -- ['limpio', 'sociable', 'gym', 'gamer']
    
    -- Configuración
    "acceptsMessages" BOOLEAN DEFAULT TRUE,
    "highlightedUntil" TIMESTAMPTZ,
    "isSuspended" BOOLEAN DEFAULT FALSE,
    
    -- Campos para sistema de caducidad
    "expiresAt" TIMESTAMPTZ,
    "isPaid" BOOLEAN DEFAULT FALSE,
    
    -- Campos de presencia/estado online
    is_online BOOLEAN DEFAULT FALSE,
    last_seen TIMESTAMPTZ,
    last_activity TIMESTAMPTZ DEFAULT NOW(),
    
    -- Auditoría
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ DEFAULT NOW(),
    
    -- Foreign Key
    CONSTRAINT fk_userprofile_user FOREIGN KEY ("userId") 
        REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Índices para UserProfile
CREATE INDEX idx_userprofile_userid ON public."UserProfile"("userId");
CREATE INDEX idx_userprofile_role_city ON public."UserProfile"(role, city);
CREATE INDEX idx_userprofile_budget ON public."UserProfile"("budgetMin", "budgetMax");
CREATE INDEX idx_userprofile_highlighted ON public."UserProfile"("highlightedUntil");
CREATE INDEX idx_userprofile_suspended ON public."UserProfile"("isSuspended");
CREATE INDEX idx_userprofile_online ON public."UserProfile"(is_online, last_seen);

-- Comentarios
COMMENT ON TABLE public."UserProfile" IS 'Perfiles de comunidad para módulo flatmates/roommates';
COMMENT ON COLUMN public."UserProfile".role IS 'Rol en comunidad: BUSCO, OFREZCO, TENANT, OWNER, AGENCY';

-- ============================================================================
-- PARTE 4: CREAR TABLA ROOM (Habitaciones)
-- ============================================================================

CREATE TABLE public."Room" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    
    -- Relación con el perfil propietario
    "ownerId" TEXT NOT NULL,
    
    -- Información de la habitación
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    price INTEGER NOT NULL,  -- Precio mensual en ARS
    city TEXT NOT NULL,
    neighborhood TEXT,
    type TEXT NOT NULL,  -- 'PRIVADA', 'COMPARTIDA', 'ESTUDIO'
    amenities TEXT[] DEFAULT ARRAY[]::TEXT[],  -- ['wifi', 'cochera', 'patio']
    photos TEXT[] DEFAULT ARRAY[]::TEXT[],
    rules TEXT,  -- 'no fiestas', etc.
    
    -- Estado
    "isActive" BOOLEAN DEFAULT TRUE,
    
    -- Auditoría
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ DEFAULT NOW(),
    
    -- Foreign Key
    CONSTRAINT fk_room_owner FOREIGN KEY ("ownerId") 
        REFERENCES public."UserProfile"(id) ON DELETE CASCADE
);

-- Índices para Room
CREATE INDEX idx_room_owner ON public."Room"("ownerId");
CREATE INDEX idx_room_city_type ON public."Room"(city, type);
CREATE INDEX idx_room_price ON public."Room"(price);
CREATE INDEX idx_room_active ON public."Room"("isActive");

-- ============================================================================
-- PARTE 5: CREAR TABLA LIKE (Sistema de matches)
-- ============================================================================

CREATE TABLE public."Like" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    
    -- Relaciones
    "fromId" TEXT NOT NULL,
    "toId" TEXT NOT NULL,
    
    -- Auditoría
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    
    -- Foreign Keys
    CONSTRAINT fk_like_from FOREIGN KEY ("fromId") 
        REFERENCES public."UserProfile"(id) ON DELETE CASCADE,
    CONSTRAINT fk_like_to FOREIGN KEY ("toId") 
        REFERENCES public."UserProfile"(id) ON DELETE CASCADE,
    
    -- Constraint único
    CONSTRAINT unique_like UNIQUE ("fromId", "toId")
);

-- Índices para Like
CREATE INDEX idx_like_from ON public."Like"("fromId");
CREATE INDEX idx_like_to ON public."Like"("toId");

-- ============================================================================
-- PARTE 6: CREAR TABLA CONVERSATION (Mensajes)
-- ============================================================================

CREATE TABLE public."Conversation" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    
    -- Participantes (siempre 2 en MVP)
    "aId" TEXT NOT NULL,
    "bId" TEXT NOT NULL,
    
    -- Estado
    "isActive" BOOLEAN DEFAULT TRUE,
    "lastMessageAt" TIMESTAMPTZ,
    
    -- Auditoría
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ DEFAULT NOW(),
    
    -- Foreign Keys
    CONSTRAINT fk_conversation_a FOREIGN KEY ("aId") 
        REFERENCES public."UserProfile"(id) ON DELETE CASCADE,
    CONSTRAINT fk_conversation_b FOREIGN KEY ("bId") 
        REFERENCES public."UserProfile"(id) ON DELETE CASCADE,
    
    -- Constraint único
    CONSTRAINT unique_conversation UNIQUE ("aId", "bId")
);

-- Índices para Conversation
CREATE INDEX idx_conversation_a ON public."Conversation"("aId", "isActive");
CREATE INDEX idx_conversation_b ON public."Conversation"("bId", "isActive");
CREATE INDEX idx_conversation_last_message ON public."Conversation"("lastMessageAt");

-- ============================================================================
-- PARTE 7: CREAR TABLA MESSAGE (Mensajes individuales)
-- ============================================================================

CREATE TABLE public."Message" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    
    -- Relaciones
    "conversationId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    
    -- Contenido
    body TEXT NOT NULL,
    "isRead" BOOLEAN DEFAULT FALSE,
    
    -- Auditoría
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    
    -- Foreign Keys
    CONSTRAINT fk_message_conversation FOREIGN KEY ("conversationId") 
        REFERENCES public."Conversation"(id) ON DELETE CASCADE,
    CONSTRAINT fk_message_sender FOREIGN KEY ("senderId") 
        REFERENCES public."UserProfile"(id) ON DELETE CASCADE
);

-- Índices para Message
CREATE INDEX idx_message_conversation ON public."Message"("conversationId", "createdAt");
CREATE INDEX idx_message_sender ON public."Message"("senderId");
CREATE INDEX idx_message_read ON public."Message"("isRead");

-- ============================================================================
-- PARTE 8: CREAR TABLA MESSAGEATTACHMENT (Adjuntos V2.0)
-- ============================================================================

CREATE TABLE public."MessageAttachment" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    
    -- Relación con mensaje (REQUERIDO)
    message_id TEXT NOT NULL,
    
    -- Información del archivo
    file_name TEXT NOT NULL,
    file_size INTEGER NOT NULL,  -- Bytes
    mime_type TEXT NOT NULL,
    
    -- Storage en Supabase
    storage_path TEXT NOT NULL,  -- {conversationId}/{messageId}/{filename}
    storage_url TEXT NOT NULL,   -- URL firmada
    
    -- Metadata para imágenes (opcional)
    width INTEGER,
    height INTEGER,
    
    -- Auditoría y seguridad
    uploaded_by TEXT NOT NULL,  -- userId que subió el archivo
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Foreign Key
    CONSTRAINT fk_attachment_message FOREIGN KEY (message_id) 
        REFERENCES public."Message"(id) ON DELETE CASCADE
);

-- Índices para MessageAttachment
CREATE INDEX idx_attachment_message ON public."MessageAttachment"(message_id);
CREATE INDEX idx_attachment_uploader ON public."MessageAttachment"(uploaded_by);
CREATE INDEX idx_attachment_created ON public."MessageAttachment"(created_at);

-- ============================================================================
-- PARTE 9: CREAR TABLA REPORT (Sistema de reportes)
-- ============================================================================

CREATE TABLE public."Report" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    
    -- Relación con el perfil reportado
    "targetId" TEXT NOT NULL,
    
    -- Información del reporte
    reason TEXT NOT NULL,  -- 'spam', 'contenido_inapropiado', 'acoso'
    details TEXT,
    "reporterEmail" TEXT,  -- Email del reportador (puede ser anónimo)
    
    -- Estado
    status TEXT DEFAULT 'PENDING',  -- 'PENDING', 'REVIEWED', 'RESOLVED', 'DISMISSED'
    "adminNotes" TEXT,
    
    -- Auditoría
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ DEFAULT NOW(),
    
    -- Foreign Key
    CONSTRAINT fk_report_target FOREIGN KEY ("targetId") 
        REFERENCES public."UserProfile"(id) ON DELETE CASCADE
);

-- Índices para Report
CREATE INDEX idx_report_target ON public."Report"("targetId", status);
CREATE INDEX idx_report_status ON public."Report"(status, "createdAt");

-- ============================================================================
-- PARTE 10: TRIGGERS Y FUNCIONES
-- ============================================================================

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger a todas las tablas relevantes
CREATE TRIGGER update_user_updated_at
    BEFORE UPDATE ON public."User"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_userprofile_updated_at
    BEFORE UPDATE ON public."UserProfile"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_room_updated_at
    BEFORE UPDATE ON public."Room"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversation_updated_at
    BEFORE UPDATE ON public."Conversation"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_report_updated_at
    BEFORE UPDATE ON public."Report"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Función para sincronizar User con auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public."User" (
        id,
        email,
        name,
        phone,
        "emailVerified",
        "createdAt"
    )
    VALUES (
        NEW.id::text,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
        COALESCE(NEW.raw_user_meta_data->>'phone', ''),
        NEW.email_confirmed_at IS NOT NULL,
        NEW.created_at
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger en auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Función para actualizar lastMessageAt en Conversation
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public."Conversation"
    SET "lastMessageAt" = NEW."createdAt"
    WHERE id = NEW."conversationId";
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar lastMessageAt
CREATE TRIGGER update_conversation_last_message_trigger
    AFTER INSERT ON public."Message"
    FOR EACH ROW
    EXECUTE FUNCTION update_conversation_last_message();

-- ============================================================================
-- PARTE 11: ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- RLS para User
ALTER TABLE public."User" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS user_select ON public."User";
CREATE POLICY user_select ON public."User"
FOR SELECT
USING (
    id = auth.uid()::text OR  -- Tu propio perfil
    verified = true           -- O perfiles verificados (públicos)
);

DROP POLICY IF EXISTS user_insert ON public."User";
CREATE POLICY user_insert ON public."User"
FOR INSERT
WITH CHECK (id = auth.uid()::text);

DROP POLICY IF EXISTS user_update ON public."User";
CREATE POLICY user_update ON public."User"
FOR UPDATE
USING (id = auth.uid()::text);

-- RLS para UserProfile
ALTER TABLE public."UserProfile" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS userprofile_select ON public."UserProfile";
CREATE POLICY userprofile_select ON public."UserProfile"
FOR SELECT
USING (
    "userId" = auth.uid()::text OR  -- Tu propio perfil
    ("acceptsMessages" = true AND "isSuspended" = false)  -- O perfiles públicos activos
);

DROP POLICY IF EXISTS userprofile_insert ON public."UserProfile";
CREATE POLICY userprofile_insert ON public."UserProfile"
FOR INSERT
WITH CHECK ("userId" = auth.uid()::text);

DROP POLICY IF EXISTS userprofile_update ON public."UserProfile";
CREATE POLICY userprofile_update ON public."UserProfile"
FOR UPDATE
USING ("userId" = auth.uid()::text);

-- RLS para Room
ALTER TABLE public."Room" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS room_select ON public."Room";
CREATE POLICY room_select ON public."Room"
FOR SELECT
USING ("isActive" = true OR "ownerId" IN (
    SELECT id FROM public."UserProfile" WHERE "userId" = auth.uid()::text
));

DROP POLICY IF EXISTS room_insert ON public."Room";
CREATE POLICY room_insert ON public."Room"
FOR INSERT
WITH CHECK ("ownerId" IN (
    SELECT id FROM public."UserProfile" WHERE "userId" = auth.uid()::text
));

DROP POLICY IF EXISTS room_update ON public."Room";
CREATE POLICY room_update ON public."Room"
FOR UPDATE
USING ("ownerId" IN (
    SELECT id FROM public."UserProfile" WHERE "userId" = auth.uid()::text
));

-- RLS para Conversation
ALTER TABLE public."Conversation" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS conversation_select ON public."Conversation";
CREATE POLICY conversation_select ON public."Conversation"
FOR SELECT
USING (
    "aId" IN (SELECT id FROM public."UserProfile" WHERE "userId" = auth.uid()::text) OR
    "bId" IN (SELECT id FROM public."UserProfile" WHERE "userId" = auth.uid()::text)
);

DROP POLICY IF EXISTS conversation_insert ON public."Conversation";
CREATE POLICY conversation_insert ON public."Conversation"
FOR INSERT
WITH CHECK (
    "aId" IN (SELECT id FROM public."UserProfile" WHERE "userId" = auth.uid()::text) OR
    "bId" IN (SELECT id FROM public."UserProfile" WHERE "userId" = auth.uid()::text)
);

-- RLS para Message
ALTER TABLE public."Message" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS message_select ON public."Message";
CREATE POLICY message_select ON public."Message"
FOR SELECT
USING (
    "conversationId" IN (
        SELECT id FROM public."Conversation"
        WHERE "aId" IN (SELECT id FROM public."UserProfile" WHERE "userId" = auth.uid()::text)
           OR "bId" IN (SELECT id FROM public."UserProfile" WHERE "userId" = auth.uid()::text)
    )
);

DROP POLICY IF EXISTS message_insert ON public."Message";
CREATE POLICY message_insert ON public."Message"
FOR INSERT
WITH CHECK (
    "senderId" IN (SELECT id FROM public."UserProfile" WHERE "userId" = auth.uid()::text) AND
    "conversationId" IN (
        SELECT id FROM public."Conversation"
        WHERE "aId" IN (SELECT id FROM public."UserProfile" WHERE "userId" = auth.uid()::text)
           OR "bId" IN (SELECT id FROM public."UserProfile" WHERE "userId" = auth.uid()::text)
    )
);

-- RLS para MessageAttachment
ALTER TABLE public."MessageAttachment" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS attachment_select ON public."MessageAttachment";
CREATE POLICY attachment_select ON public."MessageAttachment"
FOR SELECT
USING (
    message_id IN (
        SELECT id FROM public."Message"
        WHERE "conversationId" IN (
            SELECT id FROM public."Conversation"
            WHERE "aId" IN (SELECT id FROM public."UserProfile" WHERE "userId" = auth.uid()::text)
               OR "bId" IN (SELECT id FROM public."UserProfile" WHERE "userId" = auth.uid()::text)
        )
    )
);

DROP POLICY IF EXISTS attachment_insert ON public."MessageAttachment";
CREATE POLICY attachment_insert ON public."MessageAttachment"
FOR INSERT
WITH CHECK (
    uploaded_by = auth.uid()::text AND
    message_id IN (
        SELECT id FROM public."Message"
        WHERE "senderId" IN (SELECT id FROM public."UserProfile" WHERE "userId" = auth.uid()::text)
    )
);

-- ============================================================================
-- PARTE 12: MIGRAR DATOS EXISTENTES (SI APLICA)
-- ============================================================================

-- Si hay datos en la tabla antigua user_profiles, migrarlos
-- NOTA: Ajustar según los datos reales que tengas

-- Ejemplo de migración (comentado por seguridad):
/*
INSERT INTO public."UserProfile" (
    "userId",
    role,
    city,
    "budgetMin",
    "budgetMax",
    "createdAt"
)
SELECT 
    id::text,
    'BUSCO',  -- Valor por defecto
    'Posadas',  -- Valor por defecto
    0,  -- Valor por defecto
    100000,  -- Valor por defecto
    NOW()
FROM public.user_profiles
ON CONFLICT ("userId") DO NOTHING;
*/

-- ============================================================================
-- PARTE 13: VERIFICACIÓN
-- ============================================================================

-- Verificar que todas las tablas se crearon correctamente
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables
WHERE schemaname = 'public'
    AND tablename IN ('User', 'UserProfile', 'Room', 'Like', 'Conversation', 'Message', 'MessageAttachment', 'Report')
ORDER BY tablename;

-- Verificar índices
SELECT 
    schemaname,
    tablename,
    indexname
FROM pg_indexes
WHERE schemaname = 'public'
    AND tablename IN ('User', 'UserProfile', 'Room', 'Like', 'Conversation', 'Message', 'MessageAttachment', 'Report')
ORDER BY tablename, indexname;

-- Verificar políticas RLS
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    cmd
FROM pg_policies
WHERE schemaname = 'public'
    AND tablename IN ('User', 'UserProfile', 'Room', 'Conversation', 'Message', 'MessageAttachment')
ORDER BY tablename, policyname;

-- Verificar triggers
SELECT 
    trigger_schema,
    trigger_name,
    event_object_table,
    action_timing,
    event_manipulation
FROM information_schema.triggers
WHERE trigger_schema = 'public'
    AND event_object_table IN ('User', 'UserProfile', 'Room', 'Conversation', 'Message', 'Report')
ORDER BY event_object_table, trigger_name;

-- ============================================================================
-- FIN DEL SCRIPT
-- ============================================================================

-- Mensaje de confirmación
DO $$
BEGIN
    RAISE NOTICE '✅ Script de reconstrucción completado exitosamente';
    RAISE NOTICE '📋 Próximos pasos:';
    RAISE NOTICE '1. Verificar que todas las tablas se crearon correctamente';
    RAISE NOTICE '2. Migrar datos de user_profiles si es necesario';
    RAISE NOTICE '3. Configurar Storage Buckets (ver documento de auditoría)';
    RAISE NOTICE '4. Probar autenticación y creación de perfiles';
    RAISE NOTICE '5. Actualizar Prisma schema si es necesario';
END $$;
