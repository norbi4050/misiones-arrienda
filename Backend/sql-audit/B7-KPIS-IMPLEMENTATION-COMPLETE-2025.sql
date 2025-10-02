-- ============================================================================
-- B7 - KPIs IMPLEMENTATION - FASE 2
-- Fecha: Enero 2025
-- Objetivo: Mejoras incrementales al sistema de analytics existente
-- Base: Sprint E (CREATE-ANALYTICS.sql)
-- ============================================================================

-- ============================================================================
-- PASO 1: CREAR ENUM PARA EVENT TYPES
-- ============================================================================

-- Crear enum con todos los eventos (existentes + nuevos)
DO $$ BEGIN
    CREATE TYPE event_type AS ENUM (
        -- Navegación
        'page_view',
        'visit_home',
        'visit_properties',
        'view_property',
        'profile_view',
        
        -- Contacto
        'contact_click',
        'contact_submit',
        'message_sent',
        
        -- Adjuntos (B6)
        'attachment_uploaded',
        'attachment_preview',
        'attachment_download',
        'attachment_delete',
        'attachment_rate_limited',
        
        -- Compartir (B5)
        'share_click',
        'shortlink_resolve',
        
        -- Auth
        'signup_completed',
        'login_completed',
        
        -- Publicación
        'start_publish',
        'complete_publish',
        'publish_completed',
        
        -- Monetización
        'feature_click',
        'feature_pref_created',
        'feature_payment_approved',
        'subscription_click',
        'subscription_activated',
        'plan_upgrade',
        
        -- UX/Interacción
        'carousel_next',
        'carousel_zoom',
        'map_open_gmaps',
        
        -- Favoritos
        'property_favorite',
        'property_unfavorite',
        
        -- Búsqueda
        'search_performed',
        'filter_applied',
        
        -- Comunidad
        'community_post_view',
        'community_post_like',
        'community_profile_view'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

COMMENT ON TYPE event_type IS 'Tipos de eventos válidos para analytics - B7 KPIs';

-- ============================================================================
-- PASO 2: AGREGAR CAMPOS ADICIONALES A analytics_events
-- ============================================================================

-- Agregar campos para mejor indexación (si no existen)
DO $$ BEGIN
    -- Campo actor_role
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'analytics_events' 
        AND column_name = 'actor_role'
    ) THEN
        ALTER TABLE public.analytics_events 
        ADD COLUMN actor_role text;
        
        COMMENT ON COLUMN public.analytics_events.actor_role IS 
        'Rol del usuario: inmobiliaria, inquilino, admin, anonymous';
    END IF;
    
    -- Campo target_type
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'analytics_events' 
        AND column_name = 'target_type'
    ) THEN
        ALTER TABLE public.analytics_events 
        ADD COLUMN target_type text;
        
        COMMENT ON COLUMN public.analytics_events.target_type IS 
        'Tipo de entidad: property, agency, profile, post, conversation';
    END IF;
    
    -- Campo target_id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'analytics_events' 
        AND column_name = 'target_id'
    ) THEN
        ALTER TABLE public.analytics_events 
        ADD COLUMN target_id text;
        
        COMMENT ON COLUMN public.analytics_events.target_id IS 
        'ID de la entidad target (UUID o slug)';
    END IF;
END $$;

-- ============================================================================
-- PASO 3: MODIFICAR event_name A USAR EL ENUM (OPCIONAL - COMENTADO)
-- ============================================================================

-- NOTA: Esto es opcional y puede romper eventos existentes
-- Descomentar solo si se desea validación estricta

-- ALTER TABLE public.analytics_events 
--   ALTER COLUMN event_name TYPE event_type 
--   USING event_name::event_type;

-- Por ahora mantenemos event_name como TEXT para flexibilidad

-- ============================================================================
-- PASO 4: CREAR ÍNDICES ADICIONALES
-- ============================================================================

