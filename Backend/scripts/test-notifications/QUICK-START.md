# 🚀 Quick Start - Testing de Notificaciones

Guía rápida para probar el sistema de notificaciones de **Misiones Arrienda**.

---

## ✅ Lo Que Ya Funciona

El sistema de notificaciones está **100% implementado** con:

- ✅ **14 tipos de notificaciones** funcionando
- ✅ **7 templates profesionales de email** con diseño responsive
- ✅ **5 cron jobs** configurados en Vercel
- ✅ **Notificaciones in-app + email** en tiempo real

---

## 📧 Paso 1: Ver Templates de Email (Sin DB)

**El más fácil - No requiere base de datos ni backend**

```bash
cd Backend
npx tsx scripts/test-notifications/generate-email-previews.ts
```

Luego abre en tu navegador:
```
Backend/scripts/test-notifications/email-previews/index.html
```

**Qué verás:**
- 15 templates HTML con diseño profesional
- Galería interactiva para navegar todos los templates
- Gradientes azules, botones CTAs, diseño responsive

✅ **YA EJECUTADO** - Los archivos están listos en `email-previews/`

---

## 🧪 Paso 2: Probar Notificaciones (Requiere Usuario)

### Opción A: Crear Usuario desde la App

1. Abre tu app: `http://localhost:3000`
2. Registra un nuevo usuario
3. Al registrarte, automáticamente recibirás:
   - ✅ Notificación **WELCOME** (email + in-app)
   - ✅ Notificación **EMAIL_VERIFIED** (in-app)

### Opción B: Usar Script con Usuario Existente

```bash
cd Backend

# Si ya tienes usuarios en la DB:
npx tsx scripts/test-notifications/generate-test-data-simple.ts
```

Este script:
- Busca un usuario existente en tu DB
- Crea 1-2 notificaciones de prueba
- NO requiere crear datos nuevos

---

## 🎯 Paso 3: Probar Cron Jobs (Opcional)

**Requiere:**
- Backend corriendo (`npm run dev`)
- Variable `CRON_SECRET` en `.env`

```bash
cd Backend

# Probar todos los cron jobs:
npx tsx scripts/test-notifications/test-cron-jobs.ts

# O probar uno específico:
npx tsx scripts/test-notifications/test-cron-jobs.ts "check expired"
```

**Cron jobs disponibles:**
- `Presence Cleanup` - Limpia estados de presencia
- `Check Expired Plans` - Desactiva planes expirados
- `Notify Expiring Properties` - Alerta propiedades que expiran
- `Properties Expire Cleanup` - Desactiva propiedades expiradas
- `Check Expiring Plans` - Alerta planes por expirar

---

## 📊 Paso 4: Verificar Resultados

### En Supabase

Abre tu dashboard de Supabase y ejecuta:

```sql
-- Ver todas las notificaciones
SELECT
  id,
  type,
  title,
  message,
  channels,
  read_at,
  created_at
FROM notifications
ORDER BY created_at DESC
LIMIT 20;
```

### En la App

1. Inicia sesión con tu usuario
2. Ve a la sección de notificaciones
3. Deberías ver las notificaciones de prueba

### En Email

Si tienes SendGrid/Nodemailer configurado:
- Revisa tu bandeja de entrada
- Busca emails de `noreply@misionesarrienda.com`

---

## 🐛 Solución de Problemas

### "No se encontraron usuarios en la base de datos"

**Solución:** Registra un usuario desde la app primero:
```
http://localhost:3000/auth/register
```

---

### "Cannot find module"

**Solución:** Asegúrate de estar en la carpeta `Backend`:
```bash
cd Backend  # No Blackbox!
npx tsx scripts/test-notifications/...
```

---

### "SUPABASE_URL must be configured"

**Solución:** Verifica que tu `.env` contenga:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
```

---

### Los emails no se envían

**Es normal si no tienes configurado:**
- `SENDGRID_API_KEY` (para SendGrid)
- O `SMTP_*` (para Nodemailer)

Las notificaciones **in-app siempre se guardan** aunque los emails fallen.

---

## 🎨 ¿Qué Probar?

### 1. Ver Diseño de Emails ✅
**Ya hecho** - Abre `email-previews/index.html`

### 2. Registrarse en la App
- Notificación **WELCOME** enviada automáticamente
- Notificación **EMAIL_VERIFIED** enviada

### 3. Publicar una Propiedad
- Notificación **PROPERTY_STATUS_CHANGED** cuando publiques
- Otros usuarios reciben **NEW_PROPERTY_IN_AREA** si buscaron en esa ciudad

### 4. Enviar un Mensaje
- Destinatario recibe **NEW_MESSAGE**
- Si responde, recibes **MESSAGE_REPLY**

### 5. Hacer una Consulta sobre Propiedad
- Dueño recibe **INQUIRY_RECEIVED** (email + in-app)

### 6. Dar Like a Publicación de Comunidad
- Autor recibe **LIKE_RECEIVED**

### 7. Pagar para Destacar Propiedad
- Recibes **PAYMENT_COMPLETED** con detalles del pago

---

## 📚 Más Info

- **Documentación completa:** `README.md` en esta carpeta
- **Sistema de notificaciones:** `docs/NOTIFICACIONES-RESUMEN.md`
- **Email templates:** `src/lib/email-templates.ts`

---

## ✨ Resumen

| Script | Requiere | Tiempo | Recomendado |
|--------|----------|--------|-------------|
| `generate-email-previews.ts` | ❌ Nada | 5 seg | ⭐⭐⭐⭐⭐ |
| `generate-test-data-simple.ts` | ✅ Usuario en DB | 10 seg | ⭐⭐⭐⭐ |
| `test-cron-jobs.ts` | ✅ Backend corriendo | 30 seg | ⭐⭐⭐ |
| `test-trigger.ts` | ✅ IDs en código | 20 seg | ⭐⭐ |

**Recomendación:** Empieza por `generate-email-previews.ts` para ver los diseños sin necesidad de configurar nada.

---

**Última actualización:** 22 de octubre de 2025
**Versión:** 1.0.0
