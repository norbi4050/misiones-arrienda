-- Investigación: ¿El archivo del avatar existe en Supabase Storage?
-- Fecha: 2025-01-07
-- Problema: 400 Bad Request - El archivo no existe en el bucket

-- ============================================
-- DIAGNÓSTICO
-- ============================================

-- La URL corregida es:
-- https://qfeyhaaxyemmnohqdele.supabase.co/storage/v1/object/public/avatars/6403f9d2-e846-4c70-87e0-e051127d9500/1758491838092-avatar.jpg

-- Pero Supabase devuelve 400 Bad Request
-- Esto significa que el archivo NO EXISTE en esa ubicación

-- ============================================
-- POSIBLES CAUSAS
-- ============================================

-- 1. El archivo nunca se subió
-- 2. El archivo se subió en una ubicación diferente
-- 3. El archivo se eliminó
-- 4. El bucket "avatars" no existe o no es público

-- ============================================
-- SOLUCIÓN TEMPORAL: Usar fallback
-- ============================================

-- Opción A: Dejar que SafeAvatar muestre la inicial (comportamiento actual)
-- Opción B: Eliminar la URL del avatar para que no intente cargarla

UPDATE "User"
SET avatar = NULL
WHERE id = '6403f9d2-e846-4c70-87e0-e051127d9500';

-- ============================================
-- SOLUCIÓN PERMANENTE: Re-subir el avatar
-- ============================================

-- El usuario Carlos González necesita:
-- 1. Ir a su perfil
-- 2. Subir un nuevo avatar
-- 3. El sistema guardará la URL correcta

-- O podemos crear un avatar de prueba para él

-- ============================================
-- VERIFICAR BUCKET DE AVATARS
-- ============================================

-- Verificar si el bucket "avatars" existe y es público
-- (Esto se hace desde el panel de Supabase, no con SQL)

-- Estructura esperada del bucket:
-- avatars/
--   └── USER_ID/
--       └── TIMESTAMP-avatar.jpg

-- ============================================
-- RECOMENDACIÓN
-- ============================================

-- Por ahora, la mejor solución es:
-- 1. Dejar avatar = NULL para que muestre la inicial "C"
-- 2. Que el usuario suba un nuevo avatar cuando quiera
-- 3. El SafeAvatar ya maneja correctamente el fallback