-- Índice en actor_role
CREATE INDEX IF NOT EXISTS idx_ae_actor_role 
ON public.analytics_events(actor_role) 
WHERE actor_role IS NOT NULL;

-- Índice en target (type + id)
CREATE INDEX IF NOT EXISTS idx_ae_target 
ON public.analytics_events(target_type, target_id) 
WHERE target_type IS NOT NULL;

-- Índice en día (para queries de KPIs diarios)
CREATE INDEX IF NOT EXISTS idx_ae_day 
ON public.analytics_events(date_trunc('day', event_time));

-- Índice compuesto para queries comunes
CREATE INDEX IF NOT EXISTS idx_ae_event_time_user 
ON public.analytics_events(event_name, event_time DESC, user_id);

-- Índice GIN en payload para búsquedas JSONB
CREATE INDEX IF NOT EXISTS idx_ae_payload_gin 
ON public.analytics_events USING gin(payload);

-- Índice GIN en utm para búsquedas JSONB
CREATE INDEX IF NOT EXISTS idx_ae_utm_gin 
ON public.analytics_events USING gin(utm);

-- ============================================================================
-- PASO 5: HABILITAR RLS (ROW LEVEL SECURITY)
-- ============================================================================

-- Habilitar RLS en la tabla
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes si existen
DROP POLICY IF EXISTS "analytics_insert_open" ON public.analytics_events;
DROP POLICY IF EXISTS "analytics_select_own" ON public.analytics_events;
DROP POLICY IF EXISTS "analytics_select_admin" ON public.analytics_events;
DROP POLICY IF EXISTS "analytics_select_service" ON public.analytics_events;

-- Política 1: INSERT abierto para todos (anónimos + autenticados)
CREATE POLICY "analytics_insert_open" 
ON public.analytics_events
FOR INSERT
WITH CHECK (true);

COMMENT ON POLICY "analytics_insert_open" ON public.analytics_events IS 
'Permite INSERT a cualquier usuario (anónimo o autenticado) para tracking';

-- Política 2: SELECT solo para propios eventos (usuarios autenticados)
CREATE POLICY "analytics_select_own" 
ON public.analytics_events
FOR SELECT
USING (
    auth.uid() IS NOT NULL 
    AND user_id = auth.uid()
);

COMMENT ON POLICY "analytics_select_own" ON public.analytics_events IS 
'Usuarios autenticados pueden ver solo sus propios eventos';

-- Política 3: SELECT para admins (todos los eventos)
CREATE POLICY "analytics_select_admin" 
ON public.analytics_events
FOR SELECT
USING (
    EXISTS (
        SELECT 1 
        FROM public.user_profiles
        WHERE user_profiles.id = auth.uid()
        AND user_profiles.role = 'admin'
    )
);

COMMENT ON POLICY "analytics_select_admin" ON public.analytics_events IS 
'Administradores pueden ver todos los eventos';

-- NOTA: service_role bypasses RLS automáticamente

-- ============================================================================
-- PASO 6: CREAR VISTAS KPI ADICIONALES
-- ============================================================================

-- Vista 1: Property Views Daily
CREATE OR REPLACE VIEW public.kpi_property_views_daily AS
SELECT 
    date_trunc('day', event_time)::date as day,
    COALESCE(target_id, payload->>'propertyId') as property_id,
    COUNT(*) as total_views,
    COUNT(DISTINCT session_id) as unique_sessions,
    COUNT(DISTINCT user_id) FILTER (WHERE user_id IS NOT NULL) as authenticated_views,
    COUNT(*) FILTER (WHERE actor_role = 'inmobiliaria') as inmobiliaria_views,
    COUNT(*) FILTER (WHERE actor_role = 'inquilino') as inquilino_views
FROM public.analytics_events
WHERE event_name IN ('view_property', 'property_view')
    AND event_time >= current_date - interval '90 days'
    AND (target_id IS NOT NULL OR payload->>'propertyId' IS NOT NULL)
GROUP BY 1, 2
ORDER BY 1 DESC, 3 DESC;

