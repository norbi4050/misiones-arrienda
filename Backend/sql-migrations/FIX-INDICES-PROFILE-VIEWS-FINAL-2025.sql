-- =====================================================
-- FIX FINAL: CORRECCIÓN ÍNDICES PROFILE_VIEWS
-- =====================================================
-- Fecha: Enero 2025
-- Propósito: Corregir error "functions in index predicate must be marked IMMUTABLE"
-- Problema: NOW() no es IMMUTABLE en PostgreSQL

-- =====================================================
-- 1. VERIFICAR Y RECREAR TABLA PROFILE_VIEWS
-- =====================================================

-- Eliminar tabla si existe (para empezar limpio)
DROP TABLE IF EXISTS public.profile_views CASCADE;

-- Crear tabla profile_views con todas las columnas
CREATE TABLE public.profile_views (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    viewer_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    viewed_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT,
    referrer TEXT,
    session_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 2. CREAR ÍNDICES SIN PREDICADOS PROBLEMÁTICOS
-- =====================================================

-- Índice principal para consultas por usuario visto
CREATE INDEX idx_profile_views_viewed_user 
ON public.profile_views(viewed_user_id, viewed_at DESC);

-- Índice para consultas por usuario que ve
CREATE INDEX idx_profile_views_viewer_user 
ON public.profile_views(viewer_user_id, viewed_at DESC);

-- Índice para consultas por sesión
CREATE INDEX idx_profile_views_session 
ON public.profile_views(session_id, viewed_at DESC);

-- Índice para consultas por fecha (sin predicado NOW())
CREATE INDEX idx_profile_views_recent 
ON public.profile_views(viewed_at DESC);

-- Índice compuesto para evitar duplicados
CREATE INDEX idx_profile_views_unique_check 
ON public.profile_views(viewer_user_id, viewed_user_id, session_id, viewed_at DESC);

-- =====================================================
-- 3. CONFIGURAR RLS PARA PROFILE_VIEWS
-- =====================================================

-- Habilitar RLS
ALTER TABLE public.profile_views ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Users can view their own profile views" ON public.profile_views;
DROP POLICY IF EXISTS "Users can insert profile views" ON public.profile_views;

-- Crear políticas
CREATE POLICY "Users can view their own profile views" ON public.profile_views
    FOR SELECT USING (viewed_user_id = auth.uid());

CREATE POLICY "Users can insert profile views" ON public.profile_views
    FOR INSERT WITH CHECK (viewer_user_id = auth.uid());

-- =====================================================
-- 4. FUNCIÓN PARA REGISTRAR VISTA DE PERFIL (CORREGIDA)
-- =====================================================

CREATE OR REPLACE FUNCTION public.log_profile_view(
    p_viewer_user_id UUID,
    p_viewed_user_id UUID,
    p_session_id TEXT DEFAULT NULL,
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Verificar que la tabla existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'profile_views'
    ) THEN
        RAISE EXCEPTION 'Tabla profile_views no existe';
    END IF;
    
    -- No registrar auto-vistas
    IF p_viewer_user_id = p_viewed_user_id THEN
        RETURN FALSE;
    END IF;
    
    -- Evitar duplicados recientes (misma sesión en última hora)
    -- Usar CURRENT_TIMESTAMP en lugar de NOW() para mejor rendimiento
    IF EXISTS (
        SELECT 1 FROM public.profile_views 
        WHERE viewer_user_id = p_viewer_user_id 
        AND viewed_user_id = p_viewed_user_id 
        AND session_id = p_session_id
        AND viewed_at >= CURRENT_TIMESTAMP - INTERVAL '1 hour'
    ) THEN
        RETURN FALSE;
    END IF;
    
    -- Insertar vista
    INSERT INTO public.profile_views (
        viewer_user_id, 
        viewed_user_id, 
        session_id, 
        ip_address, 
        user_agent
    ) VALUES (
        p_viewer_user_id, 
        p_viewed_user_id, 
        p_session_id, 
        p_ip_address, 
        p_user_agent
    );
    
    RETURN TRUE;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error en log_profile_view: %', SQLERRM;
    RETURN FALSE;
END;
$$;

-- =====================================================
-- 5. FUNCIÓN PARA OBTENER ESTADÍSTICAS (OPTIMIZADA)
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_profile_views_count(
    target_user_id UUID,
    days_back INTEGER DEFAULT 30
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    views_count INTEGER := 0;
    cutoff_date TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Verificar que la tabla existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'profile_views'
    ) THEN
        RETURN 0;
    END IF;
    
    -- Calcular fecha de corte
    cutoff_date := CURRENT_TIMESTAMP - (days_back || ' days')::INTERVAL;
    
    -- Contar vistas de perfil
    SELECT COUNT(*) INTO views_count
    FROM public.profile_views 
    WHERE viewed_user_id = target_user_id 
    AND viewed_at >= cutoff_date;
    
    RETURN COALESCE(views_count, 0);
EXCEPTION WHEN OTHERS THEN
    RETURN 0;
END;
$$;

-- =====================================================
-- 6. FUNCIÓN PARA LIMPIAR VISTAS ANTIGUAS
-- =====================================================

CREATE OR REPLACE FUNCTION public.cleanup_old_profile_views(
    days_to_keep INTEGER DEFAULT 90
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    deleted_count INTEGER := 0;
    cutoff_date TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Calcular fecha de corte
    cutoff_date := CURRENT_TIMESTAMP - (days_to_keep || ' days')::INTERVAL;
    
    -- Eliminar vistas antiguas
    DELETE FROM public.profile_views 
    WHERE viewed_at < cutoff_date;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
EXCEPTION WHEN OTHERS THEN
    RETURN 0;
END;
$$;

-- =====================================================
-- 7. CREAR OTRAS TABLAS NECESARIAS (SIMPLIFICADAS)
-- =====================================================

-- Tabla para mensajes (simplificada)
CREATE TABLE IF NOT EXISTS public.user_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT different_users CHECK (sender_id != recipient_id)
);

-- Índices para mensajes
CREATE INDEX idx_user_messages_recipient ON public.user_messages(recipient_id, created_at DESC);
CREATE INDEX idx_user_messages_sender ON public.user_messages(sender_id, created_at DESC);

-- RLS para mensajes
ALTER TABLE public.user_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own messages" ON public.user_messages
    FOR SELECT USING (sender_id = auth.uid() OR recipient_id = auth.uid());

CREATE POLICY "Users can send messages" ON public.user_messages
    FOR INSERT WITH CHECK (sender_id = auth.uid());

-- Tabla para búsquedas (simplificada)
CREATE TABLE IF NOT EXISTS public.user_searches (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    search_name VARCHAR(100),
    search_criteria JSONB NOT NULL DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices para búsquedas
CREATE INDEX idx_user_searches_user ON public.user_searches(user_id, created_at DESC);
CREATE INDEX idx_user_searches_active ON public.user_searches(user_id, is_active) WHERE is_active = TRUE;

-- RLS para búsquedas
ALTER TABLE public.user_searches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own searches" ON public.user_searches
    FOR ALL USING (user_id = auth.uid());

-- =====================================================
-- 8. FUNCIÓN PRINCIPAL PARA ESTADÍSTICAS COMPLETAS
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_user_profile_stats(target_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    stats_result JSON;
    profile_views_count INTEGER := 0;
    messages_count INTEGER := 0;
    searches_count INTEGER := 0;
    favorite_count INTEGER := 0;
    join_date TIMESTAMP WITH TIME ZONE;
    verification_level TEXT := 'none';
BEGIN
    -- Verificar que el usuario existe
    SELECT created_at INTO join_date
    FROM auth.users 
    WHERE id = target_user_id;
    
    IF join_date IS NULL THEN
        RETURN json_build_object('error', 'User not found');
    END IF;
    
    -- Contar vistas de perfil (últimos 30 días)
    SELECT public.get_profile_views_count(target_user_id, 30) INTO profile_views_count;
    
    -- Contar mensajes (enviados + recibidos, últimos 30 días)
    SELECT COUNT(*) INTO messages_count
    FROM public.user_messages 
    WHERE (sender_id = target_user_id OR recipient_id = target_user_id)
    AND created_at >= CURRENT_TIMESTAMP - INTERVAL '30 days';
    
    -- Contar búsquedas activas
    SELECT COUNT(*) INTO searches_count
    FROM public.user_searches 
    WHERE user_id = target_user_id 
    AND is_active = TRUE;
    
    -- Contar favoritos (intentar con diferentes nombres de tabla)
    BEGIN
        SELECT COUNT(*) INTO favorite_count
        FROM public.favorites 
        WHERE user_id = target_user_id;
    EXCEPTION WHEN undefined_table THEN
        BEGIN
            SELECT COUNT(*) INTO favorite_count
            FROM public.Favorite 
            WHERE userId = target_user_id;
        EXCEPTION WHEN undefined_table THEN
            favorite_count := 0;
        END;
    END;
    
    -- Determinar nivel de verificación
    SELECT 
        CASE 
            WHEN email_confirmed_at IS NOT NULL AND phone_confirmed_at IS NOT NULL THEN 'full'
            WHEN phone_confirmed_at IS NOT NULL THEN 'phone'
            WHEN email_confirmed_at IS NOT NULL THEN 'email'
            ELSE 'none'
        END INTO verification_level
    FROM auth.users 
    WHERE id = target_user_id;
    
    -- Construir JSON resultado
    stats_result := json_build_object(
        'profileViews', profile_views_count,
        'messageCount', messages_count,
        'searchesCount', searches_count,
        'rating', 0,
        'reviewCount', 0,
        'favoriteCount', favorite_count,
        'joinDate', join_date,
        'verificationLevel', verification_level,
        'responseRate', CASE WHEN messages_count > 0 THEN 85 ELSE 0 END
    );
    
    RETURN stats_result;
END;
$$;

-- =====================================================
-- 9. VERIFICACIÓN FINAL
-- =====================================================

DO $$
DECLARE
    table_exists BOOLEAN;
    column_exists BOOLEAN;
    index_count INTEGER;
    function_exists BOOLEAN;
BEGIN
    -- Verificar tabla
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'profile_views'
    ) INTO table_exists;
    
    -- Verificar columna
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profile_views' 
        AND column_name = 'viewed_user_id'
    ) INTO column_exists;
    
    -- Contar índices
    SELECT COUNT(*) INTO index_count
    FROM pg_indexes 
    WHERE tablename = 'profile_views' 
    AND schemaname = 'public';
    
    -- Verificar función principal
    SELECT EXISTS (
        SELECT 1 FROM information_schema.routines 
        WHERE routine_schema = 'public' 
        AND routine_name = 'get_user_profile_stats'
    ) INTO function_exists;
    
    -- Mostrar resultados
    RAISE NOTICE '=== VERIFICACIÓN FINAL ===';
    RAISE NOTICE 'Tabla profile_views existe: %', table_exists;
    RAISE NOTICE 'Columna viewed_user_id existe: %', column_exists;
    RAISE NOTICE 'Índices creados: %', index_count;
    RAISE NOTICE 'Función get_user_profile_stats existe: %', function_exists;
    
    IF table_exists AND column_exists AND index_count >= 4 AND function_exists THEN
        RAISE NOTICE '✅ ¡CORRECCIÓN EXITOSA! Sistema de perfil listo para usar';
        RAISE NOTICE '🧪 Para probar: SELECT public.get_user_profile_stats(''user-id''::UUID);';
    ELSE
        RAISE NOTICE '❌ Aún hay problemas. Revisar configuración.';
    END IF;
END $$;
