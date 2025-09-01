# 11. GUÍA MANUAL CORRECCIÓN VARIABLES ENV

## 🎯 INSTRUCCIONES PASO A PASO PARA CORREGIR ARCHIVOS .ENV

**Fecha:** 9 de Enero 2025  
**Objetivo:** Guía manual para que el usuario corrija los archivos .env sin automatización

---

## 📋 RESUMEN DE PROBLEMAS IDENTIFICADOS

He analizado tus archivos .env y encontré **problemas críticos** que requieren corrección manual:

### ❌ **PROBLEMAS PRINCIPALES:**
1. **4 archivos .env duplicados** con configuraciones inconsistentes
2. **Credenciales reales expuestas** en .env.example
3. **Variables incorrectas** y configuraciones conflictivas
4. **Riesgos de seguridad** por duplicación innecesaria

---

## 🗂️ ARCHIVOS ACTUALES ENCONTRADOS

```
📁 Tu Proyecto/
├── .env (raíz) ❌ ELIMINAR
└── Backend/
    ├── .env ✅ CORREGIR
    ├── .env.example ✅ CORREGIR
    └── .env.production ❌ ELIMINAR
```

---

## 🚀 PASOS MANUALES A SEGUIR

### **PASO 1: ELIMINAR ARCHIVOS INNECESARIOS**

#### 1.1 Eliminar .env de la raíz del proyecto
```bash
# Navegar a la raíz de tu proyecto
# Eliminar el archivo .env que está en la raíz (NO en Backend)
```
**Acción:** Borrar manualmente el archivo `.env` que está en la carpeta raíz del proyecto.

#### 1.2 Eliminar .env.production de Backend
```bash
# Navegar a Backend/
# Eliminar Backend/.env.production
```
**Acción:** Borrar manualmente el archivo `Backend/.env.production`.

---

### **PASO 2: CORREGIR Backend/.env**

**Abrir:** `Backend/.env`  
**Reemplazar todo el contenido con:**

```bash
# === CONFIGURACIÓN DE BASE DE DATOS ===
DATABASE_URL=postgresql://postgres.qfeyhaaxyemmnohqdele:Yanina302472%21@aws-1-us-east-2.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true&connection_limit=1
DIRECT_URL=postgresql://postgres:Yanina302472!@db.qfeyhaaxyemmnohqdele.supabase.co:5432/postgres?sslmode=require

# === SUPABASE CONFIGURACIÓN ===
NEXT_PUBLIC_SUPABASE_URL=https://qfeyhaaxyemmnohqdele.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmZXloYWF4eWVtbW5vaHFkZWxlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4MTY3MzgsImV4cCI6MjA3MTM5MjczOH0.vgrh055OkiBIJFBlRlEuEZAOF2FHo3LBUNitB09dSIE
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmZXloYWF4eWVtbW5vaHFkZWxlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTgxNjczOCwiZXhwIjoyMDcxMzkyNzM4fQ.5wJb1p0Rmg1dVIayIT4wZO_seDXTIwhVa36CyEgK-yM

# === AUTENTICACIÓN ===
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=5685128fb42e3ceca234ecd61cac3
JWT_SECRET=671f25e53c5624cc07054c5c9fb30d5e92bccc37d7718c543a6bc02305e8011a

# === MERCADOPAGO ===
MERCADOPAGO_ACCESS_TOKEN=APP_USR-3647290553297438-082512-ea1978cb2f7b9768080ad2bab3df7600-77412419
MERCADOPAGO_PUBLIC_KEY=APP_USR-5abed961-c23a-4458-82c7-0f564bf7b9d5
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=APP_USR-5abed961-c23a-4458-82c7-0f564bf7b9d5
MERCADOPAGO_CLIENT_ID=3647290553297438
MERCADOPAGO_CLIENT_SECRET=ENlqoDJIZ0fffS8QftXGYfvePfMDd8NO

# === CONFIGURACIÓN DE APLICACIÓN ===
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3000/api

# === SERVICIOS EXTERNOS ===
RESEND_API_KEY=re_ZopLXSBZ_6MdVdspijuQL8A4AB3WABx9o
UPLOADTHING_SECRET=sk_live_f61619561b2e3acf1bb74a68d78348aaa5aee68aabca7213dd3d9fc76ab5bef5
UPLOADTHING_TOKEN=eyJhcGlLZXkiOiJza19saXZlX2Y2MTYxOTU2MWIyZTNhY2YxYmI3NGE2OGQ3ODM0OGFhYTVhZWU2OGFhYmNhNzIxM2RkM2Q5ZmM3NmFiNWJlZjUiLCJhcHBJZCI6Indmd29rOHV5eTYiLCJyZWdpb25zIjpbInNlYTEiXX0=

# === EMAIL CONFIGURACIÓN ===
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=cgonzalezarchilla@gmail.com
SMTP_PASS=epfa kbht yorh gefp

# === CONFIGURACIÓN DE DESARROLLO ===
NEXT_PUBLIC_DEBUG=true
LOG_LEVEL=debug
```

