-- Configuracion completa de Supabase para Misiones Arrienda
-- Ejecutar en SQL Editor de Supabase Dashboard

-- 1. Crear tabla de perfiles
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Crear índice para optimizar consultas
create index if not exists idx_profiles_created_at on public.profiles(created_at desc);

-- Habilitar Row Level Security
alter table public.profiles enable row level security;

-- 2. Crear políticas RLS
create policy "Select own profile" on public.profiles 
for select to authenticated 
using (auth.uid() = id);

create policy "Insert own profile" on public.profiles 
for insert to authenticated 
with check (auth.uid() = id);

create policy "Update own profile" on public.profiles 
for update to authenticated 
using (auth.uid() = id) with check (auth.uid() = id);

-- 3. Crear función y trigger para auto-crear perfiles
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$;

-- Eliminar trigger existente si existe
drop trigger if exists on_auth_user_created on auth.users;

-- Crear nuevo trigger
create trigger on_auth_user_created
after insert on auth.users for each row
execute function public.handle_new_user();

-- 4. Función para actualizar updated_at automáticamente
create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Trigger para updated_at
create trigger handle_profiles_updated_at
before update on public.profiles
for each row execute function public.handle_updated_at();
