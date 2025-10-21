# 🧪 Guía de Pruebas - Sistema de Notificaciones

## 📋 Checklist de Configuración

Antes de probar, verifica que hayas completado:

### En Vercel Dashboard (Settings → Environment Variables):

- [ ] `EMAIL_HOST` = `smtp.sendgrid.net`
- [ ] `EMAIL_PORT` = `587`
- [ ] `EMAIL_USER` = `apikey`
- [ ] `EMAIL_PASSWORD` = Tu API Key de SendGrid
- [ ] `EMAIL_FROM` = `noreply@misionesarrienda.com.ar`
- [ ] `EMAIL_SECURE` = `false`
- [ ] Redesplegar después de agregar variables

### En SendGrid Dashboard:

- [ ] Verificar el email remitente en Settings → Sender Authentication

---

## 🧪 Prueba 1: Configuración de SendGrid

**Comando:**
```bash
curl -X POST https://www.misionesarrienda.com.ar/api/test/send-email \
  -H "Content-Type: application/json" \
  -d '{"email": "tu-email@gmail.com"}'
```

**Resultado esperado:**
- ✅ Status 200
- ✅ Email recibido
- ✅ No está en SPAM

---

## 🧪 Prueba 2: NotificationDropdown en Navbar

1. Abre https://www.misionesarrienda.com.ar
2. Inicia sesión
3. Verifica que aparece:
   - 🔔 Campana de notificaciones
   - ❤️ Favoritos
   - 💬 Mensajes
   - 👤 Avatar

---

## 🧪 Prueba 3: Notificación Manual (Supabase)

1. Ve a Supabase → `notifications` table
2. Insert row con:
   - `user_id`: Tu ID
   - `type`: `NEW_MESSAGE`
   - `title`: `Test Notificación`
   - `message`: `Esta es una prueba`
   - `channels`: `["in_app"]`
   - `read`: `false`
3. Recarga la app
4. Verifica badge rojo en campana

---

## 🧪 Prueba 4: Notificación Automática

1. Publica una propiedad
2. Desde modo incógnito, envía una consulta
3. Verifica:
   - Notificación in-app
   - Email recibido

---

## 🔍 Debugging

**No recibo emails:**
- Revisar SendGrid Activity
- Revisar tabla `email_logs` en Supabase
- Verificar carpeta SPAM

**No aparece campana:**
- Hard refresh (Ctrl+Shift+R)
- DevTools → Console (buscar errores)
- Verificar deployment actualizado
