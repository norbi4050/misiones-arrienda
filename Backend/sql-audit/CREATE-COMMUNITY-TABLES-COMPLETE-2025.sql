-- TABLAS Y FUNCIONES PARA SISTEMA COMUNIDAD COMPLETO
-- Fecha: 2025-01-03
-- Objetivo: Crear todas las tablas faltantes para funcionalidades completas

-- =====================================================
-- 1. TABLAS NUEVAS REQUERIDAS
-- =====================================================

-- Tabla para likes a posts (no perfiles)
CREATE TABLE IF NOT EXISTS public.community_post_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  liker_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Constraints
  UNIQUE(liker_id, post_id)
);

-- Tabla para reportes de perfiles/posts
CREATE TABLE IF NOT EXISTS public.community_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reported_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL CHECK (reason IN ('spam', 'inappropriate', 'fake', 'harassment', 'other')),
  details TEXT NOT NULL CHECK (length(details) >= 10 AND length(details) <= 500),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users(id),
  
  -- Constraints
  UNIQUE(reporter_id, reported_user_id)
);

-- Tabla para bloqueos entre usuarios
CREATE TABLE IF NOT EXISTS public.community_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Constraints
  UNIQUE(blocker_id, blocked_id),
  CHECK (blocker_id != blocked_id)
);

-- =====================================================
-- 2. AGREGAR CAMPOS FALTANTES
-- =====================================================

-- Agregar views_count a community_posts si no existe
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'community_posts' 
    AND column_name = 'views_count'
  ) THEN
    ALTER TABLE public.community_posts 
    ADD COLUMN views_count INTEGER NOT NULL DEFAULT 0;
  END IF;
END $$;

-- Agregar status a community_posts si no existe
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'community_posts' 
    AND column_name = 'status'
  ) THEN
    ALTER TABLE public.community_posts 
    ADD COLUMN status TEXT NOT NULL DEFAULT 'active' 
    CHECK (status IN ('active', 'inactive', 'draft', 'expired'));
  END IF;
END $$;

-- =====================================================
-- 3. ÍNDICES PARA PERFORMANCE
-- =====================================================

-- Índices para community_post_likes
CREATE INDEX IF NOT EXISTS idx_community_post_likes_liker_id ON public.community_post_likes(liker_id);
CREATE INDEX IF NOT EXISTS idx_community_post_likes_post_id ON public.community_post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_community_post_likes_created_at ON public.community_post_likes(created_at DESC);

-- Índices para community_reports
CREATE INDEX IF NOT EXISTS idx_community_reports_reporter_id ON public.community_reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_community_reports_reported_user_id ON public.community_reports(reported_user_id);
CREATE INDEX IF NOT EXISTS idx_community_reports_status ON public.community_reports(status);
CREATE INDEX IF NOT EXISTS idx_community_reports_created_at ON public.community_reports(created_at DESC);

-- Índices para community_blocks
CREATE INDEX IF NOT EXISTS idx_community_blocks_blocker_id ON public.community_blocks(blocker_id);
CREATE INDEX IF NOT EXISTS idx_community_blocks_blocked_id ON public.community_blocks(blocked_id);

-- Índices para views_count
CREATE INDEX IF NOT EXISTS idx_community_posts_views_count ON public.community_posts(views_count DESC);
CREATE INDEX IF NOT EXISTS idx_community_posts_status ON public.community_posts(status);

-- =====================================================
-- 4. RPC FUNCTIONS
-- =====================================================

