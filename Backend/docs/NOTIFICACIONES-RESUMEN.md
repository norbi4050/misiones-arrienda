# 📧 Sistema de Notificaciones - Misiones Arrienda

**Estado:** ✅ **COMPLETO Y EN PRODUCCIÓN**
**Fecha:** 22 de Octubre 2025
**Cobertura:** 12/14 notificaciones implementadas (86%)

---

## 📊 Estado del Sistema

### ✅ Notificaciones Activas (12)

| # | Tipo | Trigger | Canales | Template | Ubicación |
|---|------|---------|---------|----------|-----------|
| 1 | **WELCOME** | Registro de usuario | Email + In-App | Profesional | `src/app/api/auth/register/route.ts:512` |
| 2 | **NEW_MESSAGE** | Mensaje inicial | Email + In-App | Profesional | `src/app/api/messages/threads/[id]/messages/route.ts:407` |
| 3 | **MESSAGE_REPLY** | Respuesta a mensaje | Email + In-App | Profesional | `src/app/api/messages/threads/[id]/messages/route.ts:407` |
| 4 | **INQUIRY_RECEIVED** | Consulta sobre propiedad | Email + In-App | Profesional | `src/app/api/inquiries/route.ts:62` |
| 5 | **PROPERTY_STATUS_CHANGED** | Cambio de estado | In-App | Profesional | `src/app/api/properties/[id]/route.ts:167` |
| 6 | **LIKE_RECEIVED** | Like en post comunidad | In-App | Profesional | `src/app/api/comunidad/posts/[id]/like/route.ts:106` |
| 7 | **FAVORITE_PROPERTY_UPDATED** | Publicar favorito | Email + In-App | Genérico | `src/app/api/properties/[id]/publish/route.ts:75` |
| 8 | **PAYMENT_COMPLETED** | Pago aprobado | Email + In-App | Profesional | `src/app/api/payments/webhook/route.ts:242` |
| 9 | **PROPERTY_EXPIRING** | Cron diario 8 AM | Email + In-App | Profesional | `src/app/api/cron/notify-expiring-properties/route.ts` |
| 10 | **PLAN_EXPIRING** | Cron diario 9 AM | Email + In-App | Profesional | `src/app/api/cron/check-expiring-plans/route.ts` |
| 11 | **PLAN_EXPIRED** | Cron diario 1 AM | Email + In-App | Profesional | `src/app/api/cron/check-expired-plans/route.ts` |
| 12 | **SYSTEM_ANNOUNCEMENT** | Manual/Admin | Email + In-App | Genérico | Via API directa |

### ⏳ Notificaciones Pendientes (2)

| # | Tipo | Bloqueador | Prioridad | Esfuerzo |
|---|------|------------|-----------|----------|
| 1 | **NEW_PROPERTY_IN_AREA** | Requiere sistema de zonas de interés | Alta | Alto |
| 2 | **INVOICE_READY** | Requiere sistema de facturación | Media | Medio |

### ❌ Notificaciones No Aplicables (2)

| # | Tipo | Razón |
|---|------|-------|
| 1 | ~~NEW_FOLLOWER~~ | No tiene sentido. Ya existe sistema de LIKES + MATCHES |
| 2 | ~~INQUIRY_REPLY~~ | Se maneja por email directo o sistema de mensajes |

---

## 🎨 Templates HTML Profesionales

**Ubicación:** `src/lib/email-templates.ts`

### Templates Creados (6)

1. **getWelcomeEmailTemplate** - Bienvenida personalizada según tipo de usuario
2. **getNewMessageEmailTemplate** - Mensajes con quote box
3. **getInquiryReceivedEmailTemplate** - Consultas con datos de contacto
4. **getPropertyStatusChangedEmailTemplate** - Cambios de estado
5. **getLikeReceivedEmailTemplate** - Likes en comunidad
6. **getPaymentCompletedEmailTemplate** - Confirmación de pagos

### Características

