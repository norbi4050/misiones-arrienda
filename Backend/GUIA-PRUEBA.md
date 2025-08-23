# 🚀 GUÍA PARA PROBAR MISIONES ARRIENDA

## 📋 PASOS PARA PROBAR EL PROYECTO:

### 🔥 **MÉTODO MÁS FÁCIL - SCRIPT AUTOMÁTICO:**

1. **Abre el Explorador de Archivos**
   - Ve a: `C:\Users\Usuario\Desktop\Misiones-Arrienda\Backend`

2. **Ejecuta el Script Automático**
   - Busca el archivo: `iniciar-servidor.bat`
   - Haz **doble clic** en él
   - Se abrirá una ventana de terminal

3. **Espera a que aparezca:**
   ```
   ▲ Next.js 14.0.4
   - Local:        http://localhost:3000
   - ready started server on 0.0.0.0:3000
   ```

4. **Abre tu navegador**
   - El navegador debería abrirse automáticamente
   - Si no, ve manualmente a: **http://localhost:3000**

---

### 🛠️ **MÉTODO MANUAL - SI EL AUTOMÁTICO NO FUNCIONA:**

1. **Abre Terminal/CMD:**
   - Presiona `Windows + R`
   - Escribe `cmd` y presiona Enter

2. **Navega a la carpeta:**
   ```bash
   cd "C:\Users\Usuario\Desktop\Misiones-Arrienda\Backend"
   ```

3. **Ejecuta los comandos uno por uno:**
   ```bash
   npm install
   npm run db:generate
   npm run db:push
   npm run db:seed
   npm run dev
   ```

4. **Cuando veas el mensaje de éxito, abre:**
   - http://localhost:3000

---

## ✅ **QUÉ DEBERÍAS VER AL FUNCIONAR:**

### **1. En la Terminal:**
```
✓ Ready in 2.3s
▲ Next.js 14.0.4
- Local:        http://localhost:3000
- ready started server on 0.0.0.0:3000
```

### **2. En el Navegador:**
- **Título**: "Encuentra tu propiedad ideal en Misiones"
- **Estadísticas**: "500+ Propiedades disponibles"
- **Lista de propiedades** con imágenes y precios
- **Filtros** funcionando (tipo, precio, ubicación)

### **3. Propiedades que deberías ver:**
- 🏠 Casa en Eldorado - $320,000
- 🏢 Departamento en Posadas - $180,000
- 🏠 Casa familiar en Posadas - $250,000
- 🏢 Departamento moderno - $150,000
- Y más propiedades...

---

## 🔧 **SI ALGO NO FUNCIONA:**

### **Error: "Missing script: dev"**
- **Causa**: Estás en la carpeta incorrecta
- **Solución**: Asegúrate de estar en la carpeta `Backend`

### **Error: "Port 3000 is already in use"**
- **Causa**: Otro proceso está usando el puerto
- **Solución**: 
  1. Cierra todas las ventanas de terminal
  2. Reinicia tu computadora
  3. Intenta de nuevo

### **Error: "Cannot find module"**
- **Causa**: Dependencias no instaladas
- **Solución**: Ejecuta `npm install`

### **La página no carga**
- **Solución**: Espera 30 segundos después de ver "ready started server"
- **O**: Refresca la página (F5)

---

## 🎯 **FUNCIONALIDADES PARA PROBAR:**

### **1. Navegación:**
- ✅ Scroll por la página principal
- ✅ Ver las estadísticas del sitio
- ✅ Lista de propiedades cargando

### **2. Filtros:**
- ✅ Filtrar por tipo (Casa, Departamento)
- ✅ Filtrar por precio (mínimo/máximo)
- ✅ Filtrar por ubicación (Posadas, Eldorado)

### **3. Propiedades:**
- ✅ Ver detalles de cada propiedad
- ✅ Imágenes cargando correctamente
- ✅ Precios y características visibles

### **4. Responsive:**
- ✅ Cambiar tamaño de ventana del navegador
- ✅ Ver cómo se adapta el diseño

---

## 📱 **PRUEBA ESTOS ESCENARIOS:**

1. **Filtro por Departamentos:**
   - Selecciona "Departamento" en el filtro de tipo
   - Deberías ver solo departamentos

2. **Filtro por Precio:**
   - Pon precio mínimo: 100000
   - Precio máximo: 200000
   - Deberías ver propiedades en ese rango

3. **Filtro por Ubicación:**
   - Selecciona "Posadas"
   - Deberías ver solo propiedades de Posadas

4. **Combinación de Filtros:**
   - Tipo: Casa
   - Ubicación: Eldorado
   - Deberías ver casas en Eldorado

---

## 🆘 **SI NECESITAS AYUDA:**

1. **Ejecuta el diagnóstico:**
   - Doble clic en `test-completo.bat`
   - Te dirá exactamente qué está fallando

2. **Revisa los archivos de ayuda:**
   - `COMO-EJECUTAR.md` - Instrucciones detalladas
   - `REPORTE-TESTING.md` - Información técnica completa

3. **Verifica que tienes:**
   - Node.js instalado (versión 18+)
   - Conexión a internet para descargar dependencias

---

## 🎉 **¡DISFRUTA PROBANDO TU PLATAFORMA INMOBILIARIA!**

Una vez que funcione, tendrás una aplicación web completa con:
- 📊 Dashboard inmobiliario
- 🏠 Catálogo de propiedades
- 🔍 Sistema de filtros avanzado
- 📱 Diseño responsive
- 💾 Base de datos con propiedades reales de Misiones

**¡El proyecto está listo para usar y expandir!**
