# 🚀 INSTRUCCIONES CORRECTAS - MISIONES ARRIENDA

## ❌ **PROBLEMA IDENTIFICADO**

Estás ejecutando los comandos desde `C:\Users\Usuario\` en lugar de la carpeta `Backend`.

## ✅ **SOLUCIÓN PASO A PASO**

### **MÉTODO 1: Script Automático (Más Fácil)**

1. **Navegar a la carpeta Backend:**
   - Abrir explorador de archivos
   - Ir a: `C:\Users\Usuario\Desktop\Misiones-Arrienda\Backend`
   
2. **Ejecutar el script:**
   - Hacer doble clic en: `SOLUCION-FINAL.bat`
   - Este script verificará que estés en la carpeta correcta

### **MÉTODO 2: Comandos Manuales**

1. **Abrir CMD en la carpeta correcta:**
   - Abrir explorador de archivos
   - Navegar a: `C:\Users\Usuario\Desktop\Misiones-Arrienda\Backend`
   - En la barra de direcciones escribir: `cmd` y presionar Enter
   - O hacer Shift + Click derecho → "Abrir ventana de comandos aquí"

2. **Verificar que estás en la carpeta correcta:**
   ```
   dir
   ```
   Deberías ver archivos como: `package.json`, `next.config.js`, carpeta `src`, etc.

3. **Ejecutar comandos uno por uno:**
   ```
   npm install
   ```
   (Esperar a que termine)
   
   ```
   npx prisma generate
   ```
   (Esperar a que termine)
   
   ```
   npx prisma db push
   ```
   (Esperar a que termine)
   
   ```
   npx tsx prisma/seed-sqlite.ts
   ```
   (Si falla, no importa, continúa)
   
   ```
   npm run dev
   ```
   (Mantener abierto)

4. **Abrir navegador en:** http://localhost:3000

### **MÉTODO 3: VSCode (Recomendado para desarrolladores)**

1. **Abrir VSCode:**
   - Abrir VSCode
   - File → Open Folder
   - Seleccionar: `C:\Users\Usuario\Desktop\Misiones-Arrienda\Backend`

2. **Abrir terminal integrado:**
   - Presionar: `Ctrl + `` (backtick)
   - O ir a: Terminal → New Terminal

3. **Ejecutar comandos del Método 2**

## 🎯 **CONFIRMACIÓN DE QUE FUNCIONA**

### **En la Terminal verás:**
```
▲ Next.js 14.x.x
- Local:        http://localhost:3000
- Network:      http://192.168.x.x:3000

✓ Ready in 2.3s
```

### **En el Navegador (http://localhost:3000) verás:**
- ✅ Logo "Misiones Arrienda"
- ✅ Hero section azul con buscador
- ✅ Grid de 6 propiedades (o propiedades de ejemplo)
- ✅ Algunas propiedades con badge rojo "Destacado"
- ✅ Navbar con enlace "Publicar"

## 🔧 **SI AÚN HAY PROBLEMAS**

### **Error: "Cannot find module"**
- Asegúrate de estar en la carpeta `Backend`
- Ejecutar: `npm install` primero

### **Error: "Missing script: dev"**
- Estás en la carpeta incorrecta
- Navegar a la carpeta `Backend` donde está el `package.json`

### **Error: "Can't reach database server"**
- Ignorar este error, usamos SQLite local
- Continuar con `npm run dev`

### **Error: "prisma/seed-sqlite.ts not found"**
- Ejecutar desde la carpeta `Backend`
- Si persiste, saltar este paso y continuar con `npm run dev`

## 💰 **QUÉ PROBAR UNA VEZ QUE FUNCIONE**

1. **Página Principal**: Ver propiedades destacadas
2. **Click en "Publicar"**: Ver proceso de 3 pasos
3. **Seleccionar Plan Destacado**: $5.000/mes
4. **Ver confirmación de pago**: MercadoPago
5. **Probar filtros**: Tipo, precio, ubicación

## 📞 **RESUMEN**

**EL PROBLEMA ERA:** Ejecutar comandos desde `C:\Users\Usuario\` 
**LA SOLUCIÓN ES:** Ejecutar desde `C:\Users\Usuario\Desktop\Misiones-Arrienda\Backend`

**ARCHIVO RECOMENDADO:** `SOLUCION-FINAL.bat` (hace todo automáticamente)
