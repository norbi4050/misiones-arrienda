-- 🔄 REVERTIR: Status de propiedades al estado original
-- Fecha: 2025-09-29
-- Motivo: UPDATE masivo causó error en "mis publicaciones"

-- 1. Revertir todas las propiedades DRAFT que fueron cambiadas a PUBLISHED
-- (Mantener solo las que originalmente eran PUBLISHED)

-- Revertir a DRAFT las propiedades que NO deberían estar publicadas
UPDATE properties 
SET 
    status = 'DRAFT',
    published_at = NULL
WHERE id IN (
    '09dfbd44-26e0-4e9b-882d-416bb8b06e31',  -- Mansion Obera 2
    '2d095608-39c7-4fb9-adb5-9d2e291f254a',  -- Mansion obera 2
    '5be9b124-c496-4583-a5bd-125529aa9471',  -- Mansion 2 Obera
    '8d954133-20f4-4a82-8057-a89896a8d563',  -- Mansion 2 obera
    '177e8260-9845-41a8-b25d-6f33be2f421e',  -- Mansion obera2
    '1d8cfd59-fcfd-4d1e-89b4-2a67da0a08c4',  -- Obera Mansion12
    'ea215367-8909-4aef-b273-9b47ebb9b4df',  -- Mansion Obera
    '90272c6a-61ff-4199-97d7-546abf7dd232',  -- Mansion Obera
    'b38590eb-12a7-45e2-a9d7-236b2abbb747',  -- Masion obera
    'e5cc6078-44c8-445e-a405-996aa228b01f',  -- Mansion 2
    'e2a5100f-f8e0-469c-80d4-38a9c305f03e',  -- Mansion2
    'e69f1a18-7ff3-47a9-8f81-d997b042a3b2'   -- MAnsion
);

-- 2. Mantener PUBLISHED solo las que originalmente lo eran:
-- - 3a763e10-4c11-4f76-8aa0-db76ce7a2260 (Mansion 2 obera)
-- - 89ecf166-8f87-4174-a0d4-42052166f2dd (Casa ambiente)

-- 3. Verificar el estado después de la reversión
SELECT 
    status,
    is_active,
    COUNT(*) as count
FROM properties 
GROUP BY status, is_active
ORDER BY count DESC;

-- 4. Verificar propiedades específicas
SELECT 
    id,
    title,
    status,
    is_active,
    published_at,
    CASE 
        WHEN status = 'PUBLISHED' AND is_active = true THEN '✅ Visible en /properties'
        WHEN status = 'DRAFT' THEN '📝 Borrador (no visible)'
        ELSE '❓ Otro estado'
    END as visibility_status
FROM properties 
WHERE id IN (
    '3a763e10-4c11-4f76-8aa0-db76ce7a2260',  -- Debería estar PUBLISHED
    '89ecf166-8f87-4174-a0d4-42052166f2dd',  -- Debería estar PUBLISHED
    '09dfbd44-26e0-4e9b-882d-416bb8b06e31'   -- Debería estar DRAFT
)
ORDER BY status DESC;

-- RESULTADO ESPERADO:
-- - 2 propiedades PUBLISHED (las originales)
-- - 12 propiedades DRAFT (revertidas)
-- - "mis publicaciones" debería funcionar nuevamente
