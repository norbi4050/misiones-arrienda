# 13. PLAN PASO A PASO - CORRECCIÓN SUPABASE

## 🎯 PLAN DE IMPLEMENTACIÓN COMPLETO PARA SUPABASE

**Fecha:** 9 de Enero 2025  
**Basado en:** Documento 12 - Auditoría Supabase Completa  
**Objetivo:** Corregir todos los problemas críticos identificados en Supabase

---

## 📋 RESUMEN EJECUTIVO

Este documento presenta un **plan paso a paso** para corregir todos los problemas críticos identificados en la auditoría de Supabase. Incluye scripts SQL, comandos específicos y verificaciones para cada paso.

### 🎯 **PROBLEMAS A CORREGIR:**

1. **🔴 CRÍTICO:** Múltiples versiones de configuración SQL
2. **🔴 CRÍTICO:** Políticas RLS no confirmadas
3. **🟡 ALTA:** Desincronización Prisma-Supabase
4. **🟡 ALTA:** Middleware de autenticación faltante

---

## 🚀 FASE 1: PREPARACIÓN Y DIAGNÓSTICO (30 minutos)

### PASO 1.1: VERIFICAR ACCESO A SUPABASE
**Tiempo estimado:** 5 minutos

```bash
# Verificar variables de entorno
echo "Verificando variables de entorno..."
echo "SUPABASE_URL: $NEXT_PUBLIC_SUPABASE_URL"
echo "SUPABASE_ANON_KEY: $NEXT_PUBLIC_SUPABASE_ANON_KEY"
echo "DATABASE_URL: $DATABASE_URL"
```

**Acciones:**
1. Abrir Supabase Dashboard: https://supabase.com/dashboard
2. Verificar que el proyecto esté activo
3. Confirmar acceso a SQL Editor
4. Verificar acceso a Authentication y Storage

### PASO 1.2: BACKUP DE CONFIGURACIÓN ACTUAL
**Tiempo estimado:** 10 minutos

```sql
-- EJECUTAR EN SUPABASE SQL EDITOR
-- Backup de políticas actuales
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
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Backup de tablas existentes
SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public'
ORDER BY table_name, ordinal_position;

-- Backup de buckets de storage
SELECT * FROM storage.buckets;

-- Backup de políticas de storage
SELECT * FROM storage.objects LIMIT 5;
```

### PASO 1.3: DIAGNÓSTICO INICIAL
**Tiempo estimado:** 15 minutos

```sql
-- DIAGNÓSTICO COMPLETO - EJECUTAR EN SUPABASE SQL EDITOR

-- 1. Verificar tablas existentes
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- 2. Verificar usuarios en auth.users
SELECT count(*) as total_users FROM auth.users;

-- 3. Verificar políticas RLS activas
SELECT 
    t.tablename,
    t.rowsecurity as rls_enabled,
    COUNT(p.policyname) as policy_count
FROM pg_tables t
LEFT JOIN pg_policies p ON t.tablename = p.tablename
WHERE t.schemaname = 'public'
GROUP BY t.tablename, t.rowsecurity
ORDER BY t.tablename;

-- 4. Verificar buckets de storage
SELECT name, id, public, file_size_limit, allowed_mime_types
FROM storage.buckets;

-- 5. Verificar extensiones habilitadas
SELECT * FROM pg_extension WHERE extname IN ('uuid-ossp', 'pgcrypto');
```

---

## 🔧 FASE 2: CONSOLIDACIÓN DE CONFIGURACIÓN (45 minutos)

### PASO 2.1: CREAR CONFIGURACIÓN SQL UNIFICADA
**Tiempo estimado:** 20 minutos