COMMENT ON VIEW public.kpi_property_views_daily IS 
'B7: Vistas de propiedades por día con segmentación por rol';

-- Vista 2: Profile Views Daily (Inmobiliarias)
CREATE OR REPLACE VIEW public.kpi_profile_views_daily AS
SELECT 
    date_trunc('day', event_time)::date as day,
    COALESCE(target_id, payload->>'entity_id', payload->>'profileId') as profile_id,
    COUNT(*) as total_views,
    COUNT(DISTINCT session_id) as unique_sessions,
    COUNT(DISTINCT user_id) FILTER (WHERE user_id IS NOT NULL) as authenticated_views
FROM public.analytics_events
WHERE event_name IN ('profile_view', 'community_profile_view')
    AND event_time >= current_date - interval '90 days'
    AND (target_id IS NOT NULL OR payload->>'entity_id' IS NOT NULL OR payload->>'profileId' IS NOT NULL)
GROUP BY 1, 2
ORDER BY 1 DESC, 3 DESC;

COMMENT ON VIEW public.kpi_profile_views_daily IS 
'B7: Vistas de perfiles de inmobiliarias por día';

-- Vista 3: Leads Daily (Contactos + Mensajes)
CREATE OR REPLACE VIEW public.kpi_leads_daily AS
SELECT 
    date_trunc('day', event_time)::date as day,
    COUNT(*) as total_leads,
    COUNT(DISTINCT user_id) FILTER (WHERE user_id IS NOT NULL) as unique_users,
    COUNT(DISTINCT session_id) as unique_sessions,
    COUNT(*) FILTER (WHERE event_name = 'contact_click') as contact_clicks,
    COUNT(*) FILTER (WHERE event_name = 'message_sent') as messages_sent,
    COUNT(*) FILTER (WHERE payload->>'contactType' = 'whatsapp') as whatsapp_leads,
    COUNT(*) FILTER (WHERE payload->>'contactType' = 'phone') as phone_leads,
    COUNT(*) FILTER (WHERE payload->>'contactType' = 'message') as message_leads
FROM public.analytics_events
WHERE event_name IN ('contact_click', 'contact_submit', 'message_sent')
    AND event_time >= current_date - interval '90 days'
GROUP BY 1
ORDER BY 1 DESC;

COMMENT ON VIEW public.kpi_leads_daily IS 
'B7: Leads generados por día (contactos + mensajes)';

-- Vista 4: Signups Daily
CREATE OR REPLACE VIEW public.kpi_signups_daily AS
SELECT 
    date_trunc('day', event_time)::date as day,
    COUNT(*) as total_signups,
    COUNT(*) FILTER (WHERE actor_role = 'inmobiliaria' OR payload->>'role' = 'inmobiliaria') as inmobiliaria_signups,
    COUNT(*) FILTER (WHERE actor_role = 'inquilino' OR payload->>'role' = 'inquilino') as inquilino_signups,
    COUNT(*) FILTER (WHERE payload->>'plan' = 'free') as free_signups,
    COUNT(*) FILTER (WHERE payload->>'plan' IN ('basic', 'premium')) as paid_signups
FROM public.analytics_events
WHERE event_name = 'signup_completed'
    AND event_time >= current_date - interval '90 days'
GROUP BY 1
ORDER BY 1 DESC;

COMMENT ON VIEW public.kpi_signups_daily IS 
'B7: Registros completados por día con segmentación por rol y plan';

-- Vista 5: Logins Daily
CREATE OR REPLACE VIEW public.kpi_logins_daily AS
SELECT 
    date_trunc('day', event_time)::date as day,
    COUNT(*) as total_logins,
    COUNT(DISTINCT user_id) as unique_users,
    COUNT(*) FILTER (WHERE actor_role = 'inmobiliaria') as inmobiliaria_logins,
    COUNT(*) FILTER (WHERE actor_role = 'inquilino') as inquilino_logins,
    COUNT(*) FILTER (WHERE payload->>'method' = 'email') as email_logins,
    COUNT(*) FILTER (WHERE payload->>'method' = 'google') as google_logins
