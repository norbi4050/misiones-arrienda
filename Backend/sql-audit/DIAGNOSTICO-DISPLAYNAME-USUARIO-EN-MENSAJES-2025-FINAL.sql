-- ============================================================================
-- DIAGNÓSTICO FINAL: Problema "Usuario" en Mensajes
-- Fecha: Enero 2025
-- Esquema detectado: User.name y User.companyName (NO en UserProfile)
-- ============================================================================

-- ⚠️ IMPORTANTE: Ejecutar queries UNA POR UNA, no todo el archivo

-- ============================================================================
-- QUERY 1: VISTA RÁPIDA - Primeros 10 usuarios en conversaciones
-- ============================================================================

SELECT 
  u.id,
  u.email,
  u.name,
  u.companyName,
  u.user_type,
  COALESCE(
    NULLIF(u.name, ''),
    NULLIF(u.companyName, ''),
    split_part(u.email, '@', 1),
    'Usuario'
  ) as display_name_calculado,
  (SELECT COUNT(*) FROM "Conversation" c 
   INNER JOIN "UserProfile" up ON up.id = c."aId" OR up.id = c."bId"
   WHERE up."userId" = u.id) as conversaciones
FROM "User" u
WHERE EXISTS (
  SELECT 1 FROM "UserProfile" up
  INNER JOIN "Conversation" c ON c."aId" = up.id OR c."bId" = up.id
  WHERE up."userId" = u.id
)
ORDER BY conversaciones DESC
LIMIT 10;


-- ============================================================================
-- QUERY 2: CONTAR USUARIOS PROBLEMÁTICOS
-- ============================================================================

SELECT 
  COUNT(*) as total_usuarios_problematicos,
  'Usuarios que mostrarán "Usuario" en mensajes' as descripcion
FROM "User" u
WHERE EXISTS (
  SELECT 1 FROM "UserProfile" up
  INNER JOIN "Conversation" c ON c."aId" = up.id OR c."bId" = up.id
  WHERE up."userId" = u.id
)
AND (
  u.name IS NULL OR u.name = '' OR u.name ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
)
AND (
  u.companyName IS NULL OR u.companyName = '' OR u.companyName ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
);


-- ============================================================================
-- QUERY 3: LISTAR USUARIOS PROBLEMÁTICOS
-- ============================================================================

SELECT 
  u.email,
  u.name,
  u.companyName,
  u.user_type,
  '🔴 Mostrará: Usuario' as problema,
  (SELECT COUNT(*) FROM "UserProfile" up
   INNER JOIN "Conversation" c ON c."aId" = up.id OR c."bId" = up.id
   WHERE up."userId" = u.id) as conversaciones
FROM "User" u
WHERE EXISTS (
  SELECT 1 FROM "UserProfile" up
  INNER JOIN "Conversation" c ON c."aId" = up.id OR c."bId" = up.id
  WHERE up."userId" = u.id
)
AND (
  u.name IS NULL OR u.name = '' OR u.name ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
)
AND (
  u.companyName IS NULL OR u.companyName = '' OR u.companyName ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
)
ORDER BY conversaciones DESC;


-- ============================================================================
-- QUERY 4: BUSCAR USUARIO ESPECÍFICO POR EMAIL
-- ============================================================================
-- Reemplaza 'TU_EMAIL_AQUI' con el email real

SELECT 
  u.id,
  u.email,
  u.name,
  u.companyName,
  u.user_type,
  
  -- Validación de cada campo
  CASE 
    WHEN u.name IS NULL THEN '❌ NULL'
    WHEN u.name = '' THEN '❌ Vacío'
    WHEN u.name ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN '⚠️ Es UUID'
    ELSE '✅ Válido: ' || u.name
  END as validacion_name,
  
  CASE 
    WHEN u.companyName IS NULL THEN '❌ NULL'
    WHEN u.companyName = '' THEN '❌ Vacío'
    WHEN u.companyName ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN '⚠️ Es UUID'
    ELSE '✅ Válido: ' || u.companyName
  END as validacion_companyName,
  
  -- Qué mostrará
  CASE 
    WHEN u.name IS NOT NULL AND u.name != '' AND u.name !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    THEN '✅ Mostrará: ' || u.name || ' (de User.name)'
    
    WHEN u.companyName IS NOT NULL AND u.companyName != '' AND u.companyName !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    THEN '✅ Mostrará: ' || u.companyName || ' (de User.companyName)'
    
    WHEN u.email IS NOT NULL
    THEN '⚠️ Mostrará: ' || split_part(u.email, '@', 1) || ' (de email)'
    
    ELSE '🔴 Mostrará: Usuario (FALLBACK)'
  END as resultado,
  
  (SELECT COUNT(*) FROM "UserProfile" up
   INNER JOIN "Conversation" c ON c."aId" = up.id OR c."bId" = up.id
   WHERE up."userId" = u.id) as conversaciones

