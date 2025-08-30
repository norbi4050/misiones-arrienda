@echo off
echo 🚀 INICIANDO TESTING EN VIVO - MISIONES ARRIENDA
echo ================================================

cd Backend

echo 📦 Instalando dependencias...
call npm install

echo 🔧 Verificando configuración...
if exist ".env.local" (
    echo ✅ Archivo .env.local presente
) else (
    echo ❌ Archivo .env.local faltante
    pause
    exit /b 1
)

echo.
echo 🚀 Iniciando servidor de desarrollo...
echo 📍 URL: http://localhost:3000
echo 📍 Formulario: http://localhost:3000/publicar
echo.
echo ⚠️  IMPORTANTE: Mantener esta ventana abierta
echo ⚠️  Para detener el servidor: Ctrl+C
echo.

call npm run dev

pause
