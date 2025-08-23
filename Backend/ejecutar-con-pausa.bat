@echo off
echo ========================================
echo    MISIONES ARRIENDA - DEBUG MODE
echo ========================================
echo.

echo Navegando a la carpeta Backend...
cd /d "%~dp0"

echo Ubicacion actual: %CD%
echo.

echo Verificando Node.js...
node --version
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ❌ ERROR: Node.js no está instalado
    echo.
    echo SOLUCION:
    echo 1. Ve a https://nodejs.org
    echo 2. Descarga e instala Node.js
    echo 3. Reinicia tu computadora
    echo 4. Intenta de nuevo
    echo.
    pause
    exit /b 1
)

echo ✅ Node.js encontrado
echo.

echo Verificando npm...
npm --version
if %ERRORLEVEL% NEQ 0 (
    echo ❌ ERROR: npm no funciona correctamente
    pause
    exit /b 1
)

echo ✅ npm encontrado
echo.

echo Verificando package.json...
if not exist package.json (
    echo ❌ ERROR: package.json no encontrado
    echo Asegurate de estar en la carpeta Backend
    echo Ubicacion actual: %CD%
    pause
    exit /b 1
)

echo ✅ package.json encontrado
echo.

echo Instalando dependencias...
echo (Esto puede tomar unos minutos la primera vez)
npm install
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ❌ ERROR: Falló la instalación de dependencias
    echo.
    echo POSIBLES SOLUCIONES:
    echo 1. Verifica tu conexión a internet
    echo 2. Ejecuta como administrador
    echo 3. Elimina la carpeta node_modules y intenta de nuevo
    echo.
    pause
    exit /b 1
)

echo ✅ Dependencias instaladas
echo.

echo Configurando base de datos...
npm run db:generate
if %ERRORLEVEL% NEQ 0 (
    echo ❌ ERROR: Falló la generación de Prisma
    pause
    exit /b 1
)

npm run db:push
if %ERRORLEVEL% NEQ 0 (
    echo ❌ ERROR: Falló la creación de la base de datos
    pause
    exit /b 1
)

npm run db:seed
if %ERRORLEVEL% NEQ 0 (
    echo ❌ ERROR: Falló la población de datos
    pause
    exit /b 1
)

echo ✅ Base de datos configurada
echo.

echo ========================================
echo    INICIANDO SERVIDOR
echo ========================================
echo.
echo Si ves "Ready - started server", el proyecto está funcionando
echo Luego abre tu navegador en: http://localhost:3000
echo.
echo Para detener el servidor, presiona Ctrl+C
echo.

npm run dev

echo.
echo ========================================
echo El servidor se ha detenido
echo ========================================
echo.
pause
