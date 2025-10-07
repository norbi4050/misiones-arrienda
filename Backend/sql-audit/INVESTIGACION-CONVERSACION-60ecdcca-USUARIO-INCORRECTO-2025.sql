-- Investigación: ¿Por qué la conversación 60ecdcca muestra usuario incorrecto?
-- Fecha: 2025-01-07
-- Problema: Header muestra "Usuario" en lugar de "Carlos González"

-- ============================================
-- PASO 1: Verificar datos de la conversación
-- ============================================

SELECT 
    id,
    "aId" as a_id,
    "bId" as b_id,
    "isActive" as is_active,
    "createdAt" as created_at,
    "updatedAt" as updated_at
FROM "Conversation"
WHERE id = '60ecdcca-f9df-4511-bb43-9c54d064405e';

-- Resultado esperado:
-- id: 60ecdcca-f9df-4511-bb43-9c54d064405e
-- a_id: ??? (UserProfile ID)
-- b_id: ??? (UserProfile ID)

-- ============================================
-- PASO 2: Identificar los UserProfiles
-- ============================================

WITH conv AS (
    SELECT 
        id,
        "aId" as a_id,
        "bId" as b_id
    FROM "Conversation"
    WHERE id = '60ecdcca-f9df-4511-bb43-9c54d064405e'
)
SELECT 
    'UserProfile A' as tipo,
    up.id as profile_id,
    up."userId" as user_id,
    u.name as user_name,
    u.email as user_email,
    u."companyName" as company_name
FROM conv
JOIN "UserProfile" up ON up.id = conv.a_id
LEFT JOIN "User" u ON u.id = up."userId"

UNION ALL

SELECT 
    'UserProfile B' as tipo,
    up.id as profile_id,
    up."userId" as user_id,
    u.name as user_name,
    u.email as user_email,
    u."companyName" as company_name
FROM conv
JOIN "UserProfile" up ON up.id = conv.b_id
LEFT JOIN "User" u ON u.id = up."userId";

-- Resultado esperado:
-- Debería mostrar 2 filas:
-- - UserProfile A: ??? 
-- - UserProfile B: Carlos González (6403f9d2-e846-4c70-87e0-e051127d9500)

-- ============================================
-- PASO 3: Verificar cuál es el usuario actual
-- ============================================

-- Usuario actual según logs: a4ef1f3d-c3e8-46df-b186-5b5c837cc14b

SELECT 
    id as user_id,
    name,
    email,
    "companyName" as company_name
FROM "User"
WHERE id = 'a4ef1f3d-c3e8-46df-b186-5b5c837cc14b';

-- Buscar su UserProfile
SELECT 
    id as profile_id,
    "userId" as user_id
FROM "UserProfile"
WHERE "userId" = 'a4ef1f3d-c3e8-46df-b186-5b5c837cc14b';

-- Resultado esperado:
-- profile_id: 43eb40bb-094a-4184-823e-aef33bac9c21 (según logs)

-- ============================================
-- PASO 4: Determinar el "otro usuario" correcto
-- ============================================

WITH conv AS (
    SELECT 
        id,
        "aId" as a_id,
        "bId" as b_id
    FROM "Conversation"
    WHERE id = '60ecdcca-f9df-4511-bb43-9c54d064405e'
),
current_profile AS (
    SELECT id as profile_id
    FROM "UserProfile"
    WHERE "userId" = 'a4ef1f3d-c3e8-46df-b186-5b5c837cc14b'
)
SELECT 
    CASE 
        WHEN conv.a_id = cp.profile_id THEN 'B es el otro usuario'
        WHEN conv.b_id = cp.profile_id THEN 'A es el otro usuario'
        ELSE 'Usuario actual NO está en la conversación'
    END as resultado,
    conv.a_id,
    conv.b_id,
    cp.profile_id as current_profile_id,
    CASE 
        WHEN conv.a_id = cp.profile_id THEN conv.b_id
        WHEN conv.b_id = cp.profile_id THEN conv.a_id
        ELSE NULL
    END as other_profile_id
FROM conv, current_profile cp;

-- ============================================
-- PASO 5: Obtener datos del "otro usuario" correcto
-- ============================================

WITH conv AS (
    SELECT 
        id,
        "aId" as a_id,
        "bId" as b_id
    FROM "Conversation"
    WHERE id = '60ecdcca-f9df-4511-bb43-9c54d064405e'
),
current_profile AS (
    SELECT id as profile_id
    FROM "UserProfile"
    WHERE "userId" = 'a4ef1f3d-c3e8-46df-b186-5b5c837cc14b'
),
other_profile_id AS (
    SELECT 
        CASE 
            WHEN conv.a_id = cp.profile_id THEN conv.b_id
            WHEN conv.b_id = cp.profile_id THEN conv.a_id
            ELSE NULL
        END as profile_id
    FROM conv, current_profile cp
)
SELECT 
    up.id as profile_id,
    up."userId" as user_id,
    u.name as user_name,
    u.email as user_email,
    u."companyName" as company_name,
    u.avatar as avatar_url
FROM other_profile_id opi
JOIN "UserProfile" up ON up.id = opi.profile_id
LEFT JOIN "User" u ON u.id = up."userId";

-- Resultado esperado:
-- Debería mostrar los datos de Carlos González (6403f9d2...)

-- ============================================
-- DIAGNÓSTICO
-- ============================================

-- Si el resultado del PASO 5 muestra a Carlos González,
-- entonces el problema está en el código del API que está
-- detectando incorrectamente al "otro usuario".

-- Si el resultado muestra al usuario 53a4bffa (sin nombre),
-- entonces hay un problema en los datos de la conversación
-- en la base de datos.
