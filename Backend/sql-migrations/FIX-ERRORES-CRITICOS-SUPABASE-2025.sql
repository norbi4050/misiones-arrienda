-- =====================================================
-- FIX CRÍTICO: Errores de Esquema Supabase 2025
-- =====================================================
-- Fecha: 15 de Enero 2025
-- Objetivo: Corregir todos los errores críticos identificados en logs

-- =====================================================
-- 1. CORREGIR TRIGGER updated_at EN TABLA User
-- =====================================================

-- Verificar si existe la función de trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Eliminar trigger existente si existe (para recrearlo correctamente)
DROP TRIGGER IF EXISTS update_user_updated_at ON "User";

-- Crear trigger correcto para tabla User
CREATE TRIGGER update_user_updated_at
    BEFORE UPDATE ON "User"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Verificar que la columna updated_at existe en User
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'User' 
        AND column_name = 'updated_at'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE "User" ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
    END IF;
END $$;

-- =====================================================
-- 2. CORREGIR TABLA UserProfile - Agregar created_at
-- =====================================================

-- Verificar si existe la tabla UserProfile y agregar created_at si falta
DO $$
BEGIN
    -- Verificar si la tabla existe
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'UserProfile' 
        AND table_schema = 'public'
    ) THEN
        -- Agregar created_at si no existe
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'UserProfile' 
            AND column_name = 'created_at'
            AND table_schema = 'public'
        ) THEN
            ALTER TABLE "UserProfile" ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
        END IF;
        
        -- Agregar updated_at si no existe
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'UserProfile' 
            AND column_name = 'updated_at'
            AND table_schema = 'public'
        ) THEN
            ALTER TABLE "UserProfile" ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
        END IF;
    END IF;
END $$;

-- Crear trigger para UserProfile si existe la tabla
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'UserProfile' 
        AND table_schema = 'public'
    ) THEN
        -- Eliminar trigger existente si existe
        DROP TRIGGER IF EXISTS update_userprofile_updated_at ON "UserProfile";
        
        -- Crear trigger para UserProfile
        CREATE TRIGGER update_userprofile_updated_at
            BEFORE UPDATE ON "UserProfile"
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- =====================================================
-- 3. CORREGIR TABLA Properties - Agregar columna type
-- =====================================================

-- Verificar y agregar columna type en Properties
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Properties' 
        AND column_name = 'type'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE "Properties" ADD COLUMN type VARCHAR(50) DEFAULT 'apartment';
        
        -- Actualizar registros existentes con un valor por defecto
        UPDATE "Properties" SET type = 'apartment' WHERE type IS NULL;
    END IF;
END $$;

-- =====================================================
-- 4. CORREGIR TABLA user_ratings - Agregar is_public
-- =====================================================

-- Crear tabla user_ratings si no existe
CREATE TABLE IF NOT EXISTS user_ratings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    rater_id UUID REFERENCES "User"(id) ON DELETE CASCADE,
    rated_user_id UUID REFERENCES "User"(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    is_public BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(rater_id, rated_user_id)
);

-- Agregar columna is_public si la tabla existe pero falta la columna
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'user_ratings' 
        AND table_schema = 'public'
    ) THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'user_ratings' 
            AND column_name = 'is_public'
            AND table_schema = 'public'
        ) THEN
            ALTER TABLE user_ratings ADD COLUMN is_public BOOLEAN DEFAULT true;
        END IF;
    END IF;
END $$;

-- =====================================================
-- 5. CREAR TABLAS FALTANTES PARA FUNCIONALIDADES
-- =====================================================

