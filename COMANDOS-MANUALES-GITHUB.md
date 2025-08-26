# 📋 COMANDOS MANUALES PARA SUBIR A GITHUB

## 🚨 IMPORTANTE: PRIMERO CREAR EL REPOSITORIO

**Antes de ejecutar los comandos, debes crear el repositorio en GitHub:**

1. Ve a: https://github.com
2. Haz clic en "New repository" (botón verde)
3. Nombre del repositorio: `misiones-arrienda`
4. Descripción: `Plataforma web para alquiler de propiedades en Misiones, Argentina`
5. Público ✅
6. **NO marcar** "Add a README file"
7. **NO marcar** "Add .gitignore"
8. Haz clic en "Create repository"

## 💻 COMANDOS PARA EJECUTAR EN LA TERMINAL

**Copia y pega estos comandos UNO POR UNO en tu terminal:**

### 1. Navegar al directorio del proyecto
```bash
cd "C:\Users\Usuario\Desktop\Misiones-Arrienda\Backend"
```

### 2. Verificar el estado de Git
```bash
git status
```

### 3. Agregar todos los archivos (incluyendo eliminaciones)
```bash
git add -A
```

### 4. Hacer commit con los cambios
```bash
git commit -m "Clean project: Remove documentation files and prepare for GitHub"
```

### 5. Verificar si ya existe un remote
```bash
git remote -v
```

### 6. Si NO hay remote, agregar el remote de GitHub
```bash
git remote add origin https://github.com/norbi4050/misiones-arrienda.git
```

### 7. Si YA existe el remote, actualizarlo
```bash
git remote set-url origin https://github.com/norbi4050/misiones-arrienda.git
```

### 8. Subir el código a GitHub
```bash
git push -u origin main
```

## 🔧 SI HAY PROBLEMAS

### Si el branch se llama 'master' en lugar de 'main':
```bash
git branch -M main
git push -u origin main
```

### Si hay problemas de autenticación:
```bash
# Usar token personal en lugar de contraseña
# Ve a GitHub > Settings > Developer settings > Personal access tokens
# Crea un nuevo token con permisos de 'repo'
```

### Si hay conflictos con el remote:
```bash
git remote remove origin
git remote add origin https://github.com/norbi4050/misiones-arrienda.git
git push -u origin main
```

### Si necesitas forzar el push (CUIDADO):
```bash
git push -f origin main
```

## ✅ VERIFICAR QUE FUNCIONÓ

1. Ve a: https://github.com/norbi4050/misiones-arrienda
2. Deberías ver todos los archivos del proyecto
3. El README.md debería mostrarse en la página principal

## 📁 ARCHIVOS QUE DEBERÍAN APARECER

- ✅ `package.json`
- ✅ `README.md`
- ✅ `src/` (carpeta con toda la aplicación)
- ✅ `prisma/` (carpeta con la base de datos)
- ✅ `public/` (carpeta con imágenes)
- ✅ `tailwind.config.ts`
- ✅ `next.config.js`
- ✅ `vercel.json`

## 🎯 PRÓXIMO PASO: DESPLEGAR EN VERCEL

Una vez que esté en GitHub:

1. Ve a: https://vercel.com
2. Conecta tu cuenta de GitHub
3. Importa el repositorio `misiones-arrienda`
4. Configura las variables de entorno
5. ¡Deploy!

---

**NOTA:** Si tienes problemas con algún comando, cópialo exactamente como está escrito y ejecútalo en la terminal de Windows (cmd o PowerShell).
