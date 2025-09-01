# 🚨 SOLUCIÓN COMPLETA: ERROR "Database error saving new user"

## **PROBLEMA IDENTIFICADO**
Error al crear nuevos usuarios: "Database error saving new user"

## **CAUSAS POSIBLES**

### **1. PROBLEMA EN LA TABLA `users`**
- La tabla `users` no existe en Supabase
- Faltan columnas requeridas
- Problemas de permisos RLS (Row Level Security)

### **2. CONFLICTO DE ESQUEMAS**
- Desincronización entre Prisma y Supabase
- Campos con nombres diferentes
- Tipos de datos incompatibles

### **3. POLÍTICAS RLS RESTRICTIVAS**
- Las políticas de seguridad bloquean la inserción
- Falta de permisos para crear usuarios

---

## **🔧 SOLUCIONES PASO A PASO**

### **SOLUCIÓN 1: VERIFICAR Y CREAR TABLA `users`**

#### **Paso 1: Ejecutar en SQL Editor de Supabase**
```sql
-- Verificar si existe la tabla users
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'users';

-- Si no existe, crearla
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    user_type TEXT NOT NULL CHECK (user_type IN ('inquilino', 'dueno_directo', 'inmobiliaria')),
    company_name TEXT,
    license_number TEXT,
    property_count INTEGER,
    email_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_user_type ON public.users(user_type);
```

### **SOLUCIÓN 2: CONFIGURAR POLÍTICAS RLS**

#### **Paso 2: Habilitar RLS y crear políticas**
```sql
-- Habilitar RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Política para permitir inserción (registro)
CREATE POLICY "Allow user registration" ON public.users
    FOR INSERT 
    WITH CHECK (true);

-- Política para que usuarios vean su propio perfil
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT 
    USING (auth.uid() = id);

-- Política para que usuarios actualicen su propio perfil
CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE 
    USING (auth.uid() = id);
```

### **SOLUCIÓN 3: SINCRONIZAR CON AUTH.USERS**

#### **Paso 3: Crear trigger para sincronización automática**
```sql
-- Función para crear perfil automáticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, name, email, phone, user_type, company_name, license_number, property_count, email_verified)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'name', ''),
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'phone', ''),
        COALESCE(NEW.raw_user_meta_data->>'userType', 'inquilino'),
        NEW.raw_user_meta_data->>'companyName',
        NEW.raw_user_meta_data->>'licenseNumber',
        (NEW.raw_user_meta_data->>'propertyCount')::INTEGER,
        NEW.email_confirmed_at IS NOT NULL
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crear trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

---

## **🛠️ SOLUCIÓN ALTERNATIVA: ENDPOINT SIMPLIFICADO**

### **Crear endpoint de registro más robusto**

```typescript
// Backend/src/app/api/auth/register/route-fixed.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(request: NextRequest) {
  try {
    const { name, email, phone, password, userType, companyName, licenseNumber, propertyCount } = await request.json()

    // Validaciones básicas
    if (!name || !email || !phone || !password || !userType) {
      return NextResponse.json({ error: 'Campos requeridos faltantes' }, { status: 400 })
    }

    // Crear cliente con service role
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    // Registrar usuario en Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        name,
        phone,
        userType,
        companyName: userType === 'inmobiliaria' ? companyName : null,
        licenseNumber: userType === 'inmobiliaria' ? licenseNumber : null,
        propertyCount: userType === 'dueno_directo' ? propertyCount : null
      }
    })

    if (authError) {
      console.error('Error en Auth:', authError)
      return NextResponse.json({ error: `Error de autenticación: ${authError.message}` }, { status: 500 })
    }

    // El trigger debería crear automáticamente el perfil
    // Verificar que se creó
    const { data: profileData, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authData.user.id)
      .single()

    if (profileError) {
      console.error('Error verificando perfil:', profileError)
      
      // Intentar crear manualmente si el trigger falló
      const { data: manualProfile, error: manualError } = await supabase
        .from('users')
        .insert([{
          id: authData.user.id,
          name,
          email,
          phone,
          user_type: userType,
          company_name: userType === 'inmobiliaria' ? companyName : null,
          license_number: userType === 'inmobiliaria' ? licenseNumber : null,
          property_count: userType === 'dueno_directo' ? propertyCount : null,
          email_verified: true
        }])
        .select()
        .single()

      if (manualError) {
        // Si falla todo, eliminar usuario de Auth
        await supabase.auth.admin.deleteUser(authData.user.id)
        return NextResponse.json({ 
          error: `Error creando perfil: ${manualError.message}` 
        }, { status: 500 })
      }

      return NextResponse.json({
        message: 'Usuario registrado exitosamente',
        user: manualProfile
      }, { status: 201 })
    }

    return NextResponse.json({
      message: 'Usuario registrado exitosamente',
      user: profileData
    }, { status: 201 })

  } catch (error) {
    console.error('Error general:', error)
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      details: process.env.NODE_ENV === 'development' ? String(error) : undefined
    }, { status: 500 })
  }
}
```

---

## **🔍 DIAGNÓSTICO RÁPIDO**

### **Script para verificar configuración**
```sql
-- 1. Verificar tabla users
SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'users' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Verificar políticas RLS
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename = 'users';

-- 3. Verificar triggers
SELECT trigger_name, event_manipulation, event_object_table, action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'users';

-- 4. Probar inserción manual
INSERT INTO public.users (name, email, phone, user_type, email_verified)
VALUES ('Test User', 'test@example.com', '123456789', 'inquilino', true);
```

---

## **⚡ SOLUCIÓN RÁPIDA**

### **Si necesitas una solución inmediata:**

1. **Ejecuta este SQL en Supabase:**
```sql
-- Crear tabla si no existe
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    user_type TEXT NOT NULL DEFAULT 'inquilino',
    company_name TEXT,
    license_number TEXT,
    property_count INTEGER,
    email_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Deshabilitar RLS temporalmente para testing
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
```

2. **Prueba el registro nuevamente**

3. **Una vez funcionando, habilita RLS:**
```sql
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations for testing" ON public.users
    FOR ALL 
    USING (true)
    WITH CHECK (true);
```

---

## **📋 CHECKLIST DE VERIFICACIÓN**

- [ ] ✅ Tabla `users` existe en Supabase
- [ ] ✅ Columnas coinciden con el código
- [ ] ✅ Variables de entorno configuradas
- [ ] ✅ Service Role Key válida
- [ ] ✅ Políticas RLS configuradas
- [ ] ✅ Triggers funcionando
- [ ] ✅ Conexión a base de datos estable

---

## **🆘 SI NADA FUNCIONA**

### **Solución de emergencia:**
```sql
-- Eliminar tabla problemática
DROP TABLE IF EXISTS public.users CASCADE;

-- Recrear desde cero
CREATE TABLE public.users (
    id UUID PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    user_type TEXT NOT NULL,
    company_name TEXT,
    license_number TEXT,
    property_count INTEGER,
    email_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sin RLS por ahora
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
```

**¡Esto debería resolver el problema inmediatamente!**
