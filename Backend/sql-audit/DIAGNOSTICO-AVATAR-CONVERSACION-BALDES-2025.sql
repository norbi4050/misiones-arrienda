-- ============================================
-- DIAGNÓSTICO: Avatar en Conversación Baldes
-- Fecha: Enero 2025
-- Conversación ID: a4ef1f3d-c3e8-46df-b186-5b5c837cc14b
-- ============================================

-- 1. Verificar la conversación y su estructura
SELECT 
  id,
  participant_1,
  participant_2,
  created_at,
  updated_at,
  last_message_at
FROM conversations
WHERE id = 'a4ef1f3d-c3e8-46df-b186-5b5c837cc14b';

-- 2. Obtener los participantes
SELECT 
  'Participante 1' as rol,
  participant_1 as user_id
FROM conversations
WHERE id = 'a4ef1f3d-c3e8-46df-b186-5b5c837cc14b'
UNION ALL
SELECT 
  'Participante 2' as rol,
  participant_2 as user_id
FROM conversations
WHERE id = 'a4ef1f3d-c3e8-46df-b186-5b5c837cc14b';

-- 3. Obtener perfiles de los participantes con detalles completos
SELECT 
  up.id,
  up.display_name,
  up.avatar_url,
  up.updated_at,
  up.user_type,
  up.company_name,
  -- Verificar si es inmobiliaria
  CASE 
    WHEN up.user_type = 'agency' THEN 'Inmobiliaria'
    WHEN up.user_type = 'individual' THEN 'Individual'
    ELSE 'Desconocido'
  END as tipo_usuario,
  -- Verificar si tiene avatar
  CASE 
    WHEN up.avatar_url IS NULL THEN '❌ Sin avatar_url'
    WHEN up.avatar_url = '' THEN '❌ avatar_url vacío'
    ELSE '✅ Tiene avatar_url'
  END as estado_avatar_url
FROM user_profiles up
WHERE up.id IN (
  SELECT participant_1 FROM conversations WHERE id = 'a4ef1f3d-c3e8-46df-b186-5b5c837cc14b'
  UNION
  SELECT participant_2 FROM conversations WHERE id = 'a4ef1f3d-c3e8-46df-b186-5b5c837cc14b'
)
ORDER BY up.display_name;

-- 4. Verificar si los avatares existen en storage.objects
SELECT 
  up.id,
  up.display_name,
  up.avatar_url,
  CASE 
    WHEN up.avatar_url IS NULL THEN '❌ Sin avatar_url en BD'
    WHEN up.avatar_url = '' THEN '❌ avatar_url vacío'
    WHEN so.name IS NOT NULL THEN '✅ Archivo existe en storage'
    ELSE '❌ Archivo NO existe en storage'
  END as estado_archivo,
  so.name as archivo_storage,
  so.created_at as archivo_creado,
  so.updated_at as archivo_actualizado
FROM user_profiles up
LEFT JOIN storage.objects so ON (
  so.bucket_id = 'avatars' 
  AND up.avatar_url IS NOT NULL
  AND up.avatar_url LIKE '%' || so.name || '%'
)
WHERE up.id IN (
  SELECT participant_1 FROM conversations WHERE id = 'a4ef1f3d-c3e8-46df-b186-5b5c837cc14b'
  UNION
  SELECT participant_2 FROM conversations WHERE id = 'a4ef1f3d-c3e8-46df-b186-5b5c837cc14b'
)
ORDER BY up.display_name;

-- 5. Listar TODOS los archivos en el bucket avatars para referencia
SELECT 
  name,
  created_at,
  updated_at,
  metadata
FROM storage.objects
WHERE bucket_id = 'avatars'
ORDER BY created_at DESC
LIMIT 20;

-- 6. Verificar si hay usuarios con avatar_url pero sin archivo
SELECT 
  up.id,
  up.display_name,
  up.avatar_url,
  'Avatar URL existe pero archivo no encontrado' as problema
FROM user_profiles up
WHERE up.avatar_url IS NOT NULL
  AND up.avatar_url != ''
  AND NOT EXISTS (
    SELECT 1 
    FROM storage.objects so 
    WHERE so.bucket_id = 'avatars' 
      AND up.avatar_url LIKE '%' || so.name || '%'
  )
LIMIT 10;

-- 7. Resumen ejecutivo
SELECT 
  COUNT(*) as total_usuarios,
  COUNT(avatar_url) FILTER (WHERE avatar_url IS NOT NULL AND avatar_url != '') as con_avatar_url,
  COUNT(*) FILTER (WHERE avatar_url IS NULL OR avatar_url = '') as sin_avatar_url
FROM user_profiles;

-- 8. DIAGNÓSTICO ESPECÍFICO: Usuario "Baldes"
-- Buscar el usuario que aparece como "Baldes" en la conversación
SELECT 
  id,
  display_name,
  avatar_url,
  user_type,
  company_name,
  updated_at,
  CASE 
    WHEN avatar_url IS NULL THEN '⚠️ PROBLEMA: Sin avatar_url'
    WHEN avatar_url = '' THEN '⚠️ PROBLEMA: avatar_url vacío'
    ELSE '✅ Tiene avatar_url: ' || avatar_url
  END as diagnostico
FROM user_profiles
WHERE display_name ILIKE '%baldes%'
   OR company_name ILIKE '%baldes%'
   OR id IN (
     SELECT participant_1 FROM conversations WHERE id = 'a4ef1f3d-c3e8-46df-b186-5b5c837cc14b'
     UNION
     SELECT participant_2 FROM conversations WHERE id = 'a4ef1f3d-c3e8-46df-b186-5b5c837cc14b'
   );
