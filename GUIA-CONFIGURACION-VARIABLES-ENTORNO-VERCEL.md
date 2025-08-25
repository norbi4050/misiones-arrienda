# 🔧 Guía Completa: Configurar Variables de Entorno en Vercel

## 📋 Variables Necesarias para Misiones Arrienda

### 1. 🗄️ DATABASE_URL (PostgreSQL para Producción)

#### Opción A: Supabase (Recomendado - GRATIS)
1. **Crear cuenta en Supabase**:
   - Ir a [supabase.com](https://supabase.com)
   - Crear cuenta gratuita
   - Crear nuevo proyecto

2. 

#### Opción B: Neon (Alternativa GRATIS)
1. **Crear cuenta en Neon**:
   - Ir a [neon.tech](https://neon.tech)
   - Crear proyecto gratuito
   - Copiar connection string

#### Opción C: Railway (Alternativa)
1. **Crear cuenta en Railway**:
   - Ir a [railway.app](https://railway.app)
   - Crear PostgreSQL database
   - Copiar DATABASE_URL

### 2. 🔐 JWT_SECRET

#### Generar JWT Secret Seguro:
```bash
# Opción 1: Usar Node.js
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Opción 2: Usar OpenSSL
openssl rand -hex 64

# Opción 3: Online (usar solo para desarrollo)
# Ir a: https://generate-secret.vercel.app/64
```

**Ejemplo de JWT_SECRET**:
```
a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456789012345678901234567890abcdef
```

### 3. 💳 MERCADOPAGO_ACCESS_TOKEN

#### Obtener Token de MercadoPago:
1. **Crear cuenta MercadoPago**:
   - Ir a [mercadopago.com.ar](https://mercadopago.com.ar)
   - Crear cuenta de vendedor

2. **Obtener credenciales**:
   - Ir a **Tu cuenta** → **Credenciales**
   - **Para desarrollo**: Usar **Test credentials**
   - **Para producción**: Usar **Production credentials**

3. **Copiar Access Token**:
   - **Test**: `TEST-1234567890-123456-abcdef123456789012345678-123456789`
   - **Prod**: `APP_USR-1234567890-123456-abcdef123456789012345678-123456789`

### 4. 📧 EMAIL_USER y EMAIL_PASS

#### Configurar Gmail para la aplicación:
1. **Habilitar 2FA en Gmail**:
   - Ir a **Cuenta de Google** → **Seguridad**
   - Activar **Verificación en 2 pasos**

2. **Generar contraseña de aplicación**:
   - En **Seguridad** → **Contraseñas de aplicaciones**
   - Seleccionar **Correo** y **Otro**
   - Nombrar: "Misiones Arrienda"
   - Copiar la contraseña generada (16 caracteres)

3. **Variables resultantes**:
   - **EMAIL_USER**: `tu-email@gmail.com`
   - **EMAIL_PASS**: `abcd efgh ijkl mnop` (contraseña de aplicación)

## 🌐 Configurar en Vercel

### Paso 1: Acceder a Configuración
1. Ir a [vercel.com](https://vercel.com)
2. Seleccionar tu proyecto **Misiones-arrienda**
3. Ir a **Settings** → **Environment Variables**

### Paso 2: Agregar Variables Una por Una

#### DATABASE_URL
- **Name**: `DATABASE_URL`
- **Value**: `postgresql://postgres:password@host:5432/database`
- **Environment**: Seleccionar **Production**, **Preview**, **Development**
- Click **Save**

#### JWT_SECRET
- **Name**: `JWT_SECRET`
- **Value**: `tu-jwt-secret-generado-de-64-caracteres`
- **Environment**: Seleccionar **Production**, **Preview**, **Development**
- Click **Save**

#### MERCADOPAGO_ACCESS_TOKEN
- **Name**: `MERCADOPAGO_ACCESS_TOKEN`
- **Value**: `TEST-1234567890-123456-abcdef123456789012345678-123456789`
- **Environment**: Seleccionar **Production**, **Preview**, **Development**
- Click **Save**

#### EMAIL_USER
- **Name**: `EMAIL_USER`
- **Value**: `tu-email@gmail.com`
- **Environment**: Seleccionar **Production**, **Preview**, **Development**
- Click **Save**

#### EMAIL_PASS
- **Name**: `EMAIL_PASS`
- **Value**: `abcd efgh ijkl mnop`
- **Environment**: Seleccionar **Production**, **Preview**, **Development**
- Click **Save**

## 📝 Ejemplo Completo de Variables

```env
# Base de datos PostgreSQL
DATABASE_URL=postgresql://postgres:mi_password@db.abc123.supabase.co:5432/postgres

# JWT para autenticación
JWT_SECRET=a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456789012345678901234567890abcdef

# MercadoPago (TEST para desarrollo)
MERCADOPAGO_ACCESS_TOKEN=TEST-1234567890-123456-abcdef123456789012345678-123456789

# Email para verificaciones
EMAIL_USER=misiones.arrienda@gmail.com
EMAIL_PASS=abcd efgh ijkl mnop
```

## 🔄 Después de Configurar Variables

### 1. Redeploy Automático
- Vercel automáticamente redesplegará tu aplicación
- Las nuevas variables estarán disponibles

### 2. Verificar Deployment
- Ir a **Deployments** en Vercel
- Verificar que el último deployment sea exitoso
- Revisar logs si hay errores

### 3. Probar Funcionalidades
- **Base de datos**: Verificar que las propiedades se carguen
- **Autenticación**: Probar registro y login
- **Email**: Verificar envío de emails de verificación
- **Pagos**: Probar flujo de MercadoPago (en modo test)

## 🚨 Seguridad y Mejores Prácticas

### ✅ Hacer:
- **Usar contraseñas de aplicación** para Gmail
- **JWT_SECRET de 64+ caracteres** aleatorios
- **Diferentes credenciales** para desarrollo y producción
- **Revisar logs** regularmente

### ❌ No hacer:
- **No compartir** las variables de entorno
- **No usar** credenciales de producción en desarrollo
- **No hardcodear** secrets en el código
- **No usar** passwords personales

## 🔧 Solución de Problemas

### Error de Base de Datos:
```
Error: P1001: Can't reach database server
```
**Solución**: Verificar que DATABASE_URL sea correcta y la base de datos esté activa.

### Error de JWT:
```
Error: JWT secret not found
```
**Solución**: Verificar que JWT_SECRET esté configurado en Vercel.

### Error de Email:
```
Error: Invalid login
```
**Solución**: Verificar que uses contraseña de aplicación, no tu password personal.

### Error de MercadoPago:
```
Error: Invalid access token
```
**Solución**: Verificar que el token sea válido y corresponda al ambiente (TEST/PROD).

## 🎯 Verificación Final

Una vez configuradas todas las variables:

1. **Ir a tu aplicación desplegada**
2. **Probar registro de usuario** → Debe enviar email de verificación
3. **Probar login** → Debe funcionar con JWT
4. **Ver propiedades** → Deben cargarse desde la base de datos
5. **Probar pagos** → Debe redirigir a MercadoPago

---

**✅ Con estas configuraciones, tu aplicación Misiones Arrienda estará completamente funcional en producción.**
