# 🚀 CONFIGURAR NETLIFY Y PROBAR EL PROYECTO

## 📋 **PASOS PARA NETLIFY DEPLOYMENT**

### **PASO 1: Subir a GitHub (PRIMERO)**
```bash
# Ejecutar primero:
SOLUCION-GITHUB-DEFINITIVA.bat
```

### **PASO 2: Configurar Netlify**

#### **2.1 Crear cuenta en Netlify:**
1. Ve a: **https://netlify.com**
2. Hacer clic en **"Sign up"**
3. Elegir **"GitHub"** para conectar tu cuenta

#### **2.2 Importar proyecto desde GitHub:**
1. En Netlify Dashboard, clic en **"Add new site"**
2. Elegir **"Import an existing project"**
3. Seleccionar **"GitHub"**
4. Buscar y seleccionar: **"Misiones-Arrienda"**

#### **2.3 Configuración de Build:**
```
Base directory: Backend
Build command: npm run build
Publish directory: Backend/.next
```

#### **2.4 Variables de Entorno:**
En Netlify → Site settings → Environment variables:
```
DATABASE_URL = file:./dev.db
NEXT_TELEMETRY_DISABLED = 1
NODE_VERSION = 18
```

### **PASO 3: Deploy**
1. Hacer clic en **"Deploy site"**
2. Esperar que termine el build (5-10 minutos)
3. Netlify te dará una URL como: `https://amazing-name-123456.netlify.app`

---

## 🧪 **CÓMO PROBAR EL PROYECTO**

### **PRUEBAS LOCALES (ANTES DE NETLIFY):**

#### **1. Ejecutar localmente:**
```bash
# Hacer doble clic en:
EJECUTAR-MISIONES-ARRIENDA.bat

# O manualmente:
cd Backend
npm install
npm run dev
```

#### **2. Abrir en navegador:**
```
http://localhost:3000
```

#### **3. Probar funcionalidades:**
- ✅ **Página principal**: Ver propiedades destacadas
- ✅ **Filtros**: Probar búsqueda por tipo, precio, ubicación
- ✅ **Publicar**: Ir a `/publicar` y probar proceso de 3 pasos
- ✅ **Login/Register**: Probar autenticación
- ✅ **Detalles**: Hacer clic en una propiedad

### **PRUEBAS EN NETLIFY (DESPUÉS DEL DEPLOY):**

#### **1. Acceder a la URL de Netlify:**
```
https://tu-sitio.netlify.app
```

#### **2. Verificar que funcione:**
- ✅ **Carga inicial**: La página se carga correctamente
- ✅ **Propiedades**: Se muestran las 6 propiedades de ejemplo
- ✅ **Badges "Destacado"**: Se ven los badges rojos
- ✅ **Navegación**: Todos los enlaces funcionan
- ✅ **Responsive**: Se ve bien en móvil

#### **3. Probar funcionalidades críticas:**
- ✅ **Proceso de publicación**: `/publicar`
- ✅ **Selección de planes**: Básico, Destacado, Full
- ✅ **Formularios**: Login, registro, consultas
- ✅ **Filtros**: Búsqueda avanzada

---

## 🎯 **QUÉ ESPERAR VER**

### **En la página principal:**
- **Logo**: "Misiones Arrienda"
- **Hero section**: Azul con buscador
- **Grid de propiedades**: 6 propiedades
- **3 propiedades destacadas**: Con badge rojo "Destacado"
- **Navbar**: Con enlace "Publicar"

### **En /publicar:**
- **Paso 1**: Datos de la propiedad
- **Paso 2**: Selección de plan
- **Paso 3**: Confirmación y pago

### **Planes disponibles:**
- **Básico**: $0 (Gratis)
- **Destacado**: $5.000/mes + badge rojo
- **Full**: $10.000/mes + premium features

---

## 🔧 **SOLUCIÓN DE PROBLEMAS**

### **Si Netlify falla:**
1. **Verificar configuración**:
   - Base directory: `Backend`
   - Build command: `npm run build`
   - Publish directory: `Backend/.next`

2. **Revisar logs de build**:
   - En Netlify → Deploys → Ver logs de error

3. **Variables de entorno**:
   - Verificar que `DATABASE_URL` esté configurada

### **Si las pruebas locales fallan:**
1. **Verificar dependencias**:
   ```bash
   cd Backend
   npm install
   ```

2. **Verificar base de datos**:
   ```bash
   npx prisma generate
   npx prisma db push
   ```

3. **Verificar puerto**:
   - Asegurar que puerto 3000 esté libre

---

## 🏆 **RESULTADO FINAL**

Una vez completado, tendrás:

### **✅ Portal inmobiliario funcionando:**
- **URL pública**: En Netlify
- **Funcionalidades completas**: Publicación, filtros, pagos
- **Modelo de negocio**: Sistema de planes implementado
- **Responsive**: Funciona en móvil y desktop

### **✅ Listo para lanzamiento comercial:**
- **Especializado**: Misiones (Posadas, Eldorado)
- **Monetizable**: $450.000/mes potencial
- **Profesional**: Diseño atractivo y funcional
- **Escalable**: Arquitectura sólida

**¡Tu portal inmobiliario estará listo para generar ingresos!**
