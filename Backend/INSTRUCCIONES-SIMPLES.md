# 🚀 INSTRUCCIONES SIMPLES - MISIONES ARRIENDA

## ⚠️ **SI LOS SCRIPTS SE CIERRAN AUTOMÁTICAMENTE**

### **OPCIÓN 1: Script Paso a Paso (Recomendado)**
1. Hacer doble clic en: `ejecutar-paso-a-paso.bat`
2. Este script te mostrará cada paso y mantendrá la ventana abierta
3. Seguir las instrucciones en pantalla

### **OPCIÓN 2: Comandos Manuales**
1. **Abrir CMD/Terminal** en la carpeta Backend
2. **Ejecutar uno por uno:**
   ```
   npm install
   ```
   (Esperar a que termine)
   
   ```
   npx prisma db push --force-reset
   ```
   (Esperar a que termine)
   
   ```
   npx tsx prisma/seed-sqlite.ts
   ```
   (Esperar a que termine)
   
   ```
   npm run dev
   ```
   (Mantener abierto - NO cerrar)

3. **Abrir navegador** en: http://localhost:3000

### **OPCIÓN 3: Usar VSCode Terminal**
1. Abrir VSCode en la carpeta Backend
2. Abrir terminal (Ctrl + `)
3. Ejecutar los comandos de la Opción 2

## 🎯 **QUÉ DEBERÍAS VER**

### **En la Terminal:**
```
- Local:        http://localhost:3000
- Network:      http://192.168.x.x:3000

✓ Ready in 2.3s
```

### **En el Navegador (http://localhost:3000):**
- ✅ Logo "Misiones Arrienda"
- ✅ Hero section azul con buscador
- ✅ Grid de 6 propiedades
- ✅ 3 propiedades con badge rojo "Destacado"
- ✅ Navbar con enlace "Publicar"

## 🔧 **SOLUCIÓN DE PROBLEMAS**

### **Error: "npm no reconocido"**
- Instalar Node.js desde: https://nodejs.org/
- Reiniciar computadora
- Intentar de nuevo

### **Error: "prisma no encontrado"**
- Ejecutar primero: `npm install`
- Luego continuar con los otros comandos

### **Error: "puerto 3000 ocupado"**
- Cerrar otras aplicaciones que usen puerto 3000
- O cambiar puerto en package.json

## 💰 **MODELO DE NEGOCIO A PROBAR**

Una vez que funcione, probar:

1. **Página Principal**: Ver propiedades destacadas
2. **Hacer clic en "Publicar"**: Ver proceso de 3 pasos
3. **Seleccionar Plan Destacado**: $5.000/mes
4. **Ver confirmación de pago**: MercadoPago
5. **Probar filtros**: Tipo, precio, ubicación

## 📞 **SI NADA FUNCIONA**

Enviar captura de pantalla del error que aparece en la terminal para poder ayudarte mejor.
