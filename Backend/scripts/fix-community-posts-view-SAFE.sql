-- =====================================================
-- FIX SEGURO: community_posts_public VIEW
-- Misiones Arrienda - 2025-10-23
-- =====================================================
-- PROBLEMA IDENTIFICADO:
-- La vista está correcta, pero los posts tienen expires_at
-- seteado en el pasado, causando que no aparezcan.
--
-- SOLUCIÓN SEGURA:
-- Solo recrear la vista (sin tocar datos) y verificar
-- =====================================================

-- ========================================
-- PASO 1: DIAGNÓSTICO
-- ========================================
-- Ver el estado actual de los posts
SELECT
  id,
  title,
  status,
  is_active,
  expires_at,
  created_at,
  CASE
    WHEN expires_at IS NULL THEN '✅ SIN EXPIRACIÓN (OK)'
    WHEN expires_at > now() THEN '✅ VÁLIDO (expira en el futuro)'
    ELSE '❌ EXPIRADO (expires_at en el pasado)'
  END as estado_expiracion
FROM community_posts
ORDER BY created_at DESC
LIMIT 10;

-- Ver cuántos posts hay por estado
SELECT
  status,
  is_active,
  COUNT(*) as total,
  COUNT(CASE WHEN expires_at IS NULL THEN 1 END) as sin_expiracion,
  COUNT(CASE WHEN expires_at > now() THEN 1 END) as validos,
  COUNT(CASE WHEN expires_at <= now() THEN 1 END) as expirados
FROM community_posts
GROUP BY status, is_active
ORDER BY status, is_active;

-- ========================================
-- PASO 2: RECREAR LA VISTA (SEGURO)
-- ========================================
-- Esta operación NO modifica ningún dato
-- Solo recrea la vista para asegurar que esté bien definida

DROP VIEW IF EXISTS public.community_posts_public CASCADE;

CREATE OR REPLACE VIEW public.community_posts_public AS
SELECT
  cp.id,
  cp.user_id,
  cp.role,
  cp.title,
  cp.description,
  cp.city,
  cp.neighborhood,
  cp.budget_min,
  cp.budget_max,
  cp.price,
  cp.available_from,
  cp.lease_term,
  cp.room_type,
  cp.occupants,
  cp.gender_pref,
  cp.pet_pref,
  cp.smoke_pref,
  cp.diet,
  cp.amenities,
  cp.tags,
  cp.images,
  cp.accepts_messages,
  cp.is_active,
  cp.highlighted_until,
  cp.expires_at,
  cp.created_at,
  cp.updated_at,
  cp.views_count,
  cp.status,
  u.name AS author_name,
  u.avatar AS author_photo
FROM community_posts cp
LEFT JOIN users u ON cp.user_id = u.id
WHERE
  -- Solo posts activos
  cp.is_active = true
  AND cp.status = 'active'
  -- Y que no hayan expirado
  AND (cp.expires_at IS NULL OR cp.expires_at > now());

-- Otorgar permisos públicos
GRANT SELECT ON public.community_posts_public TO anon, authenticated;

-- ========================================
-- PASO 3: OPTIMIZAR CON ÍNDICES
-- ========================================
CREATE INDEX IF NOT EXISTS idx_community_posts_status_active
  ON community_posts(status, is_active)
  WHERE status = 'active' AND is_active = true;

CREATE INDEX IF NOT EXISTS idx_community_posts_expires_at
  ON community_posts(expires_at)
  WHERE expires_at IS NOT NULL;

-- ========================================
-- PASO 4: VERIFICACIÓN
-- ========================================
-- Ver cuántos posts devuelve la vista
SELECT COUNT(*) as posts_visibles_en_vista_publica
FROM community_posts_public;

-- Ver los posts que SÍ aparecen en la vista
SELECT
  id,
  title,
  role,
  city,
  status,
  is_active,
  expires_at,
  created_at
FROM community_posts_public
ORDER BY created_at DESC;

-- ========================================
-- PASO 5: ENCONTRAR EL PROBLEMA
-- ========================================
-- Ver posts que DEBERÍAN aparecer pero NO aparecen
-- (posts activos pero con expires_at en el pasado)
SELECT
  id,
  title,
  status,
  is_active,
  expires_at,
  created_at,
  '❌ Este post NO aparece porque expires_at está en el pasado' as razon
FROM community_posts
WHERE status = 'active'
  AND is_active = true
  AND expires_at IS NOT NULL
  AND expires_at <= now()
ORDER BY created_at DESC;

-- ========================================
-- DIAGNÓSTICO FINAL
-- ========================================
-- Este SELECT te dirá exactamente cuál es el problema:
SELECT
  'Posts activos en tabla' as metrica,
  COUNT(*) as cantidad
FROM community_posts
WHERE status = 'active' AND is_active = true

UNION ALL

SELECT
  'Posts visibles en vista pública' as metrica,
  COUNT(*) as cantidad
FROM community_posts_public

UNION ALL

SELECT
  'Posts activos PERO expirados (problema)' as metrica,
  COUNT(*) as cantidad
FROM community_posts
WHERE status = 'active'
  AND is_active = true
  AND expires_at IS NOT NULL
  AND expires_at <= now();

-- ========================================
-- NOTAS IMPORTANTES
-- ========================================
--
-- ¿Por qué algunos posts tienen expires_at en el pasado?
--
-- El sistema funciona así:
-- 1. Cuando CREAS un post: expires_at = NULL (sin expiración)
-- 2. Cuando PUBLICAS un post: expires_at = now() + 30 días
-- 3. Cron job diario: marca como 'inactive' los posts con expires_at < now()
--
-- Si hay posts con status='active' PERO expires_at < now(),
-- significa que el cron job no ha corrido o falló.
--
-- SOLUCIÓN RECOMENDADA:
-- Ejecutar manualmente el endpoint del cron:
-- POST /api/properties/expire-cleanup
--
-- O actualizar manualmente los posts expirados:
-- UPDATE community_posts
-- SET status = 'inactive'
-- WHERE status = 'active'
--   AND expires_at IS NOT NULL
--   AND expires_at <= now();
--
-- ========================================
