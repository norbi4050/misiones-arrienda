-- =====================================================
-- MIGRACIÓN: Setup Community Images Bucket - 2025
-- =====================================================
-- Descripción: Configurar bucket público community-images para roommates y otros contenidos de comunidad
-- Fecha: 2025-01-XX
-- Autor: Sistema Roommates

-- =====================================================
-- 1. CREAR BUCKET PÚBLICO COMMUNITY-IMAGES
-- =====================================================

-- Insertar bucket si no existe
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'community-images',
  'community-images',
  true, -- Bucket público para URLs directas
  10485760, -- 10MB límite por archivo
  ARRAY[
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/webp',
    'image/gif'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY[
    'image/jpeg',
    'image/jpg',
    'image/png', 
    'image/webp',
    'image/gif'
  ];

-- =====================================================
-- 2. POLÍTICAS RLS PARA COMMUNITY-IMAGES BUCKET
-- =====================================================

-- Eliminar políticas existentes si existen
DROP POLICY IF EXISTS "community_images_select_policy" ON storage.objects;
DROP POLICY IF EXISTS "community_images_insert_policy" ON storage.objects;
DROP POLICY IF EXISTS "community_images_update_policy" ON storage.objects;
DROP POLICY IF EXISTS "community_images_delete_policy" ON storage.objects;

-- Política SELECT: Todos pueden ver imágenes (bucket público)
CREATE POLICY "community_images_select_policy"
ON storage.objects FOR SELECT
USING (bucket_id = 'community-images');

-- Política INSERT: Solo usuarios autenticados pueden subir
-- Estructura: community-images/<user_id>/<post_id>/<filename>
CREATE POLICY "community_images_insert_policy"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'community-images' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Política UPDATE: Solo el dueño puede actualizar metadatos
CREATE POLICY "community_images_update_policy"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'community-images'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Política DELETE: Solo el dueño puede eliminar sus imágenes
CREATE POLICY "community_images_delete_policy"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'community-images'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- =====================================================
-- 3. FUNCIÓN HELPER PARA ROOMMATE VIEW INCREMENT
-- =====================================================

-- Función para incrementar vistas de roommate posts
CREATE OR REPLACE FUNCTION roommate_increment_view(post_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE roommate_posts 
  SET views_count = COALESCE(views_count, 0) + 1
  WHERE id = post_id;
END;
$$;

-- Otorgar permisos de ejecución
GRANT EXECUTE ON FUNCTION roommate_increment_view(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION roommate_increment_view(uuid) TO anon;

-- =====================================================
-- 4. ÍNDICES PARA OPTIMIZACIÓN DE BÚSQUEDA
-- =====================================================

-- Índice para búsqueda full-text en roommate_posts
CREATE INDEX IF NOT EXISTS idx_roommate_posts_search_tsv 
ON roommate_posts USING gin(search_tsv);

-- Índice para filtros comunes
CREATE INDEX IF NOT EXISTS idx_roommate_posts_filters 
ON roommate_posts (status, is_active, city, province, room_type);

-- Índice para ordenamiento por fecha
CREATE INDEX IF NOT EXISTS idx_roommate_posts_published_at 
ON roommate_posts (published_at DESC) 
WHERE status = 'PUBLISHED' AND is_active = true;

-- Índice para trending (likes + views)
CREATE INDEX IF NOT EXISTS idx_roommate_posts_trending 
ON roommate_posts ((likes_count * 3 + log(1 + COALESCE(views_count, 0))))
WHERE status = 'PUBLISHED' AND is_active = true;

-- =====================================================
-- 5. TRIGGER PARA ACTUALIZAR SEARCH_TSV
-- =====================================================

-- Función para actualizar search_tsv automáticamente
CREATE OR REPLACE FUNCTION update_roommate_search_tsv()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.search_tsv := 
    setweight(to_tsvector('spanish', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('spanish', COALESCE(NEW.description, '')), 'B') ||
    setweight(to_tsvector('spanish', COALESCE(NEW.city, '')), 'C') ||
    setweight(to_tsvector('spanish', COALESCE(NEW.province, '')), 'C') ||
    setweight(to_tsvector('spanish', COALESCE(NEW.preferences, '')), 'D');
  
  RETURN NEW;
END;
$$;

-- Crear trigger si no existe
DROP TRIGGER IF EXISTS trigger_update_roommate_search_tsv ON roommate_posts;
CREATE TRIGGER trigger_update_roommate_search_tsv
  BEFORE INSERT OR UPDATE ON roommate_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_roommate_search_tsv();

-- =====================================================
-- 6. POLÍTICAS RLS PARA ROOMMATE_POSTS
-- =====================================================

-- Habilitar RLS en roommate_posts
ALTER TABLE roommate_posts ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes
DROP POLICY IF EXISTS "roommate_posts_select_policy" ON roommate_posts;
DROP POLICY IF EXISTS "roommate_posts_insert_policy" ON roommate_posts;
DROP POLICY IF EXISTS "roommate_posts_update_policy" ON roommate_posts;
DROP POLICY IF EXISTS "roommate_posts_delete_policy" ON roommate_posts;

-- SELECT: Público puede ver posts publicados y activos, dueños ven todos los suyos
CREATE POLICY "roommate_posts_select_policy"
ON roommate_posts FOR SELECT
USING (
  (status = 'PUBLISHED' AND is_active = true) -- Público ve publicados
  OR 
  (auth.uid() = user_id) -- Dueño ve todos los suyos
);

-- INSERT: Solo usuarios autenticados pueden crear
CREATE POLICY "roommate_posts_insert_policy"
ON roommate_posts FOR INSERT
WITH CHECK (
  auth.role() = 'authenticated'
  AND auth.uid() = user_id
);

-- UPDATE: Solo el dueño puede actualizar sus posts
CREATE POLICY "roommate_posts_update_policy"
ON roommate_posts FOR UPDATE
USING (
  auth.role() = 'authenticated'
  AND auth.uid() = user_id
);

-- DELETE: Solo el dueño puede eliminar sus posts
CREATE POLICY "roommate_posts_delete_policy"
ON roommate_posts FOR DELETE
USING (
  auth.role() = 'authenticated'
  AND auth.uid() = user_id
);

-- =====================================================
-- 7. POLÍTICAS RLS PARA ROOMMATE_LIKES
-- =====================================================

-- Habilitar RLS en roommate_likes si existe la tabla
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'roommate_likes') THEN
    ALTER TABLE roommate_likes ENABLE ROW LEVEL SECURITY;
    
    -- Eliminar políticas existentes
    DROP POLICY IF EXISTS "roommate_likes_select_policy" ON roommate_likes;
    DROP POLICY IF EXISTS "roommate_likes_insert_policy" ON roommate_likes;
    DROP POLICY IF EXISTS "roommate_likes_delete_policy" ON roommate_likes;
    
    -- SELECT: Usuarios pueden ver sus propios likes
    CREATE POLICY "roommate_likes_select_policy"
    ON roommate_likes FOR SELECT
    USING (auth.uid() = user_id);
    
    -- INSERT: Usuarios autenticados pueden dar like
    CREATE POLICY "roommate_likes_insert_policy"
    ON roommate_likes FOR INSERT
    WITH CHECK (
      auth.role() = 'authenticated'
      AND auth.uid() = user_id
    );
    
    -- DELETE: Usuarios pueden quitar sus propios likes
    CREATE POLICY "roommate_likes_delete_policy"
    ON roommate_likes FOR DELETE
    USING (auth.uid() = user_id);
  END IF;
END $$;

-- =====================================================
-- 8. POLÍTICAS RLS PARA ROOMMATE_REPORTS
-- =====================================================

-- Habilitar RLS en roommate_reports si existe la tabla
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'roommate_reports') THEN
    ALTER TABLE roommate_reports ENABLE ROW LEVEL SECURITY;
    
    -- Eliminar políticas existentes
    DROP POLICY IF EXISTS "roommate_reports_select_policy" ON roommate_reports;
    DROP POLICY IF EXISTS "roommate_reports_insert_policy" ON roommate_reports;
    
    -- SELECT: Solo admins pueden ver reportes (implementar según necesidad)
    CREATE POLICY "roommate_reports_select_policy"
    ON roommate_reports FOR SELECT
    USING (false); -- Por ahora, nadie puede ver reportes via RLS
    
    -- INSERT: Usuarios autenticados pueden reportar
    CREATE POLICY "roommate_reports_insert_policy"
    ON roommate_reports FOR INSERT
    WITH CHECK (
      auth.role() = 'authenticated'
      AND auth.uid() = user_id
    );
  END IF;
END $$;

-- =====================================================
-- 9. VERIFICACIÓN FINAL
-- =====================================================

-- Verificar que el bucket fue creado
SELECT 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets 
WHERE id = 'community-images';

-- Verificar políticas de storage
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'objects' 
AND policyname LIKE '%community_images%';

-- Verificar políticas de roommate_posts
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'roommate_posts';

-- =====================================================
-- MIGRACIÓN COMPLETADA
-- =====================================================

-- Log de finalización
DO $$
BEGIN
  RAISE NOTICE 'Migración community-images bucket completada exitosamente';
  RAISE NOTICE 'Bucket público creado: community-images';
  RAISE NOTICE 'Políticas RLS configuradas para roommate_posts, roommate_likes, roommate_reports';
  RAISE NOTICE 'Índices de búsqueda y optimización creados';
  RAISE NOTICE 'Función roommate_increment_view() disponible';
  RAISE NOTICE 'Estructura de keys: community-images/<user_id>/<post_id>/<filename>';
END $$;