---

### **PASO 3: CORREGIR Backend/.env.example**

**Abrir:** `Backend/.env.example`  
**Reemplazar todo el contenido con:**

```bash
# === CONFIGURACIÓN DE BASE DE DATOS ===
# URL de conexión a PostgreSQL - Obtener de Supabase Dashboard
DATABASE_URL=postgresql://postgres:PASSWORD@HOST:PORT/DATABASE?sslmode=require&pgbouncer=true&connection_limit=1
DIRECT_URL=postgresql://postgres:PASSWORD@HOST:PORT/DATABASE?sslmode=require

# === SUPABASE CONFIGURACIÓN ===
# Obtener de: https://app.supabase.com/project/tu-proyecto/settings/api
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key-aqui
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key-aqui

# === AUTENTICACIÓN ===
# URL base de la aplicación
NEXTAUTH_URL=http://localhost:3000
# Generar con: openssl rand -base64 32
NEXTAUTH_SECRET=tu-nextauth-secret-muy-seguro
JWT_SECRET=tu-jwt-secret-muy-seguro

# === MERCADOPAGO ===
# Obtener de: https://www.mercadopago.com.ar/developers/panel/credentials
MERCADOPAGO_ACCESS_TOKEN=tu-mercadopago-access-token
MERCADOPAGO_PUBLIC_KEY=tu-mercadopago-public-key
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=tu-mercadopago-public-key
MERCADOPAGO_CLIENT_ID=tu-client-id
MERCADOPAGO_CLIENT_SECRET=tu-client-secret

# === CONFIGURACIÓN DE APLICACIÓN ===
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3000/api

# === SERVICIOS EXTERNOS ===
# Obtener de: https://resend.com/api-keys
RESEND_API_KEY=tu-resend-api-key
# Obtener de: https://uploadthing.com/dashboard
UPLOADTHING_SECRET=tu-uploadthing-secret
UPLOADTHING_TOKEN=tu-uploadthing-token

# === EMAIL CONFIGURACIÓN ===
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu-email@gmail.com
SMTP_PASS=tu-password-de-aplicacion

# === CONFIGURACIÓN DE DESARROLLO ===
NEXT_PUBLIC_DEBUG=true
LOG_LEVEL=debug
```

---

### **PASO 4: ACTUALIZAR .gitignore**

**Abrir:** `Backend/.gitignore`  
**Agregar estas líneas al final del archivo:**

```bash
# Variables de entorno
.env.local
.env
*.env.local
```

---

### **PASO 5: CONFIGURAR VARIABLES EN VERCEL**

#### 5.1 Ir a Vercel Dashboard
1. Abrir https://vercel.com/dashboard
2. Seleccionar tu proyecto
3. Ir a **Settings** > **Environment Variables**

#### 5.2 Agregar estas variables una por una:

```bash
DATABASE_URL=postgresql://postgres.qfeyhaaxyemmnohqdele:Yanina302472%21@aws-1-us-east-2.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true&connection_limit=1

DIRECT_URL=postgresql://postgres:Yanina302472!@db.qfeyhaaxyemmnohqdele.supabase.co:5432/postgres?sslmode=require

NEXT_PUBLIC_SUPABASE_URL=https://qfeyhaaxyemmnohqdele.supabase.co

NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmZXloYWF4eWVtbW5vaHFkZWxlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4MTY3MzgsImV4cCI6MjA3MTM5MjczOH0.vgrh055OkiBIJFBlRlEuEZAOF2FHo3LBUNitB09dSIE

SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmZXloYWF4eWVtbW5vaHFkZWxlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTgxNjczOCwiZXhwIjoyMDcxMzkyNzM4fQ.5wJb1p0Rmg1dVIayIT4wZO_seDXTIwhVa36CyEgK-yM

NEXTAUTH_URL=https://www.misionesarrienda.com.ar

NEXTAUTH_SECRET=5685128fb42e3ceca234ecd61cac3

JWT_SECRET=671f25e53c5624cc07054c5c9fb30d5e92bccc37d7718c543a6bc02305e8011a

MERCADOPAGO_ACCESS_TOKEN=APP_USR-3647290553297438-082512-ea1978cb2f7b9768080ad2bab3df7600-77412419

MERCADOPAGO_PUBLIC_KEY=APP_USR-5abed961-c23a-4458-82c7-0f564bf7b9d5

NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=APP_USR-5abed961-c23a-4458-82c7-0f564bf7b9d5

MERCADOPAGO_CLIENT_ID=3647290553297438

MERCADOPAGO_CLIENT_SECRET=ENlqoDJIZ0fffS8QftXGYfvePfMDd8NO

NODE_ENV=production

NEXT_PUBLIC_APP_URL=https://www.misionesarrienda.com.ar

NEXT_PUBLIC_API_URL=https://www.misionesarrienda.com.ar/api

RESEND_API_KEY=re_ZopLXSBZ_6MdVdspijuQL8A4AB3WABx9o

UPLOADTHING_SECRET=sk_live_f61619561b2e3acf1bb74a68d78348aaa5aee68aabca7213dd3d9fc76ab5bef5

UPLOADTHING_TOKEN=eyJhcGlLZXkiOiJza19saXZlX2Y2MTYxOTU2MWIyZTNhY2YxYmI3NGE2OGQ3ODM0OGFhYTVhZWU2OGFhYmNhNzIxM2RkM2Q5ZmM3NmFiNWJlZjUiLCJhcHBJZCI6Indmd29rOHV5eTYiLCJyZWdpb25zIjpbInNlYTEiXX0=

SMTP_HOST=smtp.gmail.com

SMTP_PORT=587

SMTP_USER=cgonzalezarchilla@gmail.com

SMTP_PASS=epfa kbht yorh gefp

NEXT_PUBLIC_DEBUG=false

LOG_LEVEL=error
```

