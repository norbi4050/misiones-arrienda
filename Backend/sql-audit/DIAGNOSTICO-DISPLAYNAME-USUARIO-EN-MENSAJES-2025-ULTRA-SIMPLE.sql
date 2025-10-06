-- ============================================================================
-- DIAGNÓSTICO ULTRA SIMPLE: Problema "Usuario" en Mensajes
-- Fecha: Enero 2025
-- Esquema confirmado: User.name y User.companyName (ambos en tabla User)
-- ============================================================================

-- ⚠️ EJECUTAR QUERIES UNA POR UNA

-- ============================================================================
-- QUERY 1: Ver todos los usuarios en conversaciones
-- ============================================================================

SELECT 
  u.id,
  u.email,
  u.name,
  u."companyName",
  COALESCE(u.name, u."companyName", split_part(u.email, '@', 1), 'Usuario') as mostrara
FROM "User" u
WHERE EXISTS (
  SELECT 1 FROM "UserProfile" up
  INNER JOIN "Conversation" c ON c."aId" = up.id OR c."bId" = up.id
  WHERE up."userId" = u.id
)
LIMIT 20;


-- ============================================================================
-- QUERY 2: Contar usuarios problemáticos
-- ============================================================================

SELECT 
  COUNT(*) as usuarios_con_problema
FROM "User" u
WHERE EXISTS (
  SELECT 1 FROM "UserProfile" up
  INNER JOIN "Conversation" c ON c."aId" = up.id OR c."bId" = up.id
  WHERE up."userId" = u.id
)
AND (u.name IS NULL OR u.name = '')
AND (u."companyName" IS NULL OR u."companyName" = '');


-- ============================================================================
-- QUERY 3: Listar usuarios problemáticos
-- ============================================================================

SELECT 
  u.email,
  u.name,
  u."companyName",
  '🔴 Mostrará: Usuario' as problema
FROM "User" u
WHERE EXISTS (
  SELECT 1 FROM "UserProfile" up
  INNER JOIN "Conversation" c ON c."aId" = up.id OR c."bId" = up.id
  WHERE up."userId" = u.id
)
AND (u.name IS NULL OR u.name = '')
AND (u."companyName" IS NULL OR u."companyName" = '');


-- ============================================================================
-- QUERY 4: Buscar usuario específico
-- ============================================================================
-- Reemplaza 'norbi4050@gmail.com' con el email que quieras buscar

SELECT 
  u.id,
  u.email,
  u.name,
  u."companyName",
  CASE 
    WHEN u.name IS NOT NULL AND u.name != '' THEN '✅ Mostrará: ' || u.name
    WHEN u."companyName" IS NOT NULL AND u."companyName" != '' THEN '✅ Mostrará: ' || u."companyName"
    ELSE '🔴 Mostrará: Usuario'
  END as resultado
FROM "User" u
WHERE u.email = 'norbi4050@gmail.com';  -- ⬅️ CAMBIAR EMAIL AQUÍ


-- ============================================================================
-- HALLAZGO CRÍTICO DESCUBIERTO
-- ============================================================================

/*
🚨 PROBLEMA ENCONTRADO EN EL CÓDIGO:

El archivo src/app/api/messages/threads/route.ts (líneas 150-165) busca:
  - UserProfile.companyName ❌ (NO EXISTE)
  - UserProfile.full_name ❌ (NO EXISTE)

Pero según el esquema real de la base de datos:
  - User.companyName ✅ (EXISTE)
  - User.name ✅ (EXISTE)

CONCLUSIÓN:
El código TypeScript está buscando companyName en la tabla INCORRECTA.
Debería buscar en User, no en UserProfile.

SOLUCIÓN NECESARIA:
Modificar src/app/api/messages/threads/route.ts para que consulte:
  - User.companyName (en lugar de UserProfile.companyName)
  - User.name (ya lo hace correctamente)

IMPACTO:
- Todos los usuarios con companyName poblado NO se están mostrando
- El sistema siempre cae al fallback "Usuario"
- Esto afecta especialmente a inmobiliarias

ARCHIVOS A REVISAR:
1. src/app/api/messages/threads/route.ts (líneas 150-165)
2. src/lib/messages/display-name-helper.ts (verificar interfaz UserProfileData)

PRÓXIMOS PASOS:
1. Confirmar con estas queries qué usuarios tienen companyName
2. Actualizar el código TypeScript para buscar en User.companyName
3. Re-testear el sistema de mensajes
*/
