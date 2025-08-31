# 📋 GUÍA DETALLADA: Contenido de cada archivo .env

**Proyecto:** Misiones Arrienda  
**Fecha:** 2025-01-03  
**Propósito:** Definir qué información debe contener cada archivo .env  

---

## 🔍 CONTENIDO ESPECÍFICO PARA CADA ARCHIVO

### 1. **`.env`** - Archivo Principal Activo
**Propósito:** Variables de entorno para desarrollo local  
**Estado:** ✅ NECESARIO - Archivo que Next.js lee por defecto  
**Incluir en Git:** ❌ NO (contiene datos sensibles)

```bash
# === CONFIGURACIÓN DE BASE DE DATOS ===
DATABASE_URL="postgresql://usuario:password@localhost:5432/misiones_arrienda_dev"
DIRECT_URL="postgresql://usuario:password@localhost:5432/misiones_arrienda_dev"

# === SUPABASE CONFIGURACIÓN ===
NEXT_PUBLIC_SUPABASE_URL="https://tu-proyecto.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
SUPABASE_SERVICE_ROLE_KEY="eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."

# === AUTENTICACIÓN ===
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="tu-secret-key-super-seguro-desarrollo"
JWT_SECRET="otro-secret-para-jwt-desarrollo"

# === MERCADOPAGO ===
MERCADOPAGO_ACCESS_TOKEN="TEST-1234567890-123456-abcdef..."
MERCADOPAGO_PUBLIC_KEY="TEST-abcdef12-3456-7890-abcd-ef1234567890"
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY="TEST-abcdef12-3456-7890-abcd-ef1234567890"

# === CONFIGURACIÓN DE APLICACIÓN ===
NODE_ENV="development"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_API_URL="http://localhost:3000/api"

# === SERVICIOS EXTERNOS ===
RESEND_API_KEY="re_123456789_abcdefghijklmnop"
UPLOADTHING_SECRET="sk_live_..."
UPLOADTHING_APP_ID="app_..."

# === CONFIGURACIÓN DE DESARROLLO ===
NEXT_PUBLIC_DEBUG="true"
LOG_LEVEL="debug"
```

---

### 2. **`.env.example`** - Plantilla para Desarrolladores
**Propósito:** Plantilla pública sin valores reales  
**Estado:** ✅ NECESARIO - Buena práctica estándar  
**Incluir en Git:** ✅ SÍ (sin datos sensibles)

```bash
# === CONFIGURACIÓN DE BASE DE DATOS ===
# URL de conexión a PostgreSQL
DATABASE_URL="postgresql://usuario:password@localhost:5432/nombre_db"
DIRECT_URL="postgresql://usuario:password@localhost:5432/nombre_db"

# === SUPABASE CONFIGURACIÓN ===
# Obtener de: https://app.supabase.com/project/tu-proyecto/settings/api
NEXT_PUBLIC_SUPABASE_URL="https://tu-proyecto.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="tu_anon_key_aqui"
SUPABASE_SERVICE_ROLE_KEY="tu_service_role_key_aqui"

# === AUTENTICACIÓN ===
# URL base de la aplicación
NEXTAUTH_URL="http://localhost:3000"
# Generar con: openssl rand -base64 32
NEXTAUTH_SECRET="tu_secret_key_aqui"
JWT_SECRET="tu_jwt_secret_aqui"

# === MERCADOPAGO ===
# Obtener de: https://www.mercadopago.com.ar/developers/panel/credentials
MERCADOPAGO_ACCESS_TOKEN="tu_access_token_aqui"
MERCADOPAGO_PUBLIC_KEY="tu_public_key_aqui"
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY="tu_public_key_aqui"

# === CONFIGURACIÓN DE APLICACIÓN ===
NODE_ENV="development"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_API_URL="http://localhost:3000/api"

# === SERVICIOS EXTERNOS ===
# Obtener de: https://resend.com/api-keys
RESEND_API_KEY="tu_resend_api_key_aqui"
# Obtener de: https://uploadthing.com/dashboard
UPLOADTHING_SECRET="tu_uploadthing_secret_aqui"
UPLOADTHING_APP_ID="tu_uploadthing_app_id_aqui"

# === CONFIGURACIÓN DE DESARROLLO ===
NEXT_PUBLIC_DEBUG="true"
LOG_LEVEL="debug"
```

---

### 3. **`.env.production`** - Variables de Producción
**Propósito:** Configuración específica para producción  
**Estado:** ✅ NECESARIO - Para deployment  
**Incluir en Git:** ❌ NO (contiene datos sensibles)

```bash
# === CONFIGURACIÓN DE BASE DE DATOS ===
DATABASE_URL="postgresql://usuario:password@db-host.com:5432/misiones_arrienda_prod"
DIRECT_URL="postgresql://usuario:password@db-host.com:5432/misiones_arrienda_prod"

# === SUPABASE CONFIGURACIÓN ===
NEXT_PUBLIC_SUPABASE_URL="https://tu-proyecto-prod.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
SUPABASE_SERVICE_ROLE_KEY="eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."

# === AUTENTICACIÓN ===
NEXTAUTH_URL="https://misionesarrienda.com"
NEXTAUTH_SECRET="super-secret-key-produccion-muy-seguro"
JWT_SECRET="jwt-secret-produccion-diferente-al-dev"

# === MERCADOPAGO ===
MERCADOPAGO_ACCESS_TOKEN="APP_USR-1234567890-123456-abcdef..."
MERCADOPAGO_PUBLIC_KEY="APP_USR-abcdef12-3456-7890-abcd-ef1234567890"
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY="APP_USR-abcdef12-3456-7890-abcd-ef1234567890"

# === CONFIGURACIÓN DE APLICACIÓN ===
NODE_ENV="production"
NEXT_PUBLIC_APP_URL="https://misionesarrienda.com"
NEXT_PUBLIC_API_URL="https://misionesarrienda.com/api"

# === SERVICIOS EXTERNOS ===
RESEND_API_KEY="re_prod_123456789_abcdefghijklmnop"
UPLOADTHING_SECRET="sk_live_prod_..."
UPLOADTHING_APP_ID="app_prod_..."

# === CONFIGURACIÓN DE PRODUCCIÓN ===
NEXT_PUBLIC_DEBUG="false"
LOG_LEVEL="error"

# === CONFIGURACIÓN DE VERCEL/NETLIFY ===
VERCEL_URL="misionesarrienda.vercel.app"
NEXT_PUBLIC_VERCEL_URL="misionesarrienda.vercel.app"
```

