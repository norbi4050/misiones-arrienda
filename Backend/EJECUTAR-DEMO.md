# 🚀 CÓMO EJECUTAR LA DEMO DEL MODELO DE NEGOCIO

## ⚠️ **SI EL SERVIDOR NO INICIA (ERROR localhost:3000)**

### **SOLUCIÓN PASO A PASO:**

1. **Abrir terminal/cmd en la carpeta Backend**
2. **Ejecutar diagnóstico completo:**
   ```
   diagnostico-completo.bat
   ```
   Este script verificará y solucionará automáticamente:
   - ✅ Node.js instalado
   - ✅ Dependencias instaladas (npm install)
   - ✅ Base de datos creada
   - ✅ Archivos necesarios presentes

3. **Si el diagnóstico falla, ejecutar manualmente:**
   ```
   npm install
   npx prisma db push --force-reset
   npx tsx prisma/seed-sqlite.ts
   npm run dev
   ```

## 📋 **INSTRUCCIONES NORMALES**

### **OPCIÓN 1: Diagnóstico + Demo (Recomendado)**
1. Abrir terminal en la carpeta `Backend`
2. Ejecutar: `diagnostico-completo.bat`
3. El script verificará todo y abrirá el navegador automáticamente

### **OPCIÓN 2: Demo Directo**
1. Abrir terminal en la carpeta `Backend`
2. Ejecutar: `demo-modelo-negocio.bat`
3. Si falla, usar Opción 1

### **OPCIÓN 3: Manual**
1. Abrir terminal en la carpeta `Backend`
2. Ejecutar: `npm run dev`
3. Abrir navegador en: `http://localhost:3000`

## 🎯 **QUÉ PROBAR EN LA DEMO**

### **1. PÁGINA PRINCIPAL**
- ✅ Ver propiedades con badges "Destacado" rojos
- ✅ Probar filtros (tipo, precio, ubicación)
- ✅ Ver estadísticas profesionales (500+ propiedades, 1000+ clientes)

### **2. PÁGINA /PUBLICAR (CRÍTICA PARA EL NEGOCIO)**
- ✅ Hacer clic en "Publicar" en el navbar
- ✅ Llenar formulario del Paso 1 (información de propiedad)
- ✅ Ver planes en Paso 2: $0, $5.000/mes, $10.000/mes
- ✅ Seleccionar Plan Destacado ($5.000/mes)
- ✅ Ver confirmación y proceso de pago con MercadoPago

### **3. OTRAS PÁGINAS**
- ✅ Login/Register para propietarios
- ✅ Filtros avanzados funcionando
- ✅ Navegación responsive

## 💰 **MODELO DE NEGOCIO DEMOSTRADO**

- **Plan Básico**: $0 - Publicación básica (sin badge)
- **Plan Destacado**: $5.000/mes - Badge rojo "Destacado" + más visibilidad
- **Plan Full**: $10.000/mes - Premium completo + video + agente

## 🛑 **PARA DETENER EL SERVIDOR**
- Presionar `Ctrl+C` en la terminal
- Cerrar la ventana del navegador

## ❓ **SOLUCIÓN DE PROBLEMAS COMUNES**

### **Error: "localhost:3000 no encontrado"**
1. Ejecutar `diagnostico-completo.bat`
2. Verificar que aparezca "Local: http://localhost:3000" en la terminal
3. Esperar a que aparezca "Ready in X seconds"

### **Error: "npm no reconocido"**
1. Instalar Node.js desde: https://nodejs.org/
2. Reiniciar terminal
3. Ejecutar `diagnostico-completo.bat`

### **Error: "prisma no encontrado"**
1. Ejecutar: `npm install`
2. Ejecutar: `npx prisma generate`
3. Ejecutar: `diagnostico-completo.bat`

## 🎯 **CONFIRMACIÓN DE QUE FUNCIONA**

Cuando el servidor esté corriendo correctamente verás:
```
- Local:        http://localhost:3000
- Network:      http://192.168.x.x:3000

✓ Ready in 2.3s
```

=======
Y en el navegador verás:
- ✅ Logo "Misiones Arrienda"
- ✅ Hero section azul con buscador
- ✅ Grid de 6 propiedades
- ✅ 3 propiedades con badge rojo "Destacado"
=======
