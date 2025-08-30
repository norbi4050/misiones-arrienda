@echo off
echo ========================================
echo TESTING EXHAUSTIVO - FORMULARIO PUBLICAR
echo ========================================
echo.

echo 🔍 Verificando que Node.js este disponible...
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js no encontrado. Por favor instala Node.js primero.
    pause
    exit /b 1
)

echo ✅ Node.js encontrado
echo.

echo 📦 Instalando dependencias de testing si es necesario...
if not exist node_modules\puppeteer (
    echo Instalando Puppeteer...
    npm install puppeteer
)

echo.
echo 🚀 Iniciando testing del formulario corregido...
echo.

node test-formulario-publicar-corregido.js

echo.
echo ✅ Testing completado. Revisa los resultados arriba.
echo.
pause
