-- ============================================================================
-- DIAGNÓSTICO SIMPLIFICADO: Problema "Usuario" en Mensajes
-- Fecha: Enero 2025
-- Propósito: Queries simples y robustas que funcionan sin importar el esquema
-- ============================================================================

-- ⚠️ IMPORTANTE: Estas queries están diseñadas para ser ejecutadas UNA POR UNA
-- No ejecutar todo el archivo de una vez

-- ============================================================================
-- PASO 0: DETECTAR ESQUEMA REAL (Ejecutar primero)
-- ============================================================================
-- Esta query te dirá qué columnas existen realmente en tu base de datos

SELECT 
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('User', 'UserProfile', 'Conversation')
  AND column_name IN ('name', 'full_name', 'companyName', 'company_name', 'aId', 'bId', 'a_id', 'b_id')
ORDER BY table_name, column_name;

-- ============================================================================
-- QUERY 1: VISTA RÁPIDA - Primeros 10 usuarios en conversaciones
-- ============================================================================
-- Ejecuta esta query para ver rápidamente qué datos tienen los usuarios

SELECT 
  u.id,
  u.email,
  u.name,
  up."companyName",
  up.company_name,
  COALESCE(u.name, up."companyName", up.company_name, split_part(u.email, '@', 1), 'Usuario') as display_name_calculado
FROM "User" u
LEFT JOIN "UserProfile" up ON up."userId" = u.id
WHERE EXISTS (
  SELECT 1 FROM "Conversation" c 
  WHERE c."aId" = up.id OR c."bId" = up.id
)
LIMIT 10;


-- ============================================================================
-- QUERY 2: CONTAR USUARIOS PROBLEMÁTICOS
-- ============================================================================
-- Cuenta cuántos usuarios mostrarán "Usuario"

SELECT 
  COUNT(*) as total_usuarios_problematicos,
  'Usuarios que mostrarán "Usuario" en mensajes' as descripcion
FROM "User" u
LEFT JOIN "UserProfile" up ON up."userId" = u.id
WHERE EXISTS (
  SELECT 1 FROM "Conversation" c 
  WHERE c."aId" = up.id OR c."bId" = up.id
)
AND (
  u.name IS NULL OR u.name = '' OR u.name ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
)
AND (
  up."companyName" IS NULL OR up."companyName" = '' OR up."companyName" ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
)
AND (
  up.company_name IS NULL OR up.company_name = '' OR up.company_name ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
);


-- ============================================================================
-- QUERY 3: LISTAR USUARIOS PROBLEMÁTICOS
-- ============================================================================
-- Lista los usuarios específicos que tienen el problema

SELECT 
  u.email,
  u.name as user_name,
  up."companyName" as company_name_pascal,
  up.company_name as company_name_snake,
  u.user_type,
  '🔴 Mostrará: Usuario' as problema,
  (SELECT COUNT(*) FROM "Conversation" c WHERE c."aId" = up.id OR c."bId" = up.id) as conversaciones
FROM "User" u
LEFT JOIN "UserProfile" up ON up."userId" = u.id
WHERE EXISTS (
  SELECT 1 FROM "Conversation" c 
  WHERE c."aId" = up.id OR c."bId" = up.id
)
AND (
  u.name IS NULL OR u.name = '' OR u.name ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
)
AND (
  up."companyName" IS NULL OR up."companyName" = '' OR up."companyName" ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
)
AND (
  up.company_name IS NULL OR up.company_name = '' OR up.company_name ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
)
ORDER BY conversaciones DESC
LIMIT 20;


-- ============================================================================
-- QUERY 4: BUSCAR UN USUARIO ESPECÍFICO POR EMAIL
-- ============================================================================
-- Reemplaza 'TU_EMAIL_AQUI' con el email del usuario que quieres investigar

SELECT 
  u.id,
  u.email,
  u.name,
  u.user_type,
  up.id as profile_id,
  up."companyName",
  up.company_name,
  
  -- Qué mostrará
  CASE 
    WHEN u.name IS NOT NULL AND u.name != '' AND u.name !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    THEN '✅ Mostrará: ' || u.name || ' (de User.name)'
    
    WHEN up."companyName" IS NOT NULL AND up."companyName" != '' AND up."companyName" !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    THEN '✅ Mostrará: ' || up."companyName" || ' (de companyName PascalCase)'
    
    WHEN up.company_name IS NOT NULL AND up.company_name != '' AND up.company_name !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    THEN '✅ Mostrará: ' || up.company_name || ' (de company_name snake_case)'
    
    WHEN u.email IS NOT NULL
    THEN '⚠️ Mostrará: ' || split_part(u.email, '@', 1) || ' (de email)'
    
    ELSE '🔴 Mostrará: Usuario (FALLBACK)'
  END as resultado,
  
  (SELECT COUNT(*) FROM "Conversation" c WHERE c."aId" = up.id OR c."bId" = up.id) as conversaciones

FROM "User" u
LEFT JOIN "UserProfile" up ON up."userId" = u.id
WHERE u.email = 'TU_EMAIL_AQUI';  -- ⬅️ REEMPLAZAR CON EMAIL REAL

-- Ejemplo:
-- WHERE u.email = 'norbi4050@gmail.com';


