-- =====================================================
-- AUDITORÍA COMPLETA DE BUCKETS DE STORAGE SUPABASE
-- =====================================================
-- Script para revisar detalladamente todos los buckets
-- y identificar qué falta por configurar

-- =====================================================
-- PASO 1: AUDITORÍA COMPLETA DE BUCKETS EXISTENTES
-- =====================================================

SELECT '🔍 AUDITORÍA COMPLETA DE BUCKETS DE STORAGE' as titulo;
SELECT '================================================' as separador;

-- Ver TODOS los buckets que existen en el proyecto
SELECT '📋 TODOS LOS BUCKETS EN EL PROYECTO:' as seccion;
SELECT 
    id as bucket_name,
    name as display_name,
    public as es_publico,
    CASE 
        WHEN public THEN '🌐 Público'
        ELSE '🔒 Privado'
    END as tipo_acceso,
    created_at as fecha_creacion,
    updated_at as ultima_actualizacion
FROM storage.buckets 
ORDER BY created_at DESC;

-- =====================================================
-- PASO 2: VERIFICACIÓN DE BUCKETS REQUERIDOS
-- =====================================================

SELECT '✅ VERIFICACIÓN DE BUCKETS REQUERIDOS:' as seccion;
SELECT '================================================' as separador;

-- Lista de buckets que DEBERÍAN existir para el proyecto
WITH buckets_requeridos AS (
    SELECT 'avatars' as bucket_requerido, 'Fotos de perfil de usuarios' as descripcion
    UNION ALL
    SELECT 'property-images', 'Imágenes de propiedades'
    UNION ALL
    SELECT 'profile-images', 'Imágenes adicionales de perfiles'
    UNION ALL
    SELECT 'community-images', 'Imágenes de la comunidad'
)
SELECT 
    br.bucket_requerido,
    br.descripcion,
    CASE 
        WHEN sb.id IS NOT NULL THEN '✅ EXISTE'
        ELSE '❌ FALTA'
    END as estado,
    CASE 
        WHEN sb.id IS NOT NULL AND sb.public THEN '🌐 Público'
        WHEN sb.id IS NOT NULL AND NOT sb.public THEN '🔒 Privado'
        ELSE '⚠️ No configurado'
    END as acceso,
    COALESCE(sb.created_at::text, 'No creado') as fecha_creacion
FROM buckets_requeridos br
LEFT JOIN storage.buckets sb ON br.bucket_requerido = sb.id
ORDER BY br.bucket_requerido;

-- =====================================================
-- PASO 3: RESUMEN EJECUTIVO
-- =====================================================

SELECT '📊 RESUMEN EJECUTIVO:' as seccion;
SELECT '================================================' as separador;

-- Contar buckets existentes vs requeridos
WITH buckets_requeridos AS (
    SELECT 'avatars' as bucket_requerido
    UNION ALL SELECT 'property-images'
    UNION ALL SELECT 'profile-images'
    UNION ALL SELECT 'community-images'
),
buckets_existentes AS (
    SELECT COUNT(*) as total_existentes
    FROM storage.buckets sb
    WHERE sb.id IN ('avatars', 'property-images', 'profile-images', 'community-images')
),
buckets_faltantes AS (
    SELECT COUNT(*) as total_faltantes
    FROM buckets_requeridos br
    LEFT JOIN storage.buckets sb ON br.bucket_requerido = sb.id
    WHERE sb.id IS NULL
)
SELECT 
    4 as buckets_requeridos,
    be.total_existentes,
    bf.total_faltantes,
    CASE 
        WHEN be.total_existentes = 4 THEN '✅ CONFIGURACIÓN COMPLETA'
        WHEN be.total_existentes > 0 THEN '⚠️ CONFIGURACIÓN PARCIAL'
        ELSE '❌ CONFIGURACIÓN FALTANTE'
    END as estado_general
FROM buckets_existentes be, buckets_faltantes bf;

-- =====================================================
-- PASO 4: BUCKETS ADICIONALES (NO REQUERIDOS)
-- =====================================================

SELECT '🔍 BUCKETS ADICIONALES ENCONTRADOS:' as seccion;
SELECT '================================================' as separador;

-- Mostrar buckets que existen pero no están en nuestra lista requerida
SELECT 
    id as bucket_adicional,
    name as display_name,
    CASE 
        WHEN public THEN '🌐 Público'
        ELSE '🔒 Privado'
    END as tipo_acceso,
    created_at as fecha_creacion,
    '💡 Bucket adicional - revisar si es necesario' as nota
