# REPORTE 2: PLAN DE CORRECCIÓN SUPABASE DETALLADO

**Fecha**: 30 de Agosto de 2025  
**Auditor**: BlackBox AI  
**Tipo**: Plan de Implementación  
**Prioridad**: CRÍTICA  
**Referencia**: REPORTE-1-AUDITORIA-SUPABASE-PROBLEMAS-CRITICOS.md

## Resumen Ejecutivo

Este reporte presenta un plan detallado para corregir los 7 problemas críticos identificados en la auditoría de Supabase. El plan está estructurado en 4 fases con tiempos estimados y pasos específicos.

## FASE 1: CORRECCIÓN DE PROBLEMAS CRÍTICOS (2-3 horas)

### 🔴 PROBLEMA 1: Sincronización Prisma Schema vs Supabase
**Tiempo estimado**: 90 minutos

#### Paso 1.1: Corregir Modelo Profile
**Archivo**: `Backend/prisma/schema.prisma`
**Acción**: Modificar el modelo Profile

```prisma
model Profile {
  id         String   @id @default(uuid()) @db.Uuid
  full_name  String?  @map("full_name")
  avatar_url String?  @map("avatar_url")
  created_at DateTime @default(now()) @db.Timestamptz(6)
  updated_at DateTime @default(now()) @updatedAt @db.Timestamptz(6)
  
  // Relación con User
  user       User     @relation(fields: [id], references: [id], onDelete: Cascade)
  
  @@map("profiles")
}
```

#### Paso 1.2: Definir Enums en Supabase
**Archivo**: Crear `Backend/supabase/migrations/001_create_enums.sql`

```sql
-- Crear enums necesarios
CREATE TYPE community_role AS ENUM ('BUSCO', 'OFREZCO');
CREATE TYPE pet_pref AS ENUM ('SI_PET', 'NO_PET', 'INDIFERENTE');
CREATE TYPE smoke_pref AS ENUM ('FUMADOR', 'NO_FUMADOR', 'INDIFERENTE');
CREATE TYPE diet AS ENUM ('NINGUNA', 'VEGETARIANO', 'VEGANO', 'CELIACO', 'OTRO');
CREATE TYPE room_type AS ENUM ('PRIVADA', 'COMPARTIDA', 'ESTUDIO');
```

#### Paso 1.3: Corregir Arrays JSON
**Acción**: Modificar campos de array en el schema

```prisma
model UserProfile {
  // Cambiar de String[] a String con validación JSON
  photos        String?  // JSON array
  tags          String?  // JSON array
  
  // Agregar validación en el código
}
```

### 🔴 PROBLEMA 2: Configuración Supabase Robusta
**Tiempo estimado**: 45 minutos

#### Paso 2.1: Mejorar Cliente Supabase
**Archivo**: `Backend/src/lib/supabase/client.ts`

```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  // Validar variables de entorno
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables')
  }

  return createBrowserClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    },
    global: {
      headers: {
        'x-application-name': 'misiones-arrienda'
      }
    }
  })
}
```

#### Paso 2.2: Mejorar Servidor Supabase
**Archivo**: `Backend/src/lib/supabase/server.ts`

```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export function createClient() {
  const cookieStore = cookies()
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables')
  }

  return createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        } catch (error) {
          console.warn('Failed to set cookies:', error)
        }
      },
    },
    auth: {
      persistSession: false // Server-side no persiste sesión
    }
  })
}
```

### 🔴 PROBLEMA 7: Migración Bootstrap Compatible
**Tiempo estimado**: 30 minutos

#### Paso 7.1: Crear Migración Supabase Compatible
**Archivo**: `Backend/supabase/migrations/002_bootstrap_tables.sql`

```sql
-- Habilitar RLS por defecto
ALTER DEFAULT PRIVILEGES REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;

-- Crear tablas principales con RLS
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Crear política básica
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);
```

## FASE 2: LIMPIEZA DE ARCHIVOS CONFLICTIVOS (1 hora)

### 🔴 PROBLEMA 5: Eliminar Archivos Duplicados
**Tiempo estimado**: 30 minutos

#### Paso 5.1: Eliminar Archivos Legacy
**Archivos a eliminar**:
- `Backend/src/lib/supabaseServer.ts`
- `Backend/src/hooks/useSupabaseAuth.ts` (reemplazar por hook estándar)
- Archivos SQL duplicados en raíz del proyecto

#### Paso 5.2: Consolidar Configuración SQL
**Acción**: Mover todos los archivos SQL a `Backend/supabase/migrations/`

### 🔴 PROBLEMA 3: Corregir Middleware
**Tiempo estimado**: 30 minutos

#### Paso 3.1: Actualizar Middleware
**Archivo**: `Backend/src/middleware.ts`