---

### 4. **`.env.local`** - Overrides Locales (OPCIONAL)
**Propósito:** Variables específicas de tu máquina local  
**Estado:** ⚠️ OPCIONAL - Solo si necesitas overrides  
**Incluir en Git:** ❌ NO (específico de cada desarrollador)

```bash
# === OVERRIDES LOCALES ESPECÍFICOS ===
# Solo incluir variables que necesites sobrescribir localmente

# Ejemplo: Base de datos local diferente
DATABASE_URL="postgresql://mi_usuario:mi_password@localhost:5432/mi_db_local"

# Ejemplo: Puerto diferente para desarrollo
NEXT_PUBLIC_APP_URL="http://localhost:3001"
NEXTAUTH_URL="http://localhost:3001"

# Ejemplo: Configuración de debug personal
NEXT_PUBLIC_DEBUG="true"
LOG_LEVEL="verbose"

# Ejemplo: Keys de testing personales
MERCADOPAGO_ACCESS_TOKEN="TEST-mi-token-personal-testing"
```

---

## 🔒 VARIABLES CRÍTICAS POR CATEGORÍA

### **🗄️ BASE DE DATOS**
```bash
DATABASE_URL="postgresql://..."          # Conexión principal
DIRECT_URL="postgresql://..."            # Conexión directa (Prisma)
```

### **🔐 AUTENTICACIÓN**
```bash
NEXTAUTH_URL="https://..."               # URL base de la app
NEXTAUTH_SECRET="..."                    # Secret para NextAuth
JWT_SECRET="..."                         # Secret para JWT
```

### **☁️ SUPABASE**
```bash
NEXT_PUBLIC_SUPABASE_URL="https://..."   # URL del proyecto
NEXT_PUBLIC_SUPABASE_ANON_KEY="..."      # Clave anónima (pública)
SUPABASE_SERVICE_ROLE_KEY="..."          # Clave de servicio (privada)
```

### **💳 PAGOS (MERCADOPAGO)**
```bash
MERCADOPAGO_ACCESS_TOKEN="..."           # Token de acceso
MERCADOPAGO_PUBLIC_KEY="..."             # Clave pública
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY="..." # Clave pública (cliente)
```

### **📧 SERVICIOS EXTERNOS**
```bash
RESEND_API_KEY="..."                     # Para envío de emails
UPLOADTHING_SECRET="..."                 # Para carga de archivos
UPLOADTHING_APP_ID="..."                 # ID de la app
```

### **⚙️ CONFIGURACIÓN GENERAL**
```bash
NODE_ENV="development|production"        # Entorno
NEXT_PUBLIC_APP_URL="https://..."        # URL de la aplicación
NEXT_PUBLIC_API_URL="https://..."        # URL de la API
NEXT_PUBLIC_DEBUG="true|false"           # Modo debug
LOG_LEVEL="debug|info|error"             # Nivel de logs
```

---

## 🚨 ARCHIVOS A ELIMINAR

### **❌ `.env.local.new`** - Archivo Temporal
**Razón:** Es un backup/duplicado innecesario  
**Acción:** Eliminar después de verificar que no contiene información única

### **❌ `.env.template`** - Plantilla Redundante
**Razón:** Duplica la función de `.env.example`  
**Acción:** Eliminar y usar solo `.env.example`

---

## 🔧 COMANDOS PARA GENERAR SECRETS

### **Generar NEXTAUTH_SECRET:**
```bash
openssl rand -base64 32
```

### **Generar JWT_SECRET:**
```bash
openssl rand -hex 32
```

### **Generar UUID (para IDs únicos):**
```bash
node -e "console.log(require('crypto').randomUUID())"
```

---

## 📝 BUENAS PRÁCTICAS

### **✅ HACER:**
- Usar nombres descriptivos para las variables
- Agrupar variables por categoría con comentarios
- Mantener `.env.example` actualizado
- Usar diferentes secrets para desarrollo y producción
- Documentar dónde obtener cada clave

### **❌ NO HACER:**
- Subir archivos `.env` con datos reales a Git
- Usar los mismos secrets en desarrollo y producción
- Dejar variables sin usar
- Hardcodear valores sensibles en el código

---

## 🎯 ESTRUCTURA FINAL RECOMENDADA

```
Backend/
├── .env                 # Variables de desarrollo (NO en Git)
├── .env.example         # Plantilla pública (SÍ en Git)
├── .env.production      # Variables de producción (NO en Git)
└── .env.local          # Overrides locales opcionales (NO en Git)
```

---

**💡 NOTA:** Después de configurar correctamente estos archivos, puedes eliminar `.env.local.new` y `.env.template` para mantener tu proyecto limpio y organizado.
