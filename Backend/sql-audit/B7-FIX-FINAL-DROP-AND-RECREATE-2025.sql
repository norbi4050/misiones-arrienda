-- ============================================================================
-- B7 - FIX FINAL: DROP y RECREATE completo
-- Fecha: Enero 2025
-- Problema: Tabla analytics_events existe pero con schema incorrecto
-- Solución: DROP completo y recreación desde cero
-- ============================================================================

-- ⚠️ ADVERTENCIA: Este script BORRA la tabla analytics_events existente
-- Solo ejecutar si estás seguro de que quieres perder los datos actuales

-- ============================================================================
-- PASO 1: LIMPIAR TODO (DROP)
-- ============================================================================

-- Drop vistas primero (dependen de la tabla)
DROP VIEW IF EXISTS public.kpi_property_views_daily CASCADE;
DROP VIEW IF EXISTS public.kpi_profile_views_daily CASCADE;
DROP VIEW IF EXISTS public.kpi_leads_daily CASCADE;
DROP VIEW IF EXISTS public.kpi_signups_daily CASCADE;
DROP VIEW IF EXISTS public.kpi_logins_daily CASCADE;
DROP VIEW IF EXISTS public.kpi_publications_daily CASCADE;
DROP VIEW IF EXISTS public.kpi_plan_upgrades_daily CASCADE;
DROP VIEW IF EXISTS public.kpi_conversion_funnel_daily CASCADE;
DROP VIEW IF EXISTS public.kpi_utm_performance CASCADE;
DROP VIEW IF EXISTS public.kpi_top_properties CASCADE;
DROP VIEW IF EXISTS public.kpi_dau CASCADE;
DROP VIEW IF EXISTS public.kpi_funnel_publish CASCADE;
DROP VIEW IF EXISTS public.kpi_contact_ctr CASCADE;
DROP VIEW IF EXISTS public.kpi_message_conversion CASCADE;
DROP VIEW IF EXISTS public.kpi_monetization CASCADE;

-- Drop tabla
DROP TABLE IF EXISTS public.analytics_events CASCADE;

-- Drop enum si existe
DROP TYPE IF EXISTS event_type CASCADE;

-- ============================================================================
-- PASO 2: CREAR ENUM
-- ============================================================================

CREATE TYPE event_type AS ENUM (
    'page_view', 'visit_home', 'visit_properties', 'view_property', 'profile_view',
    'contact_click', 'contact_submit', 'message_sent',
    'attachment_uploaded', 'attachment_preview', 'attachment_download', 'attachment_delete', 'attachment_rate_limited',
    'share_click', 'shortlink_resolve',
    'signup_completed', 'login_completed',
    'start_publish', 'complete_publish', 'publish_completed',
    'feature_click', 'feature_pref_created', 'feature_payment_approved', 'subscription_click', 'subscription_activated', 'plan_upgrade',
    'carousel_next', 'carousel_zoom', 'map_open_gmaps',
    'property_favorite', 'property_unfavorite',
    'search_performed', 'filter_applied',
    'community_post_view', 'community_post_like', 'community_profile_view'
);

-- ============================================================================
-- PASO 3: CREAR TABLA COMPLETA (con todos los campos)
-- ============================================================================

CREATE TABLE public.analytics_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid,
    session_id text NOT NULL,
    event_name text NOT NULL,
    event_time timestamptz NOT NULL DEFAULT now(),
    page text,
    referrer text,
    utm jsonb,
    payload jsonb,
    ip inet,
    ua text,
    -- B7: Campos nuevos
    actor_role text,
    target_type text,
    target_id text
);

-- ============================================================================
-- PASO 4: CREAR TODOS LOS ÍNDICES
-- ============================================================================

CREATE INDEX idx_ae_time ON public.analytics_events(event_time);
CREATE INDEX idx_ae_event ON public.analytics_events(event_name);
CREATE INDEX idx_ae_session ON public.analytics_events(session_id);
CREATE INDEX idx_ae_user ON public.analytics_events(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_ae_actor_role ON public.analytics_events(actor_role) WHERE actor_role IS NOT NULL;
CREATE INDEX idx_ae_target ON public.analytics_events(target_type, target_id) WHERE target_type IS NOT NULL;
CREATE INDEX idx_ae_day ON public.analytics_events(date_trunc('day', event_time));
CREATE INDEX idx_ae_event_time_user ON public.analytics_events(event_name, event_time DESC, user_id);
CREATE INDEX idx_ae_payload_gin ON public.analytics_events USING gin(payload);
CREATE INDEX idx_ae_utm_gin ON public.analytics_events USING gin(utm);

-- ============================================================================
-- PASO 5: HABILITAR RLS Y CREAR POLÍTICAS
-- ============================================================================

ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "analytics_insert_open" 
ON public.analytics_events FOR INSERT WITH CHECK (true);

CREATE POLICY "analytics_select_own" 
ON public.analytics_events FOR SELECT
USING (auth.uid() IS NOT NULL AND user_id = auth.uid());

CREATE POLICY "analytics_select_admin" 
ON public.analytics_events FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE user_profiles.id = auth.uid()
        AND user_profiles.role = 'admin'
    )
);

