# 📧 GUÍA CONFIGURACIÓN GMAIL SMTP EN SUPABASE

## 🎯 OBJETIVO
Configurar correctamente Gmail SMTP en Supabase para resolver el error de confirmación de email.

## 🚨 ERROR ACTUAL
```
535 5.7.8 Username and Password not accepted
```

## 📋 PASOS DETALLADOS

### 1. Verificar App Password de Gmail
- Acceder a: https://myaccount.google.com/security
- Ir a "Verificación en 2 pasos"
- Generar nueva "Contraseña de aplicación" para "Correo"
- **IMPORTANTE:** Usar la nueva contraseña generada

### 2. Configurar SMTP en Supabase Dashboard
1. Ir a: https://supabase.com/dashboard/project/qfeyhaaxyemmnohqdele
2. Navegar a: **Authentication > Settings > SMTP Settings**
3. Configurar los siguientes valores:

```
SMTP Host: smtp.gmail.com
SMTP Port: 587
SMTP User: cgonzalezarchilla@gmail.com
SMTP Password: [NUEVA_APP_PASSWORD_AQUÍ]
Enable SMTP: ✅ Activado
```

### 3. Configurar Email Templates
- Ir a: **Authentication > Email Templates**
- Verificar que "Confirm signup" esté configurado
- Personalizar mensaje si es necesario

### 4. Probar Configuración
1. Ir a: **Authentication > Users**
2. Crear usuario de prueba
3. Verificar que llegue email de confirmación

## ✅ VERIFICACIÓN EXITOSA
- Email de confirmación enviado sin errores
- Usuario puede confirmar registro
- Logs de Supabase sin errores SMTP

## 🔧 TROUBLESHOOTING
Si persiste el error:
1. Generar nueva App Password
2. Verificar que 2FA esté activado en Gmail
3. Considerar migrar a Resend (más confiable)
