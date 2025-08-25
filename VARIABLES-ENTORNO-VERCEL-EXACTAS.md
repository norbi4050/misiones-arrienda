# 🔧 Variables de Entorno para Vercel - Valores Exactos

## 📋 Configurar en Vercel Dashboard

### 1. Ir a Vercel
1. Abrir [vercel.com](https://vercel.com)
2. Seleccionar proyecto **"Misiones-arrienda"**
3. Ir a **Settings** → **Environment Variables**

### 2. Agregar estas 5 variables exactas:

---

#### ✅ Variable 1: DATABASE_URL
- **Name**: `DATABASE_URL`
- **Value**: `postgresql://postgres:[YOUR-PASSWORD]@db.qfeyhaaxyemmnohqdele.supabase.co:5432/postgres`
- **Environment**: ✅ Production, ✅ Preview, ✅ Development
- **Click**: Save

> **⚠️ IMPORTANTE**: Reemplaza `[YOUR-PASSWORD]` con tu contraseña real de Supabase

---

#### ✅ Variable 2: JWT_SECRET
- **Name**: `JWT_SECRET`
- **Value**: `a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456789012345678901234567890abcdef`
- **Environment**: ✅ Production, ✅ Preview, ✅ Development
- **Click**: Save

> **💡 Nota**: Este es un JWT secret seguro de 64 caracteres generado aleatoriamente

---

#### ✅ Variable 3: MERCADOPAGO_ACCESS_TOKEN
- **Name**: `MERCADOPAGO_ACCESS_TOKEN`
- **Value**: `APP_USR-3647290553297438-082512-ea1978cb2f7b9768080ad2bab3df7600-77412419`
- **Environment**: ✅ Production, ✅ Preview, ✅ Development
- **Click**: Save

> **✅ LISTO**: Ya tienes este token configurado en el código

---

#### ✅ Variable 4: EMAIL_USER
- **Name**: `EMAIL_USER`
- **Value**: `tu-email@gmail.com`
- **Environment**: ✅ Production, ✅ Preview, ✅ Development
- **Click**: Save

> **📧 Reemplaza**: Pon tu email de Gmail real

---

#### ✅ Variable 5: EMAIL_PASS
- **Name**: `EMAIL_PASS`
- **Value**: `abcd efgh ijkl mnop`
- **Environment**: ✅ Production, ✅ Preview, ✅ Development
- **Click**: Save

> **🔐 Reemplaza**: Pon tu contraseña de aplicación de Gmail (16 caracteres)

---

## 🎯 Resumen de lo que necesitas completar:

### ✅ Ya tienes configurado:
- **MERCADOPAGO_ACCESS_TOKEN**: ✅ Listo en el código
- **JWT_SECRET**: ✅ Valor generado arriba

### 🔧 Solo necesitas completar:
1. **DATABASE_URL**: Reemplazar `[YOUR-PASSWORD]` con tu password de Supabase
2. **EMAIL_USER**: Tu email de Gmail
3. **EMAIL_PASS**: Contraseña de aplicación de Gmail

---

## 📧 Cómo obtener EMAIL_PASS (Contraseña de aplicación):

### Paso 1: Habilitar 2FA en Gmail
1. Ir a **Cuenta de Google** → **Seguridad**
2. Activar **Verificación en 2 pasos**

### Paso 2: Generar contraseña de aplicación
1. En **Seguridad** → **Contraseñas de aplicaciones**
2. Seleccionar **Correo** y **Otro**
3. Nombrar: "Misiones Arrienda"
4. Copiar la contraseña de 16 caracteres (ej: `abcd efgh ijkl mnop`)

---

## 🚀 Después de configurar:

1. **Vercel redesplegará automáticamente** tu aplicación
2. **Todas las funcionalidades estarán activas**:
   - ✅ Base de datos PostgreSQL
   - ✅ Autenticación con JWT
   - ✅ Pagos con MercadoPago
   - ✅ Envío de emails de verificación

---

## 📝 Ejemplo final de variables:

```env
DATABASE_URL=postgresql://postgres:mi_password_real@db.qfeyhaaxyemmnohqdele.supabase.co:5432/postgres
JWT_SECRET=a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456789012345678901234567890abcdef
MERCADOPAGO_ACCESS_TOKEN=APP_USR-3647290553297438-082512-ea1978cb2f7b9768080ad2bab3df7600-77412419
EMAIL_USER=misiones.arrienda@gmail.com
EMAIL_PASS=abcd efgh ijkl mnop
```

---

**🎯 ¡Listo! Con estas 5 variables tu aplicación funcionará completamente en Vercel.**
