-- ============================================================================
-- DIAGNÓSTICO: Propiedades de Inmobiliaria Baldes - Problema de Redirección
-- ============================================================================
-- Fecha: Enero 2025
-- Problema: Propiedades no redirigen correctamente desde perfil público
-- ID Inmobiliaria: a4ef1f3d-c3e8-46df-b186-5b5c837cc14b
-- ============================================================================

-- 1. Verificar que la inmobiliaria existe
SELECT 
  id,
  company_name,
  user_type,
  email,
  created_at
FROM users
WHERE id = 'a4ef1f3d-c3e8-46df-b186-5b5c837cc14b';

-- 2. Ver TODAS las propiedades de esta inmobiliaria (sin filtros)
SELECT 
  id,
  title,
  status,
  is_active,
  price,
  city,
  created_at,
  updated_at
FROM properties
WHERE user_id = 'a4ef1f3d-c3e8-46df-b186-5b5c837cc14b'
ORDER BY created_at DESC;

-- 3. Contar propiedades por estado
SELECT 
  status,
  is_active,
  COUNT(*) as cantidad
FROM properties
WHERE user_id = 'a4ef1f3d-c3e8-46df-b186-5b5c837cc14b'
GROUP BY status, is_active
ORDER BY cantidad DESC;

-- 4. Propiedades que se muestran actualmente (is_active = true)
SELECT 
  id,
  title,
  status,
  is_active,
  price,
  city
FROM properties
WHERE user_id = 'a4ef1f3d-c3e8-46df-b186-5b5c837cc14b'
  AND is_active = true
ORDER BY created_at DESC;

-- 5. Propiedades publicadas (status = 'PUBLISHED')
SELECT 
  id,
  title,
  status,
  is_active,
  price,
  city
FROM properties
WHERE user_id = 'a4ef1f3d-c3e8-46df-b186-5b5c837cc14b'
  AND status = 'PUBLISHED'
ORDER BY created_at DESC;

-- 6. INCONSISTENCIAS: Activas pero NO publicadas
SELECT 
  id,
  title,
  status,
  is_active,
  price,
  city,
  '⚠️ PROBLEMA: Activa pero no publicada' as issue
FROM properties
WHERE user_id = 'a4ef1f3d-c3e8-46df-b186-5b5c837cc14b'
  AND is_active = true
  AND status != 'PUBLISHED'
ORDER BY created_at DESC;

-- 7. INCONSISTENCIAS: Publicadas pero NO activas
SELECT 
  id,
  title,
  status,
  is_active,
  price,
  city,
  '⚠️ PROBLEMA: Publicada pero no activa' as issue
FROM properties
WHERE user_id = 'a4ef1f3d-c3e8-46df-b186-5b5c837cc14b'
  AND status = 'PUBLISHED'
  AND is_active = false
ORDER BY created_at DESC;

-- 8. Verificar si hay propiedades con status NULL o inválido
SELECT 
  id,
  title,
  status,
  is_active,
  CASE 
    WHEN status IS NULL THEN '❌ Status es NULL'
    WHEN status NOT IN ('PUBLISHED', 'DRAFT', 'ARCHIVED') THEN '❌ Status inválido: ' || status
    ELSE '✅ Status válido'
  END as status_check
FROM properties
WHERE user_id = 'a4ef1f3d-c3e8-46df-b186-5b5c837cc14b'
ORDER BY created_at DESC;

-- ============================================================================
-- SOLUCIONES PROPUESTAS (NO EJECUTAR AÚN - SOLO PARA REFERENCIA)
-- ============================================================================

-- OPCIÓN A: Publicar todas las propiedades activas
-- UPDATE properties
-- SET status = 'PUBLISHED'
-- WHERE user_id = 'a4ef1f3d-c3e8-46df-b186-5b5c837cc14b'
--   AND is_active = true
--   AND (status IS NULL OR status != 'PUBLISHED');

-- OPCIÓN B: Activar todas las propiedades publicadas
-- UPDATE properties
-- SET is_active = true
-- WHERE user_id = 'a4ef1f3d-c3e8-46df-b186-5b5c837cc14b'
--   AND status = 'PUBLISHED'
--   AND is_active = false;

-- OPCIÓN C: Sincronizar ambos campos
-- UPDATE properties
-- SET 
--   status = CASE 
--     WHEN is_active = true THEN 'PUBLISHED'
--     ELSE 'DRAFT'
--   END
-- WHERE user_id = 'a4ef1f3d-c3e8-46df-b186-5b5c837cc14b'
--   AND (status IS NULL OR status NOT IN ('PUBLISHED', 'DRAFT', 'ARCHIVED'));

-- ============================================================================
-- FIN DEL DIAGNÓSTICO
-- ============================================================================
