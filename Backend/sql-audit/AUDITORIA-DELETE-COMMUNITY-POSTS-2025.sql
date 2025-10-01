-- ============================================
-- AUDITORÍA: Políticas RLS para DELETE en community_posts
-- Fecha: 2025-01-XX
-- Objetivo: Verificar y configurar permisos de eliminación
-- ============================================

-- 1. Ver políticas RLS actuales en community_posts
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'community_posts'
ORDER BY policyname;

-- 2. Verificar si RLS está habilitado
SELECT 
    tablename,
    rowsecurity
FROM pg_tables
WHERE tablename = 'community_posts';

-- 3. Ver estructura de la tabla community_posts
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'community_posts'
ORDER BY ordinal_position;

-- 4. Probar UPDATE (soft delete) como usuario autenticado
-- NOTA: Ejecutar esto después de hacer login en Supabase
-- Reemplazar 'YOUR_POST_ID' con un ID real de tu post
/*
UPDATE community_posts
SET is_active = false, updated_at = now()
WHERE id = 'YOUR_POST_ID'
  AND user_id = auth.uid();
*/

-- 5. Ver posts activos del usuario actual
SELECT 
    id,
    title,
    user_id,
    is_active,
    created_at,
    updated_at
FROM community_posts
WHERE user_id = auth.uid()
ORDER BY created_at DESC
LIMIT 10;

-- ============================================
-- POLÍTICAS RLS RECOMENDADAS
-- ============================================

-- Política para UPDATE (necesaria para soft delete)
-- Solo el dueño puede actualizar su post
CREATE POLICY "Users can update own posts"
ON community_posts
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Política para DELETE (hard delete - opcional, no recomendado)
-- Solo el dueño puede eliminar permanentemente su post
CREATE POLICY "Users can delete own posts"
ON community_posts
FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- ============================================
-- VERIFICACIÓN POST-IMPLEMENTACIÓN
-- ============================================

-- 6. Verificar que las políticas se crearon correctamente
SELECT 
    policyname,
    cmd,
    qual::text as using_clause,
    with_check::text as with_check_clause
FROM pg_policies
WHERE tablename = 'community_posts'
  AND cmd IN ('UPDATE', 'DELETE')
ORDER BY policyname;

-- 7. Test de soft delete (como usuario autenticado)
-- Reemplazar 'YOUR_POST_ID' con un ID real
/*
-- Marcar como inactivo
UPDATE community_posts
SET is_active = false, updated_at = now()
WHERE id = 'YOUR_POST_ID'
  AND user_id = auth.uid()
RETURNING id, is_active;

-- Restaurar (reactivar)
UPDATE community_posts
SET is_active = true, updated_at = now()
WHERE id = 'YOUR_POST_ID'
  AND user_id = auth.uid()
RETURNING id, is_active;
*/

-- ============================================
-- INSTRUCCIONES:
-- ============================================
-- 1. Ejecutar queries 1-3 para ver estado actual
-- 2. Si no existen políticas UPDATE/DELETE, ejecutar las CREATE POLICY
-- 3. Ejecutar query 6 para verificar
-- 4. Probar con queries de test (comentadas)
-- 5. Compartir resultados
-- ============================================
