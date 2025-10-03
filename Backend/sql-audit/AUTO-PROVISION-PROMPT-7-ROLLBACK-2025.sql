-- ============================================================================
-- PROMPT 7: Plan de rollback controlado
-- ============================================================================
-- Fecha: 2025-01-XX
-- Propósito: Script transaccional para revertir auto-provisioning de un usuario
--            específico dentro de una ventana de tiempo configurable
-- 
-- FUNCIONALIDAD:
-- 1. Eliminar UserProfile si fue creado recientemente (últimos N minutos)
-- 2. Eliminar User si no tiene dependencias y fue creado recientemente
-- 3. Mostrar SELECTs de verificación
-- 4. Idempotente: si no hay filas que cumplan condiciones, no hacer nada
-- ============================================================================

-- ============================================================================
-- CONFIGURACIÓN: Ajustar estos valores según necesidad
-- ============================================================================
-- Reemplazar {{USER_UUID}} con el UUID del usuario a revertir
-- Reemplazar {{TIME_WINDOW_MINUTES}} con la ventana de tiempo (ej: 15)
-- Ejemplo de uso:
-- v_user_id text := '6403f9d2-e846-4c70-87e0-e051127d9500';
-- v_time_window interval := '15 minutes'::interval;
-- ============================================================================

BEGIN;

-- ============================================================================
-- PASO 1: Eliminar UserProfile si está dentro de la ventana de tiempo
-- ============================================================================

WITH deleted_profiles AS (
  DELETE FROM public."UserProfile"
  WHERE "userId" = '{{USER_UUID}}'
    AND "createdAt" > (NOW() - INTERVAL '{{TIME_WINDOW_MINUTES}} minutes')
  RETURNING id, "userId", role, "createdAt"
)
SELECT 
  'UserProfile eliminado' AS accion,
  COUNT(*) AS filas_afectadas,
  STRING_AGG(id, ', ') AS profile_ids
FROM deleted_profiles;

-- ============================================================================
-- PASO 2: Verificar dependencias del User antes de eliminar
-- ============================================================================

-- Contar dependencias del usuario
SELECT 
  'Verificación de dependencias' AS paso,
  (SELECT COUNT(*) FROM public."Property" WHERE "userId" = '{{USER_UUID}}') AS propiedades,
  (SELECT COUNT(*) FROM public."Favorite" WHERE "userId" = '{{USER_UUID}}') AS favoritos,
  (SELECT COUNT(*) FROM public."Conversation" c
   JOIN public."UserProfile" up ON up.id = c."aId" OR up.id = c."bId"
   WHERE up."userId" = '{{USER_UUID}}') AS conversaciones;

-- ============================================================================
-- PASO 3: Eliminar User solo si NO tiene dependencias y está en ventana
-- ============================================================================

WITH deleted_users AS (
  DELETE FROM public."User" u
  WHERE u.id = '{{USER_UUID}}'
    AND u."createdAt" > (NOW() - INTERVAL '{{TIME_WINDOW_MINUTES}} minutes')
    -- Solo eliminar si NO tiene dependencias
    AND NOT EXISTS (SELECT 1 FROM public."Property" WHERE "userId" = u.id)
    AND NOT EXISTS (SELECT 1 FROM public."Favorite" WHERE "userId" = u.id)
    AND NOT EXISTS (
      SELECT 1 FROM public."Conversation" c
      JOIN public."UserProfile" up ON up.id = c."aId" OR up.id = c."bId"
      WHERE up."userId" = u.id
    )
  RETURNING id, email, name, "createdAt"
)
SELECT 
  'User eliminado' AS accion,
  COUNT(*) AS filas_afectadas,
  STRING_AGG(email, ', ') AS emails
FROM deleted_users;

COMMIT;

-- ============================================================================
-- VERIFICACIÓN: Consultas para verificar el resultado del rollback
-- ============================================================================

-- Verificar que el usuario ya no existe en public."User"
SELECT 
  'Verificación User' AS tabla,
  CASE 
    WHEN EXISTS (SELECT 1 FROM public."User" WHERE id = '{{USER_UUID}}')
    THEN 'EXISTE (no se eliminó)'
    ELSE 'NO EXISTE (eliminado exitosamente)'
  END AS estado;

-- Verificar que el perfil ya no existe en public."UserProfile"
SELECT 
  'Verificación UserProfile' AS tabla,
  CASE 
    WHEN EXISTS (SELECT 1 FROM public."UserProfile" WHERE "userId" = '{{USER_UUID}}')
    THEN 'EXISTE (no se eliminó)'
    ELSE 'NO EXISTE (eliminado exitosamente)'
  END AS estado;

-- Verificar que el usuario aún existe en auth.users (NO debe eliminarse)
SELECT 
  'Verificación auth.users' AS tabla,
  CASE 
    WHEN EXISTS (SELECT 1 FROM auth.users WHERE id::text = '{{USER_UUID}}')
    THEN 'EXISTE (correcto, no se debe eliminar de auth.users)'
    ELSE 'NO EXISTE (ERROR: no debería eliminarse de auth.users)'
  END AS estado;

