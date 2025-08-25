# 📋 INSTRUCCIONES PARA CREAR REPOSITORIO EN GITHUB

## 🚨 PROBLEMA DETECTADO
El repositorio no se pudo crear automáticamente con GitHub CLI. Necesitas crearlo manualmente.

## ✅ SOLUCIÓN: CREAR REPOSITORIO MANUALMENTE

### PASO 1: Crear Repositorio en GitHub.com

1. **Ir a GitHub:** https://github.com
2. **Hacer clic en "New repository"** (botón verde)
3. **Configurar el repositorio:**
   - **Repository name:** `misiones-arrienda`
   - **Description:** `Plataforma web para alquiler de propiedades en Misiones, Argentina. Desarrollada con Next.js, TypeScript, Tailwind CSS y Prisma.`
   - **Visibility:** Public ✅
   - **NO marcar** "Add a README file"
   - **NO marcar** "Add .gitignore"
   - **NO marcar** "Choose a license"
4. **Hacer clic en "Create repository"**

### PASO 2: Subir el Código

Una vez creado el repositorio, ejecuta estos comandos en la terminal:

```bash
# Navegar al directorio Backend
cd Backend

# Verificar que el repositorio Git está inicializado
git status

# Si no está inicializado, ejecutar:
git init

# Agregar todos los archivos
git add .

# Hacer commit
git commit -m "Initial commit: Misiones Arrienda - Complete Next.js rental platform"

# Agregar el remote de GitHub (reemplaza 'norbi4050' con tu usuario)
git remote add origin https://github.com/norbi4050/misiones-arrienda.git

# Subir el código
git push -u origin main
```

### PASO 3: Verificar la Subida

1. **Ir a:** https://github.com/norbi4050/misiones-arrienda
2. **Verificar que aparezcan todos los archivos**
3. **Confirmar que el README.md se muestra correctamente**

## 🔧 COMANDOS ALTERNATIVOS (Si hay problemas)

### Si el branch se llama 'master' en lugar de 'main':
```bash
git branch -M main
git push -u origin main
```

### Si hay problemas de autenticación:
```bash
# Usar token personal en lugar de contraseña
# Ir a GitHub > Settings > Developer settings > Personal access tokens
# Crear un nuevo token con permisos de 'repo'
```

### Si el remote ya existe:
```bash
git remote remove origin
git remote add origin https://github.com/norbi4050/misiones-arrienda.git
git push -u origin main
```

## 📁 ARCHIVOS QUE DEBEN APARECER EN GITHUB

Verifica que estos archivos estén en el repositorio:

### Archivos de Configuración:
- ✅ `package.json`
- ✅ `tsconfig.json`
- ✅ `tailwind.config.ts`
- ✅ `next.config.js`
- ✅ `vercel.json`
- ✅ `.gitignore`
- ✅ `README.md`

### Carpetas Principales:
- ✅ `src/` (con app, components, lib, etc.)
- ✅ `prisma/` (con schema.prisma y seed.ts)
- ✅ `public/` (con imágenes y archivos estáticos)

## 🎯 PRÓXIMO PASO: DESPLEGAR EN VERCEL

Una vez que el repositorio esté en GitHub:

1. **Ir a:** https://vercel.com
2. **Conectar GitHub:** Import Git Repository
3. **Seleccionar:** `misiones-arrienda`
4. **Configurar variables de entorno**
5. **Deploy**

## 📞 SI NECESITAS AYUDA

Si tienes problemas con algún paso:

1. **Verificar que Git esté instalado:** `git --version`
2. **Verificar que estés en el directorio correcto:** `pwd` (debe mostrar la ruta del Backend)
3. **Verificar el estado de Git:** `git status`
4. **Ver los archivos:** `ls -la`

---

**IMPORTANTE:** Una vez que el repositorio esté creado y funcionando, podrás ver tu proyecto en:
**https://github.com/norbi4050/misiones-arrienda**

¡El proyecto está completamente listo para ser desplegado! 🚀
