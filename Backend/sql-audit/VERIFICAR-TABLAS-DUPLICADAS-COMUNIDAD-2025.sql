-- ============================================
-- VERIFICAR: Tablas duplicadas de comunidad
-- Fecha: 2025-01-XX
-- Problema: Posible duplicación de tablas
-- ============================================

-- 1. Listar TODAS las tablas que contienen "community" o "comunidad"
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables
WHERE tablename LIKE '%community%'
   OR tablename LIKE '%comunidad%'
ORDER BY tablename;

-- 2. Ver estructura de community_posts
SELECT 
    column_name,
    data_type
FROM information_schema.columns
WHERE table_name = 'community_posts'
ORDER BY ordinal_position;

-- 3. Buscar otras posibles tablas de posts
SELECT 
    table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND (
    table_name LIKE '%post%'
    OR table_name LIKE '%anuncio%'
    OR table_name LIKE '%publicacion%'
  )
ORDER BY table_name;

-- 4. Contar posts en community_posts por usuario
SELECT 
    user_id,
    COUNT(*) as total_posts,
    COUNT(*) FILTER (WHERE is_active = true) as active_posts,
    COUNT(*) FILTER (WHERE is_active = false) as inactive_posts
FROM community_posts
WHERE user_id = (auth.uid())::text
GROUP BY user_id;

-- 5. Ver TODOS los posts del usuario (activos e inactivos)
SELECT 
    id,
    title,
    is_active,
    status,
    created_at,
    updated_at
FROM community_posts
WHERE user_id = (auth.uid())::text
ORDER BY created_at DESC;

-- 6. Verificar si hay views que puedan estar filtrando
SELECT 
    table_name,
    view_definition
FROM information_schema.views
WHERE table_schema = 'public'
  AND table_name LIKE '%community%'
ORDER BY table_name;

-- ============================================
-- INSTRUCCIONES:
-- ============================================
-- 1. Ejecutar query 1 para ver todas las tablas de comunidad
-- 2. Ejecutar query 3 para buscar otras tablas de posts
-- 3. Ejecutar query 4 para contar posts por estado
-- 4. Ejecutar query 5 para ver todos tus posts
-- 5. Ejecutar query 6 para ver si hay views
-- 6. Compartir TODOS los resultados
-- ============================================
