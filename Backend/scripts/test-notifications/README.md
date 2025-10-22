# 🧪 Scripts de Testing - Sistema de Notificaciones

Esta carpeta contiene scripts completos para probar el sistema de notificaciones de **Misiones Arrienda**.

> **🚀 ¿Primera vez?** Lee primero [QUICK-START.md](./QUICK-START.md) para empezar rápido.

---

## 📋 Contenido

### 1️⃣ `test-trigger.ts` - Disparar Notificaciones Manualmente

**Propósito:** Envía notificaciones de prueba para cada uno de los 14 tipos implementados.

**Uso básico:**
```bash
npx tsx scripts/test-notifications/test-trigger.ts
```

**Qué hace:**
- Envía una notificación de prueba para cada tipo
- Usa datos ficticios pero realistas
- Muestra logs en consola de cada notificación enviada
- Útil para verificar que el sistema de notificaciones funciona

**Salida esperada:**
```
🚀 INICIANDO PRUEBAS DE NOTIFICACIONES
=========================================
⚠️  USER_ID de prueba: test-user-id

📧 Probando WELCOME...
✅ WELCOME enviado

📧 Probando EMAIL_VERIFIED...
✅ EMAIL_VERIFIED enviado

...

✅ TODAS LAS PRUEBAS COMPLETADAS
```

**⚠️ IMPORTANTE:**
- Debes cambiar `TEST_USER_ID`, `TEST_PROPERTY_ID` y `TEST_CONVERSATION_ID` por IDs reales de tu base de datos
- Las notificaciones se guardarán en la tabla `notifications` de Supabase
- Los emails se enviarán si tienes SendGrid/Nodemailer configurado

---

### 2️⃣ `generate-email-previews.ts` - Visualizar Templates de Email

**Propósito:** Genera archivos HTML estáticos con todos los templates de email para visualización en navegador.

**Uso:**
```bash
npx tsx scripts/test-notifications/generate-email-previews.ts
```

**Qué hace:**
- Genera 15 archivos HTML (uno por cada variación de template)
- Crea un `index.html` con navegación a todos los templates
- Los archivos se guardan en `scripts/test-notifications/email-previews/`
- No requiere enviar emails reales

**Salida esperada:**
```
🎨 GENERANDO PREVISUALIZACIONES DE EMAIL TEMPLATES
==================================================

✅ Generado: 01-welcome-inmobiliaria.html
✅ Generado: 02-welcome-dueno-directo.html
✅ Generado: 03-welcome-inquilino.html
...
✅ Generado: index.html (índice principal)

✨ Todos los templates generados en: .../email-previews
🌐 Abre index.html en tu navegador para ver todos los templates
```

**Templates generados:**
1. `01-welcome-inmobiliaria.html` - Bienvenida para inmobiliarias
2. `02-welcome-dueno-directo.html` - Bienvenida para dueños directos
3. `03-welcome-inquilino.html` - Bienvenida para inquilinos
4. `04-new-message.html` - Nuevo mensaje inicial
5. `05-message-reply.html` - Respuesta a mensaje
6. `06-inquiry-received.html` - Consulta recibida sobre propiedad
7. `07-property-published.html` - Propiedad publicada
8. `08-property-sold.html` - Propiedad vendida
9. `09-like-received.html` - Like en publicación de comunidad
10. `10-payment-feature.html` - Pago para destacar propiedad
11. `11-payment-subscription.html` - Pago de suscripción
12. `12-property-expiring.html` - Propiedad por expirar
13. `13-new-property-in-area.html` - Nueva propiedad en área de interés
14. `14-plan-expiring.html` - Plan por expirar
15. `15-plan-expired.html` - Plan expirado

**Visualización:**
Abre el archivo `email-previews/index.html` en tu navegador para ver una galería interactiva con todos los templates.

---

### 3️⃣ `test-cron-jobs.ts` - Probar Cron Jobs Manualmente

**Propósito:** Ejecuta los endpoints de cron jobs manualmente sin esperar a la ejecución programada.

**Uso:**

**Probar todos los cron jobs:**
```bash
npx tsx scripts/test-notifications/test-cron-jobs.ts
```

**Probar un cron job específico:**
```bash
npx tsx scripts/test-notifications/test-cron-jobs.ts "check expired plans"
```

**Qué hace:**
- Llama a cada endpoint de cron job con autenticación
- Muestra la respuesta, tiempo de ejecución y status
- Verifica que los cron jobs estén funcionando correctamente
- Útil para debugging sin esperar al schedule

**Cron Jobs probados:**

| Nombre | Endpoint | Schedule | Descripción |
|--------|----------|----------|-------------|
| **Presence Cleanup** | `/api/presence/cleanup` | Cada 5 min | Limpia estados de presencia antiguos |
| **Check Expired Plans** | `/api/cron/check-expired-plans` | 1:00 AM | Desactiva planes expirados y notifica |
| **Properties Expire Cleanup** | `/api/properties/expire-cleanup` | 2:00 AM | Desactiva propiedades expiradas |
| **Notify Expiring Properties** | `/api/cron/notify-expiring-properties` | 8:00 AM | Notifica propiedades que expiran en 7 días |
| **Check Expiring Plans** | `/api/cron/check-expiring-plans` | 9:00 AM | Notifica planes que expiran en 7/3/1 días |

