# 🎯 GUÍA COMPLETA: CÓMO OBTENER 100/100 EN SUPABASE

## 📊 **ESTADO ACTUAL ESPERADO: 75-85/100**

Basándome en las configuraciones previas, tu proyecto debería estar entre **75-85 puntos**. Para llegar a **100/100**, necesitas completar estas tareas específicas:

---

## 🚀 **PASOS PARA OBTENER 100/100**

### **PASO 1: EJECUTAR EL TESTING ACTUAL**
```bash
# Ejecuta primero para ver tu puntuación actual
EJECUTAR-TESTING-EXHAUSTIVO-SUPABASE-100-COMPLETO.bat
```

### **PASO 2: CONFIGURACIÓN MANUAL DE TABLAS (15-20 puntos faltantes)**

#### **2.1 Crear Tabla `profiles` en Supabase Dashboard**
```sql
-- Ve a Supabase Dashboard > Table Editor > Create Table
CREATE TABLE profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    phone TEXT,
    user_type TEXT DEFAULT 'inquilino' CHECK (user_type IN ('inquilino', 'propietario', 'inmobiliaria')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Usuarios pueden ver su propio perfil" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Usuarios pueden actualizar su propio perfil" ON profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Usuarios pueden insertar su propio perfil" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);
```

#### **2.2 Crear Tabla `properties` en Supabase Dashboard**
```sql
-- Ve a Supabase Dashboard > Table Editor > Create Table
CREATE TABLE properties (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'ARS',
    property_type TEXT NOT NULL,
    operation_type TEXT NOT NULL,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    province TEXT NOT NULL,
    bedrooms INTEGER,
    bathrooms INTEGER,
    area DECIMAL(8,2),
    images TEXT[],
    contact_phone TEXT,
    contact_email TEXT,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'rented', 'sold')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Cualquiera puede ver propiedades activas" ON properties
    FOR SELECT USING (status = 'active');

CREATE POLICY "Usuarios pueden crear sus propias propiedades" ON properties
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden actualizar sus propias propiedades" ON properties
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden eliminar sus propias propiedades" ON properties
    FOR DELETE USING (auth.uid() = user_id);
```

### **PASO 3: CONFIGURAR BUCKETS DE STORAGE (5 puntos)**

#### **3.1 Crear Buckets Faltantes**
Ve a Supabase Dashboard > Storage y crea estos buckets si no existen:

1. **`property-images`** (público)
2. **`profile-avatars`** (público)
3. **`documents`** (privado)

#### **3.2 Configurar Políticas de Storage**
```sql
-- Políticas para property-images
CREATE POLICY "Cualquiera puede ver imágenes de propiedades" ON storage.objects
    FOR SELECT USING (bucket_id = 'property-images');

CREATE POLICY "Usuarios autenticados pueden subir imágenes" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'property-images' AND auth.role() = 'authenticated');

-- Políticas para profile-avatars
CREATE POLICY "Cualquiera puede ver avatares" ON storage.objects
    FOR SELECT USING (bucket_id = 'profile-avatars');

CREATE POLICY "Usuarios pueden subir su avatar" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'profile-avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
```

### **PASO 4: VERIFICAR ARCHIVOS DEL PROYECTO (5 puntos)**

Asegúrate de que estos archivos existen y están correctos:

#### **4.1 Archivos HTML Principales**
- ✅ `Backend/index.html`
- ✅ `Backend/login.html`
- ✅ `Backend/register.html`
- ✅ `Backend/property-detail.html`

#### **4.2 Componentes React/Next.js**
- ✅ `Backend/src/app/register/page.tsx`
- ✅ `Backend/src/app/login/page.tsx`
- ✅ `Backend/src/app/publicar/page.tsx`

#### **4.3 Componentes UI**
- ✅ `Backend/src/components/ui/button.tsx`
- ✅ `Backend/src/components/ui/input.tsx`
- ✅ `Backend/src/components/ui/card.tsx`
- ✅ `Backend/src/components/navbar.tsx`

### **PASO 5: OPTIMIZAR VARIABLES DE ENTORNO**

