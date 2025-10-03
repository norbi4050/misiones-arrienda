-- ============================================================================
-- PROMPT 5: Guardas de consistencia y alertas
-- ============================================================================
-- Fecha: 2025-01-XX
-- Propósito: SELECTs para detectar inconsistencias y datos inválidos
--            (sin mutar datos, solo para monitoreo)
-- 
-- FUNCIONALIDAD:
-- 1. Listar usuarios desincronizados
-- 2. Listar perfiles inválidos
-- 3. Crear vista de monitoreo (opcional)
-- ============================================================================

-- ============================================================================
-- BLOQUE 1: Usuarios desincronizados
-- ============================================================================

-- Usuarios en auth.users sin espejo en public."User"
SELECT 
  'auth.users sin User' AS tipo_desincronizacion,
  au.id::text AS user_id,
  au.email,
  au.created_at,
  au.raw_user_meta_data->>'full_name' AS full_name,
  au.raw_user_meta_data->>'user_type' AS user_type
FROM auth.users au
LEFT JOIN public."User" u ON u.id = au.id::text
WHERE u.id IS NULL
ORDER BY au.created_at DESC;

-- Usuarios en public."User" sin espejo en public."UserProfile"
SELECT 
  'User sin UserProfile' AS tipo_desincronizacion,
  u.id AS user_id,
  u.email,
  u.name,
  u."createdAt"
FROM public."User" u
LEFT JOIN public."UserProfile" up ON up."userId" = u.id
WHERE up.id IS NULL
ORDER BY u."createdAt" DESC;

-- ============================================================================
-- BLOQUE 2: Perfiles con role inválido
-- ============================================================================

-- Perfiles con role fuera del enum CommunityRole
-- Nota: Esta query puede fallar si todos los roles son válidos (lo cual es bueno)
SELECT 
  'Role inválido' AS tipo_problema,
  up.id AS profile_id,
  up."userId",
  up.role::text AS role_actual,
  u.email
FROM public."UserProfile" up
JOIN public."User" u ON u.id = up."userId"
WHERE up.role NOT IN ('BUSCO'::"CommunityRole", 'OFREZCO'::"CommunityRole")
ORDER BY up."createdAt" DESC;

-- ============================================================================
-- BLOQUE 3: Perfiles con city nula o vacía
-- ============================================================================

SELECT 
  'City nula o vacía' AS tipo_problema,
  up.id AS profile_id,
  up."userId",
  up.city,
  u.email
FROM public."UserProfile" up
JOIN public."User" u ON u.id = up."userId"
WHERE up.city IS NULL 
   OR up.city = ''
   OR TRIM(up.city) = ''
ORDER BY up."createdAt" DESC;

-- ============================================================================
-- BLOQUE 4: Perfiles con budgets nulos o negativos
-- ============================================================================

-- Perfiles con budgetMin nulo o negativo
SELECT 
  'budgetMin inválido' AS tipo_problema,
  up.id AS profile_id,
  up."userId",
  up."budgetMin",
  up."budgetMax",
  u.email
FROM public."UserProfile" up
JOIN public."User" u ON u.id = up."userId"
WHERE up."budgetMin" IS NULL 
   OR up."budgetMin" < 0
ORDER BY up."createdAt" DESC;

-- Perfiles con budgetMax nulo o negativo
SELECT 
  'budgetMax inválido' AS tipo_problema,
  up.id AS profile_id,
  up."userId",
  up."budgetMin",
  up."budgetMax",
  u.email
FROM public."UserProfile" up
JOIN public."User" u ON u.id = up."userId"
WHERE up."budgetMax" IS NULL 
   OR up."budgetMax" < 0
ORDER BY up."createdAt" DESC;

-- Perfiles con budgetMin > budgetMax (lógica inválida)
SELECT 
  'budgetMin > budgetMax' AS tipo_problema,
  up.id AS profile_id,
  up."userId",
  up."budgetMin",
  up."budgetMax",
  u.email
FROM public."UserProfile" up
JOIN public."User" u ON u.id = up."userId"
WHERE up."budgetMin" > up."budgetMax"
ORDER BY up."createdAt" DESC;

-- ============================================================================
-- BLOQUE 5: Vista consolidada de discrepancias (OPCIONAL)
-- ============================================================================

CREATE OR REPLACE VIEW public.provisioning_gaps AS
-- Usuarios desincronizados: auth.users sin User
SELECT 
  'auth_users_sin_user' AS gap_type,
  au.id::text AS user_id,
  au.email,
  NULL::text AS profile_id,
  NULL::text AS issue_detail,
  au.created_at AS detected_at
FROM auth.users au
LEFT JOIN public."User" u ON u.id = au.id::text
WHERE u.id IS NULL

UNION ALL

-- Usuarios desincronizados: User sin UserProfile
SELECT 
  'user_sin_userprofile' AS gap_type,
  u.id AS user_id,
  u.email,
  NULL::text AS profile_id,
  NULL::text AS issue_detail,
  u."createdAt" AS detected_at
FROM public."User" u
LEFT JOIN public."UserProfile" up ON up."userId" = u.id
WHERE up.id IS NULL

UNION ALL

-- Perfiles con city nula o vacía
SELECT 
  'city_invalida' AS gap_type,
  up."userId" AS user_id,
  u.email,
  up.id AS profile_id,
  CONCAT('city: "', COALESCE(up.city, 'NULL'), '"') AS issue_detail,
  up."createdAt" AS detected_at