**Salida esperada:**
```
🚀 INICIANDO PRUEBAS DE CRON JOBS
============================================================
🌐 Backend URL: http://localhost:3000
🔐 CRON_SECRET: ***3456

============================================================
🔄 Probando: Check Expired Plans
📅 Schedule: 0 1 * * * (diario a las 1:00 AM)
📝 Descripción: Detecta y desactiva planes expirados
============================================================

📡 Llamando a: http://localhost:3000/api/cron/check-expired-plans
⏱️  Tiempo de respuesta: 1234ms
📊 Status: 200 OK
📦 Respuesta:
{
  "success": true,
  "message": "Checked 5 expired plans, expired 2, sent 2 notifications",
  "checked": 5,
  "expired": 2,
  "notified": 2
}

✅ Check Expired Plans ejecutado exitosamente
   📋 Revisados: 5
   ⏰ Expirados: 2
   📧 Notificados: 2
```

**⚠️ IMPORTANTE:**
- Requiere que la app esté corriendo (`npm run dev` o en producción)
- Debes configurar `CRON_SECRET` en tu `.env`
- Los cron jobs modifican la base de datos (desactivan planes/propiedades)

---

### 4️⃣ `generate-test-data-simple.ts` - Crear Notificaciones de Prueba

**Propósito:** Crea notificaciones de prueba usando usuarios y propiedades existentes en tu base de datos.

**Uso:**
```bash
npx tsx scripts/test-notifications/generate-test-data-simple.ts
```

**Qué hace:**
- Busca un usuario existente en tu base de datos (NO crea usuarios nuevos)
- Crea 1-2 notificaciones de prueba para ese usuario
- Si encuentra propiedades, crea notificación relacionada con propiedad
- Script simple y rápido para verificar que el sistema funciona

**Requisitos:**
- Al menos UN usuario existente en tu base de datos
- (Opcional) Propiedades publicadas para más notificaciones

**Salida esperada:**
```
🚀 GENERANDO NOTIFICACIÓN DE PRUEBA
============================================================

1️⃣ Buscando usuario existente en la base de datos...
✅ Usuario encontrado: usuario@example.com (cm123abc...)

2️⃣ Creando notificación de prueba...
✅ Notificación creada: cm456def...

3️⃣ Buscando propiedad existente...
✅ Propiedad encontrada: Casa en Centro en Posadas
✅ Notificación de propiedad creada

============================================================
✅ NOTIFICACIONES DE PRUEBA CREADAS
============================================================

👤 Usuario: Juan Pérez (usuario@example.com)
📧 Notificaciones creadas: 1-2

🔍 Verificar en Supabase:
   SELECT * FROM notifications WHERE user_id = 'cm123abc...' ORDER BY created_at DESC;

============================================================
✅ DATOS DE PRUEBA GENERADOS EXITOSAMENTE
============================================================
```

**⚠️ IMPORTANTE:**
- Necesitas al menos UN usuario registrado en tu base de datos
- Si no tienes usuarios, regístrate primero en la app: `http://localhost:3000/auth/register`
- El script NO crea usuarios, solo crea notificaciones para usuarios existentes

---

## 🚀 Flujo de Testing Recomendado

### **Opción 1: Testing Rápido (Sin Base de Datos)**

```bash
# 1. Generar previsualizaciones de emails
npx tsx scripts/test-notifications/generate-email-previews.ts

# 2. Abrir index.html en el navegador
# Ver todos los templates sin enviar emails reales
```

**Ventaja:** Rápido, no requiere base de datos ni envío de emails.

---

### **Opción 2: Testing Completo (Con Base de Datos)**

```bash
# 1. Registra un usuario en la app (si no lo has hecho)
# http://localhost:3000/auth/register

# 2. Generar notificaciones de prueba
npx tsx scripts/test-notifications/generate-test-data-simple.ts

# 3. Ejecutar cron jobs manualmente (opcional)
npx tsx scripts/test-notifications/test-cron-jobs.ts

# 4. Verificar notificaciones en Supabase
# SELECT * FROM notifications ORDER BY created_at DESC LIMIT 20;

# 5. Verificar en la app
# Inicia sesión y ve a la sección de notificaciones
```

**Ventaja:** Prueba el flujo completo end-to-end con datos reales.

---

### **Opción 3: Testing de Notificaciones Individuales**

```bash
# 1. Modificar test-trigger.ts con IDs reales
# Cambiar TEST_USER_ID, TEST_PROPERTY_ID, etc.

# 2. Ejecutar el script
npx tsx scripts/test-notifications/test-trigger.ts

# 3. Verificar en Supabase y email
```

**Ventaja:** Prueba notificaciones específicas con control total.

---

## ⚙️ Configuración Requerida

### Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto con:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...

