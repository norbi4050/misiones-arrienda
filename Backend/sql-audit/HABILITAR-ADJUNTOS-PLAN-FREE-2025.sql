-- =====================================================
-- HABILITAR ADJUNTOS PARA PLAN FREE
-- Fecha: 09 Octubre 2025
-- Objetivo: Permitir adjuntos en mensajes para usuarios FREE
-- =====================================================

-- 1. Ver configuración actual de planes
SELECT 
    plan_tier,
    max_active_properties,
    allow_attachments,
    allow_featured,
    max_attachment_size_mb,
    daily_attachment_count,
    description
FROM plan_limits_config
ORDER BY 
    CASE plan_tier
        WHEN 'free' THEN 1
        WHEN 'pro' THEN 2
        WHEN 'business' THEN 3
    END;

-- 2. Actualizar plan FREE para permitir adjuntos
UPDATE plan_limits_config
SET 
    allow_attachments = true,
    max_attachment_size_mb = 5,
    daily_attachment_count = 20,
    allowed_attachment_mimes = ARRAY['image/png', 'image/jpeg', 'image/jpg', 'application/pdf']::text[]
WHERE plan_tier = 'free';

-- 3. Verificar el cambio
SELECT 
    plan_tier,
    allow_attachments,
    max_attachment_size_mb,
    daily_attachment_count,
    allowed_attachment_mimes
FROM plan_limits_config
WHERE plan_tier = 'free';

-- 4. Ver todos los usuarios con plan FREE (para verificar que se aplicará)
SELECT 
    u.id,
    u.email,
    up.plan_tier,
    up.allow_attachments
FROM users u
LEFT JOIN user_plans up ON u.id = up.user_id
WHERE up.plan_tier = 'free' OR up.plan_tier IS NULL
LIMIT 10;

-- 5. NOTA: Si la tabla se llama diferente, usar estos queries alternativos:

-- Si no existe plan_limits_config, buscar en otras tablas:
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%plan%'
ORDER BY table_name;

-- Ver estructura de user_plans
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'user_plans'
AND table_schema = 'public'
ORDER BY ordinal_position;
