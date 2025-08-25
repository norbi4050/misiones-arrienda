# 🚀 COMANDOS PARA SUBIR A GITHUB

## 📋 **PASOS PARA CREAR REPOSITORIO EN GITHUB**

### **Opción 1: Crear repositorio desde GitHub Web (RECOMENDADO)**

1. **Ir a GitHub**: https://github.com
2. **Hacer clic en "New repository"** (botón verde)
3. **Configurar repositorio**:
   - **Repository name**: `Misiones-Arrienda`
   - **Description**: `Portal inmobiliario especializado en Misiones - Next.js + Prisma + MercadoPago`
   - **Visibilidad**: ✅ Public (recomendado) o Private
   - **NO marcar**: "Add a README file" (ya tenemos uno)
   - **NO marcar**: "Add .gitignore" (ya tenemos uno)
   - **NO marcar**: "Choose a license"
4. **Hacer clic en "Create repository"**

### **Opción 2: Crear repositorio desde línea de comandos**

```bash
# Instalar GitHub CLI si no está instalado
winget install GitHub.cli

# Autenticarse en GitHub
gh auth login

# Crear repositorio público
gh repo create Misiones-Arrienda --public --description "Portal inmobiliario especializado en Misiones - Next.js + Prisma + MercadoPago"

# O crear repositorio privado
gh repo create Misiones-Arrienda --private --description "Portal inmobiliario especializado en Misiones - Next.js + Prisma + MercadoPago"
```

## 🔗 **COMANDOS PARA CONECTAR Y SUBIR**

### **Una vez creado el repositorio en GitHub, ejecutar estos comandos:**

```bash
# 1. Agregar remote origin (REEMPLAZAR 'tu-usuario' con tu usuario de GitHub)
git remote add origin https://github.com/tu-usuario/Misiones-Arrienda.git

# 2. Verificar que el remote se agregó correctamente
git remote -v

# 3. Subir el código a GitHub
git push -u origin main

# Si da error porque la rama se llama 'master', usar:
git branch -M main
git push -u origin main
```

## ✅ **VERIFICACIÓN FINAL**

Después de ejecutar los comandos, deberías poder:

1. **Ver tu repositorio en**: `https://github.com/tu-usuario/Misiones-Arrienda`
2. **Ver todos los archivos** subidos correctamente
3. **Ver el README.md** renderizado con toda la información del proyecto
4. **Ver el historial de commits** con el commit inicial

## 🎯 **PRÓXIMOS PASOS OPCIONALES**

### **Configurar GitHub Pages (si quieres mostrar el proyecto)**
```bash
# En la configuración del repositorio en GitHub:
# Settings > Pages > Source: Deploy from a branch > main > /docs
```

### **Agregar colaboradores**
```bash
# En GitHub: Settings > Manage access > Invite a collaborator
```

### **Configurar protección de rama**
```bash
# En GitHub: Settings > Branches > Add rule > main
```

## 🚨 **IMPORTANTE**

- **Reemplaza `tu-usuario`** con tu nombre de usuario real de GitHub
- **Asegúrate de estar autenticado** en GitHub antes de hacer push
- **Si es tu primer repositorio**, GitHub te pedirá configurar tu email y nombre:

```bash
git config --global user.name "Tu Nombre"
git config --global user.email "tu-email@ejemplo.com"
```

## 📞 **¿NECESITAS AYUDA?**

Si encuentras algún error, estos son los comandos de diagnóstico:

```bash
# Ver estado de git
git status

# Ver configuración de remote
git remote -v

# Ver configuración de usuario
git config --list

# Ver historial de commits
git log --oneline
```

---

**¡Una vez completados estos pasos, tu proyecto estará disponible públicamente en GitHub!** 🎉