#### **5.1 Verificar Backend/.env**
```env
# Asegúrate de que estas variables estén correctas
NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key

# Variables adicionales para 100%
SUPABASE_JWT_SECRET=tu_jwt_secret
DATABASE_URL=tu_database_url
```

---

## 🎯 **DESGLOSE DE PUNTUACIÓN PARA 100/100**

### **Backend/API (30 puntos)**
- ✅ Conexión básica (8 pts) - **YA TIENES**
- ✅ Autenticación (8 pts) - **YA TIENES**
- ✅ Storage (8 pts) - **YA TIENES**
- ⚠️ Endpoints properties (2 pts) - **REQUIERE TABLA**
- ⚠️ Endpoints auth (2 pts) - **REQUIERE CONFIGURACIÓN**
- ⚠️ Endpoints users (2 pts) - **REQUIERE TABLA PROFILES**

### **Frontend/Web (25 puntos)**
- ✅ Navegación (7 pts) - **YA TIENES**
- ✅ Formularios (6 pts) - **YA TIENES**
- ✅ Componentes UI (6 pts) - **YA TIENES**
- ✅ Flujos de usuario (6 pts) - **YA TIENES**

### **Database Schema (25 puntos)**
- ⚠️ Tabla profiles (8 pts) - **CREAR MANUALMENTE**
- ⚠️ Tabla properties (8 pts) - **CREAR MANUALMENTE**
- ✅ Auth users (5 pts) - **YA TIENES**
- ⚠️ Políticas RLS (2 pts) - **CONFIGURAR MANUALMENTE**
- ⚠️ Relaciones (2 pts) - **CONFIGURAR MANUALMENTE**

### **Integration Testing (20 puntos)**
- ✅ Flujo autenticación (6 pts) - **YA TIENES**
- ✅ Gestión imágenes (6 pts) - **YA TIENES**
- ⚠️ Búsqueda propiedades (4 pts) - **REQUIERE TABLA**
- ⚠️ Integración total (4 pts) - **REQUIERE TODO LO ANTERIOR**

---

## ⚡ **SCRIPT RÁPIDO PARA 100/100**

<create_file>
<path>CONFIGURAR-SUPABASE-100-PORCIENTO.sql</path>
<content>
-- SCRIPT COMPLETO PARA OBTENER 100/100 EN SUPABASE
-- Ejecuta este script en Supabase Dashboard > SQL Editor

-- 1. CREAR TABLA PROFILES
CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    phone TEXT,
    user_type TEXT DEFAULT 'inquilino' CHECK (user_type IN ('inquilino', 'propietario', 'inmobiliaria')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. CREAR TABLA PROPERTIES
CREATE TABLE IF NOT EXISTS properties (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'ARS',
    property_type TEXT NOT NULL,
    operation_type TEXT NOT NULL,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    province TEXT NOT NULL,
    bedrooms INTEGER,
    bathrooms INTEGER,
    area DECIMAL(8,2),
    images TEXT[],
    contact_phone TEXT,
    contact_email TEXT,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'rented', 'sold')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. HABILITAR RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

-- 4. POLÍTICAS PARA PROFILES
CREATE POLICY "Usuarios pueden ver su propio perfil" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Usuarios pueden actualizar su propio perfil" ON profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Usuarios pueden insertar su propio perfil" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- 5. POLÍTICAS PARA PROPERTIES
CREATE POLICY "Cualquiera puede ver propiedades activas" ON properties
    FOR SELECT USING (status = 'active');

CREATE POLICY "Usuarios pueden crear sus propias propiedades" ON properties
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden actualizar sus propias propiedades" ON properties
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden eliminar sus propias propiedades" ON properties
    FOR DELETE USING (auth.uid() = user_id);

-- 6. POLÍTICAS DE STORAGE (si no existen)
CREATE POLICY "Cualquiera puede ver imágenes de propiedades" ON storage.objects
    FOR SELECT USING (bucket_id = 'property-images');

CREATE POLICY "Usuarios autenticados pueden subir imágenes" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'property-images' AND auth.role() = 'authenticated');

-- 7. FUNCIÓN PARA CREAR PERFIL AUTOMÁTICAMENTE
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. TRIGGER PARA CREAR PERFIL AUTOMÁTICAMENTE
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ¡LISTO! Ahora ejecuta el testing para obtener 100/100