FROM storage.buckets 
WHERE id NOT IN ('avatars', 'property-images', 'profile-images', 'community-images')
ORDER BY created_at DESC;

-- =====================================================
-- PASO 5: AUDITORÍA DE POLICIES POR BUCKET
-- =====================================================

SELECT '🔐 AUDITORÍA DE POLICIES POR BUCKET:' as seccion;
SELECT '================================================' as separador;

-- Contar policies por cada bucket requerido
WITH buckets_requeridos AS (
    SELECT 'avatars' as bucket_name
    UNION ALL SELECT 'property-images'
    UNION ALL SELECT 'profile-images'
    UNION ALL SELECT 'community-images'
)
SELECT 
    br.bucket_name,
    CASE 
        WHEN sb.id IS NOT NULL THEN '✅ Bucket existe'
        ELSE '❌ Bucket falta'
    END as estado_bucket,
    COALESCE(policy_count.total_policies, 0) as total_policies,
    CASE 
        WHEN COALESCE(policy_count.total_policies, 0) >= 3 THEN '✅ Policies completas'
        WHEN COALESCE(policy_count.total_policies, 0) > 0 THEN '⚠️ Policies parciales'
        ELSE '❌ Sin policies'
    END as estado_policies
FROM buckets_requeridos br
LEFT JOIN storage.buckets sb ON br.bucket_name = sb.id
LEFT JOIN (
    SELECT 
        CASE 
            WHEN policyname LIKE '%avatar%' THEN 'avatars'
            WHEN policyname LIKE '%property%' THEN 'property-images'
            WHEN policyname LIKE '%profile%' THEN 'profile-images'
            WHEN policyname LIKE '%community%' THEN 'community-images'
        END as bucket_name,
        COUNT(*) as total_policies
    FROM pg_policies 
    WHERE tablename = 'objects'
    AND schemaname = 'storage'
    AND (policyname LIKE '%avatar%' 
         OR policyname LIKE '%property%' 
         OR policyname LIKE '%profile%' 
         OR policyname LIKE '%community%')
    GROUP BY 1
) policy_count ON br.bucket_name = policy_count.bucket_name
ORDER BY br.bucket_name;

-- =====================================================
-- PASO 6: RECOMENDACIONES
-- =====================================================

SELECT '💡 RECOMENDACIONES:' as seccion;
SELECT '================================================' as separador;

-- Generar recomendaciones basadas en el estado actual
WITH estado_actual AS (
    SELECT 
        COUNT(CASE WHEN sb.id IS NOT NULL THEN 1 END) as buckets_existentes,
        COUNT(*) as buckets_requeridos
    FROM (
        SELECT 'avatars' as bucket_name
        UNION ALL SELECT 'property-images'
        UNION ALL SELECT 'profile-images'
        UNION ALL SELECT 'community-images'
    ) requeridos
    LEFT JOIN storage.buckets sb ON requeridos.bucket_name = sb.id
)
SELECT 
    CASE 
        WHEN buckets_existentes = 0 THEN 
            '🚀 Ejecutar: SUPABASE-STORAGE-DIAGNOSTICO-Y-CREACION.sql para crear todos los buckets'
        WHEN buckets_existentes < buckets_requeridos THEN 
            '⚠️ Ejecutar: SUPABASE-STORAGE-DIAGNOSTICO-Y-CREACION.sql para completar buckets faltantes'
        WHEN buckets_existentes = buckets_requeridos THEN 
            '✅ Todos los buckets están creados. Verificar policies con SUPABASE-POLICIES-BASICO.sql'
        ELSE '🔍 Revisar configuración - estado inesperado'
    END as recomendacion_principal
FROM estado_actual;

-- =====================================================
-- PASO 7: PRÓXIMOS PASOS
-- =====================================================

SELECT '🎯 PRÓXIMOS PASOS SUGERIDOS:' as seccion;
SELECT '================================================' as separador;

SELECT '1️⃣ Si faltan buckets: Ejecutar SUPABASE-STORAGE-DIAGNOSTICO-Y-CREACION.sql' as paso_1;
SELECT '2️⃣ Si faltan policies: Ejecutar SUPABASE-POLICIES-BASICO.sql' as paso_2;
SELECT '3️⃣ Verificar funcionamiento: Probar subida de imágenes en la app' as paso_3;
SELECT '4️⃣ Monitoreo: Ejecutar este script regularmente para auditoría' as paso_4;

-- =====================================================
-- MENSAJE FINAL
-- =====================================================

SELECT '🎉 AUDITORÍA COMPLETADA' as resultado;
SELECT 'Revisa los resultados arriba para identificar qué necesitas configurar' as instruccion;
