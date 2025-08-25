# 🚀 INSTRUCCIONES PASO A PASO - SUBIR A GITHUB

## 🎯 **MÉTODO 1: AUTOMÁTICO (RECOMENDADO)**

### **Ejecutar el script:**
```bash
# Hacer doble clic en:
SUBIR-GITHUB-MANUAL.bat
```

---

## 🔧 **MÉTODO 2: MANUAL (SI EL SCRIPT FALLA)**

### **Paso 1: Verificar GitHub CLI**
```bash
gh auth status
```
Si no está autenticado:
```bash
gh auth login
```

### **Paso 2: Crear repositorio en GitHub**
```bash
gh repo create Misiones-Arrienda --public --description "Portal inmobiliario especializado en Misiones - Next.js + Prisma + MercadoPago"
```

### **Paso 3: Configurar remote**
```bash
git remote remove origin
git remote add origin https://github.com/TU-USUARIO/Misiones-Arrienda.git
```
*(Reemplaza TU-USUARIO con tu nombre de usuario de GitHub)*

### **Paso 4: Configurar rama principal**
```bash
git branch -M main
```

### **Paso 5: Subir código**
```bash
git push -u origin main
```

### **Paso 6: Abrir en navegador**
```bash
gh repo view --web
```

---

## 🌐 **MÉTODO 3: DESDE GITHUB.COM (ALTERNATIVO)**

### **Si los comandos no funcionan:**

1. **Ir a GitHub.com**
   - Iniciar sesión en tu cuenta
   - Hacer clic en "+" → "New repository"

2. **Crear repositorio:**
   - Nombre: `Misiones-Arrienda`
   - Descripción: `Portal inmobiliario especializado en Misiones - Next.js + Prisma + MercadoPago`
   - Público ✅
   - NO marcar README, .gitignore, license (ya los tienes)
   - Hacer clic en "Create repository"

3. **Conectar tu proyecto local:**
   ```bash
   git remote add origin https://github.com/TU-USUARIO/Misiones-Arrienda.git
   git branch -M main
   git push -u origin main
   ```

---

## ✅ **VERIFICACIÓN**

### **Después de subir, deberías ver:**
- Tu repositorio en: `https://github.com/TU-USUARIO/Misiones-Arrienda`
- README.md con badges y documentación
- Carpeta Backend/ con toda la aplicación
- Archivos de configuración (package.json, etc.)

### **Si algo falla:**
1. Verificar que estás en la carpeta correcta: `c:/Users/Usuario/Desktop/Misiones-Arrienda`
2. Verificar que git está inicializado: `git status`
3. Verificar autenticación GitHub: `gh auth status`

---

## 🎉 **¡ÉXITO!**

Una vez completado, tu proyecto estará disponible públicamente en GitHub y listo para:
- ✅ Deployment en Netlify/Vercel
- ✅ Colaboración con otros desarrolladores
- ✅ Showcase profesional
- ✅ Lanzamiento comercial

**URL del repositorio:** `https://github.com/TU-USUARIO/Misiones-Arrienda`
