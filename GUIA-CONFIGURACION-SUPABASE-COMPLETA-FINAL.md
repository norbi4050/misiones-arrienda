# 🚀 GUÍA COMPLETA - CONFIGURACIÓN DE SUPABASE PARA MISIONES ARRIENDA

## 📋 Resumen Ejecutivo

Para que tu aplicación **Misiones Arrienda** funcione completamente, necesitas configurar Supabase como base de datos y sistema de autenticación. Actualmente los errores 400 que ves son normales porque no hay credenciales configuradas.

## 🎯 ¿Qué Necesitas Configurar?

### **1. CREAR PROYECTO EN SUPABASE**

#### **Paso 1: Registro y Proyecto**
1. Ve a [supabase.com](https://supabase.com)
2. Crea una cuenta gratuita
3. Crea un nuevo proyecto:
   - **Nombre:** `misiones-arrienda`
   - **Región:** South America (más cercana)
   - **Plan:** Free (suficiente para empezar)

#### **Paso 2: Obtener Credenciales**
Una vez creado el proyecto, ve a **Settings > API** y copia:

```env
# Estas son las variables que necesitas
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.tu-proyecto.supabase.co:5432/postgres
DIRECT_URL=postgresql://postgres:[PASSWORD]@db.tu-proyecto.supabase.co:5432/postgres
```

### **2. CONFIGURAR VARIABLES DE ENTORNO**

#### **Crear archivo .env.local**
En la carpeta `Backend/`, crea el archivo `.env.local`:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key_aqui
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key_aqui

# Database URLs
DATABASE_URL=postgresql://postgres:tu_password@db.tu-proyecto.supabase.co:5432/postgres
DIRECT_URL=postgresql://postgres:tu_password@db.tu-proyecto.supabase.co:5432/postgres

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=tu_secret_muy_seguro_aqui

# MercadoPago (opcional por ahora)
MERCADOPAGO_ACCESS_TOKEN=tu_token_de_mercadopago
```

### **3. CONFIGURAR BASE DE DATOS**

#### **Paso 1: Ejecutar Schema de Prisma**
```bash
cd Backend
npx prisma db push
```

#### **Paso 2: Generar Cliente Prisma**
```bash
npx prisma generate
```

#### **Paso 3: Poblar Base de Datos (Opcional)**
```bash
npx prisma db seed
```

### **4. CONFIGURAR AUTENTICACIÓN EN SUPABASE**

#### **En el Dashboard de Supabase:**

1. **Ve a Authentication > Settings**
2. **Configura Site URL:**
   - Development: `http://localhost:3000`
   - Production: `https://tu-dominio.com`

3. **Configura Redirect URLs:**
   - `http://localhost:3000/auth/callback`
   - `https://tu-dominio.com/auth/callback`

4. **Habilita Email Auth:**
   - Email confirmations: Enabled
   - Email change confirmations: Enabled

### **5. CONFIGURAR POLÍTICAS RLS (Row Level Security)**

#### **Ejecutar SQL en Supabase:**
Ve a **SQL Editor** en Supabase y ejecuta:

```sql
-- Habilitar RLS en todas las tablas
ALTER TABLE "Property" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Agent" ENABLE ROW LEVEL SECURITY;

-- Política para propiedades (usuarios pueden ver todas, solo crear las suyas)
CREATE POLICY "Properties are viewable by everyone" ON "Property"
    FOR SELECT USING (true);

CREATE POLICY "Users can create their own properties" ON "Property"
    FOR INSERT WITH CHECK (auth.uid()::text = "userId");

CREATE POLICY "Users can update their own properties" ON "Property"
    FOR UPDATE USING (auth.uid()::text = "userId");

-- Política para usuarios (pueden ver su propio perfil)
CREATE POLICY "Users can view their own profile" ON "User"
    FOR SELECT USING (auth.uid()::text = id);

CREATE POLICY "Users can update their own profile" ON "User"
    FOR UPDATE USING (auth.uid()::text = id);
```

## 🔧 COMANDOS PARA CONFIGURAR TODO

### **Script Automático de Configuración:**

```bash
# 1. Instalar dependencias
cd Backend
npm install

# 2. Configurar Prisma con Supabase
npx prisma db push

# 3. Generar cliente Prisma
npx prisma generate

# 4. Verificar conexión
npm run build
```

## ✅ VERIFICACIÓN DE CONFIGURACIÓN

### **Checklist de Configuración:**

- [ ] ✅ Proyecto creado en Supabase
- [ ] ✅ Variables de entorno configuradas en `.env.local`
- [ ] ✅ Schema de base de datos aplicado (`prisma db push`)
- [ ] ✅ Cliente Prisma generado (`prisma generate`)
- [ ] ✅ Políticas RLS configuradas
- [ ] ✅ URLs de autenticación configuradas
- [ ] ✅ Build exitoso (`npm run build`)

### **Probar la Configuración:**

```bash
# Ejecutar la aplicación
cd Backend
npm run dev
```

**Deberías ver:**
- ✅ Aplicación carga sin errores 400
- ✅ Puedes registrarte/iniciar sesión
- ✅ Puedes crear propiedades
- ✅ Las propiedades se guardan en la base de datos

## 🚨 PROBLEMAS COMUNES Y SOLUCIONES

### **Error: "Invalid API key"**
**Solución:** Verifica que las variables `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` estén correctas.

### **Error: "Database connection failed"**
**Solución:** Verifica que `DATABASE_URL` tenga la contraseña correcta de tu proyecto Supabase.

### **Error: "Table doesn't exist"**
**Solución:** Ejecuta `npx prisma db push` para crear las tablas.

### **Error: "RLS policy violation"**
**Solución:** Configura las políticas RLS como se muestra arriba.

## 📊 ESTADO ACTUAL VS CONFIGURADO

### **ANTES (Estado Actual):**
- ❌ Error 400 en `/api/properties`
- ❌ No se pueden crear usuarios
- ❌ No se pueden guardar propiedades
- ❌ Autenticación no funciona

### **DESPUÉS (Con Supabase Configurado):**
- ✅ API de propiedades funcional
- ✅ Registro/login de usuarios
- ✅ Creación y gestión de propiedades
- ✅ Sistema de autenticación completo
- ✅ Base de datos persistente

## 🎉 RESULTADO FINAL

Una vez configurado Supabase, tendrás:

1. **Sistema de autenticación completo** (registro, login, logout)
2. **Base de datos funcional** (propiedades, usuarios, favoritos)
3. **API completamente operativa** (sin errores 400)
4. **Aplicación lista para producción**

## 📞 PRÓXIMOS PASOS

1. **Configura Supabase** siguiendo esta guía
2. **Prueba la aplicación** localmente
3. **Despliega en Vercel** con las variables de entorno
4. **¡Tu plataforma estará completamente funcional!**

---

**💡 Nota:** Los errores de compilación ya están resueltos. Solo necesitas configurar Supabase para que la aplicación funcione completamente con base de datos real.