-- ============================================================================
-- PASO 6: CREAR VISTAS KPI (Sprint E)
-- ============================================================================

CREATE VIEW public.kpi_dau AS
SELECT 
    date_trunc('day', event_time) as d,
    count(distinct coalesce(user_id::text, session_id)) as dau
FROM public.analytics_events
WHERE event_time >= current_date - interval '90 days'
GROUP BY 1 
ORDER BY 1 DESC;

CREATE VIEW public.kpi_funnel_publish AS
WITH e AS (
    SELECT session_id, event_name 
    FROM public.analytics_events 
    WHERE event_time >= current_date - interval '30 days'
)
SELECT
    (SELECT count(distinct session_id) FROM e WHERE event_name='visit_home') as v_home,
    (SELECT count(distinct session_id) FROM e WHERE event_name='visit_properties') as v_list,
    (SELECT count(distinct session_id) FROM e WHERE event_name='view_property') as v_detail,
    (SELECT count(distinct session_id) FROM e WHERE event_name='start_publish') as start_pub,
    (SELECT count(distinct session_id) FROM e WHERE event_name='complete_publish') as done_pub;

CREATE VIEW public.kpi_contact_ctr AS
WITH e AS (
    SELECT session_id, event_name 
    FROM public.analytics_events 
    WHERE event_time >= current_date - interval '30 days'
)
SELECT
    (SELECT count(distinct session_id) FROM e WHERE event_name='view_property') as property_views,
    (SELECT count(distinct session_id) FROM e WHERE event_name='contact_click') as contact_clicks,
    CASE 
        WHEN (SELECT count(distinct session_id) FROM e WHERE event_name='view_property') > 0
        THEN round(
            (SELECT count(distinct session_id) FROM e WHERE event_name='contact_click')::numeric / 
            (SELECT count(distinct session_id) FROM e WHERE event_name='view_property')::numeric * 100, 2
        )
        ELSE 0
    END as ctr_percentage;

CREATE VIEW public.kpi_message_conversion AS
WITH e AS (
    SELECT session_id, event_name 
    FROM public.analytics_events 
    WHERE event_time >= current_date - interval '30 days'
)
SELECT
    (SELECT count(distinct session_id) FROM e WHERE event_name='contact_click') as contact_clicks,
    (SELECT count(distinct session_id) FROM e WHERE event_name='message_sent') as messages_sent,
    CASE 
        WHEN (SELECT count(distinct session_id) FROM e WHERE event_name='contact_click') > 0
        THEN round(
            (SELECT count(distinct session_id) FROM e WHERE event_name='message_sent')::numeric / 
            (SELECT count(distinct session_id) FROM e WHERE event_name='contact_click')::numeric * 100, 2
        )
        ELSE 0
    END as conversion_percentage;

CREATE VIEW public.kpi_monetization AS
WITH e AS (
    SELECT session_id, event_name, payload
    FROM public.analytics_events 
    WHERE event_time >= current_date - interval '30 days'
    AND event_name IN ('feature_click', 'feature_pref_created', 'feature_payment_approved', 'subscription_click', 'subscription_activated')
)
SELECT
    (SELECT count(distinct session_id) FROM e WHERE event_name='feature_click') as feature_clicks,
    (SELECT count(distinct session_id) FROM e WHERE event_name='feature_pref_created') as feature_prefs,
    (SELECT count(distinct session_id) FROM e WHERE event_name='feature_payment_approved') as feature_payments,
    (SELECT count(distinct session_id) FROM e WHERE event_name='subscription_click') as sub_clicks,
    (SELECT count(distinct session_id) FROM e WHERE event_name='subscription_activated') as sub_activations;

-- ============================================================================
-- PASO 7: CREAR VISTAS KPI B7
-- ============================================================================

CREATE VIEW public.kpi_property_views_daily AS
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

CREATE VIEW public.kpi_profile_views_daily AS
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

CREATE VIEW public.kpi_leads_daily AS
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

CREATE VIEW public.kpi_signups_daily AS
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

CREATE VIEW public.kpi_logins_daily AS
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

CREATE VIEW public.kpi_publications_daily AS
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

CREATE VIEW public.kpi_plan_upgrades_daily AS
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