-- ============================================================================
-- QUERY 5: ESTADÍSTICAS GENERALES
-- ============================================================================
-- Resumen de la situación

SELECT 
  'Total usuarios en conversaciones' as metrica,
  COUNT(DISTINCT u.id) as cantidad
FROM "User" u
INNER JOIN "UserProfile" up ON up."userId" = u.id
WHERE EXISTS (
  SELECT 1 FROM "Conversation" c 
  WHERE c."aId" = up.id OR c."bId" = up.id
)

UNION ALL

SELECT 
  'Con User.name válido' as metrica,
  COUNT(DISTINCT u.id)
FROM "User" u
INNER JOIN "UserProfile" up ON up."userId" = u.id
WHERE EXISTS (
  SELECT 1 FROM "Conversation" c 
  WHERE c."aId" = up.id OR c."bId" = up.id
)
AND u.name IS NOT NULL 
AND u.name != '' 
AND u.name !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'

UNION ALL

SELECT 
  'Con companyName válido (cualquier formato)' as metrica,
  COUNT(DISTINCT u.id)
FROM "User" u
INNER JOIN "UserProfile" up ON up."userId" = u.id
WHERE EXISTS (
  SELECT 1 FROM "Conversation" c 
  WHERE c."aId" = up.id OR c."bId" = up.id
)
AND (
  (up."companyName" IS NOT NULL AND up."companyName" != '' AND up."companyName" !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$')
  OR
  (up.company_name IS NOT NULL AND up.company_name != '' AND up.company_name !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$')
)

UNION ALL

SELECT 
  '🔴 Mostrarán "Usuario"' as metrica,
  COUNT(DISTINCT u.id)
FROM "User" u
LEFT JOIN "UserProfile" up ON up."userId" = u.id
WHERE EXISTS (
  SELECT 1 FROM "Conversation" c 
  WHERE c."aId" = up.id OR c."bId" = up.id
)
AND (
  u.name IS NULL OR u.name = '' OR u.name ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
)
AND (
  up."companyName" IS NULL OR up."companyName" = '' OR up."companyName" ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
)
AND (
  up.company_name IS NULL OR up.company_name = '' OR up.company_name ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
);


-- ============================================================================
-- QUERY 6: TOP 5 USUARIOS MÁS ACTIVOS CON PROBLEMA
-- ============================================================================
-- Identifica los usuarios más activos que necesitan atención

SELECT 
  u.email,
  u.name,
  up."companyName",
  up.company_name,
  COUNT(DISTINCT c.id) as total_conversaciones,
  '🔴 Problema' as estado,
  'Sugerencia: Usar "' || split_part(u.email, '@', 1) || '" como nombre temporal' as sugerencia
FROM "User" u
LEFT JOIN "UserProfile" up ON up."userId" = u.id
LEFT JOIN "Conversation" c ON c."aId" = up.id OR c."bId" = up.id
WHERE (
  u.name IS NULL OR u.name = '' OR u.name ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
)
AND (
  up."companyName" IS NULL OR up."companyName" = '' OR up."companyName" ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
)
AND (
  up.company_name IS NULL OR up.company_name = '' OR up.company_name ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
)
GROUP BY u.id, u.email, u.name, up."companyName", up.company_name
HAVING COUNT(DISTINCT c.id) > 0
ORDER BY total_conversaciones DESC
LIMIT 5;


-- ============================================================================
-- INSTRUCCIONES DE USO
-- ============================================================================

/*
CÓMO USAR ESTE ARCHIVO:

1. PASO 0 (DETECTAR ESQUEMA):
   - Ejecutar primero para saber qué columnas existen
   - Te dirá si usas PascalCase o snake_case
   
2. QUERY 1 (VISTA RÁPIDA):
   - Ver los primeros 10 usuarios
   - Identificar qué mostrará cada uno
   
3. QUERY 2 (CONTAR PROBLEMAS):
   - Saber cuántos usuarios tienen el problema
   - Útil para reportes ejecutivos
   
4. QUERY 3 (LISTAR PROBLEMÁTICOS):
   - Ver lista completa de usuarios con problema
   - Ordenados por cantidad de conversaciones
   
5. QUERY 4 (BUSCAR ESPECÍFICO):
   - Investigar un usuario particular
   - Reemplazar 'TU_EMAIL_AQUI' con el email real
   
6. QUERY 5 (ESTADÍSTICAS):
   - Resumen cuantitativo completo
   - Comparar usuarios con/sin datos
   
7. QUERY 6 (TOP 5 ACTIVOS):
   - Priorizar qué usuarios arreglar primero
   - Los más activos primero

NOTAS IMPORTANTES:
- Ejecutar queries UNA POR UNA (no todo el archivo)
- Copiar y pegar cada query individualmente en Supabase SQL Editor
- Si una query falla, revisar PASO 0 para confirmar nombres de columnas
- Las queries usan COALESCE para manejar ambos formatos (PascalCase y snake_case)

PRÓXIMO PASO:
Después de identificar usuarios problemáticos, revisar:
- INVESTIGACION-PROBLEMA-USUARIO-EN-MENSAJES-2025.md (reporte completo)
- sql-audit/BACKFILL-DISPLAYNAME-USUARIO-EN-MENSAJES-2025.sql (soluciones)
*/