FROM public.analytics_events
WHERE event_name = 'login_completed'
    AND event_time >= current_date - interval '90 days'
GROUP BY 1
ORDER BY 1 DESC;

COMMENT ON VIEW public.kpi_logins_daily IS 
'B7: Logins por día con segmentación por rol y método';

-- Vista 6: Publications Daily
CREATE OR REPLACE VIEW public.kpi_publications_daily AS
SELECT 
    date_trunc('day', event_time)::date as day,
    COUNT(*) as total_publications,
    COUNT(DISTINCT user_id) as unique_publishers,
    COUNT(*) FILTER (WHERE payload->>'plan' = 'free') as free_publications,
    COUNT(*) FILTER (WHERE payload->>'plan' = 'basic') as basic_publications,
    COUNT(*) FILTER (WHERE payload->>'plan' = 'premium') as premium_publications
FROM public.analytics_events
WHERE event_name IN ('complete_publish', 'publish_completed')
    AND event_time >= current_date - interval '90 days'
GROUP BY 1
ORDER BY 1 DESC;

COMMENT ON VIEW public.kpi_publications_daily IS 
'B7: Publicaciones completadas por día con segmentación por plan';

-- Vista 7: Plan Upgrades Daily
CREATE OR REPLACE VIEW public.kpi_plan_upgrades_daily AS
SELECT 
    date_trunc('day', event_time)::date as day,
    COUNT(*) as total_upgrades,
    COUNT(DISTINCT user_id) as unique_users,
    payload->>'from_plan' as from_plan,
    payload->>'to_plan' as to_plan,
    SUM((payload->>'amount')::numeric) as total_revenue
FROM public.analytics_events
WHERE event_name = 'plan_upgrade'
    AND event_time >= current_date - interval '90 days'
GROUP BY 1, 3, 4
ORDER BY 1 DESC, 5 DESC;

COMMENT ON VIEW public.kpi_plan_upgrades_daily IS 
'B7: Upgrades de plan por día con revenue';

-- Vista 8: Conversion Funnel (Mejorada)
CREATE OR REPLACE VIEW public.kpi_conversion_funnel_daily AS
WITH daily_events AS (
    SELECT 
        date_trunc('day', event_time)::date as day,
        session_id,
        event_name
    FROM public.analytics_events
    WHERE event_time >= current_date - interval '30 days'
)
SELECT 
    day,
    COUNT(DISTINCT session_id) FILTER (WHERE event_name IN ('page_view', 'visit_home')) as step1_visit,
    COUNT(DISTINCT session_id) FILTER (WHERE event_name = 'visit_properties') as step2_browse,
    COUNT(DISTINCT session_id) FILTER (WHERE event_name IN ('view_property', 'property_view')) as step3_detail,
    COUNT(DISTINCT session_id) FILTER (WHERE event_name = 'contact_click') as step4_contact,
    COUNT(DISTINCT session_id) FILTER (WHERE event_name = 'message_sent') as step5_message,
    -- Tasas de conversión
    ROUND(
        COUNT(DISTINCT session_id) FILTER (WHERE event_name = 'visit_properties')::numeric / 
        NULLIF(COUNT(DISTINCT session_id) FILTER (WHERE event_name IN ('page_view', 'visit_home')), 0) * 100, 
        2
    ) as browse_rate,
    ROUND(
        COUNT(DISTINCT session_id) FILTER (WHERE event_name IN ('view_property', 'property_view'))::numeric / 
        NULLIF(COUNT(DISTINCT session_id) FILTER (WHERE event_name = 'visit_properties'), 0) * 100, 
        2
    ) as detail_rate,
    ROUND(
        COUNT(DISTINCT session_id) FILTER (WHERE event_name = 'contact_click')::numeric / 
        NULLIF(COUNT(DISTINCT session_id) FILTER (WHERE event_name IN ('view_property', 'property_view')), 0) * 100, 
        2
    ) as contact_rate,
    ROUND(
        COUNT(DISTINCT session_id) FILTER (WHERE event_name = 'message_sent')::numeric / 
        NULLIF(COUNT(DISTINCT session_id) FILTER (WHERE event_name = 'contact_click'), 0) * 100, 
        2
    ) as message_rate