-- Función para publicar post
CREATE OR REPLACE FUNCTION public.community_post_publish(post_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.community_posts 
  SET 
    status = 'active',
    updated_at = now()
  WHERE id = post_id 
    AND user_id = auth.uid()
    AND status IN ('draft', 'inactive');
    
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Post no encontrado o no tienes permisos';
  END IF;
END;
$$;

-- Función para despublicar post
CREATE OR REPLACE FUNCTION public.community_post_unpublish(post_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.community_posts 
  SET 
    status = 'inactive',
    updated_at = now()
  WHERE id = post_id 
    AND user_id = auth.uid()
    AND status = 'active';
    
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Post no encontrado o no tienes permisos';
  END IF;
END;
$$;

-- Función para destacar post
CREATE OR REPLACE FUNCTION public.community_post_highlight(post_id UUID, days INTEGER)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.community_posts 
  SET 
    highlighted_until = now() + (days || ' days')::INTERVAL,
    updated_at = now()
  WHERE id = post_id 
    AND user_id = auth.uid()
    AND status = 'active';
    
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Post no encontrado, no tienes permisos o no está activo';
  END IF;
END;
$$;

-- Función para incrementar views
CREATE OR REPLACE FUNCTION public.community_post_inc_view(post_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.community_posts 
  SET views_count = COALESCE(views_count, 0) + 1
  WHERE id = post_id 
    AND status = 'active';
    
  -- No lanzar error si no se encuentra (puede estar inactivo)
END;
$$;

-- =====================================================
-- 5. RLS POLICIES
-- =====================================================

-- RLS para community_post_likes
ALTER TABLE public.community_post_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all post likes" ON public.community_post_likes
  FOR SELECT USING (true);

CREATE POLICY "Users can create their own post likes" ON public.community_post_likes
  FOR INSERT WITH CHECK (auth.uid() = liker_id);

CREATE POLICY "Users can delete their own post likes" ON public.community_post_likes
  FOR DELETE USING (auth.uid() = liker_id);

-- RLS para community_reports
ALTER TABLE public.community_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own reports" ON public.community_reports
  FOR SELECT USING (auth.uid() = reporter_id OR auth.uid() = reported_user_id);

CREATE POLICY "Users can create reports" ON public.community_reports
  FOR INSERT WITH CHECK (auth.uid() = reporter_id);

-- RLS para community_blocks
ALTER TABLE public.community_blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own blocks" ON public.community_blocks
  FOR SELECT USING (auth.uid() = blocker_id);

CREATE POLICY "Users can create their own blocks" ON public.community_blocks
  FOR INSERT WITH CHECK (auth.uid() = blocker_id);

CREATE POLICY "Users can delete their own blocks" ON public.community_blocks
  FOR DELETE USING (auth.uid() = blocker_id);

-- =====================================================
-- 6. ACTUALIZAR VIEW COMMUNITY_POSTS_PUBLIC
-- =====================================================

-- Recrear view para incluir views_count
DROP VIEW IF EXISTS public.community_posts_public;

CREATE VIEW public.community_posts_public AS
SELECT 
  cp.*,
  u.name as author_name,
  u.avatar as author_photo
FROM public.community_posts cp
LEFT JOIN public.users u ON cp.user_id = u.id
WHERE cp.status = 'active' 
  AND (cp.expires_at IS NULL OR cp.expires_at > now());

-- =====================================================
-- 7. TRIGGERS PARA CLEANUP AUTOMÁTICO
-- =====================================================

-- Trigger para limpiar likes cuando se elimina un post
CREATE OR REPLACE FUNCTION public.cleanup_post_likes()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM public.community_post_likes WHERE post_id = OLD.id;
  RETURN OLD;
END;
$$;

CREATE TRIGGER trigger_cleanup_post_likes
  BEFORE DELETE ON public.community_posts
  FOR EACH ROW EXECUTE FUNCTION public.cleanup_post_likes();

-- =====================================================
-- 8. DATOS DE PRUEBA (OPCIONAL)
-- =====================================================

-- Insertar algunos datos de prueba si las tablas están vacías
DO $$
BEGIN
  -- Solo si no hay datos existentes
  IF NOT EXISTS (SELECT 1 FROM public.community_post_likes LIMIT 1) THEN
    INSERT INTO public.community_post_likes (liker_id, post_id) 
    SELECT 
      (SELECT id FROM auth.users LIMIT 1),
      (SELECT id FROM public.community_posts LIMIT 1)
    WHERE EXISTS (SELECT 1 FROM auth.users LIMIT 1)
      AND EXISTS (SELECT 1 FROM public.community_posts LIMIT 1);
  END IF;
END $$;

-- =====================================================
-- 9. VERIFICACIÓN FINAL
-- =====================================================

-- Verificar que todas las tablas existen
SELECT 
  table_name,
  CASE 
    WHEN table_name IN (
      'community_posts', 'community_post_likes', 
      'community_reports', 'community_blocks'
    ) THEN '✅ EXISTE'
    ELSE '❌ FALTA'
  END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name LIKE 'community_%'
ORDER BY table_name;

-- Verificar que todas las funciones existen
SELECT 
  routine_name,
  '✅ EXISTE' as status
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name LIKE 'community_post_%'
ORDER BY routine_name;