FROM "User" u
WHERE u.email = 'TU_EMAIL_AQUI';  -- ⬅️ REEMPLAZAR CON EMAIL REAL

-- Ejemplo:
-- WHERE u.email = 'norbi4050@gmail.com';


-- ============================================================================
-- QUERY 5: ESTADÍSTICAS GENERALES
-- ============================================================================

SELECT 
  'Total usuarios en conversaciones' as metrica,
  COUNT(DISTINCT u.id) as cantidad
FROM "User" u
WHERE EXISTS (
  SELECT 1 FROM "UserProfile" up
  INNER JOIN "Conversation" c ON c."aId" = up.id OR c."bId" = up.id
  WHERE up."userId" = u.id
)

UNION ALL

SELECT 
  'Con User.name válido' as metrica,
  COUNT(DISTINCT u.id)
FROM "User" u
WHERE EXISTS (
  SELECT 1 FROM "UserProfile" up
  INNER JOIN "Conversation" c ON c."aId" = up.id OR c."bId" = up.id
  WHERE up."userId" = u.id
)
AND u.name IS NOT NULL 
AND u.name != '' 
AND u.name !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'

UNION ALL

SELECT 
  'Con User.companyName válido' as metrica,
  COUNT(DISTINCT u.id)
FROM "User" u
WHERE EXISTS (
  SELECT 1 FROM "UserProfile" up
  INNER JOIN "Conversation" c ON c."aId" = up.id OR c."bId" = up.id
  WHERE up."userId" = u.id
)
AND u.companyName IS NOT NULL 
AND u.companyName != '' 
AND u.companyName !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'

UNION ALL

SELECT 
  '🔴 Mostrarán "Usuario"' as metrica,
  COUNT(DISTINCT u.id)
FROM "User" u
WHERE EXISTS (
  SELECT 1 FROM "UserProfile" up
  INNER JOIN "Conversation" c ON c."aId" = up.id OR c."bId" = up.id
  WHERE up."userId" = u.id
)
AND (
  u.name IS NULL OR u.name = '' OR u.name ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
)
AND (
  u.companyName IS NULL OR u.companyName = '' OR u.companyName ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
);


-- ============================================================================
-- QUERY 6: TOP 5 USUARIOS MÁS ACTIVOS CON PROBLEMA
-- ============================================================================

SELECT 
  u.email,
  u.name,
  u.companyName,
  u.user_type,
  COUNT(DISTINCT c.id) as total_conversaciones,
  '🔴 Problema' as estado,
  'Sugerencia: Usar "' || split_part(u.email, '@', 1) || '" como nombre temporal' as sugerencia
FROM "User" u
INNER JOIN "UserProfile" up ON up."userId" = u.id
INNER JOIN "Conversation" c ON c."aId" = up.id OR c."bId" = up.id
WHERE (
  u.name IS NULL OR u.name = '' OR u.name ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
)
AND (
  u.companyName IS NULL OR u.companyName = '' OR u.companyName ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
)
GROUP BY u.id, u.email, u.name, u.companyName, u.user_type
ORDER BY total_conversaciones DESC
LIMIT 5;


-- ============================================================================
-- QUERY 7: ANÁLISIS POR TIPO DE USUARIO
-- ============================================================================

