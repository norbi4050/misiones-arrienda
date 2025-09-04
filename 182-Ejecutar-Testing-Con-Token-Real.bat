@echo off
echo ========================================
echo 🚀 EJECUTANDO TESTING CON TOKEN REAL
echo ========================================
echo Fecha: %date% %time%
echo ========================================

echo.
echo 📋 Verificando prerequisitos...
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js no está instalado
    pause
    exit /b 1
)

echo ✅ Node.js detectado
echo.

echo 🧪 Ejecutando testing exhaustivo con credenciales reales...
echo.

node "181-Testing-Exhaustivo-Con-Token-Real-Final.js"

echo.
echo ========================================
echo 🎯 TESTING COMPLETADO
echo ========================================
echo.
echo 📄 Revisa el reporte generado para ver los resultados detallados
echo.
pause