```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Excluir rutas de Supabase
  if (
    request.nextUrl.pathname.startsWith('/auth/callback') ||
    request.nextUrl.pathname.startsWith('/storage/v1') ||
    request.nextUrl.pathname.startsWith('/_next') ||
    request.nextUrl.pathname.startsWith('/api')
  ) {
    return response
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  await supabase.auth.getUser()
  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

## FASE 3: CORRECCIÓN DE APIs Y VALIDACIONES (1.5 horas)

### 🔴 PROBLEMA 4: Unificar Lógica de APIs
**Tiempo estimado**: 60 minutos

#### Paso 4.1: Corregir API Properties
**Archivo**: `Backend/src/app/api/properties/route.ts`

```typescript
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const supabase = createClient()
  
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .eq('status', 'AVAILABLE')
    
    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }
    
    return NextResponse.json({ properties: data })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

#### Paso 4.2: Implementar RLS en APIs
**Acción**: Agregar políticas RLS para todas las tablas principales

### 🔴 PROBLEMA 6: Corregir Validaciones
**Tiempo estimado**: 30 minutos

#### Paso 6.1: Actualizar Validaciones
**Archivo**: `Backend/src/lib/validations/property.ts`

```typescript
import { z } from 'zod'

export const propertySchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().min(1),
  price: z.number().positive(),
  currency: z.enum(['ARS', 'USD', 'EUR']).default('ARS'),
  bedrooms: z.number().int().min(0),
  bathrooms: z.number().int().min(0),
  area: z.number().positive(),
  // Validar JSON arrays
  images: z.string().refine((val) => {
    try {
      const parsed = JSON.parse(val)
      return Array.isArray(parsed)
    } catch {
      return false
    }
  }, 'Images must be a valid JSON array'),
  contact_phone: z.string().min(1), // Campo requerido por Supabase
})
```

## FASE 4: TESTING Y VALIDACIÓN (1 hora)

### Paso Final 1: Testing de Conexión
**Tiempo estimado**: 30 minutos

#### Crear Test de Conexión
**Archivo**: `Backend/src/lib/__tests__/supabase-connection.test.ts`

```typescript
import { createClient } from '@/lib/supabase/client'

describe('Supabase Connection', () => {
  it('should connect to Supabase', async () => {
    const supabase = createClient()
    const { data, error } = await supabase.from('profiles').select('count')
    
    expect(error).toBeNull()
    expect(data).toBeDefined()
  })
})
```

### Paso Final 2: Validación de Schema
**Tiempo estimado**: 30 minutos

#### Verificar Sincronización
1. Ejecutar `npx prisma db push` para sincronizar schema
2. Verificar que todas las tablas existen en Supabase
3. Probar inserción de datos de prueba
4. Validar que RLS funciona correctamente

## ARCHIVOS A CREAR/MODIFICAR

### Archivos Nuevos:
1. `Backend/supabase/migrations/001_create_enums.sql`
2. `Backend/supabase/migrations/002_bootstrap_tables.sql`
3. `Backend/src/lib/__tests__/supabase-connection.test.ts`

### Archivos a Modificar:
1. `Backend/prisma/schema.prisma`
2. `Backend/src/lib/supabase/client.ts`
3. `Backend/src/lib/supabase/server.ts`
4. `Backend/src/middleware.ts`
5. `Backend/src/app/api/properties/route.ts`
6. `Backend/src/lib/validations/property.ts`

### Archivos a Eliminar:
1. `Backend/src/lib/supabaseServer.ts`
2. `Backend/src/hooks/useSupabaseAuth.ts`
3. Múltiples archivos `SUPABASE-*.sql` en raíz
4. Archivos de testing obsoletos

## CRONOGRAMA DE IMPLEMENTACIÓN

| Fase | Tiempo | Descripción |
|------|--------|-------------|
| Fase 1 | 2-3 horas | Problemas críticos (1, 2, 7) |
| Fase 2 | 1 hora | Limpieza archivos (3, 5) |
| Fase 3 | 1.5 horas | APIs y validaciones (4, 6) |
| Fase 4 | 1 hora | Testing y validación |
| **Total** | **5.5-6.5 horas** | **Implementación completa** |

## RIESGOS Y MITIGACIONES

### Riesgo Alto: Pérdida de Datos
**Mitigación**: Hacer backup completo antes de iniciar

### Riesgo Medio: Incompatibilidad de Tipos
**Mitigación**: Testing exhaustivo en cada fase

### Riesgo Bajo: Problemas de Performance
**Mitigación**: Monitoreo de queries durante implementación

## CRITERIOS DE ÉXITO

✅ **Fase 1 Completa**: Schema sincronizado, configuración robusta  
✅ **Fase 2 Completa**: Archivos duplicados eliminados  
✅ **Fase 3 Completa**: APIs funcionando con RLS  
✅ **Fase 4 Completa**: Tests pasando, datos insertándose correctamente  

## PRÓXIMOS PASOS

1. **Aprobación del Plan**: Confirmar plan con stakeholders
2. **Backup de Datos**: Crear backup completo de la base de datos
3. **Implementación Fase 1**: Comenzar con problemas críticos
4. **Testing Continuo**: Validar cada fase antes de continuar

---

**Siguiente reporte**: REPORTE-3-IMPLEMENTACION-FASE-1-CRITICA.md
