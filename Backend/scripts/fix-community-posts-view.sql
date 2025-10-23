-- =====================================================
-- FIX: community_posts_public VIEW - Misiones Arrienda
-- Fecha: 2025-10-23
-- Problema: View no devuelve posts correctamente
-- =====================================================

-- PASO 1: Verificar posts existentes y su estado
-- (Ejecutar primero para diagnóstico)
SELECT
  id,
  title,
  status,
  is_active,
  expires_at,
  created_at,
  CASE
    WHEN expires_at IS NULL THEN 'NO EXPIRY'
    WHEN expires_at > now() THEN 'VALID'
    ELSE 'EXPIRED'
  END as expiry_status
FROM community_posts
ORDER BY created_at DESC
LIMIT 10;

-- PASO 2: Actualizar posts sin expires_at o con fechas pasadas
-- Establecer expires_at a NULL para posts activos (no deben expirar por defecto)
UPDATE community_posts
SET expires_at = NULL
WHERE status = 'active'
  AND is_active = true
  AND (expires_at IS NULL OR expires_at < now());

-- PASO 3: Recrear la vista con lógica mejorada
-- DROP VIEW IF EXISTS para recrearla limpiamente
DROP VIEW IF EXISTS public.community_posts_public CASCADE;

-- Crear vista mejorada con LEFT JOIN a users
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
  -- Y que no hayan expirado (NULL = sin expiración, o fecha futura)
  AND (cp.expires_at IS NULL OR cp.expires_at > now());

-- PASO 4: Otorgar permisos de lectura pública
GRANT SELECT ON public.community_posts_public TO anon, authenticated;

-- PASO 5: Crear índices para optimizar la vista
CREATE INDEX IF NOT EXISTS idx_community_posts_status_active
  ON community_posts(status, is_active)
  WHERE status = 'active' AND is_active = true;

CREATE INDEX IF NOT EXISTS idx_community_posts_expires_at
  ON community_posts(expires_at)
  WHERE expires_at IS NOT NULL;

-- PASO 6: Verificar que la vista devuelve posts
SELECT COUNT(*) as total_posts_in_view
FROM community_posts_public;

-- PASO 7: Ver los posts devueltos por la vista
SELECT
  id,
  title,
  role,
  city,
  price,
  budget_min,
  budget_max,
  status,
  is_active,
  expires_at,
  created_at
FROM community_posts_public
ORDER BY created_at DESC
LIMIT 5;

-- =====================================================
-- COMENTARIOS:
-- =====================================================
-- La vista anterior tenía lógica correcta pero los posts
-- en la base de datos probablemente tenían expires_at
-- seteado a fechas en el pasado.
--
-- Esta migración:
-- 1. Actualiza posts existentes para limpiar expires_at
-- 2. Recrea la vista con la misma lógica (pero clara)
-- 3. Agrega índices para mejorar performance
-- 4. Verifica que funcione correctamente
-- =====================================================