---

## ✅ VERIFICACIÓN FINAL

### **Checklist de Verificación:**

- [ ] ✅ Eliminado `.env` de la raíz del proyecto
- [ ] ✅ Eliminado `Backend/.env.production`
- [ ] ✅ Corregido `Backend/.env` con configuración de desarrollo
- [ ] ✅ Corregido `Backend/.env.example` sin credenciales reales
- [ ] ✅ Actualizado `Backend/.gitignore`
- [ ] ✅ Configuradas variables en Vercel Dashboard
- [ ] ✅ Probado en desarrollo: `npm run dev`
- [ ] ✅ Probado en producción después del deploy

---

## 🧪 COMANDOS DE TESTING

### **Probar en Desarrollo:**
```bash
cd Backend
npm run dev
```

### **Verificar Variables:**
```bash
# En el navegador, ir a: http://localhost:3000
# Verificar que la aplicación carga correctamente
```

### **Verificar Git:**
```bash
git status
# No debería mostrar archivos .env en los cambios
```

---

## 📊 ESTRUCTURA FINAL CORRECTA

```
📁 Tu Proyecto/
└── Backend/
    ├── .env                # ✅ Desarrollo local
    ├── .env.example        # ✅ Plantilla sin credenciales
    └── .gitignore          # ✅ Incluye .env.local
```

---

## ⚠️ PUNTOS IMPORTANTES

### **🔒 SEGURIDAD:**
1. **NUNCA** subir archivos .env a Git
2. **SIEMPRE** usar .env.example como plantilla
3. **ROTAR** credenciales periódicamente
4. **VERIFICAR** que .gitignore está actualizado

### **🎯 CONFIGURACIÓN POR AMBIENTE:**
- **Desarrollo:** `Backend/.env`
- **Producción:** Variables en Vercel Dashboard
- **Plantilla:** `Backend/.env.example`

---

## 🚨 ERRORES COMUNES A EVITAR

### ❌ **NO HACER:**
- No crear archivos .env en la raíz del proyecto
- No poner credenciales reales en .env.example
- No commitear archivos .env al repositorio
- No usar NODE_ENV=production en desarrollo

### ✅ **SÍ HACER:**
- Mantener solo Backend/.env para desarrollo
- Usar variables de entorno en Vercel para producción
- Actualizar .gitignore correctamente
- Probar después de cada cambio

---

## 🔧 SOLUCIÓN DE PROBLEMAS

### **Si la aplicación no funciona:**
1. Verificar que todas las variables están en Backend/.env
2. Comprobar que no hay espacios extra en las variables
3. Reiniciar el servidor de desarrollo
4. Verificar la consola del navegador por errores

### **Si hay errores de deployment:**
1. Verificar que todas las variables están en Vercel
2. Comprobar que NEXTAUTH_URL apunta a tu dominio de producción
3. Verificar que NODE_ENV=production en Vercel

---

## 📞 RESUMEN DE ACCIONES

### **LO QUE TIENES QUE HACER:**

1. **ELIMINAR** 2 archivos:
   - `.env` (raíz del proyecto)
   - `Backend/.env.production`

2. **EDITAR** 3 archivos:
   - `Backend/.env` (copiar contenido del PASO 2)
   - `Backend/.env.example` (copiar contenido del PASO 3)
   - `Backend/.gitignore` (agregar líneas del PASO 4)

3. **CONFIGURAR** variables en Vercel Dashboard (PASO 5)

4. **PROBAR** que todo funciona correctamente

---

## 🎉 BENEFICIOS DESPUÉS DE LA CORRECCIÓN

### **✅ MEJORAS OBTENIDAS:**
- **Eliminación de duplicación** - Solo archivos necesarios
- **Configuración consistente** - Variables coherentes
- **Seguridad mejorada** - Credenciales protegidas
- **Mantenimiento simplificado** - Menos archivos que mantener
- **Mejores prácticas** - Siguiendo estándares de la industria

---

*Guía creada por BlackBox AI - 9 de Enero 2025*

**🔒 CONFIGURACIÓN SEGURA Y OPTIMIZADA LISTA PARA IMPLEMENTAR 🔒**
