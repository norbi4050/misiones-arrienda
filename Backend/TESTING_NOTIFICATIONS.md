# 🧪 Guía de Pruebas - Sistema de Notificaciones

## 📋 Checklist de Configuración

Antes de probar, verifica que hayas completado:

### ✅ En Vercel Dashboard (Settings → Environment Variables):

- [x] `EMAIL_HOST` = `smtp.sendgrid.net`
- [x] `EMAIL_PORT` = `587`
- [x] `EMAIL_USER` = `apikey`
- [x] `EMAIL_PASSWORD` = Tu API Key de SendGrid (configurado en Vercel)
- [x] `EMAIL_FROM` = `noreply@misionesarrienda.com.ar`
- [x] `EMAIL_SECURE` = `false`
- [x] Redesplegar después de agregar variables

### 🔄 En SendGrid Dashboard - Domain Authentication:

**Estado:** DNS Records agregados en Vercel (21/10/2025)

**Records agregados:**
1. ✅ CNAME: `em787.www` → `u56871740.wl241.sendgrid.net`
2. ✅ CNAME: `s1._domainkey.www` → `s1.domainkey.u56871740.wl241.sendgrid.net`
3. ✅ CNAME: `s2._domainkey.www` → `s2.domainkey.u56871740.wl241.sendgrid.net`
4. ✅ TXT: `_dmarc.www` → `v=DMARC1; p=none;`

**Próximo paso:**
1. Esperar 5-10 minutos para propagación inicial
2. Ir a SendGrid → Settings → Sender Authentication → Authenticate Your Domain
3. Marcar checkbox "I've added these records"
4. Click en "Verify"
5. Si falla, esperar más tiempo (puede tomar hasta 48 horas)

**Nota:** Mientras tanto, puedes probar notificaciones in-app que ya funcionan correctamente

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

## 🧪 Prueba 2: NotificationDropdown en Navbar ✅ COMPLETADO

**Estado:** ✅ Funcionando en producción

1. Abre https://www.misionesarrienda.com.ar
2. Inicia sesión
3. Verifica que aparece:
   - ✅ 🔔 Campana de notificaciones (con badge "1")
   - ✅ ❤️ Favoritos
   - ✅ 💬 Mensajes
   - ✅ 👤 Avatar

**Resultado:** Las 4 notificaciones de prueba se visualizan correctamente en el dropdown.

---

## 🧪 Prueba 3: Páginas de Notificaciones ✅ COMPLETADO

**Estado:** ✅ Desplegadas en producción

### Página principal: `/notificaciones`
- ✅ Lista completa de notificaciones
- ✅ Filtros: Todas / No leídas
- ✅ Marcar como leída individual
- ✅ Marcar todas como leídas
- ✅ Click para redirigir (si tiene ctaUrl)
- ✅ Formato de tiempo relativo en español

### Página de preferencias: `/notificaciones/preferencias`
- ✅ Configuración de canales (Email, In-App, Push)
- ✅ Preferencias por categoría:
  - Mensajes y Comunicación
  - Propiedades e Inmuebles
  - Actividad Social
  - Pagos y Suscripciones
  - Sistema y Seguridad
  - Marketing y Promociones
- ✅ Guardar cambios con feedback visual
- ✅ Botón sticky en la parte inferior

---

## 🧪 Prueba 4: Notificación Manual (Supabase) ✅ COMPLETADO

**Estado:** ✅ Probado exitosamente

1. Ve a Supabase → `notifications` table
2. Insert row con:
   - `user_id`: Tu ID
   - `type`: `NEW_MESSAGE`
   - `title`: `Test Notificación`
   - `message`: `Esta es una prueba`
   - `channels`: `["in_app"]`
   - `read`: `false`
3. Recarga la app
4. ✅ Badge rojo aparece en campana
5. ✅ Notificación se muestra en dropdown

---

## 🧪 Prueba 5: Notificaciones Automáticas ⏳ PENDIENTE

**Objetivo:** Verificar que las notificaciones se crean automáticamente en los siguientes escenarios:

### 5.1 Consulta de Propiedad
1. Usuario A publica una propiedad
2. Usuario B (o anónimo) envía una consulta
3. **Verificar:**
   - [ ] Usuario A recibe notificación in-app
   - [ ] Usuario A recibe email (cuando DNS esté verificado)
   - [ ] Notificación tiene link a la consulta

### 5.2 Nuevo Mensaje
1. Usuario A y Usuario B tienen conversación
2. Usuario B envía un mensaje
3. **Verificar:**
   - [ ] Usuario A recibe notificación in-app
   - [ ] Usuario A recibe email (cuando DNS esté verificado)
   - [ ] Notificación redirige al chat

### 5.3 Like en Post de Comunidad
1. Usuario A publica en comunidad
2. Usuario B da like
3. **Verificar:**
   - [ ] Usuario A recibe notificación in-app
   - [ ] Usuario A recibe email (cuando DNS esté verificado)
   - [ ] Notificación redirige al post

### 5.4 Nuevo Seguidor
1. Usuario B sigue a Usuario A
2. **Verificar:**
   - [ ] Usuario A recibe notificación in-app
   - [ ] Notificación muestra perfil de Usuario B

### 5.5 Respuesta a Consulta
1. Usuario A envía consulta sobre propiedad
2. Propietario responde
3. **Verificar:**
   - [ ] Usuario A recibe notificación in-app
   - [ ] Usuario A recibe email
   - [ ] Notificación redirige a la respuesta

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