# Email (SendGrid o Nodemailer)
SENDGRID_API_KEY=SG.xxx...
EMAIL_FROM=noreply@misionesarrienda.com

# O para Nodemailer:
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu-email@gmail.com
SMTP_PASS=tu-password

# Cron Jobs
CRON_SECRET=tu-secreto-super-seguro

# App
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

---

## 📊 Verificación de Resultados

### 1. Verificar Notificaciones en Supabase

```sql
-- Ver últimas notificaciones creadas
SELECT
  id,
  user_id,
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

### 2. Verificar Emails Enviados

- **SendGrid:** Revisa el dashboard de SendGrid → Activity
- **Gmail/Outlook:** Revisa tu bandeja de entrada
- **Logs:** Revisa los logs de la consola del servidor

### 3. Verificar Cambios en Base de Datos

```sql
-- Ver planes que fueron cambiados a 'free'
SELECT id, email, name, current_plan, plan_end_date
FROM users
WHERE current_plan = 'free' AND plan_end_date IS NULL
ORDER BY updated_at DESC;

-- Ver propiedades desactivadas
SELECT id, title, status, is_active, expires_at
FROM properties
WHERE is_active = false AND expires_at < NOW()
ORDER BY updated_at DESC;
```

---

## 🐛 Troubleshooting

### Error: "SUPABASE_URL y SUPABASE_ANON_KEY deben estar configurados"

**Solución:** Verifica que tu archivo `.env` contenga las variables correctas y que esté en la raíz del proyecto.

---

### Error: "Unauthorized" al ejecutar cron jobs

**Solución:** Verifica que `CRON_SECRET` en tu `.env` coincida con el configurado en Vercel (o el que espera tu API).

---

### No se envían emails

**Solución:**
1. Verifica que `SENDGRID_API_KEY` o configuración SMTP esté correcta
2. Revisa los logs de la consola para ver errores de envío
3. Verifica que el email "from" esté verificado en SendGrid
4. Las notificaciones in-app se guardan siempre, solo los emails pueden fallar

---

### Error: "Cannot find module '@/lib/utils'"

**Solución:** Asegúrate de ejecutar los scripts desde la raíz del proyecto Backend:
```bash
cd Backend
npx tsx scripts/test-notifications/nombre-script.ts
```

---

### Los cron jobs no detectan datos expirados

**Solución:**
1. Ejecuta `generate-test-data.ts` para crear datos de prueba
2. Verifica las fechas en Supabase (plan_end_date, expires_at)
3. Los cron jobs usan comparaciones estrictas de fechas

---

## 📝 Notas Importantes

1. **Emails de Prueba:** Los datos generados usan el dominio `@misionesarrienda.test` para evitar enviar emails a usuarios reales.

2. **Limpieza:** El script `generate-test-data.ts` limpia automáticamente datos anteriores con email `@misionesarrienda.test`.

3. **IDs CUID:** Todos los IDs usan formato CUID (ej: `cmgz696nd0001qsmvy411e3xz`), no UUID.

4. **Snake_case vs camelCase:** La base de datos usa `snake_case` (user_id, created_at) pero TypeScript usa `camelCase`.

5. **Notificaciones Async:** Las notificaciones se envían de forma asíncrona (non-blocking) para no afectar la performance de la app.

---

## 🎯 Checklist de Testing

Usa este checklist para verificar que todo funciona:

- [ ] Generar previsualizaciones de email y verificar diseño
- [ ] Crear datos de prueba en Supabase
- [ ] Ejecutar cron job "Check Expired Plans"
- [ ] Verificar que se crearon notificaciones PLAN_EXPIRED
- [ ] Verificar que usuarios con planes expirados cambiaron a 'free'
- [ ] Ejecutar cron job "Notify Expiring Properties"
- [ ] Verificar notificaciones PROPERTY_EXPIRING
- [ ] Ejecutar cron job "Properties Expire Cleanup"
- [ ] Verificar que propiedades expiradas se desactivaron
- [ ] Ejecutar test-trigger.ts con IDs reales
- [ ] Verificar notificaciones en la tabla de Supabase
- [ ] Verificar emails recibidos (si está configurado)
- [ ] Crear nueva propiedad en Posadas
- [ ] Verificar notificación NEW_PROPERTY_IN_AREA
- [ ] Dar like a publicación de comunidad
- [ ] Verificar notificación LIKE_RECEIVED

---

## 📚 Referencias

- [Documentación completa del sistema de notificaciones](../../docs/NOTIFICACIONES-RESUMEN.md)
- [Email templates](../../src/lib/email-templates.ts)
- [Notification service](../../src/lib/notification-service.ts)
- [Vercel Cron Configuration](../../vercel.json)

---

## 🤝 Soporte

Si encuentras problemas:
1. Revisa los logs de la consola
2. Verifica las variables de entorno
3. Revisa la tabla `notifications` en Supabase
4. Consulta la documentación completa en `docs/NOTIFICACIONES-RESUMEN.md`

---

**Última actualización:** 22 de octubre de 2025
**Versión:** 1.0.0
