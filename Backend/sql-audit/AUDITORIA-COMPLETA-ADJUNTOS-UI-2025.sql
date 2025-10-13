-- =====================================================
-- AUDITORÍA COMPLETA: Adjuntos en UI - Investigación
-- Fecha: 2025-01-13
-- Objetivo: Verificar por qué los adjuntos no se muestran correctamente en la UI
-- =====================================================

-- =====================================================
-- PARTE 1: VERIFICAR ÚLTIMO MENSAJE ENVIADO
-- =====================================================

-- 1.1 Ver el último mensaje enviado con adjunto
SELECT 
    m.id as message_id,
    m.content,
    m."senderId",
    m."createdAt",
    m."threadId",
    COUNT(ma.id) as attachments_count
FROM "Message" m
LEFT JOIN "MessageAttachment" ma ON ma."messageId" = m.id
WHERE m."threadId" = '60ecdcca-f9df-4511-bb43-9c54d064405e'
GROUP BY m.id, m.content, m."senderId", m."createdAt", m."threadId"
ORDER BY m."createdAt" DESC
LIMIT 5;

-- 1.2 Ver detalles del último adjunto subido
SELECT 
    id,
    "userId",
    "threadId",
    "messageId",
    path,
    "fileName",
    mime,
    "sizeBytes",
    "createdAt"
FROM "MessageAttachment"
WHERE "threadId" = '60ecdcca-f9df-4511-bb43-9c54d064405e'
ORDER BY "createdAt" DESC
LIMIT 5;

-- =====================================================
-- PARTE 2: VERIFICAR VINCULACIÓN DE ADJUNTOS
-- =====================================================

-- 2.1 Buscar adjuntos huérfanos (sin messageId)
SELECT 
    id,
    "userId",
    "threadId",
    "messageId",
    "fileName",
    "createdAt",
    CASE 
        WHEN "messageId" IS NULL THEN '❌ HUÉRFANO'
        ELSE '✅ VINCULADO'
    END as status
FROM "MessageAttachment"
WHERE "threadId" = '60ecdcca-f9df-4511-bb43-9c54d064405e'
ORDER BY "createdAt" DESC
LIMIT 10;

-- 2.2 Verificar si el último mensaje tiene adjuntos vinculados
WITH ultimo_mensaje AS (
    SELECT id, content, "createdAt"
    FROM "Message"
    WHERE "threadId" = '60ecdcca-f9df-4511-bb43-9c54d064405e'
    ORDER BY "createdAt" DESC
    LIMIT 1
)
SELECT 
    um.id as message_id,
    um.content,
    um."createdAt" as message_created,
    ma.id as attachment_id,
    ma."fileName",
    ma."createdAt" as attachment_created,
    CASE 
        WHEN ma.id IS NULL THEN '❌ SIN ADJUNTOS'
        ELSE '✅ CON ADJUNTOS'
    END as status
FROM ultimo_mensaje um
LEFT JOIN "MessageAttachment" ma ON ma."messageId" = um.id;

-- =====================================================
-- PARTE 3: VERIFICAR STORAGE EN SUPABASE
-- =====================================================

-- 3.1 Ver todos los archivos en storage (metadata)
SELECT 
    id,
    path,
    "fileName",
    mime,
    "sizeBytes",
    "createdAt",
    "messageId",
    CASE 
        WHEN "messageId" IS NULL THEN '⚠️ Pendiente de vincular'
        ELSE '✅ Vinculado a mensaje'
    END as vinculacion_status
FROM "MessageAttachment"
WHERE "threadId" = '60ecdcca-f9df-4511-bb43-9c54d064405e'
ORDER BY "createdAt" DESC;

-- =====================================================
-- PARTE 4: VERIFICAR INTEGRIDAD DE DATOS
-- =====================================================

-- 4.1 Contar mensajes vs adjuntos
SELECT 
    'Mensajes totales' as tipo,
    COUNT(*) as cantidad
FROM "Message"
WHERE "threadId" = '60ecdcca-f9df-4511-bb43-9c54d064405e'
UNION ALL
SELECT 
    'Adjuntos totales' as tipo,
    COUNT(*) as cantidad
FROM "MessageAttachment"
WHERE "threadId" = '60ecdcca-f9df-4511-bb43-9c54d064405e'
UNION ALL
SELECT 
    'Adjuntos vinculados' as tipo,
    COUNT(*) as cantidad
FROM "MessageAttachment"
WHERE "threadId" = '60ecdcca-f9df-4511-bb43-9c54d064405e'
AND "messageId" IS NOT NULL
UNION ALL
SELECT 
    'Adjuntos huérfanos' as tipo,
    COUNT(*) as cantidad
FROM "MessageAttachment"
WHERE "threadId" = '60ecdcca-f9df-4511-bb43-9c54d064405e'
AND "messageId" IS NULL;

-- 4.2 Ver mensajes con y sin adjuntos
SELECT 
    m.id,
    m.content,
    m."createdAt",
    COUNT(ma.id) as attachments_count,
    CASE 
        WHEN COUNT(ma.id) = 0 THEN '📝 Solo texto'
        ELSE '📎 Con adjuntos (' || COUNT(ma.id) || ')'
    END as tipo_mensaje
FROM "Message" m
LEFT JOIN "MessageAttachment" ma ON ma."messageId" = m.id
WHERE m."threadId" = '60ecdcca-f9df-4511-bb43-9c54d064405e'
GROUP BY m.id, m.content, m."createdAt"
ORDER BY m."createdAt" DESC
LIMIT 15;

-- =====================================================
-- PARTE 5: VERIFICAR CONFIGURACIÓN DE STORAGE BUCKET
-- =====================================================