-- Tabla user_searches
CREATE TABLE IF NOT EXISTS user_searches (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES "User"(id) ON DELETE CASCADE,
    search_query TEXT,
    filters JSONB,
    results_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabla user_messages
CREATE TABLE IF NOT EXISTS user_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sender_id UUID REFERENCES "User"(id) ON DELETE CASCADE,
    recipient_id UUID REFERENCES "User"(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabla profile_views
CREATE TABLE IF NOT EXISTS profile_views (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    viewer_id UUID REFERENCES "User"(id) ON DELETE CASCADE,
    profile_user_id UUID REFERENCES "User"(id) ON DELETE CASCADE,
    viewed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ip_address INET,
    user_agent TEXT,
    UNIQUE(viewer_id, profile_user_id, DATE(viewed_at))
);

-- =====================================================
-- 6. CREAR FUNCIÓN RPC get_user_stats
-- =====================================================

CREATE OR REPLACE FUNCTION get_user_stats(p_user_id UUID DEFAULT NULL)
RETURNS JSON AS $$
DECLARE
    target_user_id UUID;
    result JSON;
BEGIN
    -- Si no se proporciona user_id, usar el usuario autenticado
    IF p_user_id IS NULL THEN
        target_user_id := auth.uid();
    ELSE
        target_user_id := p_user_id;
    END IF;
    
    -- Verificar que el usuario existe
    IF NOT EXISTS (SELECT 1 FROM "User" WHERE id = target_user_id) THEN
        RETURN json_build_object('error', 'Usuario no encontrado');
    END IF;
    
    -- Construir estadísticas
    SELECT json_build_object(
        'user_id', target_user_id,
        'ratings_count', COALESCE((
            SELECT COUNT(*) FROM user_ratings 
            WHERE rated_user_id = target_user_id AND is_public = true
        ), 0),
        'average_rating', COALESCE((
            SELECT ROUND(AVG(rating::numeric), 2) FROM user_ratings 
            WHERE rated_user_id = target_user_id AND is_public = true
        ), 0),
        'searches_count', COALESCE((
            SELECT COUNT(*) FROM user_searches 
            WHERE user_id = target_user_id AND is_active = true
        ), 0),
        'messages_count', COALESCE((
            SELECT COUNT(*) FROM user_messages 
            WHERE sender_id = target_user_id OR recipient_id = target_user_id
        ), 0),
        'profile_views_count', COALESCE((
            SELECT COUNT(*) FROM profile_views 
            WHERE profile_user_id = target_user_id 
            AND viewed_at >= CURRENT_DATE - INTERVAL '30 days'
        ), 0),
        'last_activity', COALESCE((
            SELECT MAX(updated_at) FROM "User" WHERE id = target_user_id
        ), CURRENT_TIMESTAMP)
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 7. OTORGAR PERMISOS
-- =====================================================

-- Permisos para función RPC
GRANT EXECUTE ON FUNCTION get_user_stats(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_stats() TO authenticated;

-- Permisos para tablas nuevas
GRANT SELECT, INSERT, UPDATE, DELETE ON user_ratings TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON user_searches TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON user_messages TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON profile_views TO authenticated;

-- =====================================================
-- 8. CREAR POLÍTICAS RLS
-- =====================================================

-- RLS para user_ratings
ALTER TABLE user_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view public ratings" ON user_ratings
    FOR SELECT USING (is_public = true);

CREATE POLICY "Users can manage their own ratings" ON user_ratings
    FOR ALL USING (rater_id = auth.uid());

-- RLS para user_searches
ALTER TABLE user_searches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own searches" ON user_searches
    FOR ALL USING (user_id = auth.uid());

-- RLS para user_messages
ALTER TABLE user_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own messages" ON user_messages
    FOR SELECT USING (sender_id = auth.uid() OR recipient_id = auth.uid());

CREATE POLICY "Users can send messages" ON user_messages
    FOR INSERT WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Users can update their own messages" ON user_messages
    FOR UPDATE USING (sender_id = auth.uid() OR recipient_id = auth.uid());

-- RLS para profile_views
ALTER TABLE profile_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile views" ON profile_views
    FOR SELECT USING (profile_user_id = auth.uid());

CREATE POLICY "Authenticated users can create profile views" ON profile_views
    FOR INSERT WITH CHECK (viewer_id = auth.uid());

-- =====================================================
-- 9. CREAR ÍNDICES PARA RENDIMIENTO
-- =====================================================

-- Índices para user_ratings
CREATE INDEX IF NOT EXISTS idx_user_ratings_rated_user_id ON user_ratings(rated_user_id);
CREATE INDEX IF NOT EXISTS idx_user_ratings_is_public ON user_ratings(is_public);

-- Índices para user_searches
CREATE INDEX IF NOT EXISTS idx_user_searches_user_id ON user_searches(user_id);
CREATE INDEX IF NOT EXISTS idx_user_searches_is_active ON user_searches(is_active);

-- Índices para user_messages
CREATE INDEX IF NOT EXISTS idx_user_messages_sender_id ON user_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_user_messages_recipient_id ON user_messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_user_messages_created_at ON user_messages(created_at);

-- Índices para profile_views
CREATE INDEX IF NOT EXISTS idx_profile_views_profile_user_id ON profile_views(profile_user_id);
CREATE INDEX IF NOT EXISTS idx_profile_views_viewed_at ON profile_views(viewed_at);

-- =====================================================
-- 10. VERIFICACIÓN FINAL
-- =====================================================

-- Verificar que todas las tablas y columnas existen
DO $$
BEGIN
    -- Verificar User.updated_at
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'User' AND column_name = 'updated_at'
    ) THEN
        RAISE EXCEPTION 'ERROR: User.updated_at no existe';
    END IF;
    
    -- Verificar Properties.type
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Properties' AND column_name = 'type'
    ) THEN
        RAISE EXCEPTION 'ERROR: Properties.type no existe';
    END IF;
    
    -- Verificar user_ratings.is_public
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_ratings' AND column_name = 'is_public'
    ) THEN
        RAISE EXCEPTION 'ERROR: user_ratings.is_public no existe';
    END IF;
    
    -- Verificar función get_user_stats
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.routines 
        WHERE routine_name = 'get_user_stats' AND routine_schema = 'public'
    ) THEN
        RAISE EXCEPTION 'ERROR: función get_user_stats no existe';
    END IF;
    
    RAISE NOTICE 'SUCCESS: Todas las correcciones aplicadas correctamente';
END $$;

-- =====================================================
-- COMENTARIOS FINALES
-- =====================================================

/*
INSTRUCCIONES DE EJECUCIÓN:

1. Ejecutar este script completo en Supabase SQL Editor
2. Verificar que no hay errores en la ejecución
3. Reiniciar el servidor de desarrollo
4. Probar funcionalidad de avatares

ERRORES CORREGIDOS:
- ✅ Trigger updated_at en tabla User
- ✅ Columna created_at en UserProfile
- ✅ Columna type en Properties
- ✅ Columna is_public en user_ratings
- ✅ Función RPC get_user_stats
- ✅ Tablas faltantes creadas
- ✅ Políticas RLS configuradas
- ✅ Índices para rendimiento

RESULTADO ESPERADO:
- Avatar upload funcionando sin errores
- Estadísticas de usuario funcionando
- Favoritos funcionando correctamente
- Sistema completo operativo
*/