FROM daily_events
GROUP BY day
ORDER BY day DESC;

COMMENT ON VIEW public.kpi_conversion_funnel_daily IS 
'B7: Funnel de conversión diario con tasas de conversión entre pasos';

-- Vista 9: UTM Performance
CREATE OR REPLACE VIEW public.kpi_utm_performance AS
SELECT 
    utm->>'source' as utm_source,
    utm->>'medium' as utm_medium,
    utm->>'campaign' as utm_campaign,
    COUNT(*) as total_events,
    COUNT(DISTINCT session_id) as unique_sessions,
    COUNT(DISTINCT user_id) FILTER (WHERE user_id IS NOT NULL) as conversions,
    COUNT(*) FILTER (WHERE event_name = 'signup_completed') as signups,
    COUNT(*) FILTER (WHERE event_name IN ('complete_publish', 'publish_completed')) as publications
FROM public.analytics_events
WHERE utm IS NOT NULL
    AND event_time >= current_date - interval '30 days'
GROUP BY 1, 2, 3
ORDER BY 4 DESC;

COMMENT ON VIEW public.kpi_utm_performance IS 
'B7: Performance de campañas UTM (últimos 30 días)';

-- Vista 10: Top Properties by Views
CREATE OR REPLACE VIEW public.kpi_top_properties AS
SELECT 
    COALESCE(target_id, payload->>'propertyId') as property_id,
    COUNT(*) as total_views,
    COUNT(DISTINCT session_id) as unique_sessions,
    COUNT(DISTINCT user_id) FILTER (WHERE user_id IS NOT NULL) as authenticated_views,
    COUNT(*) FILTER (WHERE event_name = 'contact_click') as contact_clicks,
    ROUND(
        COUNT(*) FILTER (WHERE event_name = 'contact_click')::numeric / 
        NULLIF(COUNT(*), 0) * 100, 
        2
    ) as contact_rate
FROM public.analytics_events
WHERE event_name IN ('view_property', 'property_view', 'contact_click')
    AND event_time >= current_date - interval '30 days'
    AND (target_id IS NOT NULL OR payload->>'propertyId' IS NOT NULL)
GROUP BY 1
HAVING COUNT(*) >= 10  -- Mínimo 10 vistas
ORDER BY 2 DESC
LIMIT 100;

COMMENT ON VIEW public.kpi_top_properties IS 
'B7: Top 100 propiedades por vistas (últimos 30 días)';

-- ============================================================================
-- PASO 7: FUNCIÓN HELPER PARA LIMPIAR DATOS ANTIGUOS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.cleanup_old_analytics_events(days_to_keep integer DEFAULT 365)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    deleted_count integer;
BEGIN
    -- Solo service_role puede ejecutar esto
    IF current_setting('request.jwt.claims', true)::json->>'role' != 'service_role' THEN
        RAISE EXCEPTION 'Only service_role can cleanup analytics events';
    END IF;
    
    DELETE FROM public.analytics_events
    WHERE event_time < current_date - (days_to_keep || ' days')::interval;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$$;

COMMENT ON FUNCTION public.cleanup_old_analytics_events IS 
'B7: Limpia eventos de analytics más antiguos que X días (default 365). Solo service_role.';

-- ============================================================================
-- PASO 8: GRANTS Y PERMISOS
-- ============================================================================

