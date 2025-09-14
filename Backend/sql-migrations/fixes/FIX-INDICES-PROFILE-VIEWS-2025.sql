-- =====================================================
-- FIX CRÍTICO: CORRECCIÓN ÍNDICES PROFILE_VIEWS
-- =====================================================
-- Fecha: Enero 2025
-- Propósito: Corregir error "column viewed_user_id does not exist"
-- Problema: Los índices se están creando antes que las tablas

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
-- 2. CREAR ÍNDICES DESPUÉS DE CONFIRMAR LA TABLA
-- =====================================================

-- Verificar que la tabla existe antes de crear índices
DO $$
BEGIN
    -- Verificar que la columna viewed_user_id existe
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profile_views' 
        AND column_name = 'viewed_user_id'
    ) THEN
        RAISE NOTICE '✅ Columna viewed_user_id encontrada, creando índices...';
        
        -- Crear índices uno por uno con verificación
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_profile_views_viewed_user') THEN
            CREATE INDEX idx_profile_views_viewed_user 
            ON public.profile_views(viewed_user_id, viewed_at DESC);
            RAISE NOTICE '✅ Índice idx_profile_views_viewed_user creado';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_profile_views_viewer_user') THEN
            CREATE INDEX idx_profile_views_viewer_user 
            ON public.profile_views(viewer_user_id, viewed_at DESC);
            RAISE NOTICE '✅ Índice idx_profile_views_viewer_user creado';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_profile_views_session') THEN
            CREATE INDEX idx_profile_views_session 
            ON public.profile_views(session_id, viewed_at DESC);
            RAISE NOTICE '✅ Índice idx_profile_views_session creado';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_profile_views_recent') THEN
            CREATE INDEX idx_profile_views_recent 
            ON public.profile_views(viewed_at DESC) 
            WHERE viewed_at >= NOW() - INTERVAL '30 days';
            RAISE NOTICE '✅ Índice idx_profile_views_recent creado';
        END IF;
        
    ELSE
        RAISE EXCEPTION '❌ ERROR: Columna viewed_user_id no existe en la tabla profile_views';
    END IF;
END $$;

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
    IF EXISTS (
        SELECT 1 FROM public.profile_views 
        WHERE viewer_user_id = p_viewer_user_id 
        AND viewed_user_id = p_viewed_user_id 
        AND session_id = p_session_id
        AND viewed_at >= NOW() - INTERVAL '1 hour'
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
-- 5. FUNCIÓN PARA OBTENER ESTADÍSTICAS (SIMPLIFICADA)
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_profile_views_count(target_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    views_count INTEGER := 0;
BEGIN
    -- Verificar que la tabla existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'profile_views'
    ) THEN
        RETURN 0;
    END IF;
    
    -- Contar vistas de perfil (últimos 30 días)
    SELECT COUNT(*) INTO views_count
    FROM public.profile_views 
    WHERE viewed_user_id = target_user_id 
    AND viewed_at >= NOW() - INTERVAL '30 days';
    
    RETURN COALESCE(views_count, 0);
EXCEPTION WHEN OTHERS THEN
    RETURN 0;
END;
$$;

-- =====================================================
-- 6. VERIFICACIÓN FINAL
-- =====================================================

DO $$
DECLARE
    table_exists BOOLEAN;
    column_exists BOOLEAN;
    index_count INTEGER;
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
    
    -- Mostrar resultados
    RAISE NOTICE '=== VERIFICACIÓN FINAL ===';
    RAISE NOTICE 'Tabla profile_views existe: %', table_exists;
    RAISE NOTICE 'Columna viewed_user_id existe: %', column_exists;
    RAISE NOTICE 'Índices creados: %', index_count;
    
    IF table_exists AND column_exists AND index_count >= 4 THEN
        RAISE NOTICE '✅ ¡CORRECCIÓN EXITOSA! Tabla profile_views lista para usar';
    ELSE
        RAISE NOTICE '❌ Aún hay problemas. Revisar configuración.';
    END IF;
END $$;

-- =====================================================
-- 7. INSERTAR DATOS DE PRUEBA (OPCIONAL)
-- =====================================================

-- Comentar esta sección si no quieres datos de prueba
/*
DO $$
DECLARE
    test_user_id UUID;
BEGIN
    -- Obtener un usuario de prueba
    SELECT id INTO test_user_id FROM auth.users LIMIT 1;
    
    IF test_user_id IS NOT NULL THEN
        -- Insertar algunas vistas de prueba
        INSERT INTO public.profile_views (viewer_user_id, viewed_user_id, session_id)
        VALUES 
            (test_user_id, test_user_id, 'test-session-1'),
            (test_user_id, test_user_id, 'test-session-2');
        
        RAISE NOTICE '✅ Datos de prueba insertados';
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'No se pudieron insertar datos de prueba: %', SQLERRM;
END $$;
*/
