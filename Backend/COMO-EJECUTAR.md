# 🚀 CÓMO EJECUTAR MISIONES ARRIENDA

## ⚠️ PROBLEMA COMÚN: "No puedo abrir el proyecto en el navegador"

### SOLUCIÓN PASO A PASO:

## 1️⃣ VERIFICAR UBICACIÓN
Asegúrate de estar en la carpeta correcta:
```
C:\Users\Usuario\Desktop\Misiones-Arrienda\Backend
```

## 2️⃣ OPCIÓN FÁCIL - USAR EL SCRIPT AUTOMÁTICO
1. Ve a la carpeta `Backend`
2. Haz doble clic en `iniciar-servidor.bat`
3. Espera a que aparezca el mensaje "Ready - started server on 0.0.0.0:3000"
4. El navegador debería abrirse automáticamente en http://localhost:3000

## 3️⃣ OPCIÓN MANUAL - COMANDOS PASO A PASO

### Paso 1: Abrir Terminal/CMD
- Presiona `Windows + R`
- Escribe `cmd` y presiona Enter

### Paso 2: Navegar a la carpeta
```bash
cd "C:\Users\Usuario\Desktop\Misiones-Arrienda\Backend"
```

### Paso 3: Verificar que estás en la carpeta correcta
```bash
dir package.json
```
Deberías ver el archivo package.json listado.

### Paso 4: Instalar dependencias (si es necesario)
```bash
npm install
```

### Paso 5: Configurar base de datos
```bash
npm run db:generate
npm run db:push
npm run db:seed
```

### Paso 6: Iniciar el servidor
```bash
npm run dev
```

### Paso 7: Abrir en el navegador
Cuando veas el mensaje:
```
▲ Next.js 14.0.4
- Local:        http://localhost:3000
```

Abre tu navegador y ve a: **http://localhost:3000**

## 🔧 SOLUCIÓN DE PROBLEMAS

### Problema: "Missing script: dev"
**Causa**: Estás en la carpeta incorrecta
**Solución**: Asegúrate de estar en la carpeta `Backend`

### Problema: "Port 3000 is already in use"
**Causa**: Otro proceso está usando el puerto 3000
**Solución**: 
1. Cierra todas las ventanas de terminal/cmd
2. Reinicia tu computadora
3. Intenta de nuevo

### Problema: "Cannot find module"
**Causa**: Dependencias no instaladas
**Solución**: Ejecuta `npm install`

### Problema: "Database error"
**Causa**: Base de datos no configurada
**Solución**: Ejecuta los comandos de base de datos:
```bash
npm run db:generate
npm run db:push
npm run db:seed
```

## 📱 VERIFICAR QUE FUNCIONA

Cuando el proyecto esté funcionando correctamente, deberías ver:

1. **En la terminal**: Mensaje "Ready - started server on 0.0.0.0:3000"
2. **En el navegador**: La página principal de Misiones Arrienda con:
   - Título: "Encuentra tu propiedad ideal en Misiones"
   - Estadísticas: "500+ Propiedades disponibles"
   - Lista de propiedades con imágenes y precios

## 🆘 SI NADA FUNCIONA

1. Reinicia tu computadora
2. Asegúrate de tener Node.js instalado (versión 18 o superior)
3. Ejecuta el archivo `iniciar-servidor.bat` como administrador
4. Si sigue sin funcionar, contacta para ayuda adicional

## ✅ PROYECTO FUNCIONANDO CORRECTAMENTE

Cuando todo esté bien, verás:
- Servidor ejecutándose en http://localhost:3000
- Página web cargando correctamente
- Lista de propiedades mostrándose
- Filtros funcionando
- Sin errores en la consola del navegador
