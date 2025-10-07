-- ============================================
-- DIAGNÓSTICO SIMPLE: Avatar Conversación Baldes
-- Conversación: a4ef1f3d-c3e8-46df-b186-5b5c837cc14b
-- ============================================

-- 1. Ver la conversación
SELECT 
  id,
  participant_1,
  participant_2,
  created_at
FROM conversations
WHERE id = 'a4ef1f3d-c3e8-46df-b186-5b5c837cc14b';

-- 2. Ver perfiles de ambos participantes
SELECT 
  up.id,
  up.display_name,
  up.avatar_url,
  up.company_name
FROM user_profiles up
WHERE up.id::text IN (
  SELECT participant_1::text FROM conversations WHERE id = 'a4ef1f3d-c3e8-46df-b186-5b5c837cc14b'
  UNION
  SELECT participant_2::text FROM conversations WHERE id = 'a4ef1f3d-c3e8-46df-b186-5b5c837cc14b'
);

-- 3. Verificar archivos en storage para estos usuarios
SELECT 
  name,
  created_at,
  updated_at
FROM storage.objects
WHERE bucket_id = 'avatars'
  AND (
    name LIKE 'a4ef1f3d-c3e8-46df-b186-5b5c837cc14b%'
    OR name LIKE '6403f9d2-e846-4c70-87e0-e051127d9500%'
  )
ORDER BY created_at DESC;
