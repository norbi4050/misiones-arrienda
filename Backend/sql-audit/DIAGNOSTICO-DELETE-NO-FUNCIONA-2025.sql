-- ============================================
-- DIAGNÓSTICO: DELETE no actualiza is_active
-- Fecha: 2025-01-XX
-- Problema: DELETE retorna 200 pero el post sigue activo
-- ============================================

-- 1. Ver el post específico que intentaste borrar
SELECT 
    id,
    user_id,
    title,
    is_active,
    status,
    created_at,
    updated_at
FROM community_posts
WHERE id = 'bca048e2-f50a-405e-9bf1-2ad2e06c7636';

-- 2. Ver TODOS tus posts (activos e inactivos)
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

-- 3. Intentar UPDATE manual (soft delete)
-- Reemplazar con el ID del post que quieres borrar
UPDATE community_posts
SET 
    is_active = false,
    status = 'ARCHIVED',
    updated_at = now()
WHERE id = 'bca048e2-f50a-405e-9bf1-2ad2e06c7636'
  AND user_id = (auth.uid())::text
RETURNING id, title, is_active, status, updated_at;

-- 4. Verificar si el UPDATE funcionó
SELECT 
    id,
    title,
    is_active,
    status,
    updated_at
FROM community_posts
WHERE id = 'bca048e2-f50a-405e-9bf1-2ad2e06c7636';

-- 5. Ver políticas RLS que afectan UPDATE
SELECT 
    policyname,
    cmd,
    qual::text as using_clause,
    with_check::text as with_check_clause
FROM pg_policies
WHERE tablename = 'community_posts'
  AND cmd = 'UPDATE';

-- 6. Verificar si hay triggers que puedan estar bloqueando
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'community_posts';

-- ============================================
-- POSIBLES CAUSAS:
-- ============================================
-- 1. Política RLS UPDATE bloqueando (WITH CHECK clause)
-- 2. Trigger que revierte el cambio
-- 3. Columna is_active con constraint o default
-- 4. Problema de permisos en Supabase

-- ============================================
-- INSTRUCCIONES:
-- ============================================
-- 1. Ejecutar query 1 para ver el estado actual del post
-- 2. Ejecutar query 3 para intentar UPDATE manual
-- 3. Ejecutar query 4 para verificar si funcionó
-- 4. Ejecutar queries 5 y 6 para ver políticas y triggers
-- 5. Compartir TODOS los resultados
-- ============================================