```sql
-- SUPABASE-SETUP-FINAL-CONSOLIDADO.sql
-- EJECUTAR EN SUPABASE SQL EDITOR PASO A PASO

-- =====================================================
-- PASO 2.1.1: HABILITAR EXTENSIONES NECESARIAS
-- =====================================================

-- Habilitar extensiones UUID y crypto
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- PASO 2.1.2: CREAR TABLAS PRINCIPALES (SI NO EXISTEN)
-- =====================================================

-- Tabla profiles (vinculada a auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla properties (tabla principal del negocio)
CREATE TABLE IF NOT EXISTS public.properties (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    price DECIMAL(12,2) NOT NULL,
    currency TEXT DEFAULT 'ARS',
    old_price DECIMAL(12,2),
    bedrooms INTEGER NOT NULL,
    bathrooms INTEGER NOT NULL,
    garages INTEGER DEFAULT 0,
    area DECIMAL(8,2) NOT NULL,
    lot_area DECIMAL(8,2),
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    province TEXT NOT NULL,
    postal_code TEXT NOT NULL,
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    property_type TEXT NOT NULL CHECK (property_type IN ('APARTMENT', 'HOUSE', 'COMMERCIAL', 'LAND', 'OFFICE', 'WAREHOUSE', 'PH', 'STUDIO')),
    status TEXT DEFAULT 'AVAILABLE' CHECK (status IN ('AVAILABLE', 'RENTED', 'SOLD', 'MAINTENANCE', 'RESERVED', 'EXPIRED')),
    images JSONB DEFAULT '[]',
    virtual_tour_url TEXT,
    amenities JSONB DEFAULT '[]',
    features JSONB DEFAULT '[]',
    year_built INTEGER,
    floor INTEGER,
    total_floors INTEGER,
    featured BOOLEAN DEFAULT FALSE,
    contact_name TEXT,
    contact_phone TEXT NOT NULL,
    contact_email TEXT,
    expires_at TIMESTAMPTZ,
    highlighted_until TIMESTAMPTZ,
    is_paid BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL
);

-- Tabla favorites
CREATE TABLE IF NOT EXISTS public.favorites (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, property_id)
);

-- Tabla search_history
CREATE TABLE IF NOT EXISTS public.search_history (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    search_term TEXT NOT NULL,
    filters JSONB,
    results_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- PASO 2.1.3: CREAR ÍNDICES PARA PERFORMANCE
-- =====================================================

-- Índices para properties
CREATE INDEX IF NOT EXISTS idx_properties_city ON public.properties(city);
CREATE INDEX IF NOT EXISTS idx_properties_province ON public.properties(province);
CREATE INDEX IF NOT EXISTS idx_properties_price ON public.properties(price);
CREATE INDEX IF NOT EXISTS idx_properties_property_type ON public.properties(property_type);
CREATE INDEX IF NOT EXISTS idx_properties_status ON public.properties(status);
CREATE INDEX IF NOT EXISTS idx_properties_featured ON public.properties(featured);
CREATE INDEX IF NOT EXISTS idx_properties_user_id ON public.properties(user_id);
CREATE INDEX IF NOT EXISTS idx_properties_created_at ON public.properties(created_at);

-- Índices para favorites
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON public.favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_property_id ON public.favorites(property_id);

-- Índices para search_history
CREATE INDEX IF NOT EXISTS idx_search_history_user_id ON public.search_history(user_id, created_at);
```

### PASO 2.2: CONFIGURAR ROW LEVEL SECURITY (RLS)
**Tiempo estimado:** 15 minutos

```sql
-- =====================================================
-- PASO 2.2: CONFIGURAR ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.search_history ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- POLÍTICAS PARA TABLA PROFILES
-- =====================================================

-- Eliminar políticas existentes si existen
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

-- Crear políticas para profiles
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- =====================================================
-- POLÍTICAS PARA TABLA PROPERTIES
-- =====================================================

-- Eliminar políticas existentes si existen
DROP POLICY IF EXISTS "Anyone can view properties" ON public.properties;
DROP POLICY IF EXISTS "Users can insert own properties" ON public.properties;
DROP POLICY IF EXISTS "Users can update own properties" ON public.properties;
DROP POLICY IF EXISTS "Users can delete own properties" ON public.properties;

-- Crear políticas para properties
CREATE POLICY "Anyone can view properties" ON public.properties
    FOR SELECT USING (true);

CREATE POLICY "Users can insert own properties" ON public.properties
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own properties" ON public.properties
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own properties" ON public.properties
    FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- POLÍTICAS PARA TABLA FAVORITES
-- =====================================================

-- Eliminar políticas existentes si existen
DROP POLICY IF EXISTS "Users can view own favorites" ON public.favorites;
DROP POLICY IF EXISTS "Users can insert own favorites" ON public.favorites;
DROP POLICY IF EXISTS "Users can delete own favorites" ON public.favorites;

-- Crear políticas para favorites
CREATE POLICY "Users can view own favorites" ON public.favorites
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own favorites" ON public.favorites
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own favorites" ON public.favorites
    FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- POLÍTICAS PARA TABLA SEARCH_HISTORY
-- =====================================================

-- Eliminar políticas existentes si existen
DROP POLICY IF EXISTS "Users can view own search history" ON public.search_history;
DROP POLICY IF EXISTS "Users can insert own search history" ON public.search_history;

-- Crear políticas para search_history
CREATE POLICY "Users can view own search history" ON public.search_history
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own search history" ON public.search_history
    FOR INSERT WITH CHECK (auth.uid() = user_id);
```