-- 5.1 Ver configuración del bucket (requiere acceso a storage.buckets)
SELECT 
    id,
    name,
    public,
    file_size_limit,
    allowed_mime_types
FROM storage.buckets
WHERE name = 'message-attachments';

-- 5.2 Ver objetos en storage (últimos 10)
SELECT 
    name,
    id,
    bucket_id,
    owner,
    created_at,
    updated_at,
    last_accessed_at,
    metadata
FROM storage.objects
WHERE bucket_id = 'message-attachments'
AND name LIKE '%60ecdcca-f9df-4511-bb43-9c54d064405e%'
ORDER BY created_at DESC
LIMIT 10;

-- =====================================================
-- PARTE 6: DIAGNÓSTICO ESPECÍFICO DEL ÚLTIMO ADJUNTO
-- =====================================================

-- 6.1 Buscar el adjunto más reciente (be744bb6-fbca-450d-ac5c-3533ace4afdd según logs)
SELECT 
    ma.id,
    ma."userId",
    ma."threadId",
    ma."messageId",
    ma.path,
    ma."fileName",
    ma.mime,
    ma."sizeBytes",
    ma."createdAt",
    m.id as linked_message_id,
    m.content as linked_message_content,
    m."createdAt" as linked_message_created,
    CASE 
        WHEN ma."messageId" IS NULL THEN '❌ NO VINCULADO'
        WHEN m.id IS NULL THEN '⚠️ MENSAJE NO EXISTE'
        ELSE '✅ CORRECTAMENTE VINCULADO'
    END as diagnostic
FROM "MessageAttachment" ma
LEFT JOIN "Message" m ON m.id = ma."messageId"
WHERE ma.id = 'be744bb6-fbca-450d-ac5c-3533ace4afdd';

-- 6.2 Ver si el archivo existe en storage
SELECT 
    name,
    id,
    bucket_id,
    metadata->>'size' as size,
    metadata->>'mimetype' as mimetype,
    created_at
FROM storage.objects
WHERE name = '43eb40bb-094a-4184-823e-aef33bac9c21/60ecdcca-f9df-4511-bb43-9c54d064405e/1760333388353-MARCCCCCCCCCA.jpg';

-- =====================================================
-- PARTE 7: VERIFICAR RLS POLICIES
-- =====================================================

-- 7.1 Ver políticas RLS de MessageAttachment
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'MessageAttachment';

-- 7.2 Verificar si RLS está habilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE tablename = 'MessageAttachment';

-- =====================================================
-- PARTE 8: ANÁLISIS DE TIMESTAMPS
-- =====================================================

-- 8.1 Comparar timestamps de mensaje vs adjunto
SELECT 
    m.id as message_id,
    m."createdAt" as message_created,
    ma.id as attachment_id,
    ma."createdAt" as attachment_created,
    ma."fileName",
    EXTRACT(EPOCH FROM (m."createdAt" - ma."createdAt")) as seconds_diff,
    CASE 
        WHEN m."createdAt" > ma."createdAt" THEN '✅ Adjunto creado primero (correcto)'
        WHEN m."createdAt" < ma."createdAt" THEN '❌ Mensaje creado primero (incorrecto)'
        ELSE '⚠️ Mismo timestamp'
    END as timing_analysis
FROM "Message" m
INNER JOIN "MessageAttachment" ma ON ma."messageId" = m.id
WHERE m."threadId" = '60ecdcca-f9df-4511-bb43-9c54d064405e'
ORDER BY m."createdAt" DESC
LIMIT 10;

-- =====================================================
-- PARTE 9: RESUMEN EJECUTIVO
-- =====================================================

-- 9.1 Resumen de estado del thread
SELECT 
    '📊 RESUMEN DEL THREAD' as seccion,
    '' as detalle
UNION ALL
SELECT 
    'Thread ID',
    '60ecdcca-f9df-4511-bb43-9c54d064405e'
UNION ALL
SELECT 
    'Total Mensajes',
    COUNT(*)::text
FROM "Message"
WHERE "threadId" = '60ecdcca-f9df-4511-bb43-9c54d064405e'
UNION ALL
SELECT 
    'Total Adjuntos',
    COUNT(*)::text
FROM "MessageAttachment"
WHERE "threadId" = '60ecdcca-f9df-4511-bb43-9c54d064405e'
UNION ALL
SELECT 
    'Adjuntos Vinculados',
    COUNT(*)::text
FROM "MessageAttachment"
WHERE "threadId" = '60ecdcca-f9df-4511-bb43-9c54d064405e'
AND "messageId" IS NOT NULL
UNION ALL
SELECT 
    'Adjuntos Huérfanos',
    COUNT(*)::text
FROM "MessageAttachment"
WHERE "threadId" = '60ecdcca-f9df-4511-bb43-9c54d064405e'
AND "messageId" IS NULL;

-- =====================================================
-- INSTRUCCIONES DE USO
-- =====================================================

/*
CÓMO EJECUTAR ESTA AUDITORÍA:

1. Ir a Supabase Dashboard → SQL Editor
2. Copiar y pegar este script completo
3. Ejecutar (Run)
4. Revisar los resultados de cada sección

SECCIONES CLAVE:
- PARTE 1: Ver últimos mensajes y adjuntos
- PARTE 2: Detectar adjuntos huérfanos
- PARTE 6: Diagnóstico del último adjunto enviado
- PARTE 9: Resumen ejecutivo

PROBLEMAS COMUNES A BUSCAR:
❌ Adjuntos con messageId = NULL (huérfanos)
❌ Mensajes sin adjuntos vinculados
❌ Archivos en storage sin registro en DB
❌ RLS policies bloqueando acceso
*/
