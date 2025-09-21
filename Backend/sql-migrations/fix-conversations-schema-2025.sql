-- =====================================================
-- MIGRACIÓN: Corregir esquema de conversaciones 2025
-- =====================================================

-- 1. Verificar estructura actual de la tabla conversations
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'conversations'
ORDER BY ordinal_position;

-- 2. Verificar claves foráneas existentes
SELECT
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name='conversations';

-- 3. Verificar si existe la tabla UserProfile
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_name = 'UserProfile'
);

-- 4. Si no existe UserProfile, crearla
CREATE TABLE IF NOT EXISTS "UserProfile" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL DEFAULT 'BUSCO',
    city TEXT NOT NULL,
    neighborhood TEXT,
    "budgetMin" INTEGER NOT NULL,
    "budgetMax" INTEGER NOT NULL,
    bio TEXT,
    photos TEXT[] DEFAULT '{}',
    age INTEGER,
    "petPref" TEXT DEFAULT 'INDIFERENTE',
    "smokePref" TEXT DEFAULT 'INDIFERENTE',
    diet TEXT DEFAULT 'NINGUNA',
    "scheduleNotes" TEXT,
    tags TEXT[] DEFAULT '{}',
    "acceptsMessages" BOOLEAN DEFAULT true,
    "highlightedUntil" TIMESTAMPTZ,
    "isSuspended" BOOLEAN DEFAULT false,
    "expiresAt" TIMESTAMPTZ,
    "isPaid" BOOLEAN DEFAULT false,
    "created_at" TIMESTAMPTZ DEFAULT NOW(),
    "updated_at" TIMESTAMPTZ DEFAULT NOW(),
    
    -- Clave foránea a la tabla users de Supabase Auth
    CONSTRAINT fk_userprofile_user FOREIGN KEY ("userId") REFERENCES auth.users(id) ON DELETE CASCADE
);

-- 5. Crear índices para UserProfile
CREATE INDEX IF NOT EXISTS idx_userprofile_role_city ON "UserProfile"(role, city);
CREATE INDEX IF NOT EXISTS idx_userprofile_budget ON "UserProfile"("budgetMin", "budgetMax");
CREATE INDEX IF NOT EXISTS idx_userprofile_highlighted ON "UserProfile"("highlightedUntil");
CREATE INDEX IF NOT EXISTS idx_userprofile_suspended ON "UserProfile"("isSuspended");

-- 6. Verificar/crear tabla Conversation
CREATE TABLE IF NOT EXISTS "Conversation" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    "aId" TEXT NOT NULL,
    "bId" TEXT NOT NULL,
    "isActive" BOOLEAN DEFAULT true,
    "lastMessageAt" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ DEFAULT NOW(),
    "updated_at" TIMESTAMPTZ DEFAULT NOW(),
    
    -- Claves foráneas a UserProfile
    CONSTRAINT fk_conversation_a FOREIGN KEY ("aId") REFERENCES "UserProfile"(id) ON DELETE CASCADE,
    CONSTRAINT fk_conversation_b FOREIGN KEY ("bId") REFERENCES "UserProfile"(id) ON DELETE CASCADE,
    
    -- Constraint único para evitar conversaciones duplicadas
    CONSTRAINT unique_conversation_participants UNIQUE ("aId", "bId")
);

-- 7. Crear índices para Conversation
CREATE INDEX IF NOT EXISTS idx_conversation_a_active ON "Conversation"("aId", "isActive");
CREATE INDEX IF NOT EXISTS idx_conversation_b_active ON "Conversation"("bId", "isActive");
CREATE INDEX IF NOT EXISTS idx_conversation_last_message ON "Conversation"("lastMessageAt");

-- 8. Verificar/crear tabla Message
CREATE TABLE IF NOT EXISTS "Message" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    "conversationId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    body TEXT NOT NULL,
    "isRead" BOOLEAN DEFAULT false,
    "created_at" TIMESTAMPTZ DEFAULT NOW(),
    
    -- Claves foráneas
    CONSTRAINT fk_message_conversation FOREIGN KEY ("conversationId") REFERENCES "Conversation"(id) ON DELETE CASCADE,
    CONSTRAINT fk_message_sender FOREIGN KEY ("senderId") REFERENCES "UserProfile"(id) ON DELETE CASCADE
);

-- 9. Crear índices para Message
CREATE INDEX IF NOT EXISTS idx_message_conversation_created ON "Message"("conversationId", "created_at");
CREATE INDEX IF NOT EXISTS idx_message_sender ON "Message"("senderId");
CREATE INDEX IF NOT EXISTS idx_message_read ON "Message"("isRead");

-- 10. Habilitar RLS (Row Level Security)
ALTER TABLE "UserProfile" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Conversation" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Message" ENABLE ROW LEVEL SECURITY;

-- 11. Políticas RLS para UserProfile
CREATE POLICY "UserProfile: Los usuarios pueden ver todos los perfiles públicos"
    ON "UserProfile" FOR SELECT
    USING (true);

CREATE POLICY "UserProfile: Los usuarios pueden actualizar su propio perfil"
    ON "UserProfile" FOR UPDATE
    USING (auth.uid()::text = "userId");

CREATE POLICY "UserProfile: Los usuarios pueden insertar su propio perfil"
    ON "UserProfile" FOR INSERT
    WITH CHECK (auth.uid()::text = "userId");

CREATE POLICY "UserProfile: Los usuarios pueden eliminar su propio perfil"
    ON "UserProfile" FOR DELETE
    USING (auth.uid()::text = "userId");