### PASO 2.3: CONFIGURAR STORAGE Y BUCKETS
**Tiempo estimado:** 10 minutos

```sql
-- =====================================================
-- PASO 2.3: CONFIGURAR STORAGE Y BUCKETS
-- =====================================================

-- Crear bucket para imágenes de propiedades
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'property-images',
    'property-images',
    true,
    5242880, -- 5MB limit
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
) ON CONFLICT (id) DO NOTHING;

-- Crear bucket para avatares de usuarios
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'avatars',
    'avatars',
    true,
    1048576, -- 1MB limit
    ARRAY['image/jpeg', 'image/png', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- POLÍTICAS DE STORAGE
-- =====================================================

-- Políticas para property-images bucket
CREATE POLICY "Anyone can view property images" ON storage.objects
    FOR SELECT USING (bucket_id = 'property-images');

CREATE POLICY "Authenticated users can upload property images" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'property-images' 
        AND auth.role() = 'authenticated'
    );

CREATE POLICY "Users can update own property images" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'property-images' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can delete own property images" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'property-images' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- Políticas para avatars bucket
CREATE POLICY "Anyone can view avatars" ON storage.objects
    FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload own avatar" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'avatars' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can update own avatar" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'avatars' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can delete own avatar" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'avatars' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );
```

---

## 🔄 FASE 3: SINCRONIZACIÓN PRISMA-SUPABASE (30 minutos)

### PASO 3.1: VERIFICAR SINCRONIZACIÓN
**Tiempo estimado:** 10 minutos

```bash
# En el directorio Backend/
cd Backend

# Verificar conexión a base de datos
npx prisma db pull --force

# Generar cliente Prisma actualizado
npx prisma generate

# Verificar diferencias
npx prisma db push --preview-feature
```

### PASO 3.2: CORREGIR DESALINEACIONES
**Tiempo estimado:** 20 minutos

Si hay diferencias, ejecutar en Supabase:

```sql
-- CORRECCIONES COMUNES DE DESALINEACIÓN

-- 1. Corregir nombres de campos si es necesario
-- Ejemplo: Si Prisma usa 'full_name' pero Supabase tiene 'fullname'
ALTER TABLE public.profiles RENAME COLUMN fullname TO full_name;

-- 2. Agregar campos faltantes que están en Prisma pero no en Supabase
-- Ejemplo: Si falta campo 'old_price' en properties
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS old_price DECIMAL(12,2);

-- 3. Corregir tipos de datos
-- Ejemplo: Si currency debe ser VARCHAR en lugar de TEXT
ALTER TABLE public.properties ALTER COLUMN currency TYPE VARCHAR(10);

-- 4. Agregar constraints faltantes
-- Ejemplo: Agregar check constraint para property_type
ALTER TABLE public.properties DROP CONSTRAINT IF EXISTS properties_property_type_check;
ALTER TABLE public.properties ADD CONSTRAINT properties_property_type_check 
    CHECK (property_type IN ('APARTMENT', 'HOUSE', 'COMMERCIAL', 'LAND', 'OFFICE', 'WAREHOUSE', 'PH', 'STUDIO'));

-- 5. Corregir valores por defecto
ALTER TABLE public.properties ALTER COLUMN currency SET DEFAULT 'ARS';
ALTER TABLE public.properties ALTER COLUMN garages SET DEFAULT 0;
ALTER TABLE public.properties ALTER COLUMN featured SET DEFAULT FALSE;
ALTER TABLE public.properties ALTER COLUMN is_paid SET DEFAULT FALSE;
```

---

## 🛡️ FASE 4: IMPLEMENTAR MIDDLEWARE DE AUTENTICACIÓN (20 minutos)

### PASO 4.1: CREAR MIDDLEWARE COMPLETO
**Tiempo estimado:** 15 minutos

```typescript
// Backend/src/middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Verificar sesión del usuario
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Rutas protegidas que requieren autenticación
  const protectedRoutes = [
    '/dashboard',
    '/publicar',
    '/profile',
    '/favorites',
    '/admin'
  ]

  // Rutas de autenticación (solo para usuarios no autenticados)
  const authRoutes = ['/login', '/register']

  const isProtectedRoute = protectedRoutes.some(route => 
    request.nextUrl.pathname.startsWith(route)
  )
  
  const isAuthRoute = authRoutes.some(route => 
    request.nextUrl.pathname.startsWith(route)
  )

  // Redirigir usuarios no autenticados de rutas protegidas
  if (isProtectedRoute && !user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Redirigir usuarios autenticados de rutas de auth
  if (isAuthRoute && user) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

### PASO 4.2: VERIFICAR MIDDLEWARE
**Tiempo estimado:** 5 minutos

```bash
# Verificar que el middleware funciona
npm run dev

