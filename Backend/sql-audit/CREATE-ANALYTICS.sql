-- SPRINT E: Analytics & Growth - Privacy-First Analytics Schema
-- Fecha: 2025-01-XX
-- Objetivo: Instrumentar analytics propios sin vendors externos

-- Tabla principal de eventos
create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  session_id text not null,
  event_name text not null,
  event_time timestamptz not null default now(),
  page text,
  referrer text,
  utm jsonb,
  payload jsonb,
  ip inet,
  ua text
);

-- Índices para performance
create index if not exists idx_ae_time on public.analytics_events(event_time);
create index if not exists idx_ae_event on public.analytics_events(event_name);
create index if not exists idx_ae_session on public.analytics_events(session_id);
create index if not exists idx_ae_user on public.analytics_events(user_id) where user_id is not null;

-- Vista KPI: Daily Active Users
create or replace view public.kpi_dau as
  select 
    date_trunc('day', event_time) as d,
    count(distinct coalesce(user_id::text, session_id)) as dau
  from public.analytics_events
  where event_time >= current_date - interval '90 days'
  group by 1 
  order by 1 desc;

-- Vista KPI: Funnel de Publicación
create or replace view public.kpi_funnel_publish as
  with e as (
    select session_id, event_name 
    from public.analytics_events 
    where event_time >= current_date - interval '30 days'
  )
  select
    (select count(distinct session_id) from e where event_name='visit_home') as v_home,
    (select count(distinct session_id) from e where event_name='visit_properties') as v_list,
    (select count(distinct session_id) from e where event_name='view_property') as v_detail,
    (select count(distinct session_id) from e where event_name='start_publish') as start_pub,
    (select count(distinct session_id) from e where event_name='complete_publish') as done_pub;

-- Vista KPI: CTR de Contacto
create or replace view public.kpi_contact_ctr as
  with e as (
    select session_id, event_name 
    from public.analytics_events 
    where event_time >= current_date - interval '30 days'
  )
  select
    (select count(distinct session_id) from e where event_name='view_property') as property_views,
    (select count(distinct session_id) from e where event_name='contact_click') as contact_clicks,
    case 
      when (select count(distinct session_id) from e where event_name='view_property') > 0
      then round(
        (select count(distinct session_id) from e where event_name='contact_click')::numeric / 
        (select count(distinct session_id) from e where event_name='view_property')::numeric * 100, 2
      )
      else 0
    end as ctr_percentage;

-- Vista KPI: Conversión a Mensajes
create or replace view public.kpi_message_conversion as
  with e as (
    select session_id, event_name 
    from public.analytics_events 
    where event_time >= current_date - interval '30 days'
  )
  select
    (select count(distinct session_id) from e where event_name='contact_click') as contact_clicks,
    (select count(distinct session_id) from e where event_name='message_sent') as messages_sent,
    case 
      when (select count(distinct session_id) from e where event_name='contact_click') > 0
      then round(
        (select count(distinct session_id) from e where event_name='message_sent')::numeric / 
        (select count(distinct session_id) from e where event_name='contact_click')::numeric * 100, 2
      )
      else 0
    end as conversion_percentage;

-- Vista KPI: Eventos de Monetización
create or replace view public.kpi_monetization as
  with e as (
    select session_id, event_name, payload
    from public.analytics_events 
    where event_time >= current_date - interval '30 days'
    and event_name in ('feature_click', 'feature_pref_created', 'feature_payment_approved', 'subscription_click', 'subscription_activated')
  )
  select
    (select count(distinct session_id) from e where event_name='feature_click') as feature_clicks,
    (select count(distinct session_id) from e where event_name='feature_pref_created') as feature_prefs,
    (select count(distinct session_id) from e where event_name='feature_payment_approved') as feature_payments,
    (select count(distinct session_id) from e where event_name='subscription_click') as sub_clicks,
    (select count(distinct session_id) from e where event_name='subscription_activated') as sub_activations;

-- RLS (Row Level Security) - Opcional
-- Permitir INSERT anónimo para ingesta, READ solo para admins
-- alter table public.analytics_events enable row level security;
-- create policy "Allow anonymous insert" on public.analytics_events for insert with check (true);
-- create policy "Allow admin read" on public.analytics_events for select using (
--   exists (select 1 from auth.users where auth.uid() = users.id and users.role = 'admin')
-- );

-- Comentarios de documentación
comment on table public.analytics_events is 'Privacy-first analytics events - GDPR compliant';
comment on column public.analytics_events.user_id is 'NULL if user opted out of analytics';
comment on column public.analytics_events.session_id is 'Browser session identifier (90 days)';
comment on column public.analytics_events.utm is 'UTM parameters: {source, medium, campaign, term, content}';
comment on column public.analytics_events.payload is 'Event-specific data (propertyId, filters, etc.)';
comment on column public.analytics_events.ip is 'Client IP for rate limiting (anonymized after 7 days)';
