-- =====================================================
-- FIX: Vista community_posts_public con case-sensitivity
-- Fecha: 2025-01-10
-- Problema: La vista filtra por status = 'active' pero los posts tienen 'ACTIVE'
-- =====================================================

-- PASO 1: Verificar el problema actual
SELECT 
  id,
  title,
  status,
  is_active,
  CASE 
    WHEN status = 'active' THEN '✅ Lowercase match'
    WHEN status = 'ACTIVE' THEN '❌ UPPERCASE (no match con vista)'
    ELSE '⚠️ Otro valor: ' || status
  END as status_check
FROM public.community_posts
WHERE is_active = true
ORDER BY created_at DESC;

-- PASO 2: Recrear la vista con comparación case-insensitive
DROP VIEW IF EXISTS public.community_posts_public;

CREATE VIEW public.community_posts_public AS
SELECT 
  cp.*,
  u.name as author_name,
  u.avatar as author_photo
FROM public.community_posts cp
LEFT JOIN public.users u ON cp.user_id = u.id
WHERE UPPER(cp.status) = 'ACTIVE'  -- Case-insensitive comparison
  AND (cp.expires_at IS NULL OR cp.expires_at > now());

-- PASO 3: Primero, eliminar temporalmente el CHECK constraint
ALTER TABLE public.community_posts 
DROP CONSTRAINT IF EXISTS community_posts_status_check;

-- PASO 3.1: Normalizar valores existentes a lowercase
UPDATE public.community_posts
SET status = LOWER(status)
WHERE status IS NOT NULL
  AND status != LOWER(status);

-- PASO 3.2: Recrear el CHECK constraint con valores en lowercase
ALTER TABLE public.community_posts
ADD CONSTRAINT community_posts_status_check 
CHECK (status IN ('active', 'inactive', 'draft', 'expired', 'archived'));

-- PASO 4: Recrear la vista con lowercase (ahora que los datos están normalizados)
DROP VIEW IF EXISTS public.community_posts_public;

CREATE VIEW public.community_posts_public AS
SELECT 
  cp.*,
  u.name as author_name,
  u.avatar as author_photo
FROM public.community_posts cp
LEFT JOIN public.users u ON cp.user_id = u.id
WHERE cp.status = 'active'  -- Ahora todos los datos están en lowercase
  AND (cp.expires_at IS NULL OR cp.expires_at > now());

-- PASO 5: Verificar que la vista ahora retorna posts
SELECT 
  COUNT(*) as total_posts_en_vista,
  'Si es > 0, el fix funcionó' as resultado
FROM public.community_posts_public;

-- PASO 6: Mostrar posts en la vista
SELECT 
  id,
  title,
  role,
  city,
  status,
  is_active,
  author_name,
  created_at
FROM public.community_posts_public
ORDER BY created_at DESC
LIMIT 10;

-- =====================================================
-- VERIFICACIÓN FINAL
-- =====================================================

-- Comparar counts
SELECT 
  (SELECT COUNT(*) FROM public.community_posts WHERE is_active = true) as posts_activos_tabla,
  (SELECT COUNT(*) FROM public.community_posts_public) as posts_en_vista,
  CASE 
    WHEN (SELECT COUNT(*) FROM public.community_posts WHERE is_active = true) = 
         (SELECT COUNT(*) FROM public.community_posts_public)
    THEN '✅ COUNTS COINCIDEN'
    ELSE '❌ COUNTS NO COINCIDEN - Revisar filtros'
  END as verificacion;