# Probar acceso a rutas protegidas sin autenticación
# Debe redirigir a /login
```

---

## 🧪 FASE 5: TESTING Y VALIDACIÓN (45 minutos)

### PASO 5.1: TESTING DE CONECTIVIDAD
**Tiempo estimado:** 15 minutos

```javascript
// test-supabase-conexion.js
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function testConnection() {
  console.log('🔍 Testing Supabase Connection...')
  
  try {
    // Test 1: Conexión básica
    const { data, error } = await supabase
      .from('properties')
      .select('count(*)')
      .limit(1)
    
    if (error) {
      console.error('❌ Connection failed:', error.message)
      return false
    }
    
    console.log('✅ Connection successful')
    
    // Test 2: Verificar RLS
    const { data: authData } = await supabase.auth.getUser()
    console.log('🔐 Auth status:', authData.user ? 'Authenticated' : 'Anonymous')
    
    // Test 3: Verificar storage
    const { data: buckets } = await supabase.storage.listBuckets()
    console.log('🗂️ Storage buckets:', buckets?.map(b => b.name) || [])
    
    return true
  } catch (err) {
    console.error('❌ Unexpected error:', err)
    return false
  }
}

testConnection()
```

### PASO 5.2: TESTING DE POLÍTICAS RLS
**Tiempo estimado:** 15 minutos

```sql
-- EJECUTAR EN SUPABASE SQL EDITOR
-- Test de políticas RLS

-- 1. Verificar que RLS está habilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename IN ('profiles', 'properties', 'favorites', 'search_history');

-- 2. Verificar políticas existentes
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 3. Test de inserción (debe fallar sin autenticación)
-- Este query debe fallar con error de RLS
INSERT INTO public.properties (title, description, price, bedrooms, bathrooms, area, address, city, province, postal_code, contact_phone, user_id)
VALUES ('Test Property', 'Test Description', 100000, 2, 1, 50, 'Test Address', 'Test City', 'Test Province', '12345', '123456789', '00000000-0000-0000-0000-000000000000');

-- 4. Verificar que las consultas SELECT funcionan (propiedades públicas)
SELECT COUNT(*) FROM public.properties;
```

### PASO 5.3: TESTING DE STORAGE
**Tiempo estimado:** 15 minutos

```javascript
// test-supabase-storage.js
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function testStorage() {
  console.log('🗂️ Testing Supabase Storage...')
  
  try {
    // Test 1: Listar buckets
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()
    
    if (bucketsError) {
      console.error('❌ Failed to list buckets:', bucketsError.message)
      return false
    }
    
    console.log('✅ Buckets found:', buckets.map(b => b.name))
    
    // Test 2: Verificar bucket property-images
    const propertyImagesBucket = buckets.find(b => b.name === 'property-images')
    if (!propertyImagesBucket) {
      console.error('❌ property-images bucket not found')
      return false
    }
    
    console.log('✅ property-images bucket exists')
    
    // Test 3: Verificar bucket avatars
    const avatarsBucket = buckets.find(b => b.name === 'avatars')
    if (!avatarsBucket) {
      console.error('❌ avatars bucket not found')
      return false
    }
    
    console.log('✅ avatars bucket exists')
    
    // Test 4: Listar archivos en bucket (debe funcionar)
    const { data: files, error: filesError } = await supabase.storage
      .from('property-images')
      .list('', { limit: 5 })
    
    if (filesError) {
      console.error('❌ Failed to list files:', filesError.message)
      return false
    }
    
    console.log('✅ Can list files in property-images bucket')
    console.log('📁 Files found:', files.length)
    
    return true
  } catch (err) {
    console.error('❌ Unexpected error:', err)
    return false
  }
}

testStorage()
```

---

## 🔍 FASE 6: VERIFICACIÓN FINAL (30 minutos)

### PASO 6.1: CHECKLIST DE VERIFICACIÓN COMPLETO
**Tiempo estimado:** 20 minutos

```sql
-- VERIFICACIÓN FINAL COMPLETA
-- EJECUTAR EN SUPABASE SQL EDITOR

-- =====================================================
-- 1. VERIFICAR TABLAS PRINCIPALES
-- =====================================================
SELECT 
    'Tables Check' as test_category,
    CASE 
        WHEN COUNT(*) >= 4 THEN '✅ PASS'
        ELSE '❌ FAIL'
    END as status,
    COUNT(*) as tables_found,
    STRING_AGG(table_name, ', ') as tables
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_name IN ('profiles', 'properties', 'favorites', 'search_history');