CREATE VIEW public.kpi_conversion_funnel_daily AS
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
    ROUND(
        COUNT(DISTINCT session_id) FILTER (WHERE event_name = 'visit_properties')::numeric / 
        NULLIF(COUNT(DISTINCT session_id) FILTER (WHERE event_name IN ('page_view', 'visit_home')), 0) * 100, 2
    ) as browse_rate,
    ROUND(
        COUNT(DISTINCT session_id) FILTER (WHERE event_name IN ('view_property', 'property_view'))::numeric / 
        NULLIF(COUNT(DISTINCT session_id) FILTER (WHERE event_name = 'visit_properties'), 0) * 100, 2
    ) as detail_rate,
    ROUND(
        COUNT(DISTINCT session_id) FILTER (WHERE event_name = 'contact_click')::numeric / 
        NULLIF(COUNT(DISTINCT session_id) FILTER (WHERE event_name IN ('view_property', 'property_view')), 0) * 100, 2
    ) as contact_rate,
    ROUND(
        COUNT(DISTINCT session_id) FILTER (WHERE event_name = 'message_sent')::numeric / 
        NULLIF(COUNT(DISTINCT session_id) FILTER (WHERE event_name = 'contact_click'), 0) * 100, 2
    ) as message_rate
FROM daily_events
GROUP BY day
ORDER BY day DESC;

CREATE VIEW public.kpi_utm_performance AS
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

CREATE VIEW public.kpi_top_properties AS
SELECT 
    COALESCE(target_id, payload->>'propertyId') as property_id,
    COUNT(*) as total_views,
    COUNT(DISTINCT session_id) as unique_sessions,
    COUNT(DISTINCT user_id) FILTER (WHERE user_id IS NOT NULL) as authenticated_views,
    COUNT(*) FILTER (WHERE event_name = 'contact_click') as contact_clicks,
    ROUND(
        COUNT(*) FILTER (WHERE event_name = 'contact_click')::numeric / 
        NULLIF(COUNT(*), 0) * 100, 2
    ) as contact_rate
FROM public.analytics_events
WHERE event_name IN ('view_property', 'property_view', 'contact_click')
    AND event_time >= current_date - interval '30 days'
    AND (target_id IS NOT NULL OR payload->>'propertyId' IS NOT NULL)
GROUP BY 1
HAVING COUNT(*) >= 10
ORDER BY 2 DESC
LIMIT 100;

-- ============================================================================
-- PASO 8: GRANTS
-- ============================================================================

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
GRANT SELECT ON public.kpi_dau TO authenticated;
GRANT SELECT ON public.kpi_funnel_publish TO authenticated;
GRANT SELECT ON public.kpi_contact_ctr TO authenticated;
GRANT SELECT ON public.kpi_message_conversion TO authenticated;
GRANT SELECT ON public.kpi_monetization TO authenticated;

-- ============================================================================
-- PASO 9: COMENTARIOS
-- ============================================================================

COMMENT ON TABLE public.analytics_events IS 'B7: Privacy-first analytics events - GDPR compliant';
COMMENT ON COLUMN public.analytics_events.user_id IS 'NULL if user opted out of analytics';
COMMENT ON COLUMN public.analytics_events.session_id IS 'Browser session identifier (90 days)';
COMMENT ON COLUMN public.analytics_events.event_name IS 'Event type (see event_type enum for valid values)';
COMMENT ON COLUMN public.analytics_events.event_time IS 'Timestamp when event occurred';
COMMENT ON COLUMN public.analytics_events.utm IS 'UTM parameters: {source, medium, campaign, term, content}';
COMMENT ON COLUMN public.analytics_events.payload IS 'Event-specific data (propertyId, filters, etc.)';
COMMENT ON COLUMN public.analytics_events.ip IS 'Client IP for rate limiting';
COMMENT ON COLUMN public.analytics_events.actor_role IS 'B7: Rol del usuario (inmobiliaria, inquilino, admin, anonymous)';
COMMENT ON COLUMN public.analytics_events.target_type IS 'B7: Tipo de entidad (property, agency, profile, post)';
COMMENT ON COLUMN public.analytics_events.target_id IS 'B7: ID de la entidad target';

-- ============================================================================
-- VERIFICACIÓN FINAL
-- ============================================================================

DO $$
DECLARE
    column_count integer;
    index_count integer;
    policy_count integer;
    view_count integer;
BEGIN
    -- Contar columnas
    SELECT COUNT(*) INTO column_count
    FROM information_schema.columns
    WHERE table_name = 'analytics_events';
    
    RAISE NOTICE '✅ Columnas creadas: %', column_count;
    
    -- Contar índices
    SELECT COUNT(*) INTO index_count
    FROM pg_indexes
    WHERE tablename = 'analytics_events';
    
    RAISE NOTICE '✅ Índices creados: %', index_count;
    
    -- Contar políticas
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies
    WHERE tablename = 'analytics_events';
    
    RAISE NOTICE '✅ Políticas RLS creadas: %', policy_count;
    
    -- Contar vistas
    SELECT COUNT(*) INTO view_count
    FROM information_schema.views
    WHERE table_schema = 'public'
    AND table_name LIKE 'kpi_%';
    
    RAISE NOTICE '✅ Vistas KPI creadas: %', view_count;
    
    RAISE NOTICE '🎉 B7 IMPLEMENTACIÓN COMPLETADA EXITOSAMENTE';
END $$;
