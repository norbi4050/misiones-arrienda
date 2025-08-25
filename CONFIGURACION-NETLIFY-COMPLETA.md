# 🚀 CONFIGURACIÓN COMPLETA NETLIFY - MISIONES ARRIENDA

## 📋 **DATOS EXACTOS PARA NETLIFY**

### **1. CONFIGURACIÓN DE BUILD:**

```
Base directory: Backend
Build command: npm run build
Publish directory: Backend/.next
```

### **2. VARIABLES DE ENTORNO:**

```
DATABASE_URL = file:./dev.db
NEXT_TELEMETRY_DISABLED = 1
NODE_VERSION = 18
```

### **3. CONFIGURACIÓN AVANZADA (Opcional):**

```
Functions directory: Backend/.netlify/functions
Package directory: Backend
```

## 🔧 **PASOS PARA CREAR NUEVO PROYECTO EN NETLIFY:**

### **PASO 1: Acceder a Netlify**
1. Ve a: **https://app.netlify.com**
2. Hacer clic en **"Add new site"**
3. Seleccionar **"Import an existing project"**

### **PASO 2: Conectar con GitHub**
1. Seleccionar **"GitHub"**
2. Autorizar acceso si es necesario
3. Buscar repositorio: **"Misiones-Arrienda"**
4. Hacer clic en el repositorio

### **PASO 3: Configurar Build Settings**
```
Repository: norbi4050/Misiones-Arrienda
Branch to deploy: main
Base directory: Backend
Build command: npm run build
Publish directory: Backend/.next
```

### **PASO 4: Variables de Entorno**
Antes de hacer deploy, agregar estas variables:

```
DATABASE_URL = file:./dev.db
NEXT_TELEMETRY_DISABLED = 1
NODE_VERSION = 18
```

### **PASO 5: Deploy**
- Hacer clic en **"Deploy site"**
- Esperar 5-10 minutos
- ✅ **Debería funcionar sin errores** (carpeta supabase eliminada)

## 🎯 **QUÉ ESPERAR AHORA:**

### **Build exitoso:**
```
✓ Installing dependencies
✓ Running build command
✓ Compiled successfully
✓ Creating optimized production build
✓ Build completed successfully
✓ Site deployed
```

### **URL del sitio:**
- Netlify te dará una URL como: `https://amazing-name-123456.netlify.app`
- Puedes cambiar el nombre en Site settings

## 🔍 **SI ALGO FALLA:**

### **Error de build:**
- Revisar logs en Netlify → Deploys → Ver log completo
- Verificar que las variables de entorno estén configuradas

### **Error 404:**
- Verificar que `Publish directory` sea exactamente: `Backend/.next`
- Verificar que `Base directory` sea exactamente: `Backend`

### **Error de dependencias:**
- Verificar que `NODE_VERSION = 18` esté configurado
- Revisar que `package.json` esté en la carpeta Backend

## 💡 **CONFIGURACIÓN ALTERNATIVA (Si falla):**

### **Opción 2 - Sin Base Directory:**
```
Base directory: (vacío)
Build command: cd Backend && npm install && npm run build
Publish directory: Backend/.next
```

### **Opción 3 - Build personalizado:**
```
Base directory: Backend
Build command: npm ci && npm run build
Publish directory: .next
```

## 🏆 **RESULTADO ESPERADO:**

Una vez configurado correctamente:
- ✅ **Portal inmobiliario funcionando** públicamente
- ✅ **6 propiedades mostradas** en la página principal
- ✅ **3 propiedades destacadas** con badge rojo
- ✅ **Proceso de publicación** operativo
- ✅ **Sistema de planes** funcionando
- ✅ **Sin errores de Deno** (problema resuelto)

## 📞 **DATOS DE RESPALDO:**

### **Información del proyecto:**
- **Nombre**: Misiones Arrienda
- **Descripción**: Portal inmobiliario especializado en Misiones
- **Tecnología**: Next.js 14 + TypeScript + Prisma
- **Usuario GitHub**: norbi4050
- **Repositorio**: Misiones-Arrienda

¡Con esta configuración tu portal debería deployar exitosamente!
