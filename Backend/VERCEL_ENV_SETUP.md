# Configuración de Variables de Entorno en Vercel

## Paso 1: Acceder a la configuración de Vercel

1. Ve a [Vercel Dashboard](https://vercel.com/dashboard)
2. Selecciona tu proyecto **Misiones Arrienda**
3. Click en **Settings** (pestaña superior)
4. En el menú lateral, click en **Environment Variables**

## Paso 2: Agregar las siguientes variables

Copia y pega cada una de estas variables (hacer click en "Add New"):

### Variables de Email (SendGrid)

**Nombre:** `EMAIL_HOST`
**Valor:** `smtp.sendgrid.net`
**Environment:** Production, Preview, Development (seleccionar las 3)

---

**Nombre:** `EMAIL_PORT`
**Valor:** `587`
**Environment:** Production, Preview, Development

---

**Nombre:** `EMAIL_USER`
**Valor:** `apikey`
**Environment:** Production, Preview, Development

---

**Nombre:** `EMAIL_PASSWORD`
**Valor:** `SG.xxxxxxxxxxxxxxxxxxxx.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
**Environment:** Production, Preview, Development

> ⚠️ **Importante:** Usa tu API Key real de SendGrid (comienza con `SG.`)

---

**Nombre:** `EMAIL_FROM`
**Valor:** `noreply@misionesarrienda.com.ar`
**Environment:** Production, Preview, Development

---

**Nombre:** `EMAIL_SECURE`
**Valor:** `false`
**Environment:** Production, Preview, Development

---

### Variable de Cron Secret

**Nombre:** `CRON_SECRET`
**Valor:** `b0f330eed958edd57f463758692c81db0dd17bc12a0e66e3346d24929a1f130b`
**Environment:** Production, Preview, Development

---

### Variable de Site URL (si no existe)

**Nombre:** `NEXT_PUBLIC_SITE_URL`
**Valor:** `https://www.misionesarrienda.com.ar`
**Environment:** Production, Preview, Development

---

## Paso 3: Redesplegar (importante)

Después de agregar las variables:

1. Ve a la pestaña **Deployments**
2. Click en el deployment más reciente
3. Click en el menú (3 puntos) → **Redeploy**
4. Selecciona **"Use existing Build Cache"** ✅
5. Click **Redeploy**

**O simplemente espera al próximo deployment automático** (cuando hagas push al repo)

---

## Paso 4: Verificar dominio en SendGrid (IMPORTANTE)

Para que los emails no vayan a SPAM:

1. Ve a [SendGrid Dashboard](https://app.sendgrid.com/)
2. **Settings** → **Sender Authentication**
3. Click en **"Verify a Single Sender"**
4. Completa el formulario con:
   - **From Name:** Misiones Arrienda
   - **From Email Address:** noreply@misionesarrienda.com.ar
   - **Reply To:** tu-email@gmail.com (o el que uses)
   - **Address, City, Country:** Tu información
5. Click **Create**
6. **Revisa tu email** y click en el link de verificación

---

## Notas importantes:

- ⚠️ **EMAIL_USER** siempre es literalmente `apikey` (no cambiar)
- ⚠️ **EMAIL_PASSWORD** es tu API Key de SendGrid
- ⚠️ El email `noreply@misionesarrienda.com.ar` DEBE estar verificado en SendGrid
- ⚠️ **CRON_SECRET** protege los endpoints de cron jobs (no compartir)

---

## Probar que funciona:

Una vez configurado y desplegado, puedes probar enviando una notificación desde tu app o ejecutando:

```bash
curl -X POST https://www.misionesarrienda.com.ar/api/test/send-email \
  -H "Content-Type: application/json"
```
