# GUÍA DE CONFIGURACIÓN MANUAL DE SUPABASE

## 🎯 OBJETIVO
Configurar manualmente las tablas y políticas que no se pudieron crear automáticamente.

## 📋 PASOS A SEGUIR

### 1. Acceder al Dashboard de Supabase
- Ir a: https://supabase.com/dashboard
- Seleccionar tu proyecto

### 2. Crear Tabla PROFILES (si no existe)
Ir a SQL Editor en Supabase Dashboard y ejecutar:

```sql
-- Crear tabla profiles
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    full_name VARCHAR(255),
    phone VARCHAR(20),
    user_type VARCHAR(50) DEFAULT 'inquilino',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Políticas para profiles
CREATE POLICY "Profiles are viewable by everyone" 
ON public.profiles FOR SELECT 
USING (true);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles FOR INSERT 
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = id);
```

### 3. Crear Tabla PROPERTIES (si no existe)
Ejecutar en SQL Editor:

```sql
-- Crear tabla properties
CREATE TABLE IF NOT EXISTS public.properties (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    location VARCHAR(255) NOT NULL,
    property_type VARCHAR(100) NOT NULL,
    bedrooms INTEGER DEFAULT 0,
    bathrooms INTEGER DEFAULT 0,
    area DECIMAL(10,2),
    images TEXT[],
    contact_phone VARCHAR(20),
    contact_email VARCHAR(255),
    user_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

-- Políticas para properties
CREATE POLICY "Properties are viewable by everyone" 
ON public.properties FOR SELECT 
USING (true);

CREATE POLICY "Users can insert their own properties" 
ON public.properties FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own properties" 
ON public.properties FOR UPDATE 
USING (auth.uid() = user_id);
```

### 4. Verificar Storage Buckets
Los siguientes buckets deben existir:
- property-images (público)
- avatars (público)
- profile-images (público)
- community-images (público)
- documents (privado)
- temp-uploads (privado)
- backups (privado)

### 5. Configurar Políticas de Storage
```sql
-- Políticas para property-images bucket
CREATE POLICY "Anyone can view property images" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'property-images');

CREATE POLICY "Authenticated users can upload property images" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'property-images' AND auth.role() = 'authenticated');

-- Políticas para avatars bucket
CREATE POLICY "Anyone can view avatars" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
```

## ✅ VERIFICACIÓN
Después de ejecutar estos scripts, ejecutar:
```bash
node configurar-autenticacion.js
```

## 🆘 SOPORTE
Si persisten los problemas:
1. Verificar que la Service Role Key tenga permisos completos
2. Contactar soporte de Supabase
3. Revisar logs en el Dashboard de Supabase
