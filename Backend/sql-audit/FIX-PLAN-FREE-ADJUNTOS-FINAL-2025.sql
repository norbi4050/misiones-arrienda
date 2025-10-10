-- =====================================================
-- FIX FINAL: Habilitar adjuntos para plan FREE
-- =====================================================

-- 1. Ver estructura real de plan_limits_config
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'plan_limits_config'
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Ver contenido actual de plan_limits_config
SELECT *
FROM plan_limits_config
ORDER BY plan_tier;

-- 3. Ver la función RPC que usa el código
SELECT 
    routine_name,
    routine_definition
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name = 'get_user_plan_limits';

-- 4. SOLUCIÓN TEMPORAL: Modificar directamente en el código
-- Como no sabemos la estructura exacta de plan_limits_config,
-- la mejor solución es modificar attachment-guards.ts para
-- permitir adjuntos en plan FREE sin verificar allow_attachments

-- 5. Ver plan del usuario Carlos
SELECT 
    up.id,
    up.user_id,
    up.plan_tier,
    up.plan_expires_at,
    up.created_at
FROM user_plans up
WHERE up.user_id = '6403f9d2-e846-4c70-87e0-e051127d9500';
