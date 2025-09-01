# 🔧 VARIABLES DE ENTORNO PARA VERCEL - MISIONES ARRIENDA

## **VARIABLES OBLIGATORIAS PARA VERCEL**

### **🔐 SUPABASE (Base de Datos y Autenticación)**
```
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### **💳 MERCADOPAGO (Pagos)**
```
MERCADOPAGO_ENVIRONMENT=sandbox
MERCADOPAGO_SANDBOX_ACCESS_TOKEN=TEST-1234567890-123456-abcdef...
MERCADOPAGO_SANDBOX_PUBLIC_KEY=TEST-abcdef12-3456-7890-abcd-ef1234567890
MERCADOPAGO_CLIENT_ID=1234567890123456
MERCADOPAGO_CLIENT_SECRET=abcdefghijklmnopqrstuvwxyz123456
MERCADOPAGO_WEBHOOK_SECRET=tu_webhook_secret_aqui
```

### **🌐 APLICACIÓN**
```
NEXT_PUBLIC_BASE_URL=https://tu-app.vercel.app
NODE_ENV=production
```

### **🔑 SEGURIDAD**
```
JWT_SECRET=tu_jwt_secret_super_seguro_aqui_minimo_32_caracteres
```

### **📧 EMAIL (Opcional - para notificaciones)**
```
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=tu-email@gmail.com
EMAIL_PASS=tu_password_de_aplicacion
EMAIL_FROM=noreply@misionesarrienda.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu-email@gmail.com
SMTP_PASS=tu_password_de_aplicacion
SMTP_FROM=noreply@misionesarrienda.com
```

### **📊 ANALYTICS (Opcional)**
```
RESEND_API_KEY=re_tu_api_key_aqui
```

---

## **📋 CHECKLIST DE CONFIGURACIÓN**

### **✅ PASO 1: Supabase**
1. Ve a [supabase.com](https://supabase.com)
2. Crea un proyecto nuevo
3. Ve a Settings > API
4. Copia `URL` y `anon public key`
5. Ve a Settings > API > Service Role Key
6. Copia el `service_role key`

### **✅ PASO 2: MercadoPago**
1. Ve a [developers.mercadopago.com](https://developers.mercadopago.com)
2. Crea una aplicación
3. Ve a Credenciales > Sandbox
4. Copia `Access Token` y `Public Key`
5. Configura webhook URL: `https://tu-app.vercel.app/api/payments/webhook`

### **✅ PASO 3: Vercel**
1. Ve a tu proyecto en Vercel
2. Settings > Environment Variables
3. Agrega todas las variables una por una
4. Redeploy el proyecto

---

## **🚨 VARIABLES CRÍTICAS (NO PUEDEN FALTAR)**

```bash
# ESTAS 5 VARIABLES SON OBLIGATORIAS:
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_BASE_URL
JWT_SECRET
```

---

## **🔧 CONFIGURACIÓN RÁPIDA EN VERCEL**

### **Método 1: Por la interfaz web**
1. Ve a tu proyecto en Vercel
2. Settings > Environment Variables
3. Add New > Name: `NEXT_PUBLIC_SUPABASE_URL` Value: `tu_valor`
4. Repite para cada variable

### **Método 2: Por CLI (más rápido)**
```bash
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add NEXT_PUBLIC_BASE_URL
vercel env add JWT_SECRET
```

---

## **⚠️ NOTAS IMPORTANTES**

1. **NEXT_PUBLIC_BASE_URL**: Debe ser la URL de tu app en Vercel (ej: `https://misiones-arrienda.vercel.app`)

2. **JWT_SECRET**: Genera uno seguro con:
   ```bash
   openssl rand -base64 32
   ```

3. **MercadoPago**: Usa credenciales de SANDBOX para testing, PRODUCTION para producción

4. **Email**: Es opcional, pero recomendado para notificaciones

5. **Redeploy**: Después de agregar variables, haz redeploy del proyecto

---

## **🔍 VERIFICACIÓN**

Después de configurar, verifica que todo funcione:
1. Ve a `https://tu-app.vercel.app/api/env-check`
2. Debe mostrar que todas las variables están configuradas
3. Prueba el registro de usuarios
4. Prueba la publicación de propiedades

---

## **🆘 SOLUCIÓN DE PROBLEMAS**

### **Error: "Missing environment variable"**
- Verifica que la variable esté agregada en Vercel
- Haz redeploy después de agregar variables

### **Error de Supabase**
- Verifica que las URLs y keys sean correctas
- Asegúrate de que el proyecto de Supabase esté activo

### **Error de MercadoPago**
- Verifica que uses las credenciales correctas (sandbox vs production)
- Configura el webhook URL en MercadoPago

---

**¡Con estas variables configuradas, tu proyecto debería funcionar perfectamente en Vercel!** 🚀