-- Permitir SELECT en vistas para usuarios autenticados
GRANT SELECT ON public.kpi_property_views_daily TO authenticated;
GRANT SELECT ON public.kpi_profile_views_daily TO authenticated;
GRANT SELECT ON public.kpi_leads_daily TO authenticated;
GRANT SELECT ON public.kpi_signups_daily TO authenticated;
GRANT SELECT ON public.kpi_logins_daily TO authenticated;
GRANT SELECT ON public.kpi_publications_daily TO authenticated;
GRANT SELECT ON public.kpi_plan_upgrades_daily TO authenticated;
GRANT SELECT ON public.kpi_conversion_funnel_daily TO authenticated;
GRANT SELECT ON public.kpi_utm_performance TO authenticated;
GRANT SELECT ON public.kpi_top_properties TO authenticated;

-- Las vistas existentes del Sprint E también necesitan grants
GRANT SELECT ON public.kpi_dau TO authenticated;
GRANT SELECT ON public.kpi_funnel_publish TO authenticated;
GRANT SELECT ON public.kpi_contact_ctr TO authenticated;
GRANT SELECT ON public.kpi_message_conversion TO authenticated;
GRANT SELECT ON public.kpi_monetization TO authenticated;

-- ============================================================================
-- PASO 9: VERIFICACIÓN Y TESTING
-- ============================================================================

-- Verificar que la tabla existe y tiene los campos correctos
DO $$
DECLARE
    column_count integer;
BEGIN
    SELECT COUNT(*) INTO column_count
    FROM information_schema.columns
    WHERE table_name = 'analytics_events'
    AND column_name IN ('actor_role', 'target_type', 'target_id');
    
    IF column_count = 3 THEN
        RAISE NOTICE 'SUCCESS: Todos los campos nuevos fueron agregados correctamente';
    ELSE
        RAISE WARNING 'WARNING: Faltan campos. Encontrados: %', column_count;
    END IF;
END $$;

-- Verificar que RLS está habilitado
DO $$
DECLARE
    rls_enabled boolean;
BEGIN
    SELECT relrowsecurity INTO rls_enabled
    FROM pg_class
    WHERE relname = 'analytics_events';
    
    IF rls_enabled THEN
        RAISE NOTICE 'SUCCESS: RLS está habilitado en analytics_events';
    ELSE
        RAISE WARNING 'WARNING: RLS NO está habilitado';
    END IF;
END $$;

-- Contar políticas RLS
DO $$
DECLARE
    policy_count integer;
BEGIN
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies
    WHERE tablename = 'analytics_events';
    
    RAISE NOTICE 'INFO: % políticas RLS encontradas en analytics_events', policy_count;
END $$;

-- Verificar índices
DO $$
DECLARE
    index_count integer;
BEGIN
    SELECT COUNT(*) INTO index_count
    FROM pg_indexes
    WHERE tablename = 'analytics_events'
    AND indexname LIKE 'idx_ae_%';
    
    RAISE NOTICE 'INFO: % índices personalizados encontrados', index_count;
END $$;

-- ============================================================================
-- RESUMEN DE CAMBIOS
-- ============================================================================

/*
CAMBIOS IMPLEMENTADOS:

1. ✅ Enum event_type creado con 35+ eventos
2. ✅ 3 campos nuevos agregados: actor_role, target_type, target_id
3. ✅ 6 índices adicionales creados para performance
4. ✅ RLS habilitado con 3 políticas de seguridad
5. ✅ 10 vistas KPI nuevas creadas
6. ✅ Función de limpieza de datos antiguos
7. ✅ Grants configurados correctamente
8. ✅ Verificaciones automáticas incluidas

COMPATIBILIDAD:
- ✅ No rompe código existente (campos opcionales)
- ✅ Vistas del Sprint E siguen funcionando
- ✅ event_name sigue siendo TEXT (flexible)
- ✅ Migración segura sin downtime

PRÓXIMOS PASOS:
1. Ejecutar este SQL en Supabase
2. Actualizar src/lib/analytics/track.ts con nuevos eventos
3. Testing exhaustivo
4. Documentación actualizada
*/

-- ============================================================================
-- FIN DEL SCRIPT
-- ============================================================================
