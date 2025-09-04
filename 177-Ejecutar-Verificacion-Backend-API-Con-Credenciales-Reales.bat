@echo off
echo ================================================================
echo EJECUTANDO VERIFICACION COMPLETA BACKEND/API - MISIONES ARRIENDA
echo ================================================================
echo.
echo Fecha: %date% %time%
echo Script: 176-Verificacion-Backend-API-Con-Credenciales-Reales.js
echo.
echo ================================================================
echo.

REM Verificar si Node.js está instalado
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ ERROR: Node.js no está instalado o no está en el PATH
    echo.
    echo Por favor instala Node.js desde: https://nodejs.org/
    echo.
    pause
    exit /b 1
)

echo ✅ Node.js detectado correctamente
echo.

REM Ejecutar el script de verificación
echo 🚀 Iniciando verificación completa del backend/API...
echo.

node "176-Verificacion-Backend-API-Con-Credenciales-Reales.js"

REM Capturar el código de salida
set EXIT_CODE=%errorlevel%

echo.
echo ================================================================
echo VERIFICACION COMPLETADA
echo ================================================================
echo.

if %EXIT_CODE% equ 0 (
    echo ✅ RESULTADO: VERIFICACION EXITOSA
    echo 📊 El sistema está funcionando correctamente
) else (
    echo ❌ RESULTADO: PROBLEMAS DETECTADOS
    echo 🔧 Revisa el reporte generado para más detalles
)

echo.
echo 📁 Busca el archivo de reporte generado: 177-REPORTE-VERIFICACION-BACKEND-API-*.json
echo.
echo ================================================================
echo.

pause
exit /b %EXIT_CODE%