FROM public."UserProfile" up
JOIN public."User" u ON u.id = up."userId"
WHERE up.city IS NULL 
   OR up.city = ''
   OR TRIM(up.city) = ''

UNION ALL

-- Perfiles con budgetMin inválido
SELECT 
  'budget_min_invalido' AS gap_type,
  up."userId" AS user_id,
  u.email,
  up.id AS profile_id,
  CONCAT('budgetMin: ', COALESCE(up."budgetMin"::text, 'NULL')) AS issue_detail,
  up."createdAt" AS detected_at
FROM public."UserProfile" up
JOIN public."User" u ON u.id = up."userId"
WHERE up."budgetMin" IS NULL 
   OR up."budgetMin" < 0

UNION ALL

-- Perfiles con budgetMax inválido
SELECT 
  'budget_max_invalido' AS gap_type,
  up."userId" AS user_id,
  u.email,
  up.id AS profile_id,
  CONCAT('budgetMax: ', COALESCE(up."budgetMax"::text, 'NULL')) AS issue_detail,
  up."createdAt" AS detected_at
FROM public."UserProfile" up
JOIN public."User" u ON u.id = up."userId"
WHERE up."budgetMax" IS NULL 
   OR up."budgetMax" < 0

UNION ALL

-- Perfiles con budgetMin > budgetMax
SELECT 
  'budget_logica_invalida' AS gap_type,
  up."userId" AS user_id,
  u.email,
  up.id AS profile_id,
  CONCAT('budgetMin (', up."budgetMin", ') > budgetMax (', up."budgetMax", ')') AS issue_detail,
  up."createdAt" AS detected_at
FROM public."UserProfile" up
JOIN public."User" u ON u.id = up."userId"
WHERE up."budgetMin" > up."budgetMax";

-- Agregar comentario a la vista
COMMENT ON VIEW public.provisioning_gaps IS 
'Vista de monitoreo que consolida todas las discrepancias de auto-provisioning.
Tipos de gaps:
- auth_users_sin_user: Usuarios en auth.users sin espejo en User
- user_sin_userprofile: Usuarios en User sin espejo en UserProfile
- city_invalida: Perfiles con city nula o vacía
- budget_min_invalido: Perfiles con budgetMin nulo o negativo
- budget_max_invalido: Perfiles con budgetMax nulo o negativo
- budget_logica_invalida: Perfiles con budgetMin > budgetMax

Usar para monitoreo periódico y alertas.';

-- ============================================================================
-- CONSULTA RÁPIDA: Ver todas las discrepancias
-- ============================================================================

SELECT 
  gap_type,
  COUNT(*) AS total_issues,
  STRING_AGG(DISTINCT email, ', ') AS affected_emails
FROM public.provisioning_gaps
GROUP BY gap_type
ORDER BY total_issues DESC;

-- ============================================================================
-- CONSULTA DETALLADA: Ver discrepancias individuales
-- ============================================================================

SELECT 
  gap_type,
  user_id,
  email,
  profile_id,
  issue_detail,
  detected_at
FROM public.provisioning_gaps
ORDER BY detected_at DESC
LIMIT 50;

-- ============================================================================
-- RESULTADO ESPERADO:
-- ============================================================================
-- ✅ Vista public.provisioning_gaps creada exitosamente
-- ✅ Consulta rápida muestra resumen de problemas por tipo
-- ✅ Consulta detallada muestra hasta 50 casos individuales
-- ✅ Si todo está bien, las consultas deben retornar 0 filas
-- ============================================================================

-- ============================================================================
-- EJEMPLO DE SALIDA (cuando HAY problemas):
-- ============================================================================

-- Resumen de problemas:
-- | gap_type                | total_issues | affected_emails                    |
-- |-------------------------|--------------|-----------------------------------|
-- | user_sin_userprofile    | 5            | juan@test.com, maria@test.com     |
-- | city_invalida           | 2            | pedro@test.com                    |
-- | budget_min_invalido     | 1            | ana@test.com                      |

-- Detalle de problemas:
-- | gap_type             | user_id  | email          | profile_id | issue_detail      | detected_at         |
-- |----------------------|----------|----------------|------------|-------------------|---------------------|
-- | user_sin_userprofile | clxxx... | juan@test.com  | NULL       | NULL              | 2025-01-15 10:00:00 |
-- | city_invalida        | clyyy... | pedro@test.com | clzzz...   | city: ""          | 2025-01-15 09:30:00 |

-- ============================================================================
-- EJEMPLO DE SALIDA (cuando TODO está bien):
-- ============================================================================

-- Resumen de problemas:
-- (0 rows)

-- Detalle de problemas:
-- (0 rows)

-- ============================================================================
-- INTEGRACIÓN CON MONITOREO:
-- ============================================================================
-- Esta vista puede ser consultada periódicamente por:
-- 1. Un cron job que envíe alertas si encuentra discrepancias
-- 2. Un dashboard de admin que muestre el estado del sistema
-- 3. Tests automatizados que verifiquen integridad
--
-- Ejemplo de consulta para alertas:
-- SELECT COUNT(*) FROM public.provisioning_gaps;
-- Si retorna > 0, enviar alerta al equipo de desarrollo
-- ============================================================================

-- ============================================================================
-- LIMPIEZA (si necesitas eliminar la vista):
-- ============================================================================
-- DROP VIEW IF EXISTS public.provisioning_gaps;
-- ============================================================================
