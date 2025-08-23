# 🔧 SOLUCIÓN: "La ventana se abre y se cierra inmediatamente"

## 🚨 PROBLEMA IDENTIFICADO:
Cuando haces doble clic en el archivo .bat, la ventana se abre pero se cierra inmediatamente sin mostrar errores.

## ✅ SOLUCIONES PASO A PASO:

### 🔥 **SOLUCIÓN 1: Usar el script con pausa**

1. **Ve a la carpeta Backend**
   - `C:\Users\Usuario\Desktop\Misiones-Arrienda\Backend`

2. **Busca el archivo:** `ejecutar-con-pausa.bat`

3. **Haz doble clic en él**
   - Esta versión NO se cerrará automáticamente
   - Te mostrará exactamente qué está pasando
   - Esperará a que presiones una tecla

4. **Lee los mensajes**
   - Si hay un error, te dirá exactamente cuál es
   - Si todo está bien, iniciará el servidor

---

### 🔥 **SOLUCIÓN 2: Usar PowerShell (Más estable)**

1. **Haz clic derecho en la carpeta Backend**

2. **Selecciona "Abrir en Terminal" o "Abrir PowerShell aquí"**

3. **Ejecuta el comando:**
   ```powershell
   .\ejecutar-proyecto.ps1
   ```

4. **Si te dice "execution policy":**
   ```powershell
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
   .\ejecutar-proyecto.ps1
   ```

---

### 🔥 **SOLUCIÓN 3: Método manual paso a paso**

1. **Abre Terminal/CMD:**
   - Presiona `Windows + R`
   - Escribe `cmd` y presiona Enter

2. **Navega a la carpeta:**
   ```cmd
   cd "C:\Users\Usuario\Desktop\Misiones-Arrienda\Backend"
   ```

3. **Verifica que estás en el lugar correcto:**
   ```cmd
   dir package.json
   ```
   - Deberías ver el archivo listado

4. **Ejecuta comando por comando:**
   ```cmd
   node --version
   ```
   - Si da error, necesitas instalar Node.js

   ```cmd
   npm --version
   ```
   - Si da error, reinstala Node.js

   ```cmd
   npm install
   ```
   - Instala las dependencias

   ```cmd
   npm run db:generate
   npm run db:push
   npm run db:seed
   ```
   - Configura la base de datos

   ```cmd
   npm run dev
   ```
   - Inicia el servidor

---

## 🔍 **DIAGNÓSTICO: ¿Por qué se cierra la ventana?**

### **Causa más común: Node.js no instalado**
- **Síntoma**: La ventana se cierra inmediatamente
- **Solución**: Instalar Node.js desde https://nodejs.org

### **Causa 2: Carpeta incorrecta**
- **Síntoma**: Error "Missing script: dev"
- **Solución**: Asegurarse de estar en la carpeta Backend

### **Causa 3: Permisos insuficientes**
- **Síntoma**: Errores de acceso denegado
- **Solución**: Ejecutar como administrador

### **Causa 4: Antivirus bloqueando**
- **Síntoma**: Proceso se detiene sin explicación
- **Solución**: Agregar carpeta a excepciones del antivirus

---

## 🛠️ **VERIFICACIÓN PREVIA:**

### **1. ¿Tienes Node.js instalado?**
```cmd
node --version
```
- Debería mostrar algo como: `v18.17.0` o superior
- Si no, ve a: https://nodejs.org y descarga la versión LTS

### **2. ¿Estás en la carpeta correcta?**
- La ruta debe ser: `C:\Users\Usuario\Desktop\Misiones-Arrienda\Backend`
- Debe contener el archivo `package.json`

### **3. ¿Tienes permisos de administrador?**
- Haz clic derecho en el archivo .bat
- Selecciona "Ejecutar como administrador"

---

## 📋 **CHECKLIST DE SOLUCIÓN:**

- [ ] **Instalar Node.js** (si no está instalado)
- [ ] **Verificar ubicación** (carpeta Backend)
- [ ] **Usar `ejecutar-con-pausa.bat`** (para ver errores)
- [ ] **Ejecutar como administrador** (si hay problemas de permisos)
- [ ] **Desactivar antivirus temporalmente** (si bloquea)
- [ ] **Usar PowerShell** (método alternativo)
- [ ] **Método manual** (comando por comando)

---

## 🎯 **PRÓXIMOS PASOS:**

1. **Prueba primero:** `ejecutar-con-pausa.bat`
2. **Si falla:** Usa el método PowerShell
3. **Si sigue fallando:** Método manual paso a paso
4. **Una vez funcionando:** Deberías ver el servidor iniciarse
5. **Abre navegador:** http://localhost:3000

---

## 🆘 **SI NADA FUNCIONA:**

### **Opción 1: Reinstalar Node.js**
1. Desinstala Node.js desde Panel de Control
2. Descarga la versión más reciente de https://nodejs.org
3. Instala como administrador
4. Reinicia tu computadora
5. Intenta de nuevo

### **Opción 2: Usar método alternativo**
1. Instala Visual Studio Code
2. Abre la carpeta Backend en VS Code
3. Abre terminal integrado (Ctrl + `)
4. Ejecuta los comandos manualmente

---

## ✅ **CUANDO FUNCIONE CORRECTAMENTE VERÁS:**

```
✅ Node.js encontrado
✅ npm encontrado  
✅ package.json encontrado
✅ Dependencias instaladas
✅ Base de datos configurada

========================================
    INICIANDO SERVIDOR
========================================

▲ Next.js 14.0.4
- Local:        http://localhost:3000
- ready started server on 0.0.0.0:3000
```

**¡Entonces podrás abrir http://localhost:3000 en tu navegador!**