SELECT 
  COALESCE(u.user_type, 'sin_tipo') as tipo_usuario,
  COUNT(*) as total_usuarios,
  
  COUNT(CASE 
    WHEN u.name IS NOT NULL AND u.name != '' AND u.name !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    THEN 1 
  END) as con_name_valido,
  
  COUNT(CASE 
    WHEN u.companyName IS NOT NULL AND u.companyName != '' AND u.companyName !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    THEN 1 
  END) as con_companyName_valido,
  
  COUNT(CASE 
    WHEN (u.name IS NULL OR u.name = '' OR u.name ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$')
    AND (u.companyName IS NULL OR u.companyName = '' OR u.companyName ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$')
    THEN 1 
  END) as mostraran_usuario,
  
  ROUND(
    COUNT(CASE 
      WHEN (u.name IS NULL OR u.name = '' OR u.name ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$')
      AND (u.companyName IS NULL OR u.companyName = '' OR u.companyName ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$')
      THEN 1 
    END) * 100.0 / NULLIF(COUNT(*), 0),
    2
  ) as porcentaje_problematico

FROM "User" u
WHERE EXISTS (
  SELECT 1 FROM "UserProfile" up
  INNER JOIN "Conversation" c ON c."aId" = up.id OR c."bId" = up.id
  WHERE up."userId" = u.id
)
GROUP BY u.user_type
ORDER BY mostraran_usuario DESC;


-- ============================================================================
-- QUERY 8: TODOS LOS USUARIOS EN CONVERSACIONES (COMPLETO)
-- ============================================================================

SELECT 
  u.id,
  u.email,
  u.name,
  u.companyName,
  u.user_type,
  
  -- Estado de cada campo
  CASE 
    WHEN u.name IS NULL THEN '❌ NULL'
    WHEN u.name = '' THEN '❌ Vacío'
    WHEN u.name ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN '⚠️ UUID'
    ELSE '✅ ' || u.name
  END as estado_name,
  
  CASE 
    WHEN u.companyName IS NULL THEN '❌ NULL'
    WHEN u.companyName = '' THEN '❌ Vacío'
    WHEN u.companyName ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN '⚠️ UUID'
    ELSE '✅ ' || u.companyName
  END as estado_companyName,
  
  -- Resultado final
  CASE 
    WHEN u.name IS NOT NULL AND u.name != '' AND u.name !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    THEN '1️⃣ ' || u.name
    
    WHEN u.companyName IS NOT NULL AND u.companyName != '' AND u.companyName !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    THEN '2️⃣ ' || u.companyName
    
    WHEN u.email IS NOT NULL
    THEN '4️⃣ ' || split_part(u.email, '@', 1)
    
    ELSE '5️⃣ Usuario ⚠️'
  END as display_name_final,
  
  (SELECT COUNT(*) FROM "UserProfile" up
   INNER JOIN "Conversation" c ON c."aId" = up.id OR c."bId" = up.id
   WHERE up."userId" = u.id) as conversaciones

FROM "User" u
WHERE EXISTS (
  SELECT 1 FROM "UserProfile" up
  INNER JOIN "Conversation" c ON c."aId" = up.id OR c."bId" = up.id
  WHERE up."userId" = u.id
)
ORDER BY 
  CASE 
    WHEN display_name_final LIKE '5️⃣%' THEN 1
    WHEN display_name_final LIKE '4️⃣%' THEN 2
    ELSE 3
  END,
  conversaciones DESC;


-- ============================================================================
-- INSTRUCCIONES DE USO
-- ============================================================================

/*
HALLAZGO IMPORTANTE:
Según el esquema detectado, companyName está en la tabla User, NO en UserProfile.
Esto significa que el código TypeScript está buscando en el lugar INCORRECTO.

ESQUEMA REAL:
- User.name ✅
- User.companyName ✅ (NO UserProfile.companyName)
- User.email ✅

PROBLEMA IDENTIFICADO:
El código en src/app/api/messages/threads/route.ts busca:
- UserProfile.companyName ❌ (NO EXISTE)
- UserProfile.full_name ❌ (NO EXISTE)

Debería buscar:
- User.companyName ✅ (EXISTE)
- User.name ✅ (EXISTE)

CÓMO USAR ESTAS QUERIES:

1. QUERY 1 (Vista Rápida):
   - Ver primeros 10 usuarios
   - Identificar qué mostrará cada uno
   
2. QUERY 2 (Contar Problemas):
   - Saber cuántos usuarios afectados
   
3. QUERY 3 (Listar Problemáticos):
   - Ver lista completa ordenada por actividad
   
4. QUERY 4 (Usuario Específico):
   - Investigar un usuario en particular
   - Reemplazar 'TU_EMAIL_AQUI'
   
5. QUERY 5 (Estadísticas):
   - Resumen cuantitativo
   
6. QUERY 6 (Top 5 Activos):
   - Priorizar fixes
   
7. QUERY 7 (Por Tipo):
   - Análisis por segmento (agency vs tenant)
   
8. QUERY 8 (Completo):
   - Vista detallada de todos los usuarios

PRÓXIMOS PASOS:
1. Ejecutar estas queries para confirmar datos
2. Revisar INVESTIGACION-PROBLEMA-USUARIO-EN-MENSAJES-2025.md
3. ⚠️ IMPORTANTE: El código TypeScript necesita corrección para buscar
   companyName en User, no en UserProfile
*/
