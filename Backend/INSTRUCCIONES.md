# 🚀 Instrucciones para Ejecutar Misiones Arrienda

## ⚠️ IMPORTANTE: Ubicación Correcta
Debes ejecutar todos los comandos desde la carpeta **Backend**, NO desde la carpeta padre.

## Pasos para Ejecutar:

### 1. Navegar a la carpeta correcta:
```bash
cd "C:\Users\Usuario\Desktop\Misiones-Arrienda\Backend"
```

### 2. Verificar que estás en la carpeta correcta:
```bash
dir package.json
```
Deberías ver el archivo package.json listado.

### 3. Instalar dependencias (si no están instaladas):
```bash
npm install
```

### 4. Ejecutar el servidor de desarrollo:
```bash
npm run dev
```

### 5. Abrir en el navegador:
```
http://localhost:3000
```

## 🔧 Comandos Adicionales (desde la carpeta Backend):

### Configurar base de datos:
```bash
npm run db:generate
npm run db:push
npm run db:seed
```

### Verificar build:
```bash
npm run build
```

## ❌ Error Común:
Si ves el error "Missing script: dev", significa que estás ejecutando el comando desde la carpeta incorrecta.

**Solución**: Asegúrate de estar en la carpeta Backend antes de ejecutar cualquier comando npm.

## 📁 Estructura del Proyecto:
```
Misiones-Arrienda/
└── Backend/          ← AQUÍ debes ejecutar los comandos
    ├── package.json   ← Este archivo debe existir
    ├── src/
    ├── prisma/
    └── ...
```

## ✅ Verificación:
Cuando ejecutes `npm run dev` correctamente, deberías ver:
```
> misiones-arrienda@1.0.0 dev
> next dev -p 3000

▲ Next.js 14.0.4
- Local:        http://localhost:3000
