-- ============================================
-- FIX: Corregir URL de Avatar de Carlos González
-- ============================================
-- Problema: URL tiene carpeta /avatar/ extra que causa error 400
-- URL Incorrecta: .../avatars/6403f9d2.../avatar/1758491838092-avatar.jpg
-- URL Correcta: .../avatars/6403f9d2.../avatar.jpg
-- ============================================

-- PASO 1: Verificar URL actual
-- ============================================
SELECT 
  'URL_ACTUAL' as tipo,
  id,
  name,
  profile_image
FROM users
WHERE id = '6403f9d2-e846-4c70-87e0-e051127d9500';

-- PASO 2: Corregir URL (quitar carpeta /avatar/ y timestamp)
-- ============================================
UPDATE users
SET profile_image = REPLACE(
  profile_image,
  '/avatar/1758491838092-avatar.jpg',
  '/avatar.jpg'
),
updated_at = NOW()
WHERE id = '6403f9d2-e846-4c70-87e0-e051127d9500';

-- PASO 3: Verificar que se corrigió
-- ============================================
SELECT 
  'URL_CORREGIDA' as tipo,
  id,
  name,
  profile_image,
  updated_at
FROM users
WHERE id = '6403f9d2-e846-4c70-87e0-e051127d9500';

-- ============================================
-- RESULTADO ESPERADO:
-- ============================================
-- profile_image = "https://qfeyhaaxyemmnohqdele.supabase.co/storage/v1/object/public/avatars/6403f9d2-e846-4c70-87e0-e051127d9500/avatar.jpg"
-- ============================================

-- PASO 4: Verificar que el archivo existe en Storage
-- ============================================
-- NOTA: Esto debe verificarse manualmente en Supabase Dashboard
-- Storage → avatars → 6403f9d2-e846-4c70-87e0-e051127d9500/
-- Debe existir archivo: avatar.jpg
-- ============================================

-- PASO 5 (ALTERNATIVA): Si el archivo NO existe en avatar.jpg
-- ============================================
-- Entonces la solución es RE-SUBIR el avatar desde la UI
-- El código actual lo guardará correctamente como avatar.jpg
-- ============================================
