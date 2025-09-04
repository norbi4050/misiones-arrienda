# 🔄 GUÍA MIGRACIÓN A RESEND SMTP

## 🎯 OBJETIVO
Migrar de Gmail a Resend para mayor confiabilidad en el envío de emails.

## ✅ VENTAJAS DE RESEND
- Mayor confiabilidad que Gmail
- Mejor deliverability
- APIs más robustas
- Menos problemas de autenticación

## 📋 PASOS DE MIGRACIÓN

### 1. Configurar SMTP en Supabase Dashboard
1. Ir a: https://supabase.com/dashboard/project/qfeyhaaxyemmnohqdele
2. Navegar a: **Authentication > Settings > SMTP Settings**
3. Configurar los siguientes valores:

```
SMTP Host: smtp.resend.com
SMTP Port: 587
SMTP User: resend
SMTP Password: re_ZopLXSBZ_6MdVdspijuQL8A4AB3WABx9o
Enable SMTP: ✅ Activado
```

### 2. Configurar Dominio (Opcional)
- En Resend Dashboard: https://resend.com/domains
- Agregar dominio: misionesarrienda.com.ar
- Configurar registros DNS

### 3. Personalizar Email Templates
- Ir a: **Authentication > Email Templates**
- Actualizar "From" email: noreply@misionesarrienda.com.ar
- Personalizar diseño y contenido

### 4. Testing Completo
1. Crear usuario de prueba
2. Verificar recepción de email
3. Confirmar que links funcionan correctamente

## 🔧 CONFIGURACIÓN AVANZADA
```javascript
// Para uso en código (si es necesario)
const resendConfig = {
  host: 'smtp.resend.com',
  port: 587,
  secure: false,
  auth: {
    user: 'resend',
    pass: 're_ZopLXSBZ_6MdVdspijuQL8A4AB3WABx9o'
  }
};
```

## ✅ VERIFICACIÓN EXITOSA
- Emails enviados desde @misionesarrienda.com.ar
- Mayor tasa de entrega
- Logs detallados en Resend Dashboard
