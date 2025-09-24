-- SPRINT D: Esquema de Monetización - Payments + Subscriptions
-- Fecha: 2025-01-15
-- Objetivo: MVP monetización con MercadoPago, destacados y plan agencia

-- =====================================================
-- TABLA: payments (pagos one-off para destacar anuncios)
-- =====================================================
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  property_id uuid references public.properties(id) on delete set null,
  type text not null check (type in ('FEATURE', 'OTHER')),
  provider text not null default 'MERCADOPAGO',
  provider_payment_id text, -- ID del pago en MercadoPago
  status text not null check (status in ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED')),
  amount numeric(10,2) not null,
  currency text not null default 'ARS',
  meta jsonb, -- Datos adicionales del pago (preference_id, etc.)
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Índices para payments
create index if not exists idx_payments_user_id on public.payments(user_id);
create index if not exists idx_payments_property_id on public.payments(property_id);
create index if not exists idx_payments_status on public.payments(status);
create index if not exists idx_payments_provider_id on public.payments(provider_payment_id);

-- =====================================================
-- TABLA: subscriptions (suscripciones plan agencia)
-- =====================================================
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan text not null check (plan in ('AGENCY_BASIC', 'AGENCY_PRO')),
  status text not null check (status in ('ACTIVE', 'PAST_DUE', 'CANCELLED', 'PAUSED')),
  started_at timestamptz not null default now(),
  current_period_start timestamptz not null default now(),
  current_period_end timestamptz not null default (now() + interval '1 month'),
  cancelled_at timestamptz,
  meta jsonb, -- Datos de MercadoPago subscription
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Índices para subscriptions
create index if not exists idx_subscriptions_user_id on public.subscriptions(user_id);
create index if not exists idx_subscriptions_status on public.subscriptions(status);
create index if not exists idx_subscriptions_period_end on public.subscriptions(current_period_end);

-- =====================================================
-- TRIGGERS para updated_at
-- =====================================================
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Trigger para payments
drop trigger if exists update_payments_updated_at on public.payments;
create trigger update_payments_updated_at
  before update on public.payments
  for each row execute function update_updated_at_column();

-- Trigger para subscriptions  
drop trigger if exists update_subscriptions_updated_at on public.subscriptions;
create trigger update_subscriptions_updated_at
  before update on public.subscriptions
  for each row execute function update_subscriptions_updated_at_column();

-- =====================================================
-- EXTENSIÓN: Campos featured en properties
-- =====================================================
-- Agregar campos para destacados (si no existen)
alter table public.properties 
add column if not exists featured boolean not null default false;

alter table public.properties 
add column if not exists featured_expires timestamptz;

-- Índice para featured
create index if not exists idx_properties_featured on public.properties(featured, featured_expires);

-- =====================================================
-- RLS POLICIES (Row Level Security)
-- =====================================================

-- Payments: usuarios solo ven sus propios pagos
alter table public.payments enable row level security;

drop policy if exists "Users can view own payments" on public.payments;
create policy "Users can view own payments" on public.payments
  for select using (auth.uid() = user_id);

drop policy if exists "Users can insert own payments" on public.payments;
create policy "Users can insert own payments" on public.payments
  for insert with check (auth.uid() = user_id);

-- Subscriptions: usuarios solo ven sus propias suscripciones
alter table public.subscriptions enable row level security;

drop policy if exists "Users can view own subscriptions" on public.subscriptions;
create policy "Users can view own subscriptions" on public.subscriptions
  for select using (auth.uid() = user_id);

drop policy if exists "Users can insert own subscriptions" on public.subscriptions;
create policy "Users can insert own subscriptions" on public.subscriptions
  for insert with check (auth.uid() = user_id);

-- =====================================================
-- FUNCIONES HELPER
-- =====================================================

-- Función para verificar si usuario tiene suscripción activa
create or replace function public.user_has_active_subscription(user_uuid uuid)
returns boolean as $$
begin
  return exists (
    select 1 from public.subscriptions 
    where user_id = user_uuid 
    and status = 'ACTIVE' 
    and current_period_end > now()
  );
end;
$$ language plpgsql security definer;

-- Función para contar propiedades activas del usuario
create or replace function public.user_active_properties_count(user_uuid uuid)
returns integer as $$
begin
  return (
    select count(*)::integer 
    from public.properties 
    where user_id = user_uuid 
    and status in ('PUBLISHED', 'DRAFT')
  );
end;
$$ language plpgsql security definer;

-- Función para verificar si puede publicar (free tier)
create or replace function public.user_can_publish_property(user_uuid uuid)
returns boolean as $$
declare
  active_count integer;
  has_subscription boolean;
begin
  active_count := public.user_active_properties_count(user_uuid);
  has_subscription := public.user_has_active_subscription(user_uuid);
  
  -- Free tier: 1 propiedad gratis
  -- Con suscripción: ilimitadas
  return (active_count = 0) or has_subscription;
end;
$$ language plpgsql security definer;

-- =====================================================
-- DATOS DE EJEMPLO (para testing)
-- =====================================================

-- Planes disponibles (para referencia)
comment on table public.subscriptions is 'Planes disponibles:
- AGENCY_BASIC: $2999 ARS/mes, hasta 10 propiedades, destacados incluidos
- AGENCY_PRO: $4999 ARS/mes, ilimitadas propiedades, destacados + analytics';

-- Tipos de pago (para referencia)
comment on table public.payments is 'Tipos de pago:
- FEATURE: Destacar anuncio ($999 ARS por 30 días)
- OTHER: Otros servicios futuros';

-- =====================================================
-- VERIFICACIONES DE INTEGRIDAD
-- =====================================================

-- Verificar que featured_expires sea futuro cuando featured=true
alter table public.properties 
add constraint check_featured_expires 
check (
  (featured = false) or 
  (featured = true and featured_expires > now())
);

-- Verificar que amount sea positivo
alter table public.payments 
add constraint check_positive_amount 
check (amount > 0);

-- Verificar que current_period_end sea posterior a start
alter table public.subscriptions 
add constraint check_period_order 
check (current_period_end > current_period_start);

-- =====================================================
-- GRANTS (permisos para aplicación)
-- =====================================================

-- Permitir a usuarios autenticados usar las funciones
grant execute on function public.user_has_active_subscription(uuid) to authenticated;
grant execute on function public.user_active_properties_count(uuid) to authenticated;
grant execute on function public.user_can_publish_property(uuid) to authenticated;

-- Permitir acceso a las tablas (RLS controla el acceso)
grant select, insert, update on public.payments to authenticated;
grant select, insert, update on public.subscriptions to authenticated;
grant select, update on public.properties to authenticated;