-- 12. Políticas RLS para Conversation
CREATE POLICY "Conversation: Los usuarios pueden ver sus conversaciones"
    ON "Conversation" FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM "UserProfile" 
            WHERE id = "aId" AND "userId" = auth.uid()::text
        ) OR 
        EXISTS (
            SELECT 1 FROM "UserProfile" 
            WHERE id = "bId" AND "userId" = auth.uid()::text
        )
    );

CREATE POLICY "Conversation: Los usuarios pueden crear conversaciones"
    ON "Conversation" FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM "UserProfile" 
            WHERE id = "aId" AND "userId" = auth.uid()::text
        ) OR 
        EXISTS (
            SELECT 1 FROM "UserProfile" 
            WHERE id = "bId" AND "userId" = auth.uid()::text
        )
    );

-- 13. Políticas RLS para Message
CREATE POLICY "Message: Los usuarios pueden ver mensajes de sus conversaciones"
    ON "Message" FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM "Conversation" c
            JOIN "UserProfile" up ON (c."aId" = up.id OR c."bId" = up.id)
            WHERE c.id = "conversationId" AND up."userId" = auth.uid()::text
        )
    );

CREATE POLICY "Message: Los usuarios pueden enviar mensajes en sus conversaciones"
    ON "Message" FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM "UserProfile" 
            WHERE id = "senderId" AND "userId" = auth.uid()::text
        ) AND
        EXISTS (
            SELECT 1 FROM "Conversation" c
            JOIN "UserProfile" up ON (c."aId" = up.id OR c."bId" = up.id)
            WHERE c.id = "conversationId" AND up."userId" = auth.uid()::text
        )
    );

-- 14. Función para obtener UserProfile por userId
CREATE OR REPLACE FUNCTION get_user_profile_by_auth_id(auth_user_id TEXT)
RETURNS TABLE (
    id TEXT,
    "userId" TEXT,
    role TEXT,
    city TEXT,
    neighborhood TEXT,
    "budgetMin" INTEGER,
    "budgetMax" INTEGER,
    bio TEXT,
    photos TEXT[],
    age INTEGER,
    "petPref" TEXT,
    "smokePref" TEXT,
    diet TEXT,
    "scheduleNotes" TEXT,
    tags TEXT[],
    "acceptsMessages" BOOLEAN,
    "highlightedUntil" TIMESTAMPTZ,
    "isSuspended" BOOLEAN,
    "expiresAt" TIMESTAMPTZ,
    "isPaid" BOOLEAN,
    "created_at" TIMESTAMPTZ,
    "updated_at" TIMESTAMPTZ
) 
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT 
        up.id,
        up."userId",
        up.role,
        up.city,
        up.neighborhood,
        up."budgetMin",
        up."budgetMax",
        up.bio,
        up.photos,
        up.age,
        up."petPref",
        up."smokePref",
        up.diet,
        up."scheduleNotes",
        up.tags,
        up."acceptsMessages",
        up."highlightedUntil",
        up."isSuspended",
        up."expiresAt",
        up."isPaid",
        up."created_at",
        up."updated_at"
    FROM "UserProfile" up
    WHERE up."userId" = auth_user_id;
$$;

-- 15. Función para crear UserProfile automáticamente
CREATE OR REPLACE FUNCTION create_user_profile_if_not_exists(
    auth_user_id TEXT,
    user_role TEXT DEFAULT 'BUSCO',
    user_city TEXT DEFAULT 'Posadas',
    budget_min INTEGER DEFAULT 10000,
    budget_max INTEGER DEFAULT 50000
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    profile_id TEXT;
BEGIN
    -- Verificar si ya existe el perfil
    SELECT id INTO profile_id 
    FROM "UserProfile" 
    WHERE "userId" = auth_user_id;
    
    -- Si no existe, crearlo
    IF profile_id IS NULL THEN
        INSERT INTO "UserProfile" (
            "userId",
            role,
            city,
            "budgetMin",
            "budgetMax"
        ) VALUES (
            auth_user_id,
            user_role,
            user_city,
            budget_min,
            budget_max
        ) RETURNING id INTO profile_id;
    END IF;
    
    RETURN profile_id;
END;
$$;

-- 16. Trigger para crear UserProfile automáticamente cuando se crea un usuario
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Crear UserProfile automáticamente para nuevos usuarios
    PERFORM create_user_profile_if_not_exists(NEW.id::text);
    RETURN NEW;
END;
$$;

-- Crear trigger si no existe
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 17. Verificar que las tablas existen y tienen datos
SELECT 'UserProfile' as tabla, COUNT(*) as registros FROM "UserProfile"
UNION ALL
SELECT 'Conversation' as tabla, COUNT(*) as registros FROM "Conversation"
UNION ALL
SELECT 'Message' as tabla, COUNT(*) as registros FROM "Message";

-- 18. Crear UserProfile para usuarios existentes que no lo tengan
INSERT INTO "UserProfile" ("userId", role, city, "budgetMin", "budgetMax")
SELECT 
    u.id,
    'BUSCO',
    'Posadas',
    10000,
    50000
FROM auth.users u
WHERE NOT EXISTS (
    SELECT 1 FROM "UserProfile" up WHERE up."userId" = u.id
)
ON CONFLICT ("userId") DO NOTHING;

-- 19. Verificar estructura final
\d "UserProfile"
\d "Conversation"
\d "Message"