-- =====================================================
-- 2. VERIFICAR RLS HABILITADO
-- =====================================================
SELECT 
    'RLS Check' as test_category,
    CASE 
        WHEN COUNT(*) = 4 AND MIN(rowsecurity::int) = 1 THEN '✅ PASS'
        ELSE '❌ FAIL'
    END as status,
    COUNT(*) as tables_with_rls,
    STRING_AGG(tablename || ':' || rowsecurity::text, ', ') as rls_status
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename IN ('profiles', 'properties', 'favorites', 'search_history');

-- =====================================================
-- 3. VERIFICAR POLÍTICAS RLS
-- =====================================================
SELECT 
    'Policies Check' as test_category,
    CASE 
        WHEN COUNT(*) >= 8 THEN '✅ PASS'
        ELSE '❌ FAIL'
    END as status,
    COUNT(*) as policies_found,
    COUNT(DISTINCT tablename) as tables_with_policies
FROM pg_policies 
WHERE schemaname = 'public';

-- =====================================================
-- 4. VERIFICAR BUCKETS DE STORAGE
-- =====================================================
SELECT 
    'Storage Check' as test_category,
    CASE 
        WHEN COUNT(*) >= 2 THEN '✅ PASS'
        ELSE '❌ FAIL'
    END as status,
    COUNT(*) as buckets_found,
    STRING_AGG(name, ', ') as bucket_names
FROM storage.buckets 
WHERE name IN ('property-images', 'avatars');

-- =====================================================
-- 5. VERIFICAR ÍNDICES
-- =====================================================
SELECT 
    'Indexes Check' as test_category,
    CASE 
        WHEN COUNT(*) >= 8 THEN '✅ PASS'
        ELSE '❌ FAIL'
    END as status,
    COUNT(*) as indexes_found
FROM pg_indexes 
WHERE schemaname = 'public' 
    AND indexname LIKE 'idx_%';

-- =====================================================
-- 6. VERIFICAR EXTENSIONES
-- =====================================================
SELECT 
    'Extensions Check' as test_category,
    CASE 
        WHEN COUNT(*) >= 2 THEN '✅ PASS'
        ELSE '❌ FAIL'
    END as status,
    COUNT(*) as extensions_found,
    STRING_AGG(extname, ', ') as extensions
FROM pg_extension 
WHERE extname IN ('uuid-ossp', 'pgcrypto');
```

### PASO 6.2: TESTING DE FUNCIONALIDADES
**Tiempo estimado:** 10 minutos

```bash
# En Backend/
npm run dev

# Verificar en navegador:
# 1. http://localhost:3000 - Debe cargar sin errores
# 2. http://localhost:3000/login - Debe mostrar formulario de login
# 3. http://localhost:3000/dashboard - Debe redirigir a login
# 4. Consola del navegador - No debe mostrar errores de Supabase
```

---

## 📊 COMANDOS DE VERIFICACIÓN RÁPIDA

### Verificar Estado General
```bash
# Verificar variables de entorno
echo "SUPABASE_URL: $NEXT_PUBLIC_SUPABASE_URL"
echo "SUPABASE_ANON_KEY: $NEXT_PUBLIC_SUPABASE_ANON_KEY"

# Verificar conexión Prisma
cd Backend && npx prisma db pull --dry-run

# Iniciar servidor de desarrollo
npm run dev
```

### Verificar Supabase Dashboard
1. **Authentication:** Verificar que esté habilitado
2. **Database:** Verificar tablas y políticas
3. **Storage:** Verificar buckets y políticas
4. **API:** Verificar que las URLs sean correctas

---

## 🚨 SOLUCIÓN DE PROBLEMAS COMUNES

### Problema 1: Error de conexión a Supabase
```bash
# Verificar variables de entorno
cat .env.local | grep SUPABASE

# Verificar formato de URLs
echo $NEXT_PUBLIC_SUPABASE_URL | grep -E "^https://[a-z0-9]+\.supabase\.co$"
```

### Problema 2: Políticas RLS no funcionan
```sql
-- Verificar que RLS esté habilitado
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';

-- Verificar políticas específicas
SELECT * FROM pg_policies WHERE schemaname = 'public' AND tablename = 'properties';
```

### Problema 3: Storage no funciona
```sql
-- Verificar buckets
SELECT * FROM storage.buckets;

-- Verificar políticas de storage
SELECT * FROM storage.policies;
```

### Problema 4: Middleware no redirige
```typescript
//
