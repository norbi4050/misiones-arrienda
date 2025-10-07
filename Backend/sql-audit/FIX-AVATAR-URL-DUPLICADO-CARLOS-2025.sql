-- Fix: Corregir URL del avatar de Carlos González (y todos los avatares con /avatar/ duplicado)
-- Fecha: 2025-01-07
-- Problema: URL tiene /avatar/ extra causando 400 Bad Request

-- ============================================
-- PASO 1: BACKUP - Guardar URLs actuales
-- ============================================

-- Crear tabla temporal de backup (por seguridad)
CREATE TEMP TABLE avatar_urls_backup AS
SELECT id, name, email, avatar
FROM "User"
WHERE avatar IS NOT NULL;

-- Verificar backup
SELECT COUNT(*) as total_backed_up FROM avatar_urls_backup;

-- ============================================
-- PASO 2: FIX - Corregir URLs con /avatar/ duplicado
-- ============================================

-- Remover /avatar/ extra de la URL
-- ANTES: .../avatars/USER_ID/avatar/TIMESTAMP-avatar.jpg
-- DESPUÉS: .../avatars/USER_ID/TIMESTAMP-avatar.jpg

UPDATE "User"
SET avatar = REGEXP_REPLACE(
    avatar,
    '(/avatars/[^/]+)/avatar/([0-9]+-avatar\.(jpg|jpeg|png|webp|gif))',
    '\1/\2',
    'g'
)
WHERE avatar ~ '/avatars/[^/]+/avatar/[0-9]+-avatar\.(jpg|jpeg|png|webp|gif)';

-- ============================================
-- PASO 3: VERIFICACIÓN - Confirmar que se corrigió
-- ============================================

SELECT 
    id,
    name,
    email,
    avatar as avatar_corregido,
    CASE 
        WHEN avatar LIKE '%/avatar/avatar/%' OR avatar LIKE '%/avatar/%avatar%' THEN '❌ AÚN TIENE PROBLEMA'
        ELSE '✅ CORREGIDO'
    END as estado
FROM "User"
WHERE id = '6403f9d2-e846-4c70-87e0-e051127d9500';

-- ============================================
-- PASO 4: VERIFICACIÓN GLOBAL - Todos los avatares
-- ============================================

SELECT 
    COUNT(*) as total_users_con_avatar,
    COUNT(CASE WHEN avatar LIKE '%/avatar/avatar/%' OR avatar LIKE '%/avatar/%avatar%' THEN 1 END) as avatares_con_problema,
    COUNT(CASE WHEN avatar NOT LIKE '%/avatar/avatar/%' AND avatar NOT LIKE '%/avatar/%avatar%' THEN 1 END) as avatares_ok
FROM "User"
WHERE avatar IS NOT NULL;

-- Resultado esperado:
-- total_users_con_avatar: 1
-- avatares_con_problema: 0  ← Debería ser 0 después del fix
-- avatares_ok: 1             ← Debería ser 1 después del fix

-- ============================================
-- PASO 5: COMPARACIÓN ANTES/DESPUÉS
-- ============================================

SELECT 
    'ANTES' as momento,
    b.avatar as url
FROM avatar_urls_backup b
WHERE b.id = '6403f9d2-e846-4c70-87e0-e051127d9500'

UNION ALL

SELECT 
    'DESPUÉS' as momento,
    u.avatar as url
FROM "User" u
WHERE u.id = '6403f9d2-e846-4c70-87e0-e051127d9500';

-- ============================================
-- ROLLBACK (si algo sale mal)
-- ============================================

-- Si necesitas revertir los cambios:
-- UPDATE "User" u
-- SET avatar = b.avatar
-- FROM avatar_urls_backup b
-- WHERE u.id = b.id;

-- ============================================
-- LIMPIEZA
-- ============================================

-- Eliminar tabla temporal de backup
-- DROP TABLE IF EXISTS avatar_urls_backup;
