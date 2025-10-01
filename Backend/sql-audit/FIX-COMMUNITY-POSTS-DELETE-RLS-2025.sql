-- ============================================
-- FIX: Políticas RLS para DELETE en community_posts
-- Fecha: 2025-01-XX
-- Problema: Error "operator does not exist: text = uuid"
-- Solución: Las políticas YA están correctas, solo falta verificar
-- ============================================

-- DIAGNÓSTICO: Las políticas actuales son CORRECTAS
-- ✅ cp_delete_own: (user_id = (auth.uid())::text)
-- ✅ cp_update_own: (user_id = (auth.uid())::text)

-- El error viene de queries directas que no usan el cast.
-- Las políticas RLS ya funcionan correctamente.

-- ============================================
-- VERIFICACIÓN: Probar soft delete desde la aplicación
-- ============================================

-- 1. Ver tus posts activos (con cast correcto)
SELECT 
    id,
    title,
    user_id,
    is_active,
    status,
    created_at
FROM community_posts
WHERE user_id = (auth.uid())::text
  AND is_active = true
ORDER BY created_at DESC
LIMIT 10;

-- 2. Soft delete de un post (marca como inactivo)
-- Reemplazar 'YOUR_POST_ID' con un ID real de tu post
/*
UPDATE community_posts
SET 
    is_active = false,
    status = 'ARCHIVED',
    updated_at = now()
WHERE id = 'YOUR_POST_ID'
  AND user_id = (auth.uid())::text
RETURNING id, title, is_active, status;
*/

-- 3. Restaurar un post (reactivar)
/*
UPDATE community_posts
SET 
    is_active = true,
    status = 'ACTIVE',
    updated_at = now()
WHERE id = 'YOUR_POST_ID'
  AND user_id = (auth.uid())::text
RETURNING id, title, is_active, status;
*/

-- 4. Hard delete (eliminar permanentemente) - NO RECOMENDADO
-- Solo usar si realmente quieres borrar el post para siempre
/*
DELETE FROM community_posts
WHERE id = 'YOUR_POST_ID'
  AND user_id = (auth.uid())::text
RETURNING id, title;
*/

-- ============================================
-- VERIFICAR QUE LAS POLÍTICAS FUNCIONAN
-- ============================================

-- 5. Intentar eliminar un post que NO es tuyo (debería fallar)
/*
DELETE FROM community_posts
WHERE id = 'POST_ID_DE_OTRO_USUARIO';
-- Resultado esperado: 0 rows affected (la política RLS lo bloquea)
*/

-- 6. Ver posts archivados (inactivos)
SELECT 
    id,
    title,
    user_id,
    is_active,
    status,
    created_at,
    updated_at
FROM community_posts
WHERE user_id = (auth.uid())::text
  AND is_active = false
ORDER BY updated_at DESC
LIMIT 10;

-- ============================================
-- CONCLUSIÓN
-- ============================================
-- ✅ Las políticas RLS YA ESTÁN CORRECTAS
-- ✅ cp_delete_own permite DELETE solo al dueño
-- ✅ cp_update_own permite UPDATE (soft delete) solo al dueño
-- ✅ El cast (auth.uid())::text está aplicado correctamente
--
-- El error "operator does not exist: text = uuid" viene de:
-- - Queries directas en SQL Editor sin el cast
-- - NO de las políticas RLS (que ya tienen el cast)
--
-- SOLUCIÓN: Siempre usar (auth.uid())::text en queries manuales
-- ============================================
