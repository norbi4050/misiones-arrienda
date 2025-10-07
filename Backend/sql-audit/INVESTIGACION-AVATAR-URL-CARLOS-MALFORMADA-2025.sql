-- Investigación: ¿Por qué la URL del avatar de Carlos tiene formato incorrecto?
-- Fecha: 2025-01-07
-- Problema: URL tiene /avatar/ duplicado causando 400 Bad Request

-- ============================================
-- PASO 1: Verificar URL guardada en la base de datos
-- ============================================

SELECT 
    id,
    name,
    email,
    avatar,
    "companyName"
FROM "User"
WHERE id = '6403f9d2-e846-4c70-87e0-e051127d9500';

-- Resultado esperado:
-- avatar: ¿Tiene /avatar/ duplicado?

-- ============================================
-- PASO 2: Verificar todos los avatares con formato incorrecto
-- ============================================

SELECT 
    id,
    name,
    email,
    avatar,
    CASE 
        WHEN avatar LIKE '%/avatar/avatar/%' THEN 'DUPLICADO /avatar/avatar/'
        WHEN avatar LIKE '%/avatar/%avatar%' THEN 'DUPLICADO /avatar/...avatar'
        WHEN avatar LIKE '%avatar%avatar%' THEN 'CONTIENE avatar DUPLICADO'
        ELSE 'OK'
    END as diagnostico
FROM "User"
WHERE avatar IS NOT NULL
ORDER BY diagnostico DESC;

-- ============================================
-- PASO 3: Contar avatares con problema
-- ============================================

SELECT 
    COUNT(*) as total_users_con_avatar,
    COUNT(CASE WHEN avatar LIKE '%/avatar/avatar/%' OR avatar LIKE '%/avatar/%avatar%' THEN 1 END) as avatares_con_problema,
    COUNT(CASE WHEN avatar NOT LIKE '%/avatar/avatar/%' AND avatar NOT LIKE '%/avatar/%avatar%' THEN 1 END) as avatares_ok
FROM "User"
WHERE avatar IS NOT NULL;

-- ============================================
-- PASO 4: Ver estructura correcta vs incorrecta
-- ============================================

-- Estructura CORRECTA debería ser:
-- https://PROJECT.supabase.co/storage/v1/object/public/avatars/USER_ID/TIMESTAMP-avatar.jpg

-- Estructura INCORRECTA actual:
-- https://PROJECT.supabase.co/storage/v1/object/public/avatars/USER_ID/avatar/TIMESTAMP-avatar.jpg
--                                                                              ^^^^^^^ EXTRA

-- ============================================
-- FIX: Normalizar URLs de avatares
-- ============================================

-- Opción 1: Remover /avatar/ extra de la URL
UPDATE "User"
SET avatar = REPLACE(avatar, '/avatar/avatar/', '/avatar/')
WHERE avatar LIKE '%/avatar/avatar/%';

-- Opción 2: Remover cualquier /avatar/ que esté antes del nombre del archivo
UPDATE "User"
SET avatar = REGEXP_REPLACE(
    avatar, 
    '(/avatars/[^/]+)/avatar/([0-9]+-avatar\.(jpg|jpeg|png|webp))', 
    '\1/\2'
)
WHERE avatar ~ '/avatars/[^/]+/avatar/[0-9]+-avatar\.(jpg|jpeg|png|webp)';

-- ============================================
-- VERIFICACIÓN POST-FIX
-- ============================================

SELECT 
    id,
    name,
    avatar,
    CASE 
        WHEN avatar LIKE '%/avatar/avatar/%' THEN '❌ AÚN TIENE PROBLEMA'
        ELSE '✅ OK'
    END as estado
FROM "User"
WHERE id = '6403f9d2-e846-4c70-87e0-e051127d9500';

-- ============================================
-- DIAGNÓSTICO: ¿Dónde se genera el problema?
-- ============================================

-- Posibles causas:
-- 1. El endpoint de upload guarda mal la URL
-- 2. Hay un helper que construye mal la URL
-- 3. El bucket de Supabase tiene configuración incorrecta

-- Archivos a revisar:
-- - src/app/api/users/avatar/route.ts (endpoint de upload)
-- - src/app/api/upload/avatar/route.ts (endpoint alternativo)
-- - Cualquier helper que construya URLs de avatares
