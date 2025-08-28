# 🗄️ GUÍA COMPLETA DE CONFIGURACIÓN SUPABASE - MISIONES ARRIENDA

**Fecha:** $(Get-Date -Format "dd/MM/yyyy HH:mm")  
**Estado:** 📋 GUÍA DETALLADA COMPLETA  
**Prioridad:** CRÍTICA

---

## 📊 RESUMEN EJECUTIVO

Esta guía detalla **EXACTAMENTE** todo lo que necesitas configurar en Supabase para que tu proyecto Misiones Arrienda funcione completamente. Basado en el análisis exhaustivo del schema de Prisma y la arquitectura actual.

---

## 🎯 CONFIGURACIONES REQUERIDAS EN SUPABASE

### **IMPORTANTE:** 
Tu proyecto actualmente usa **Prisma con PostgreSQL** pero también tiene **Supabase Auth**. Necesitas configurar ambos sistemas para que trabajen juntos.

---

## 🔧 PARTE 1: CONFIGURACIÓN BÁSICA DE SUPABASE

### **1.1 Crear Proyecto en Supabase**
1. Ve a [supabase.com](https://supabase.com)
2. Crea una nueva organización: "Misiones Arrienda"
3. Crea un nuevo proyecto: "misiones-arrienda-prod"
4. Región: **South America (São Paulo)** - más cercana a Argentina
5. Plan: **Free** (para empezar)

### **1.2 Obtener Credenciales**
Desde el Dashboard de Supabase > Settings > API:

```env
# Variables que necesitas agregar a tu .env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...

# Para Prisma (Database URL)
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
DIRECT_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
```

---

## 🗄️ PARTE 2: CONFIGURACIÓN DE BASE DE DATOS

### **2.1 Ejecutar SQL de Configuración Básica**

Ve a **SQL Editor** en Supabase y ejecuta:

```sql
-- =====================================================
-- CONFIGURACIÓN BÁSICA SUPABASE - MISIONES ARRIENDA
-- =====================================================

-- 1. Crear tabla de perfiles (sincronizada con auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Índices para optimización
create index if not exists idx_profiles_created_at on public.profiles(created_at desc);

-- Habilitar Row Level Security
alter table public.profiles enable row level security;

-- 2. Políticas RLS para perfiles
create policy "Users can view own profile" on public.profiles 
for select to authenticated 
using (auth.uid() = id);

create policy "Users can insert own profile" on public.profiles 
for insert to authenticated 
with check (auth.uid() = id);

create policy "Users can update own profile" on public.profiles 
for update to authenticated 
using (auth.uid() = id) with check (auth.uid() = id);

-- 3. Función para auto-crear perfiles
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$;

-- 4. Trigger para auto-crear perfiles
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users for each row
execute function public.handle_new_user();

-- 5. Función para updated_at automático
create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- 6. Trigger para updated_at en perfiles
create trigger handle_profiles_updated_at
before update on public.profiles
for each row execute function public.handle_updated_at();
```

### **2.2 Configurar Storage para Imágenes**

En **Storage** > **Buckets**, crear:

```sql
-- Crear bucket para imágenes
insert into storage.buckets (id, name, public) 
values ('property-images', 'property-images', true);

insert into storage.buckets (id, name, public) 
values ('profile-images', 'profile-images', true);

insert into storage.buckets (id, name, public) 
values ('community-images', 'community-images', true);

-- Políticas para property-images
create policy "Anyone can view property images" on storage.objects 
for select using (bucket_id = 'property-images');

create policy "Authenticated users can upload property images" on storage.objects 
for insert to authenticated with check (bucket_id = 'property-images');

create policy "Users can update own property images" on storage.objects 
for update to authenticated using (auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can delete own property images" on storage.objects 
for delete to authenticated using (auth.uid()::text = (storage.foldername(name))[1]);

-- Políticas para profile-images
create policy "Anyone can view profile images" on storage.objects 
for select using (bucket_id = 'profile-images');

create policy "Authenticated users can upload profile images" on storage.objects 
for insert to authenticated with check (bucket_id = 'profile-images');

create policy "Users can update own profile images" on storage.objects 
for update to authenticated using (auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can delete own profile images" on storage.objects 
for delete to authenticated using (auth.uid()::text = (storage.foldername(name))[1]);

-- Políticas para community-images
create policy "Anyone can view community images" on storage.objects 
for select using (bucket_id = 'community-images');

create policy "Authenticated users can upload community images" on storage.objects 
for insert to authenticated with check (bucket_id = 'community-images');

create policy "Users can update own community images" on storage.objects 
for update to authenticated using (auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can delete own community images" on storage.objects 
for delete to authenticated using (auth.uid()::text = (storage.foldername(name))[1]);
```

---

## 🔐 PARTE 3: CONFIGURACIÓN DE AUTENTICACIÓN

### **3.1 Configurar Auth Settings**

En **Authentication** > **Settings**:

```json
{
  "SITE_URL": "https://tu-dominio.vercel.app",
  "ADDITIONAL_REDIRECT_URLS": [
    "http://localhost:3000",
    "http://localhost:3001",
    "https://tu-dominio.vercel.app"
  ]
}
```

### **3.2 Configurar Providers**

**Email Auth:**
- ✅ Enable email confirmations: `true`
- ✅ Enable email change confirmations: `true`
- ✅ Secure email change: `true`

**Social Providers (Opcional):**
- Google OAuth (recomendado para UX)
- Facebook OAuth

### **3.3 Configurar Email Templates**

En **Authentication** > **Email Templates**, personalizar:

**Confirm Signup:**
```html
<h2>¡Bienvenido a Misiones Arrienda!</h2>
<p>Confirma tu cuenta haciendo clic en el enlace:</p>
<p><a href="{{ .ConfirmationURL }}">Confirmar cuenta</a></p>
```

**Reset Password:**
```html
<h2>Restablecer contraseña - Misiones Arrienda</h2>
<p>Haz clic en el enlace para restablecer tu contraseña:</p>
<p><a href="{{ .ConfirmationURL }}">Restablecer contraseña</a></p>
```

---

## 🗃️ PARTE 4: CONFIGURACIÓN PARA PRISMA

### **4.1 Sincronizar Schema con Supabase**

Tu proyecto usa Prisma, así que necesitas:

1. **Actualizar DATABASE_URL** en `.env`:
```env
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres?pgbouncer=true&connection_limit=1"
DIRECT_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"
```

2. **Ejecutar migraciones de Prisma**:
```bash
cd Backend
npx prisma migrate dev --name init
npx prisma generate
npx prisma db push
```

### **4.2 Configurar RLS para Tablas de Prisma**

Ejecutar en **SQL Editor**:

```sql
-- =====================================================
-- RLS PARA TABLAS PRINCIPALES DEL PROYECTO
-- =====================================================

-- Habilitar RLS en tablas principales
alter table public."User" enable row level security;
alter table public."Property" enable row level security;
alter table public."UserProfile" enable row level security;
alter table public."Payment" enable row level security;
alter table public."Subscription" enable row level security;

-- Políticas para User
create policy "Users can view own data" on public."User" 
for select to authenticated using (id = auth.uid()::text);

create policy "Users can update own data" on public."User" 
for update to authenticated using (id = auth.uid()::text);

-- Políticas para Property
create policy "Anyone can view active properties" on public."Property" 
for select using (status = 'AVAILABLE');

create policy "Users can manage own properties" on public."Property" 
for all to authenticated using ("userId" = auth.uid()::text);

-- Políticas para UserProfile (Comunidad)
create policy "Anyone can view active community profiles" on public."UserProfile" 
for select using (not "isSuspended");

create policy "Users can manage own community profile" on public."UserProfile" 
for all to authenticated using ("userId" = auth.uid()::text);

-- Políticas para Payment
create policy "Users can view own payments" on public."Payment" 
for select to authenticated using ("userId" = auth.uid()::text);

create policy "Users can create own payments" on public."Payment" 
for insert to authenticated with check ("userId" = auth.uid()::text);

-- Políticas para Subscription
create policy "Users can view own subscriptions" on public."Subscription" 
for select to authenticated using ("userId" = auth.uid()::text);

create policy "Users can manage own subscriptions" on public."Subscription" 
for all to authenticated using ("userId" = auth.uid()::text);
```

---

## 📧 PARTE 5: CONFIGURACIÓN DE EMAIL

### **5.1 Configurar SMTP Custom (Recomendado)**

En **Settings** > **Auth** > **SMTP Settings**:

```env
# Para Gmail/Google Workspace
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@tu-dominio.com
SMTP_PASS=tu-app-password
SMTP_SENDER_NAME=Misiones Arrienda
```

### **5.2 Configurar Webhooks para Emails**

Crear función Edge para emails:

```sql
-- Función para enviar emails de notificación
create or replace function public.send_notification_email()
returns trigger language plpgsql security definer as $$
begin
  -- Lógica para enviar emails según el evento
  if TG_TABLE_NAME = 'UserInquiry' then
    -- Enviar email al propietario sobre nueva consulta
    perform net.http_post(
      url := 'https://tu-proyecto.supabase.co/functions/v1/send-inquiry-email',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.service_role_key') || '"}',
      body := json_build_object(
        'inquiry_id', NEW.id,
        'property_id', NEW."propertyId",
        'user_id', NEW."userId"
      )::text
    );
  end if;
  
  return NEW;
end;
$$;

-- Trigger para enviar emails automáticamente
create trigger send_inquiry_notification
after insert on public."UserInquiry"
for each row execute function public.send_notification_email();
```

---

## 🔄 PARTE 6: CONFIGURACIÓN DE REALTIME

### **6.1 Habilitar Realtime para Mensajería**

En **Database** > **Replication**, habilitar para:
- `Message` (mensajes de comunidad)
- `Conversation` (conversaciones)
- `UserInquiry` (consultas en tiempo real)

### **6.2 Configurar Políticas Realtime**

```sql
-- Habilitar realtime
alter publication supabase_realtime add table public."Message";
alter publication supabase_realtime add table public."Conversation";
alter publication supabase_realtime add table public."UserInquiry";

-- Políticas para realtime
create policy "Users can subscribe to own conversations" on public."Message" 
for select to authenticated using (
  exists (
    select 1 from public."Conversation" c 
    where c.id = "conversationId" 
    and (c."aId" = auth.uid()::text or c."bId" = auth.uid()::text)
  )
);
```

---

## 🛡️ PARTE 7: CONFIGURACIÓN DE SEGURIDAD

### **7.1 Configurar Rate Limiting**

En **Settings** > **API**:
```json
{
  "db_anon_role_rate_limit": 100,
  "db_authenticated_role_rate_limit": 200,
  "functions_rate_limit": 50
}
```

### **7.2 Configurar CORS**

```json
{
  "allowed_origins": [
    "http://localhost:3000",
    "http://localhost:3001", 
    "https://tu-dominio.vercel.app",
    "https://www.tu-dominio.com"
  ]
}
```

### **7.3 Configurar JWT Settings**

```json
{
  "jwt_expiry": 3600,
  "jwt_default_group_name": "authenticated",
  "site_url": "https://tu-dominio.vercel.app"
}
```

---

## 📊 PARTE 8: CONFIGURACIÓN DE ANALYTICS

### **8.1 Habilitar Logging**

En **Settings** > **Logs**:
- ✅ Enable API logs
- ✅ Enable Auth logs  
- ✅ Enable Database logs
- ✅ Enable Functions logs

### **8.2 Configurar Webhooks para Analytics**

```sql
-- Función para tracking de eventos
create or replace function public.track_user_event()
returns trigger language plpgsql security definer as $$
begin
  insert into public."Analytics" (
    event_type,
    user_id,
    metadata,
    created_at
  ) values (
    TG_TABLE_NAME || '_' || TG_OP,
    coalesce(NEW."userId", OLD."userId"),
    json_build_object('table', TG_TABLE_NAME, 'operation', TG_OP),
    now()
  );
  
  return coalesce(NEW, OLD);
end;
$$;

-- Triggers para tracking
create trigger track_property_events
after insert or update or delete on public."Property"
for each row execute function public.track_user_event();

create trigger track_user_events  
after insert or update on public."User"
for each row execute function public.track_user_event();
```

---

## 🔧 PARTE 9: EDGE FUNCTIONS NECESARIAS

### **9.1 Función para Envío de Emails**

Crear en **Edge Functions**:

```typescript
// supabase/functions/send-inquiry-email/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    const { inquiry_id, property_id, user_id } = await req.json()
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )
    
    // Obtener datos de la consulta
    const { data: inquiry } = await supabase
      .from('UserInquiry')
      .select(`
        *,
        User:userId(*),
        Property:propertyId(*)
      `)
      .eq('id', inquiry_id)
      .single()
    
    // Enviar email usando tu servicio preferido
    // (SendGrid, Resend, etc.)
    
    return new Response(
      JSON.stringify({ success: true }),
      { headers: { "Content-Type": "application/json" } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    )
  }
})
```

### **9.2 Función para Procesamiento de Pagos**

```typescript
// supabase/functions/process-payment/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
  try {
    const { payment_data } = await req.json()
    
    // Procesar webhook de MercadoPago
    // Actualizar estado de pago en base de datos
    // Activar suscripción si corresponde
    
    return new Response(
      JSON.stringify({ success: true }),
      { headers: { "Content-Type": "application/json" } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    )
  }
})
```

---

## 🚀 PARTE 10: CONFIGURACIÓN DE PRODUCCIÓN

### **10.1 Variables de Entorno Finales**

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...

# Database (Prisma + Supabase)
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres?pgbouncer=true&connection_limit=1
DIRECT_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres

# Auth
NEXTAUTH_URL=https://tu-dominio.vercel.app
NEXTAUTH_SECRET=tu-secret-super-seguro

# MercadoPago
MERCADOPAGO_ACCESS_TOKEN=tu-access-token
MERCADOPAGO_PUBLIC_KEY=tu-public-key

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@tu-dominio.com
SMTP_PASS=tu-app-password
```

### **10.2 Configurar Backups**

En **Settings** > **Database**:
- ✅ Enable automatic backups
- Frequency: Daily
- Retention: 7 days (Free plan)

### **10.3 Configurar Monitoring**

```sql
-- Vista para monitoreo de performance
create or replace view public.performance_metrics as
select 
  date_trunc('hour', created_at) as hour,
  count(*) as total_requests,
  count(*) filter (where status = 'success') as successful_requests,
  count(*) filter (where status = 'error') as failed_requests,
  avg(response_time_ms) as avg_response_time
from public.api_logs 
where created_at >= now() - interval '24 hours'
group by hour
order by hour desc;
```

---

## ✅ CHECKLIST DE CONFIGURACIÓN

### **Configuración Básica**
- [ ] Proyecto Supabase creado
- [ ] Variables de entorno configuradas
- [ ] SQL básico ejecutado
- [ ] Tabla profiles creada y configurada

### **Autenticación**
- [ ] Auth settings configurados
- [ ] Email templates personalizados
- [ ] Redirect URLs configuradas
- [ ] RLS habilitado en tablas principales

### **Storage**
- [ ] Buckets creados (property-images, profile-images, community-images)
- [ ] Políticas de storage configuradas
- [ ] Permisos de upload configurados

### **Base de Datos**
- [ ] Prisma schema sincronizado
- [ ] Migraciones ejecutadas
- [ ] RLS configurado para todas las tablas
- [ ] Índices optimizados

### **Funcionalidades Avanzadas**
- [ ] Edge functions desplegadas
- [ ] Webhooks configurados
- [ ] Realtime habilitado
- [ ] Analytics configurado

### **Producción**
- [ ] Backups configurados
- [ ] Monitoring habilitado
- [ ] Rate limiting configurado
- [ ] CORS configurado

---

## 🚨 PROBLEMAS COMUNES Y SOLUCIONES

### **Error: "relation does not exist"**
```sql
-- Verificar que las tablas existan
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';

-- Si faltan, ejecutar:
npx prisma db push
```

### **Error: "RLS policy violation"**
```sql
-- Verificar políticas RLS
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public';
```

### **Error: "JWT expired"**
```javascript
// Refrescar token automáticamente
const { data, error } = await supabase.auth.refreshSession()
```

### **Error: "Storage bucket not found"**
```sql
-- Verificar buckets
SELECT * FROM storage.buckets;

-- Crear si no existe
INSERT INTO storage.buckets (id, name, public) 
VALUES ('property-images', 'property-images', true);
```

---

## 📞 SOPORTE Y RECURSOS

### **Documentación Oficial**
- [Supabase Docs](https://supabase.com/docs)
- [Prisma + Supabase](https://supabase.com/docs/guides/integrations/prisma)
- [Next.js + Supabase](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)

### **Herramientas de Debug**
- Supabase Dashboard > Logs
- Prisma Studio: `npx prisma studio`
- SQL Editor en Supabase

### **Comunidad**
- [Discord Supabase](https://discord.supabase.com)
- [GitHub Discussions](https://github.com/supabase/supabase/discussions)

---

## 🎯 CONCLUSIÓN

Esta configuración te dará:

✅ **Autenticación completa** con Supabase Auth  
✅ **Base de datos robusta** con Prisma + PostgreSQL  
✅ **Storage de imágenes** optimizado  
✅ **Realtime** para mensajería  
✅ **Seguridad** con RLS  
✅ **Emails automáticos** con Edge Functions  
✅ **Analytics** y monitoring  
✅ **Escalabilidad** para producción  

**Tiempo estimado de configuración:** 2-3 horas  
**Dificultad:** Intermedia  
**Resultado:** Plataforma completamente funcional y escalable  

---

**Desarrollado por:** BlackBox AI  
**Proyecto:** Misiones Arrienda - Configuración Supabase Completa  
**Versión:** 1.0.0  
**Estado:** ✅ GUÍA COMPLETA Y DETALLADA