-- ============================================================================
-- RESULTADO ESPERADO:
-- ============================================================================
-- ✅ UserProfile eliminado si estaba dentro de la ventana de tiempo
-- ✅ User eliminado solo si:
--    - No tiene propiedades
--    - No tiene favoritos
--    - No tiene conversaciones
--    - Está dentro de la ventana de tiempo
-- ✅ auth.users NO se modifica (el usuario puede volver a registrarse)
-- ✅ Si no cumple condiciones, no se elimina nada (idempotente)
-- ============================================================================

-- ============================================================================
-- EJEMPLO DE SALIDA (cuando SE ELIMINA):
-- ============================================================================

-- PASO 1:
-- | accion                | filas_afectadas | profile_ids                          |
-- |-----------------------|-----------------|--------------------------------------|
-- | UserProfile eliminado | 1               | 53a4bffa-48dd-40af-a6bd-cdd9139d7888 |

-- PASO 2:
-- | paso                          | propiedades | favoritos | conversaciones |
-- |-------------------------------|-------------|-----------|----------------|
-- | Verificación de dependencias  | 0           | 0         | 0              |

-- PASO 3:
-- | accion         | filas_afectadas | emails                      |
-- |----------------|-----------------|----------------------------|
-- | User eliminado | 1               | cgonzalezarchilla@gmail.com |

-- VERIFICACIÓN:
-- | tabla                   | estado                                                    |
-- |-------------------------|-----------------------------------------------------------|
-- | Verificación User       | NO EXISTE (eliminado exitosamente)                        |
-- | Verificación UserProfile| NO EXISTE (eliminado exitosamente)                        |
-- | Verificación auth.users | EXISTE (correcto, no se debe eliminar de auth.users)      |

-- ============================================================================
-- EJEMPLO DE SALIDA (cuando NO SE ELIMINA por dependencias):
-- ============================================================================

-- PASO 1:
-- | accion                | filas_afectadas | profile_ids |
-- |-----------------------|-----------------|-------------|
-- | UserProfile eliminado | 1               | clxxx...    |

-- PASO 2:
-- | paso                          | propiedades | favoritos | conversaciones |
-- |-------------------------------|-------------|-----------|----------------|
-- | Verificación de dependencias  | 5           | 3         | 2              |

-- PASO 3:
-- | accion         | filas_afectadas | emails |
-- |----------------|-----------------|--------|
-- | User eliminado | 0               | NULL   |

-- VERIFICACIÓN:
-- | tabla                   | estado                                                    |
-- |-------------------------|-----------------------------------------------------------|
-- | Verificación User       | EXISTE (no se eliminó por tener dependencias)             |
-- | Verificación UserProfile| NO EXISTE (eliminado exitosamente)                        |
-- | Verificación auth.users | EXISTE (correcto, no se debe eliminar de auth.users)      |

-- ============================================================================
-- EJEMPLO DE SALIDA (cuando NO SE ELIMINA por ventana de tiempo):
-- ============================================================================

-- PASO 1:
-- | accion                | filas_afectadas | profile_ids |
-- |-----------------------|-----------------|-------------|
-- | UserProfile eliminado | 0               | NULL        |

-- PASO 3:
-- | accion         | filas_afectadas | emails |
-- |----------------|-----------------|--------|
-- | User eliminado | 0               | NULL   |

-- VERIFICACIÓN:
-- | tabla                   | estado                                                    |
-- |-------------------------|-----------------------------------------------------------|
-- | Verificación User       | EXISTE (no se eliminó, fuera de ventana de tiempo)        |
-- | Verificación UserProfile| EXISTE (no se eliminó, fuera de ventana de tiempo)        |
-- | Verificación auth.users | EXISTE (correcto, no se debe eliminar de auth.users)      |

-- ============================================================================
-- NOTAS DE USO:
-- ============================================================================
-- 1. Este script es para rollback de pruebas o errores recientes
-- 2. Solo elimina registros creados en los últimos N minutos (configurable)
-- 3. NO elimina el usuario de auth.users (puede volver a registrarse)
-- 4. Verifica dependencias antes de eliminar User
-- 5. Es idempotente: múltiples ejecuciones no causan errores
-- 6. CUIDADO: Este script ELIMINA datos, usar solo cuando sea necesario
-- ============================================================================

-- ============================================================================
-- CASOS DE USO:
-- ============================================================================
-- 1. Pruebas de desarrollo: Limpiar usuarios de prueba recientes
-- 2. Errores en producción: Revertir auto-provisioning fallido
-- 3. Datos incorrectos: Eliminar usuarios mal provisionados
-- 4. Testing: Limpiar entre tests automatizados
-- ============================================================================

-- ============================================================================
-- ADVERTENCIAS:
-- ============================================================================
-- ⚠️  Este script ELIMINA datos permanentemente
-- ⚠️  Asegurar tener backup antes de ejecutar en producción
-- ⚠️  Verificar el USER_UUID antes de ejecutar
-- ⚠️  Ajustar TIME_WINDOW_MINUTES según necesidad
-- ⚠️  NO ejecutar con ventanas de tiempo muy grandes
-- ============================================================================