- ✅ Responsive (mobile-first)
- ✅ Gradientes de marca (#2563eb → #1e40af)
- ✅ Preheader text
- ✅ CTAs destacados
- ✅ Links a redes sociales
- ✅ Links de unsubscribe

---

## ⏰ Cron Jobs (Vercel)

**Configuración:** `vercel.json:157-178`

| Hora | Job | Función | Endpoint |
|------|-----|---------|----------|
| **Every 5 min** | Presence cleanup | Limpia usuarios inactivos | `/api/presence/cleanup` |
| **1:00 AM** | Check expired plans | Desactiva planes expirados | `/api/cron/check-expired-plans` |
| **2:00 AM** | Properties cleanup | Limpia propiedades expiradas | `/api/properties/expire-cleanup` |
| **8:00 AM** | Notify expiring properties | Notifica propiedades (7 días) | `/api/cron/notify-expiring-properties` |
| **9:00 AM** | Check expiring plans | Notifica planes (7, 3, 1 días) | `/api/cron/check-expiring-plans` |

### Seguridad

Todos los cron jobs requieren:
```
Authorization: Bearer <CRON_SECRET>
```

Variable de entorno requerida:
```bash
CRON_SECRET=tu-secret-aqui
```

---

## 🔧 Configuración Requerida

### Variables de Entorno

```bash
# Email (Nodemailer)
EMAIL_USER=your-email@domain.com
EMAIL_PASSWORD=your-password
EMAIL_FROM=noreply@misionesarrienda.com

# O SendGrid (alternativo)
SENDGRID_API_KEY=SG.xxx

# Site
NEXT_PUBLIC_SITE_URL=https://www.misionesarrienda.com.ar

# Cron
CRON_SECRET=your-secret-here

# MercadoPago
MP_ACCESS_TOKEN=TEST-xxx
MP_WEBHOOK_SECRET=your-secret
```

---

## 🧪 Testing

### Trigger Manual de Cron Jobs

```bash
# Desarrollo
curl -H "Authorization: Bearer $CRON_SECRET" \
  http://localhost:3000/api/cron/check-expired-plans

# Producción
curl -H "Authorization: Bearer $CRON_SECRET" \
  https://tu-app.vercel.app/api/cron/check-expired-plans
```

### Testing de Notificaciones

#### 1. WELCOME
```
1. Registrar nuevo usuario
2. Verificar email de bienvenida
3. Verificar notificación in-app
```

#### 2. NEW_MESSAGE / MESSAGE_REPLY
```
1. Enviar primer mensaje → NEW_MESSAGE
2. Responder mensaje → MESSAGE_REPLY
3. Verificar títulos diferentes
```

#### 3. PAYMENT_COMPLETED
```
1. Completar pago en MercadoPago (sandbox)
2. Webhook procesa pago
3. Verificar email con monto
4. Verificar notificación in-app
```

#### 4. Cron Jobs
```sql
-- Crear datos de prueba
UPDATE users
SET current_plan = 'premium',
    plan_end_date = NOW() + INTERVAL '7 days'
WHERE id = 'user-id';

-- Trigger manual del cron
curl -H "Authorization: Bearer $SECRET" URL
```

---

## 📈 Métricas y Monitoreo

### KPIs Recomendados

| Métrica | Objetivo | Cómo medir |
|---------|----------|------------|
| Tasa apertura emails | >40% | SendGrid analytics |
| Tasa click CTAs | >15% | Link tracking |
| Tasa unsubscribe | <5% | DB preferences |
| Errores envío | <1% | Logs tabla email_logs |
| Tiempo lectura | <2 min | User analytics |

### Logs a Revisar

**Vercel Dashboard:**
- Deployments → Functions → Cron logs
- Buscar `[CRON]` en logs
- Buscar `[NotificationService]` en logs

**Base de Datos:**
```sql
-- Notificaciones enviadas hoy
SELECT type, COUNT(*)
FROM notifications
WHERE created_at >= CURRENT_DATE
GROUP BY type;

-- Emails enviados hoy
SELECT status, COUNT(*)
FROM email_logs
WHERE sent_at >= CURRENT_DATE
GROUP BY status;

-- Preferencias de usuarios
SELECT
  COUNT(CASE WHEN email_enabled THEN 1 END) as email_enabled,
  COUNT(CASE WHEN in_app_enabled THEN 1 END) as in_app_enabled
FROM notification_preferences;
```

---

## 🚀 Próximos Pasos (Opcionales)

### Corto Plazo

1. **Monitoreo de emails**
   - Verificar tasa de entrega en producción
   - Revisar si caen en spam
   - Ajustar templates si es necesario

2. **Testing en clientes de email**
   - Gmail (web + app)
   - Outlook (web + app)
   - Apple Mail
   - Verificar renderizado

### Medio Plazo

1. **NEW_PROPERTY_IN_AREA**
   - Crear tabla `user_interested_areas`
   - Guardar preferencias de búsqueda
   - Cron que compare nuevas propiedades con zonas
   - Enviar notificación cuando hay match

2. **INVOICE_READY**
   - Implementar sistema de facturación
   - Generar PDFs con datos fiscales
   - Enviar notificación cuando se genera

### Largo Plazo

1. **Web Push Notifications**
   - Service worker
   - Firebase Cloud Messaging
   - Permisos de usuario

2. **Analytics Dashboard**
   - Panel admin para ver métricas
   - Gráficos de envíos/aperturas
   - Exportar reportes

3. **A/B Testing**
   - Probar diferentes subject lines
   - Optimizar templates
   - Mejorar conversión

---

## 📚 Documentación Técnica

### Estructura de Archivos

```
src/
├── lib/
│   ├── notification-service.ts      # Servicio principal
│   └── email-templates.ts           # Templates HTML
├── app/api/
│   ├── notifications/               # API de notificaciones
│   │   ├── route.ts                 # GET notificaciones
│   │   ├── [id]/read/route.ts       # Marcar como leída
│   │   ├── mark-all-read/route.ts   # Marcar todas
│   │   ├── unread-count/route.ts    # Contador
│   │   └── preferences/route.ts     # Preferencias
│   └── cron/                        # Cron jobs
│       ├── check-expired-plans/
│       ├── check-expiring-plans/
│       └── notify-expiring-properties/
├── app/(main)/notificaciones/
│   ├── page.tsx                     # Página de notificaciones
│   └── preferencias/page.tsx        # Página de preferencias
└── hooks/
    └── useNotifications.ts          # Hook de React
```

### Base de Datos

**Tablas:**
- `notifications` - Notificaciones in-app
- `notification_preferences` - Preferencias por usuario
- `email_logs` - Log de emails enviados

**Índices recomendados:**
```sql
CREATE INDEX idx_notifications_user_read
ON notifications(user_id, read);

CREATE INDEX idx_notifications_created
ON notifications(created_at DESC);

CREATE INDEX idx_email_logs_status
ON email_logs(status, sent_at);
```

---

## 🎯 Resumen Ejecutivo

### Logros

✅ **12 notificaciones activas** (86% de cobertura)
✅ **6 templates HTML profesionales**
✅ **5 cron jobs configurados y funcionando**
✅ **Sistema completo de preferencias**
✅ **Todo deployado en producción**

### Estado

🟢 **SISTEMA FUNCIONAL Y COMPLETO**

El sistema de notificaciones está listo para uso en producción. Las 2 notificaciones pendientes (NEW_PROPERTY_IN_AREA, INVOICE_READY) requieren features adicionales que están fuera del alcance del sistema de notificaciones.

### Mantenimiento

- Revisar logs semanalmente
- Monitorear tasa de entrega de emails
- Ajustar horarios de cron si es necesario
- Actualizar templates según feedback de usuarios

---

**Última actualización:** 22 de Octubre 2025
**Desarrollado con:** [Claude Code](https://claude.com/claude-code)
