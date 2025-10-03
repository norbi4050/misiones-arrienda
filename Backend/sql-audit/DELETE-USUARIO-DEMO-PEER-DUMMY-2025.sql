-- ============================================================================
-- DELETE: Usuario demo peer-dummy@example.com
-- ============================================================================
-- Fecha: 2025-01-XX
-- Usuario: peer-dummy@example.com (ID: 00000000-0000-0000-0000-000000000002)
-- Tipo: Usuario demo/testing que debe ser eliminado
-- ============================================================================

-- ============================================================================
-- PASO 1: Verificar el usuario demo
-- ============================================================================

SELECT 
  id,
  email,
  user_type,
  is_company,
  company_name,
  created_at
FROM users
WHERE id = '00000000-0000-0000-0000-000000000002'
   OR email = 'peer-dummy@example.com';

-- Resultado esperado:
-- id: 00000000-0000-0000-0000-000000000002
-- email: peer-dummy@example.com
-- user_type: NULL
-- is_company: false

-- ============================================================================
-- PASO 2: Verificar si tiene contenido asociado
-- ============================================================================

-- Ver propiedades
SELECT 
  COUNT(*) as total_properties
FROM properties
WHERE user_id::text = '00000000-0000-0000-0000-000000000002';

-- Ver posts de comunidad
SELECT 
  COUNT(*) as total_community_posts
FROM community_posts
WHERE user_id::text = '00000000-0000-0000-0000-000000000002';

-- Ver favoritos
SELECT 
  COUNT(*) as total_favorites
FROM favorites
WHERE user_id::text = '00000000-0000-0000-0000-000000000002';

-- Ver mensajes/conversaciones
SELECT 
  COUNT(*) as total_messages
FROM messages
WHERE sender_id::text = '00000000-0000-0000-0000-000000000002';

-- ============================================================================
-- PASO 3: ELIMINAR el usuario demo y todo su contenido
-- ============================================================================

BEGIN;

-- 1. Eliminar propiedades del usuario demo
DELETE FROM properties
WHERE user_id::text = '00000000-0000-0000-0000-000000000002';

-- 2. Eliminar posts de comunidad del usuario demo
DELETE FROM community_posts
WHERE user_id::text = '00000000-0000-0000-0000-000000000002';

-- 3. Eliminar favoritos del usuario demo
DELETE FROM favorites
WHERE user_id::text = '00000000-0000-0000-0000-000000000002';

-- 4. Eliminar mensajes del usuario demo (si existen)
DELETE FROM messages
WHERE sender_id::text = '00000000-0000-0000-0000-000000000002';

-- 5. Eliminar conversaciones del usuario demo (si existen)
DELETE FROM conversations
WHERE a_id::text = '00000000-0000-0000-0000-000000000002'
   OR b_id::text = '00000000-0000-0000-0000-000000000002';

-- 6. Eliminar el perfil de comunidad del usuario demo (si existe)
DELETE FROM user_profiles
WHERE user_id::text = '00000000-0000-0000-0000-000000000002';

-- 7. Finalmente, eliminar el usuario demo de la tabla users
DELETE FROM users
WHERE id = '00000000-0000-0000-0000-000000000002';

-- 8. Eliminar de auth.users si existe (requiere permisos de admin)
-- NOTA: Esto puede requerir ejecutarse desde el dashboard de Supabase
-- DELETE FROM auth.users
-- WHERE id = '00000000-0000-0000-0000-000000000002';

COMMIT;

-- ============================================================================
-- VERIFICACIÓN FINAL
-- ============================================================================

-- Verificar que el usuario fue eliminado
SELECT COUNT(*) as usuario_demo_eliminado
FROM users
WHERE id = '00000000-0000-0000-0000-000000000002';
-- Debe retornar: 0

-- Verificar que no quedan usuarios sin user_type
SELECT COUNT(*) as usuarios_sin_tipo
FROM users
WHERE user_type IS NULL;
-- Debe retornar: 0

-- Ver distribución final de usuarios
SELECT 
  user_type,
  is_company,
  COUNT(*) as total_usuarios
FROM users
GROUP BY user_type, is_company
ORDER BY total_usuarios DESC;

-- Resultado esperado:
-- inmobiliaria | true  | 1
-- inquilino    | false | 1
-- (No debe haber NULL)

-- ============================================================================
-- INSTRUCCIONES DE USO
-- ============================================================================
-- 1. Ejecutar PASO 1 para confirmar que es el usuario correcto
-- 2. Ejecutar PASO 2 para ver si tiene contenido asociado
-- 3. Ejecutar PASO 3 (todo el bloque BEGIN/COMMIT) para eliminar
-- 4. Ejecutar VERIFICACIÓN FINAL para confirmar
-- 5. Si es necesario, eliminar también de auth.users desde el dashboard
-- ============================================================================

-- ============================================================================
-- NOTAS IMPORTANTES
-- ============================================================================
-- - Este usuario es de testing/demo y debe ser eliminado
-- - La eliminación es en cascada para limpiar todo su contenido
-- - Usar transacción (BEGIN/COMMIT) para poder hacer ROLLBACK si es necesario
-- - Después de esto, NO deben quedar usuarios con user_type = NULL
-- ============================================================================
